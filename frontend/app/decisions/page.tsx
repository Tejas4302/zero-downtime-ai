"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Plus, Sparkles } from "lucide-react";

import Protected from "@/components/Protected";
import { apiFetch } from "@/lib/api";
import type { Decision, WorkspaceState } from "@/lib/types";

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("Operations");
  const [rationale, setRationale] = useState("");
  const [impact, setImpact] = useState("");

  useEffect(() => {
    apiFetch<WorkspaceState>("/api/workspace").then((workspace) => {
      setDecisions(workspace.decisions || []);

      const params = new URLSearchParams(window.location.search);

      if (params.get("from") === "brief") {
        try {
          const rawBrief = localStorage.getItem("zero-downtime-decision-brief");
          if (rawBrief) {
            const brief = JSON.parse(rawBrief);
            setTitle(brief.title || "AI Decision Brief");
            setRationale(String(brief.brief || "").slice(0, 1200));
            setImpact("Generated from AI Analyst evidence and decision-brief workflow.");
          }
        } catch {
          // Ignore malformed brief handoff.
        }
      }

      const scenario = params.get("scenario");
      if (scenario) {
        try {
          const parsed = JSON.parse(scenario);
          setTitle("Approve scenario: " + (parsed.name || "Scenario"));
          setRationale(
            "Scenario proposes " +
              Number(parsed.reduction || 0) +
              "% downtime exposure reduction."
          );
          setImpact(
            "Illustrative net benefit: INR " +
              new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
                Number(parsed.netBenefit || 0)
              )
          );
        } catch {
          // Ignore malformed handoff.
        }
      }
    });
  }, []);

  async function persist(next: Decision[]) {
    setDecisions(next);
    await apiFetch("/api/workspace", {
      method: "PUT",
      body: JSON.stringify({ decisions: next }),
    });
  }

  async function addDecision() {
    if (!title.trim()) return;

    const decision: Decision = {
      id: "decision-" + Date.now(),
      title: title.trim(),
      status: "Draft",
      owner: owner.trim() || "Operations",
      rationale: rationale.trim(),
      expectedImpact: impact.trim(),
      sourceType: window.location.search.includes("from=brief")
        ? "AI"
        : window.location.search.includes("scenario=")
        ? "Scenario"
        : "Manual",
      createdAt: Date.now(),
    };

    await persist([decision, ...decisions]);
    setTitle("");
    setRationale("");
    setImpact("");
  }

  async function advance(decision: Decision) {
    const nextStatus =
      decision.status === "Draft"
        ? "Review"
        : decision.status === "Review"
        ? "Approved"
        : "Approved";

    await persist(
      decisions.map((item) =>
        item.id === decision.id ? { ...item, status: nextStatus } : item
      )
    );
  }

  return (
    <Protected>
      <div className="hero">
        <div>
          <div className="badge badge-low">
            <ClipboardList size={12} />
            Decision Board
          </div>
          <h1>
            <span className="gradient-text">Turn analysis into accountable decisions</span>
          </h1>
          <p>
            Capture rationale, ownership, expected impact and decision status in one persistent board.
          </p>
        </div>
      </div>

      <div className="decision-board-layout">
        <div className="card decision-create-card">
          <div className="section-title section-title-tight">
            <div>
              <h2>New decision</h2>
              <p>From AI, scenario, or manual review</p>
            </div>
            <Plus size={18} />
          </div>

          <label className="scenario-field">
            <span>Decision title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <label className="scenario-field">
            <span>Owner</span>
            <input value={owner} onChange={(event) => setOwner(event.target.value)} />
          </label>

          <label className="scenario-field">
            <span>Rationale</span>
            <textarea value={rationale} onChange={(event) => setRationale(event.target.value)} />
          </label>

          <label className="scenario-field">
            <span>Expected impact</span>
            <textarea value={impact} onChange={(event) => setImpact(event.target.value)} />
          </label>

          <button className="btn btn-primary" onClick={addDecision}>
            <Plus size={15} />
            Add to board
          </button>
        </div>

        <div className="decision-columns">
          {(["Draft", "Review", "Approved"] as const).map((status) => (
            <div className="decision-column" key={status}>
              <div className="decision-column-header">
                <span>{status}</span>
                <strong>{decisions.filter((item) => item.status === status).length}</strong>
              </div>

              <div className="decision-column-stack">
                {decisions
                  .filter((item) => item.status === status)
                  .map((decision) => (
                    <div className="card decision-item" key={decision.id}>
                      <div className="decision-item-top">
                        <strong>{decision.title}</strong>
                        {decision.sourceType === "AI" && <Sparkles size={14} />}
                        {decision.status === "Approved" && <CheckCircle2 size={14} />}
                      </div>
                      <span>{decision.owner}</span>
                      <p>{decision.rationale || "No rationale captured yet."}</p>
                      {decision.expectedImpact && <small>{decision.expectedImpact}</small>}

                      {decision.status !== "Approved" && (
                        <button className="btn decision-advance" onClick={() => advance(decision)}>
                          Move to {decision.status === "Draft" ? "Review" : "Approved"}
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Protected>
  );
}
