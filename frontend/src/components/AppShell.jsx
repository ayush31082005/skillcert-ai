"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest, clearSessionToken } from "@/lib/api";
import MainHeader, { Logo } from "./MainHeader";
import Footer from "./Footer";

const legacyStudentNav = [
  ["⌂", "Dashboard", "/dashboard"],
  ["◇", "Courses", "/courses"],
  ["✓", "My Tests", "/dashboard#tests"],
  ["▣", "Certificates", "/dashboard#certificates"],
];

const studentNav = [
  ["⌂", "Dashboard", "/dashboard"],
  ["◇", "Courses", "/courses"],
  ["✓", "My Tests", "/my-tests"],
  ["▣", "Certificates", "/my-certificates"],
];

const adminNav = [
  ["⌂", "Overview", "/admin"],
  ["◇", "Courses", "/admin/courses"],
  ["▶", "Videos", "/admin/videos"],
  ["✓", "Tests", "/admin/tests"],
  ["♙", "Students", "/admin/students"],
  ["▧", "Templates", "/admin/certificate-template"],
  ["▣", "Certificates", "/admin/certificates"],
];

export function Brand({ dark = false }) {
  return (
    <Link className="sc-logo" href="/" style={{ textDecoration: "none" }}>
      <strong style={{ color: dark ? "#ffffff" : "inherit" }}>SkillCert AI</strong>
    </Link>
  );
}

export function PublicNav() {
  return <MainHeader />;
}

export function PublicFooter() {
  return <Footer />;
}

export function StatusBadge({ value = "unknown" }) {
  const tones = { completed: "success", submitted: "success", valid: "success", published: "success", processing: "warning", pending: "warning", started: "warning", review_required: "warning", failed: "danger", revoked: "danger" };
  return <span className={`badge badge-${tones[value] || "neutral"}`}>{String(value).replaceAll("_", " ")}</span>;
}

export default function AppShell({ children, admin = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const nav = admin ? adminNav : studentNav;

  useEffect(() => {
    apiRequest("/auth/me").then((r) => {
      if (!r.ok) {
        return;
      }

      const current = r.data?.user;
      setUser(current);
      if (admin && current?.role !== "admin") router.replace("/dashboard");
    }).catch(() => {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?next=${next}`);
    });
  }, [admin, pathname, router]);

  const logout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // Clear the browser session even if the backend logout request fails.
    }
    clearSessionToken();
    router.push("/login");
  };

  return (
    <div className={`app-layout${admin ? " admin-layout" : ""}`}>
      <aside className="sidebar">
        <Brand dark />
        <div className="sidebar-nav">
          {nav.map(([icon, label, href]) => (
            <Link key={href} href={href} className={pathname === href ? "active" : ""}>
              <span className="nav-symbol">{icon}</span>{label}
            </Link>
          ))}
        </div>
        <div className="sidebar-foot">
          <small>Signed in as</small>
          <strong>{user?.name || "Loading..."}</strong>
          <small>{user?.role || ""}</small>
          <button className="btn btn-outline btn-sm sidebar-logout" onClick={logout}>Logout</button>
        </div>
      </aside>
      <main className="app-main">
        <header className="topbar">
          <div className="search-box"><input className="input" placeholder="Search courses, students, tests..." /></div>
          <div className="user-chip">
            <div className="user-avatar">{user?.name?.slice(0, 1) || "U"}</div>
            <div><strong style={{ display:"block", fontSize:13 }}>{user?.name || "Account"}</strong><small style={{ color:"var(--muted)" }}>{user?.role}</small></div>
            <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}

export function Loading({ label = "Loading your workspace..." }) {
  return <div className="loading"><div><div className="spinner" /><div>{label}</div></div></div>;
}

export function Empty({ title = "Nothing here yet", text = "New records will appear here." }) {
  return <div className="empty"><div><div className="feature-icon" style={{ margin:"0 auto 16px" }}>◇</div><h3>{title}</h3><p>{text}</p></div></div>;
}
