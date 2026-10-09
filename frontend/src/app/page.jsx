"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "@/lib/api";
import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";
import LearningSteps from "@/components/LearningSteps";

const heroSlides = [
  {
    id: "slide-1",
    kicker: "✦ AI-POWERED LEARNING | BUILD REAL SKILLS",
    titleLine1: "Learn skills that",
    titleLine2: "move you forward",
    desc: "AI-powered courses, hands-on projects, and real-world skills to help you build your dream career.",
    image: "/images/slide-1.jpg",
    alt: "Student learning Python and software development with SkillCert AI",
    feat1: ["Job-Ready", "Skills"],
    feat2: ["Verified", "Certificates"],
    feat3: ["Lifetime", "Access"],
  },
  {
    id: "slide-2",
    kicker: "✦ CLOUD & FULL-STACK | INDUSTRY CERTIFIED",
    titleLine1: "Master tech &",
    titleLine2: "level up your career",
    desc: "Hands-on cloud architecture, React, DevOps, and backend development crafted with industry mentors.",
    image: "/images/slide-2.jpg",
    alt: "Developer learning cloud and full stack engineering with interactive AI",
    feat1: ["Hands-On", "Labs"],
    feat2: ["Industry", "Badges"],
    feat3: ["1-on-1", "AI Mentor"],
  },
  {
    id: "slide-3",
    kicker: "✦ UI/UX & AI SYSTEMS | DESIGN YOUR FUTURE",
    titleLine1: "Design & build with",
    titleLine2: "creative confidence",
    desc: "From Figma design systems to AI-assisted workflows, build standout portfolios that recruiters love.",
    image: "/images/slide-3.jpg",
    alt: "UI UX designer mastering AI-powered product design and workflows",
    feat1: ["Figma & Code", "Projects"],
    feat2: ["Verified", "Portfolio"],
    feat3: ["Fast-Track", "Growth"],
  },
];

function CourseTile({ course }) {
  const image = course.thumbnail || course.thumbnailUrl;
  return (
    <article className="sc-course-card">
      <Link href={`/courses/${course._id}`} className="sc-course-image">
        {image ? <img src={image} alt="" /> : <span className="sc-course-no-image">{course.title}</span>}
        {Number.isFinite(course.lessonCount) && course.lessonCount > 0 && <span>{course.lessonCount} Lessons</span>}
      </Link>
      <div className="sc-course-body">
        <h3>{course.title}</h3>
        {course.description && <p>{course.description}</p>}
        <div>{(course.level || course.category) && <span>{course.level || course.category}</span>}</div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    apiRequest("/courses")
      .then((res) => setCourses(res.data?.courses || []))
      .catch(() => setCoursesError(true))
      .finally(() => setCoursesLoading(false));
  }, []);

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % heroSlides.length);
  }, []);

  // Auto slide swap every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const shownCourses = courses.slice(0, 4);
  const current = heroSlides[activeSlide];

  return (
    <main className="sc-home">
      {/* Fixed Header */}
      <MainHeader />

      {/* 1. Full-Screen Interactive Hero Slider Section */}
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
              <Link href="/courses" className="sc-hero-play-action">
                <span className="sc-play-circle-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </span>
                <span className="sc-play-label">Explore courses</span>
              </Link>
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

      {/* 2. Our Courses Section (immediately after the hero) */}
      <section className="sc-courses-white-section" id="courses">
        <div className="sc-courses-container">
          <div className="sc-courses-head">
            <span className="sc-courses-kicker">✦ OUR COURSES</span>
            <h2>
              Popular courses to kickstart <em>your journey</em>
            </h2>
            <p>
              Explore industry-vetted courses with interactive AI mentorship, practical assignments, and verified certificates.
            </p>
          </div>

          <div className="sc-course-grid">
            {shownCourses.map((course) => <CourseTile course={course} key={course._id} />)}
          </div>

          {coursesLoading && <p className="sc-courses-empty">Loading courses...</p>}
          {!coursesLoading && coursesError && <p className="sc-courses-empty">Courses are temporarily unavailable. Please try again later.</p>}
          {!coursesLoading && !coursesError && shownCourses.length === 0 && <p className="sc-courses-empty">No courses are available yet.</p>}

          <div className="sc-courses-bottom-cta">
            <Link href="/courses" className="sc-btn-view-all">
              <span>View all courses</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      <LearningSteps home />

      <section className="home-credential-section">
        <div className="home-credential-content">
          <span className="home-credential-kicker">YOUR SKILLS, VERIFIED</span>
          <h2>Make your progress <em>easy to share.</em></h2>
          <p>Pass your course assessment to earn a certificate with verification details. Download it, add it to your resume, or share it with employers and your professional network.</p>
          <Link href="/courses" className="sc-btn sc-btn-green">Explore certificate courses <span aria-hidden="true">›</span></Link>
        </div>
        <div className="home-credential-art">
          <img src="/images/skillcert-institute-certificate.svg" alt="SkillCert AI certificate with QR verification" />
        </div>
      </section>

      <section className="home-outcomes-section">
        <div className="home-outcomes-head">
          <span>TAKE YOUR NEXT STEP</span>
          <h2>Put your new skills to work.</h2>
          <p>A certificate is a clear record of what you learned and completed. Bring it into the places where your next opportunity begins.</p>
        </div>
        <div className="home-outcomes-grid">
          <article><span>01</span><h3>Strengthen your resume</h3><p>Add your completed course and certificate to show the skills you have been building.</p></article>
          <article><span>02</span><h3>Share your progress</h3><p>Include your certificate in a professional profile or portfolio so others can review it.</p></article>
          <article><span>03</span><h3>Talk about what you learned</h3><p>Use your lessons and assessment experience to explain your skills with confidence.</p></article>
        </div>
      </section>

      {/* 3. Unified Footer */}
      <Footer />
    </main>
  );
}
