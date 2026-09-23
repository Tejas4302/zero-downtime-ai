"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Factory,
  Radar,
  Sparkles,
} from "lucide-react";

import Protected from "@/components/Protected";
import { apiFetch } from "@/lib/api";
import type { MarketSignal, Summary } from "@/lib/types";

type IntelligenceResponse = {
  signals: MarketSignal[];
  operations: Summary[];
  disclaimer: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function IntelligencePage() {
  const [data, setData] = useState<IntelligenceResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<IntelligenceResponse>("/api/intelligence")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load intelligence"));
  }, []);

  const highestExposure = useMemo(() => {
    if (!data?.operations?.length) return null;
    return [...data.operations].sort(
      (a, b) => Number(b.downtime_risk_inr) - Number(a.downtime_risk_inr)
    )[0];
  }, [data]);

  const highImpactSignals = useMemo(
    () => data?.signals.filter((signal) => signal.impact === "High") || [],
    [data]
  );

  return (
    <Protected>
      <div className="hero">
        <div>
          <div className="badge badge-medium">
            <Radar size={12} />
            Marketplace intelligence
          </div>
          <h1>
            <span className="gradient-text">Cross-domain intelligence</span>
          </h1>
          <p>
            Connect external-looking market signals with internal operational risk so teams can reason beyond a single dashboard.
          </p>
        </div>
      </div>

      {error && <div className="notice notice-error">{error}</div>}

      {!data ? (
        <div className="card state-panel">
          <strong>Loading intelligence</strong>
          Connecting market and operational context…
        </div>
      ) : (
        <>
          <div className="grid grid-3">
            <div className="card compact-metric">
              <Factory size={18} />
              <div>
                <span>Operational scope</span>
                <strong>{data.operations.length}</strong>
              </div>
            </div>

            <div className="card compact-metric">
              <Radar size={18} />
              <div>
                <span>Market signals</span>
                <strong>{data.signals.length}</strong>
              </div>
            </div>

            <div className="card compact-metric">
              <Sparkles size={18} />
              <div>
                <span>High-impact signals</span>
                <strong>{highImpactSignals.length}</strong>
              </div>
            </div>
          </div>

          <div className="dashboard-grid-main">
            <div className="card">
              <div className="section-title section-title-tight">
                <div>
                  <h2>Marketplace signals</h2>
                  <p>Illustrative signals for prototype reasoning</p>
                </div>
                <Radar size={18} />
              </div>

              <div className="signal-list">
                {data.signals.map((signal) => {
                  const DirectionIcon =
                    signal.direction === "up"
                      ? ArrowUpRight
                      : signal.direction === "down"
                      ? ArrowDownRight
                      : ArrowRight;

                  return (
                    <div className="signal-card" key={signal.client_id + "-" + signal.id}>
                      <div className="signal-icon">
                        <DirectionIcon size={16} />
                      </div>
                      <div className="signal-main">
                        <div className="signal-meta">
                          <span>{signal.domain}</span>
                          <span>{signal.client_name}</span>
                        </div>
                        <strong>{signal.signal}</strong>
                        <p>{signal.note}</p>
                      </div>
                      <div className="signal-score">
                        <span>{signal.impact} impact</span>
                        <strong>{Math.round(signal.confidence * 100)}%</strong>
                        <small>confidence</small>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="data-disclaimer">{data.disclaimer}</div>
            </div>

            <div className="card cross-domain-card">
              <div className="section-title section-title-tight">
                <div>
                  <h2>Cross-domain reasoning</h2>
                  <p>Operational + marketplace context</p>
                </div>
                <BrainCircuit size={19} />
              </div>

              {highestExposure ? (
                <div className="cross-domain-content">
                  <div className="insight-callout">
                    <span>Primary operational exposure</span>
                    <strong>{highestExposure.client_name}</strong>
                    <p>
                      {money(Number(highestExposure.downtime_risk_inr))} current downtime exposure across{" "}
                      {highestExposure.total_assets} monitored assets.
                    </p>
                  </div>

                  <div className="reasoning-stack">
                    {highImpactSignals.slice(0, 3).map((signal) => (
                      <div key={signal.client_id + "-" + signal.id}>
                        <span>{signal.domain}</span>
                        <strong>{signal.signal}</strong>
                        <p>
                          Combine this signal with operational downtime exposure before prioritising intervention.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="state-panel">No operational context available.</div>
              )}
            </div>
          </div>
        </>
      )}
    </Protected>
  );
}
