-- ITSM Co-Pilot reports table
create table public.itsm_reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  title text not null,
  report_language text not null default 'ru',
  company_context text not null default '',
  ticket_count integer not null,
  warnings jsonb not null default '[]',

  -- Computed statistics (ground truth, derived from the uploaded ticket export)
  stats jsonb not null,

  -- AI-generated narrative report
  report jsonb not null
);

-- Row-level security
alter table public.itsm_reports enable row level security;

create policy "Users can view own itsm reports"
  on public.itsm_reports for select
  using (auth.uid() = user_id);

create policy "Users can insert own itsm reports"
  on public.itsm_reports for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own itsm reports"
  on public.itsm_reports for delete
  using (auth.uid() = user_id);

-- Index for fast user queries
create index itsm_reports_user_id_created_at_idx on public.itsm_reports(user_id, created_at desc);
