-- Admin vidí všechny metody včetně navržených (přes service role / admin client)
-- Přihlášení uživatelé mohou navrhovat nové metody (status = 'navrzena')
create policy "metoda auth insert"
  on public.metoda for insert
  to authenticated
  with check (status = 'navrzena');
