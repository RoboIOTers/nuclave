-- Account-linked arenas
-- Optionally associate an arena with an authenticated user (auth_users) so the
-- arena follows the user across browsers and devices. NULL for guest-created
-- arenas, where identity falls back to creator_token (the localStorage token).
ALTER TABLE arenas ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth_users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS arenas_user_id_idx ON arenas(user_id);
