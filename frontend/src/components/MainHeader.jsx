"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Logo() {
  return (
    <Link href="/" className="sc-logo">
      <strong>SkillCert AI</strong>
    </Link>
  );
}

export default function MainHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sc-site-header sc-header-fixed ${scrolled ? "sc-header-scrolled" : "sc-header-top"}`}>
      <nav className="sc-nav" aria-label="Main navigation">
        <Logo />
        <div className="sc-nav-links">
          <Link href="/courses" className={pathname?.startsWith("/courses") ? "active" : ""}>Courses</Link>
          {/* <Link href="/features" className={pathname?.startsWith("/features") ? "active" : ""}>Features</Link> */}
          <Link href="/about" className={pathname?.startsWith("/about") ? "active" : ""}>About</Link>
        </div>
        <div className="sc-nav-actions">
          <Link href="/login" className="sc-btn sc-btn-ghost">Sign in</Link>
          <Link href="/register" className="sc-btn sc-btn-green">
            Start learning <span>→</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
