import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Filters } from './filters'
import { Pagination } from './pagination'
import { getMedailonekNazev } from '@/lib/medailonek-nazev'

const PAGE_SIZE = 12

type Props = {
  searchParams: Promise<{ kat?: string; met?: string; forma?: string; q?: string; lok?: string; page?: string }>
}

export default async function KatalogPage({ searchParams }: Props) {
  const { kat, met, forma, q, lok, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const activeKats = kat ? kat.split(',').map(s => s.trim()).filter(Boolean) : []
  const activeMet = met ? parseInt(met, 10) : null
  const activeForma = forma ?? null
  const activeQ = q?.trim() ?? ''
  const activeLok = lok?.trim() ?? ''

  const supabase = await createClient()

  const [{ data: raw }, { data: katRaw }, { data: metody }] = await Promise.all([
    supabase
      .from('medailonek')
      .select(`
        id, slug, jmeno, prijmeni, display_name, bio, foto_url,
        medailonek_location ( mesto ( nazev, okres ( nazev, kraj ( nazev ) ) ) ),
        medailonek_metoda ( metoda ( id, nazev, ma_ochrannou_znamku ) ),
        service ( nazev, popis, delivery_form, service_kategorie ( kategorie ( id, nazev, slug ) ), service_klicove_slovo ( klicove_slovo ( slovo ) ) )
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    supabase.from('kategorie').select('id, nazev, slug').order('nazev'),
    supabase.from('metoda').select('id, nazev, ma_ochrannou_znamku').order('nazev'),
  ])

  // "Ostatní" vždy poslední
  const kategorie = [...(katRaw ?? [])].sort((a, b) => {
    if (a.nazev === 'Ostatní') return 1
    if (b.nazev === 'Ostatní') return -1
    return 0
  })

  let results = raw ?? []

  // Filtr — kategorie (multi-slug, OR logika)
  if (activeKats.length > 0) {
    results = results.filter(m =>
      (m.service as any[]).some(s =>
        (s.service_kategorie as any[]).some(sk => {
          const k = Array.isArray(sk.kategorie) ? sk.kategorie[0] : sk.kategorie
          return k?.slug && activeKats.includes(k.slug)
        })
      )
    )
  }

  // Filtr — metoda
  if (activeMet) {
    results = results.filter(m =>
      (m.medailonek_metoda as any[]).some(mm => {
        const met = Array.isArray(mm.metoda) ? mm.metoda[0] : mm.metoda
        return met?.id === activeMet
      })
    )
  }

  // Filtr — forma + lokalita (kombinovaná logika)
  // Online služby nejsou vázané na lokalitu, proto se filtrují společně.
  if (activeForma || activeLok) {
    const llok = activeLok.toLowerCase()

    results = results.filter(m => {
      const services = m.service as any[]
      const locs = m.medailonek_location as any[]

      const hasOnline = services.some(s => s.delivery_form === 'online' || s.delivery_form === 'oboji')
      const hasPersonal = services.some(s => s.delivery_form === 'osobne' || s.delivery_form === 'oboji')

      // Forma check — nezávislá na lokalitě
      if (activeForma === 'online' && !hasOnline) return false
      if (activeForma === 'osobne' && !hasPersonal) return false

      // Lokalita check — relevantní jen pro osobní služby
      if (activeLok) {
        // Online forma: lokalita se ignoruje (online = dostupná odkudkoli)
        if (activeForma === 'online') return true

        // Jen online expertky (žádná osobní): zobrazí se vždy (bez vazby na lokalitu)
        if (!hasPersonal) return true

        // Profily bez lokace (celá ČR): zobrazí se vždy
        if (locs.length === 0) return true

        const matchesLok = locs.some(l => {
          const mesto = Array.isArray(l.mesto) ? l.mesto[0] : l.mesto
          if (!mesto) return false
          const okres = Array.isArray(mesto.okres) ? mesto.okres[0] : mesto.okres
          const kraj = Array.isArray(okres?.kraj) ? okres?.kraj[0] : okres?.kraj
          return (
            mesto.nazev?.toLowerCase().includes(llok) ||
            okres?.nazev?.toLowerCase().includes(llok) ||
            kraj?.nazev?.toLowerCase().includes(llok)
          )
        })

        // Forma "vše": zobraz pokud se shoduje lokalita NEBO má online služby
        if (!activeForma) return matchesLok || hasOnline

        return matchesLok
      }

      return true
    })
  }

  // Filtr — textové vyhledávání
  if (activeQ) {
    const lq = activeQ.toLowerCase()
    results = results.filter(m => {
      if (m.jmeno?.toLowerCase().includes(lq)) return true
      if (m.prijmeni?.toLowerCase().includes(lq)) return true
      if (m.display_name?.toLowerCase().includes(lq)) return true
      if (m.bio?.toLowerCase().includes(lq)) return true
      if ((m.service as any[]).some(s =>
        s.nazev?.toLowerCase().includes(lq) || s.popis?.toLowerCase().includes(lq)
      )) return true
      if ((m.medailonek_metoda as any[]).some(mm => {
        const met = Array.isArray(mm.metoda) ? mm.metoda[0] : mm.metoda
        return met?.nazev?.toLowerCase().includes(lq)
      })) return true
      if ((m.service as any[]).some(s =>
        (s.service_klicove_slovo as any[]).some((sk: any) => {
          const kw = Array.isArray(sk.klicove_slovo) ? sk.klicove_slovo[0] : sk.klicove_slovo
          return kw?.slovo?.toLowerCase().includes(lq)
        })
      )) return true
      return false
    })
  }

  const totalCount = results.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageResults = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const sp: Record<string, string> = {}
  if (kat) sp.kat = kat
  if (met) sp.met = met
  if (forma) sp.forma = forma
  if (q) sp.q = q
  if (lok) sp.lok = lok

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Odbornice pro tebe</h1>
        <p className="mt-2 text-lg font-medium text-foreground">Najdi odbornici přesně pro tebe</p>
      </div>

      <div className="mb-8">
        <Filters
          kategorie={kategorie}
          metody={metody ?? []}
          activeKats={activeKats}
          activeMet={activeMet}
          activeForma={activeForma}
          activeQ={activeQ}
          activeLok={activeLok}
          total={totalCount}
        />
      </div>

      <div>
        {totalCount === 0 ? (
          <div className="py-20 text-center text-foreground">
            <p className="text-lg">Žádné profily neodpovídají zvoleným filtrům.</p>
            <Link href="/katalog" className="mt-4 inline-block text-primary hover:underline">
              Zobrazit vše
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pageResults.map(m => (
                <MedailonekCard key={m.id} m={m} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination page={currentPage} totalPages={totalPages} searchParams={sp} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function MedailonekCard({ m }: { m: any }) {
  const name = getMedailonekNazev(m.jmeno, m.prijmeni, m.display_name)
  const initials = `${m.jmeno[0] ?? ''}${m.prijmeni[0] ?? ''}`.toUpperCase()

  const kategorie: string[] = []
  const seen = new Set<number>()
  for (const s of m.service as any[]) {
    for (const sk of s.service_kategorie as any[]) {
      const k = Array.isArray(sk.kategorie) ? sk.kategorie[0] : sk.kategorie
      if (k && !seen.has(k.id)) { seen.add(k.id); kategorie.push(k.nazev) }
    }
  }

  const mesta = (m.medailonek_location as any[]).flatMap((l: any) => {
    const mesto = Array.isArray(l.mesto) ? l.mesto[0] : l.mesto
    return mesto ? [mesto.nazev as string] : []
  }).slice(0, 3)

  return (
    <Link
      href={`/profil/${m.slug ?? m.id}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary/10">
          {m.foto_url ? (
            <Image src={m.foto_url} alt={name} fill className="object-cover" sizes="48px" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary">
              {initials}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold leading-tight">{name}</p>
          {mesta.length > 0 ? (
            <p className="mt-0.5 text-xs text-foreground">
              {mesta.join(' · ')}{m.medailonek_location.length > 3 ? ' · …' : ''}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-foreground">Celá ČR / online</p>
          )}
        </div>
      </div>

      <p className="mt-3 line-clamp-3 text-sm text-foreground">{m.bio}</p>

      {kategorie.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {kategorie.slice(0, 3).map(k => (
            <span key={k} className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary">
              {k}
            </span>
          ))}
          {kategorie.length > 3 && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              +{kategorie.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 text-xs font-medium text-primary group-hover:underline">
        Zobrazit profil →
      </div>
    </Link>
  )
}
