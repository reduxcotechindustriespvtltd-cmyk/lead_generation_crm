#!/usr/bin/env bash
# Sync runtime env vars from .env to a linked Vercel project.
# Usage: ./scripts/vercel-env-sync.sh [production|preview|development]
set -euo pipefail

TARGET="${1:-production}"
ENV_FILE="${ENV_FILE:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

# Runtime vars only — bootstrap/admin secrets are not needed on Vercel after first setup.
VARS=(
  DATABASE_URL
  JWT_ACCESS_SECRET
  APP_URL
  META_TOKEN_ENCRYPTION_KEY
  META_WEBHOOK_VERIFY_TOKEN
  META_APP_SECRET
  META_GRAPH_API_VERSION
)

for key in "${VARS[@]}"; do
  value="$(grep -E "^${key}=" "$ENV_FILE" | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//')"
  if [[ -z "${value:-}" ]]; then
    echo "Skip $key (empty)"
    continue
  fi
  printf '%s' "$value" | npx vercel env add "$key" "$TARGET" --force >/dev/null
  echo "Set $key for $TARGET"
done

echo "Done. Redeploy for changes to take effect: npx vercel --prod"
