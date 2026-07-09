'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'vid'
const YEAR_SECONDS = 60 * 60 * 24 * 365

export async function recordClanekView(clanekId: string) {
  try {
    const cookieStore = await cookies()
    let visitorId = cookieStore.get(COOKIE_NAME)?.value

    if (!visitorId) {
      visitorId = crypto.randomUUID()
      cookieStore.set(COOKIE_NAME, visitorId, {
        maxAge: YEAR_SECONDS,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    }

    const supabase = await createClient()
    await supabase.rpc('record_clanek_view', { p_clanek_id: clanekId, p_visitor_id: visitorId })
  } catch {
    // Zobrazení se nikdy nesmí propsat do chyby na stránce.
  }
}
