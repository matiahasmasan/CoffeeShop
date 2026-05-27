# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CoffeeShop is a loyalty card app with a Node.js/Express backend and a React/Vite frontend. Users collect points at coffee shops; baristas scan QR codes to award points; owners manage their store's menu and staff.

## Commands

### Backend (`cd backend`)
```
npm run dev       # nodemon auto-reload on port 8000
npm start         # production
npm test          # vitest run (single pass)
npm run test:watch
```

### Frontend (`cd frontend`)
```
npm run dev       # Vite dev server
npm run build
npm run lint      # ESLint
npm test          # vitest (watch mode)
```

Run a single test file:
```
npx vitest run src/tests/Login.test.jsx          # frontend
npx vitest run src/tests/auth.test.js            # backend
```

## Environment

**`backend/.env`** — `JWT_SECRET`, `HASHIDS_SALT`, `PORT` (default 8000)  
**`frontend/.env`** — `VITE_API_URL=http://localhost:8000`

Uploaded images are served statically from `backend/uploads/` at `http://localhost:8000/uploads/<filename>`.

## Architecture

### Backend

The entire API lives in a single file: `backend/src/server.js`. There are no route files or controllers. MySQL is accessed via the callback-based `mysql` package through a single persistent connection (`con`).

**Role system** (stored in `users.role_id`):
| role_id | Role |
|---------|------|
| 1 | Admin |
| 2 | Regular customer |
| 3 | Store owner |
| 4 | Barista |

**JWT auth** — tokens expire in 1h and are issued with the server's start timestamp. The `verifyToken` middleware rejects any token with `iat < SERVER_START_TIME`, so every server restart invalidates all existing sessions. `store_id` is embedded in the JWT payload for roles 3 and 4 (looked up from `store_staff` at login time).

**Key DB tables**: `users`, `stores`, `store_images`, `store_staff` (maps both owners and baristas to a store), `loyalty_cards` (user×store, tracks `points` and `total_points_earned`), `liked_stores`, `reviews`, `menu_categories`, `menu_items`.

**QR flow**: Customer visits `/qr` → gets a short Hashids-encoded code → barista scans it via `POST /api/qr/resolve` → then calls `POST /api/barista/points/add` or `POST /api/barista/reward/redeem`.

### Frontend

React 19 + React Router v7 + Tailwind CSS v4. Auth state lives exclusively in `localStorage` (`token` and `user` keys). On app mount, `useSessionGuard` in `App.jsx` validates the token against `/api/likes` and clears storage + redirects on 401/403.

**`ProtectedRoute`** (`src/middleware/auth.jsx`) wraps role-restricted routes. It reads `user.role_id` from localStorage and redirects to `/login` if the role isn't in `allowedRoles`.

**Route → role mapping**:
- `/home`, `/cards`, `/map`, `/settings`, `/card/:id` → role 2 (customer)
- `/owner-dashboard`, `/owner/menu` → role 3 (owner)
- `/barista-dashboard` → role 4 (barista)
- `/adminDashboard`, `/admin/*` → role 1 (admin)

Every page that calls the API uses the pattern:
```js
const API = import.meta.env.VITE_API_URL;
Authorization: `Bearer ${localStorage.getItem("token")}`
```

### Testing

Backend tests mock the `mysql` module entirely (no real DB connection needed). Frontend tests mock `fetch`, `localStorage`, and `useNavigate`. The backend `app` is exported from `server.js` only when `NODE_ENV === 'test'`.
