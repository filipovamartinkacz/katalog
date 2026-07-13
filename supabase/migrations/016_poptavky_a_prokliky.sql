-- ============================================================
-- 016_poptavky_a_prokliky.sql
-- Rychlý kontakt: hlavní rezervační odkaz, poptávky, tracking prokliků
-- ============================================================

-- Hlavní rezervační odkaz expertky
alter table public.medailonek add column if not exists rezervace_url text;

-- ============================================================
-- POPTAVKA — odeslané poptávky z rychlého kontaktního formuláře
-- ============================================================
create table public.poptavka (
  id            uuid primary key default gen_random_uuid(),
  medailonek_id uuid not null references public.medailonek (id) on delete cascade,
  user_id       uuid references auth.users (id) on delete set null,
  jmeno         text not null,
  email         text not null,
  telefon       text,
  zprava        text not null,
  ip            text,
  created_at    timestamptz not null default now()
);

create index on public.poptavka (medailonek_id);
create index on public.poptavka (ip, created_at);

alter table public.poptavka enable row level security;

-- Poptávku smí založit kdokoli (i nepřihlášený) k libovolnému PUBLIKOVANÉMU
-- profilu — není to "owner" akce, je to akce třetí strany směrem k profilu.
-- Přímý EXISTS dotaz místo medailonek_is_published() — SECURITY DEFINER
-- funkce volaná zevnitř cizí RLS politiky se chová nespolehlivě (viz 017).
create policy "poptavka insert"
  on public.poptavka for insert
  with check (
    exists (select 1 from public.medailonek m where m.id = medailonek_id and m.is_published = true)
  );

create policy "poptavka owner read"
  on public.poptavka for select
  using (public.owns_medailonek(medailonek_id));

-- Rate-limit kontrola — anon/authenticated nemají SELECT napříč cizími
-- řádky, proto SECURITY DEFINER (stejný vzor jako owns_medailonek).
create or replace function public.poptavka_rate_limited(p_ip text)
returns boolean language sql security definer as $$
  select coalesce(
    (select count(*) from public.poptavka
      where ip = p_ip and created_at > now() - interval '10 minutes') >= 3,
    false
  );
$$;

grant execute on function public.poptavka_rate_limited(text) to anon, authenticated;

-- ============================================================
-- REZERVACE_PROKLIK — analytika prokliků (hlavní CTA i služby)
-- ============================================================
create table public.rezervace_proklik (
  id            serial primary key,
  medailonek_id uuid not null references public.medailonek (id) on delete cascade,
  service_id    int references public.service (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index on public.rezervace_proklik (medailonek_id);

alter table public.rezervace_proklik enable row level security;

create policy "rezervace_proklik insert"
  on public.rezervace_proklik for insert
  with check (
    exists (select 1 from public.medailonek m where m.id = medailonek_id and m.is_published = true)
    and (
      service_id is null
      or exists (
        select 1 from public.service s
        where s.id = service_id and s.medailonek_id = rezervace_proklik.medailonek_id
      )
    )
  );

create policy "rezervace_proklik owner read"
  on public.rezervace_proklik for select
  using (public.owns_medailonek(medailonek_id));
