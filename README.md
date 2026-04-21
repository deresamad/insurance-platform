# NorthStar Insurance Platform

Secure full-stack prototype for **Modern Web Technologies** coursework: **Node.js / Express**, **JWT authentication**, **RBAC**, and **Next.js** portals for customers, internal staff, and administrators.

**Repository:** [github.com/deresamad/insurance-platform](https://github.com/deresamad/insurance-platform)

## Team members

| Contributor | Notes |
|-------------|--------|
| **[@deresamad](https://github.com/deresamad)** | Sole author — profile administration & RBAC assignment |

## Repository layout

| Path | Description |
|------|-------------|
| `backend-api/` | Express REST API under `/api`, MongoDB, JWT, TLS |
| `frontend-web/` | Next.js App Router UI (customer, internal, admin) |
| `infrastructure/` | Keycloak realm import (optional SSO) |
| `docs/` | Extra documentation / evidence (e.g. screenshots) |

## Implemented features (User profile & admin RBAC)

- **Own profile:** `GET /api/profile/me` — `/profile`
- **Edit own profile:** `PUT /api/profile/me` — `/profile/edit` (validated form; roles & status not editable here)
- **Self-service suspension:** `POST /api/profile/me/suspend` — `/profile` (non-admin roles only; logout; suspended users cannot authenticate)
- **Admin user list:** `GET /api/admin/users` — `/admin/users`
- **Admin create user:** `POST /api/admin/users` — `/admin/users/create`
- **Admin load / update user:** `GET` / `PUT /api/admin/users/:userId` — `/admin/users/[id]/edit`
- **Admin status:** `PUT /api/admin/users/:userId/status` — `/admin/account-status`
- **RBAC:** `GET /api/admin/rbac/roles`, `PUT /api/admin/rbac/users/:userId/roles` — `/admin/rbac`
- **Enforcement:** `RoleGuard` / `ProtectedRoute` on admin routes; API uses `authenticate` + `authorizeRoles("ADMIN")` where required
- **Safety:** at least one active **ADMIN** must remain (last active admin cannot be suspended or stripped of admin)

Authentication flows (local JWT and optional Keycloak) are unchanged at the route level; authorization is layered as above.

## Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- OpenSSL (if you generate dev TLS certs for the API)

## Quick start

### 1. TLS certificates (development)

The API may be served with **Node `https`**. From `backend-api/`:

```bash
cd backend-api
npm run gen-cert
chmod 600 cert/server.key   # recommended on Unix
```

See `backend-api/.env.example` for `HTTPS_*` or PKCS#12 options.

### 2. Backend

```bash
cd backend-api
cp .env.example .env
# Set MONGODB_URI, JWT_SECRET, FRONTEND_URL, HTTPS_* as needed

npm install
npm run seed
npm run dev
```

Default API base (from `.env`): often `https://localhost:5001/api`.

### 3. Frontend

```bash
cd frontend-web
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL to your API (see .env.local.example for dev proxy notes)

npm install
npm run dev
```

Open `http://localhost:3000`.

## JWT & session behavior

- **Login** (`POST /api/auth/login`) returns a signed JWT and a sanitized user (no password hash).
- Protected routes: `Authorization: Bearer <token>` and/or cookie-based session (see app config).
- **Non-ACTIVE** accounts cannot use the API; local login is rejected for suspended/inactive users.

## Sample users (after `npm run seed`)

Password for seeded demo accounts: **`Password123!`**

| Username | Role(s) |
|----------|---------|
| admin1 | ADMIN |
| customer1 | CUSTOMER |
| agent1 | AGENT |
| underwriter1 | UNDERWRITER |
| adjuster1 | CLAIMS_ADJUSTER |

## Optional Keycloak

Backend routes under `/api/auth/keycloak/*`. Configure `KEYCLOAK_*` in `backend-api/.env` if used; local JWT works without Keycloak.

## API reference (profile & admin subset)

Base path: `/api` (e.g. `https://localhost:5001/api`).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profile/me` | User | Own profile |
| PUT | `/profile/me` | User | Update allowed profile fields |
| POST | `/profile/me/suspend` | User (non-admin) | Self-suspend account |
| GET | `/admin/users` | Admin | List users |
| POST | `/admin/users` | Admin | Create user |
| GET | `/admin/users/:userId` | Admin | Get one user |
| PUT | `/admin/users/:userId` | Admin | Update profile fields & status |
| PUT | `/admin/users/:userId/status` | Admin | Set `ACTIVE` / `INACTIVE` / `SUSPENDED` |
| GET | `/admin/rbac/roles` | Admin | List roles |
| PUT | `/admin/rbac/users/:userId/roles` | Admin | Body: `{ "roles": ["ADMIN", ...] }` role **names** |

## Screenshots (coursework)

Capture UI and place under `docs/screenshots/` (profile, edit profile, admin users, create/edit user, RBAC, account status, unauthorized, admin vs non-admin navigation).

## Scripts (root)

- `start-platform.sh` / `start-platform.bat` — convenience starters if present in your tree
- `seed.bat` — Windows seed helper if present

---

© Coursework — NorthStar Insurance Platform.
