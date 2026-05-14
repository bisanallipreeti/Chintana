# Chintana Setup Checklist

This is the fastest, safest setup path for local development and deployment preparation.

## 1. Prerequisites

Install:

- Node.js 22+
- npm 10+
- MongoDB (local) or MongoDB Atlas

Optional but recommended:

- Cloudinary account (media uploads)
- Google OAuth client ID (Google sign-in)
- SMTP provider credentials (real OTP/reset emails)
- Redis (only if BullMQ mode is enabled)

## 2. Install Dependencies

From repo root:

```bash
npm run install:all
```

## 3. Create Environment Files

### Backend

1. Copy [`backend/.env.example`](backend/.env.example) to `backend/.env`.
2. Fill required values:
   - `MONGODB_URI`
   - `ACCESS_TOKEN_SECRET`
   - `REFRESH_TOKEN_SECRET`
3. Fill optional integrations as needed:
   - `GROQ_API_KEY` (leave empty to use built-in heuristic analysis only)
   - optional `GROQ_MODEL`, `GROQ_FALLBACK_MODELS`
   - `GROQ_TLS_REJECT_UNAUTHORIZED=false` only if your network does SSL interception
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
   - `SMTP_TLS_REJECT_UNAUTHORIZED` (`false` only for local networks with SSL interception/self-signed certs)
   - `GOOGLE_CLIENT_ID` and optional `GOOGLE_CLIENT_IDS`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `REDIS_URL` (when `ENABLE_BULLMQ=true`)
   - `SENTRY_DSN`
   - `INTERNAL_CRON_KEY`

### Vite Frontend

1. Copy [`frontend/.env.example`](frontend/.env.example) to `frontend/.env`.
2. Set:
   - `VITE_API_BASE_URL=http://localhost:5000/api/v1`
   - `VITE_GOOGLE_CLIENT_ID=<google-web-client-id>` (optional but required for Google sign-in)

### Expo Frontend

1. Copy [`frontend-expo/.env.example`](frontend-expo/.env.example) to `frontend-expo/.env`.
2. Set:
   - `EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1`

## 4. Run Locally

Start backend + Expo web together:

```bash
npm run dev
```

Useful alternatives:

- Backend only: `npm run dev:backend`
- Expo web only: `npm run dev:expo`
- Vite frontend only: `npm run dev:vite`

## 5. Validate Local Health

Run:

```bash
npm run test
npm run typecheck
npm run build
```

Check:

- Backend health: `http://localhost:5000/health`
- Backend readiness: `http://localhost:5000/ready`
- Expo web: `http://localhost:8081`

## 6. Production Prep

Use [`DEPLOYMENT.md`](DEPLOYMENT.md) for AWS ECS/Fargate rollout and GitHub Actions secret setup.

Before deploy:

1. Ensure no real credentials are committed in sample files.
2. Rotate any previously exposed provider keys.
3. Add all runtime secrets in AWS/GitHub secret stores.
