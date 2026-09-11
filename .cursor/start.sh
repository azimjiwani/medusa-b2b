#!/usr/bin/env bash
# Per-boot startup: ensure PostgreSQL and Redis are running before the
# backend/storefront dev servers (launched as terminals) start.
set -euo pipefail

echo "==> Starting PostgreSQL and Redis"
sudo service postgresql start || true
sudo service redis-server start || true

echo "==> Waiting for PostgreSQL to accept connections"
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready >/dev/null 2>&1; then
    echo "    PostgreSQL is ready."
    break
  fi
  sleep 1
done

echo "==> Waiting for Redis to respond"
for _ in $(seq 1 30); do
  if redis-cli ping >/dev/null 2>&1; then
    echo "    Redis is ready."
    break
  fi
  sleep 1
done

echo "==> Services started."
