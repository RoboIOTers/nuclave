-- Account-linked participation
-- Track the authenticated account (when present) on contributions and
-- participants, so arenas a user took part in also follow them across devices.
-- These columns are SERVER-SIDE ONLY: they are never serialized to clients,
-- preserving the anonymity of contributions.
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth_users(id) ON DELETE SET NULL;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth_users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS contributions_user_id_idx ON contributions(user_id);
CREATE INDEX IF NOT EXISTS participants_user_id_idx ON participants(user_id);
