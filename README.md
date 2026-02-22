# 💹 FinanceFlow — CSV Finance Manager (v2)

A full-stack finance management web app with a clean, modular architecture.

---

## 🏗 Tech Stack

| Layer    | Tech                                          |
|----------|-----------------------------------------------|
| Frontend | React 18, Recharts, custom hooks              |
| Backend  | Node.js, Express, Multer, csv-parse           |
| Storage  | In-memory store (swappable to any DB)         |

---

## 📁 Project Structure

```
finance-app/
├── backend/
│   ├── server.js                          # App entry point (Express setup only)
│   ├── package.json
│   ├── routes/
│   │   ├── transactions.routes.js         # Route definitions for /api/transactions
│   │   ├── categories.routes.js           # Route definitions for /api/categories
│   │   └── analytics.routes.js            # Route definitions for /api/analytics & /api/export
│   ├── controllers/
│   │   ├── transactions.controller.js     # Request/response handling for transactions
│   │   ├── categories.controller.js       # Request/response handling for categories
│   │   └── analytics.controller.js        # Request/response handling for analytics
│   ├── services/
│   │   ├── csvParser.service.js           # CSV parsing, column detection, date normalization
│   │   ├── categorizer.service.js         # Keyword-based auto-categorization rules
│   │   └── analytics.service.js           # Pure analytics computation functions
│   ├── middleware/
│   │   ├── upload.middleware.js           # Multer CSV upload config
│   │   └── errorHandler.middleware.js     # Centralized error handler
│   └── data/
│       └── store.js                       # In-memory data store (swap this for a DB)
│
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx                        # Root: tab routing & global state
        ├── index.js
        ├── api/
        │   └── api.js                     # Centralized API client (all fetch calls)
        ├── hooks/
        │   └── useCategories.js           # Custom hook: fetch & cache categories
        ├── utils/
        │   └── formatters.js              # formatCurrency, formatDate, etc.
        ├── components/
        │   ├── Header.jsx                 # Top nav bar
        │   └── UI.jsx                     # Shared primitives: Badge, StatCard, Card, styles
        └── pages/
            ├── Dashboard.jsx              # Charts & analytics overview
            ├── Transactions.jsx           # Filterable/sortable transaction table
            ├── Upload.jsx                 # Drag-and-drop CSV uploader
            └── Categories.jsx             # Category management
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd backend  && npm install
cd ../frontend && npm install

# 2. Start the backend (port 3001)
cd backend && npm start
# or with auto-reload:
npm run dev

# 3. Start the frontend (port 3000)
cd frontend && npm start
```

Open **http://localhost:3000**

---

## 🔧 Architecture Decisions

### Backend layers

| Layer        | Responsibility                                 |
|--------------|------------------------------------------------|
| `routes/`    | Map HTTP verbs + paths to controller functions |
| `controllers/` | Parse req, call services, send res           |
| `services/`  | Business logic (CSV parsing, analytics, etc.)  |
| `middleware/`| Cross-cutting concerns (upload, error handling)|
| `data/store.js` | Single source of truth for all data         |

### Frontend layers

| Layer         | Responsibility                                 |
|---------------|------------------------------------------------|
| `api/api.js`  | All HTTP calls in one place                    |
| `hooks/`      | Reusable data-fetching logic                   |
| `utils/`      | Pure formatting functions                      |
| `components/` | Reusable UI primitives                         |
| `pages/`      | Full page views (one per tab)                  |
| `App.jsx`     | Tab routing and global refresh state           |

---

## 🛠 How to Extend

### Add a new auto-category rule
Edit `backend/services/categorizer.service.js` — just add an entry to the `RULES` array. No other files change.

### Swap the in-memory store for a real database
Replace the getter/setter functions in `backend/data/store.js` with async DB queries. The controllers and services are already written to call through this interface.

### Add a new API endpoint
1. Add a function to a `controllers/` file
2. Register it in the matching `routes/` file
3. Mount the router in `server.js` (if it's a brand-new resource)

### Add a new frontend page
1. Create `frontend/src/pages/MyPage.jsx`
2. Add the tab name to the `TABS` array in `Header.jsx`
3. Render it conditionally in `App.jsx`

---

## 📄 API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/transactions/upload` | Upload CSV file |
| GET | `/api/transactions` | List (filterable, sortable) |
| PATCH | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete one |
| DELETE | `/api/transactions` | Delete all |
| GET | `/api/analytics` | Dashboard analytics |
| GET | `/api/export` | Download as CSV |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| PATCH | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |
