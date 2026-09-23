"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { motion } from "framer-motion";
import { Activity, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

export default function Login() {
  const router = useRouter();
  const { user, me, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && me) {
      router.replace("/dashboard");
    }
  }, [loading, user, me, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/dashboard");
    } catch {
      setError("Unable to sign in. Check your email and password and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-art">
        <div className="brand login-brand">
          <div className="brand-mark">
            <Activity size={19} />
          </div>
          <div>
            <div className="brand-name">Zero Downtime</div>
            <div className="brand-sub">Predict. Prevent. Perform.</div>
          </div>
        </div>

        <div className="orb one" />
        <div className="orb two" />

        <motion.div
          className="big-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <div className="badge badge-low login-ai-badge">
            <Sparkles size={12} />
            Gemini-powered industrial intelligence
          </div>

          <h2>
            <span className="gradient-text">See risk before</span>
            <br />
            production sees downtime.
          </h2>

          <p>
            One secure command center for asset health, failure intelligence,
            maintenance prioritisation and operational decision support.
          </p>
        </motion.div>

        <div className="login-footer">AI Builder Cup 2026 · Manufacturing Intelligence</div>
      </section>

      <section className="login-panel">
        <motion.form
          className="login-card"
          onSubmit={submit}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="badge badge-medium login-secure-badge">
            <ShieldCheck size={12} />
            Secure tenant access
          </div>

          <h1>Welcome back</h1>
          <p>Sign in to your Zero Downtime workspace.</p>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.demo"
              required
              disabled={busy}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              disabled={busy}
            />
          </div>

          <button className="login-btn" disabled={busy || !email.trim() || !password}>
            {busy ? (
              "Signing in…"
            ) : (
              <>
                Sign in <ArrowRight size={16} />
              </>
            )}
          </button>

          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}

          <div className="hint">
            Access is isolated by client and role. Sessions are verified through Firebase Authentication and the Zero Downtime Cloud Run API.
          </div>
        </motion.form>
      </section>
    </div>
  );
}
