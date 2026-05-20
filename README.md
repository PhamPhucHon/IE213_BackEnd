# IE213 Backend API

REST API for the IE213 eyewear store project, built with Node.js, Express, and MongoDB.

## Overview

- Runtime: Node.js + Express 5
- Database: MongoDB + Mongoose
- Authentication: JWT
- Media upload: Cloudinary
- Email: Nodemailer SMTP
- Logging: structured JSON logs + HTTP request logging
- API docs: Swagger UI at `/api-docs`

## Requirements

- Node.js 20.19+
- npm 10+
- MongoDB local instance or MongoDB Atlas

## Clone and Install

```bash
git clone <your-repository-url>
cd IE213_BackEnd
cd server
npm install
```

## Environment Setup

The application reads environment variables from `server/.env`.

1. Copy the template file:

```bash
cd server
cp .env.example .env
```

2. Fill in the real values in `server/.env`.

Important notes:

- `MONGODB_URI` must point to a writable MongoDB database.
- `JWT_SECRET` and `JWT_REFRESH_SECRET` should be long random secrets and must be different.
- Cloudinary variables are required because uploads are configured at startup.
- SMTP variables are required for the forgot-password flow.
- `CLIENT_URL` is used for CORS and reset-password links.
- Keep `TRUST_PROXY=0` for direct local/dev traffic; set it to the number of trusted proxies only when deploying behind a reverse proxy.
- `LOG_LEVEL` controls structured log verbosity.
- `LOG_SINK_URL` is optional and can be used to forward logs to an external collector.

See [server/.env.example](server/.env.example) for the full list and inline descriptions.

## Run the Application

From the `server` directory:

```bash
# development with auto-reload
npm run dev

# production-style start
npm start
```

Default local URLs:

- API root: `http://localhost:5000/api`
- Health check: `http://localhost:5000/`
- Swagger UI: `http://localhost:5000/api-docs`

If route comments change, regenerate the Swagger JSON:

```bash
cd server
npm run swagger-gen
```

## Logging

- Application logs are structured JSON logs generated through the shared logger in `server/config/logger.js`.
- HTTP requests are logged automatically with method, URL, status code, response time, request id, and authenticated user id when available.
- Sensitive fields such as passwords, tokens, cookies, and authorization headers are redacted.
- If `LOG_SINK_URL` is configured, logs are also forwarded asynchronously to that external HTTP sink.

## Migration and Seed

This project does not currently use a separate migration framework.

- Schema and index changes are defined in the Mongoose models.
- For sample data, use the seed script.

Run seed data:

```bash
cd server
npm run seed
```

Practical note:

- Seed expects a valid `MONGODB_URI` in `server/.env`.
- If you want a clean dataset, drop the target database first or point `MONGODB_URI` to a fresh database name before running the seed.

## Run Tests

From the `server` directory:

```bash
# run the full suite
npm test

# watch mode
npm run test:watch
```

Testing notes:

- Jest uses `mongodb-memory-server` in replica-set mode so transaction flows can be tested.
- Full test bootstrap is configured through `tests/globalSetup.js`, `tests/globalTeardown.js`, and `tests/setup.js`.

## Inventory Route Layout

Inventory routes are now grouped by audience and prefix:

- Public/user inventory routes: [server/routes/inventoryRoutes.js](server/routes/inventoryRoutes.js)
	mounted at `/api/inventory`
- Admin inventory routes: [server/routes/inventoryAdminRoutes.js](server/routes/inventoryAdminRoutes.js)
	mounted at `/api/admin/inventory`

This keeps the URL structure predictable while making route ownership clearer in the codebase.

## Project Structure

```text
server/
	app.js                    # Express app wiring only, no runtime side effects
	server.js                 # Runtime bootstrap, DB connect, listen, background jobs
	config/                   # Environment, DB, logger, shutdown, third-party config
	controllers/              # HTTP layer, request/response orchestration
	middleware/               # Auth, validation, security, error handling
	models/                   # Mongoose schemas, indexes, model-level behavior
	routes/                   # Public and admin route definitions
	services/                 # Business logic and transaction boundaries
	tests/                    # Unit and integration tests
	utils/                    # DTOs, helpers, shared primitives
	seeds/                    # Sample data seeding script and data files
```

## Design Principles

- `app.js` is side-effect free. It only builds the Express application.
- `server.js` owns runtime startup concerns such as DB connection, HTTP listen, and background jobs.
- Controllers stay thin and delegate business logic to services.
- Services own transaction boundaries and consistency-sensitive workflows.
- Models define schema constraints and indexes, but cross-document business rules stay in services.
- Responses are standardized through shared helpers in `utils/apiResponse.js`.
- Errors are normalized centrally through the error middleware.
- Inventory, order, review, and password-reset flows use transactions where multiple documents must stay consistent.

## API Documentation

- Swagger UI is served from `/api-docs`.
- Swagger JSON is generated from [server/swagger.js](server/swagger.js).
- Route comments are the source of truth for endpoint descriptions.

## Quick Verification

After starting the server, these endpoints should respond successfully:

- `GET /`
- `GET /api`
- `GET /api-docs`
