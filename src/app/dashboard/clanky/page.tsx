import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  rozpracovano: { label: 'Rozpracováno', className: 'bg-muted text-muted-foreground' },
  ceka_na_schvaleni: { label: 'Čeká na schválení', className: 'bg-amber-100 text-amber-700' },
  publikovano: { label: 'Publikováno', className: 'bg-green-100 text-green-700' },
  zamitnuto: { label: 'Zamítnuto', className: 'bg-destructive/10 text-destructive' },
}

export default async function DashboardClankyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/prihlaseni')

  const { data: medailonek } = await supabase
    .from('medailonek')
    .select('id, is_published')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: clanky } = medailonek
    ? await supabase
        .from('clanek')
        .select('id, nadpis, slug, status, created_at')
        .eq('medailonek_id', medailonek.id)
        .order('created_at', { ascending: false })
    : { data: null }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Moje články</h1>
        {medailonek?.is_published && (
          <Link href="/dashboard/clanky/novy" className={buttonVariants({ size: 'sm' })}>
            Nový článek
          </Link>
        )}
      </div>

      {!medailonek && (
        <p className="mt-6 text-sm text-muted-foreground">Nejdřív si vytvoř medailonek.</p>
      )}

      {medailonek && !medailonek.is_published && (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Články může psát jen podnikatelka se schváleným medailonkem. Až bude tvůj profil
          zveřejněný, budeš si tu moct založit první článek.
        </p>
      )}

      {medailonek?.is_published && (
        <div className="mt-6 flex flex-col gap-3">
          {clanky?.map(c => {
            const status = STATUS_LABEL[c.status] ?? STATUS_LABEL.rozpracovano
            return (
              <Link
                key={c.id}
                href={`/dashboard/clanky/${c.id}/upravit`}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.nadpis}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString('cs-CZ')}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                  {status.label}
                </span>
              </Link>
            )
          })}
          {!clanky?.length && (
            <p className="text-sm text-muted-foreground">Zatím žádné články.</p>
          )}
        </div>
      )}
    </div>
  )
}
