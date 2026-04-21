# NorthStar Insurance Platform

Express + MongoDB backend, Next.js frontend, JWT auth and role checks. Built for a Modern Web Technologies course lab.

## Author

[@deresamad](https://github.com/deresamad)

## Layout

| Folder | Contents |
|--------|----------|
| `backend-api/` | REST API (`/api`), seeds, tests |
| `frontend-web/` | Next.js UI |
| `infrastructure/` | Keycloak import, optional services |
| `docs/` | Report and screenshot evidence |

## Run

**Backend**

```bash
cd backend-api
cp .env.example .env
npm install
npm run seed
npm run dev
```

TLS: from `backend-api`, `npm run gen-cert` if you use HTTPS (see `.env.example`).

**Frontend**

```bash
cd frontend-web
cp .env.local.example .env.local
npm install
npm run dev
```

App: `http://localhost:3000`. Point `NEXT_PUBLIC_API_BASE_URL` at your API (see `.env.local.example` for dev proxy notes).

## Profile and admin

Users: view/edit own profile, self-suspend (not admin). Admins: user list, create/update users, status changes, role assignment via `/admin/rbac`. Non-admins cannot hit admin APIs; UI uses the same role checks.

At least one active admin account must stay on the system (enforced in the API).

## Seed logins

After `npm run seed`, password for seeded users is `Password123!` (e.g. `admin1`, `customer1`, `agent1`, `underwriter1`, `adjuster1`).

## Keycloak

Optional SSO under `/api/auth/keycloak/*`. Configure `KEYCLOAK_*` in `backend-api/.env` if you use it.

## API (profile / admin)

Base URL: `/api` on your server host.

| Method | Path |
|--------|------|
| GET | `/profile/me` |
| PUT | `/profile/me` |
| POST | `/profile/me/suspend` |
| GET | `/admin/users` |
| POST | `/admin/users` |
| GET | `/admin/users/:userId` |
| PUT | `/admin/users/:userId` |
| PUT | `/admin/users/:userId/status` |
| GET | `/admin/rbac/roles` |
| PUT | `/admin/rbac/users/:userId/roles` |

Admin routes need an `ADMIN` role. Role body uses role names, e.g. `{ "roles": ["CUSTOMER"] }`.

## Evidence

Screenshots and a written report: `docs/screenshots/`, `docs/REPORT.md`.
