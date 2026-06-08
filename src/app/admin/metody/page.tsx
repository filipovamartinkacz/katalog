import { createAdminClient } from '@/lib/supabase/admin'
import { MetodaRow } from './metoda-row'

export default async function AdminMetodyPage() {
  const admin = createAdminClient()

  // Načteme všechny metody (admin client obchází RLS status = 'aktivni')
  const { data: metody } = await admin
    .from('metoda')
    .select('id, nazev, popis, status, medailonek_metoda(count)')
    .order('status', { ascending: false }) // 'navrzena' před 'aktivni'
    .order('nazev')

  const navrzene = metody?.filter(m => m.status === 'navrzena') ?? []
  const aktivni = metody?.filter(m => m.status === 'aktivni') ?? []

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Metody</h1>

      {navrzene.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-amber-700">
            Čekají na schválení ({navrzene.length})
          </h2>
          <p className="text-sm text-muted-foreground -mt-2">
            Tyto metody byly navrženy při importu. Schválením se zpřístupní ve veřejném katalogu
            a zobrazí v medailoncích, kde byly použity.
          </p>
          <div className="flex flex-col gap-3">
            {navrzene.map(m => (
              <MetodaRow
                key={m.id}
                id={m.id}
                nazev={m.nazev}
                popis={m.popis}
                status={m.status}
                pouzitaV={(m.medailonek_metoda as any)?.[0]?.count ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-green-700">
          Aktivní metody ({aktivni.length})
        </h2>
        <div className="flex flex-col gap-3">
          {aktivni.map(m => (
            <MetodaRow
              key={m.id}
              id={m.id}
              nazev={m.nazev}
              popis={m.popis}
              status={m.status}
              pouzitaV={(m.medailonek_metoda as any)?.[0]?.count ?? 0}
            />
          ))}
        </div>
      </section>

      {!metody?.length && (
        <p className="text-muted-foreground text-sm">Zatím žádné metody.</p>
      )}
    </div>
  )
}
