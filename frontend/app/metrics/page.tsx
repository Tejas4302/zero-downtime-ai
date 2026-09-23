"use client";

import { useEffect, useState } from "react";
import { BookOpenCheck, Database, ShieldCheck } from "lucide-react";

import Protected from "@/components/Protected";
import { apiFetch } from "@/lib/api";
import type { MetricDefinition } from "@/lib/types";

type MetricsResponse = {
  metrics: MetricDefinition[];
  scope: string;
};

export default function MetricsPage() {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<MetricsResponse>("/api/metrics")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load metrics"));
  }, []);

  return (
    <Protected>
      <div className="hero">
        <div>
          <div className="badge badge-low">
            <BookOpenCheck size={12} />
            Metric governance
          </div>
          <h1>
            <span className="gradient-text">One definition of truth</span>
          </h1>
          <p>
            Certified metric definitions, formulas, owners and data sources used by dashboards and AI answers.
          </p>
        </div>
      </div>

      {error && <div className="notice notice-error">{error}</div>}

      {!data ? (
        <div className="card state-panel">
          <strong>Loading governed metrics</strong>
          Reading metric definitions…
        </div>
      ) : (
        <div className="metric-governance-grid">
          {data.metrics.map((metric) => (
            <div className="card metric-definition-card" key={metric.id}>
              <div className="metric-definition-top">
                <div>
                  <div className="metric-status">
                    <ShieldCheck size={13} />
                    {metric.status}
                  </div>
                  <h2>{metric.name}</h2>
                </div>
                <Database size={20} />
              </div>

              <p className="metric-definition-copy">{metric.definition}</p>

              <div className="metric-definition-list">
                <div>
                  <span>Formula</span>
                  <strong>{metric.formula}</strong>
                </div>
                <div>
                  <span>Owner</span>
                  <strong>{metric.owner}</strong>
                </div>
                <div>
                  <span>Source</span>
                  <strong>{metric.source}</strong>
                </div>
                <div>
                  <span>Cadence</span>
                  <strong>{metric.cadence}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Protected>
  );
}
