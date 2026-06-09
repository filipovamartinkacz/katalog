import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/prihlaseni')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  if (adminEmails.includes(user.email?.toLowerCase() ?? '')) redirect('/admin')

  const { data: medailonek } = await supabase
    .from('medailonek')
    .select('id, jmeno, prijmeni, is_published')
    .eq('user_id', user.id)
    .maybeSingle()

  const { created, updated } = await searchParams

  if (!medailonek) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Vítej na <span className="font-heading">žena Blažen<span className="text-accent">á</span></span>!</h1>
        <p className="mt-3 text-muted-foreground">
          Ještě nemáš vytvořený profil. Začni tím, že ho teď vytvoříš — zabere to asi 5 minut.
        </p>
        <Link href="/dashboard/medailonek/novy" className={buttonVariants({ size: 'lg' }) + ' mt-8'}>
          Vytvořit profil
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

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
          <Link href="/dashboard/medailonek/upravit" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Upravit profil
          </Link>
        </div>
      </div>

      {updated && (
        <p className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Profil byl úspěšně uložen.
        </p>
      )}

      {!medailonek.is_published && !updated && (
        <p className="mt-4 text-sm text-muted-foreground">
          Tvůj profil je připraven a čeká na schválení administrátorem. Jakmile bude schválený, zobrazí se v katalogu.
        </p>
      )}
    </div>
  )
}
