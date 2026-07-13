-- ============================================================
-- 020_uklid_debug_funkci.sql
-- Úklid dočasných diagnostických funkcí z migrací 018 a 019 —
-- posloužily k dohledání chyby, která byla nakonec v testovacím
-- skriptu, ne v aplikaci. Politiky z migrace 017 zůstávají
-- (logicky správné a funkční, i když původní příčina byla jinde).
-- ============================================================

drop function if exists public.debug_poptavka_policies();
drop function if exists public.debug_context(uuid);
