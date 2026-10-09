"use client";

import Link from "next/link";
import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";
import LearningSteps from "@/components/LearningSteps";

export default function AboutPage() {
  return (
    <div className="sc-home">
      <MainHeader />
      <main className="info-page">
        <section className="about-hero about-hero-v2">
          <div className="about-hero-backdrop" />
          <div className="about-hero-content">
            <span className="about-hero-kicker">ABOUT SKILLCERT AI <i /></span>
            <h1>Learn with purpose.<br /><em>Prove what you know.</em></h1>
            <p>We connect practical learning, measurable progress, and trusted credentials so you can turn new skills into real opportunity.</p>
            <div className="about-hero-actions">
              <Link href="/courses" className="sc-btn sc-btn-green">Explore courses <span aria-hidden="true">›</span></Link>
              <a href="#our-mission" className="about-hero-link">Discover our mission <span aria-hidden="true">↓</span></a>
            </div>
            <div className="about-hero-proof"><span>SKILLS THAT MOVE YOU FORWARD</span><b>Learn · Practice · Get recognized</b></div>
          </div>
        </section>

        <section className="about-overview">
          <div className="about-overview-visual">
            <div className="about-overview-photo" role="img" aria-label="Learner building new skills with an online course" />
            <div className="about-overview-photo-note"><span>YOUR NEXT CHAPTER</span><b>Start with one new skill.</b></div>
          </div>
          <div className="about-overview-main">
            <span className="about-overview-kicker">WHY SKILLCERT AI</span>
            <h2>From video lesson to verified achievement.</h2>
            <p className="about-overview-lede">SkillCert AI turns learning into a clear journey: watch a lesson, review its summary, test your understanding, and earn a certificate when you pass.</p>
            <p className="about-overview-copy">Learn at your own pace, keep track of your progress, and build skills you can demonstrate. Your earned certificate includes verification details and can be shared with employers, added to your resume, or included in your professional profile.</p>
            <div className="about-overview-benefits">
              <article><span>01</span><div><h3>Watch and understand</h3><p>Learn through course videos and review a summary of each lesson.</p></div></article>
              <article><span>02</span><div><h3>Take your generated test</h3><p>Complete the assessment unlocked after finishing the lesson.</p></div></article>
              <article><span>03</span><div><h3>Pass and get certified</h3><p>Earn a verifiable certificate you can download and share.</p></div></article>
            </div>
          </div>
        </section>

        <section className="about-story" id="our-mission">
          <div className="about-story-image" />
          <div className="about-story-copy">
            <span className="sc-kicker">Our mission</span>
            <h2 style={{ marginTop: "12px" }}>Help people turn learning into real opportunity.</h2>
            <p>We believe skill development should feel focused, flexible, and useful from day one. Our platform brings lessons, assessments, progress, and credentials together in one experience.</p>
            <Link href="/courses" className="sc-btn sc-btn-green" style={{ display: "inline-flex", marginTop: "16px" }}>
              See our courses <span aria-hidden="true">›</span>
            </Link>
          </div>
        </section>

        <LearningSteps />
      </main>
      <Footer />
    </div>
  );
}
