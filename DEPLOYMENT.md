# Chintana Production Deployment (AWS)

For local setup before deployment, follow [`SETUP.md`](SETUP.md).

## Target Architecture

- Frontend (Expo Web build): ECS/Fargate service behind ALB
- Backend (Node/Express): ECS/Fargate service behind ALB
- Database: MongoDB Atlas
- Media: Cloudinary
- Queue: Redis (ElastiCache) when `ENABLE_BULLMQ=true`
- Observability: CloudWatch Logs + Sentry

## 1. Prerequisites

1. AWS account with IAM role for GitHub OIDC deploy
2. MongoDB Atlas cluster + DB user + network access
3. Cloudinary account
4. SMTP credentials for OTP/password reset email
5. Domain name in Route53 (or external DNS)
6. ACM certificate in target region

Before deploying, make sure no real credentials are present in `*.env.example`, docs, or committed config. If a credential was ever exposed, rotate it in the provider dashboard first, then update the deployment secret store.

## 2. Build and Run with Docker (Local Validation)

```bash
docker compose up --build
```

- Frontend web: `http://localhost:8081`
- Backend API: `http://localhost:5000/api/v1`

## 3. Backend Environment Variables

Set these in AWS (ECS task definition / Secrets Manager / SSM):

- `NODE_ENV=production`
- `PORT=5000`
- `API_PREFIX=/api/v1`
- `TRUST_PROXY=true`
- `FORCE_HTTPS=true`
- `MONGODB_URI=<atlas-uri>`
- `ACCESS_TOKEN_SECRET=<strong-secret>`
- `REFRESH_TOKEN_SECRET=<strong-secret>`
- `ACCESS_TOKEN_TTL=15m`
- `REFRESH_TOKEN_TTL_DAYS=30`
- `CORS_ORIGINS=https://app.yourdomain.com`
- `CLIENT_APP_URL=https://app.yourdomain.com`
- `GROQ_API_BASE_URL=https://api.groq.com/openai/v1`
- `GROQ_API_KEY=<key>`
- `GROQ_MODEL=llama-3.3-70b-versatile`
- `GROQ_FALLBACK_MODELS=llama-3.1-8b-instant`
- `GROQ_MAX_TOKENS=420`
- `GROQ_TEMPERATURE=0.2`
- `GROQ_TLS_REJECT_UNAUTHORIZED=true`
- `AI_TIMEOUT_MS=12000`
- `AI_MAX_RETRIES=2`
- `AI_DAILY_LIMIT_PER_USER=120`
- `ENABLE_BULLMQ=true`
- `REDIS_URL=<elasticache-url>`
- `INTERNAL_CRON_KEY=<cron-key>`
- `SMTP_HOST=<host>`
- `SMTP_PORT=587`
- `SMTP_USER=<user>`
- `SMTP_PASS=<pass>`
- `MAIL_FROM=Chintana <no-reply@yourdomain.com>`
- `CLOUDINARY_CLOUD_NAME=<name>`
- `CLOUDINARY_API_KEY=<key>`
- `CLOUDINARY_API_SECRET=<secret>`
- `SENTRY_DSN=<dsn>`
- `LOG_LEVEL=info`

## 4. Frontend Environment Variable

Build arg / environment:

- `EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1`

For the Vite web bundle, use:

- `VITE_API_BASE_URL=https://api.yourdomain.com/api/v1`

## 5. ECS Deployment Steps

1. Create ECR repos:
   - backend image repo
   - frontend image repo
2. Push images (or use GitHub Actions workflow in this repo).
3. Create ECS cluster.
4. Create backend service (Fargate):
   - container port `5000`
   - ALB target group path `/health`
5. Create frontend service (Fargate):
   - container port `80`
6. Configure ALB listeners:
   - `443` HTTPS with ACM cert
   - route `api.yourdomain.com` -> backend target group
   - route `app.yourdomain.com` -> frontend target group
7. Update DNS records to ALB.

## 6. CI/CD (GitHub Actions)

Workflow file: `.github/workflows/ci-cd.yml`

Pipeline stages:

1. Backend tests
2. Expo typecheck + web build
3. Docker build validation
4. AWS deploy (when required secrets are set)

Required GitHub secrets:

- `AWS_ROLE_TO_ASSUME`
- `AWS_REGION`
- `ECR_REPOSITORY_BACKEND`
- `ECR_REPOSITORY_FRONTEND`
- `ECS_CLUSTER`
- `ECS_SERVICE_BACKEND`
- `ECS_SERVICE_FRONTEND`
- `EXPO_PUBLIC_API_BASE_URL`

## 7. Health Checks

- Backend health: `GET /health`
- Backend readiness: `GET /ready`
- Frontend container health: `GET /health`

## 8. Post-Deploy Verification

1. Register account -> receive OTP email
2. Verify OTP -> login
3. Create thought -> confirm AI analysis
4. Schedule revisit reminder
5. Export CSV/PDF
6. Confirm Sentry + logs receive telemetry
