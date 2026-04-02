# Virtual Herbal Garden — Monorepo Restructure Walkthrough

## Summary

Completed the monorepo restructure that was started in the previous conversation. The project now uses **npm workspaces** to manage `frontend/` and `backend/` as independent packages from a shared root.

## Changes Made

### 1. Frontend Vite Config (`frontend/vite.config.js`)
- Added **dev proxy** to forward `/api` and `/socket.io` requests to `http://localhost:5000` (backend)
- Added **path alias** `@/` → `./src/` for cleaner imports
- Set dev server to port `5173`

### 2. Root Package.json (`package.json`) — **NEW**
- Created root `package.json` with `npm workspaces` pointing to `frontend/` and `backend/`
- Added convenience scripts:
  - `npm run dev` — runs both frontend + backend via `concurrently`
  - `npm run dev:frontend` — runs only the frontend
  - `npm run dev:backend` — runs only the backend
  - `npm run build` — builds both workspaces
  - `npm run test` — runs backend tests
  - `npm run lint` — lints both workspaces
- Installed `concurrently` as root dev dependency

### 3. Root .gitignore (`.gitignore`) — **UPDATED**
- Extended to cover monorepo patterns: `.env` files, `coverage/`, Docker overrides, temp files

## Final Project Structure

```
virtual_herbal_garden/
├── package.json          ← Root monorepo (npm workspaces)
├── package-lock.json     ← Shared lockfile
├── .gitignore            ← Monorepo-aware
├── README.md
├── PRD.md / PRD_utf8.md
├── frontend/             ← React + Vite + Tailwind
│   ├── package.json
│   ├── vite.config.js    ← Proxy to backend
│   ├── tsconfig.json
│   ├── index.html
│   ├── src/
│   └── public/
└── backend/              ← Express + TypeScript + MongoDB
    ├── package.json
    ├── tsconfig.json
    ├── src/              ← 82 source files
    ├── tests/            ← Jest test suite
    ├── Dockerfile
    └── docker-compose.yml
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend & backend together |
| `npm run dev:frontend` | Start frontend only (Vite on :5173) |
| `npm run dev:backend` | Start backend only (Express on :5000) |
| `npm run build` | Production build for both |
| `npm run test` | Run backend test suite |
| `npm run lint` | Lint both workspaces |

## Verification Results

| Test | Result |
|------|--------|
| Frontend dev server | ✅ Vite v8.0.3 ready in 391ms on localhost:5173 |
| Backend dev server | ✅ Starts, validates env vars (exits without .env — expected) |
| Combined `npm run dev` | ✅ Both run with color-coded `[frontend]`/`[backend]` labels |

## Next Steps

1. **Backend .env** — Copy `backend/.env.example` → `backend/.env` and fill in credentials
2. **Generate RS256 keys** for JWT signing
3. **Start services** — Run `docker-compose up` in `backend/` for MongoDB + Redis
4. **Run everything** — `npm run dev` from project root
