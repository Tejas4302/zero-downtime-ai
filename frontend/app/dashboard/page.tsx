"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Gauge,
  IndianRupee,
  ShieldCheck,
  TimerReset,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Protected from "@/components/Protected";
import RiskBadge from "@/components/RiskBadge";
import { apiFetch } from "@/lib/api";
import type { Asset, Summary } from "@/lib/types";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

type KPI = {
  label: string;
  value: string | number;
  helper: string;
  Icon: LucideIcon;
};

export default function Dashboard() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [alerts, setAlerts] = useState<Asset[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<Summary[]>("/api/summary"),
      apiFetch<Asset[]>("/api/alerts"),
      apiFetch<Asset[]>("/api/assets"),
    ])
      .then(([summaryRows, alertRows, assetRows]) => {
        setSummaries(summaryRows);
        setAlerts(alertRows);
        setAssets(assetRows);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(
    () =>
      summaries.reduce(
        (acc, row) => ({
          assets: acc.assets + Number(row.total_assets || 0),
          critical: acc.critical + Number(row.critical_assets || 0),
          high: acc.high + Number(row.high_risk_assets || 0),
          medium: acc.medium + Number(row.medium_risk_assets || 0),
          healthy: acc.healthy + Number(row.healthy_assets || 0),
          risk: acc.risk + Number(row.downtime_risk_inr || 0),
          hours: acc.hours + Number(row.estimated_downtime_hours || 0),
          health: acc.health + Number(row.avg_health_score || 0),
        }),
        { assets: 0, critical: 0, high: 0, medium: 0, healthy: 0, risk: 0, hours: 0, health: 0 }
      ),
    [summaries]
  );

  const averageHealth = summaries.length ? totals.health / summaries.length : 0;
  const attentionCount = totals.critical + totals.high;
  const topAlerts = alerts.slice(0, 5);

  const recommendedMoveTitle = attentionCount
    ? "Resolve high-risk assets first"
    : "Operations are stable";

  const recommendedMoveDescription = attentionCount
    ? `${attentionCount} asset${attentionCount === 1 ? "" : "s"} currently require immediate or near-term attention. Sequence maintenance by operational urgency and financial exposure.`
    : "No critical or high-risk assets are currently detected in the authorised scope. Focus on preventive monitoring and emerging medium-risk conditions.";

  const actionPlanPrompt = attentionCount
    ? [
        "Build an action plan for the recommended next move: " + recommendedMoveTitle + ".",
        recommendedMoveDescription,
        topAlerts.length
          ? "Prioritise these current alerts: " +
            topAlerts
              .map(
                (asset) =>
                  asset.asset_id +
                  " (" +
                  asset.risk_level +
                  ", health " +
                  asset.health_score +
                  ", exposure " +
                  money(asset.estimated_downtime_cost_inr) +
                  ")"
              )
              .join("; ") +
            "."
          : "",
        "Give me the sequence of actions, why each action matters, expected operational impact, and what should be escalated today.",
      ]
        .filter(Boolean)
        .join(" ")
    : "Build a preventive operations action plan for the recommended next move: Operations are stable. Focus on preserving current health, watching emerging medium-risk conditions, and defining the next monitoring checkpoints.";

  const riskMix = [
    { name: "Critical", value: totals.critical },
    { name: "High", value: totals.high },
    { name: "Medium", value: totals.medium },
    { name: "Healthy", value: totals.healthy },
  ];

  const pieColors = ["#ff6b7a", "#ffb454", "#8a7dff", "#49d39d"];

  const kpis: KPI[] = [
    {
      label: "Assets monitored",
      value: totals.assets,
      helper: "Current authorised scope",
      Icon: Activity,
    },
    {
      label: "Needs attention",
      value: attentionCount,
      helper: `${totals.critical} critical · ${totals.high} high`,
      Icon: AlertTriangle,
    },
    {
      label: "Average health",
      value: averageHealth.toFixed(1),
      helper: "Portfolio health score / 100",
      Icon: Gauge,
    },
    {
      label: "Downtime exposure",
      value: money(totals.risk),
      helper: `${totals.hours} estimated downtime hours`,
      Icon: IndianRupee,
    },
  ];

  return (
    <Protected>
      <div className="hero dashboard-hero">
        <div>
          <div className="badge badge-low">
            <span className="status-dot" />
            Live operational view
          </div>
          <h1>
            <span className="gradient-text">Operations intelligence,</span> without the noise.
          </h1>
          <p>
            One decision layer for asset health, maintenance urgency and financial exposure across your authorised operations.
          </p>
        </div>
        <div className="hero-actions">
          <Link href="/copilot" className="btn btn-primary">
            <Bot size={16} />
            Ask Copilot
          </Link>
          <Link href="/alerts" className="btn">
            Review alerts
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      {error && <div className="notice notice-error">{error}</div>}

      {loading ? (
        <div className="grid grid-4">
          {[0, 1, 2, 3].map((item) => (
            <div className="card skeleton-card" key={item} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-4">
            {kpis.map(({ label, value, helper, Icon }, index) => (
              <motion.div
                className="card metric-card"
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="metric-icon">
                  <Icon size={18} />
                </div>
                <div className="metric-label">{label}</div>
                <div className="metric-value">{value}</div>
                <div className="metric-foot">{helper}</div>
              </motion.div>
            ))}
          </div>

          <div className="dashboard-grid-main">
            <div className="card">
              <div className="section-title section-title-tight">
                <div>
                  <h2>Downtime exposure</h2>
                  <p>Financial risk by client</p>
                </div>
                <span>INR</span>
              </div>
              <div className="chart-large">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summaries} margin={{ left: 4, right: 8, top: 12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.055)" />
                    <XAxis
                      dataKey="client_name"
                      tick={{ fill: "#8fa4ba", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fill: "#8fa4ba", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value) => money(Number(value))}
                      contentStyle={{
                        background: "#0d1b2e",
                        border: "1px solid rgba(255,255,255,.1)",
                        borderRadius: 14,
                      }}
                    />
                    <Bar dataKey="downtime_risk_inr" radius={[9, 9, 0, 0]} fill="#5aa7ff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="section-title section-title-tight">
                <div>
                  <h2>Portfolio risk mix</h2>
                  <p>Current asset distribution</p>
                </div>
                <ShieldCheck size={18} />
              </div>
              <div className="risk-mix-layout">
                <div className="chart-donut">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={riskMix} dataKey="value" innerRadius={46} outerRadius={67} paddingAngle={3} cx="50%" cy="50%">
                        {riskMix.map((entry, index) => (
                          <Cell key={entry.name} fill={pieColors[index]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#0d1b2e",
                          border: "1px solid rgba(255,255,255,.1)",
                          borderRadius: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="risk-legend">
                  {riskMix.map((item, index) => (
                    <div className="legend-row" key={item.name}>
                      <span className="legend-dot" style={{ background: pieColors[index] }} />
                      <span>{item.name}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-grid-secondary">
            <div className="card">
              <div className="section-title section-title-tight">
                <div>
                  <h2>Priority queue</h2>
                  <p>Highest urgency assets right now</p>
                </div>
                <Link href="/alerts" className="text-link">
                  View all <ArrowUpRight size={14} />
                </Link>
              </div>

              {topAlerts.length ? (
                <div className="priority-list">
                  {topAlerts.map((asset) => (
                    <div className="priority-row" key={`${asset.client_name}-${asset.asset_id}`}>
                      <div className="priority-main">
                        <div className="priority-title">
                          <strong>{asset.asset_id}</strong>
                          <RiskBadge risk={asset.risk_level} />
                        </div>
                        <span>
                          {asset.equipment_type} · {asset.plant_name}
                        </span>
                      </div>
                      <div className="priority-health">
                        <strong>{asset.health_score}</strong>
                        <span>Health</span>
                      </div>
                      <div className="priority-cost">
                        <strong>{money(asset.estimated_downtime_cost_inr)}</strong>
                        <span>Exposure</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty compact-empty">No active maintenance alerts.</div>
              )}
            </div>

            <div className="card decision-card">
              <div className="decision-icon">
                <Wrench size={21} />
              </div>
              <div>
                <div className="eyebrow">Recommended next move</div>
                <h2>{recommendedMoveTitle}</h2>
                <p>
                  {recommendedMoveDescription}
                </p>
              </div>
              <Link href={"/copilot?question=" + encodeURIComponent(actionPlanPrompt)} className="btn btn-primary decision-button">
                <Bot size={16} />
                Build action plan
              </Link>
            </div>
          </div>

          {assets.length > 0 && (
            <div className="data-freshness">
              <TimerReset size={14} />
              Monitoring {assets.length} current asset states from BigQuery
            </div>
          )}
        </>
      )}
    </Protected>
  );
}
