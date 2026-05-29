-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Analyses table
create table public.analyses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  title text not null,
  transcript text not null,
  duration_minutes integer not null,
  attendee_count integer not null,
  avg_salary integer not null,

  -- AI output
  summary text not null,
  decisions jsonb not null default '[]',
  action_items jsonb not null default '[]',
  uselessness_score integer not null,
  async_score integer not null,
  wasted_time_minutes integer not null,
  salary_burn integer not null,
  speaking_balance jsonb not null default '[]',
  emotional_tone text not null,
  archetype text not null,
  archetype_description text not null,

  -- Fun metrics
  buzzword_density integer not null default 0,
  synergy_count integer not null default 0,
  quick_question_count integer not null default 0,
  decision_avoidance_level integer not null default 0,

  -- Recommendations
  async_replacement text not null,
  recommendations jsonb not null default '[]'
);

-- Row-level security
alter table public.analyses enable row level security;

create policy "Users can view own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own analyses"
  on public.analyses for delete
  using (auth.uid() = user_id);

-- Index for fast user queries
create index analyses_user_id_created_at_idx on public.analyses(user_id, created_at desc);
