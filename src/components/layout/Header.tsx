import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './sign-out-button'
import { Logo } from '@/components/ui/logo'
import { NavLinks } from './nav-links'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Zobraz křestní jméno z medailonku, nebo email jako fallback
  let displayName: string | null = null
  let isAdmin = false
  if (user) {
    const { data: med } = await supabase
      .from('medailonek')
      .select('jmeno')
      .eq('user_id', user.id)
      .maybeSingle()
    displayName = med?.jmeno ?? (user.email ?? null)
    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
    isAdmin = adminEmails.includes(user.email?.toLowerCase() ?? '')
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <Logo className="h-[22px] w-auto" />
        </Link>

        <NavLinks />

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent hover:bg-accent/20 transition-colors">
                  Admin
                </Link>
              )}
              <Link href="/dashboard" className="max-w-[120px] truncate text-sm text-foreground/70 transition-colors hover:text-foreground">
                {displayName}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/prihlaseni" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Přihlásit se
              </Link>
              <Link href="/registrace" className={buttonVariants({ size: 'sm' })}>
                Registrovat se
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
