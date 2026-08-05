"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

const fallbackCourses = [
  { _id: "web", title: "Full Stack Web Development", description: "HTML, CSS, JavaScript, React, Node.js and MongoDB", category: "Beginner", image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=85" },
  { _id: "python", title: "Python for Data Science", description: "Data Analysis, Pandas, NumPy, Visualization and ML basics", category: "Beginner", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=85" },
  { _id: "design", title: "UI/UX Design Fundamentals", description: "Figma, User Research, Wireframing and Prototyping", category: "Beginner", image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&q=85" },
  { _id: "analytics", title: "Data Science & Analytics", description: "Python, SQL, Tableau, Statistics and Machine Learning", category: "Intermediate", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=85" },
];

const benefits = [
  ["⌘", "Job-ready skills", "In-demand & practical"],
  ["▣", "Verified certificates", "Share on LinkedIn"],
  ["▶", "Learn at your pace", "Lifetime access"],
  ["AI", "AI study assistant", "Personalized help"],
];

const why = [
  ["✣", "Curated by Experts", "Industry experts design every course."],
  ["▦", "Project Based", "Build real projects and strengthen your portfolio."],
  ["⌘", "AI-Powered", "Personalized learning with AI assistance."],
  ["♙", "Career Focused", "Learn skills that employers actually want."],
];

const testimonials = [
  ["SkillCert AI helped me build real projects and land my first developer role.", "Riya Kapoor", "Frontend Developer", "RK"],
  ["The practical approach and exercises made complex topics easy to learn.", "Karan Malhotra", "Data Analyst", "KM"],
  ["The certificates and projects gave me the confidence to switch my career.", "Meera Joshi", "UI/UX Designer", "MJ"],
];

const paths = [
  ["</>", "Web Development", "12 courses"],
  ["▥", "Data Science", "10 courses"],
  ["✥", "UI/UX Design", "8 courses"],
  ["◎", "AI & Machine Learning", "9 courses"],
];

function Logo() {
  return <Link href="/" className="sc-logo"><span>S</span><strong>SkillCert AI</strong></Link>;
}

function CourseTile({ course, index }) {
  const image = course.thumbnailUrl || course.thumbnail || course.image || fallbackCourses[index]?.image;
  const href = String(course._id).length > 10 ? `/courses/${course._id}` : "/courses";
  return (
    <article className="sc-course-card">
      <Link href={href} className="sc-course-image">
        <img src={image} alt="" />
        <span>◉ {course.videoCount || 8 + index * 2} Lessons</span>
      </Link>
      <div className="sc-course-body">
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div><span>♟ {course.level || course.category || "Beginner"}</span><span className="sc-rating">★ 4.{8 - index % 2} ({850 + index * 130})</span></div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    apiRequest("/courses")
      .then((res) => setCourses(res.data?.courses || []))
      .catch(() => {});
  }, []);

  const shownCourses = [...courses.slice(0, 4), ...fallbackCourses].slice(0, 4);

  return (
    <main className="sc-home">
      <section className="sc-dark-top">
        <nav className="sc-nav">
          <Logo />
          <div className="sc-nav-links">
            <Link href="/courses">Courses⌄</Link>
            <Link href="#paths">Paths</Link>
            <Link href="/features">Features</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="/about">About</Link>
          </div>
          <div className="sc-nav-actions">
            <Link href="/login" className="sc-btn sc-btn-ghost">Sign in</Link>
            <Link href="/register" className="sc-btn sc-btn-green">Start learning <span>→</span></Link>
          </div>
        </nav>

        <div className="sc-hero">
          <div className="sc-hero-copy">
            <span className="sc-kicker">✦ AI-POWERED LEARNING</span>
            <h1>Learn skills that<br /><em>move you forward</em></h1>
            <p>AI-powered courses, hands-on projects, and real-world skills to help you build your dream career.</p>
            <div className="sc-hero-actions">
              <Link href="/register" className="sc-btn sc-btn-green">Start learning free <span>→</span></Link>
              <Link href="/courses" className="sc-btn sc-btn-ghost">Explore courses</Link>
            </div>
            <div className="sc-proof">
              <div className="sc-avatars"><span>R</span><span>K</span><span>M</span><span>2K+</span></div>
              <strong>Join 2,000+ learners building real skills</strong>
            </div>
          </div>

          <div className="sc-hero-visual">
            <img src="/images/home-learner-hero.png" alt="Student learning online with SkillCert AI" />
            <div className="sc-float sc-progress-float"><small>Your Progress</small><strong>78%</strong><div><i /></div><small>Keep going! 🚀</small></div>
            <div className="sc-float sc-ai-float"><b>AI</b><div><strong>AI Mentor</strong><small>Get help 24/7</small></div></div>
            <div className="sc-float sc-cert-float"><b>✓</b><div><small>Certificate earned</small><strong>Python for Data Science</strong></div></div>
          </div>
        </div>

        <div className="sc-benefit-strip">
          {benefits.map(([icon, title, sub]) => <div key={title}><span>{icon}</span><p><strong>{title}</strong><small>{sub}</small></p></div>)}
        </div>
      </section>

      <section className="sc-main">
        <div className="sc-trusted">
          <small>Trusted by learners from top companies</small>
          <div><b>Google</b><b>▦ Microsoft</b><b>amazon</b><b>♧ airbnb</b><b>◉ Spotify</b><b>Adobe</b><b>∞ Meta</b></div>
        </div>

        <section className="sc-why">
          <div className="sc-why-title"><span>WHY SKILLCERT AI</span><h2>Everything you need to<br /><em>learn and grow</em></h2></div>
          {why.map(([icon, title, text]) => <article key={title}><i>{icon}</i><strong>{title}</strong><p>{text}</p></article>)}
        </section>

        <section className="sc-section">
          <div className="sc-section-head">
            <div><span>EXPLORE COURSES</span><h2>Popular courses to<br />kickstart <em>your journey</em></h2></div>
            <Link href="/courses">View all courses　→</Link>
          </div>
          <div className="sc-course-grid">{shownCourses.map((course, i) => <CourseTile course={course} index={i} key={course._id || i} />)}</div>
        </section>

        <section className="sc-stats">
          {[["♟","2,000+","Active learners"],["▣","150+","Practical courses"],["⌁","98%","Completion rate"],["⬟","10K+","Certificates issued"]].map(([i,n,l]) => <div key={l}><i>{i}</i><p><strong>{n}</strong><span>{l}</span></p></div>)}
        </section>

        <section className="sc-section sc-love">
          <div className="sc-section-head">
            <div><span>LEARNER LOVE</span><h2>Real learners.<br />Real <em>success stories.</em></h2></div>
            <Link href="/about">View all stories　→</Link>
          </div>
          <div className="sc-testimonials">
            {testimonials.map(([quote,name,role,initials]) => <article key={name}><p>“{quote}”</p><footer><i>{initials}</i><span><strong>{name}</strong><small>{role}</small></span><b>★★★★★</b></footer></article>)}
          </div>
        </section>

        <section className="sc-paths" id="paths">
          <div className="sc-path-head"><div><span>LEARNING PATHS</span><h2>Follow a path. Achieve <em>your goals.</em></h2></div><Link href="/courses">Explore all paths　→</Link></div>
          <div>{paths.map(([icon,title,count]) => <Link href="/courses" key={title}><i>{icon}</i><p><strong>{title}</strong><small>{count}</small></p><b>→</b></Link>)}</div>
        </section>

        <section className="sc-choice" id="pricing">
          <div><span>WHY LEARNERS CHOOSE US</span><h2>Built for modern learners<br />like you.</h2><i /></div>
          {[["♧","Flexible Learning","Learn anytime, anywhere. On any device."],["♙","Affordable Pricing","High quality education that fits your budget."],["◎","Lifetime Access","Pay once and access forever."]].map(([icon,title,text]) => <article key={title}><i>{icon}</i><p><strong>{title}</strong><span>{text}</span></p></article>)}
        </section>

        <section className="sc-final-cta">
          <div><span>GET STARTED TODAY</span><h2>Your future starts<br />with <em>one click.</em></h2><p>Join 2,000+ learners and start building real skills today. No credit card required.</p></div>
          <div className="sc-cta-orbit">⌁　　✥<br />　　♧　　</div>
          <div className="sc-final-actions"><Link href="/register" className="sc-btn sc-btn-green">Start learning free　→</Link><Link href="/courses" className="sc-btn sc-btn-ghost">Browse courses</Link></div>
        </section>
      </section>

      <footer className="sc-footer">
        <div className="sc-footer-grid">
          <div><Logo /><p>Learn with purpose. Build with confidence.<br />Practical skills for real careers.</p><div className="sc-socials">♥　in　◉　▶　◎</div></div>
          <div><strong>Platform</strong><Link href="/courses">Courses</Link><Link href="#paths">Paths</Link><Link href="/features">Features</Link><Link href="#pricing">Pricing</Link></div>
          <div><strong>Company</strong><Link href="/about">About us</Link><Link href="/about">Blog</Link><Link href="/about">Careers</Link><Link href="/about">Contact</Link></div>
          <div><strong>Resources</strong><Link href="/about">Help Center</Link><Link href="/about">Terms of Service</Link><Link href="/about">Privacy Policy</Link><Link href="/about">Refund Policy</Link></div>
          <div><strong>Stay updated</strong><p>Get the latest courses, tips & updates</p><form><input type="email" placeholder="Enter your email" /><button>Subscribe</button></form></div>
        </div>
        <small className="sc-copyright">© 2026 SkillCert AI. All rights reserved.</small>
      </footer>
    </main>
  );
}
