import { motorTrend } from "@/lib/mock-data";

export function TrendChart() {
  const max = 8;

  return (
    <div className="chart-wrap">
      <div className="chart-header">
        <div>
          <p className="eyebrow">7-day trend</p>
          <h3>Vibration rising rapidly</h3>
        </div>
        <span className="chart-value">7.26 mm/s</span>
      </div>
      <div className="bars" aria-label="MOTOR-04 vibration trend">
        {motorTrend.map((point) => (
          <div className="bar-column" key={point.day}>
            <div className="bar-track">
              <div className="bar" style={{ height: `${(point.vibration / max) * 100}%` }} />
            </div>
            <span>{point.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
