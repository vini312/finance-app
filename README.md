# 💹 FinanceFlow v8 — MongoDB + Axios Edition

## What Changed (v7 → v8)

### Backend: In-Memory Store → MongoDB + Mongoose

| Before (v7)                  | After (v8)                           |
|------------------------------|--------------------------------------|
| `data/store.js` (JS arrays)  | `db/db.js` (Mongoose connection)     |
| `uuid` for IDs               | MongoDB `ObjectId` (auto-assigned)   |
| JS `.filter()` / `.sort()`   | MongoDB query operators + indexes    |
| JS `reduce` for analytics    | MongoDB Aggregation Pipelines        |
| Data lost on server restart  | Data persisted to MongoDB            |

### Frontend: fetch() → Axios

| Before (v7)                     | After (v8)                             |
|---------------------------------|----------------------------------------|
| Native `fetch()`                | `axios` instance with interceptors     |
| Manual `res.json()` + `res.ok`  | Auto JSON parsing + auto error throw   |
| Indeterminate upload progress   | Real % progress bar via `onUploadProgress` |
| Verbose request setup           | Concise `client.get/post/patch/delete` |

---

## Architecture

```
frontend/src/api/api.js    — Axios client → backend API
                                                   ↓
backend/server.js          — Express 5 entry point
backend/routes/            — URL → controller mapping
backend/controllers/       — Request handlers (thin)
backend/models/            — Mongoose schemas + indexes
backend/db/db.js           — MongoDB connection + seed
backend/services/          — CSV parsing, categorisation
```

### MongoDB Collections

**transactions**
```
{ _id, date, description, amount, balance, categoryId, source, createdAt, updatedAt }
```
Indexes: `{ date: -1 }`, `{ categoryId: 1 }`, `{ amount: 1 }`, `{ description: "text" }`, `{ date: -1, categoryId: 1 }`

**categories**
```
{ id, name, color, icon }
```
Index: `{ id: 1 }` (unique)

### Performance Optimisations

- **Indexes**: All filter/sort fields indexed — queries use the index, not a collection scan
- **Full-text search**: `{ description: "text" }` index replaces slow `$regex` scans
- **Aggregation pipelines**: Analytics computed inside MongoDB with `$facet` — a single round-trip returns all dashboard data
- **`$match` first**: Date range filter at the start of the pipeline reduces the working set for all subsequent stages
- **Bulk insert**: `insertMany()` for CSV import — one round-trip for hundreds of rows
- **`updateMany()`**: Category deletion reassigns transactions in one command
- **Parallel queries**: `Promise.all()` for the export endpoint fetches transactions + categories concurrently
- **`.lean()`**: Returns plain JS objects instead of full Mongoose documents for read-only responses

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally, or a [MongoDB Atlas](https://www.mongodb.com/atlas) connection string

### 1. Start MongoDB locally
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu / Debian
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 --name mongo mongo:7
```

### 2. Configure environment
```bash
cd backend
cp .env.example .env
# Edit .env and set MONGODB_URI if not using localhost:27017
```

### 3. Install and run

```bash
# From the project root:
npm run install:all   # installs root + backend + frontend deps

# Start both servers:
npm run dev           # backend on :3001, frontend on :3000
```

Or run separately:
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

### 4. Open the app
Visit http://localhost:3000

---

## Environment Variables

**backend/.env**
```
MONGODB_URI=mongodb://localhost:27017/financeflow
PORT=3001
```

**frontend/.env.local** (optional — only needed for production)
```
VITE_API_URL=https://api.myapp.com
```

---

## New Package Summary

### Backend added
| Package    | Version  | Purpose                          |
|------------|----------|----------------------------------|
| `mongoose` | `^8.9.0` | MongoDB ODM — schema, queries, validation |
| `dotenv`   | `^16.4.5`| Load `.env` into `process.env`   |

### Backend removed
| Package | Reason                              |
|---------|-------------------------------------|
| `uuid`  | MongoDB ObjectId replaces UUID IDs  |

### Frontend added
| Package | Version   | Purpose                            |
|---------|-----------|------------------------------------|
| `axios` | `^1.7.9`  | HTTP client with interceptors + upload progress |
