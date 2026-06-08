-- ============================================================
-- 001_initial_schema.sql
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- ČÍSELNÍKY
-- ============================================================

create table public.price_level (
  id    serial primary key,
  label text not null unique  -- '€', '€€', '€€€', '€€€€'
);

insert into public.price_level (label) values ('€'), ('€€'), ('€€€'), ('€€€€');

-- ----

create table public.kategorie (
  id         serial primary key,
  nazev      text not null unique,
  slug       text not null unique,
  poradi     int  not null default 0
);

-- ----

create table public.metoda (
  id                  serial primary key,
  nazev               text not null unique,
  popis               text,
  ma_ochrannou_znamku boolean not null default false,
  status              text not null default 'aktivni'
                        check (status in ('aktivni', 'ceka_na_schvaleni')),
  navrhl_user_id      uuid references auth.users (id) on delete set null
);

-- ----

create table public.klicove_slovo (
  id    serial primary key,
  slovo text not null unique
);

-- ============================================================
-- GEOGRAFIE  (prázdné tabulky, data importujeme později)
-- ============================================================

create table public.kraj (
  id   serial primary key,
  kod  text not null unique,  -- např. 'CZ-PR'
  nazev text not null
);

create table public.okres (
  id       serial primary key,
  kraj_id  int  not null references public.kraj (id),
  nazev    text not null
);

create table public.mesto (
  id       serial primary key,
  okres_id int  not null references public.okres (id),
  nazev    text not null,
  psc      text,
  lat      numeric(9, 6),
  lon      numeric(9, 6)
);

create index on public.okres (kraj_id);
create index on public.mesto (okres_id);

-- ============================================================
-- MEDAILONEK
-- ============================================================

create table public.medailonek (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users (id) on delete cascade,
  jmeno           text not null,
  prijmeni        text not null,
  display_name    text,
  bio             text,
  ico             text,
  kontakt_email   text,
  telefon         text,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on public.medailonek (user_id);
create index on public.medailonek (is_published);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger medailonek_updated_at
  before update on public.medailonek
  for each row execute function public.set_updated_at();

-- ----

create table public.social_link (
  id            serial primary key,
  medailonek_id uuid not null references public.medailonek (id) on delete cascade,
  platform      text not null
                  check (platform in ('instagram','facebook','linkedin','tiktok','youtube','web','jine')),
  url           text not null
);

create index on public.social_link (medailonek_id);

-- ----

create table public.image (
  id            serial primary key,
  medailonek_id uuid    not null references public.medailonek (id) on delete cascade,
  storage_path  text    not null,
  alt           text,
  poradi        int     not null default 0,
  is_primary    boolean not null default false
);

create index on public.image (medailonek_id);

-- ----

create table public.file (
  id            serial primary key,
  medailonek_id uuid not null references public.medailonek (id) on delete cascade,
  nazev         text not null,
  storage_path  text not null,
  visibility    text not null default 'private'
                  check (visibility in ('private', 'public'))
);

create index on public.file (medailonek_id);

-- ----

create table public.medailonek_location (
  id            serial primary key,
  medailonek_id uuid not null references public.medailonek (id) on delete cascade,
  mesto_id      int  not null references public.mesto (id)
);

create index on public.medailonek_location (medailonek_id);
create index on public.medailonek_location (mesto_id);

-- ============================================================
-- METODY NA MEDAILONKU  (M:N)
-- ============================================================

create table public.medailonek_metoda (
  medailonek_id uuid not null references public.medailonek (id) on delete cascade,
  metoda_id     int  not null references public.metoda (id) on delete cascade,
  primary key (medailonek_id, metoda_id)
);

-- ============================================================
-- SLUŽBY
-- ============================================================

create table public.service (
  id             serial primary key,
  medailonek_id  uuid not null references public.medailonek (id) on delete cascade,
  nazev          text not null,
  popis          text,
  delivery_form  text not null
                   check (delivery_form in ('osobne', 'online', 'oboji')),
  booking_url    text,
  price_level_id int  references public.price_level (id) on delete set null
);

create index on public.service (medailonek_id);

-- ----

create table public.service_kategorie (
  service_id   int not null references public.service (id) on delete cascade,
  kategorie_id int not null references public.kategorie (id) on delete cascade,
  primary key (service_id, kategorie_id)
);

-- ----

create table public.service_klicove_slovo (
  service_id       int not null references public.service (id) on delete cascade,
  klicove_slovo_id int not null references public.klicove_slovo (id) on delete cascade,
  primary key (service_id, klicove_slovo_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.medailonek          enable row level security;
alter table public.social_link         enable row level security;
alter table public.image               enable row level security;
alter table public.file                enable row level security;
alter table public.medailonek_location enable row level security;
alter table public.medailonek_metoda   enable row level security;
alter table public.service             enable row level security;
alter table public.service_kategorie   enable row level security;
alter table public.service_klicove_slovo enable row level security;

-- Číselníky jsou jen pro čtení všem
alter table public.price_level    enable row level security;
alter table public.kategorie      enable row level security;
alter table public.metoda         enable row level security;
alter table public.klicove_slovo  enable row level security;
alter table public.kraj           enable row level security;
alter table public.okres          enable row level security;
alter table public.mesto          enable row level security;

create policy "price_level public read"    on public.price_level   for select using (true);
create policy "kategorie public read"      on public.kategorie     for select using (true);
create policy "metoda public read"         on public.metoda        for select using (status = 'aktivni');
create policy "klicove_slovo public read"  on public.klicove_slovo for select using (true);
create policy "kraj public read"           on public.kraj          for select using (true);
create policy "okres public read"          on public.okres         for select using (true);
create policy "mesto public read"          on public.mesto         for select using (true);

-- Medailonek: veřejně publikované vidí všichni; vlastní vidí a upravuje vlastník
create policy "medailonek public read"
  on public.medailonek for select
  using (is_published = true);

create policy "medailonek owner read"
  on public.medailonek for select
  using (auth.uid() = user_id);

create policy "medailonek owner insert"
  on public.medailonek for insert
  with check (auth.uid() = user_id);

create policy "medailonek owner update"
  on public.medailonek for update
  using (auth.uid() = user_id);

-- Helper: owns_medailonek(medailonek_id) → true pokud je přihlášený user vlastník
create or replace function public.owns_medailonek(p_medailonek_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.medailonek
    where id = p_medailonek_id and user_id = auth.uid()
  );
$$;

-- Helper: medailonek_is_published(medailonek_id)
create or replace function public.medailonek_is_published(p_medailonek_id uuid)
returns boolean language sql security definer as $$
  select coalesce(
    (select is_published from public.medailonek where id = p_medailonek_id),
    false
  );
$$;

-- SocialLink
create policy "social_link public read"
  on public.social_link for select
  using (public.medailonek_is_published(medailonek_id));

create policy "social_link owner read"
  on public.social_link for select
  using (public.owns_medailonek(medailonek_id));

create policy "social_link owner write"
  on public.social_link for all
  using (public.owns_medailonek(medailonek_id))
  with check (public.owns_medailonek(medailonek_id));

-- Image
create policy "image public read"
  on public.image for select
  using (public.medailonek_is_published(medailonek_id));

create policy "image owner read"
  on public.image for select
  using (public.owns_medailonek(medailonek_id));

create policy "image owner write"
  on public.image for all
  using (public.owns_medailonek(medailonek_id))
  with check (public.owns_medailonek(medailonek_id));

-- File: soukromé jen vlastník, veřejné vidí všichni (jen u publikovaného profilu)
create policy "file public read"
  on public.file for select
  using (visibility = 'public' and public.medailonek_is_published(medailonek_id));

create policy "file owner read"
  on public.file for select
  using (public.owns_medailonek(medailonek_id));

create policy "file owner write"
  on public.file for all
  using (public.owns_medailonek(medailonek_id))
  with check (public.owns_medailonek(medailonek_id));

-- MedailonekLocation
create policy "location public read"
  on public.medailonek_location for select
  using (public.medailonek_is_published(medailonek_id));

create policy "location owner read"
  on public.medailonek_location for select
  using (public.owns_medailonek(medailonek_id));

create policy "location owner write"
  on public.medailonek_location for all
  using (public.owns_medailonek(medailonek_id))
  with check (public.owns_medailonek(medailonek_id));

-- MedailonekMetoda
create policy "medailonek_metoda public read"
  on public.medailonek_metoda for select
  using (public.medailonek_is_published(medailonek_id));

create policy "medailonek_metoda owner read"
  on public.medailonek_metoda for select
  using (public.owns_medailonek(medailonek_id));

create policy "medailonek_metoda owner write"
  on public.medailonek_metoda for all
  using (public.owns_medailonek(medailonek_id))
  with check (public.owns_medailonek(medailonek_id));

-- Service
create policy "service public read"
  on public.service for select
  using (public.medailonek_is_published(medailonek_id));

create policy "service owner read"
  on public.service for select
  using (public.owns_medailonek(medailonek_id));

create policy "service owner write"
  on public.service for all
  using (public.owns_medailonek(medailonek_id))
  with check (public.owns_medailonek(medailonek_id));

-- ServiceKategorie (přes service)
create policy "service_kategorie public read"
  on public.service_kategorie for select
  using (
    exists (
      select 1 from public.service s
      where s.id = service_id
        and public.medailonek_is_published(s.medailonek_id)
    )
  );

create policy "service_kategorie owner write"
  on public.service_kategorie for all
  using (
    exists (
      select 1 from public.service s
      where s.id = service_id
        and public.owns_medailonek(s.medailonek_id)
    )
  )
  with check (
    exists (
      select 1 from public.service s
      where s.id = service_id
        and public.owns_medailonek(s.medailonek_id)
    )
  );

-- ServiceKlicoveSlovo (přes service)
create policy "service_klicove_slovo public read"
  on public.service_klicove_slovo for select
  using (
    exists (
      select 1 from public.service s
      where s.id = service_id
        and public.medailonek_is_published(s.medailonek_id)
    )
  );

create policy "service_klicove_slovo owner write"
  on public.service_klicove_slovo for all
  using (
    exists (
      select 1 from public.service s
      where s.id = service_id
        and public.owns_medailonek(s.medailonek_id)
    )
  )
  with check (
    exists (
      select 1 from public.service s
      where s.id = service_id
        and public.owns_medailonek(s.medailonek_id)
    )
  );
