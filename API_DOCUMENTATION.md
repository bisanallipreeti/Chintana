# Chintana API Documentation

## Base URL

- Local: `http://localhost:5000/api/v1`
- Production: `https://<your-domain>/api/v1`

## Standard Response Format

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "error": null
}
```

Error format:

```json
{
  "success": false,
  "message": "Validation failed.",
  "data": null,
  "error": {
    "code": "BAD_REQUEST",
    "details": []
  }
}
```

## Auth Flow

1. `POST /auth/register` -> create user and send email OTP
2. `POST /auth/verify-email` -> verify OTP and receive access + refresh token
3. `POST /auth/login` -> login only after email verification
4. `POST /auth/refresh-token` -> rotate refresh token
5. `POST /auth/forgot-password` -> send reset link
6. `POST /auth/reset-password` -> set new password

## Core Endpoints

### Health

- `GET /health`
- `GET /ready`

### Auth

- `POST /auth/register`
- `POST /auth/verify-email`
- `POST /auth/resend-otp`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`

### Thoughts

- `GET /thoughts`
  - Query: `search`, `category`, `type`, `sort`, `order`, `page`, `limit`, `minScore`, `maxScore`, `dateFrom`, `dateTo`
- `POST /thoughts/analyze`
- `POST /thoughts`
- `GET /thoughts/:id`
- `PUT /thoughts/:id`
- `DELETE /thoughts/:id`
- `POST /thoughts/:id/reprocess-ai`

### Dashboard

- `GET /dashboard/summary`
  - Includes weekly trend, monthly trend, mental stability score, pattern detection

### Profile

- `GET /profile`
- `PUT /profile`

### Settings

- `GET /settings`
- `PUT /settings`
- `POST /settings/push-token`

### Upload

- `POST /upload` (`multipart/form-data`)
  - Fields:
    - `file`: file
    - `expectedType`: `image | video`

### Export

- `GET /exports/thoughts/csv`
- `GET /exports/thoughts/pdf`

### Reminders

- `GET /reminders/upcoming`
- `POST /reminders/thought/:thoughtId`
- `POST /reminders/run-daily` (requires `x-cron-key`)

## Security Controls

- Helmet
- CORS allowlist
- Request validation with Joi
- XSS + NoSQL payload sanitization
- Global and auth-specific rate limiting
- JWT access token + refresh token rotation

## OpenAPI / Swagger

- `GET /docs`
- `GET /openapi.json`
