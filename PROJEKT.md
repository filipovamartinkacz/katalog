# Katalog — projektová dokumentace

> Pracovní název: Katalog  
> Poslední aktualizace: 2026-05-30

---

## Koncept

Internetová aplikace — katalog podnikatelek (a podnikatelů) ve službách. Primárně ženy nabízející kosmetické služby, terapie, koučink, masáže, provázení v těhotenství a po porodu apod.

**Cíl:** Podpořit malé a začínající podnikatelky v propagaci a vytvořit síť prověřených poskytovatelek služeb.

**Hledající uživatel** najde terapeutku podle kategorií, metod, klíčových slov a lokality.  
**Podnikatelka** získá profil (medailonek) kde prezentuje sebe a své služby.

---

## Role uživatelů

| Role | Popis |
|------|-------|
| **Admin** | Spravuje číselníky (kategorie, metody, cenové hladiny), schvaluje návrhy nových metod, má přehled o všech profilech |
| **Provider** (podnikatelka) | Registruje se, vytváří a spravuje svůj medailonek |
| **Searcher** (hledající) | Prochází a vyhledává v katalogu — bez registrace |

---

## Datový model

### User
- id, email, role (admin / provider / searcher), created_at

### Medailonek (1:1 s User, jen pro roli provider)
- jméno, příjmení, display_name
- bio (dlouhý text)
- IČO (nepovinné)
- kontakt_email (nepovinný, veřejný — může ≠ login email)
- telefon (nepovinný)
- is_published
- created_at
- updated_at ← kdy naposledy cokoliv v profilu změnila (pro interní admin účely, nezobrazuje se veřejně)

### SocialLink (0:N na Medailonek)
- platform (instagram / facebook / linkedin / tiktok / youtube / ...)
- url

### Image (0:N na Medailonek)
- storage_path (cesta k souboru v Supabase Storage)
- alt
- pořadí
- is_primary

### File (0:N na Medailonek)
- název, storage_path
- visibility: soukromý (jen admin) / veřejný (uživatelé)
- Soukromé soubory: transkript rozhovoru, podklad pro článek, doklady pro ověření
- Veřejné soubory: obchodní podmínky, ceník v PDF (pro podnikatelky bez webu)

### MedailonekLocation (0:N na Medailonek)
- město_id → Město → Okres → Kraj
- Žádná lokace = celá ČR / pouze online
- Lokace jsou na úrovni celého medailonku (do budoucna možné přiřadit ke konkrétní službě)

### Service (1:N na Medailonek — min. 1 povinná)
- název, popis
- delivery_form: osobně / online / obojí
- booking_url (nepovinný odkaz na rezervaci)
- price_level_id → PriceLevel

### Kategorie (M:N na Service — min. 1 povinná per Service)
Jedna služba může patřit do více kategorií.  
Příklad: "Těhotenská masáž" → Masáže + Péče o těhotné a po porodu

### Klíčové slovo (M:N na Service)
- Globální tabulka sdílená napříč všemi poskytovateli
- Vznikají AI-asistovaně: podnikatelka vyplní text → systém navrhne klíčová slova → ona vybere/upraví → může přidat vlastní
- Umožní časem zobrazit "47 terapeutek nabízí toto"

### Metoda (M:N na Medailonek — na úrovni profilu, ne služby)
- Metoda může být využívána přes více služeb
- název, popis, má_ochrannou_známku (bool)
- status: aktivní / čeká_na_schválení
- navrhl: user_id (nepovinné — pro nové návrhy od podnikatelek)

---

## Číselníky (spravuje admin)

| Číselník | Příklady hodnot |
|----------|----------------|
| PriceLevel | €, €€, €€€, €€€€ |
| Kategorie | kosmetika, masáže, koučink, péče v těhotenství a po porodu, ... |
| Metoda | PSYCH-K, Kraniosakrální terapie, Access Bars, Mohendžodáro, ... |
| Klíčové slovo | sdílená tabulka, vzniká průběžně |
| Kraj | CZ-PR (Praha), CZ-JM (Jihomoravský), ... |
| Okres | id, kraj_id, název |
| Město | id, okres_id, název, PSČ, lat, lon |

Geografie: pouze ČR. Zadávání přes název města (autocomplete) → okres a kraj se doplní automaticky.

---

## Kardinality

| Vztah | Kardinalita |
|-------|-------------|
| User → Medailonek | 1:1 |
| Medailonek → SocialLink | 0:N |
| Medailonek → Image | 0:N |
| Medailonek → File | 0:N |
| Medailonek → MedailonekLocation | 0:N |
| Medailonek → Metoda | M:N |
| Medailonek → Service | 1:N (min. 1) |
| Service → Kategorie | M:N (min. 1) |
| Service → Klíčové slovo | M:N |
| Service → PriceLevel | N:1 |
| Město → Okres → Kraj | N:1:1 |

---

## Vyhledávání

Uživatel filtruje podle:
- Kategorie
- Metody
- Klíčových slov
- Lokality (kraj / okres / město / okolí v km)

**Výsledek hledání:** primárně medailonek (profil podnikatelky).  
Protože víme která konkrétní služba matchuje, odkaz vede na profil s přeskočením na danou službu.

---

## Monetizace (zatím nerozhodnuto, parkováno)

Zvažované možnosti:
- Měsíční poplatek za přítomnost v katalogu
- Poplatek odpuštěn při splnění podmínek (podcast, článek na blog katalogu)
- Prémiové pozice ve vyhledávání
- Kreditový systém — nákup kreditů pro propagaci akce nebo nákup služby od jiné podnikatelky

---

## Auto-aktualizace profilu (parkováno)

Myšlenka: podnikatelka nemusí ručně aktualizovat medailonek — aplikace si změny stáhne sama.  
Ideálně bez závislosti na existenci vlastního webu (ne všechny podnikatelky web mají).  
RSS je jedna z možností, konkrétní řešení zatím nerozhodnuto.

---

## Tech stack (dohodnuto)

| Vrstva | Technologie | Důvod |
|--------|-------------|-------|
| Frontend + API | Next.js (TypeScript) | Nativní Vercel integrace, SSR pro SEO |
| Databáze | Supabase (PostgreSQL) | Průmyslový standard, snadná migrace, free tier |
| Auth | Supabase Auth | Zabudované, open-source jádro, RLS politiky |
| Soubory | Supabase Storage | Integrace s DB, free tier 1 GB |
| Styling | Tailwind CSS + shadcn/ui | Rychlý vývoj, dobrá AI podpora |
| Hosting | Vercel | Free tier, auto-deploy z GitHubu |

**Klíčový argument pro Supabase:** pod kapotou čistý PostgreSQL.  
Migrace na dedikovaný server (Neon, Railway, vlastní VPS) = změna connection stringu.

---

## MVP scope

Nejmenší smysluplná verze:
- Prohlížitelný katalog s ručně zadanými daty (admin zadává profily)
- Registrace podnikatelky + tvorba medailonku
- Veřejné vyhledávání

Vše ostatní (monetizace, kredity, RSS, audit log, lokace per-služba) je post-MVP.

---

## Vizuální styl

Cílová skupina: ženy. Styl: čistý, ženský. Barevnost: růžovo-červená s teplými zlatými akcenty.

Implementace přes CSS proměnné v `globals.css` — celý brand se vymění změnou jednoho souboru:
- `--color-primary` — hlavní růžovo-červená
- `--color-primary-soft` — světlé růžové pozadí
- `--color-accent` — teplá zlatá
- `--color-bg` — teplá bílá (ne čistě bílá)
- `--font-heading` — elegantní serif (Playfair Display jako výchozí)
- `--font-body` — Inter

Tailwind i shadcn/ui jsou nakonfigurovány aby čerpaly z těchto proměnných.  
Finální brand (barvy, font, logo) zatím neexistuje — paleta je pracovní výchozí bod.

---

## Workflow schvalování profilů

Podnikatelka dokončí medailonek → profil čeká na schválení adminem (`is_published = false`) → admin schválí → profil se zobrazí v katalogu.

---

## Otevřené otázky (do budoucna)

- Finální název aplikace a brand
- Hosting strategie pro velkou návštěvnost
- Bezpečnost při škálování
- RSS / auto-aktualizace bez závislosti na vlastním webu podnikatelky
