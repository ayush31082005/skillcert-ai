"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell, { Loading, StatusBadge } from "@/components/AppShell";
import { apiRequest, formatDate } from "@/lib/api";

export default function CertificatePage() {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCertificate() {
      try {
        const response = await apiRequest(`/certificates/${certificateId}`);
        let current = response.data?.certificate;

        /*
         * Legacy PDF ko current institute template se repair/regenerate karo.
         * Certificate ID aur original issued date service me preserve hote hain.
         */
        if (current?.testId) {
          const regenerated = await apiRequest("/certificates/generate", {
            method: "POST",
            body: JSON.stringify({ testId: current.testId }),
          }).catch(() => null);

          current = regenerated?.data?.certificate || current;
        }

        if (active) setCertificate(current);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCertificate();
    return () => { active = false; };
  }, [certificateId]);

  const courseName = certificate?.courseName || certificate?.courseId?.title;

  return (
    <AppShell>
      {loading ? <Loading label="Preparing your certificate..." /> : (
        <>
          <div className="page-head">
            <div>
              <div className="eyebrow">Verified achievement</div>
              <h1>{courseName}</h1>
              <p>Issued {formatDate(certificate?.issuedAt)}</p>
            </div>
            <StatusBadge value={certificate?.status} />
          </div>

          <section className="institute-certificate">
            <div className="institute-certificate-inner">
              <header className="ic-header">
                <div className="ic-brand"><span>S</span><div><strong>SkillCert AI</strong><small>INSTITUTE OF DIGITAL SKILLS</small></div></div>
                <div className="ic-seal"><span>SC</span><i /></div>
              </header>

              <div className="ic-title"><small>CERTIFICATE</small><h2>OF COMPLETION</h2><i /></div>
              <p className="ic-presented">This certificate is proudly presented to</p>
              <h1 className="ic-student">{certificate?.studentName}</h1>
              <p className="ic-email">{certificate?.studentEmail}</p>
              <p className="ic-completion">for successfully completing the professional course</p>
              <h3 className="ic-course">{courseName}</h3>
              <p className="ic-distinction">with a score of <strong>{certificate?.score}%</strong> and demonstrated practical proficiency</p>

              <footer className="ic-footer">
                <div className="ic-details">
                  <small>CERTIFICATE ID</small><strong>{certificate?.certificateId}</strong>
                  <small>ISSUED ON</small><strong>{formatDate(certificate?.issuedAt)}</strong>
                </div>
                <div className="ic-signature">
                  <em>Ayush Chaubey</em><i /><strong>AYUSH CHAUBEY</strong><small>FOUNDER &amp; DIRECTOR</small>
                </div>
                <div className="ic-verify"><div className="ic-qr">▦</div><small>SCAN TO VERIFY</small></div>
              </footer>
              <div className="ic-trust">VERIFIED · SHAREABLE · TRUSTED</div>
            </div>
          </section>

          <div className="actions certificate-actions">
            <a className="btn btn-primary" href={certificate?.certificateUrl} target="_blank" rel="noreferrer">View regenerated PDF</a>
            <a className="btn btn-outline" href={`/verify/${certificate?.certificateId}`} target="_blank" rel="noreferrer">Public verification</a>
          </div>
        </>
      )}
    </AppShell>
  );
}
