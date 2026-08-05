"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function UploadVideoPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [quickCourse, setQuickCourse] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [form, setForm] = useState({
    courseId: "",
    title: "",
    description: "",
    order: 1,
  });
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadCourses = async () => {
    const response = await apiRequest("/courses/admin/all");
    const list = response.data?.courses || [];
    setCourses(list);
    setForm((current) => ({
      ...current,
      courseId:
        list.some((course) => course._id === current.courseId)
          ? current.courseId
          : list[0]?._id || "",
    }));
  };

  useEffect(() => {
    loadCourses().catch((requestError) => {
      setError(requestError.message);
    });
  }, []);

  const createQuickCourse = async () => {
    const title = quickCourse.trim();
    if (!title) {
      setError("Course ka naam likhiye");
      return;
    }

    setCreatingCourse(true);
    setError("");

    try {
      const response = await apiRequest("/courses", {
        method: "POST",
        body: JSON.stringify({
          title,
          description:
            `${title} course lessons and AI assessments`,
          passingPercentage: 60,
          numberOfQuestions: 5,
          maximumAttempts: 2,
          questionTypes: [
            "mcq",
            "true_false",
            "short_answer",
          ],
        }),
      });

      const createdCourse = response.data?.course;
      await loadCourses();

      if (createdCourse?._id) {
        setForm((current) => ({
          ...current,
          courseId: createdCourse._id,
        }));
      }

      setQuickCourse("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCreatingCourse(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.courseId) {
      setError(
        "Video upload se pehle course create ya select karein"
      );
      return;
    }

    setBusy(true);
    setError("");

    const body = new FormData();
    body.append("video", video);

    if (thumbnail) {
      body.append("thumbnail", thumbnail);
    }

    Object.entries(form).forEach(([key, value]) => {
      body.append(key, value);
    });

    try {
      await apiRequest("/videos/upload", {
        method: "POST",
        body,
      });
      router.push("/admin/videos");
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">New lesson</div>
          <h1>Upload video</h1>
          <p>
            Choose an existing course or quickly create one
            before uploading the lesson.
          </p>
        </div>
      </div>

      <form
        className="card"
        style={{ maxWidth: 850 }}
        onSubmit={submit}
      >
        {error && <div className="form-error">{error}</div>}
        {busy && (
          <div className="form-success">
            Uploading and preparing your video. Large files can
            take a few minutes—keep this tab open.
          </div>
        )}

        <div className="form-group">
          <label>Course</label>
          <select
            className="select"
            value={form.courseId}
            onChange={(event) =>
              setForm({
                ...form,
                courseId: event.target.value,
              })
            }
          >
            {!courses.length && (
              <option value="">
                No course available — create one below
              </option>
            )}
            {courses.map((course) => (
              <option value={course._id} key={course._id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div
          className="card"
          style={{
            boxShadow: "none",
            background: "var(--green-soft)",
            marginBottom: 20,
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            Quick create course
          </label>
          <p style={{ marginBottom: 12 }}>
            Admin yahan course ka naam likhkar turant create kar
            sakta hai.
          </p>
          <div className="actions">
            <input
              className="input"
              style={{ flex: 1, minWidth: 220 }}
              placeholder="Example: JavaScript Basics"
              value={quickCourse}
              onChange={(event) =>
                setQuickCourse(event.target.value)
              }
            />
            <button
              className="btn btn-secondary"
              type="button"
              disabled={creatingCourse}
              onClick={createQuickCourse}
            >
              {creatingCourse
                ? "Creating..."
                : "+ Create & select"}
            </button>
          </div>
        </div>

        <div
          className="grid-3"
          style={{ gridTemplateColumns: "2fr 1fr" }}
        >
          <div className="form-group">
            <label>Lesson title</label>
            <input
              className="input"
              required
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value,
                })
              }
            />
          </div>
          <div className="form-group">
            <label>Order</label>
            <input
              className="input"
              type="number"
              min="1"
              value={form.order}
              onChange={(event) =>
                setForm({
                  ...form,
                  order: event.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            className="textarea"
            value={form.description}
            onChange={(event) =>
              setForm({
                ...form,
                description: event.target.value,
              })
            }
          />
        </div>

        <div
          className="grid-3"
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          <div className="form-group">
            <label>Video file</label>
            <input
              className="input"
              type="file"
              accept="video/*"
              required
              onChange={(event) =>
                setVideo(event.target.files[0])
              }
            />
            <small>
              {video &&
                `${video.name} · ${(video.size / 1048576).toFixed(
                  1
                )} MB`}
            </small>
          </div>

          <div className="form-group">
            <label>Thumbnail</label>
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(event) =>
                setThumbnail(event.target.files[0])
              }
            />
          </div>
        </div>

        <button
          className="btn btn-primary"
          disabled={busy || !video || !form.courseId}
        >
          {busy ? "Uploading..." : "Upload lesson"}
        </button>
      </form>
    </>
  );
}
