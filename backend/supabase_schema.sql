-- Supabase schema mapping for VIOLES migration from Firestore
-- Run this on your Supabase database (psql or SQL editor)

-- NOTE: Using text primary keys to preserve existing Firebase-generated IDs.

CREATE TABLE IF NOT EXISTS staff (
  id text PRIMARY KEY,
  username text,
  email text,
  first_name text,
  last_name text,
  role text,
  avatar text,
  profile jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_email_idx ON staff(email);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  first_name text,
  last_name text,
  email text,
  barangay text,
  city text,
  role text,
  emergency text,
  contact_number text,
  status text,
  registration_complete boolean DEFAULT false,
  last_login timestamptz,
  profile jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

CREATE TABLE IF NOT EXISTS cases (
  id text PRIMARY KEY,
  case_number text,
  type text,
  reporter text,
  location text,
  status text,
  assigned_officer text REFERENCES staff(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cases_created_idx ON cases(created_at);

CREATE TABLE IF NOT EXISTS messages (
  id text PRIMARY KEY,
  case_id text REFERENCES cases(id) ON DELETE CASCADE,
  sender_uid text,
  content text,
  attachments jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_case_idx ON messages(case_id);

CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  recipient_uid text,
  actor_uid text,
  title text,
  body text,
  payload jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications(recipient_uid);

CREATE TABLE IF NOT EXISTS help_centers (
  id text PRIMARY KEY,
  name text,
  address text,
  contact_info jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id text PRIMARY KEY,
  case_id text REFERENCES cases(id) ON DELETE CASCADE,
  log_id text,
  timestamp timestamptz DEFAULT now(),
  action text,
  action_by text,
  action_by_name text,
  from_status text,
  to_status text,
  notes text,
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS resolutions (
  id text PRIMARY KEY,
  resolution_id text,
  case_id text REFERENCES cases(id) ON DELETE CASCADE,
  submitted_by text,
  submitted_by_name text,
  submitted_at timestamptz,
  notes text,
  completion_date timestamptz,
  evidence_urls jsonb,
  status text,
  reviewed_by text,
  reviewed_by_name text,
  reviewed_at timestamptz,
  review_comments text
);

CREATE TABLE IF NOT EXISTS evidence_files (
  id text PRIMARY KEY,
  case_id text REFERENCES cases(id) ON DELETE CASCADE,
  filename text,
  url text,
  storage_meta jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS access_logs (
  id text PRIMARY KEY,
  file_id text REFERENCES evidence_files(id) ON DELETE CASCADE,
  action text,
  actor_uid text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Generic communications/referrals table
CREATE TABLE IF NOT EXISTS communications (
  id text PRIMARY KEY,
  case_id text REFERENCES cases(id) ON DELETE SET NULL,
  type text,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Utility: function to keep updated_at in sync
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
