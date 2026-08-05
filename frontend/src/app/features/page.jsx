import Link from "next/link";
import { PublicNav } from "@/components/AppShell";

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
    <>
      <PublicNav />
      <main className="info-page">
        <section className="info-hero">
          <span className="info-kicker">Platform features</span>
          <h1>Everything you need to<br /><span>learn with confidence.</span></h1>
          <p>From focused lessons to verified credentials, SkillCert AI brings your complete learning journey into one simple platform.</p>
          <div className="info-actions">
            <Link href="/courses" className="hv2-btn-primary">Explore courses →</Link>
            <Link href="/register" className="hv2-btn-outline">Start learning</Link>
          </div>
        </section>

        <section className="info-feature-grid">
          {features.map(([number, title, description]) => (
            <article className="info-feature-card" key={number}>
              <span>{number}</span>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </section>

        <section className="info-bottom-cta">
          <div><small>Ready to begin?</small><h2>Build your next skill today.</h2></div>
          <Link href="/register">Create free account →</Link>
        </section>
      </main>
    </>
  );
}
