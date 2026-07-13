import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { ApproveButton } from './approve-button'

export default async function AdminMedailonkyPage() {
  const admin = createAdminClient()

  const [{ data: medailonky }, { data: usersData }] = await Promise.all([
    admin
      .from('medailonek')
      .select('id, slug, jmeno, prijmeni, bio, kontakt_email, is_published, user_confirmed, user_id, created_at')
      .order('created_at', { ascending: false }),
    admin.auth.admin.listUsers(),
  ])

  const emailByUserId = new Map(usersData?.users.map(u => [u.id, u.email ?? null]) ?? [])
  const rows: Row[] = (medailonky ?? []).map(m => ({ ...m, ucet_email: emailByUserId.get(m.user_id) ?? null }))

  const pending = rows.filter(m => !m.is_published)
  const cekaNaUcet = rows.filter(m => m.is_published && !m.user_confirmed)
  const published = rows.filter(m => m.is_published && m.user_confirmed)

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Profily</h1>

      {pending.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-amber-700">
            Čekají na schválení ({pending.length})
          </h2>
          <div className="flex flex-col gap-3">
            {pending.map(m => (
              <MedailonekRow key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      {cekaNaUcet.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-amber-700">
            Schváleno, čeká na potvrzení účtu ({cekaNaUcet.length})
          </h2>
          <div className="flex flex-col gap-3">
            {cekaNaUcet.map(m => (
              <MedailonekRow key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      {published.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-green-700">
            Zveřejněné ({published.length})
          </h2>
          <div className="flex flex-col gap-3">
            {published.map(m => (
              <MedailonekRow key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      {!rows.length && (
        <p className="text-muted-foreground text-sm">Zatím žádné profily.</p>
      )}
    </div>
  )
}

type Row = {
  id: string
  slug: string | null
  jmeno: string
  prijmeni: string
  bio: string
  kontakt_email: string | null
  is_published: boolean
  user_confirmed: boolean
  user_id: string
  created_at: string
  ucet_email?: string | null
}

function MedailonekRow({ m }: { m: Row }) {
  const stavLabel = !m.is_published ? 'Čeká' : !m.user_confirmed ? 'Čeká na účet' : 'Zveřejněný'
  const stavClass = !m.is_published
    ? 'bg-amber-100 text-amber-700'
    : !m.user_confirmed
    ? 'bg-amber-100 text-amber-700'
    : 'bg-green-100 text-green-700'

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{m.jmeno} {m.prijmeni}</p>
        <p className="text-xs text-muted-foreground">
          Účet: {m.ucet_email ?? '—'} {!m.user_confirmed && <span className="text-amber-700">(nepotvrzený)</span>}
        </p>
        {m.kontakt_email && m.kontakt_email !== m.ucet_email && (
          <p className="text-xs text-muted-foreground">Kontakt: {m.kontakt_email}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{m.bio}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(m.created_at).toLocaleDateString('cs-CZ')}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stavClass}`}>
          {stavLabel}
        </span>
        <Link
          href={`/profil/${m.slug ?? m.id}`}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:border-primary hover:text-primary transition-colors"
        >
          Náhled
        </Link>
        <ApproveButton id={m.id} isPublished={m.is_published} />
      </div>
    </div>
  )
}
