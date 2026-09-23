"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Bot, Filter, ShieldAlert } from "lucide-react";

import Protected from "@/components/Protected";
import RiskBadge from "@/components/RiskBadge";
import { apiFetch } from "@/lib/api";
import type { Asset } from "@/lib/types";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function Alerts() {
  const [data, setData] = useState<Asset[]>([]);
  const [risk, setRisk] = useState("All");

  useEffect(() => {
    apiFetch<Asset[]>("/api/alerts").then(setData);
  }, []);

  const visible = useMemo(
    () => data.filter((item) => risk === "All" || item.risk_level === risk),
    [data, risk]
  );

  const counts = useMemo(
    () => ({
      Critical: data.filter((item) => item.risk_level === "Critical").length,
      High: data.filter((item) => item.risk_level === "High").length,
      Medium: data.filter((item) => item.risk_level === "Medium").length,
    }),
    [data]
  );

  return (
    <Protected>
      <div className="hero">
        <div>
          <div className="eyebrow">Maintenance command queue</div>
          <h1>
            <span className="gradient-text">Active alerts</span>
          </h1>
          <p>Prioritised maintenance conditions ranked by urgency and financial exposure.</p>
        </div>
        <Link href="/copilot" className="btn btn-primary">
          <Bot size={16} />
          Build action plan
        </Link>
      </div>

      <div className="alert-summary-strip">
        <div>
          <span>Critical</span>
          <strong>{counts.Critical}</strong>
        </div>
        <div>
          <span>High</span>
          <strong>{counts.High}</strong>
        </div>
        <div>
          <span>Medium</span>
          <strong>{counts.Medium}</strong>
        </div>
        <div className="alert-filter">
          <Filter size={15} />
          <select value={risk} onChange={(event) => setRisk(event.target.value)}>
            {["All", "Critical", "High", "Medium"].map((value) => (
              <option value={value} key={value}>
                {value === "All" ? "All active alerts" : value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visible.length ? (
        <div className="alert-stack">
          {visible.map((asset) => (
            <div className="card alert-row-card" key={`${asset.client_name}-${asset.asset_id}`}>
              <div className="alert-row-main">
                <div className="alert-icon">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <div className="priority-title">
                    <strong>{asset.asset_id}</strong>
                    <RiskBadge risk={asset.risk_level} />
                  </div>
                  <span>
                    {asset.equipment_type} · {asset.plant_name}
                  </span>
                </div>
              </div>

              <div className="alert-stat">
                <span>Health</span>
                <strong>{asset.health_score}</strong>
              </div>

              <div className="alert-stat">
                <span>Failure type</span>
                <strong>{asset.failure_type}</strong>
              </div>

              <div className="alert-stat">
                <span>Priority</span>
                <strong>{asset.maintenance_priority}</strong>
              </div>

              <div className="alert-stat">
                <span>Exposure</span>
                <strong>{money(asset.estimated_downtime_cost_inr)}</strong>
              </div>

              <Link
                className="icon-button"
                href={`/copilot?question=${encodeURIComponent(
                  `What should we do about asset ${asset.asset_id} and why?`
                )}`}
                aria-label={`Ask Copilot about ${asset.asset_id}`}
              >
                <ArrowUpRight size={17} />
              </Link>

              <div className="alert-action-copy">
                <span>Recommended action</span>
                <p>{asset.recommended_action}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty">
          No alerts match the selected filter.
        </div>
      )}
    </Protected>
  );
}
