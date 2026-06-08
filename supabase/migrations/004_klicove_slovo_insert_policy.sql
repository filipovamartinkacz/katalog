-- Přihlášení uživatelé mohou přidávat nová klíčová slova
create policy "klicove_slovo auth insert"
  on public.klicove_slovo for insert
  to authenticated
  with check (true);
