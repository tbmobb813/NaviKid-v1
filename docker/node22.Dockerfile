### Minimal Dockerfile to run backend build and tests using Node 22
### Usage:
###  docker build -f docker/node22.Dockerfile -t navikid-backend-test .
###  docker run --rm -e DB_CA_PATH=backend/supabase-ca.pem -e REDIS_ENABLED=false navikid-backend-test

FROM node:22-bullseye-slim AS base

WORKDIR /app/backend

# Copy package files first to leverage Docker cache for npm install
COPY backend/package.json backend/package-lock.json ./

# Copy repo-level ESLint configs so runs inside the image can locate them
# ESLint may look for configs at /app/eslint.config.* when run from /app/backend
COPY eslint.config.backend.cjs ../eslint.config.backend.cjs
COPY eslint.config.frontend.cjs ../eslint.config.frontend.cjs

# Install dependencies (including devDependencies for tests)
RUN npm ci

# Copy source
COPY backend/ ./

# Build TypeScript to include compiled `dist/` in the image
RUN npm run build

# Run tests by default; allow overriding CMD to run other commands
ENV NODE_ENV=test
CMD ["npm", "run", "test"]
