-- ============================================================
-- 010_clanky.sql
-- Blog: jádro schématu (clanek, clanek_metoda, clanek_klicove_slovo)
-- ============================================================

create table public.clanek (
  id              uuid primary key default gen_random_uuid(),
  medailonek_id   uuid not null references public.medailonek (id) on delete cascade,
  typ             text not null default 'blog'
                    check (typ in ('blog', 'podcast', 'video')),
  kategorie_id    int  not null references public.kategorie (id),
  nadpis          text not null,
  slug            text not null unique,
  obsah           jsonb not null default '{}'::jsonb,
  cover_url       text not null,
  cover_alt       text not null,
  zdroj_url       text,
  je_gated        boolean not null default false,
  seo_title       text,
  seo_description text,
  status          text not null default 'rozpracovano'
                    check (status in ('rozpracovano', 'ceka_na_schvaleni', 'publikovano', 'zamitnuto')),
  zamitnuti_duvod text,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint clanek_zamitnuti_duvod_required
    check (status <> 'zamitnuto' or zamitnuti_duvod is not null)
);

create index on public.clanek (medailonek_id);
create index on public.clanek (status);
create index on public.clanek (kategorie_id);
create index on public.clanek (published_at desc);

create trigger clanek_updated_at
  before update on public.clanek
  for each row execute function public.set_updated_at();

-- ----

create table public.clanek_metoda (
  clanek_id uuid not null references public.clanek (id) on delete cascade,
  metoda_id int  not null references public.metoda (id) on delete cascade,
  primary key (clanek_id, metoda_id)
);

-- ----

create table public.clanek_klicove_slovo (
  clanek_id        uuid not null references public.clanek (id) on delete cascade,
  klicove_slovo_id int  not null references public.klicove_slovo (id) on delete cascade,
  primary key (clanek_id, klicove_slovo_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.clanek               enable row level security;
alter table public.clanek_metoda        enable row level security;
alter table public.clanek_klicove_slovo enable row level security;

-- Clanek: veřejně jen publikované; vlastnice vidí vše svoje
create policy "clanek public read"
  on public.clanek for select
  using (status = 'publikovano');

create policy "clanek owner read"
  on public.clanek for select
  using (public.owns_medailonek(medailonek_id));

-- Vytvořit smí jen vlastnice PUBLIKOVANÉHO medailonku, a jen jako rozpracovaný koncept
create policy "clanek owner insert"
  on public.clanek for insert
  with check (
    public.owns_medailonek(medailonek_id)
    and public.medailonek_is_published(medailonek_id)
    and status = 'rozpracovano'
  );

-- Zamčeno v "ceka_na_schvaleni"; nikdy self-publish (publikovano není v WITH CHECK)
create policy "clanek owner update"
  on public.clanek for update
  using (public.owns_medailonek(medailonek_id) and status <> 'ceka_na_schvaleni')
  with check (public.owns_medailonek(medailonek_id) and status in ('rozpracovano', 'ceka_na_schvaleni'));

create policy "clanek owner delete"
  on public.clanek for delete
  using (public.owns_medailonek(medailonek_id) and status in ('rozpracovano', 'zamitnuto'));

-- clanek_metoda
create policy "clanek_metoda public read"
  on public.clanek_metoda for select
  using (exists (
    select 1 from public.clanek c where c.id = clanek_id and c.status = 'publikovano'
  ));

create policy "clanek_metoda owner read"
  on public.clanek_metoda for select
  using (exists (
    select 1 from public.clanek c where c.id = clanek_id and public.owns_medailonek(c.medailonek_id)
  ));

create policy "clanek_metoda owner write"
  on public.clanek_metoda for all
  using (exists (
    select 1 from public.clanek c
    where c.id = clanek_id and public.owns_medailonek(c.medailonek_id) and c.status <> 'ceka_na_schvaleni'
  ))
  with check (exists (
    select 1 from public.clanek c
    where c.id = clanek_id and public.owns_medailonek(c.medailonek_id) and c.status in ('rozpracovano', 'ceka_na_schvaleni')
  ));

-- clanek_klicove_slovo (stejný tvar jako clanek_metoda)
create policy "clanek_klicove_slovo public read"
  on public.clanek_klicove_slovo for select
  using (exists (
    select 1 from public.clanek c where c.id = clanek_id and c.status = 'publikovano'
  ));

create policy "clanek_klicove_slovo owner read"
  on public.clanek_klicove_slovo for select
  using (exists (
    select 1 from public.clanek c where c.id = clanek_id and public.owns_medailonek(c.medailonek_id)
  ));

create policy "clanek_klicove_slovo owner write"
  on public.clanek_klicove_slovo for all
  using (exists (
    select 1 from public.clanek c
    where c.id = clanek_id and public.owns_medailonek(c.medailonek_id) and c.status <> 'ceka_na_schvaleni'
  ))
  with check (exists (
    select 1 from public.clanek c
    where c.id = clanek_id and public.owns_medailonek(c.medailonek_id) and c.status in ('rozpracovano', 'ceka_na_schvaleni')
  ));
