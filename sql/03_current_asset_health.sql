CREATE OR REPLACE TABLE
  `zero-downtime-ai-509413.zero_downtime.current_asset_health` AS
WITH latest AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY client_name, asset_id
      ORDER BY observation_timestamp DESC
    ) AS rn
  FROM `zero-downtime-ai-509413.zero_downtime.asset_observations`
)
SELECT
  client_name, plant_name, asset_id, equipment_type, machine_type, observation_timestamp,
  air_temperature_k, process_temperature_k, rotational_speed_rpm, torque_nm, tool_wear_min,
  machine_failure, failure_type, risk_level, health_score, recommended_action,
  CASE
    WHEN risk_level = 'Critical' THEN 'Immediate'
    WHEN risk_level = 'High' THEN 'Within 24 Hours'
    WHEN risk_level = 'Medium' THEN 'Within 7 Days'
    ELSE 'Routine'
  END AS maintenance_priority,
  CASE
    WHEN risk_level = 'Critical' THEN 8
    WHEN risk_level = 'High' THEN 4
    WHEN risk_level = 'Medium' THEN 2
    ELSE 0
  END AS estimated_downtime_hours,
  CASE
    WHEN client_name = 'AutoMotion Motors' THEN
      CASE WHEN risk_level = 'Critical' THEN 180000 WHEN risk_level = 'High' THEN 90000 WHEN risk_level = 'Medium' THEN 40000 ELSE 0 END
    WHEN client_name = 'PackPro Industries' THEN
      CASE WHEN risk_level = 'Critical' THEN 120000 WHEN risk_level = 'High' THEN 60000 WHEN risk_level = 'Medium' THEN 25000 ELSE 0 END
    WHEN client_name = 'FlowCore Manufacturing' THEN
      CASE WHEN risk_level = 'Critical' THEN 150000 WHEN risk_level = 'High' THEN 75000 WHEN risk_level = 'Medium' THEN 30000 ELSE 0 END
    ELSE
      CASE WHEN risk_level = 'Critical' THEN 100000 WHEN risk_level = 'High' THEN 50000 WHEN risk_level = 'Medium' THEN 20000 ELSE 0 END
  END AS estimated_downtime_cost_inr
FROM latest
WHERE rn = 1;
