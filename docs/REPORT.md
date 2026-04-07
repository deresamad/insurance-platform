# Lab Report: Secure Insurance Platform

**Course:** Modern Web Technologies  
**Project:** NorthStar Insurance & Financial Services — secure full-stack insurance prototype  
**Stack:** Node.js, Express (HTTPS), MongoDB, JWT, Next.js (React)

---

## 1. Lab objective

Design and implement a **two-sided insurance platform** (customers and internal staff) with:

- **HTTPS** for API transport in development (self-signed certificates).
- **JWT** authentication and protected REST APIs.
- **Role-based access control (RBAC)** with **admin-only** role assignment.
- **Ownership rules** so customers access only their own policies, claims, amendments, and reductions.
- **Comprehensive user profiles** and workflows for policies, amendments, reductions, and claims.

---

## 2. Architecture overview

| Layer | Technology | Responsibility |
|--------|------------|----------------|
| Frontend | Next.js 15 (App Router) | Customer, internal, and admin portals; client-side route guards; API client |
| API proxy (dev) | Next.js Route Handler (`/insurance-api/*`) | Forwards browser requests to HTTPS Express API while avoiding self-signed cert issues in the browser |
| Backend | Express on Node `https` | REST API under `/api`, JWT validation, RBAC middleware, business logic |
| Data | MongoDB (Atlas or local) | Users, roles, policies, amendments, reductions, claims |

**Backend layout (high level):** `routes/` → `controllers/` → `services/` → `models/` with `middleware/` for auth, roles, validation, and errors.

---

## 3. Authentication flow (JWT)

1. User submits **username** and **password** to `POST /api/auth/login`.
2. Server validates credentials (bcrypt compare), checks **account status** is `ACTIVE`, updates **lastLoginAt**.
3. Server returns a **signed JWT** (`jsonwebtoken`) and a **sanitized user** object (no password hash).
4. Token claims include **`userId`**, **`username`**, **`roles`**, plus standard **`iat`** and **`exp`** (`JWT_EXPIRES_IN`, e.g. 2h).
5. Client stores the token (e.g. `localStorage`) and sends `Authorization: Bearer <token>` on protected calls.
6. **`authenticate`** middleware verifies the JWT, loads the user from the database (so **role changes** apply on the next request), and rejects **inactive** accounts.

Passwords are **never** stored in the token or returned in API responses.

---

## 4. Authorization flow (RBAC + ownership)

- **Authentication** proves identity (valid JWT + active user).
- **Authorization** uses **`authorizeRoles(...)`** to restrict routes (e.g. only `ADMIN` for RBAC APIs, only `AGENT`/`ADMIN` to create policies).
- **Customers** list and view policies only where **`customer`** equals their user id; similar patterns apply to claims, amendments, and reductions where applicable.
- **Administrator** is the only role that may **assign/remove roles** via `/api/admin/rbac`.

---

## 5. Comprehensive user profile design

Each user has:

- **Authentication layer:** `username`, `passwordHash`, `roles`, `accountStatus`, `lastLoginAt`, timestamps.
- **Business profile (embedded):** name, DOB, email, phone, address, customer/employee identifiers, `userType`, contact preferences, emergency contacts; internal fields (department, job title, supervisor, internal access); customer fields such as `clientCategory` and life-insurance beneficiary note placeholder.

**Rules:** Customers may update **allowed personal fields** via `PUT /api/profile/me` (allow-list enforced server-side). Admins manage other users through admin user APIs.

---

## 6. RBAC management (admin)

- Admin APIs: list users, view/update users, activate/deactivate accounts, **list roles**, **assign role**, **remove role**.
- Only **`ADMIN`** can change role assignments; non-admins receive **403**.

---

## 7. HTTPS configuration (development)

- Express is started with Node’s **`https.createServer`**, using either **PEM key + certificate** (`HTTPS_KEY_PATH`, `HTTPS_CERT_PATH`) or **PKCS#12** (`HTTPS_PFX_PATH`, `HTTPS_PFX_PASSPHRASE`).
- Local certificates are generated with **OpenSSL** (`npm run gen-cert` in `backend-api`).
- The browser talks to the Next.js app over **HTTP** in dev; Next proxies to **`https://127.0.0.1:5001`** so the UI works without trusting the self-signed cert in the browser for XHR.

---

## 8. Business workflows (summary)

- **Policies:** LIFE / CAR / HOME; create (agent/admin), list/view with role and ownership rules; product-specific fields (e.g. beneficiary, vehicle, property address).
- **Amendments:** Request → underwriter approve/reject → status visible to authorized users.
- **Reductions:** Customer request → underwriter decision.
- **Claims:** Customer submit → adjuster approve/reject with comments.

---

## 9. Testing performed

| Scenario | Result |
|----------|--------|
| API starts over HTTPS | OK (with valid TLS env + certs) |
| Valid login returns JWT | OK |
| Invalid login rejected | OK (401) |
| Protected route without token | 401 |
| Customer sees own policies only | OK (by design) |
| Admin / RBAC | OK (admin-only role changes) |
| Automated smoke (`backend-api` `npm run test:api`) | Exercises login + profile with in-memory MongoDB |



---

## 10. Screenshots (working features)

Screenshots are stored in the repository under **`docs/screenshots/`**:

1. **Login** — `01-login-demo-accounts.png`  
2. **Dashboard (internal/admin workspace)** — `02-dashboard-admin-workspace.png`  
3. **Policies list** — `03-policies-list-car-policy.png`  



---

## 11. Conclusion

The platform demonstrates **HTTPS-backed APIs**, **JWT authentication**, **RBAC**, **admin-controlled roles**, **ownership enforcement** for customer data, and **insurance workflows** aligned with the lab specification, with clear separation between customer-facing and internal operational features.

---

### Exporting this report to PDF or Word

- **Editor:** Open this file in your editor and print or export as PDF if supported.  
- **Pandoc (if installed):** `pandoc docs/REPORT.md -o docs/REPORT.pdf`  
- **Microsoft Word:** Open Word → insert this file as text or use a Markdown converter, then add screenshot images from `docs/screenshots/`.  
- **Google Docs:** Paste sections and upload images manually.

Do **not** put real **passwords**, **MongoDB URIs**, or **JWT secrets** in the report or in any committed file.
