#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for gu-live-chat.
# Runs after the repository is checked out. Safe to run repeatedly.
set -euo pipefail

cd "$(dirname "$0")/.."

# Install dependencies. `postinstall` runs `prisma generate` and copies vendor assets.
npm ci

# Local development env file. Uses SQLite (prisma/dev.db) and a generated
# AUTH_SECRET — never a production secret. Created only if absent so re-runs
# keep any values the developer set.
if [ ! -f .env ]; then
  cp .env.example .env
  secret="$(openssl rand -base64 32)"
  sed -i "s#^AUTH_SECRET=.*#AUTH_SECRET=\"${secret}\"#" .env
  sed -i "s#^NEXTAUTH_SECRET=.*#NEXTAUTH_SECRET=\"${secret}\"#" .env
fi

# Ensure the local SQLite schema matches prisma/schema.prisma.
npx prisma db push
