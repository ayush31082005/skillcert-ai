"use client";

import Link from "next/link";
import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";

const features = [
  ["01", "Focused video learning", "Learn through structured, practical lessons designed to make complex skills easier to understand."],
  ["02", "Progress that stays saved", "Continue exactly where you stopped and keep every completed lesson and milestone visible."],
  ["03", "Smart skill assessments", "Validate your understanding with focused tests, clear results, and useful performance feedback."],
  ["04", "Verified certificates", "Earn credentials with unique verification details that are simple to share with employers."],
  ["05", "Flexible learning paths", "Choose the courses that match your goals and learn at a pace that works around your schedule."],
  ["06", "Career-ready outcomes", "Turn learning into portfolio-ready knowledge and practical skills you can confidently demonstrate."],
];

export default function FeaturesPage() {
  return (
    <div className="sc-home">
      <MainHeader />
      <main className="info-page">
        <section className="info-hero">
          <span className="sc-kicker">✦ Platform features</span>
          <h1 style={{ marginTop: "16px" }}>Everything you need to<br /><em style={{ color: "#C8913A", fontStyle: "normal" }}>learn with confidence.</em></h1>
          <p>From focused lessons to verified credentials, SkillCert AI brings your complete learning journey into one simple platform.</p>
          <div className="info-actions" style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link href="/courses" className="sc-btn sc-btn-green">Explore courses <span>→</span></Link>
            <Link href="/register" className="sc-btn sc-btn-ghost">Start learning free</Link>
          </div>
        </section>

        <section className="info-feature-grid">
          {features.map(([number, title, description]) => (
            <article className="info-feature-card" key={number}>
              <span style={{ background: "linear-gradient(145deg, #A87528, #C8913A)", color: "#fff", width: "36px", height: "36px", borderRadius: "10px", display: "grid", placeItems: "center", fontWeight: "800", marginBottom: "16px" }}>
                {number}
              </span>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </section>

        <section className="sc-final-cta" style={{ width: "min(1180px, calc(100% - 48px))", margin: "0 auto 64px", borderRadius: "24px" }}>
          <div>
            <span className="sc-kicker">✦ GET STARTED TODAY</span>
            <h2 style={{ marginTop: "12px" }}>Build your next skill today.</h2>
            <p>Join thousands of learners building real skills and earning verified certificates.</p>
          </div>
          <div className="sc-cta-orbit">⌁　　✥<br />　　♧　　</div>
          <div className="sc-final-actions">
            <Link href="/register" className="sc-btn sc-btn-green">Create free account <span>→</span></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
