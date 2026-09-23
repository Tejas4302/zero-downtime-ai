"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, Activity, Thermometer, Gauge, Wrench } from "lucide-react";

import Protected from "@/components/Protected";
import RiskBadge from "@/components/RiskBadge";
import { apiFetch } from "@/lib/api";
import type { Asset, AssetHistory } from "@/lib/types";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function Assets() {
  const [data, setData] = useState<Asset[]>([]);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [plantFilter, setPlantFilter] = useState("All");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [history, setHistory] = useState<AssetHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState("");\n  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    apiFetch<Asset[]>("/api/assets").then(setData);
  }, []);

  useEffect(() => {
    if (!selected) {
      setHistory([]);
      return;
    }

    setHistoryLoading(true);
    apiFetch<AssetHistory[]>(`/api/assets/${encodeURIComponent(selected.asset_id)}/history`)
      .then(setHistory)
      .finally(() => setHistoryLoading(false));
  }, [selected]);

  const plants = useMemo(
    () => ["All", ...Array.from(new Set(data.map((asset) => asset.plant_name))).sort()],
    [data]
  );

  const filtered = useMemo(() => {
    return data.filter((asset) => {
      const matchesSearch = `${asset.asset_id} ${asset.equipment_type} ${asset.plant_name} ${asset.failure_type}`
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesRisk = riskFilter === "All" || asset.risk_level === riskFilter;
      const matchesPlant = plantFilter === "All" || asset.plant_name === plantFilter;

      return matchesSearch && matchesRisk && matchesPlant;
    });
  }, [data, query, riskFilter, plantFilter]);

  const healthClass = (score: number) => {
    if (score < 50) return "health-fill critical";
    if (score < 65) return "health-fill high";
    if (score < 80) return "health-fill medium";
    return "health-fill low";
  };

  return (
    <Protected>
      <div className="hero">
        <div>
          <div className="eyebrow">Asset intelligence</div>
          <h1>
            <span className="gradient-text">Asset health</span>
          </h1>
          <p>Search, filter and inspect the latest operating state across your authorised asset fleet.</p>
        </div>
      </div>

      {error && <div className="notice notice-error page-error">{error}</div>}\n\n      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search asset, equipment, plant or failure type"
          />
        </div>

        <div className="filter-group">
          <SlidersHorizontal size={15} />
          <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
            {["All", "Critical", "High", "Medium", "Low"].map((risk) => (
              <option value={risk} key={risk}>
                {risk === "All" ? "All risk levels" : risk}
              </option>
            ))}
          </select>

          <select value={plantFilter} onChange={(event) => setPlantFilter(event.target.value)}>
            {plants.map((plant) => (
              <option value={plant} key={plant}>
                {plant === "All" ? "All plants" : plant}
              </option>
            ))}
          </select>
        </div>

        <div className="result-count">
          {filtered.length} of {data.length} assets
        </div>
      </div>

      {loading ? (\n        <div className="card state-panel"><strong>Loading asset health</strong>Fetching the latest authorised asset states…</div>\n      ) : filtered.length === 0 ? (\n        <div className="card state-panel"><strong>No assets found</strong>Adjust the search or filters to see more assets.</div>\n      ) : (\n      <div className="table-wrap asset-table">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Equipment</th>
              <th>Plant</th>
              <th>Health</th>
              <th>Risk</th>
              <th>Failure type</th>
              <th>Maintenance</th>
              <th>Exposure</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((asset) => (
              <tr
                key={`${asset.client_name}-${asset.asset_id}`}
                onClick={() => setSelected(asset)}
                className="clickable-row"
              >
                <td>
                  <strong>{asset.asset_id}</strong>
                  <div className="subtle-text">{asset.client_name}</div>
                </td>
                <td>{asset.equipment_type}</td>
                <td>{asset.plant_name}</td>
                <td>
                  <div className="health-cell">
                    <strong>{asset.health_score}</strong>
                    <div className="health-track">
                      <div
                        className={healthClass(asset.health_score)}
                        style={{ width: `${Math.max(4, Math.min(100, asset.health_score))}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <RiskBadge risk={asset.risk_level} />
                </td>
                <td>{asset.failure_type}</td>
                <td>{asset.maintenance_priority}</td>
                <td>{money(asset.estimated_downtime_cost_inr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="drawer-backdrop" onClick={() => setSelected(null)}>
          <aside className="asset-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <div className="eyebrow">{selected.plant_name}</div>
                <h2>{selected.asset_id}</h2>
                <p>{selected.equipment_type}</p>
              </div>
              <button className="icon-button" onClick={() => setSelected(null)} aria-label="Close asset details">
                <X size={18} />
              </button>
            </div>

            <div className="drawer-risk-row">
              <RiskBadge risk={selected.risk_level} />
              <span>{selected.maintenance_priority}</span>
            </div>

            <div className="asset-health-hero">
              <div>
                <span>Health score</span>
                <strong>{selected.health_score}</strong>
              </div>
              <div>
                <span>Downtime exposure</span>
                <strong>{money(selected.estimated_downtime_cost_inr)}</strong>
              </div>
            </div>

            <div className="sensor-grid">
              <div className="sensor-card">
                <Thermometer size={17} />
                <span>Air temp</span>
                <strong>{selected.air_temperature_k} K</strong>
              </div>
              <div className="sensor-card">
                <Thermometer size={17} />
                <span>Process temp</span>
                <strong>{selected.process_temperature_k} K</strong>
              </div>
              <div className="sensor-card">
                <Activity size={17} />
                <span>Speed</span>
                <strong>{selected.rotational_speed_rpm} rpm</strong>
              </div>
              <div className="sensor-card">
                <Gauge size={17} />
                <span>Torque</span>
                <strong>{selected.torque_nm} Nm</strong>
              </div>
            </div>

            <div className="drawer-section">
              <div className="drawer-section-title">
                <Wrench size={16} />
                Recommended action
              </div>
              <p>{selected.recommended_action}</p>
            </div>

            <div className="drawer-section">
              <div className="drawer-section-title">Recent observations</div>
              {historyLoading ? (
                <div className="subtle-text">Loading history...</div>
              ) : historyError ? (\n                <div className="error">{historyError}</div>\n              ) : history.length ? (
                <div className="history-list">
                  {history.slice(0, 6).map((row, index) => (
                    <div className="history-row" key={index}>
                      <div>
                        <strong>{row.health_score}</strong>
                        <span>Health</span>
                      </div>
                      <div>
                        <strong>{row.tool_wear_min}</strong>
                        <span>Tool wear</span>
                      </div>
                      <div>
                        <strong>{row.risk_level}</strong>
                        <span>Risk</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="subtle-text">No history available.</div>
              )}
            </div>
          </aside>
        </div>
      )}
    </Protected>
  );
}
