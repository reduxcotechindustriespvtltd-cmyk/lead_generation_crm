#!/usr/bin/env bash
# Run on the VPS, from the project directory (where docker-compose.prod.yml and .env live).
# First-time setup (bootstrap admin user) is a separate manual step — see DEPLOY.md.
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> Pulling latest code"
git pull

echo "==> Building images"
$COMPOSE build

echo "==> Running database migrations"
$COMPOSE --profile tools run --rm migrate

echo "==> Starting services"
$COMPOSE up -d

echo "==> Cleaning up unused images"
docker image prune -f

echo "==> Done. Recent app logs:"
$COMPOSE logs --tail=30 app
