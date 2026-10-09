"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Empty, Loading, StatusBadge } from "@/components/AppShell";
import { apiRequest, formatDuration } from "@/lib/api";

export default function AdminVideosPage() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("all");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [retryingId, setRetryingId] = useState("");
  const [retryError, setRetryError] = useState("");
  const [previewVideo, setPreviewVideo] = useState(null);

  useEffect(() => {
    apiRequest("/courses/admin/all")
      .then((response) => {
        const list = response.data?.courses || [];
        setCourses(list);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!courses.length) {
      setVideos([]);
      return;
    }

    let active = true;
    setVideosLoading(true);

    const requests = courseId === "all"
      ? courses.map(async (course) => {
          const response = await apiRequest(`/videos/course/${course._id}`);
          return (response.data?.videos || []).map((video) => ({
            ...video,
            courseTitle: course.title,
            courseStatus: course.status,
          }));
        })
      : [apiRequest(`/videos/course/${courseId}`).then((response) => {
          const course = courses.find((item) => item._id === courseId);
          return (response.data?.videos || []).map((video) => ({
            ...video,
            courseTitle: course?.title || "",
            courseStatus: course?.status || "draft",
          }));
        })];

    Promise.all(requests)
      .then((results) => {
        if (active) {
          setVideos(results.flat().sort((a, b) =>
            a.courseTitle.localeCompare(b.courseTitle) || a.order - b.order
          ));
        }
      })
      .catch(() => {
        if (active) setVideos([]);
      })
      .finally(() => {
        if (active) setVideosLoading(false);
      });

    return () => { active = false; };
  }, [courseId, courses]);

  useEffect(() => {
    if (!videos.some((video) => ["pending", "processing"].includes(video.processingStatus))) return;

    let active = true;
    const refreshStatuses = async () => {
      try {
        const requests = courseId === "all"
          ? courses.map(async (course) => {
              const response = await apiRequest(`/videos/course/${course._id}`);
              return (response.data?.videos || []).map((video) => ({ ...video, courseTitle: course.title, courseStatus: course.status }));
            })
          : [apiRequest(`/videos/course/${courseId}`).then((response) => {
              const course = courses.find((item) => item._id === courseId);
              return (response.data?.videos || []).map((video) => ({ ...video, courseTitle: course?.title || "", courseStatus: course?.status || "draft" }));
            })];
        const results = await Promise.all(requests);
        if (active) {
          setVideos(results.flat().sort((a, b) =>
            a.courseTitle.localeCompare(b.courseTitle) || a.order - b.order
          ));
        }
      } catch {
        // Keep the current rows visible if a background refresh briefly fails.
      }
    };

    const intervalId = window.setInterval(refreshStatuses, 3000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [courseId, courses, videos]);

  const deleteVideo = async (video) => {
    if (!window.confirm(`Delete "${video.title}" and its uploaded files? This cannot be undone.`)) return;

    setDeletingId(video._id);
    try {
      await apiRequest(`/videos/${video._id}`, { method: "DELETE" });
      setVideos((current) => current.filter((item) => item._id !== video._id));
    } catch (error) {
      window.alert(error.message);
    } finally {
      setDeletingId("");
    }
  };

  const retry = async (id) => {
    setRetryingId(id);
    setRetryError("");

    try {
      await apiRequest(`/videos/${id}/retry`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setVideos((current) => current.map((video) => video._id === id
        ? { ...video, processingStatus: "pending", processingError: "" }
        : video));
    } catch (error) {
      setRetryError(error.message || "Video processing restart nahi ho saki.");
    } finally {
      setRetryingId("");
    }
  };

  const unpublishedCourses = [...new Set(videos
    .filter((video) => video.courseStatus !== "published")
    .map((video) => video.courseTitle)
    .filter(Boolean))];

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Lesson operations</div>
          <h1>Videos</h1>
          <p>Monitor uploads and AI processing across courses.</p>
        </div>
        <div className="actions">
          <select className="select" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
            <option value="all">All courses</option>
            {courses.map((course) => <option value={course._id} key={course._id}>{course.title}</option>)}
          </select>
          <Link className="btn btn-primary" href="/admin/videos/upload">Upload video</Link>
        </div>
      </div>

      {unpublishedCourses.length > 0 && (
        <div className="video-publish-note">
          <span>
            {unpublishedCourses.join(", ")} {unpublishedCourses.length === 1 ? "is" : "are"} not published, so its videos are hidden from the public site.
          </span>
          <Link href="/admin/courses">Review courses</Link>
        </div>
      )}

      {loading || videosLoading ? <Loading label="Videos are loading..." /> : (
        <div className="table-card">
          {retryError && <p className="form-error" role="alert">{retryError}</p>}
          {videos.length ? (
            <table className="data-table">
              <thead><tr>{courseId === "all" && <th>Course</th>}<th>Order</th><th>Lesson</th><th>Preview</th><th>Duration</th><th>AI status</th><th>Processing details</th><th>Topics</th><th>Action</th></tr></thead>
              <tbody>{videos.map((video) => (
                <tr key={video._id}>
                  {courseId === "all" && <td>{video.courseTitle}{video.courseStatus !== "published" && <small className="video-course-draft">{video.courseStatus || "draft"}</small>}</td>}
                  <td>{video.order}</td>
                  <td><strong>{video.title}</strong></td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => setPreviewVideo(video)}>Play video</button></td>
                  <td>{formatDuration(video.duration)}</td>
                  <td><StatusBadge value={video.processingStatus} /></td>
                  <td>{video.processingError ? <small className="video-processing-error" title={video.processingError}>{video.processingError.slice(0, 180)}{video.processingError.length > 180 ? "..." : ""}</small> : "-"}</td>
                  <td>{video.topics?.slice(0, 2).join(", ") || "-"}</td>
                  <td className="video-row-actions">
                    {(video.processingStatus === "failed" || (video.processingStatus === "completed" && !video.topics?.length)) && <button className="btn btn-secondary btn-sm" disabled={retryingId === video._id} onClick={() => retry(video._id)}>{retryingId === video._id ? "Restarting..." : video.processingStatus === "failed" ? "Retry AI" : "Generate topics"}</button>}
                    <button className="btn btn-danger btn-sm" disabled={deletingId === video._id} onClick={() => deleteVideo(video)}>{deletingId === video._id ? "Deleting..." : "Delete"}</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          ) : <Empty title={courseId === "all" ? "No videos available" : "No videos in this course"} />}
        </div>
      )}

      {previewVideo && (
        <div className="admin-video-preview-backdrop" onClick={() => setPreviewVideo(null)} role="presentation">
          <section className="admin-video-preview" role="dialog" aria-modal="true" aria-label={`Preview: ${previewVideo.title}`} onClick={(event) => event.stopPropagation()}>
            <div className="admin-video-preview-head">
              <div><strong>{previewVideo.title}</strong>{previewVideo.courseTitle && <small>{previewVideo.courseTitle}</small>}</div>
              <button className="btn btn-outline btn-sm" onClick={() => setPreviewVideo(null)}>Close</button>
            </div>
            <video src={previewVideo.videoUrl} controls autoPlay playsInline />
          </section>
        </div>
      )}
    </>
  );
}


