CREATE OR REPLACE TABLE
  `zero-downtime-ai-509413.zero_downtime.asset_operations` AS
SELECT
  UDI,
  `Product ID` AS product_id,
  Type AS machine_type,
  CASE
    WHEN MOD(UDI, 4) = 0 THEN 'AutoMotion Motors'
    WHEN MOD(UDI, 4) = 1 THEN 'PackPro Industries'
    WHEN MOD(UDI, 4) = 2 THEN 'FlowCore Manufacturing'
    ELSE 'FreshLine Foods'
  END AS client_name,
  CASE
    WHEN MOD(UDI, 8) IN (0,1) THEN 'Plant 1'
    WHEN MOD(UDI, 8) IN (2,3) THEN 'Plant 2'
    WHEN MOD(UDI, 8) IN (4,5) THEN 'Plant 3'
    ELSE 'Plant 4'
  END AS plant_name,
  CONCAT('ASSET-', CAST(UDI AS STRING)) AS asset_id,
  `Air temperature _K_` AS air_temperature_k,
  `Process temperature _K_` AS process_temperature_k,
  `Rotational speed _rpm_` AS rotational_speed_rpm,
  `Torque _Nm_` AS torque_nm,
  `Tool wear _min_` AS tool_wear_min,
  `Machine failure` AS machine_failure,
  TWF,HDF,PWF,OSF,RNF,
  CASE
    WHEN `Machine failure` = 1 THEN 'Critical'
    WHEN `Tool wear _min_` > 200 THEN 'High'
    WHEN `Tool wear _min_` > 150 THEN 'Medium'
    ELSE 'Low'
  END AS risk_level,
  CASE
    WHEN `Machine failure` = 1 THEN 35
    WHEN `Tool wear _min_` > 200 THEN 55
    WHEN `Tool wear _min_` > 150 THEN 70
    ELSE 90
  END AS health_score
FROM `zero-downtime-ai-509413.zero_downtime.machine_sensor_data`;
