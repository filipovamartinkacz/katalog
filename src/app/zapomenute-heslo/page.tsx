'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buttonVariants } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

export default function ZapomenuteHesloPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/zmena-hesla`,
    })

    if (error) {
      setError('Nepodařilo se odeslat e-mail. Zkus to znovu.')
      setLoading(false)
      return
    }

    setDone(true)
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/">
            <Logo className="h-7 w-auto" />
          </Link>
          <h1 className="mt-6 text-xl font-semibold">Zapomenuté heslo</h1>
        </div>

        {done ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className="text-4xl">📬</div>
            <h2 className="mt-4 text-lg font-semibold">Zkontroluj svůj e-mail</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Poslali jsme ti odkaz pro obnovení hesla na <strong>{email}</strong>.
            </p>
            <Link href="/prihlaseni" className={buttonVariants({ variant: 'outline' }) + ' mt-6 w-full'}>
              Zpět na přihlášení
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Tvůj e-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={buttonVariants() + ' mt-1 w-full'}
            >
              {loading ? 'Odesílám…' : 'Odeslat odkaz pro obnovení'}
            </button>
            <Link href="/prihlaseni" className="text-center text-sm text-muted-foreground hover:text-foreground">
              Zpět na přihlášení
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
