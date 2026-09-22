CREATE OR REPLACE TABLE
  `zero-downtime-ai-509413.zero_downtime.client_summary` AS
SELECT
  client_name,
  COUNT(*) AS total_assets,
  COUNTIF(risk_level = 'Critical') AS critical_assets,
  COUNTIF(risk_level = 'High') AS high_risk_assets,
  COUNTIF(risk_level = 'Medium') AS medium_risk_assets,
  COUNTIF(risk_level = 'Low') AS healthy_assets,
  ROUND(AVG(health_score), 1) AS avg_health_score,
  SUM(estimated_downtime_hours) AS estimated_downtime_hours,
  SUM(estimated_downtime_cost_inr) AS downtime_risk_inr,
  ROUND(100 * SAFE_DIVIDE(COUNTIF(risk_level = 'Low'), COUNT(*)), 1) AS healthy_asset_percent
FROM `zero-downtime-ai-509413.zero_downtime.current_asset_health`
GROUP BY client_name;

CREATE OR REPLACE TABLE
  `zero-downtime-ai-509413.zero_downtime.active_alerts` AS
SELECT
  client_name, plant_name, asset_id, equipment_type, observation_timestamp,
  risk_level, health_score, failure_type, recommended_action, maintenance_priority,
  estimated_downtime_hours, estimated_downtime_cost_inr,
  CASE
    WHEN risk_level = 'Critical' THEN 1
    WHEN risk_level = 'High' THEN 2
    WHEN risk_level = 'Medium' THEN 3
    ELSE 4
  END AS alert_priority_rank
FROM `zero-downtime-ai-509413.zero_downtime.current_asset_health`
WHERE risk_level IN ('Critical', 'High', 'Medium');
