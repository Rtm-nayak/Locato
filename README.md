# SafeTrack / CrowdSafe

This repository contains two parts:

- Frontend: React + Vite + Tailwind (`/src`) — SafeTrack UI
- Backend: Python Flask API (`/crowdsafe-backend`) — CrowdSafe REST API

Quick start (development)

1. Frontend

```bash
# from repo root
cd .
npm install
npm run dev
```

2. Backend

```bash
cd crowdsafe-backend
python -m venv .venv
source .venv/Scripts/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Add your Firebase service account JSON and update .env
python app.py
```

Environment variables

- Frontend: create a `.env.local` with the Vite variables shown in `.env.example`.
- Backend: copy `crowdsafe-backend/.env.example` to `crowdsafe-backend/.env` and point `FIREBASE_CREDENTIALS` to your service account JSON.

CI

A GitHub Actions workflow runs builds for both frontend and backend (`.github/workflows/ci.yml`). To enable deploy steps add provider secrets (Netlify/Render tokens) in repository settings.

Deployment

- Frontend: recommended to deploy to Vercel or Netlify (automatic from GitHub).
- Backend: recommended to deploy to Render, Heroku, or Google Cloud Run. A `Dockerfile` for the backend is included.

Security

- Keep `serviceAccountKey.json` out of git. Use repository secrets for CI/CD.
- Lock down Firestore security rules before production.

If you want, I can run the local verification steps (requires your Firebase service account), add a GitHub Action to deploy automatically, or prepare a Docker Compose workflow for local dev.
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
