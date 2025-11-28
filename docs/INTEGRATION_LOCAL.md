# Running integration tests locally

This project includes a convenience Docker Compose and a script to run the full local integration stack (Postgres + Redis), start the backend, run integration tests, and tear down.

Prerequisites

- Docker (with Compose support)
- Node.js (as used by the project)

Quick run (recommended)

From the project root:

```bash
./scripts/run-integration-local.sh
```

This will:

- Start Docker Compose services defined in `docker/docker-compose.test.yml` (Postgres + Redis)
- Wait for services to be reachable on localhost
- Export test env from `backend/.env.test` (includes JWT secrets and DB/Redis settings)
- Start the backend dev server (`npm --prefix backend run dev`)
- Wait for backend health endpoint to respond
- Run Jest integration tests under `__tests__/integration`
- Tear down docker-compose services (unless you pass `--no-teardown`)

If you prefer npm scripts:

Root-level script:

```bash
npm run test:integration:local
```

Backend-level script (from `backend` directory):

```bash
npm --prefix backend run test:integration:local
```

Notes & troubleshooting

- If you encounter port conflicts, stop other local Postgres/Redis instances or change the ports in `docker/docker-compose.test.yml` and `backend/.env.test`.
- The `.env.test` file is a convenience for local testing and contains development-only secrets; do not use it in production.
- If the backend fails to start, run it manually to see logs:

```bash
npm --prefix backend run dev
```

Want the backend to run inside Docker as well? I can extend the Compose file to build and run the backend in-container, but the current approach runs the backend on the host and connects to
containerized DB/Redis for faster dev iteration.
