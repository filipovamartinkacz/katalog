import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Signup: e-mail je potvrzen Supabase serverem před tímto redirectem.
  // Nepotřebujeme session — pošleme rovnou na přihlášení.
  if (type === 'signup') {
    return NextResponse.redirect(`${origin}/prihlaseni?confirmed=1`)
  }

  // Ostatní flow (reset hesla atd.) — potřebujeme session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('auth/callback exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/prihlaseni?error=oauth&detail=${encodeURIComponent(error.message)}`)
  }

  // Záložní kontrola — session mohla být nastavena přímo
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  const errorParam = searchParams.get('error_description') ?? searchParams.get('error')
  console.error('auth/callback: no code, no session. Query params:', Object.fromEntries(searchParams))
  return NextResponse.redirect(
    `${origin}/prihlaseni?error=oauth${errorParam ? `&detail=${encodeURIComponent(errorParam)}` : ''}`
  )
}
