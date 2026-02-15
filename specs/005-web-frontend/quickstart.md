# Quickstart: Web Frontend (005-web-frontend)

**Feature**: 005-web-frontend  
**Date**: 2026-02-15

## What this feature adds

A **Vue 3 (Composition API) + Pinia** web app that talks to the existing Vegan Meal Planning API. Users can sign in, manage the meal library, view and edit current/next week plans, view history, and (if tenant admin) manage tenant settings.

## Prerequisites

- **Bun** installed
- **Node** (for Vite; or Bun-compatible Vite) if using Vite
- API and DB: run migrations and seed if needed (see [docs/quickstart.md](../../docs/quickstart.md))

## Quick steps

### 1. Install dependencies

From the repo root:

```bash
bun install
```

(Vue 3, Pinia, Vite, and @vitejs/plugin-vue will be added as dependencies when this feature is implemented.)

### 2. Start the API

In one terminal:

```bash
bun run dev
```

API runs at `http://localhost:3000` (or `PORT` from env).

### 3. Start the web frontend

In another terminal:

```bash
bun run dev:web
```

(or `vite` if the script is named that way). The SPA will be served (e.g. `http://localhost:5173`) with API proxy to `http://localhost:3000` so the same origin is used for `/api` requests.

### 4. Sign in

Open the app in the browser. Use credentials from the seeded users (see [docs/SEEDING-GUIDE.md](../../docs/SEEDING-GUIDE.md) for seed dev users). After sign-in you can use Library, Week plan, History, and (if admin) Settings.

## Environment

- **API base URL**: The frontend must call the API at the correct base URL. In development, Vite proxy (e.g. `/api` → `http://localhost:3000`) avoids CORS. For production, set `VITE_API_BASE_URL` (or equivalent) to the API origin, or serve the SPA from the same host as the API and use relative paths.
- **No secret keys** in the frontend; JWT is stored in localStorage (or sessionStorage) after login.

## Where to read more

- **Feature spec**: [spec.md](./spec.md) — requirements and acceptance criteria
- **Implementation plan**: [plan.md](./plan.md) — technical approach, stack, and structure
- **Data model**: [data-model.md](./data-model.md) — client-side state and API entity alignment
- **API contracts**: [contracts/README.md](./contracts/README.md) — consumed endpoints and OpenAPI references
- **Research**: [research.md](./research.md) — decisions (Vue, Pinia, JWT, components, date-fns, Vite)
