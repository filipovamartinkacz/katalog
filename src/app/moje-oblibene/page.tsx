import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClanekCard, type ClanekCardData } from '@/app/blog/clanek-card'

export default async function MojeOblibenePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/prihlaseni')

  const { data: raw } = await supabase
    .from('clanek_oblibene')
    .select(`
      created_at,
      clanek:clanek_id (
        id, slug, nadpis, cover_url, typ, published_at,
        kategorie:kategorie_id ( nazev ),
        medailonek:medailonek_id ( jmeno, prijmeni )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const clanky: ClanekCardData[] = (raw ?? []).flatMap(row => {
    const c = Array.isArray(row.clanek) ? row.clanek[0] : row.clanek
    if (!c) return []
    return [{
      ...c,
      kategorie: Array.isArray(c.kategorie) ? c.kategorie[0] : c.kategorie,
      autorka: Array.isArray(c.medailonek) ? c.medailonek[0] : c.medailonek,
    }]
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Moje oblíbené články</h1>

      {!clanky.length ? (
        <p className="mt-6 text-sm text-muted-foreground">Zatím sis neuložila žádný článek.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clanky.map(c => (
            <ClanekCard key={c.id} clanek={c} />
          ))}
        </div>
      )}
    </div>
  )
}
