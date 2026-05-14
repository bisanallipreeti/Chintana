# Chintana Backend

Production-oriented Express + MongoDB backend for the Chintana Thought Management System.

## Features

- Clean module architecture (`controller`, `service`, `repository`)
- API versioning via `/api/v1`
- Standard response envelope (`success`, `data`, `message`, `error`)
- OTP email verification + JWT access/refresh tokens
- Password reset flow via email
- AI analysis with timeout, retry, fallback, cache, and quota controls
- Secure file upload pipeline (Cloudinary/local fallback)
- Reminder scheduling + background jobs (BullMQ or in-memory queue)
- Security middleware (Helmet, CORS, validation, sanitization, rate limits)
- Health, readiness, and OpenAPI endpoints

## Run Locally

```bash
cp .env.example .env
npm install
npm run dev
```

## Tests

```bash
npm test
npm run test:api
```

## Key Routes

- `GET /health`
- `GET /ready`
- `GET /docs`
- `GET /openapi.json`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh-token`
- `GET /api/v1/dashboard/summary`
- `POST /api/v1/thoughts`
- `GET /api/v1/thoughts`
- `POST /api/v1/upload`
