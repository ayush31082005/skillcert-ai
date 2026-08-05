"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell, { Empty, Loading, StatusBadge } from "@/components/AppShell";
import { apiRequest, formatDate } from "@/lib/api";

export default function MyTestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadTests() {
      try {
        const response = await apiRequest("/tests/my-tests");
        if (active) setTests(response.data?.tests || []);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadTests();
    return () => { active = false; };
  }, []);

  return <AppShell>
    <div className="page-head"><div><div className="eyebrow">Assessment history</div><h1>My Tests</h1><p>Aapke generated, ongoing aur completed tests yahan dikhte hain.</p></div><Link className="btn btn-primary" href="/courses">Explore courses</Link></div>
    {error ? <div className="form-error">{error}</div> : loading ? <Loading label="Tests load ho rahe hain..." /> : tests.length ? <div className="student-record-grid">
      {tests.map((test) => {
        const finished = ["submitted", "review_required"].includes(test.status);
        return <article className="student-record-card" key={test._id}>
          <div className="record-card-top"><div className="record-icon">✓</div><StatusBadge value={test.status} /></div>
          <small>{test.courseId?.title || "Course assessment"}</small>
          <h3>{test.videoId?.title || `Test attempt ${test.attemptNumber}`}</h3>
          <div className="record-details"><span>Attempt <strong>{test.attemptNumber}</strong></span><span>Score <strong>{finished ? `${test.score || 0}%` : "Pending"}</strong></span><span>Date <strong>{formatDate(test.createdAt)}</strong></span></div>
          <Link className={`btn ${finished ? "btn-outline" : "btn-primary"}`} href={finished ? `/result/${test._id}` : `/test/${test._id}`}>{finished ? "View result" : test.status === "started" ? "Continue test" : "Start test"} →</Link>
        </article>;
      })}
    </div> : <div className="card"><Empty title="Abhi koi test nahi hai" text="Video complete karne ke baad assessment yahan dikhega." /></div>}
  </AppShell>;
}
