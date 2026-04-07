# NorthStar Insurance Platform

Secure full-stack prototype for **Modern Web Technologies** coursework: **Node.js / Express (HTTPS)**, **JWT authentication**, **RBAC**, **ownership rules**, and **Next.js** portals for customers, internal staff, and administrators.

## Repository layout

| Path | Description |
|------|-------------|
| `backend-api/` | Express REST API under `/api`, MongoDB, JWT, TLS |
| `frontend-web/` | Next.js App Router UI (customer, internal, admin) |

## Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- OpenSSL (for development certificates)

## Quick start

### 1. TLS certificates (development)

The API is served with **Node `https`**. Generate a local key pair:

```bash
cd backend-api
npm run gen-cert
chmod 600 cert/server.key   # recommended on Unix
```

This creates `backend-api/cert/server.key` and `cert/server.crt`. Trust the certificate in your OS/browser if prompted (or use [mkcert](https://github.com/FiloSottile/mkcert) for a locally trusted CA).

Alternatively, configure **PKCS#12** (`.pfx`) via `HTTPS_PFX_PATH` and `HTTPS_PFX_PASSPHRASE` in `.env` (see `.env.example`).

### 2. Backend

```bash
cd backend-api
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET, FRONTEND_URL, HTTPS_* paths

npm install
npm run seed          # roles + sample users
# Optional sample policy for customer1:
npm run seed:policies

npm run dev
```

API base URL: `https://localhost:5001/api` (default port from `.env`).

### 3. Frontend

```bash
cd frontend-web
cp .env.local.example .env.local

npm install
npm run dev
```

Open `http://localhost:3000`. **Development:** `.env.local` uses `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/insurance-api` so the browser only calls Next.js; a **route handler** proxies to `https://127.0.0.1:5001/api/...` using Node `https` with `rejectUnauthorized: false` in development so the self-signed API cert works. For production, point `NEXT_PUBLIC_API_BASE_URL` at your real HTTPS API (and keep `rejectUnauthorized` strict in `insurance-api/[[...path]]/route.ts`).

## JWT usage

- **Login** (`POST /api/auth/login`) validates credentials and returns a **signed JWT** and a sanitized user object (no password hash).
- Access tokens include **`userId`**, **`username`**, and **`roles`**. **`iat`** and **`exp`** are set by the library via `expiresIn` (`JWT_EXPIRES_IN`, default `2h`).
- Protected routes expect `Authorization: Bearer <token>`.
- Each request reloads the user from the database so **role and account status changes apply immediately**; the token is still validated for signature and expiry.
- **Inactive** accounts (`accountStatus` other than `ACTIVE`) cannot log in and receive **403** on API calls if a still-valid token exists.

## User profile module

Users have an **authentication layer** (username, password hash, roles, account status, `lastLoginAt`) and a **business profile** (name, contact, address, customer/employee identifiers, internal fields, optional `clientCategory` and `lifeInsuranceBeneficiaryNote` for customers). Customers may update only **allowed personal fields** via `PUT /api/profile/me`; admins manage other users through `/api/admin/users` and RBAC under `/api/admin/rbac`.

## RBAC management

Only **ADMIN** may assign or remove roles (`/api/admin/rbac`). Route handlers combine **`authenticate`**, **`authorizeRoles`**, and **ownership checks** (e.g. customers only see their own policies, amendments, reductions, and claims).

## Protected routes (frontend)

Client-side guards (`ProtectedRoute`, `RoleGuard`) redirect unauthenticated or unauthorized users. The API remains the source of truth for authorization.

## Sample users (after `npm run seed`)

Password for all seeded accounts: **`Password123!`**

| Username | Role(s) |
|----------|---------|
| `admin1` | ADMIN |
| `customer1` | CUSTOMER |
| `agent1` | AGENT |
| `underwriter1` | UNDERWRITER |
| `adjuster1` | CLAIMS_ADJUSTER |
| `csr1` | CUSTOMER_SERVICE |
| `compliance1` | COMPLIANCE_OFFICER |

## Optional Keycloak

The backend can integrate Keycloak SSO (`/api/auth/keycloak/*`). Configure the `KEYCLOAK_*` variables in `.env` if you use it; local JWT login works without Keycloak.

## Screenshots (submission)

Example evidence images for your report/instructor are in **`docs/screenshots/`** (login, dashboard, policies). See **`docs/screenshots/README.md`** for a short index. Add more PNGs there if the rubric asks for HTTPS, RBAC, Postman, etc.

## Submission checklist

Before you turn in the **GitHub link**, **report PDF/DOCX**, and **screenshots**, follow **`docs/SUBMISSION.md`**. To **push to GitHub**, use **`docs/GITHUB.md`**.

- **Report source:** `docs/REPORT.md` — export to PDF/DOCX for submission (see section 10 for screenshots).

## Report and evidence

For your submission, capture **screenshots** of the app over HTTPS, login/JWT flow, role-restricted screens, and representative API tests (Postman/curl) as required by the lab brief. The `docs/screenshots/` folder is the intended place to keep PNGs that go with the repo.
