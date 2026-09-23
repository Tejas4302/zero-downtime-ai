"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  Bell,
  Bot,
  Boxes,
  Cloud,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { signOut } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

const nav = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/assets", "Assets", Boxes],
  ["/alerts", "Alerts", Bell],
  ["/copilot", "AI Copilot", Bot],
  ["/users", "Users", Users],
  ["/settings", "Settings", Settings],
] as const;

const roleLabel = (role?: string) =>
  role
    ? role
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { me } = useAuth();

  const visible = nav.filter(([href]) => href !== "/users" || me?.role !== "standard");
  const workspace =
    me?.role === "super_admin"
      ? "Platform Command Center"
      : me?.client_id
      ? me.client_id.toUpperCase()
      : "Workspace";

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Activity size={19} />
          </div>
          <div>
            <div className="brand-name">Zero Downtime</div>
            <div className="brand-sub">Industrial Intelligence</div>
          </div>
        </div>

        <div className="sidebar-status">
          <span className="status-dot" />
          Production workspace
        </div>

        <div className="nav-section">Workspace</div>

        <nav>
          {visible.map(([href, label, Icon]) => {
            const active = path === href || path.startsWith(`${href}/`);

            return (
              <Link key={href} href={href} className={`nav-link ${active ? "active" : ""}`}>
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-cloud">
          <Cloud size={16} />
          <div>
            <strong>Google Cloud</strong>
            <span>Cloud Run · BigQuery · Vertex AI</span>
          </div>
        </div>

        <div className="nav-section">Session</div>

        <button
          className="nav-link signout-button"
          onClick={async () => {
            await signOut(auth);
            router.push("/login");
          }}
        >
          <LogOut size={17} />
          Sign out
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="top-title">
            <strong>{workspace}</strong>
            <span>Secure multi-tenant operations</span>
          </div>

          <div className="topbar-right">
            <div className="system-live">
              <span className="status-dot" />
              Live
            </div>

            <div className="user-pill">
              <ShieldCheck size={16} />
              <div>
                <div className="user-email">{me?.email}</div>
                <div className="user-role">{roleLabel(me?.role)}</div>
              </div>
              <div className="avatar">{me?.email?.slice(0, 2).toUpperCase()}</div>
            </div>
          </div>
        </header>

        <motion.div
          className={`content ${path === "/copilot" ? "content-copilot" : ""}`}
          key={path}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
