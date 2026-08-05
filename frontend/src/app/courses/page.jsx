"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Brand, Empty, Loading, PublicNav } from "@/components/AppShell";
import CourseCard from "@/components/CourseCard";
import { apiRequest } from "@/lib/api";

// ─── HERO BACKGROUND SLIDES ──────────────────────────────────────────────────

const HERO_SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&q=90",
    tag: "AI-Powered Course Library",
    title: "Master In-Demand Skills.",
    highlight: "Build Your Future.",
    sub: "Explore expert-curated video courses in Fullstack Web Dev, Artificial Intelligence, Product Design & Data Engineering.",
  },
  {
    img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&q=90",
    tag: "Web Development Track",
    title: "Build Real Products &",
    highlight: "Deploy With Confidence.",
    sub: "Learn React, Next.js, Node.js, and databases with hands-on video projects and smart quizzes.",
  },
  {
    img: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600&q=90",
    tag: "AI & Machine Learning",
    title: "Understand AI Models &",
    highlight: "Stay Ahead Of The Curve.",
    sub: "From Python fundamentals to Generative AI & Neural Networks — master concepts step by step.",
  },
  {
    img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=90",
    tag: "UI/UX & Product Design",
    title: "Craft Exceptional Apps &",
    highlight: "Earn Verified Credentials.",
    sub: "Design systems, Figma workflows, and interactive prototyping taught by industry design leads.",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Courses", icon: "✨" },
  { id: "web", label: "Web Development", icon: "💻" },
  { id: "ai", label: "AI & Machine Learning", icon: "🤖" },
  { id: "design", label: "UI/UX & Design", icon: "🎨" },
  { id: "cloud", label: "Cloud & DevOps", icon: "☁️" },
  { id: "cyber", label: "Cybersecurity", icon: "🛡️" },
];

const SEARCH_TAGS = ["#JavaScript", "#React", "#Python", "#Figma", "#AI & LLMs", "#Docker"];

const FAQS = [
  {
    q: "Are the courses free to start?",
    a: "Yes! You can browse and begin learning courses on SkillCert AI for free. Complete assessment quizzes to earn verified certificates.",
  },
  {
    q: "How do I get my verified certificate?",
    a: "Once you complete all lessons in a course and achieve a passing score on the assessment quiz, your digital certificate is automatically generated with a unique QR verification code.",
  },
  {
    q: "Can I retake quiz assessments if I fail?",
    a: "Yes, each course allows multiple attempts so you can review video materials and improve your score.",
  },
  {
    q: "Are SkillCert certificates recognized by employers?",
    a: "SkillCert AI certificates feature verifiable QR credentials that can be easily shared on LinkedIn, resumes, and portfolios to showcase proof of work.",
  },
];

const FEATURED_PATHS = [
  { icon: "</>", title: "Web Development", skills: "HTML, CSS, JavaScript, React, Node.js & more", meta: "8 Courses · 120+ Hours", tone: "green" },
  { icon: "▥", title: "Data Science", skills: "Python, Pandas, ML, Visualization & more", meta: "7 Courses · 90+ Hours", tone: "purple" },
  { icon: "✎", title: "UI/UX Design", skills: "Figma, Design Systems, Prototyping & more", meta: "6 Courses · 60+ Hours", tone: "pink" },
  { icon: "AI", title: "AI & Machine Learning", skills: "LLMs, Deep Learning, NLP, AI tools & more", meta: "6 Courses · 100+ Hours", tone: "teal" },
];

const LEARNER_REVIEWS = [
  { quote: "SkillCert AI helped me switch to a developer role in just 4 months!", name: "Priya Sharma", role: "Software Engineer", initials: "PS" },
  { quote: "The courses are practical, up-to-date and the certificates are trusted.", name: "Rohan Verma", role: "Data Analyst", initials: "RV" },
  { quote: "Best platform to learn UI/UX. The projects and feedback are top-notch.", name: "Neha Patel", role: "UI/UX Designer", initials: "NP" },
  { quote: "Well-structured courses and amazing support. Highly recommended!", name: "Arjun Mehta", role: "ML Engineer", initials: "AM" },
];

// Custom Hook for Scroll Animations
function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
}

export default function CoursesPage() {
  const [dbCourses, setDbCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openFaq, setOpenFaq] = useState(0);

  // Hero Image Slider State
  const [slideIdx, setSlideIdx] = useState(0);
  const [sliding, setSliding] = useState(false);

  // Scroll animation refs
  const [heroRef, heroInView] = useInView(0.1);
  const [coursesRef, coursesInView] = useInView(0.1);
  const [certRef, certInView] = useInView(0.1);
  const [faqRef, faqInView] = useInView(0.1);

  // Auto-swap Hero Background Slider every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setSliding(true);
      setTimeout(() => {
        setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
        setSliding(false);
      }, 400);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (idx) => {
    if (sliding) return;
    setSliding(true);
    setTimeout(() => {
      setSlideIdx(idx);
      setSliding(false);
    }, 350);
  };

  // Fetch REAL published courses from API
  useEffect(() => {
    let active = true;
    async function loadCourses() {
      try {
        const response = await apiRequest("/courses");
        if (active) setDbCourses(response.data?.courses || []);
      } catch (requestError) {
        if (active) setError(requestError.message || "Failed to load courses");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCourses();
    return () => {
      active = false;
    };
  }, []);

  // Filter ONLY REAL DB COURSES
  const filtered = useMemo(() => {
    return dbCourses.filter((course) => {
      const matchQuery = `${course.title || ""} ${course.description || ""} ${course.category || ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase());

      const matchCat =
        activeCategory === "all" ||
        (course.category && course.category.toLowerCase().includes(activeCategory));

      return matchQuery && matchCat;
    });
  }, [dbCourses, query, activeCategory]);

  const currentSlide = HERO_SLIDES[slideIdx];

  return (
    <>
      <PublicNav />
      <main className="cps-main">

        {/* ─── 1. HERO SECTION WITH AUTO-SWAPPING BACKGROUND SLIDER ─── */}
        <section className="cps-hero-slider" ref={heroRef}>

          {/* Background Images with Cross-Fade */}
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className={`cps-hero-bg-slide ${idx === slideIdx ? "cps-slide-active" : ""} ${sliding && idx === slideIdx ? "cps-slide-exit" : ""}`}
              style={{ backgroundImage: `url(${slide.img})` }}
            >
              <div className="cps-hero-overlay" />
            </div>
          ))}

          {/* Hero Content */}
          <div className="cps-hero-container">
            <div className={`cps-hero-copy ${sliding ? "cps-content-exit" : "cps-content-enter"}`}>
              <div className="cps-badge-tag">
                <span className="cps-badge-pulse" />
                {currentSlide.tag}
              </div>

              <h1 className="cps-hero-title">
                {currentSlide.title} <br />
                <span className="cps-highlight">{currentSlide.highlight}</span>
              </h1>

              <p className="cps-hero-sub">{currentSlide.sub}</p>

              {/* Glassmorphic Search Bar */}
              <div className="cps-search-box">
                <svg className="cps-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  className="cps-search-input"
                  placeholder="Search courses by title, topic, or technology (e.g. JavaScript, Python)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query ? (
                  <button className="cps-clear-btn" onClick={() => setQuery("")}>✕</button>
                ) : (
                  <span className="cps-search-shortcut">⌘K</span>
                )}
              </div>

              {/* Search Tag Chips */}
              <div className="cps-tag-chips">
                <span className="cps-tag-label">Popular searches:</span>
                {SEARCH_TAGS.map((tag) => (
                  <button
                    key={tag}
                    className="cps-chip"
                    onClick={() => setQuery(tag.replace("#", ""))}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Stats Bar */}
              <div className="cps-stats-row">
                <div className="cps-stat-item">
                  <strong>{dbCourses.length}</strong>
                  <span>Published Courses</span>
                </div>
                <div className="cps-stat-item">
                  <strong>2,500+</strong>
                  <span>Active Learners</span>
                </div>
                <div className="cps-stat-item">
                  <strong>98.4%</strong>
                  <span>Pass Rate</span>
                </div>
                <div className="cps-stat-item">
                  <strong>4.9★</strong>
                  <span>Avg. Rating</span>
                </div>
              </div>
            </div>
          </div>

          {/* Slider Prev / Next Arrows */}
          <button
            className="cps-arrow cps-arrow-left"
            onClick={() => goToSlide((slideIdx - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            className="cps-arrow cps-arrow-right"
            onClick={() => goToSlide((slideIdx + 1) % HERO_SLIDES.length)}
            aria-label="Next slide"
          >
            ›
          </button>

          {/* Slide Indicator Dots */}
          <div className="cps-dots">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                className={`cps-dot ${idx === slideIdx ? "cps-dot-active" : ""}`}
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Progress Bar */}
          <div className="cps-hero-progress">
            <div className="cps-hero-progress-bar" key={slideIdx} />
          </div>
        </section>

        {/* ─── 2. REAL PUBLISHED COURSES CATALOGUE DIRECTORY ─── */}
        <section className="cps-courses-sec" ref={coursesRef} id="courses">
          <div className="cps-container">

            <div className={`cps-sec-head cps-animate ${coursesInView ? "cps-visible" : ""}`}>
              <div>
                <span className="cps-sub-tag">ALL COURSES</span>
                <h2>Explore Published Courses</h2>
                <p>Select a course to start streaming HD video lessons, taking assessments, and earning certificates.</p>
              </div>
              <div className="cps-count-badge">
                Showing <strong>{filtered.length}</strong> of {dbCourses.length} courses
              </div>
            </div>

            {error ? (
              <div className="form-error">{error}</div>
            ) : loading ? (
              <Loading label="Loading published courses..." />
            ) : filtered.length > 0 ? (
              <div className="course-grid">
                {filtered.map((course, index) => (
                  <CourseCard
                    key={course._id}
                    course={course}
                    featuredLabel={["Bestseller", "Popular", "Trending"][index] || ""}
                  />
                ))}
              </div>
            ) : (
              <div className="card cps-empty-box">
                <Empty
                  title={query ? `No courses found matching "${query}"` : "No published courses available yet"}
                  text={query ? "Try clearing your search terms or picking another category." : "Admin will publish courses soon!"}
                />
                {query && (
                  <button
                    className="cps-btn-lime"
                    style={{ marginTop: 16 }}
                    onClick={() => { setQuery(""); setActiveCategory("all"); }}
                  >
                    Reset Filters &amp; Search
                  </button>
                )}
              </div>
            )}

          </div>
        </section>

        {/* ─── 4. BLOCKCHAIN CERTIFICATE SHOWCASE ─── */}
        <div className="cp-ref-area">
          <section className="cp-paths">
            <div className="cps-container">
              <h2>Featured learning paths</h2>
              <div className="cp-path-grid">
                {FEATURED_PATHS.map((path) => (
                  <Link href="/courses" className="cp-path-card" key={path.title}>
                    <span className={`cp-path-icon cp-${path.tone}`}>{path.icon}</span>
                    <div><strong>{path.title}</strong><p>{path.skills}</p><small>{path.meta}</small></div>
                    <b>→</b>
                  </Link>
                ))}
              </div>
            </div>
          </section>
          <section className="cp-cert">
            <div className="cp-cert-inner">
              <div className="cp-cert-copy">
                <span>VERIFIED. SHAREABLE. TRUSTED.</span>
                <h2>Certificates that open doors</h2>
                <p>Complete courses and earn verifiable SkillCert AI certificates with QR verification. Share on LinkedIn, resumes, and portfolios.</p>
                <div className="cp-cert-features">
                  <div><i>▦</i><p><strong>Unique Certificate ID</strong><small>Tamper-proof verification</small></p></div>
                  <div><i>⌘</i><p><strong>QR Code Verification</strong><small>Instant authenticity check</small></p></div>
                  <div><i>↗</i><p><strong>Share on LinkedIn</strong><small>One-click profile update</small></p></div>
                  <div><i>✥</i><p><strong>Trusted by Employers</strong><small>Recognized industry-wide</small></p></div>
                </div>
              </div>
              <div className="cp-certificate cp-certificate-document">
                <img
                  src="/images/skillcert-institute-certificate.svg"
                  alt="SkillCert AI institute certificate with logo, verification seal, QR code and director signature"
                />
              </div>
            </div>
          </section>
          <section className="cp-reviews">
            <div className="cps-container">
              <h2>Loved by learners worldwide</h2>
              <div className="cp-review-grid">
                {LEARNER_REVIEWS.map((review) => (
                  <article key={review.name}><p>“{review.quote}”</p><footer><i>{review.initials}</i><span><strong>{review.name}</strong><small>{review.role}</small></span><b>★★★★★</b></footer></article>
                ))}
              </div>
            </div>
          </section>
          <section className="cp-faq">
            <div className="cps-container">
              <h2>Frequently asked questions</h2>
              <div className="cp-faq-grid">
                {FAQS.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return <div className={`cp-faq-item ${isOpen ? "open" : ""}`} key={faq.q}><button onClick={() => setOpenFaq(isOpen ? null : idx)}><strong>{faq.q}</strong><span>{isOpen ? "−" : "+"}</span></button>{isOpen && <p>{faq.a}</p>}</div>;
                })}
              </div>
            </div>
          </section>
          <section className="cp-cta">
            <div className="cp-rocket">↗</div>
            <div><h2>Ready to build your next skill?</h2><p>Join 2,500+ learners and start your journey with SkillCert AI today.</p></div>
            <div><Link href="/register" className="cp-cta-primary">Start learning free →</Link><Link href="#courses" className="cp-cta-secondary">Explore all courses</Link></div>
          </section>
        </div>

        <section className="cps-cert-sec" ref={certRef}>
          <div className="cps-cert-bg-overlay" />
          <div className="cps-container" style={{ position: "relative", zIndex: 2 }}>
            <div className="cps-cert-grid">

              <div className={`cps-cert-copy cps-animate ${certInView ? "cps-visible" : ""}`}>
                <span className="cps-sub-tag" style={{ color: "#b9da73" }}>VERIFIED CREDENTIALS</span>
                <h2>Earn Shareable Certificates That Employers Trust</h2>
                <p>
                  Every course completed on SkillCert AI unlocks an official Certificate of Completion. Embedded with tamper-proof QR verification, your credentials can be shared directly on LinkedIn, resumes, and portfolios.
                </p>
                <ul className="cps-cert-list">
                  <li><span>✓</span> Unique Certificate ID &amp; Live QR Code</li>
                  <li><span>✓</span> PDF Download &amp; One-Click LinkedIn Sharing</li>
                  <li><span>✓</span> 100% Free Verification for Employers</li>
                </ul>
                <div className="cps-cert-actions">
                  <Link href="/register" className="cps-btn-lime">
                    Start Learning Free →
                  </Link>
                  <Link href="/verify" className="cps-btn-glass">
                    Verify a Certificate
                  </Link>
                </div>
              </div>

              <div className={`cps-cert-visual cps-animate ${certInView ? "cps-visible" : ""}`} style={{ transitionDelay: "150ms" }}>
                <div className="cps-cert-frame">
                  <img
                    src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80"
                    alt="Official SkillCert Certificate Preview"
                    className="cps-cert-img"
                  />
                  <div className="cps-cert-floating">
                    <div className="cps-cf-seal">🏅</div>
                    <div>
                      <strong>Official SkillCert Certificate</strong>
                      <small>QR Code Verified on Blockchain</small>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── 5. FREQUENTLY ASKED QUESTIONS ─── */}
        <section className="cps-faq-sec" ref={faqRef}>
          <div className="cps-container">

            <div className={`cps-sec-center cps-animate ${faqInView ? "cps-visible" : ""}`}>
              <span className="cps-sub-tag">GOT QUESTIONS?</span>
              <h2>Frequently Asked Questions</h2>
              <p>Everything you need to know about SkillCert AI courses and certificates.</p>
            </div>

            <div className="cps-faq-list">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className={`cps-faq-item ${isOpen ? "cps-faq-open" : ""} cps-animate ${faqInView ? "cps-visible" : ""}`}
                    style={{ transitionDelay: `${idx * 60}ms` }}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <div className="cps-faq-header">
                      <h3>{faq.q}</h3>
                      <span className="cps-faq-toggle">{isOpen ? "−" : "+"}</span>
                    </div>
                    {isOpen && <p className="cps-faq-body">{faq.a}</p>}
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ─── 6. VIBRANT CTA BANNER ─── */}
        <section className="cps-cta-banner">
          <div className="cps-cta-orb" />
          <div className="cps-cta-inner">
            <h2>Ready to build your next skill?</h2>
            <p>Join 2,500+ active learners advancing their careers with SkillCert AI today.</p>
            <div className="cps-cta-btns">
              <Link href="/register" className="cps-btn-lime">
                Start Learning Free →
              </Link>
              <Link href="#courses" className="cps-btn-glass">
                Explore All Courses
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="cps-footer">
          <div className="cps-container">
            <div className="cps-footer-inner">
              <Brand dark />
              <p>© 2026 SkillCert AI. Learn with purpose. Build with confidence. Get certified.</p>
              <div className="cps-footer-links">
                <Link href="/courses">Courses</Link>
                <Link href="/verify">Verify Certificate</Link>
                <Link href="/register">Sign Up</Link>
                <Link href="/login">Sign In</Link>
              </div>
            </div>
          </div>
        </footer>

      </main>
    </>
  );
}
