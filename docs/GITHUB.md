# Push this project to GitHub

## 1. One-time: create the repo on GitHub

On [github.com/new](https://github.com/new):

- Choose a name (e.g. `insurance-platform`).
- Leave **empty** (no README, no .gitignore) — you already have files locally.
- Create the repository.

## 2. From your laptop (in `insurance-platform`)

Rename the default branch to `main` (if you still see `master`):

```bash
cd /Users/pc/Desktop/insurance-platform
git branch -m main
```

Add GitHub as `origin` (replace `YOUR_USER` and `YOUR_REPO`):

```bash
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
```

Push:

```bash
git push -u origin main
```

Use your GitHub login or a **Personal Access Token** when Git asks for a password.

### Using GitHub CLI (`gh`)

```bash
cd /Users/pc/Desktop/insurance-platform
git branch -m main
gh repo create YOUR_REPO --private --source=. --remote=origin --push
```

## 3. Confirm before you submit

- Open the repo on GitHub in a browser.
- Confirm **no** `backend-api/.env` or `frontend-web/.env.local` appears in the file list.
- Submit the **repository URL** plus your **report** (PDF/DOCX from `docs/REPORT.md`) and any extra screenshots your instructor wants.
