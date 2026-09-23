export type Role = "super_admin" | "client_admin" | "standard";

export type Me = {
  uid: string;
  email: string;
  role: Role;
  client_id: string;
};

export type Summary = {
  client_name: string;
  total_assets: number;
  critical_assets: number;
  high_risk_assets: number;
  medium_risk_assets: number;
  healthy_assets: number;
  avg_health_score: number;
  estimated_downtime_hours: number;
  downtime_risk_inr: number;
  healthy_asset_percent: number;
};

export type Asset = {
  client_name: string;
  plant_name: string;
  asset_id: string;
  equipment_type: string;
  machine_type: string;
  observation_timestamp: { value?: string } | string;
  air_temperature_k: number;
  process_temperature_k: number;
  rotational_speed_rpm: number;
  torque_nm: number;
  tool_wear_min: number;
  machine_failure: number;
  failure_type: string;
  risk_level: string;
  health_score: number;
  recommended_action: string;
  maintenance_priority: string;
  estimated_downtime_hours: number;
  estimated_downtime_cost_inr: number;
};

export type AssetHistory = {
  client_name: string;
  plant_name: string;
  asset_id: string;
  equipment_type: string;
  observation_timestamp: { value?: string } | string;
  air_temperature_k: number;
  process_temperature_k: number;
  rotational_speed_rpm: number;
  torque_nm: number;
  tool_wear_min: number;
  machine_failure: number;
  failure_type: string;
  risk_level: string;
  health_score: number;
  recommended_action: string;
};

export type AppUser = {
  uid: string;
  email: string;
  role: Role;
  client_id: string;
  disabled: boolean;
  last_sign_in: string | null;
  created_at: string | null;
};
