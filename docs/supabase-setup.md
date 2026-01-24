# Supabase Setup (Repo-Managed)

Project ref: `wcskxvjtkuqpkkmdtpgb`

## 1) Install Supabase CLI

Windows (Scoop):
- Install Scoop if needed: `iwr -useb get.scoop.sh | iex`
- Add Supabase bucket: `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git`
- Install CLI: `scoop install supabase`

macOS (Homebrew):
- `brew install supabase/tap/supabase`

## 2) Login + link this repo to your project

From the repo root:
- `supabase login`
- `supabase link --project-ref wcskxvjtkuqpkkmdtpgb`

This creates a local link file under `supabase/.temp/` (gitignored).

## 3) Apply database migrations (schema + RLS + storage policies)

- `supabase db push`

This applies `supabase/migrations/*` to the linked Supabase project.

## 4) Verify in Supabase Dashboard

- Table Editor: confirm tables exist (`profiles`, `books`, `notes`, etc.).
- Auth → Users: create a test user.
- Table Editor → `profiles`: confirm a row is created automatically for that user.

## 5) Add frontend env vars (Vite)

Create a local env file (example: `.env.local`) with:
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`

Do not put the service-role key in the client.

## 6) Storage upload expectations
- Buckets already defined: `avatars`, `book-covers`, `note-images` (public), `note-audio` (private).
- Upload object names must be prefixed with the user id to satisfy policies, e.g.:
  - `avatars/<user_id>/<uuid>.jpg`
  - `book-covers/<user_id>/<uuid>.jpg`
  - `note-images/<user_id>/<uuid>.jpg`
  - `note-audio/<user_id>/<uuid>.m4a`
- Private audio should be served with signed URLs (policy blocks public read).
- Frontend helpers exist in `src/api/storage.ts` to enforce allowed types/sizes and user-id pathing, and to fetch signed URLs for note audio. Use these instead of calling storage directly.

## 7) If you need to re-run
- You can re-run `supabase db push` any time after changing migration files.
- To reset the local link: delete `supabase/.temp/` then rerun `supabase link --project-ref wcskxvjtkuqpkkmdtpgb`.
- Recent migrations include:
  - `20260118000100_review_sessions.sql` (review session RPCs)
  - `20260118000200_social.sql` (social posts/comments/likes/follows schema)
  - `20260119000100_activity_feed.sql` (auto social posts when books are added or notes are shared/made public)

## 8) Frontend wiring (current status)
- Supabase client lives in `src/lib/supabaseClient.ts` (reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).
- Profile helpers live in `src/lib/supabaseProfile.ts`; Header and MyProfile load/update profile from Supabase when a session exists.
- Auth page supports email/password with verification, password reset, and recovery (redirects use `window.location.origin`; update when deploying).
- Data layer uses React Query + Supabase (`src/api/*`, `src/api/hooks.ts`); books/notes/profile migrated off localStorage; review widgets, import/export, and stats are hooked up.
- Folder/Collection managers now use Supabase hooks; SavedFiltersBar is wired into the Notes filters to save/apply filters.
- Review sessions now use Supabase RPCs (`review_pick_notes`, `review_start_session`, `review_mark_note`, `review_complete_session`, `note_mark_reviewed`), so ensure migrations are pushed.
- Social feed/comments/follows now call Supabase with profile joins; post creation UX is pending. AI actions are handled via the `ai-actions` Edge Function (Gemini).

## 9) Auth redirect configuration
- In Supabase Dashboard → Authentication → URL Configuration, set:
  - `Site URL`: for local dev this can be `http://localhost:8080` (the Vite dev URL for this repo). For prod, set your real domain.
  - `Additional Redirect URLs`: include `http://localhost:8080/auth` (dev), and your production `/auth` URL.
- The auth page uses `window.location.origin` for email verification/reset redirect links; update when you deploy to a real domain.

## 10) AI actions (Gemini via Edge Functions)
- Secrets (set once per project):
  - `GEMINI_API_KEY_ACTIONS=<your Gemini API key>`
  - Optional: `GEMINI_MODEL=gemini-2.5-flash` (default)
- Deploy the function:
  - `supabase functions deploy ai-actions`
- Local testing (Docker required): `supabase functions serve ai-actions`
- Frontend calls use `supabase.functions.invoke('ai-actions', ...)` and send the anon key; publishable keys are not used.

## 11) OCR (Gemini via Edge Functions)
- Secrets (set once per project):
  - `GEMINI_API_KEY_OCR=<your Gemini API key>`
  - Optional: `GEMINI_MODEL_OCR=gemini-2.5-flash` (default)
- Deploy the function:
  - `supabase functions deploy ai-ocr`
- Local testing (Docker required): `supabase functions serve ai-ocr`
- Call with `{ imageBase64, mimeType?, prompt? }` where `imageBase64` is base64 data (no data: prefix needed). Returns `{ text }`.

