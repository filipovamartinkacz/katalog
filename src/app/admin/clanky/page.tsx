import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { buttonVariants } from '@/components/ui/button'
import { Pagination } from '@/app/katalog/pagination'
import { AdminClankyFilters } from './filters'
import { AdminClanekActions } from './admin-actions'

const PAGE_SIZE = 20

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  rozpracovano: { label: 'Rozpracováno', className: 'bg-muted text-muted-foreground' },
  ceka_na_schvaleni: { label: 'Čeká na schválení', className: 'bg-amber-100 text-amber-700' },
  publikovano: { label: 'Publikováno', className: 'bg-green-100 text-green-700' },
  zamitnuto: { label: 'Zamítnuto', className: 'bg-destructive/10 text-destructive' },
}

type Row = {
  id: string
  nadpis: string
  slug: string
  status: string
  view_count: number
  oblibene_count: number
  created_at: string
  medailonek: { jmeno: string; prijmeni: string } | { jmeno: string; prijmeni: string }[] | null
  kategorie: { nazev: string } | { nazev: string }[] | null
}

const SORT_COLUMN: Record<string, { column: 'created_at' | 'view_count' | 'oblibene_count'; ascending: boolean }> = {
  nejnovejsi: { column: 'created_at', ascending: false },
  nejstarsi: { column: 'created_at', ascending: true },
  nejctenejsi: { column: 'view_count', ascending: false },
  'nejmene-ctene': { column: 'view_count', ascending: true },
  nejoblibenejsi: { column: 'oblibene_count', ascending: false },
  'nejmene-oblibene': { column: 'oblibene_count', ascending: true },
}

const TYPY = ['blog', 'podcast', 'video']

type Props = {
  searchParams: Promise<{ status?: string; q?: string; gated?: string; sort?: string; kat?: string; typ?: string; page?: string }>
}

export default async function AdminClankyPage({ searchParams }: Props) {
  const { status, q, gated, sort, kat, typ, page: pageParam } = await searchParams
  const activeStatus = status ?? 'ceka_na_schvaleni'
  const activeQ = q?.trim() ?? ''
  const activeGated = gated === '1'
  const activeSort = sort && SORT_COLUMN[sort] ? sort : 'nejnovejsi'
  const activeTyp = typ && TYPY.includes(typ) ? typ : null
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))

  const admin = createAdminClient()

  const { data: kategorieRaw } = await admin.from('kategorie').select('id, nazev, slug').order('nazev')
  // "Ostatní" vždy poslední
  const kategorie = [...(kategorieRaw ?? [])].sort((a, b) => {
    if (a.nazev === 'Ostatní') return 1
    if (b.nazev === 'Ostatní') return -1
    return 0
  })
  const activeKategorie = kat ? kategorie.find(k => k.slug === kat) : null

  const [cekaCount, publikovanoCount, zamitnutoCount, rozpracovanoCount] = await Promise.all([
    admin.from('clanek').select('id', { count: 'exact', head: true }).eq('status', 'ceka_na_schvaleni'),
    admin.from('clanek').select('id', { count: 'exact', head: true }).eq('status', 'publikovano'),
    admin.from('clanek').select('id', { count: 'exact', head: true }).eq('status', 'zamitnuto'),
    admin.from('clanek').select('id', { count: 'exact', head: true }).eq('status', 'rozpracovano'),
  ])

  const counts: Record<string, number> = {
    ceka_na_schvaleni: cekaCount.count ?? 0,
    publikovano: publikovanoCount.count ?? 0,
    zamitnuto: zamitnutoCount.count ?? 0,
    rozpracovano: rozpracovanoCount.count ?? 0,
  }

  const { column: sortColumn, ascending: sortAscending } = SORT_COLUMN[activeSort]

  let query = admin
    .from('clanek')
    .select('id, nadpis, slug, status, view_count, oblibene_count, created_at, medailonek:medailonek_id ( jmeno, prijmeni ), kategorie:kategorie_id ( nazev )', { count: 'exact' })
    .eq('status', activeStatus)
    .order(sortColumn, { ascending: sortAscending })

  if (activeQ) query = query.ilike('nadpis', `%${activeQ}%`)
  if (activeGated) query = query.eq('je_gated', true)
  if (activeKategorie) query = query.eq('kategorie_id', activeKategorie.id)
  if (activeTyp) query = query.eq('typ', activeTyp)

  const from = (page - 1) * PAGE_SIZE
  const { data: raw, count } = await query.range(from, from + PAGE_SIZE - 1)

  const rows = (raw ?? []) as unknown as Row[]
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const sp: Record<string, string> = { status: activeStatus }
  if (activeQ) sp.q = activeQ
  if (activeGated) sp.gated = '1'
  if (activeSort !== 'nejnovejsi') sp.sort = activeSort
  if (kat) sp.kat = kat
  if (activeTyp) sp.typ = activeTyp

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Blog</h1>
        <Link href="/admin/clanky/novy" className={buttonVariants({ size: 'sm' })}>
          Nový článek
        </Link>
      </div>

      <AdminClankyFilters
        activeStatus={activeStatus}
        activeQ={activeQ}
        activeGated={activeGated}
        activeSort={activeSort}
        activeKat={kat ?? null}
        activeTyp={activeTyp}
        kategorie={kategorie}
        counts={counts}
      />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {activeQ ? 'Žádné články neodpovídají hledání.' : 'V tomto stavu zatím žádné články nejsou.'}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {rows.map(c => (
              <ClanekRow key={c.id} c={c} />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination page={currentPage} totalPages={totalPages} searchParams={sp} basePath="/admin/clanky" />
          )}
        </>
      )}
    </div>
  )
}

function ClanekRow({ c }: { c: Row }) {
  const autorka = Array.isArray(c.medailonek) ? c.medailonek[0] : c.medailonek
  const kategorie = Array.isArray(c.kategorie) ? c.kategorie[0] : c.kategorie
  const status = STATUS_LABEL[c.status] ?? STATUS_LABEL.rozpracovano

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{c.nadpis}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
          {kategorie && (
            <span className="shrink-0 rounded-full bg-primary/8 px-2 py-0.5 text-xs font-medium text-primary">
              {kategorie.nazev}
            </span>
          )}
        </div>
        {autorka && <p className="text-xs text-muted-foreground">{autorka.jmeno} {autorka.prijmeni}</p>}
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(c.created_at).toLocaleDateString('cs-CZ')} · {c.view_count} zobrazení · {c.oblibene_count} v oblíbených
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
        <div className="flex items-center gap-2">
          {c.status === 'publikovano' && (
            <Link href={`/blog/${c.slug}`} className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:border-primary hover:text-primary transition-colors">
              Zobrazit
            </Link>
          )}
          <Link href={`/admin/clanky/${c.id}/upravit`} className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:border-primary hover:text-primary transition-colors">
            Upravit
          </Link>
        </div>
        <AdminClanekActions id={c.id} status={c.status} />
      </div>
    </div>
  )
}
