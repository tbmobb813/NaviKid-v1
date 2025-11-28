#!/usr/bin/env bash
set -euo pipefail

# Usage: ./start-db-ssh-tunnel.sh <remote-ssh> [local_port] [remote_db_host] [remote_db_port]
# Example:
# ./start-db-ssh-tunnel.sh ubuntu@jumphost 15432 db.feqfhdwmwrolaafchldq.supabase.co 5432

REMOTE_SSH=${1:-}
LOCAL_PORT=${2:-15432}
REMOTE_DB_HOST=${3:-db.feqfhdwmwrolaafchldq.supabase.co}
REMOTE_DB_PORT=${4:-5432}

if [ -z "$REMOTE_SSH" ]; then
  echo "Usage: $0 <remote-ssh> [local_port] [remote_db_host] [remote_db_port]"
  exit 2
fi

echo "Starting SSH tunnel: localhost:${LOCAL_PORT} -> ${REMOTE_DB_HOST}:${REMOTE_DB_PORT} via ${REMOTE_SSH}"

# Run ssh in background (-f) and do not execute remote commands (-N). Use -L to forward local port.
# We also set ExitOnForwardFailure=yes so ssh will exit if it cannot bind the local port.
ssh -f -o ExitOnForwardFailure=yes -L "127.0.0.1:${LOCAL_PORT}:${REMOTE_DB_HOST}:${REMOTE_DB_PORT}" "$REMOTE_SSH" -N

if [ $? -eq 0 ]; then
  echo "SSH tunnel started. Confirm with: lsof -iTCP -sTCP:LISTEN -P | grep ${LOCAL_PORT}"
  echo "To stop the tunnel: pkill -f \"ssh -f -o ExitOnForwardFailure=yes -L 127.0.0.1:${LOCAL_PORT}:${REMOTE_DB_HOST}:${REMOTE_DB_PORT}\" || echo 'Kill the ssh process manually.'"
else
  echo "Failed to start SSH tunnel"
  exit 1
fi
