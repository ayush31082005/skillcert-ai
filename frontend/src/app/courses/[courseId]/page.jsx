"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppShell, { Empty, Loading } from "@/components/AppShell";
import { apiRequest, formatDuration } from "@/lib/api";

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [learning, setLearning] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCourse() {
      try {
        const [courseResponse, videoResponse, progressResponse] =
          await Promise.all([
            apiRequest(`/courses/${courseId}`),
            apiRequest(`/videos/course/${courseId}`),
            apiRequest("/progress/my-learning"),
          ]);

        if (!active) return;
        setCourse(courseResponse.data?.course);
        setVideos(videoResponse.data?.videos || []);
        setLearning(progressResponse.data?.learning || []);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCourse();
    return () => {
      active = false;
    };
  }, [courseId]);

  const progressByVideo = useMemo(
    () =>
      new Map(
        learning.map((item) => [
          String(item.video?._id),
          item.progress,
        ])
      ),
    [learning]
  );

  return (
    <AppShell>
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="card course-detail-hero">
            <div className="eyebrow" style={{ color: "var(--lime)" }}>Learning path</div>
            <h1>{course?.title}</h1>
            <p>{course?.description}</p>
            <div className="topics">
              <span className="badge badge-success">{videos.length} lessons</span>
              <span className="badge badge-neutral">{course?.passingPercentage || 60}% passing score</span>
              <span className="badge badge-neutral">{course?.maximumAttempts || 2} attempts</span>
            </div>
          </div>
          <div className="page-head">
            <div>
              <h2 style={{ fontSize: 24 }}>Course lessons</h2>
              <p>Video dekhein; aapka watched progress automatically save hoga.</p>
            </div>
          </div>
          <div className="card">
            {videos.length ? (
              <div className="lesson-list">
                {videos.map((video, index) => {
                  const progress = progressByVideo.get(String(video._id));
                  const percentage = Math.round(progress?.progressPercentage || 0);
                  const label = progress?.completed
                    ? "Completed"
                    : percentage > 0
                      ? `${percentage}% watched`
                      : "Not started";

                  return (
                    <Link className="lesson-item course-video-item" href={`/watch/${video._id}`} key={video._id}>
                      <div
                        className="lesson-video-thumb"
                        style={video.thumbnailUrl ? { backgroundImage: `url("${video.thumbnailUrl}")` } : undefined}
                      >
                        <span className="lesson-play">▶</span>
                      </div>
                      <div className="lesson-number">{video.order || index + 1}</div>
                      <div className="lesson-video-info">
                        <strong>{video.title}</strong>
                        <small style={{ display: "block", color: "var(--muted)" }}>
                          {formatDuration(video.duration)} · {video.topics?.slice(0, 2).join(", ") || "Lesson"}
                        </small>
                        {video.processingStatus !== "completed" && (
                          <small className="lesson-ai-status">
                            {video.processingStatus === "failed"
                              ? "Video is available; AI summary needs a retry."
                              : "Video is available; AI summary is processing."}
                          </small>
                        )}
                        <div className="progress-track lesson-progress">
                          <span style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                      <span className={`badge ${progress?.completed ? "badge-success" : percentage ? "badge-warning" : "badge-neutral"}`}>
                        {label}
                      </span>
                      <span className="watch-video-action">Watch video →</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Empty title="No lessons yet" />
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
