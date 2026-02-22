# 💹 FinanceFlow v4 — Upgraded Package Guide

## What Changed (v3 → v4)

### Frontend

| Package | Before | After | Reason |
|---------|--------|-------|--------|
| `react-scripts` (CRA) | 5.0.1 | **removed** | Officially deprecated Feb 2025 |
| `vite` | — | `^6.0.0` | Replacement build tool |
| `@vitejs/plugin-react` | — | `^4.3.0` | Required Vite plugin for React |
| `react` | `^18.2.0` | `^19.0.0` | Latest stable (Dec 2024) |
| `react-dom` | `^18.2.0` | `^19.0.0` | Matches React version |
| `@mui/material` | `^5.14.20` | `^7.0.0` | v7 is now latest stable |
| `@mui/icons-material` | `^5.14.19` | `^7.0.0` | Matches MUI core |
| `@mui/x-data-grid` | `^6.18.2` | `^7.0.0` | Matches MUI ecosystem |
| `@emotion/react` | `^11.11.1` | `^11.14.0` | Latest patch |
| `@emotion/styled` | `^11.11.0` | `^11.14.0` | Latest patch |
| `recharts` | `^2.10.1` | `^3.7.0` | Major rewrite with React 19 support |

### Backend

| Package | Before | After | Reason |
|---------|--------|-------|--------|
| `express` | `^4.18.2` | `^5.2.1` | v5 is now stable default on npm |
| `multer` | `^1.4.5-lts.1` | `^2.0.2` | Fixes CVE-2025-47935 + CVE-2025-47944 |
| `uuid` | `^9.0.0` | `^11.0.0` | Latest major |
| `csv-parse` | `^5.5.3` | `^5.6.0` | Latest patch |
| `nodemon` | `^3.0.1` | `^3.1.0` | Latest patch |

---

## Code Changes Required by Upgrades

### CRA → Vite migration

1. `index.html` moved from `frontend/public/index.html` to `frontend/index.html` (project root)
2. Script tag changed to `<script type="module" src="/src/main.jsx"></script>`
3. `src/index.js` renamed to `src/main.jsx`
4. `package.json` `"proxy"` field replaced by `vite.config.js` `server.proxy`
5. `REACT_APP_*` env vars renamed to `VITE_*` (use `import.meta.env.VITE_API_URL`)
6. `vite.config.js` added at `frontend/` root

### Express 4 → Express 5

- Async route handlers no longer need `try/catch` — Express 5 automatically forwards thrown errors to `next(err)`
- Wildcard `*` routes now require a named parameter (e.g. `/*splat`) — not used in this project
- `app.del()` removed (already using `app.delete()`)
- Route path regex sub-expressions removed — not used in this project

### Multer 1.x → 2.x

- `fileFilter` callback signature unchanged
- Security: stream leak and DoS vulnerabilities fixed internally
- Added `application/csv` as accepted MIME type

### Recharts 2 → 3

- Removed `react-smooth` dependency (animations built-in, same props)
- `activeShape` / `inactiveShape` on `<Pie>` deprecated — use `shape` prop going forward
- `activeIndex` prop removed from Scatter/Bar/Pie (not used here)
- Internal `CategoricalChartState` no longer leaked to consumer code
- All chart components used in this project are backwards compatible

### React 18 → React 19

- `createRoot` API unchanged
- `StrictMode` unchanged
- No breaking changes for the hooks or patterns used here

### MUI v5 → v7

- `ThemeProvider` / `CssBaseline` API unchanged
- Component `sx` prop API unchanged  
- `Grid` item/container props API unchanged
- Default `Accordion` summary now wrapped in `<h3>` (not used here)
- `Box` `component` prop moved out of `BoxOwnProps` (not affected — not using `styled(Box)`)

---

## Project Structure

```
finance-app/
├── backend/
│   ├── server.js                     # Express 5 entry
│   ├── package.json
│   ├── routes/
│   ├── controllers/                  # No try/catch needed (Express 5)
│   ├── services/
│   ├── middleware/
│   │   ├── upload.middleware.js      # Multer 2.x
│   │   └── errorHandler.middleware.js
│   └── data/
│
└── frontend/
    ├── index.html                    # Vite root (NOT in /public)
    ├── vite.config.js                # Vite config with /api proxy
    ├── package.json
    └── src/
        ├── main.jsx                  # Vite entry (was index.js)
        ├── App.jsx
        ├── theme.js                  # MUI v7
        ├── api/api.js                # Uses import.meta.env.VITE_API_URL
        ├── hooks/
        ├── utils/
        ├── components/
        └── pages/
            └── Dashboard.jsx         # Recharts 3 compatible
```

---

## Quick Start

```bash
# Backend
cd backend
npm install
npm start          # or: npm run dev

# Frontend (new Vite commands)
cd frontend
npm install
npm run dev        # starts on http://localhost:3000
npm run build      # production build → frontend/build/
npm run preview    # preview production build
```

## Environment Variables

Vite uses `VITE_` prefix (not `REACT_APP_`).

Create `frontend/.env.local` for local overrides:
```
VITE_API_URL=http://localhost:3001
```

In production, set `VITE_API_URL` to your deployed API URL before running `npm run build`.
During development, the Vite proxy handles `/api/*` automatically — no env var needed.

