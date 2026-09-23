"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { auth } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import AppShell from "./AppShell";

export default function Protected({ children }: { children: React.ReactNode }) {
  const { user, me, loading, error, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="loading">
        <div>
          <div className="pulse" />
          Loading secure workspace…
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!me) {
    return (
      <div className="access-error-page">
        <div className="card access-error-card">
          <div className="access-error-icon">
            <AlertTriangle size={22} />
          </div>
          <h2>Workspace access could not be verified</h2>
          <p>{error || "Your session is signed in, but the authorised workspace profile could not be loaded."}</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => refreshProfile()}>
              <RefreshCw size={15} />
              Retry
            </button>
            <button
              className="btn"
              onClick={async () => {
                await signOut(auth);
                router.replace("/login");
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
