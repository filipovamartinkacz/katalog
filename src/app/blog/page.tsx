import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BlogFilters } from './filters'
import { Pagination } from '@/app/katalog/pagination'
import { ClanekCard, type ClanekCardData } from './clanek-card'

const PAGE_SIZE = 12

type Props = {
  searchParams: Promise<{ kat?: string; page?: string }>
}

export default async function BlogPage({ searchParams }: Props) {
  const { kat, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))

  const supabase = await createClient()
  const { data: kategorieRaw } = await supabase.from('kategorie').select('id, nazev, slug').order('nazev')
  // "Ostatní" vždy poslední
  const kategorie = [...(kategorieRaw ?? [])].sort((a, b) => {
    if (a.nazev === 'Ostatní') return 1
    if (b.nazev === 'Ostatní') return -1
    return 0
  })
  const activeKategorie = kat ? kategorie.find(k => k.slug === kat) : null

  let query = supabase
    .from('clanek')
    .select(
      'id, slug, nadpis, cover_url, typ, published_at, kategorie:kategorie_id ( nazev ), medailonek:medailonek_id ( jmeno, prijmeni )',
      { count: 'exact' }
    )
    .eq('status', 'publikovano')
    .order('published_at', { ascending: false })

  if (activeKategorie) query = query.eq('kategorie_id', activeKategorie.id)

  const from = (page - 1) * PAGE_SIZE
  const { data: raw, count } = await query.range(from, from + PAGE_SIZE - 1)

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const clanky: ClanekCardData[] = (raw ?? []).map(c => ({
    ...c,
    kategorie: Array.isArray(c.kategorie) ? c.kategorie[0] : c.kategorie,
    autorka: Array.isArray(c.medailonek) ? c.medailonek[0] : c.medailonek,
  }))

  const sp: Record<string, string> = {}
  if (kat) sp.kat = kat

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Blog</h1>
        <p className="mt-2 text-muted-foreground">Články, rozhovory a inspirace od našich expertek</p>
      </div>

      <div className="mb-8">
        <BlogFilters kategorie={kategorie} activeKat={kat ?? null} />
      </div>

      {!clanky.length ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg">Zatím tu nejsou žádné články.</p>
          {kat && (
            <Link href="/blog" className="mt-4 inline-block text-primary hover:underline">
              Zobrazit vše
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {clanky.map(c => (
              <ClanekCard key={c.id} clanek={c} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-12">
              <Pagination page={currentPage} totalPages={totalPages} searchParams={sp} basePath="/blog" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
