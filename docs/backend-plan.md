# Backend Plan — Page-Pal / Marginalia

## Status
- Phase: Planning
- Stack: Recommend Supabase (Postgres + Auth + Storage) for RLS, auth, and buckets.
- Next action: Apply schema + RLS and create buckets, then start API slice 1 (Auth/Profile).

## Data Model (Postgres v1)
auth.users (provider)

profiles  
- id uuid pk references auth.users  
- username text unique, lowercased  
- display_name text  
- bio text  
- avatar_url text  
- created_at timestamptz default now()  
- updated_at timestamptz default now()

books  
- id uuid pk  
- user_id uuid fk -> profiles.id  
- title text  
- author text  
- format text check in (physical, ebook, audiobook)  
- cover_url text  
- isbn text  
- tags text[]  
- folder_id uuid fk -> folders.id on delete set null  
- display_order int default 0  
- notes_count int default 0 (maintained by trigger)  
- created_at timestamptz default now()  
- updated_at timestamptz default now()

notes  
- id uuid pk  
- user_id uuid fk -> profiles.id  
- book_id uuid fk -> books.id on delete cascade  
- type text check in (quote, idea, question, action)  
- media_type text check in (text, image, audio)  
- content text  
- image_url text  
- extracted_text text  
- audio_url text  
- audio_duration int  
- transcript text  
- location text  
- timestamp text  
- chapter text  
- context text  
- tags text[]  
- ai_summary text  
- ai_expanded text  
- ai_flashcard jsonb check (ai_flashcard ? 'question' and ai_flashcard ? 'answer')  
- is_private boolean default true  
- review_count int default 0  
- last_reviewed_at timestamptz  
- next_review_at timestamptz  
- folder_id uuid fk -> folders.id on delete set null  
- created_at timestamptz default now()  
- updated_at timestamptz default now()

folders  
- id uuid pk  
- user_id uuid fk -> profiles.id  
- name text  
- color text  
- created_at timestamptz default now()  
- updated_at timestamptz default now()

collections  
- id uuid pk  
- user_id uuid fk -> profiles.id  
- name text  
- description text  
- note_ids uuid[]  (v1 simplicity; switch to join table later if needed)  
- created_at timestamptz default now()  
- updated_at timestamptz default now()

saved_filters  
- id uuid pk  
- user_id uuid fk -> profiles.id  
- name text  
- filters jsonb  // { bookIds, types, tags, folderIds, dateRange }  
- created_at timestamptz default now()

review_sessions  
- id uuid pk  
- user_id uuid fk -> profiles.id  
- note_ids uuid[]  
- completed_note_ids uuid[]  
- created_at timestamptz default now()  
- completed_at timestamptz

reading_goals  
- id uuid pk  
- user_id uuid fk -> profiles.id  
- year int  
- yearly_book_target int  
- created_at timestamptz default now()  
- updated_at timestamptz default now()  
- unique (user_id, year)

activity_dates  
- id uuid pk  
- user_id uuid fk -> profiles.id  
- activity_date date  
- created_at timestamptz default now()  
- unique (user_id, activity_date)

(Social tables deferred to a later phase.)

## Storage Buckets
- avatars (public)
- book-covers (public)
- note-images (public)
- note-audio (private; always use signed URLs)

## RLS (enable on all tables)
- Deny by default.
- profiles: owner can update; anyone can select (optionally column-filter to hide sensitive data if added later). Owner is id = auth.uid().
- books, folders, collections, saved_filters, review_sessions, reading_goals, activity_dates: owner-only select/insert/update/delete (`user_id = auth.uid()`).
- notes:  
  - select allowed if (`user_id = auth.uid()`) OR (`is_private = false`).  
  - insert/update/delete owner-only.
- Require auth.uid() IS NOT NULL to block anonymous where applicable.

## Triggers
- updated_at: before update set updated_at = now() on mutable tables.
- notes_count: after insert/delete on notes -> increment/decrement books.notes_count.
- Optional: after insert on notes/books -> upsert activity_dates for current date (streak accuracy).

## Indexes
- books: (user_id, display_order), GIN tags.
- notes: (user_id, book_id), (user_id, next_review_at), GIN tags, full-text GIN on to_tsvector(content || ' ' || coalesce(context,'') || ' ' || coalesce(extracted_text,'' ) || ' ' || array_to_string(tags,' ')).
- activity_dates: unique (user_id, activity_date) already indexed by constraint.
- profiles: unique(username) indexed by constraint.

## API Slices (delivery order)
1) Auth + Profiles  
   - GET/PUT /profile
2) Books + Notes  
   - Books CRUD + /books/reorder  
   - Notes CRUD + search (?query=) + review update (/notes/:id/review)  
3) Folders, Collections, Saved Filters  
4) Review Sessions  
   - POST /review-sessions (choose eligible notes)  
   - GET /review-sessions/:id  
   - PUT /review-sessions/:id/complete  
   - POST /notes/:id/review (update SR fields)  
5) Reading Goals + Activity/Streak  
   - POST /activity, GET /activity/streak, GET /activity/stats  
   - GET/PUT /goals  
6) Export/Import  
   - GET /export/markdown|csv|json (matches current {books, notes} shape)  
   - POST /import/json (bind imported records to current user_id)  
7) Storage  
   - Upload or signed-url endpoints for avatars/book-covers/note-images/note-audio  
8) AI  
   - POST /ai/cleanup|expand|summarize|flashcard|ocr|transcribe (validate and store ai_* fields server-side)

## Frontend Migration Notes
- Replace `src/lib/store.ts` calls with API + React Query per slice; keep response shapes aligned with this schema.
- Preserve export/import contract: `{ books, notes }` arrays with the fields above.
- Notes UI assumes: tags[], folderId, media fields, AI fields, review fields, isPrivate, display_order, notes_count.
- Use signed URLs for private audio; randomize filenames for public buckets.

## Mobile / iOS Considerations
- API shape is mobile-friendly: JSON, UUIDs, and timestamps in ISO8601; no browser-only fields required.
- Auth: use Supabase Auth iOS SDK; keep redirect/deep link scheme ready for future social/email flows.
- Storage: signed URLs for private audio; public images ok. Keep media MIME types standard (jpeg/png/webp, webm/mp3/m4a).
- Offline: if adding later, plan for per-user sync keyed by updated_at; avoid server-generated state that can’t be merged.
- Push/social: social tables deferred; nothing in schema blocks adding APNs tokens or device tables later.

## Work Plan Checklist
- [ ] Confirm stack (Supabase recommended).
- [ ] Create buckets (avatars, book-covers, note-images, note-audio).
- [ ] Apply schema above (tables, constraints, cascades, checks).
- [ ] Add RLS policies as specified.
- [ ] Add triggers (updated_at, notes_count, optional activity-on-create).
- [ ] Add indexes for search/tags/perf.
- [ ] Implement API slice 1 (Auth/Profile) and wire profile UI.
- [ ] Implement API slice 2 (Books/Notes) and migrate `store.ts`.
- [ ] Continue slices 3–8; update Status as work completes.
