"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="sc-luxury-footer">
      <div className="sc-luxury-footer-container">
        <div className="sc-footer-columns-grid">

          {/* ─── Column 1: Brand Info & Socials ─── */}
          <div className="sc-footer-col sc-footer-brand-col">
            <Link href="/" className="sc-footer-logo">
              <span className="sc-footer-logo-badge">S</span>
              <div className="sc-footer-logo-text">
                <strong>SkillCert AI</strong>
                <small>INSTITUTE OF DIGITAL SKILLS</small>
              </div>
            </Link>

            <p className="sc-footer-about-text">
              At SkillCert AI, we believe verifiable skills create confidence. Our expert instructors deliver industry-focused courses, AI-assisted learning, and tamper-proof certifications tailored just for you.
            </p>

            <div className="sc-footer-tagline">
              <span>SKILLS</span>
              <span className="sc-dot">•</span>
              <span>CREDENTIALS</span>
              <span className="sc-dot">•</span>
              <span>CONFIDENCE</span>
            </div>

            <div className="sc-footer-social-row">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="sc-social-circle-btn" aria-label="Facebook">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="sc-social-circle-btn" aria-label="Instagram">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="sc-social-circle-btn" aria-label="WhatsApp">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.301-.15-1.782-.879-2.058-.979-.276-.1-.476-.15-.676.15-.2.3-.777.979-.952 1.18-.175.2-.351.225-.652.075-.3-.15-1.267-.467-2.414-1.489-.893-.796-1.496-1.779-1.672-2.08-.175-.3-.019-.462.131-.612.136-.135.301-.35.451-.525.15-.176.2-.3.301-.5.1-.2.05-.375-.025-.525-.075-.15-.677-1.632-.927-2.235-.244-.588-.492-.508-.676-.518-.175-.008-.376-.01-.577-.01-.2 0-.526.075-.802.375-.276.3-1.053 1.03-1.053 2.511 0 1.482 1.078 2.914 1.228 3.115.15.2 2.122 3.24 5.141 4.544.718.31 1.278.496 1.716.635.722.23 1.38.197 1.899.12.578-.087 1.782-.728 2.033-1.431.25-.704.25-1.308.175-1.432-.075-.125-.276-.2-.577-.35z" />
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15c-1.49 0-2.95-.4-4.22-1.16l-.3-.18-3.13.82.83-3.05-.2-.31a8.21 8.21 0 0 1-1.26-4.37c0-4.57 3.72-8.29 8.28-8.29 2.21 0 4.29.86 5.86 2.42a8.24 8.24 0 0 1 2.42 5.86c0 4.58-3.72 8.3-8.28 8.3z" />
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="sc-social-circle-btn" aria-label="YouTube">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* ─── Column 2: Our Courses (Balanced 2 Sub-Columns) ─── */}
          <div className="sc-footer-col sc-footer-courses-col">
            <h3 className="sc-footer-col-title">Our Courses</h3>
            <div className="sc-footer-title-bar" />
            <div className="sc-footer-courses-dual">
              <ul className="sc-footer-link-list">
                <li>
                  <Link href="/courses"><span className="sc-chevron">&gt;</span> Full Stack Development</Link>
                </li>
                <li>
                  <Link href="/courses"><span className="sc-chevron">&gt;</span> Python Data Science</Link>
                </li>
                <li>
                  <Link href="/courses"><span className="sc-chevron">&gt;</span> UI/UX Design Systems</Link>
                </li>
                <li>
                  <Link href="/courses"><span className="sc-chevron">&gt;</span> AI &amp; Machine Learning</Link>
                </li>
              </ul>
              <ul className="sc-footer-link-list">
                <li>
                  <Link href="/courses"><span className="sc-chevron">&gt;</span> Cloud &amp; DevOps</Link>
                </li>
                <li>
                  <Link href="/courses"><span className="sc-chevron">&gt;</span> Cybersecurity Basics</Link>
                </li>
                <li>
                  <Link href="/courses"><span className="sc-chevron">&gt;</span> Mobile App Engineering</Link>
                </li>
                <li>
                  <Link href="/courses"><span className="sc-chevron">&gt;</span> 1-on-1 AI Mentorship</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* ─── Column 4: Contact Us ─── */}
          <div className="sc-footer-col sc-footer-contact-col">
            <h3 className="sc-footer-col-title">Contact Us</h3>
            <div className="sc-footer-title-bar" />

            <div className="sc-footer-contact-list">
              <div className="sc-footer-contact-item">
                <span className="sc-contact-badge">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                  </svg>
                </span>
                <p>123 Innovation Street, Tech Hub,<br />New Delhi, India - 110001</p>
              </div>

              <div className="sc-footer-contact-item">
                <span className="sc-contact-badge">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                </span>
                <p>+91 98765 43210</p>
              </div>

              <div className="sc-footer-contact-item">
                <span className="sc-contact-badge">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </span>
                <p>info@skillcertai.com</p>
              </div>

              <div className="sc-footer-contact-item">
                <span className="sc-contact-badge">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                </span>
                <p>Mon - Sun: 9:00 AM - 8:00 PM<br /><small>(24/7 AI Assistance)</small></p>
              </div>
            </div>

            <Link href="/register" className="sc-footer-pill-btn">
              <span>Start Learning Free</span>
              <span className="sc-pill-arrow">→</span>
            </Link>
          </div>

        </div>

        {/* ─── Bottom Copyright & Legal Links ─── */}
        <div className="sc-footer-bottom-bar">
          <p className="sc-footer-copy-text">
            © 2026 SkillCert AI. All Rights Reserved.
          </p>
          <div className="sc-footer-legal-links">
            <Link href="/about">Privacy Policy</Link>
            <span className="sc-divider">|</span>
            <Link href="/about">Terms &amp; Conditions</Link>
            <span className="sc-divider">|</span>
            <Link href="/about">FAQs</Link>
            <span className="sc-divider">|</span>
            <Link href="/verify">Verification</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
