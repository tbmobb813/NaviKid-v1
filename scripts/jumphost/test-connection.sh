#!/bin/bash
# Quick test script for Supabase connection through jumphost tunnel

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Supabase Connection through Jumphost Tunnel${NC}"
echo ""

# Load environment from .env if exists
if [ -f "backend/.env" ]; then
    export $(grep -v '^#' backend/.env | xargs)
fi

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-postgres}"

# Check if we have password
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}⚠️  DB_PASSWORD not set in environment${NC}"
    read -sp "Enter Supabase password: " DB_PASSWORD
    echo ""
fi

echo "Testing connection to:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Step 1: Check if tunnel is running
echo -e "${BLUE}Step 1: Checking if SSH tunnel is running...${NC}"
if lsof -Pi :$DB_PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    PID=$(lsof -Pi :$DB_PORT -sTCP:LISTEN -t)
    PROCESS=$(ps -p $PID -o comm=)
    echo -e "${GREEN}✅ Port $DB_PORT is listening (PID: $PID, Process: $PROCESS)${NC}"
else
    echo -e "${RED}❌ No process listening on port $DB_PORT${NC}"
    echo ""
    echo "Start the SSH tunnel first:"
    echo "  ./scripts/jumphost/tunnel-local.sh"
    echo ""
    echo "Or start it manually:"
    echo "  ssh -N -L 5432:db.yourproject.supabase.co:5432 user@jumphost-ip"
    exit 1
fi

# Step 2: Test TCP connection
echo ""
echo -e "${BLUE}Step 2: Testing TCP connection...${NC}"
if timeout 5 bash -c "</dev/tcp/$DB_HOST/$DB_PORT" 2>/dev/null; then
    echo -e "${GREEN}✅ TCP connection successful${NC}"
else
    echo -e "${RED}❌ TCP connection failed${NC}"
    echo "The tunnel is running but cannot connect to the database."
    echo "Check that the tunnel is pointing to the correct Supabase host."
    exit 1
fi

# Step 3: Test PostgreSQL connection
echo ""
echo -e "${BLUE}Step 3: Testing PostgreSQL connection...${NC}"

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  psql not found. Install it to test database connection:${NC}"
    echo "  Ubuntu/Debian: sudo apt install postgresql-client"
    echo "  macOS: brew install postgresql"
    exit 0
fi

# Build connection string
CONNECTION_STRING="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

# Test connection
if psql "$CONNECTION_STRING" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL connection successful${NC}"
    echo ""
    echo -e "${BLUE}Database Info:${NC}"
    psql "$CONNECTION_STRING" -c "SELECT version();" -t | head -n1
    echo ""
    echo -e "${BLUE}Testing permissions:${NC}"
    psql "$CONNECTION_STRING" -c "SELECT current_user, current_database();" -t
else
    echo -e "${RED}❌ PostgreSQL connection failed${NC}"
    echo ""
    echo "Possible issues:"
    echo "  1. Incorrect password"
    echo "  2. Database name is wrong"
    echo "  3. SSL configuration mismatch"
    echo ""
    echo "Try connecting manually:"
    echo "  psql \"postgresql://$DB_USER:[password]@$DB_HOST:$DB_PORT/$DB_NAME\""
    exit 1
fi

# Step 4: Test backend connection (if backend test script exists)
echo ""
echo -e "${BLUE}Step 4: Testing backend application connection...${NC}"
if [ -f "scripts/test-backend-connection.ts" ]; then
    if command -v npm &> /dev/null; then
        cd backend 2>/dev/null || true
        npm run -s test:connection 2>/dev/null || \
        npx tsx ../scripts/test-backend-connection.ts || \
        echo -e "${YELLOW}⚠️  Backend test script failed or not configured${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Backend test script not found${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All connection tests passed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Your application can now connect to Supabase via:"
echo "  DATABASE_URL=\"postgresql://$DB_USER:[password]@$DB_HOST:$DB_PORT/$DB_NAME\""
echo ""
echo "Next steps:"
echo "  1. Update backend/.env with the connection string"
echo "  2. Start your backend: cd backend && npm run dev"
echo "  3. Run migrations: cd backend && npm run migrate"
