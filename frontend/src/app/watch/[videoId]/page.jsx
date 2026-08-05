"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AppShell, { Loading, StatusBadge } from "@/components/AppShell";
import { apiRequest } from "@/lib/api";

export default function WatchPage() {
  const { videoId } = useParams();
  const router = useRouter();
  const videoRef = useRef();
  const lastSent = useRef(0);
  const [video, setVideo] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadVideo() {
      try {
        const [videoResponse, progressResponse] = await Promise.all([
          apiRequest(`/videos/${videoId}`),
          apiRequest(`/progress/${videoId}`),
        ]);
        if (!active) return;
        setVideo(videoResponse.data?.video);
        setProgress(progressResponse.data?.progress);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadVideo();
    return () => {
      active = false;
    };
  }, [videoId]);

  const restorePosition = () => {
    const player = videoRef.current;
    const savedPosition = Number(progress?.lastPosition || 0);
    if (player && savedPosition > 0 && savedPosition < player.duration - 5) {
      player.currentTime = savedPosition;
      lastSent.current = savedPosition;
    }
  };

  const sync = async (event) => {
    const player = event.currentTarget;
    if (Math.abs(player.currentTime - lastSent.current) < 5 && !player.ended) return;
    lastSent.current = player.currentTime;
    const response = await apiRequest(`/progress/${videoId}`, {
      method: "PUT",
      body: JSON.stringify({
        currentTime: player.currentTime,
        duration: player.duration,
        // Ended video paused hoti hai, lekin final watched segment ko backend
        // me count karna zaroori hai; warna progress 93-94% par atak sakti hai.
        isPlaying: !player.paused || player.ended,
      }),
      returnErrorResponse: true,
    });
    if (response.ok) setProgress(response.data?.progress);
  };

  const generate = async () => {
    setMessage("Generating your assessment...");
    try {
      const response = await apiRequest("/tests/generate", {
        method: "POST",
        body: JSON.stringify({ videoId }),
      });
      router.push(`/test/${response.data?.test?.id || response.data?.test?._id}`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <AppShell>
      {loading ? <Loading /> : (
        <>
          <div className="page-head">
            <div>
              <div className="eyebrow">Video lesson</div>
              <h1>{video?.title}</h1>
              <p>{video?.description}</p>
            </div>
            <StatusBadge value={video?.processingStatus} />
          </div>
          <div className="video-layout">
            <section>
              <div className="video-frame">
                <video
                  ref={videoRef}
                  controls
                  src={video?.videoUrl}
                  poster={video?.thumbnailUrl}
                  onLoadedMetadata={restorePosition}
                  onTimeUpdate={sync}
                  onPause={sync}
                  onEnded={sync}
                />
              </div>
              <div className="card" style={{ marginTop: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <strong>Lesson progress</strong>
                  <span>{Math.round(progress?.progressPercentage || 0)}%</span>
                </div>
                <div className="progress-track">
                  <span style={{ width: `${progress?.progressPercentage || 0}%` }} />
                </div>
                {message && <div className={message.includes("Generating") ? "form-success" : "form-error"} style={{ marginTop: 14 }}>{message}</div>}
                <button className="btn btn-primary" style={{ marginTop: 18 }} disabled={!progress?.completed || video?.processingStatus !== "completed"} onClick={generate}>
                  Generate AI assessment →
                </button>
                {!progress?.completed && <small style={{ display: "block", color: "var(--muted)", marginTop: 8 }}>Complete the lesson to unlock the assessment.</small>}
              </div>
            </section>
            <aside>
              <div className="card">
                <h3>Lesson summary</h3>
                <p>{video?.summary || "The AI summary will appear after processing is complete."}</p>
                <h4>Topics covered</h4>
                <div className="topics">{(video?.topics || []).map((topic) => <span className="topic" key={topic}>{topic}</span>)}</div>
              </div>
            </aside>
          </div>
        </>
      )}
    </AppShell>
  );
}
