-- Skills Learning Tracker — initial schema
-- Tables: skills, sessions, user_preferences. All rows are owned by auth.users and protected by RLS.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Skills
-- ---------------------------------------------------------------------------
create table public.skills (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name              text not null check (char_length(btrim(name)) between 1 and 60),
  color             text not null default '#059669' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  goal_type         text check (goal_type in ('weekly', 'total')),
  goal_target_hours numeric(6, 2) check (goal_target_hours > 0 and goal_target_hours <= 10000),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- A goal is either fully set or fully absent
  constraint skills_goal_complete check ((goal_type is null) = (goal_target_hours is null)),
  -- Enables the composite FK from sessions (guarantees a session's skill belongs to the same user)
  constraint skills_id_user_unique unique (id, user_id)
);

create index skills_user_created_idx on public.skills (user_id, created_at);

create trigger skills_set_updated_at
  before update on public.skills
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sessions
-- practiced_on is the user's LOCAL calendar date (no timezone) — streaks and the
-- heatmap are computed from it. created_at is the precise UTC moment of logging.
-- ---------------------------------------------------------------------------
create table public.sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  skill_id         uuid not null,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  practiced_on     date not null,
  notes            text check (notes is null or char_length(notes) <= 5000),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Deleting a skill removes all of its sessions (confirmed in the UI)
  constraint sessions_skill_fk foreign key (skill_id, user_id)
    references public.skills (id, user_id) on delete cascade
);

-- user + date range (heatmap, overall streak, recent sessions)
create index sessions_user_date_idx on public.sessions (user_id, practiced_on desc, created_at desc);
-- user + skill + date range (skill detail, per-skill streak & heatmap)
create index sessions_skill_date_idx on public.sessions (skill_id, practiced_on desc, created_at desc);

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- User preferences
-- ---------------------------------------------------------------------------
create table public.user_preferences (
  user_id           uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  theme             text not null default 'system' check (theme in ('system', 'light', 'dark')),
  timezone          text not null default 'UTC',
  featured_skill_id uuid references public.skills (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- Create a preferences row for every new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Aggregates
-- Daily totals per skill — the heatmap and streaks read this instead of raw sessions.
-- security_invoker makes the view respect the caller's RLS.
-- ---------------------------------------------------------------------------
create view public.daily_skill_totals
with (security_invoker = true)
as
select
  user_id,
  skill_id,
  practiced_on,
  sum(duration_minutes)::integer as total_minutes,
  count(*)::integer              as session_count
from public.sessions
group by user_id, skill_id, practiced_on;

-- Per-skill summary for dashboard cards (hours, session count, last practice)
create view public.skill_stats
with (security_invoker = true)
as
select
  s.id                                          as skill_id,
  s.user_id,
  coalesce(sum(se.duration_minutes), 0)::integer as total_minutes,
  count(se.id)::integer                          as session_count,
  max(se.practiced_on)                           as last_practiced_on
from public.skills s
left join public.sessions se on se.skill_id = s.id
group by s.id, s.user_id;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.skills           enable row level security;
alter table public.sessions         enable row level security;
alter table public.user_preferences enable row level security;

create policy "Users manage their own skills"
  on public.skills for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own sessions"
  on public.sessions for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own preferences"
  on public.user_preferences for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
