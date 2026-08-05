"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Empty,
  Loading,
  StatusBadge,
} from "@/components/AppShell";
import {
  apiRequest,
  formatDate,
} from "@/lib/api";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [notice, setNotice] = useState(null);

  const load = async () => {
    try {
      const response = await apiRequest(
        "/courses/admin/all"
      );
      setCourses(response.data?.courses || []);
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const publish = async (course) => {
    setActionId(course._id);
    setNotice(null);

    try {
      const response = await apiRequest(
        `/courses/${course._id}/publish`,
        {
          method: "PATCH",
          returnErrorResponse: true,
        }
      );

      if (!response.ok) {
        setNotice({
          type: "error",
          message:
            response.message ||
            "Course publish nahi ho saka",
          uploadRequired: String(
            response.message || ""
          ).includes("processed video"),
        });
        return;
      }

      setNotice({
        type: "success",
        message: `${course.title} successfully publish ho gaya.`,
      });
      await load();
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message,
        uploadRequired:
          error.message.includes("processed video"),
      });
    } finally {
      setActionId("");
    }
  };

  const remove = async (course) => {
    const confirmed = window.confirm(
      `"${course.title}" aur uska related data delete karein?`
    );

    if (!confirmed) {
      return;
    }

    setActionId(course._id);
    setNotice(null);

    try {
      await apiRequest(`/courses/${course._id}`, {
        method: "DELETE",
      });
      setNotice({
        type: "success",
        message: "Course delete ho gaya.",
      });
      await load();
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message,
      });
    } finally {
      setActionId("");
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">
            Content management
          </div>
          <h1>Courses</h1>
          <p>
            Create, configure and publish learning paths.
          </p>
        </div>
        <Link
          className="btn btn-primary"
          href="/admin/courses/create"
        >
          + New course
        </Link>
      </div>

      {notice && (
        <div
          className={
            notice.type === "success"
              ? "form-success"
              : "form-error"
          }
        >
          <strong>{notice.message}</strong>
          {notice.uploadRequired && (
            <>
              <div style={{ marginTop: 6 }}>
                Course publish karne ka correct flow:
                video upload → AI processing completed → publish.
              </div>
              <Link
                className="btn btn-primary btn-sm"
                href="/admin/videos/upload"
                style={{ marginTop: 12 }}
              >
                Upload course video
              </Link>
            </>
          )}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <div className="table-card">
          {courses.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Passing</th>
                  <th>Questions</th>
                  <th>Attempts</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course._id}>
                    <td>
                      <strong>{course.title}</strong>
                    </td>
                    <td>
                      <StatusBadge
                        value={course.status}
                      />
                    </td>
                    <td>{course.passingPercentage}%</td>
                    <td>{course.numberOfQuestions}</td>
                    <td>{course.maximumAttempts}</td>
                    <td>{formatDate(course.createdAt)}</td>
                    <td>
                      <div className="actions">
                        {course.status !== "published" && (
                          <button
                            className="btn btn-secondary btn-sm"
                            disabled={actionId === course._id}
                            onClick={() => publish(course)}
                          >
                            {actionId === course._id
                              ? "Checking..."
                              : "Publish"}
                          </button>
                        )}
                        <button
                          className="btn btn-outline btn-sm"
                          disabled={actionId === course._id}
                          onClick={() => remove(course)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty title="No courses yet" />
          )}
        </div>
      )}
    </>
  );
}
