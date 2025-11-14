#!/bin/bash
# Local SSH tunnel script for Supabase database access
# Run this on your LOCAL development machine

set -e

# Configuration - UPDATE THESE VALUES
JUMPHOST_IP="${JUMPHOST_IP:-your-jumphost-ip}"
JUMPHOST_USER="${JUMPHOST_USER:-ubuntu}"
JUMPHOST_PORT="${JUMPHOST_PORT:-22}"

# Supabase configuration - UPDATE THESE
SUPABASE_HOST="${SUPABASE_HOST:-db.your-project.supabase.co}"
SUPABASE_PORT="${SUPABASE_PORT:-5432}"
LOCAL_PORT="${LOCAL_PORT:-5432}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if configuration is set
if [[ "$JUMPHOST_IP" == "your-jumphost-ip" ]]; then
    echo -e "${RED}❌ Error: Please configure JUMPHOST_IP${NC}"
    echo ""
    echo "Set environment variables or edit this script:"
    echo "  export JUMPHOST_IP=your.jumphost.ip"
    echo "  export SUPABASE_HOST=db.yourproject.supabase.co"
    echo ""
    exit 1
fi

# Check if tunnel is already running
if lsof -Pi :$LOCAL_PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port $LOCAL_PORT is already in use${NC}"
    echo "An SSH tunnel may already be running, or another service is using this port."
    echo ""
    read -p "Kill existing process and restart? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        PID=$(lsof -Pi :$LOCAL_PORT -sTCP:LISTEN -t)
        kill $PID
        echo -e "${GREEN}✅ Killed process $PID${NC}"
        sleep 2
    else
        exit 1
    fi
fi

echo -e "${GREEN}🚀 Starting SSH tunnel to Supabase...${NC}"
echo ""
echo "Configuration:"
echo "  Jumphost: $JUMPHOST_USER@$JUMPHOST_IP:$JUMPHOST_PORT"
echo "  Supabase: $SUPABASE_HOST:$SUPABASE_PORT"
echo "  Local:    localhost:$LOCAL_PORT"
echo ""

# Start SSH tunnel
# -N: Don't execute remote command
# -L: Local port forwarding
# -v: Verbose (optional, remove for less output)
# -o ServerAliveInterval=60: Keep connection alive
ssh -N \
    -L $LOCAL_PORT:$SUPABASE_HOST:$SUPABASE_PORT \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    $JUMPHOST_USER@$JUMPHOST_IP \
    -p $JUMPHOST_PORT

# This line only executes if SSH exits
echo -e "${RED}❌ SSH tunnel closed${NC}"
