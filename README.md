# API PPBI (api-ppbi) — Backend

![Version](https://img.shields.io/github/v/tag/alfigusman0/backend-ppbi?label=version)
![License](https://img.shields.io/github/license/alfigusman0/backend-ppbi)
![Issues](https://img.shields.io/github/issues/alfigusman0/backend-ppbi)

A RESTful API backend for the PPBI application. Built with Express.js and designed to power user management, events, forms, notifications and integrations (AWS S3, Redis, Gmail OAuth).

Version: 2.3.0

## Why this project is useful

- Provides a ready-made backend for event registration, user authentication, and admin settings.
- Modular route structure (auth, users, events, forms, notifications, settings) to help teams extend functionality quickly.
- Integrations for common infra: MySQL, Redis (standalone or cluster), AWS S3 (or MinIO), Gmail/Google OAuth and WhatsApp API hooks.
- Production-ready patterns: PM2 config, environment-driven setup, logging and health endpoint.

## Key features

- JWT-based authentication with Redis session/cache support
- Event management (acara, juara, juri, kategori)
- Form handling (pendaftaran, penghargaan, penilaian)
- Notifications and WhatsApp integration
- File uploads to S3/MinIO via `@aws-sdk/client-s3` and `multer-s3`

## Quick start — get running locally

Prerequisites

- Node.js (recommended LTS; project uses Express 5.x)
- npm (or yarn)
- MySQL server
- Redis (optional but required for session caching if `REDIS_ACTIVE=ON`)

1. Clone the repo

```powershell
git clone https://github.com/alfigusman0/backend-ppbi.git
cd backend-ppbi
```

2. Install dependencies

```powershell
npm install
```

3. Copy the example environment file and edit values

```powershell
cp .env-example .env
# Open .env in your editor and fill DB_* and other required vars
```

Important environment variables (see `.env-example` for full list)

- APPLICATION_NAME
- NODE_ENV (development|production)
- PORT (e.g. 5000)
- JWT_SECRET, JWT_EXPIRED_IN
- DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
- REDIS_ACTIVE, REDIS_HOST, REDIS_PORT, REDIS_PASS, REDIS_DB
- AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME
- ALLOWED_IPS (production-only access whitelist)

4. Run the app (development)

```powershell
npm run start
```

> `npm run start` runs `nodemon server.js` (development). For production use run `node server.js` or use PM2 with the provided `pm2.config.js`.

Start with PM2 (example)

```powershell
# Install pm2 globally if you don't have it
npm i -g pm2
npm run start
pm2 start pm2.config.js
```

5. Health check

The app mounts routes under `/api`. A simple health endpoint is available at `/api` and returns JSON:

PowerShell example:

```powershell
# If PORT=5000
Invoke-RestMethod -Uri "http://localhost:5000/api"
```

cURL example:

```bash
curl http://localhost:5000/api
```

Expected response:

```json
{ "status": "OK", "message": "Server is healthy", "timestamp": 1650000000000 }
```

## Project structure (top-level)

- `server.js` — main app bootstrap and route wiring
- `routes/` — route definitions (auth, users, event, form, notification, settings)
- `controllers/` — route handlers and business logic
- `config/` — DB, AWS, redis and other config wiring
- `middleware/` — authentication and request validation middleware
- `helpers/` — utilities (response formatting, notifications)
- `validation/` — request validators
- `pm2.config.js` — example process config for production

## Scripts

- `npm run start` — development (nodemon)
- `npm test` — placeholder (no tests configured)

## Environment examples & safety

This repo contains `.env-example` with the full list of configuration keys. Never commit real secrets or production credentials to the repository. Use environment management for CI/CD and production deployments.

## Where to get help

- Open an issue: https://github.com/alfigusman0/backend-ppbi/issues
- For urgent infra problems, contact the maintainer (see below)

## Who maintains this project

Maintainer: Alfi Gusman

GitHub: https://github.com/alfigusman0

Contributions are welcome — please open issues or pull requests. If you want to contribute a feature or fix, open an issue first to discuss scope.

A contributor guide is available in `CONTRIBUTING.md` with short instructions for PRs, code style, and tests.

An initial OpenAPI spec has been added at `docs/openapi.yaml` (high-level tags and example endpoints). Expand it with full schemas as needed.

A lightweight CI workflow has been added: `.github/workflows/ci.yml` — it installs dependencies and runs a harmless smoke check (safe for this repo because the app requires DB/Redis envs to run).

## License

This project is licensed under the ISC License — see `LICENSE` for details.

## Next steps / suggestions

- Add unit/integration tests and a CI workflow (GitHub Actions)
- Add a `CONTRIBUTING.md` and issue templates to streamline contributions
- Add example Postman collection or OpenAPI spec for the public endpoints

---

If you'd like, I can also add a minimal `CONTRIBUTING.md` or generate an OpenAPI spec based on the `routes/` directory. Which would you prefer next?
