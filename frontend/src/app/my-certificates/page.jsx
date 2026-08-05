"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell, { Empty, Loading, StatusBadge } from "@/components/AppShell";
import { apiRequest, formatDate } from "@/lib/api";

export default function MyCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadCertificates() {
      try {
        const response = await apiRequest("/certificates/my-certificates");
        if (active) setCertificates(response.data?.certificates || []);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCertificates();
    return () => { active = false; };
  }, []);

  return <AppShell>
    <div className="page-head"><div><div className="eyebrow">Verified achievements</div><h1>My Certificates</h1><p>Aapke earned certificates ko view aur download karein.</p></div></div>
    {error ? <div className="form-error">{error}</div> : loading ? <Loading label="Certificates load ho rahe hain..." /> : certificates.length ? <div className="student-record-grid">
      {certificates.map((certificate) => <article className="student-record-card certificate-record-card" key={certificate._id}>
        <div className="record-card-top"><div className="record-icon">▣</div><StatusBadge value={certificate.status} /></div>
        <small>Certificate of completion</small>
        <h3>{certificate.courseName || certificate.courseId?.title}</h3>
        <div className="record-details"><span>Score <strong>{certificate.score}%</strong></span><span>Issued <strong>{formatDate(certificate.issuedAt)}</strong></span><span>ID <strong>{certificate.certificateId}</strong></span></div>
        <div className="record-actions"><Link className="btn btn-primary" href={`/certificate/${certificate.certificateId}`}>View</Link><a className="btn btn-outline" href={certificate.certificateUrl} target="_blank" rel="noreferrer">PDF</a></div>
      </article>)}
    </div> : <div className="card"><Empty title="Abhi koi certificate nahi hai" text="Assessment pass karne ke baad certificate yahan dikhega." /></div>}
  </AppShell>;
}
