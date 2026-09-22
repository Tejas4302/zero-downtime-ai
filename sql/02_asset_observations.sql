CREATE OR REPLACE TABLE
  `zero-downtime-ai-509413.zero_downtime.asset_observations` AS
WITH base AS (
  SELECT *, DIV(UDI - 1, 4) AS client_sequence
  FROM `zero-downtime-ai-509413.zero_downtime.asset_operations`
),
mapped AS (
  SELECT *, MOD(client_sequence, 25) + 1 AS asset_number,
         DIV(client_sequence, 25) AS observation_number
  FROM base
)
SELECT
  UDI, product_id, machine_type, client_name,
  CASE WHEN asset_number <= 13 THEN 'Plant 1' ELSE 'Plant 2' END AS plant_name,
  CASE
    WHEN client_name = 'AutoMotion Motors' THEN CONCAT('AM-', LPAD(CAST(asset_number AS STRING), 3, '0'))
    WHEN client_name = 'PackPro Industries' THEN CONCAT('PP-', LPAD(CAST(asset_number AS STRING), 3, '0'))
    WHEN client_name = 'FlowCore Manufacturing' THEN CONCAT('FC-', LPAD(CAST(asset_number AS STRING), 3, '0'))
    ELSE CONCAT('FL-', LPAD(CAST(asset_number AS STRING), 3, '0'))
  END AS asset_id,
  CASE
    WHEN client_name = 'AutoMotion Motors' THEN
      CASE MOD(asset_number, 4)
        WHEN 0 THEN 'CNC Machine'
        WHEN 1 THEN 'Robotic Welding Cell'
        WHEN 2 THEN 'Assembly Conveyor'
        ELSE 'Robotic Arm'
      END
    WHEN client_name = 'PackPro Industries' THEN
      CASE MOD(asset_number, 4)
        WHEN 0 THEN 'Filling Machine'
        WHEN 1 THEN 'Sealing Machine'
        WHEN 2 THEN 'Labeling Machine'
        ELSE 'Air Compressor'
      END
    WHEN client_name = 'FlowCore Manufacturing' THEN
      CASE MOD(asset_number, 4)
        WHEN 0 THEN 'Industrial Pump'
        WHEN 1 THEN 'Electric Motor'
        WHEN 2 THEN 'Air Compressor'
        ELSE 'Process Blower'
      END
    ELSE
      CASE MOD(asset_number, 4)
        WHEN 0 THEN 'Refrigeration Compressor'
        WHEN 1 THEN 'Mixer'
        WHEN 2 THEN 'Processing Conveyor'
        ELSE 'Packaging Machine'
      END
  END AS equipment_type,
  TIMESTAMP_ADD(TIMESTAMP('2026-09-01 00:00:00+00'), INTERVAL observation_number HOUR) AS observation_timestamp,
  observation_number,
  air_temperature_k, process_temperature_k, rotational_speed_rpm, torque_nm, tool_wear_min,
  machine_failure,TWF,HDF,PWF,OSF,RNF,
  CASE
    WHEN TWF = 1 THEN 'Tool Wear Failure'
    WHEN HDF = 1 THEN 'Heat Dissipation Failure'
    WHEN PWF = 1 THEN 'Power Failure'
    WHEN OSF = 1 THEN 'Overstrain Failure'
    WHEN RNF = 1 THEN 'Random Failure'
    WHEN machine_failure = 1 THEN 'Other Machine Failure'
    ELSE 'No Failure'
  END AS failure_type,
  risk_level,
  health_score,
  CASE
    WHEN TWF = 1 THEN 'Inspect and replace worn tooling'
    WHEN HDF = 1 THEN 'Inspect cooling system and thermal conditions'
    WHEN PWF = 1 THEN 'Inspect motor load and power delivery'
    WHEN OSF = 1 THEN 'Reduce mechanical load and inspect stressed components'
    WHEN RNF = 1 THEN 'Perform diagnostic inspection'
    WHEN machine_failure = 1 THEN 'Immediate maintenance inspection required'
    WHEN risk_level = 'High' THEN 'Schedule preventive maintenance'
    WHEN risk_level = 'Medium' THEN 'Monitor asset condition closely'
    ELSE 'Continue normal operation'
  END AS recommended_action
FROM mapped;
