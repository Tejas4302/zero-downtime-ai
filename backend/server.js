const express = require("express");
const cors = require("cors");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { BigQuery } = require("@google-cloud/bigquery");
const { GoogleGenAI } = require("@google/genai");

const PROJECT_ID = "zero-downtime-ai-509413";
const DATASET_ID = "zero_downtime";
const BIGQUERY_REGION = "asia-south1";
const VERTEX_LOCATION = "global";

initializeApp({ projectId: PROJECT_ID });

const auth = getAuth();
const bigquery = new BigQuery({ projectId: PROJECT_ID });
const genAI = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: VERTEX_LOCATION,
});

const app = express();
const PORT = process.env.PORT || 8080;

const ALLOWED_ORIGINS = [
  "https://zero-downtime-web-1052752541109.asia-south1.run.app",
];

const CLIENT_MAP = {
  automotion: "AutoMotion Motors",
  packpro: "PackPro Industries",
  flowcore: "FlowCore Manufacturing",
  freshline: "FreshLine Foods",
};

const ALLOWED_ROLES = new Set(["super_admin", "client_admin", "standard"]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "32kb" }));

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

    const decodedToken = await auth.verifyIdToken(header.substring(7));
    const role = decodedToken.role;
    const clientId = decodedToken.client_id;

    if (!role || !ALLOWED_ROLES.has(role)) {
      return res.status(403).json({ error: "Invalid user role" });
    }

    if (role === "super_admin" && clientId !== "GLOBAL") {
      return res.status(403).json({ error: "Invalid super admin scope" });
    }

    if (role !== "super_admin" && !CLIENT_MAP[clientId]) {
      return res.status(403).json({ error: "Invalid client scope" });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      role,
      client_id: clientId,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Invalid or expired authentication token" });
  }
}

function getAuthorizedClient(req) {
  const { role, client_id } = req.user;

  if (role === "super_admin" && client_id === "GLOBAL") return null;

  if (!["client_admin", "standard"].includes(role)) {
    throw new Error("Unauthorized role");
  }

  const clientName = CLIENT_MAP[client_id];
  if (!clientName) throw new Error("Invalid client scope");

  return clientName;
}

function requireSuperAdmin(req, res, next) {
  if (req.user.role !== "super_admin" || req.user.client_id !== "GLOBAL") {
    return res.status(403).json({ error: "Super admin access required" });
  }
  next();
}

function table(name) {
  return "`" + PROJECT_ID + "." + DATASET_ID + "." + name + "`";
}

app.get("/", (req, res) => {
  res.json({
    service: "Zero Downtime API",
    status: "running",
    region: BIGQUERY_REGION,
    copilot: "enabled",
  });
});

app.get("/api/me", authenticate, (req, res) => {
  res.json(req.user);
});

app.get("/api/summary", authenticate, async (req, res) => {
  try {
    const clientName = getAuthorizedClient(req);
    let query = "SELECT * FROM " + table("client_summary");
    const params = {};

    if (clientName) {
      query += " WHERE client_name = @clientName";
      params.clientName = clientName;
    }

    query += " ORDER BY downtime_risk_inr DESC";

    const [rows] = await bigquery.query({
      query,
      location: BIGQUERY_REGION,
      params,
    });

    res.json(rows);
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({ error: "Failed to load client summary" });
  }
});

app.get("/api/assets", authenticate, async (req, res) => {
  try {
    const clientName = getAuthorizedClient(req);

    let query =
      "SELECT client_name, plant_name, asset_id, equipment_type, machine_type, " +
      "observation_timestamp, air_temperature_k, process_temperature_k, " +
      "rotational_speed_rpm, torque_nm, tool_wear_min, machine_failure, " +
      "failure_type, risk_level, health_score, recommended_action, " +
      "maintenance_priority, estimated_downtime_hours, estimated_downtime_cost_inr " +
      "FROM " + table("current_asset_health");

    const params = {};

    if (clientName) {
      query += " WHERE client_name = @clientName";
      params.clientName = clientName;
    }

    query +=
      " ORDER BY CASE risk_level " +
      "WHEN 'Critical' THEN 1 " +
      "WHEN 'High' THEN 2 " +
      "WHEN 'Medium' THEN 3 " +
      "ELSE 4 END, health_score ASC";

    const [rows] = await bigquery.query({
      query,
      location: BIGQUERY_REGION,
      params,
    });

    res.json(rows);
  } catch (error) {
    console.error("Assets error:", error);
    res.status(500).json({ error: "Failed to load asset data" });
  }
});

app.get("/api/alerts", authenticate, async (req, res) => {
  try {
    const clientName = getAuthorizedClient(req);
    let query = "SELECT * FROM " + table("active_alerts");
    const params = {};

    if (clientName) {
      query += " WHERE client_name = @clientName";
      params.clientName = clientName;
    }

    query += " ORDER BY alert_priority_rank ASC, health_score ASC";

    const [rows] = await bigquery.query({
      query,
      location: BIGQUERY_REGION,
      params,
    });

    res.json(rows);
  } catch (error) {
    console.error("Alerts error:", error);
    res.status(500).json({ error: "Failed to load alerts" });
  }
});

app.get("/api/clients", authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const query =
      "SELECT * FROM " + table("client_summary") + " ORDER BY client_name";

    const [rows] = await bigquery.query({
      query,
      location: BIGQUERY_REGION,
    });

    res.json(rows);
  } catch (error) {
    console.error("Clients error:", error);
    res.status(500).json({ error: "Failed to load clients" });
  }
});


app.get("/api/users", authenticate, async (req, res) => {
  try {
    if (!["super_admin", "client_admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const result = [];
    let pageToken;

    do {
      const page = await auth.listUsers(1000, pageToken);

      for (const user of page.users) {
        const claims = user.customClaims || {};
        const role = claims.role;
        const clientId = claims.client_id;

        if (
          req.user.role === "client_admin" &&
          clientId !== req.user.client_id
        ) {
          continue;
        }

        if (!role) continue;

        result.push({
          uid: user.uid,
          email: user.email || "",
          role,
          client_id: clientId || "",
          disabled: user.disabled,
          last_sign_in: user.metadata.lastSignInTime || null,
          created_at: user.metadata.creationTime || null,
        });
      }

      pageToken = page.pageToken;
    } while (pageToken);

    result.sort((a, b) => a.email.localeCompare(b.email));
    res.json(result);
  } catch (error) {
    console.error("Users error:", error);
    res.status(500).json({ error: "Failed to load users" });
  }
});

app.get("/api/assets/:assetId/history", authenticate, async (req, res) => {
  try {
    const clientName = getAuthorizedClient(req);
    const assetId = String(req.params.assetId || "").trim();

    if (!assetId || assetId.length > 32) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }

    let query =
      "SELECT client_name, plant_name, asset_id, equipment_type, observation_timestamp, " +
      "air_temperature_k, process_temperature_k, rotational_speed_rpm, torque_nm, " +
      "tool_wear_min, machine_failure, failure_type, risk_level, health_score, recommended_action " +
      "FROM " + table("asset_observations") +
      " WHERE asset_id = @assetId";

    const params = { assetId };

    if (clientName) {
      query += " AND client_name = @clientName";
      params.clientName = clientName;
    }

    query += " ORDER BY observation_timestamp DESC LIMIT 48";

    const [rows] = await bigquery.query({
      query,
      location: BIGQUERY_REGION,
      params,
    });

    res.json(rows);
  } catch (error) {
    console.error("Asset history error:", error);
    res.status(500).json({ error: "Failed to load asset history" });
  }
});

app.post("/api/copilot", authenticate, async (req, res) => {
  try {
    const question =
      typeof req.body?.question === "string" ? req.body.question.trim() : "";

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    if (question.length > 1000) {
      return res.status(400).json({ error: "Question is too long" });
    }

    const clientName = getAuthorizedClient(req);

    let summaryQuery = "SELECT * FROM " + table("client_summary");
    const summaryParams = {};

    if (clientName) {
      summaryQuery += " WHERE client_name = @clientName";
      summaryParams.clientName = clientName;
    }

    summaryQuery += " ORDER BY downtime_risk_inr DESC";

    let alertQuery =
      "SELECT client_name, plant_name, asset_id, equipment_type, risk_level, " +
      "health_score, failure_type, recommended_action, maintenance_priority, " +
      "estimated_downtime_hours, estimated_downtime_cost_inr " +
      "FROM " + table("active_alerts");

    const alertParams = {};

    if (clientName) {
      alertQuery += " WHERE client_name = @clientName";
      alertParams.clientName = clientName;
    }

    alertQuery += " ORDER BY alert_priority_rank ASC, health_score ASC LIMIT 20";

    const [[summaryRows], [alertRows]] = await Promise.all([
      bigquery.query({
        query: summaryQuery,
        location: BIGQUERY_REGION,
        params: summaryParams,
      }),
      bigquery.query({
        query: alertQuery,
        location: BIGQUERY_REGION,
        params: alertParams,
      }),
    ]);

    const context = {
      scope: {
        role: req.user.role,
        client_id: req.user.client_id,
        client_name: clientName || "All clients",
      },
      portfolio_summary: summaryRows,
      active_alerts: alertRows,
    };

    const prompt = [
      "You are Zero Downtime Operations Copilot, an industrial operations assistant.",
      "",
      "Answer the user's question using only the authorised operational context below.",
      "",
      "Rules:",
      "- Never invent asset IDs, health scores, failure types, costs, downtime hours, or maintenance actions.",
      "- Respect the authorised tenant scope.",
      "- If the supplied data cannot answer the question, say so clearly.",
      "- Prioritise Critical, then High, then Medium risk.",
      "- Distinguish operational severity from financial downtime exposure.",
      "- Use INR for monetary values.",
      "- When suggesting maintenance action, use the provided recommended_action values.",
      "- Keep the response concise, practical, and suitable for plant operations teams.",
      "- For lists, highlight the most urgent items first.",
      "",
      "USER QUESTION:",
      question,
      "",
      "AUTHORISED OPERATIONAL CONTEXT:",
      JSON.stringify(context, null, 2),
    ].join("\n");

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: 900,
      },
    });

    const answer =
      typeof response.text === "string"
        ? response.text
        : "I could not generate a response from the available operational context.";

    res.json({
      answer,
      scope: clientName || "All clients",
    });
  } catch (error) {
    console.error("Copilot error:", error);
    res.status(500).json({ error: "Failed to generate copilot response" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);

  if (error.message === "Origin not allowed by CORS") {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log("Zero Downtime API listening on port " + PORT);
});
