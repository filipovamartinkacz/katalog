import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/prihlaseni')

  const { data: medailonek } = await supabase
    .from('medailonek')
    .select('id, jmeno, prijmeni, is_published')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!medailonek) redirect('/dashboard/medailonek/novy')

  const { updated } = await searchParams

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {updated && (
        <p className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Profil byl úspěšně uložen.
        </p>
      )}

      {/* Profil card */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">{medailonek.jmeno} {medailonek.prijmeni}</p>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              medailonek.is_published
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {medailonek.is_published ? 'Zveřejněný' : 'Čeká na schválení'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/profil/${medailonek.id}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Náhled
            </Link>
            <Link href="/dashboard/medailonek/upravit" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Upravit
            </Link>
          </div>
        </div>

        {/* Timeline — pouze pro neschválené */}
        {!medailonek.is_published && (
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-sm font-medium text-foreground">Kde je tvůj profil?</p>

            <div className="mt-4 flex items-start gap-0">
              {TIMELINE.map((step, i) => (
                <div key={i} className="flex items-start">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      i === 0
                        ? 'bg-primary text-primary-foreground'
                        : i === 1
                        ? 'bg-accent/20 text-accent-foreground ring-2 ring-accent/30'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {i === 0 ? '✓' : i + 1}
                    </div>
                    <p className={`mt-1.5 max-w-[72px] text-center text-[11px] leading-tight ${
                      i === 1 ? 'font-medium text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step}
                    </p>
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className="mx-2 mt-3 h-px w-10 shrink-0 bg-border" />
                  )}
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Obvykle schvalujeme do 2 pracovních dní. Jakmile bude profil schválený, dostaneš e-mail.
            </p>
          </div>
        )}

        {/* Profil je live */}
        {medailonek.is_published && (
          <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
            Tvůj profil je živý v katalogu.{' '}
            <Link href={`/profil/${medailonek.id}`} className="font-medium underline hover:no-underline">
              Zobrazit profil →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

const TIMELINE = ['Profil vytvořen', 'Čeká na schválení', 'Živý v katalogu']
