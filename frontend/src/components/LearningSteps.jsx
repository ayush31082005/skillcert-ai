import Link from "next/link";

const steps = [
  ["Watch a lesson", "Learn through focused course videos.", "course-hero-slide-1.jpg", "Learner watching a course video"],
  ["Review and take a test", "Read the lesson summary, then test what you learned.", "course-hero-slide-2.jpg", "Learner reviewing a lesson"],
  ["Earn your certificate", "Pass the assessment and share your verifiable achievement.", "course-hero-slide-3.jpg", "Learner completing a course"],
];

export default function LearningSteps({ home = false }) {
  return (
    <section className={`about-values learning-steps${home ? " learning-steps-home" : ""}`}>
      <div className="about-values-head">
        <span className="learning-steps-kicker">THE LEARNING JOURNEY</span>
        <h2>{home ? "From lesson to verified certificate." : "Built around the learner."}</h2>
        {home && <p>Clear steps help you turn what you learn into skills you can prove.</p>}
      </div>
      <div className="about-values-grid">
        {steps.map(([title, description, image, alt], index) => (
          <article className="about-value-step" key={title}>
            <div className="about-value-step-top"><span>STEP 0{index + 1}</span><i /></div>
            <div className="about-value-step-image" style={{ backgroundImage: `url("/images/${image}")` }} role="img" aria-label={alt} />
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
      {home && <div className="learning-steps-cta"><Link href="/courses" className="sc-btn sc-btn-green">Explore courses <span aria-hidden="true">›</span></Link></div>}
    </section>
  );
}
