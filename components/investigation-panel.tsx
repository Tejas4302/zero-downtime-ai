"use client";

import { useState } from "react";
import { investigation } from "@/lib/mock-data";

export function InvestigationPanel() {
  const [open, setOpen] = useState(false);

  return (
    <section className="panel investigation-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">AI investigation</p>
          <h2>Understand the risk before it becomes downtime</h2>
        </div>
        <button className="primary-button" onClick={() => setOpen(true)}>
          Investigate with AI
        </button>
      </div>

      {!open ? (
        <div className="empty-state">
          <div className="pulse-dot" />
          <div>
            <strong>MOTOR-04 has an active deterioration signal.</strong>
            <p>Run an investigation to connect telemetry, maintenance and spare-part context.</p>
          </div>
        </div>
      ) : (
        <div className="ai-result">
          <div className="result-topline">
            <div>
              <span className="severity">{investigation.severity} severity</span>
              <h3>{investigation.diagnosis}</h3>
            </div>
            <div className="confidence">
              <span>Confidence</span>
              <strong>{investigation.confidence}</strong>
            </div>
          </div>

          <div className="result-grid">
            <div>
              <p className="label">Probable root cause</p>
              <p>{investigation.rootCause}</p>
            </div>
            <div>
              <p className="label">Recommended action</p>
              <p>{investigation.action}</p>
            </div>
          </div>

          <div className="evidence-list">
            <p className="label">Evidence used</p>
            {investigation.evidence.map((item) => (
              <div className="evidence-row" key={item}>
                <span>✓</span>
                <p>{item}</p>
              </div>
            ))}
          </div>

          <div className="impact-box">
            <p className="label">Operational impact</p>
            <p>{investigation.impact}</p>
          </div>
        </div>
      )}
    </section>
  );
}
