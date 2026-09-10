#!/usr/bin/env bash
# Idempotent bootstrap for the Medusa B2B dev environment (backend + storefront).
# Installs system services (PostgreSQL, Redis), project dependencies, runs DB
# migrations, seeds demo data once, and wires up local .env files.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DB_USER="medusa"
DB_PASS="medusa"
DB_NAME="medusa_b2b"

echo "==> Installing system packages (PostgreSQL, Redis) if needed"
if ! command -v psql >/dev/null 2>&1 || ! command -v redis-server >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
    postgresql postgresql-contrib redis-server
fi

echo "==> Starting PostgreSQL and Redis"
sudo service postgresql start || true
sudo service redis-server start || true

echo "==> Waiting for PostgreSQL to accept connections"
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready >/dev/null 2>&1; then break; fi
  sleep 1
done

echo "==> Ensuring database role and database exist"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}' CREATEDB SUPERUSER;"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"

echo "==> Enabling corepack (Yarn 4)"
corepack enable || true

echo "==> Writing backend/.env (if missing)"
if [ ! -f backend/.env ]; then
  JWT_SECRET="$(openssl rand -hex 32)"
  COOKIE_SECRET="$(openssl rand -hex 32)"
  cat > backend/.env <<EOF
NODE_ENV=development

# Database
DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
DB_NAME=${DB_NAME}

# Redis (cache, event bus, workflow engine)
REDIS_URL=redis://localhost:6379

# CORS
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:9000,http://localhost:5173,http://localhost:7001
AUTH_CORS=http://localhost:8000,http://localhost:9000,http://localhost:5173,http://localhost:7001

# Secrets
JWT_SECRET=${JWT_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}

# URLs
MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_STOREFRONT_URL=http://localhost:8000
EOF
fi

echo "==> Writing storefront/.env (if missing)"
if [ ! -f storefront/.env ]; then
  cat > storefront/.env <<EOF
# Medusa backend
MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000

# Storefront
NEXT_PUBLIC_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_REGION=gb

# Publishable API key (filled in automatically after seeding)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=

# Revalidation
REVALIDATE_SECRET=supersecret
EOF
fi

echo "==> Installing backend dependencies"
(cd backend && (yarn install --immutable || yarn install))

echo "==> Installing storefront dependencies"
(cd storefront && (yarn install --immutable || yarn install))

# All backend commands below run through with-local-env.sh so the local
# backend/.env (local Postgres/Redis) takes precedence over any production
# secrets the pod may have injected into the environment. This is important for
# both correctness and safety (never migrate/seed a remote/production database
# during local environment setup).
WITH_LOCAL_ENV="bash ${ROOT}/.cursor/with-local-env.sh .env"

echo "==> Running database migrations (against local ${DB_NAME})"
(cd backend && ${WITH_LOCAL_ENV} yarn medusa db:migrate)

echo "==> Seeding demo data + admin user (first run only)"
HAS_SEED="$(sudo -u postgres psql -d "${DB_NAME}" -tAc "SELECT 1 FROM api_key WHERE title='Webshop' LIMIT 1" 2>/dev/null || echo "")"
if [ -z "${HAS_SEED}" ]; then
  (cd backend && ${WITH_LOCAL_ENV} yarn run seed)
  (cd backend && ${WITH_LOCAL_ENV} yarn medusa user -e admin@test.com -p supersecret -i admin) || true
else
  echo "    Demo data already present, skipping seed."
fi

echo "==> Syncing publishable API key into storefront/.env"
PK="$(sudo -u postgres psql -d "${DB_NAME}" -tAc "SELECT token FROM api_key WHERE type='publishable' AND title='Webshop' ORDER BY created_at LIMIT 1" 2>/dev/null | tr -d '[:space:]' || echo "")"
if [ -n "${PK}" ]; then
  if grep -q '^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=' storefront/.env; then
    sed -i "s|^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*|NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${PK}|" storefront/.env
  else
    echo "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${PK}" >> storefront/.env
  fi
  echo "    Publishable key set."
else
  echo "    WARNING: could not resolve publishable key."
fi

echo "==> Install complete."
