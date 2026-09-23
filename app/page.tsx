import { InvestigationPanel } from "@/components/investigation-panel";
import { TrendChart } from "@/components/trend-chart";
import { assets, plantKpis } from "@/lib/mock-data";

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">ZD</div>
          <div>
            <strong>Zero Downtime</strong>
            <span>Operations intelligence</span>
          </div>
        </div>

        <nav>
          <a className="nav-active" href="#overview">Overview</a>
          <a href="#assets">Assets</a>
          <a href="#investigation">Investigations</a>
          <a href="#quality">Quality</a>
          <a href="#supply">Supply chain</a>
        </nav>

        <div className="plant-chip">
          <span className="online-dot" />
          <div>
            <strong>Asteron Plant 01</strong>
            <small>Bengaluru · Live</small>
          </div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Command center</p>
            <h1>Keep the factory moving.</h1>
            <p className="subtitle">
              Detect operational risk early, understand what is driving it, and decide what to do next.
            </p>
          </div>
          <div className="topbar-actions">
            <span className="status-pill">Live demo data</span>
            <div className="avatar">TM</div>
          </div>
        </header>

        <section className="kpi-grid" id="overview">
          {plantKpis.map((kpi) => (
            <article className="kpi-card" key={kpi.label}>
              <p>{kpi.label}</p>
              <strong>{kpi.value}</strong>
              <span>{kpi.meta}</span>
            </article>
          ))}
        </section>

        <section className="main-grid">
          <article className="panel risk-card">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">Highest operational risk</p>
                <h2>MOTOR-04</h2>
              </div>
              <span className="risk-badge">High risk</span>
            </div>

            <div className="machine-summary">
              <div className="health-ring">
                <strong>47</strong>
                <span>health</span>
              </div>
              <div className="machine-copy">
                <h3>Bearing degradation suspected</h3>
                <p>
                  Utility motor supporting plant operations. Vibration and housing temperature have risen steadily over the last 7 days.
                </p>
                <div className="metric-row">
                  <div><span>Peak vibration</span><strong>7.26 mm/s</strong></div>
                  <div><span>Peak temperature</span><strong>71.1°C</strong></div>
                  <div><span>Open fault</span><strong>VIB-HIGH</strong></div>
                </div>
              </div>
            </div>
          </article>

          <article className="panel">
            <TrendChart />
          </article>
        </section>

        <section className="panel asset-panel" id="assets">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Asset health</p>
              <h2>Watch what needs attention</h2>
            </div>
            <button className="secondary-button">View all assets</button>
          </div>

          <div className="asset-table">
            <div className="asset-row asset-head">
              <span>Asset</span><span>Area</span><span>Health</span><span>Status</span><span>Current signal</span>
            </div>
            {assets.map((asset) => (
              <div className="asset-row" key={asset.id}>
                <strong>{asset.id}</strong>
                <span>{asset.line}</span>
                <span>{asset.health}%</span>
                <span className={`asset-status ${asset.status}`}>{asset.status}</span>
                <span>{asset.issue}</span>
              </div>
            ))}
          </div>
        </section>

        <div id="investigation">
          <InvestigationPanel />
        </div>
      </section>
    </main>
  );
}
