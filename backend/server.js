const express = require("express");
const cors = require("cors");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { BigQuery } = require("@google-cloud/bigquery");

initializeApp({ projectId: "zero-downtime-ai-509413" });

const auth = getAuth();
const bigquery = new BigQuery({ projectId: "zero-downtime-ai-509413" });
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const CLIENT_MAP = {
  automotion: "AutoMotion Motors",
  packpro: "PackPro Industries",
  flowcore: "FlowCore Manufacturing",
  freshline: "FreshLine Foods"
};

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

    const decodedToken = await auth.verifyIdToken(header.substring(7));
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role,
      client_id: decodedToken.client_id
    };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Invalid or expired authentication token" });
  }
}

function getAuthorizedClient(req) {
  if (req.user.role === "super_admin") return null;
  return CLIENT_MAP[req.user.client_id];
}

app.get("/", (req, res) => {
  res.json({ service: "Zero Downtime API", status: "running" });
});

app.get("/api/me", authenticate, (req, res) => {
  res.json(req.user);
});

app.get("/api/summary", authenticate, async (req, res) => {
  try {
    const clientName = getAuthorizedClient(req);
    let query = `
      SELECT *
      FROM \`zero-downtime-ai-509413.zero_downtime.client_summary\`
    `;

    const options = { query, location: "asia-south1", params: {} };

    if (clientName) {
      options.query += " WHERE client_name = @clientName";
      options.params.clientName = clientName;
    }

    options.query += " ORDER BY downtime_risk_inr DESC";

    const [rows] = await bigquery.query(options);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load client summary" });
  }
});

app.get("/api/assets", authenticate, async (req, res) => {
  try {
    const clientName = getAuthorizedClient(req);
    let query = `
      SELECT
        client_name,
        plant_name,
        asset_id,
        equipment_type,
        machine_type,
        observation_timestamp,
        air_temperature_k,
        process_temperature_k,
        rotational_speed_rpm,
        torque_nm,
        tool_wear_min,
        machine_failure,
        failure_type,
        risk_level,
        health_score,
        recommended_action,
        maintenance_priority,
        estimated_downtime_hours,
        estimated_downtime_cost_inr
      FROM \`zero-downtime-ai-509413.zero_downtime.current_asset_health\`
    `;

    const options = { query, location: "asia-south1", params: {} };

    if (clientName) {
      options.query += " WHERE client_name = @clientName";
      options.params.clientName = clientName;
    }

    options.query += `
      ORDER BY
        CASE risk_level
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          ELSE 4
        END,
        health_score ASC
    `;

    const [rows] = await bigquery.query(options);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load asset data" });
  }
});

app.get("/api/alerts", authenticate, async (req, res) => {
  try {
    const clientName = getAuthorizedClient(req);
    let query = `
      SELECT *
      FROM \`zero-downtime-ai-509413.zero_downtime.active_alerts\`
    `;

    const options = { query, location: "asia-south1", params: {} };

    if (clientName) {
      options.query += " WHERE client_name = @clientName";
      options.params.clientName = clientName;
    }

    options.query += " ORDER BY alert_priority_rank ASC, health_score ASC";

    const [rows] = await bigquery.query(options);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load alerts" });
  }
});

app.get("/api/clients", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ error: "Super admin access required" });
    }

    const query = `
      SELECT *
      FROM \`zero-downtime-ai-509413.zero_downtime.client_summary\`
      ORDER BY client_name
    `;

    const [rows] = await bigquery.query({ query, location: "asia-south1" });
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load clients" });
  }
});

app.listen(PORT, () => {
  console.log(`Zero Downtime API listening on port ${PORT}`);
});
