"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell, { Empty, Loading, StatusBadge } from "@/components/AppShell";
import { apiRequest, formatDate, formatDuration } from "@/lib/api";

export default function DashboardPage() {
  const [state, setState] = useState({
    loading: true,
    user: null,
    courses: [],
    learning: [],
    tests: [],
    certificates: [],
  });

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [user, courses, learning, tests, certificates] = await Promise.all([
          apiRequest("/auth/me"),
          apiRequest("/courses"),
          apiRequest("/progress/my-learning"),
          apiRequest("/tests/my-tests"),
          apiRequest("/certificates/my-certificates"),
        ]);

        if (!active) return;
        setState({
          loading: false,
          user: user.data?.user,
          courses: courses.data?.courses || [],
          learning: learning.data?.learning || [],
          tests: tests.data?.tests || [],
          certificates: certificates.data?.certificates || [],
        });
      } catch {
        if (active) setState((current) => ({ ...current, loading: false }));
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) return <AppShell><Loading /></AppShell>;

  const passed = state.tests.filter((test) => test.passed).length;
  const completedVideos = state.learning.filter((item) => item.progress?.completed).length;
  const activeLearning = state.learning.filter((item) => !item.progress?.completed);
  const completedLearning = state.learning.filter((item) => item.progress?.completed);

  return (
    <AppShell>
      <div className="page-head">
        <div>
          <div className="eyebrow">Student workspace</div>
          <h1>Good to see you, {state.user?.name?.split(" ")[0] || "learner"}.</h1>
          <p>Aapne kitna video dekha hai aur aage kya dekhna hai, sab yahan milega.</p>
        </div>
        <Link className="btn btn-primary" href="/courses">Explore courses</Link>
      </div>

      <div className="stats">
        <Stat label="Available courses" value={state.courses.length} icon="◇" />
        <Stat label="Videos completed" value={completedVideos} icon="▶" />
        <Stat label="Tests passed" value={passed} icon="✓" />
        <Stat label="Certificates" value={state.certificates.length} icon="▣" />
      </div>

      <section className="dashboard-learning-full">
        <div className="page-head">
          <div>
            <h2 style={{ fontSize: 22 }}>Continue learning</h2>
            <p>Incomplete aur abhi tak na dekhe gaye lessons.</p>
          </div>
        </div>
        {activeLearning.length ? (
          <div className="learning-list">
            {activeLearning.map(({ video, course, progress }) => {
              const percentage = Math.round(progress?.progressPercentage || 0);
              return (
                <Link href={`/watch/${video._id}`} className="learning-card" key={video._id}>
                  <div className="learning-thumb" style={video.thumbnailUrl ? { backgroundImage: `url("${video.thumbnailUrl}")` } : undefined} />
                  <div className="learning-card-body">
                    <small>{course?.title || "Course"}</small>
                    <strong>{video.title}</strong>
                    <span>{formatDuration(video.duration)} · {percentage ? `${percentage}% watched` : "Not started"}</span>
                    <div className="progress-track"><span style={{ width: `${percentage}%` }} /></div>
                  </div>
                  <span>→</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card"><Empty title="All lessons completed" text="Explore another course to continue learning." /></div>
        )}
      </section>

      <section className="dashboard-recent">
        <div className="page-head">
          <div>
            <h2 style={{ fontSize: 22 }}>Recent activity</h2>
            <p>Completed lessons, test results aur certificates.</p>
          </div>
        </div>
        <div className="dashboard-recent-grid">
          <div className="card compact-activity-card">
            <div className="activity-heading"><h3>Completed lessons</h3><span className="record-icon">▶</span></div>
            {completedLearning.length ? completedLearning.slice(0, 3).map(({ video, course }) => (
              <Link className="activity-row" href={`/watch/${video._id}`} key={video._id}>
                <div><small>{course?.title || "Course"}</small><strong>{video.title}</strong></div>
                <span className="badge badge-success">Completed</span>
              </Link>
            )) : <p>No completed lessons yet.</p>}
          </div>

          <div className="card compact-activity-card">
            <div className="activity-heading"><h3>My Tests</h3><Link href="/my-tests">View all →</Link></div>
            {state.tests.length ? state.tests.slice(0, 3).map((test) => (
              <Link className="activity-row" href={["submitted", "review_required"].includes(test.status) ? `/result/${test._id}` : `/test/${test._id}`} key={test._id}>
                <div><small>{test.courseId?.title || "Assessment"}</small><strong>{["submitted", "review_required"].includes(test.status) ? `Score ${test.score || 0}%` : "Continue test"}</strong></div>
                <StatusBadge value={test.status} />
              </Link>
            )) : <p>No tests attempted yet.</p>}
          </div>

          <div className="card compact-activity-card">
            <div className="activity-heading"><h3>Certificates</h3><Link href="/my-certificates">View all →</Link></div>
            {state.certificates.length ? state.certificates.slice(0, 3).map((certificate) => (
              <Link className="activity-row" href={`/certificate/${certificate.certificateId}`} key={certificate._id}>
                <div><small>{formatDate(certificate.issuedAt)}</small><strong>{certificate.courseName || certificate.courseId?.title}</strong></div>
                <span className="badge badge-success">{certificate.score}%</span>
              </Link>
            )) : <p>No certificates earned yet.</p>}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Stat({ label, value, icon }) {
  return <div className="stat-card"><div><small>{label}</small><strong>{value}</strong></div><div className="stat-icon">{icon}</div></div>;
}
