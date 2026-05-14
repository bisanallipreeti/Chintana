# Chintana Expo Frontend

Cross-platform frontend for Chintana using Expo + React Native + TypeScript.

## Targets

- Android
- iOS
- Web (React Native Web)

## Run

```bash
npm install
cp .env.example .env
npm run start
```

Platform commands:

```bash
npm run android
npm run ios
npm run web
```

## Typecheck

```bash
npm run typecheck
```

## Build Web

```bash
npm run build:web
```

Set API URL via `.env`:

- `EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1`
