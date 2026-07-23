-- iLoveImage Supabase / Postgres Database Schema
-- Dedicated 10% Public Storage Pool with Single-Download Deletion & 10-Min Expiry

-- Sessions table (one per share link)
create table if not exists public.sessions (
  id text primary key,
  status text not null default 'pending',  -- 'pending', 'ready', 'completed', 'expired', 'cancelled'
  total_size_bytes bigint not null default 0,
  uploaded_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Files table (multiple files per session)
create table if not exists public.files (
  id text primary key,
  session_id text not null references public.sessions(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  content_type text not null default 'application/octet-stream',
  size_bytes bigint not null,
  file_hash text not null,  -- SHA-256 fingerprint of original raw bytes
  status text not null default 'available', -- 'available', 'claimed', 'downloaded', 'expired', 'deleted'
  downloaded_at timestamptz
);

-- Index for cleanup queries (expired or abandoned sessions and files)
create index if not exists idx_sessions_status_expires on public.sessions(status, expires_at);

-- Index for file queries and atomic status updates
create index if not exists idx_files_session_status on public.files(session_id, status);

-- Enable Row Level Security
alter table public.sessions enable row level security;
alter table public.files enable row level security;

-- RLS: Allow service_role full access (used by API routes)
create policy "Service role full access sessions" on public.sessions
  for all using (true) with check (true);

create policy "Service role full access files" on public.files
  for all using (true) with check (true);
