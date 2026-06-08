-- ============================================================
-- 002_seed_ciselniky.sql
-- ============================================================

-- KATEGORIE
insert into public.kategorie (nazev, slug, poradi) values
  ('Kosmetika a péče o pleť',        'kosmetika',             1),
  ('Masáže',                          'masaze',                2),
  ('Terapie a psychologie',           'terapie',               3),
  ('Koučink a osobní rozvoj',         'koucink',               4),
  ('Péče v těhotenství a po porodu',  'tehotenstvi-poporod',   5),
  ('Výživa a zdravý životní styl',    'vyziva',                6),
  ('Pohyb a fyzioterapie',            'pohyb-fyzioterapie',    7),
  ('Energie a spiritualita',          'energie-spiritualita',  8),
  ('Poradenství a mentoring',         'poradenstvi',           9),
  ('Vzdělávání a kurzy',              'vzdelavani',           10);

-- METODY
insert into public.metoda (nazev, popis, ma_ochrannou_znamku, status) values
  ('PSYCH-K',                    'Metoda pro přeprogramování limitujících přesvědčení na úrovni mozkových vln.',                           true,  'aktivni'),
  ('Access Bars',                'Jemné dotyky na 32 bodech hlavy uvolňující nahromaděné energetické bloky.',                              true,  'aktivni'),
  ('Kraniosakrální terapie',     'Jemná manuální terapie pracující s rytmem mozkomíšního moku.',                                           false, 'aktivni'),
  ('EFT — tapping',              'Emoční svobodná technika: poklepávání na akupresurní body při opakování afirmací.',                      false, 'aktivni'),
  ('Reiki',                      'Japonská energetická metoda přenosu životní energie prostřednictvím dlaní.',                             false, 'aktivni'),
  ('Hypnoterapie',               'Terapeutická práce v tranzu zaměřená na podvědomé vzorce.',                                              false, 'aktivni'),
  ('Systemické konstelace',      'Metoda odkrývající skryté dynamiky v rodinném nebo firemním systému.',                                   false, 'aktivni'),
  ('Lymfatická masáž',           'Manuální technika stimulující odvod lymfy a posilující imunitní systém.',                                false, 'aktivni'),
  ('Reflexní terapie',           'Masáž reflexních zón na chodidlech, dlaních nebo uších ovlivňující celý organismus.',                   false, 'aktivni'),
  ('Ayurvedská masáž',           'Tradiční indicka masáž pracující s energetickými kanály a dosha typy.',                                  false, 'aktivni'),
  ('Koučink dle ICF',            'Koučování podle standardů International Coach Federation.',                                              false, 'aktivni'),
  ('NLP',                        'Neurolingvistické programování — techniky pro změnu myšlenkových a behaviorálních vzorců.',              false, 'aktivni'),
  ('Aromaterapie',               'Terapeutické využití éterických olejů pro fyzickou a psychickou pohodu.',                                false, 'aktivni'),
  ('Bach. květové esence',       'Terapie přírodními esencemi Dr. Edwarda Bacha pracující s emočními stavy.',                              false, 'aktivni'),
  ('Tantrická masáž',            'Holistická tělesná práce integrující ženskou energii a uvědomění.',                                      false, 'aktivni'),
  ('Prenatální jóga',            'Jóga přizpůsobená pro těhotné — posiluje, uvolňuje a připravuje na porod.',                             false, 'aktivni'),
  ('Porodní asistence',          'Doprovázení ženy v těhotenství, při porodu a v šestinedělí.',                                            false, 'aktivni'),
  ('Laktační poradenství',       'Odborná podpora kojení a péče o novorozence.',                                                           false, 'aktivni'),
  ('Výživové poradenství',       'Individuální doporučení jídelníčku na základě zdravotního stavu a cílů.',                                false, 'aktivni'),
  ('Mohendžodáro',               'Terapeutická masážní technika pracující s hlubokými vrstvami fascií a energetickým tělem.',              false, 'aktivni');
