'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buttonVariants } from '@/components/ui/button'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { Suspense } from 'react'
import { Logo } from '@/components/ui/logo'

function RegistrationForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'provider' },
        emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
      },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Tento e-mail je již zaregistrovaný.'
        : 'Registraci se nepodařilo dokončit. Zkus to znovu.')
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-sm text-center">
        <Link href="/">
          <Logo className="h-7 w-auto" />
        </Link>
        <div className="mt-8 rounded-2xl border border-border bg-card p-8">
          <div className="text-4xl">📬</div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Zkontroluj svůj e-mail</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Poslali jsme ti potvrzovací odkaz na <strong>{email}</strong>.
            Klikni na něj a pak se přihlas.
          </p>
          <Link href="/prihlaseni" className={buttonVariants({ variant: 'outline' }) + ' mt-6 w-full'}>
            Přejít na přihlášení
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-semibold text-primary">Vytvořit účet na portále jsem Blažená</h1>
      </div>

      <OAuthButtons />

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-foreground">nebo e-mailem</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Heslo</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <p className="text-xs text-foreground">Alespoň 8 znaků</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={buttonVariants() + ' mt-1 w-full'}
        >
          {loading ? 'Registruji…' : 'Vytvořit účet'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground">
        Už máš účet?{' '}
        <Link href="/prihlaseni" className="font-medium text-primary hover:underline">
          Přihlásit se
        </Link>
      </p>
    </div>
  )
}

export default function RegistracePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Suspense>
        <RegistrationForm />
      </Suspense>
    </div>
  )
}
