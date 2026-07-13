'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { sendNovaPoptavka } from '@/lib/email'

const EMAIL_RE = /\S+@\S+\.\S+/

export type PoptavkaInput = {
  medailonekId: string
  jmeno: string
  email: string
  telefon: string
  zprava: string
  serviceId: number | null
  serviceNazev: string | null
  honeypot: string
}

export async function submitPoptavka(input: PoptavkaInput) {
  // Honeypot — bot pole vyplní, člověk ho nikdy neuvidí. Tiché "úspěšné"
  // no-op, ať to bota neupozorní, že byl odhalen.
  if (input.honeypot.trim()) return { ok: true }

  const jmeno = input.jmeno.trim().slice(0, 120)
  const email = input.email.trim().slice(0, 200)
  const telefon = input.telefon.trim().slice(0, 30)
  const zprava = input.zprava.trim().slice(0, 2000)
  const serviceNazev = input.serviceNazev?.trim().slice(0, 200) || null

  if (!jmeno) return { error: 'Vyplň prosím jméno.' }
  if (!EMAIL_RE.test(email)) return { error: 'Vyplň prosím platný e-mail.' }
  if (!serviceNazev) return { error: 'Vyber prosím, o co máš zájem.' }
  if (!zprava) return { error: 'Napiš prosím zprávu.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || null

  if (ip) {
    const { data: limited } = await supabase.rpc('poptavka_rate_limited', { p_ip: ip })
    if (limited) {
      return { error: 'Za poslední chvíli jsi odeslala už několik zpráv, zkus to prosím později.' }
    }
  }

  const { error } = await supabase.from('poptavka').insert({
    medailonek_id: input.medailonekId,
    user_id: user?.id ?? null,
    jmeno,
    email,
    telefon: telefon || null,
    zprava,
    service_id: input.serviceId,
    ip,
  })

  if (error) return { error: 'Poptávku se nepodařilo odeslat. Zkus to prosím znovu.' }

  // E-mail expertce — výpadek Resendu nesmí zrušit už uloženou poptávku.
  try {
    const admin = createAdminClient()
    const { data: med } = await admin
      .from('medailonek')
      .select('kontakt_email, user_id')
      .eq('id', input.medailonekId)
      .maybeSingle()

    let to = med?.kontakt_email ?? null
    if (!to && med?.user_id) {
      const { data: authUser } = await admin.auth.admin.getUserById(med.user_id)
      to = authUser.user?.email ?? null
    }

    if (to) {
      await sendNovaPoptavka({ to, jmeno, email, telefon, zprava, serviceNazev, medailonekId: input.medailonekId })
    }
  } catch {
    // poptávka je uložená, e-mail je jen doplněk — chyba se nesmí projevit uživatelce
  }

  // Přihlášené uživatelce tiše dosynchronizovat jméno/telefon pro příště.
  if (user) {
    try {
      await supabase.auth.updateUser({ data: { jmeno, telefon: telefon || undefined } })
    } catch {
      // nekritické, poptávka už je odeslaná
    }
  }

  return { ok: true }
}
