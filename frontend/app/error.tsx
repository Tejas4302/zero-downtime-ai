"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="access-error-page">
      <div className="card access-error-card">
        <div className="access-error-icon">
          <AlertTriangle size={22} />
        </div>
        <h2>Something went wrong</h2>
        <p>
          The workspace hit an unexpected error. Your data has not been changed.
          Retry the view or return to the dashboard.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={reset}>
            <RefreshCw size={15} />
            Retry
          </button>
          <a className="btn" href="/dashboard">
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
