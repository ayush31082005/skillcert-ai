import Link from "next/link";
import { PublicNav } from "@/components/AppShell";

const values = [
  ["Practical first", "Learning should help you build, solve, and create—not just consume information."],
  ["Progress with purpose", "Every lesson and assessment should move you closer to a clear, meaningful goal."],
  ["Trust through proof", "Completed skills deserve credentials that are easy to verify and confidently share."],
];

export default function AboutPage() {
  return (
    <>
      <PublicNav />
      <main className="info-page">
        <section className="about-hero">
          <div>
            <span className="info-kicker">About SkillCert AI</span>
            <h1>We make practical learning <span>clear and credible.</span></h1>
          </div>
          <p>SkillCert AI was created to connect focused learning with measurable progress and trusted certification—so every learner can build skills with confidence.</p>
        </section>

        <section className="about-story">
          <div className="about-story-image" />
          <div className="about-story-copy">
            <span className="info-kicker">Our mission</span>
            <h2>Help people turn learning into real opportunity.</h2>
            <p>We believe skill development should feel focused, flexible, and useful from day one. Our platform brings lessons, assessments, progress, and credentials together in one experience.</p>
            <Link href="/courses">See our courses →</Link>
          </div>
        </section>

        <section className="about-values">
          <div className="about-values-head"><span className="info-kicker">What guides us</span><h2>Built around the learner.</h2></div>
          <div className="about-values-grid">
            {values.map(([title, description], index) => (
              <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
