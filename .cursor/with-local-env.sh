#!/usr/bin/env bash
# Run a command with a local .env file taking precedence over any variables
# already present in the environment.
#
# Cloud Agent pods may inject repo/team secrets (e.g. a production DATABASE_URL,
# REDIS_URL, publishable key or CORS values) into the process environment. Both
# Medusa's loadEnv and Next.js use dotenv, which does NOT override variables that
# are already set. Without this wrapper the local dev servers (and migrations)
# would silently target the remote/production stack instead of the local,
# seeded database. Sourcing the .env with `set -a` re-exports its values,
# ensuring the local development stack is authoritative.
#
# Usage: with-local-env.sh <path-to-env-file> <command> [args...]
set -euo pipefail

ENV_FILE="${1:?env file path required}"
shift

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

exec "$@"
