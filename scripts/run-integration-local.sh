#!/usr/bin/env bash
set -euo pipefail

# Run local integration stack (Postgres + Redis), start backend dev server, then run integration tests.
# Usage: ./scripts/run-integration-local.sh [--no-teardown]

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.test.yml"
ENV_FILE="$ROOT_DIR/backend/.env.test"

NO_TEARDOWN=false
if [ "${1-}" = "--no-teardown" ]; then
  NO_TEARDOWN=true
fi

echo "Starting test services with docker compose..."
docker compose -f "$COMPOSE_FILE" up -d

echo "Waiting for Postgres (localhost:5432) and Redis (localhost:6379) to be ready..."
# wait for TCP port
wait_for_port() {
  local host=$1
  local port=$2
  for i in {1..60}; do
    if nc -z "$host" "$port" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

if ! wait_for_port localhost 5432; then
  echo "Postgres did not become ready in time" >&2
  exit 1
fi

if ! wait_for_port localhost 6379; then
  echo "Redis did not become ready in time" >&2
  exit 1
fi

echo "Exporting backend test env from $ENV_FILE"
set -o allexport
source "$ENV_FILE"
set +o allexport

echo "Starting backend dev server (in background)..."
# Prefer the richer `src/index.ts` server if it exists (it exposes WebSocket and
# route shapes used by the integration tests). Fall back to the default `npm
# run dev` which uses `src/server.ts` when `index.ts` is not present.
# Kill any existing backend dev watchers to avoid port conflicts
EXISTING_PIDS=$(pgrep -f "tsx watch src/" || true)
if [ -n "$EXISTING_PIDS" ]; then
  echo "Killing existing backend dev processes: $EXISTING_PIDS"
  kill $EXISTING_PIDS || true
  sleep 1
fi

if [ -f "$ROOT_DIR/backend/src/index.ts" ]; then
  (cd "$ROOT_DIR/backend" && npx tsx watch src/index.ts) &
else
  npm --prefix "$ROOT_DIR/backend" run dev &
fi
BACKEND_PID=$!

echo "Waiting for backend health to respond (http://localhost:3000/api/health)..."
for i in {1..60}; do
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || true)
  if [ "$status" = "200" ]; then
    echo "Backend is healthy"
    break
  fi
  sleep 1
done

echo "Running integration tests..."
npx jest __tests__/integration --runInBand || TEST_EXIT=$?

echo "Shutting down backend dev server"
kill "$BACKEND_PID" || true

if [ "$NO_TEARDOWN" = false ]; then
  echo "Tearing down docker compose services..."
  docker compose -f "$COMPOSE_FILE" down
fi

if [ -n "${TEST_EXIT-}" ]; then
  exit $TEST_EXIT
fi

echo "Integration run complete"
