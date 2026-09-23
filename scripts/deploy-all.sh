#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-zero-downtime-ai-509413}"
REGION="${REGION:-asia-south1}"
BACKEND_SERVICE="${BACKEND_SERVICE:-zero-downtime-api}"
FRONTEND_SERVICE="${FRONTEND_SERVICE:-zero-downtime-web}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Using project: $PROJECT_ID"
gcloud config set project "$PROJECT_ID" >/dev/null

echo "==> Enabling required Google Cloud APIs"
gcloud services enable   run.googleapis.com   cloudbuild.googleapis.com   artifactregistry.googleapis.com   aiplatform.googleapis.com   bigquery.googleapis.com >/dev/null

echo "==> Validating backend"
cd "$ROOT_DIR/backend"
npm install
npm run check

echo "==> Deploying backend"
gcloud run deploy "$BACKEND_SERVICE"   --source .   --region "$REGION"   --allow-unauthenticated

echo "==> Validating frontend"
cd "$ROOT_DIR/frontend"

if [ ! -f ".env.local" ]; then
  echo "ERROR: frontend/.env.local is missing."
  echo "Copy frontend/.env.example to frontend/.env.local and fill in Firebase values."
  exit 1
fi

npm install
rm -rf .next
npm run build

echo "==> Deploying frontend"
gcloud run deploy "$FRONTEND_SERVICE"   --source .   --region "$REGION"   --allow-unauthenticated

echo
echo "Deployment complete."
echo "Frontend: https://zero-downtime-web-1052752541109.asia-south1.run.app"
echo "Backend:  https://zero-downtime-api-1052752541109.asia-south1.run.app"
