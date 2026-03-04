# Marginalia

Your reading-notes companion built with Vite + React + TypeScript + Tailwind/shadcn-ui.

## Local development

```sh
# 1) Install dependencies
npm ci

# 2) Start the dev server (http://localhost:8080)
npm run dev
```

Supabase setup (auth, database, storage) is documented in `docs/supabase-setup.md`.

## Build and preview

```sh
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Push this repo to GitHub (for example, `https://github.com/<your-user>/<your-repo>`).
2. In GitHub, open your repo: `Settings -> Pages` and set `Source` to `GitHub Actions`.
3. In `Settings -> Secrets and variables -> Actions`, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Push to `main` (or run the workflow manually from the `Actions` tab).

This repo now includes `.github/workflows/deploy-pages.yml`, which builds and publishes the `dist` folder automatically to:

`https://<your-user>.github.io/<your-repo>/`

## Tech stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
