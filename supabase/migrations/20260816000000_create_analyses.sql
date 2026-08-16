create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  hotel_name text not null default '',
  review text not null,
  score int not null check (score between 0 and 100),
  verdict text not null,
  reasons text not null default '',
  model text not null default ''
);

alter table public.analyses enable row level security;

-- 읽기는 공개, 쓰기는 service_role(서버)만
create policy "public read" on public.analyses
  for select to anon using (true);
