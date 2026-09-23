"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FlaskConical, Save, TrendingUp } from "lucide-react";

import Protected from "@/components/Protected";
import { apiFetch } from "@/lib/api";
import type { Scenario, Summary, WorkspaceState } from "@/lib/types";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function ScenarioPage() {
  const [summary, setSummary] = useState<Summary[]>([]);
  const [saved, setSaved] = useState<Scenario[]>([]);
  const [name, setName] = useState("Maintenance acceleration");
  const [reduction, setReduction] = useState(35);
  const [interventionCost, setInterventionCost] = useState(120000);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<Summary[]>("/api/summary"),
      apiFetch<WorkspaceState>("/api/workspace"),
    ]).then(([summaryRows, workspace]) => {
      setSummary(summaryRows);
      setSaved(workspace.scenarios || []);

      if (new URLSearchParams(window.location.search).get("from") === "ai") {
        try {
          const raw = localStorage.getItem("zero-downtime-scenario-handoff");
          if (raw) {
            const handoff = JSON.parse(raw);
            setName("AI Analyst recommendation scenario");

            const exposure = Array.isArray(handoff.evidence)
              ? handoff.evidence
                  .filter((item: { unit?: string }) =>
                    String(item.unit || "").toLowerCase().includes("inr")
                  )
                  .reduce(
                    (sum: number, item: { value?: number }) => sum + Number(item.value || 0),
                    0
                  )
              : 0;

            if (exposure > 0) {
              setInterventionCost(Math.round(exposure * 0.2));
            }
          }
        } catch {
          // Ignore malformed handoff data.
        }
      }
    });
  }, []);

  const baselineExposure = useMemo(
    () => summary.reduce((total, row) => total + Number(row.downtime_risk_inr || 0), 0),
    [summary]
  );

  const outcome = useMemo(() => {
    const avoidedLoss = baselineExposure * (reduction / 100);
    const netBenefit = avoidedLoss - interventionCost;
    const roiPercent = interventionCost > 0 ? (netBenefit / interventionCost) * 100 : 0;

    return {
      avoidedLoss,
      netBenefit,
      roiPercent,
      residualExposure: Math.max(0, baselineExposure - avoidedLoss),
    };
  }, [baselineExposure, reduction, interventionCost]);

  async function saveScenario() {
    const scenario: Scenario = {
      id: "scenario-" + Date.now(),
      name: name.trim() || "Untitled scenario",
      baselineExposure,
      downtimeReductionPercent: reduction,
      interventionCost,
      avoidedLoss: outcome.avoidedLoss,
      netBenefit: outcome.netBenefit,
      roiPercent: outcome.roiPercent,
      createdAt: Date.now(),
    };

    const next = [scenario, ...saved].slice(0, 20);
    setSaved(next);
    await apiFetch("/api/workspace", {
      method: "PUT",
      body: JSON.stringify({ scenarios: next }),
    });
    setSavedMessage("Scenario saved to your workspace.");
    setTimeout(() => setSavedMessage(""), 2500);
  }

  return (
    <Protected>
      <div className="hero">
        <div>
          <div className="badge badge-medium">
            <FlaskConical size={12} />
            Scenario Lab
          </div>
          <h1>
            <span className="gradient-text">Test decisions before acting</span>
          </h1>
          <p>
            Model maintenance interventions against current downtime exposure and carry the result into the Decision Board.
          </p>
        </div>
      </div>

      <div className="scenario-layout">
        <div className="card scenario-controls">
          <div className="section-title section-title-tight">
            <div>
              <h2>Scenario assumptions</h2>
              <p>Adjust the levers below</p>
            </div>
          </div>

          <label className="scenario-field">
            <span>Scenario name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <div className="scenario-field">
            <div className="scenario-label-row">
              <span>Downtime exposure reduction</span>
              <strong>{reduction}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={reduction}
              onChange={(event) => setReduction(Number(event.target.value))}
            />
          </div>

          <label className="scenario-field">
            <span>Intervention cost (INR)</span>
            <input
              type="number"
              min="0"
              value={interventionCost}
              onChange={(event) => setInterventionCost(Number(event.target.value))}
            />
          </label>

          <button className="btn btn-primary scenario-save" onClick={saveScenario}>
            <Save size={15} />
            Save scenario
          </button>

          {savedMessage && <div className="success-note">{savedMessage}</div>}
        </div>

        <div className="scenario-results">
          <div className="grid grid-2">
            <div className="card scenario-kpi">
              <span>Baseline exposure</span>
              <strong>{money(baselineExposure)}</strong>
              <small>Current authorised scope</small>
            </div>
            <div className="card scenario-kpi">
              <span>Residual exposure</span>
              <strong>{money(outcome.residualExposure)}</strong>
              <small>After scenario reduction</small>
            </div>
            <div className="card scenario-kpi">
              <span>Avoided loss</span>
              <strong>{money(outcome.avoidedLoss)}</strong>
              <small>Estimated scenario benefit</small>
            </div>
            <div className="card scenario-kpi">
              <span>Net benefit</span>
              <strong>{money(outcome.netBenefit)}</strong>
              <small>After intervention cost</small>
            </div>
          </div>

          <div className="card scenario-roi-card">
            <div>
              <span>Illustrative ROI</span>
              <strong>{outcome.roiPercent.toFixed(1)}%</strong>
              <p>
                This is a deterministic prototype scenario calculation, not a financial forecast.
              </p>
            </div>
            <TrendingUp size={32} />
          </div>

          <Link
            href={
              "/decisions?scenario=" +
              encodeURIComponent(
                JSON.stringify({
                  name,
                  netBenefit: outcome.netBenefit,
                  reduction,
                })
              )
            }
            className="btn scenario-handoff"
          >
            Send to Decision Board
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <div className="section-title">
        <div>
          <h2>Saved scenarios</h2>
          <span>Persistent workspace history</span>
        </div>
      </div>

      <div className="scenario-history-grid">
        {saved.length ? (
          saved.map((scenario) => (
            <div className="card saved-scenario-card" key={scenario.id}>
              <strong>{scenario.name}</strong>
              <span>{scenario.downtimeReductionPercent}% exposure reduction</span>
              <p>{money(scenario.netBenefit)} net benefit</p>
            </div>
          ))
        ) : (
          <div className="card state-panel">
            <strong>No saved scenarios yet</strong>
            Create your first scenario above.
          </div>
        )}
      </div>
    </Protected>
  );
}
