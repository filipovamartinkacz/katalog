-- Singleton tabulka pro konfiguraci průvodkyně Blaženy
-- Obsahuje mapování pocitů a oblastí na kategorie (edituje admin v UI)

create table public.blazena_config (
  id        integer primary key default 1,
  config    jsonb   not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint blazena_config_singleton check (id = 1)
);

alter table public.blazena_config enable row level security;

-- Veřejné čtení (wizard na frontendu to potřebuje)
create policy "blazena_config public read"
  on public.blazena_config for select using (true);

-- Seed — výchozí konfigurace
insert into public.blazena_config (id, config) values (1, '{
  "pocity": [
    {"id": "vycerpana",    "label": "Jsem vyčerpaná",                          "emoji": "🌿", "katSlugy": ["masaze", "terapie", "koucink", "energie-spiritualita"]},
    {"id": "stres",        "label": "Mám stres a napětí",                       "emoji": "💨", "katSlugy": ["masaze", "terapie", "koucink"]},
    {"id": "bolesti",      "label": "Bolí mě tělo nebo mám ztuhlé svaly",       "emoji": "🤲", "katSlugy": ["masaze", "pohyb-fyzioterapie"]},
    {"id": "vzhled",       "label": "Chci pečovat o svůj vzhled a pleť",        "emoji": "✨", "katSlugy": ["kosmetika"]},
    {"id": "tehotenstvi",  "label": "Jsem těhotná nebo čerstvá maminka",        "emoji": "🌸", "katSlugy": ["tehotenstvi-poporod"]},
    {"id": "jidlo",        "label": "Chci se zdravěji stravovat",               "emoji": "🥗", "katSlugy": ["vyziva"]},
    {"id": "pohyb",        "label": "Chci se více hýbat nebo mám rehabilitaci", "emoji": "🧘", "katSlugy": ["pohyb-fyzioterapie"]},
    {"id": "poslani",      "label": "Hledám své poslání nebo životní směr",     "emoji": "🎯", "katSlugy": ["koucink", "poradenstvi", "energie-spiritualita"]},
    {"id": "vztahy",       "label": "Řeším vztahové nebo rodinné téma",         "emoji": "💬", "katSlugy": ["terapie", "koucink"]},
    {"id": "spiritualita", "label": "Zajímá mě spiritualita nebo práce s energií", "emoji": "🔮", "katSlugy": ["energie-spiritualita"]},
    {"id": "vzdelavani",   "label": "Chci se vzdělávat nebo rozvíjet dovednosti", "emoji": "📚", "katSlugy": ["vzdelavani", "poradenstvi"]}
  ],
  "oblasti": [
    {"id": "telo",         "label": "Tělo",                  "emoji": "🌿", "katSlugy": ["masaze", "pohyb-fyzioterapie", "vyziva", "kosmetika"]},
    {"id": "psychika",     "label": "Psychika a emoce",      "emoji": "💛", "katSlugy": ["terapie", "koucink"]},
    {"id": "materstvi",    "label": "Mateřství",             "emoji": "🌸", "katSlugy": ["tehotenstvi-poporod"]},
    {"id": "spiritualita", "label": "Spiritualita a energie","emoji": "🔮", "katSlugy": ["energie-spiritualita"]},
    {"id": "krasa",        "label": "Krása a péče o pleť",   "emoji": "✨", "katSlugy": ["kosmetika"]},
    {"id": "rozvoj",       "label": "Rozvoj a kariéra",      "emoji": "🎯", "katSlugy": ["koucink", "poradenstvi", "vzdelavani"]}
  ]
}'::jsonb);
