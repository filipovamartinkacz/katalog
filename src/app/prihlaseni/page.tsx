'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buttonVariants } from '@/components/ui/button'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { Suspense } from 'react'
import { Logo } from '@/components/ui/logo'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'
  const errorParam = searchParams.get('error')
  const initialError = errorParam === 'oauth'
    ? 'Přihlášení přes externí účet se nezdařilo.'
    : errorParam === 'confirm'
    ? 'Potvrzení e-mailu se nezdařilo. Zkus se přihlásit přímo.'
    : null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(initialError)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Nesprávný e-mail nebo heslo.')
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-8 text-center">
        <Link href="/">
          <Logo className="h-7 w-auto" />
        </Link>
        <h1 className="mt-6 text-xl font-semibold text-foreground">Přihlásit se</h1>
      </div>

      <OAuthButtons />

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">nebo e-mailem</span>
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
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={buttonVariants() + ' mt-1 w-full'}
        >
          {loading ? 'Přihlašuji…' : 'Přihlásit se'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Nemáš účet?{' '}
        <Link href="/registrace" className="font-medium text-primary hover:underline">
          Zaregistruj se
        </Link>
      </p>
    </div>
  )
}

export default function PrihlaseniPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
