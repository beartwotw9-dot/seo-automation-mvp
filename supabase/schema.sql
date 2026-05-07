create extension if not exists pgcrypto;

create table if not exists public.serp_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  output_folder text not null default 'default',
  status text not null default 'pending',
  mode text not null default 'mock',
  result_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seo_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  product text,
  scenario text,
  output_folder text not null default 'default',
  status text not null default 'pending',
  mode text not null default 'mock',
  article text,
  article_with_images text,
  quality_notes text,
  improvement_points text,
  revised_article text,
  image_url_25 text,
  image_url_50 text,
  image_url_75 text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.serp_runs enable row level security;
alter table public.seo_runs enable row level security;

create policy "serp_runs_select_own"
on public.serp_runs for select
using (auth.uid() = user_id);

create policy "serp_runs_insert_own"
on public.serp_runs for insert
with check (auth.uid() = user_id);

create policy "serp_runs_update_own"
on public.serp_runs for update
using (auth.uid() = user_id);

create policy "seo_runs_select_own"
on public.seo_runs for select
using (auth.uid() = user_id);

create policy "seo_runs_insert_own"
on public.seo_runs for insert
with check (auth.uid() = user_id);

create policy "seo_runs_update_own"
on public.seo_runs for update
using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists serp_runs_set_updated_at on public.serp_runs;
create trigger serp_runs_set_updated_at
before update on public.serp_runs
for each row execute procedure public.set_updated_at();

drop trigger if exists seo_runs_set_updated_at on public.seo_runs;
create trigger seo_runs_set_updated_at
before update on public.seo_runs
for each row execute procedure public.set_updated_at();
