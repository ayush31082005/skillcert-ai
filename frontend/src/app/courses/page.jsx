"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Brand, Empty, Loading } from "@/components/AppShell";
import CourseCard from "@/components/CourseCard";
import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";
import { apiRequest } from "@/lib/api";

// ─── LUXURY COURSE CATALOGUE HERO SLIDES ──────────────────────────────────
const heroSlides = [
  {
    id: "slide-1",
    kicker: "✦ VIDEO COURSES | AI-ASSISTED LEARNING",
    titleLine1: "Explore courses &",
    titleLine2: "master modern skills",
    desc: "Browse expert-led video courses in Full-Stack, Python, and AI. Complete hands-on coding modules at your own pace.",
    image: "/images/course-hero-slide-1.jpg",
    alt: "Student learning video courses with SkillCert AI interactive editor",
    feat1: ["HD Video", "Lessons"],
    feat2: ["Interactive", "Quizzes"],
    feat3: ["Self-Paced", "Access"],
  },
  {
    id: "slide-2",
    kicker: "✦ PRACTICAL LABS | CLOUD & BACKEND TRACKS",
    titleLine1: "Build real projects &",
    titleLine2: "boost your career",
    desc: "Hands-on cloud architecture, React, Node.js, and DevOps courses designed with industry engineers and mentors.",
    image: "/images/course-hero-slide-2.jpg",
    alt: "Developer mastering full stack engineering courses",
    feat1: ["Hands-On", "Projects"],
    feat2: ["Industry", "Mentors"],
    feat3: ["1-on-1", "AI Guidance"],
  },
  {
    id: "slide-3",
    kicker: "✦ VERIFIED CREDENTIALS | PRODUCT & DESIGN",
    titleLine1: "Complete courses &",
    titleLine2: "earn certifications",
    desc: "Master Figma design systems, AI tools, and frontend engineering. Pass course assessments to earn verified credentials.",
    image: "/images/course-hero-slide-3.jpg",
    alt: "Designer taking UI UX and product design courses",
    feat1: ["Verified", "Certificates"],
    feat2: ["Portfolio", "Ready"],
    feat3: ["Lifetime", "Access"],
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
    q: "How do I enroll in a course and begin learning?",
    a: "Getting started is effortless. Simply create a free account, browse our course catalogue, and click on any course to access high-definition video modules, practical lessons, and assignments immediately.",
  },
  {
    q: "Are the courses self-paced with lifetime access?",
    a: "Yes, 100%! All enrolled courses come with unrestricted lifetime access. You can learn on your own schedule, revisit complex topics, and track your progress at any time across all devices.",
  },
  {
    q: "How do assessments and quizzes work?",
    a: "Every course features structured milestone quizzes and practical assignments to validate your knowledge. After completing all video modules, you take an online assessment test that measures your practical understanding.",
  },
  {
    q: "How do I earn my verified SkillCert AI certificate?",
    a: "Once you achieve a passing score on the course assessment, your tamper-proof certificate is instantly generated with a unique Certificate ID and verifiable QR code, ready to share on LinkedIn or download as a PDF.",
  },
  {
    q: "Can I retake quiz assessments if I don't pass on the first attempt?",
    a: "Yes! You can review the video lectures, examine your quiz performance feedback, and retake the test. There is no penalty for retakes—our goal is to help you master the material.",
  },
  {
    q: "Are SkillCert AI credentials recognized by employers and recruiters?",
    a: "SkillCert AI certificates feature instant cryptographic/QR verification links that recruiters and company HRs can scan directly to verify your authenticity, test score, and completion credentials.",
  },
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

  // Hero Image Slider State (Same as Home Page)
  const [activeSlide, setActiveSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % heroSlides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  // Scroll animation refs
  const [coursesRef, coursesInView] = useInView(0.1);
  const [certRef, certInView] = useInView(0.1);
  const [faqRef, faqInView] = useInView(0.1);

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

  const current = heroSlides[activeSlide];

  return (
    <>
      <MainHeader />
      <main className="sc-home">

        {/* 1. Full-Screen Interactive Hero Slider Section (Same as Home Page) */}
        <section className="sc-dark-top sc-hero-integrated-banner">
          {/* Background Visual Carousel Canvas */}
          <div className="sc-hero-bg-canvas">
            {heroSlides.map((slide, idx) => (
              <img
                key={slide.id}
                src={slide.image}
                alt={slide.alt}
                className={`sc-hero-bg-person ${idx === activeSlide ? "active" : "inactive"}`}
              />
            ))}
            <div className="sc-hero-bg-overlay" />
            <div className="sc-hero-bg-glow" />
          </div>

          <div className="sc-hero-integrated-container">
            {/* Left Text Copy with slide transition */}
            <div className="sc-hero-copy sc-hero-copy-clean">
              <div className="sc-hero-sub-kicker" key={`kicker-${activeSlide}`}>
                <span>{current.kicker}</span>
              </div>

              <h1 className="sc-hero-serif-title" key={`title-${activeSlide}`}>
                <span className="sc-hero-title-top">{current.titleLine1}</span>
                <em className="sc-hero-gold-text">{current.titleLine2}</em>
              </h1>

              <p className="sc-hero-desc-text" key={`desc-${activeSlide}`}>
                {current.desc}
              </p>

              <div className="sc-hero-actions-luxury">
                <Link href="/register" className="sc-btn sc-btn-green sc-btn-hero-pill">
                  <span>Start learning free</span>
                  <span className="sc-btn-arrow">→</span>
                </Link>
                <a href="#courses" className="sc-hero-play-action">
                  <span className="sc-play-circle-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </span>
                  <span className="sc-play-label">Explore courses</span>
                </a>
              </div>

              <div className="sc-hero-vertical-features">
                <div className="sc-vert-feat-item">
                  <span className="sc-vert-bar" />
                  <div className="sc-vert-feat-text">
                    <strong>{current.feat1[0]}</strong>
                    <small>{current.feat1[1]}</small>
                  </div>
                </div>

                <div className="sc-vert-feat-item">
                  <span className="sc-vert-bar" />
                  <div className="sc-vert-feat-text">
                    <strong>{current.feat2[0]}</strong>
                    <small>{current.feat2[1]}</small>
                  </div>
                </div>

                <div className="sc-vert-feat-item">
                  <span className="sc-vert-bar" />
                  <div className="sc-vert-feat-text">
                    <strong>{current.feat3[0]}</strong>
                    <small>{current.feat3[1]}</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual Ambient Space */}
            <div className="sc-hero-right-ambient" />
          </div>
        </section>

        {/* ─── 2. REAL PUBLISHED COURSES CATALOGUE DIRECTORY ─── */}
        <section className="cps-courses-white-catalogue" ref={coursesRef} id="courses">
          <div className="cps-catalogue-container">

            <div className="cps-catalogue-head-clean">
              <span className="cps-catalogue-sub-tag">✦ ALL COURSES</span>
              <h2>Explore Published Courses</h2>
              <p>Select a course to start streaming HD video lessons, taking assessments, and earning certificates.</p>
              <div className="cps-catalogue-badge">
                Showing <strong>{filtered.length}</strong> of {dbCourses.length} courses
              </div>
            </div>

            {error ? (
              <div className="form-error">{error}</div>
            ) : loading ? (
              <Loading label="Loading published courses..." />
            ) : filtered.length > 0 ? (
              <div className="cps-catalogue-grid-center">
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

        {/* ─── 3. LUXURY GOLD CERTIFICATE SHOWCASE (Full Width, No Green) ─── */}
        <section className="sc-gold-cert-section">
          <div className="sc-cert-container">
            <div className="sc-cert-grid-layout">
              <div className="sc-cert-copy-area">
                <span className="sc-hero-sub-kicker">✦ VERIFIED CREDENTIALS</span>
                <h2 className="sc-cert-serif-title">
                  Certificates that <br />
                  <em className="sc-hero-gold-text">open doors</em>
                </h2>
                <p className="sc-cert-desc-text">
                  Complete courses and earn verifiable SkillCert AI certificates with QR verification. Share on LinkedIn, resumes, and portfolios to prove your industry expertise.
                </p>
                <div className="sc-cert-action-btns">
                  <Link href="/register" className="sc-btn sc-btn-green sc-btn-hero-pill">
                    <span>Start Learning Free</span>
                    <span className="sc-btn-arrow">→</span>
                  </Link>
                  <Link href="/verify" className="sc-btn sc-btn-ghost">
                    <span>Verify a Certificate</span>
                  </Link>
                </div>
              </div>

              <div className="sc-cert-visual-area">
                <div className="sc-cert-preview-card">
                  <img
                    src="/images/skillcert-institute-certificate.svg"
                    alt="SkillCert AI official certificate preview with QR verification seal"
                    className="sc-cert-svg-img"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. LUXURY COURSE FAQ SECTION ─── */}
        <section className="sc-course-faq-section" ref={faqRef}>
          <div className="sc-faq-container">
            <div className="sc-faq-head">
              <span className="sc-hero-sub-kicker">✦ FREQUENTLY ASKED QUESTIONS</span>
              <h2>
                Got questions about <br />
                <em className="sc-hero-gold-text">our courses?</em>
              </h2>
              <p>
                Everything you need to know about enrollments, video lessons, assessment tests, and verifiable certificates.
              </p>
            </div>

            <div className="sc-faq-list">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className={`sc-faq-item ${isOpen ? "sc-faq-item-open" : ""}`}
                  >
                    <button
                      type="button"
                      className="sc-faq-question-btn"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <span className="sc-faq-icon-circle">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="sc-faq-answer">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="sc-faq-cta-bottom">
              <div>
                <h4>Still have questions?</h4>
                <p>Our learning support team and AI mentors are here to guide you 24/7.</p>
              </div>
              <Link href="/about" className="sc-btn sc-btn-ghost">
                <span>Contact Support</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── 5. UNIFIED LUXURY FOOTER ─── */}
        <Footer />

      </main>
    </>
  );
}
