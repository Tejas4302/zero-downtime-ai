"use client";

import { Cloud, Database, LockKeyhole, Sparkles, UserRoundCheck } from "lucide-react";

import Protected from "@/components/Protected";
import { useAuth } from "@/components/AuthProvider";

const integrations = [
  {
    name: "Firebase Authentication",
    detail: "Identity, role and tenant claims",
    Icon: LockKeyhole,
  },
  {
    name: "Cloud Run API",
    detail: "Authenticated tenant-aware application layer",
    Icon: Cloud,
  },
  {
    name: "BigQuery",
    detail: "Operational serving tables and asset observations",
    Icon: Database,
  },
  {
    name: "Vertex AI Gemini",
    detail: "Grounded operations copilot",
    Icon: Sparkles,
  },
];

export default function Settings() {
  const { me } = useAuth();

  return (
    <Protected>
      <div className="hero">
        <div>
          <div className="eyebrow">Workspace configuration</div>
          <h1>
            <span className="gradient-text">Settings & system status</span>
          </h1>
          <p>Identity scope, platform integrations and security posture for your current session.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card">
          <div className="section-title section-title-tight">
            <div>
              <h2>Current identity</h2>
              <p>Verified from Firebase ID token claims</p>
            </div>
            <UserRoundCheck size={20} />
          </div>

          <div className="settings-list">
            <div className="settings-row">
              <span>Email</span>
              <strong>{me?.email}</strong>
            </div>
            <div className="settings-row">
              <span>Role</span>
              <strong>{me?.role?.replaceAll("_", " ")}</strong>
            </div>
            <div className="settings-row">
              <span>Tenant scope</span>
              <strong>{me?.client_id === "GLOBAL" ? "All clients" : me?.client_id}</strong>
            </div>
            <div className="settings-row">
              <span>User ID</span>
              <strong className="mono-value">{me?.uid}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-title section-title-tight">
            <div>
              <h2>Security posture</h2>
              <p>Controls currently enforced</p>
            </div>
            <LockKeyhole size={20} />
          </div>

          <div className="security-checks">
            <div><span className="status-dot" /> Firebase token verification</div>
            <div><span className="status-dot" /> Backend-enforced tenant isolation</div>
            <div><span className="status-dot" /> Role-based endpoint authorization</div>
            <div><span className="status-dot" /> Restricted production CORS origin</div>
            <div><span className="status-dot" /> BigQuery accessed server-side only</div>
          </div>
        </div>
      </div>

      <div className="section-title">
        <div>
          <h2>Platform integrations</h2>
          <span>Production services</span>
        </div>
      </div>

      <div className="grid grid-4 integration-grid">
        {integrations.map(({ name, detail, Icon }) => (
          <div className="card integration-card" key={name}>
            <div className="integration-icon">
              <Icon size={20} />
            </div>
            <strong>{name}</strong>
            <p>{detail}</p>
            <div className="integration-status">
              <span className="status-dot" />
              Connected
            </div>
          </div>
        ))}
      </div>
    </Protected>
  );
}
