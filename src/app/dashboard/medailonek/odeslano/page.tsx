import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default async function OdeslanoProfil() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/prihlaseni')

  const { data: medailonek } = await supabase
    .from('medailonek')
    .select('id, jmeno')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!medailonek) redirect('/dashboard/medailonek/novy')

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">

      <div className="text-5xl">🎉</div>

      <h1 className="mt-5 text-2xl font-bold text-foreground">
        Profil byl odeslán ke schválení!
      </h1>
      <p className="mt-3 text-muted-foreground">
        Díky, {medailonek.jmeno}. Tvůj profil teď prochází schválením.
      </p>

      {/* Timeline */}
      <div className="mt-10 flex items-start justify-center gap-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-start">
            <div className="flex flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                i === 0
                  ? 'bg-primary text-primary-foreground'
                  : i === 1
                  ? 'bg-accent/20 text-accent-foreground ring-2 ring-accent/40'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {i === 0 ? '✓' : i + 1}
              </div>
              <p className={`mt-2 max-w-[80px] text-center text-xs leading-tight ${
                i === 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'
              }`}>
                {s}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-2 mt-4 h-px w-12 shrink-0 bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-left">
        <p className="font-semibold text-foreground">Co se stane dál?</p>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-accent">→</span>
            Profil zkontrolujeme obvykle do <strong className="text-foreground">2 pracovních dní</strong>.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-accent">→</span>
            Jakmile bude schválený, <strong className="text-foreground">dostaneš e-mail</strong> na {user.email}.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-accent">→</span>
            Profil se pak automaticky zobrazí v katalogu.
          </li>
        </ul>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link href={`/profil/${medailonek.id}`} className={buttonVariants({ variant: 'outline' })}>
          Náhled profilu
        </Link>
        <Link href="/dashboard" className={buttonVariants()}>
          Přejít na dashboard
        </Link>
      </div>

    </div>
  )
}

const STEPS = ['Profil vytvořen', 'Čeká na schválení', 'Živý v katalogu']
