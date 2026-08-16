-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.staff (
  id text NOT NULL,
  username text,
  email text,
  first_name text,
  last_name text,
  role text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'active'::text,
  cases integer DEFAULT 0,
  full_name text,
  color text DEFAULT 'pink'::text,
  last_login timestamp with time zone,
  CONSTRAINT staff_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id text NOT NULL,
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
  last_login timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  middle_name text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cases (
  id text NOT NULL,
  case_number text,
  type text,
  reporter text,
  description text,
  location text,
  status text,
  assigned_officer text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cases_pkey PRIMARY KEY (id),
  CONSTRAINT cases_assigned_officer_fkey FOREIGN KEY (assigned_officer) REFERENCES public.staff(id)
);
CREATE TABLE public.messages (
  id text NOT NULL,
  case_id text,
  sender_uid text,
  content text,
  attachments jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id)
);
CREATE TABLE public.notifications (
  id text NOT NULL,
  recipient_uid text,
  actor_uid text,
  title text,
  body text,
  payload jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.help_centers (
  id text NOT NULL,
  name text,
  address text,
  contact_info jsonb,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT help_centers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.activity_logs (
  id text NOT NULL,
  case_id text,
  log_id text,
  timestamp timestamp with time zone DEFAULT now(),
  action text,
  action_by text,
  action_by_name text,
  from_status text,
  to_status text,
  notes text,
  metadata jsonb,
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id)
);
CREATE TABLE public.resolutions (
  id text NOT NULL,
  resolution_id text,
  case_id text,
  submitted_by text,
  submitted_by_name text,
  submitted_at timestamp with time zone,
  notes text,
  completion_date timestamp with time zone,
  evidence_urls jsonb,
  status text,
  reviewed_by text,
  reviewed_by_name text,
  reviewed_at timestamp with time zone,
  review_comments text,
  CONSTRAINT resolutions_pkey PRIMARY KEY (id),
  CONSTRAINT resolutions_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id)
);
CREATE TABLE public.evidence_files (
  id text NOT NULL,
  case_id text,
  filename text,
  url text,
  storage_meta jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT evidence_files_pkey PRIMARY KEY (id),
  CONSTRAINT evidence_files_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id)
);
CREATE TABLE public.access_logs (
  id text NOT NULL,
  file_id text,
  action text,
  actor_uid text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT access_logs_pkey PRIMARY KEY (id),
  CONSTRAINT access_logs_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.evidence_files(id)
);
CREATE TABLE public.communications (
  id text NOT NULL,
  case_id text,
  type text,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT communications_pkey PRIMARY KEY (id),
  CONSTRAINT communications_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(id)
);