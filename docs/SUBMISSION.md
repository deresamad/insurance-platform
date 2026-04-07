# Submission checklist (Modern Web Technologies lab)

Use this list before you upload or submit.

## Required deliverables

- [ ] **GitHub repository link** — repo is public or shared as your instructor requires  
- [ ] **Report** — PDF or DOCX (objectives, architecture, auth/RBAC, HTTPS, JWT, profile module, testing, screenshots)  
- [ ] **Screenshots** — evidence of working features (this repo includes starter shots under `docs/screenshots/`; add more if needed)  

## Repository requirements

- [ ] **Complete** — `backend-api` and `frontend-web` both present with source code  
- [ ] **Organized** — clear folders; see root `README.md` for layout  
- [ ] **No secrets in Git** — confirm the following are **not** committed:  
  - `backend-api/.env`  
  - `frontend-web/.env.local`  
  - Any file containing `MONGODB_URI` passwords, `JWT_SECRET`, or API keys  
- [ ] **Templates only** — `backend-api/.env.example` and `frontend-web/.env.local.example` **are** safe to commit (placeholders only)  
- [ ] **Startup instructions** — root `README.md` (clone → certs → env → seed → run)  

## Before `git push`

Run from the repository root:

```bash
git status
```

If you see `.env` or `.env.local`, **unstage them** and ensure root `.gitignore` is committed:

```bash
git rm --cached backend-api/.env frontend-web/.env.local 2>/dev/null || true
```

**Rotate** any password or connection string that was ever committed or shared in plain text (e.g. MongoDB Atlas user password).

## Optional: more screenshots

Consider adding (if required):

- Browser showing `https://localhost:5001` or API health  
- Admin RBAC / user management  
- Customer vs staff views  
- Postman or terminal showing JWT login and a protected `GET`

Place additional PNGs in `docs/screenshots/` and list them in `docs/screenshots/README.md`.
