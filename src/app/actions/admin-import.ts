'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Schéma JSON generovaného AI ──────────────────────────────
export type ImportJson = {
  email: string                    // povinný — účet providera
  jmeno: string
  prijmeni: string
  display_name?: string
  bio: string
  kontakt_email?: string
  telefon?: string
  ico?: string
  web?: string                     // URL webu
  instagram?: string
  facebook?: string
  linkedin?: string
  tiktok?: string
  mesta?: string[]                 // názvy měst, např. ["Praha", "Brno"]
  metody?: string[]                // názvy metod, např. ["Reiki"]
  sluzby: {
    nazev: string
    popis?: string
    forma: 'osobne' | 'online' | 'oboji'
    cena?: string                  // "€", "€€", "€€€", "€€€€"
    kategorie: string[]            // názvy kategorií
    klicova_slova?: string[]       // klíčová slova pro vyhledávání
    booking_url?: string
  }[]
}

export type ImportResult = {
  ok: boolean
  message: string
  warnings: string[]
}

export async function importMedailonekFromJson(raw: string): Promise<ImportResult> {
  // Admin check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Nejsi přihlášena.', warnings: [] }

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  if (!adminEmails.includes(user.email?.toLowerCase() ?? '')) {
    return { ok: false, message: 'Nemáš oprávnění admina.', warnings: [] }
  }

  // Parse JSON
  let data: ImportJson
  try {
    data = JSON.parse(raw)
  } catch {
    return { ok: false, message: 'Neplatný JSON — zkontroluj formát.', warnings: [] }
  }

  // Validace povinných polí
  if (!data.email?.includes('@')) return { ok: false, message: 'Chybí platný email providera.', warnings: [] }
  if (!data.jmeno || !data.prijmeni) return { ok: false, message: 'Chybí jméno nebo příjmení.', warnings: [] }
  if (!data.bio || data.bio.trim().length < 10) return { ok: false, message: 'Bio je příliš krátké.', warnings: [] }
  if (!data.sluzby?.length) return { ok: false, message: 'Musí být alespoň jedna služba.', warnings: [] }
  for (const s of data.sluzby) {
    if (!s.nazev) return { ok: false, message: `Službě chybí název.`, warnings: [] }
    if (!s.kategorie?.length) return { ok: false, message: `Služba "${s.nazev}" nemá žádnou kategorii.`, warnings: [] }
  }

  const warnings: string[] = []
  const admin = createAdminClient()

  // Získej nebo pozvi providera
  const { data: { users: existingUsers } } = await admin.auth.admin.listUsers()
  let providerId: string
  const existing = existingUsers.find(u => u.email?.toLowerCase() === data.email.toLowerCase())

  if (existing) {
    providerId = existing.id
    // Zkontroluj, zda nemá existující medailonek
    const { data: existingMed } = await supabase.from('medailonek').select('id').eq('user_id', providerId).maybeSingle()
    if (existingMed) return { ok: false, message: `Uživatelka ${data.email} již má medailonek.`, warnings: [] }
  } else {
    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(data.email, {
      data: { role: 'provider' },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://katalog-woad.vercel.app'}/auth/callback?next=/dashboard`,
    })
    if (inviteErr || !invited.user) {
      return { ok: false, message: `Nepodařilo se pozvat uživatelku: ${inviteErr?.message}`, warnings: [] }
    }
    providerId = invited.user.id
  }

  // Překlad názvů na ID ─────────────────────────────────────

  // Města
  const mestoIds: number[] = []
  for (const nazev of data.mesta ?? []) {
    const { data: rows } = await supabase
      .from('mesto').select('id, nazev').ilike('nazev', nazev).limit(3)
    if (!rows?.length) { warnings.push(`Město "${nazev}" nenalezeno — přeskočeno.`); continue }
    if (rows.length > 1) warnings.push(`"${nazev}" — nalezeno více shod, použita první (${rows[0].nazev}).`)
    mestoIds.push(rows[0].id)
  }

  // Metody — neznámé se uloží jako "navrzena" k admin schválení
  const metodaIds: number[] = []
  for (const nazev of data.metody ?? []) {
    const { data: row } = await admin
      .from('metoda').select('id, status').ilike('nazev', nazev).maybeSingle()
    if (row) {
      metodaIds.push(row.id)
      if (row.status === 'navrzena') {
        warnings.push(`⏳ Metoda "${nazev}" čeká na schválení adminem.`)
      }
    } else {
      // Nová metoda — uloží jako návrh k posouzení
      const { data: created, error: insertErr } = await admin
        .from('metoda').insert({ nazev: nazev.trim(), status: 'navrzena' }).select('id').single()
      if (created) {
        metodaIds.push(created.id)
        warnings.push(`🆕 Metoda "${nazev}" neexistovala — přidána jako návrh ke schválení.`)
      } else {
        warnings.push(`Metodu "${nazev}" se nepodařilo uložit — přeskočena. Chyba: ${insertErr?.message ?? 'neznámá'}`)
      }
    }
  }

  // Price levels
  const { data: priceLevels } = await supabase.from('price_level').select('id, label')
  const priceMap = Object.fromEntries((priceLevels ?? []).map(p => [p.label, p.id]))

  // Kategorie
  const { data: allKat } = await supabase.from('kategorie').select('id, nazev')
  const katMap = Object.fromEntries((allKat ?? []).map(k => [k.nazev.toLowerCase(), k.id]))
  const ostatniId: number | undefined = katMap['ostatní']

  // Vytvoř medailonek ────────────────────────────────────────
  const adminSupabase = createAdminClient()

  const { data: medailonek, error: medErr } = await adminSupabase
    .from('medailonek')
    .insert({
      user_id: providerId,
      jmeno: data.jmeno.trim(),
      prijmeni: data.prijmeni.trim(),
      display_name: data.display_name?.trim() || null,
      bio: data.bio.trim(),
      kontakt_email: data.kontakt_email?.trim() || null,
      telefon: data.telefon?.trim() || null,
      ico: data.ico?.trim() || null,
    })
    .select('id')
    .single()

  if (medErr || !medailonek) {
    return { ok: false, message: `Chyba při vytváření profilu: ${medErr?.message}`, warnings }
  }
  const mid = medailonek.id

  // Lokace
  if (mestoIds.length > 0) {
    await adminSupabase.from('medailonek_location').insert(
      mestoIds.map(mesto_id => ({ medailonek_id: mid, mesto_id }))
    )
  }

  // Metody
  if (metodaIds.length > 0) {
    await adminSupabase.from('medailonek_metoda').insert(
      metodaIds.map(metoda_id => ({ medailonek_id: mid, metoda_id }))
    )
  }

  // Sociální sítě
  const socialPlatforms = ['web', 'instagram', 'facebook', 'linkedin', 'tiktok'] as const
  const socialLinks = socialPlatforms
    .map(p => ({ platform: p, url: data[p]?.trim() ?? '' }))
    .filter(l => l.url)
  if (socialLinks.length > 0) {
    await adminSupabase.from('social_link').insert(
      socialLinks.map(l => ({ medailonek_id: mid, platform: l.platform, url: l.url }))
    )
  }

  // Služby
  for (const svc of data.sluzby) {
    const katIds = svc.kategorie
      .map(n => katMap[n.toLowerCase()])
      .filter((id): id is number => !!id)

    for (const k of svc.kategorie) {
      if (!katMap[k.toLowerCase()]) warnings.push(`Kategorie "${k}" nenalezena — přeskočena.`)
    }

    // Fallback na "Ostatní" — upozornění pro admina ke zvážení nové kategorie
    if (!katIds.length) {
      if (ostatniId) {
        katIds.push(ostatniId)
        warnings.push(`⚠️ Služba "${svc.nazev}" nezařazena do žádné kategorie — zařazena do Ostatní. Zvaž přidání nové kategorie.`)
      } else {
        warnings.push(`Služba "${svc.nazev}": žádná kategorie nenalezena — přeskočena.`)
        continue
      }
    }

    const { data: service, error: serviceErr } = await adminSupabase
      .from('service')
      .insert({
        medailonek_id: mid,
        nazev: svc.nazev.trim(),
        popis: svc.popis?.trim() || null,
        delivery_form: svc.forma,
        booking_url: svc.booking_url?.trim() || null,
        price_level_id: svc.cena ? (priceMap[svc.cena] ?? null) : null,
      })
      .select('id')
      .single()

    if (!service) {
      warnings.push(`⚠️ Službu "${svc.nazev}" se nepodařilo uložit. Chyba: ${serviceErr?.message ?? 'neznámá'}`)
      continue
    }

    if (service) {
      await adminSupabase.from('service_kategorie').insert(
        katIds.map(kategorie_id => ({ service_id: service.id, kategorie_id }))
      )

      // Klíčová slova
      const slova = (svc.klicova_slova ?? []).map(s => s.trim().toLowerCase()).filter(Boolean)
      if (slova.length > 0) {
        await adminSupabase.from('klicove_slovo')
          .upsert(slova.map(slovo => ({ slovo })), { onConflict: 'slovo', ignoreDuplicates: true })
        const { data: kws } = await adminSupabase.from('klicove_slovo').select('id').in('slovo', slova)
        if (kws?.length) {
          await adminSupabase.from('service_klicove_slovo').insert(
            kws.map((k: { id: number }) => ({ service_id: service.id, klicove_slovo_id: k.id }))
          )
        }
      }
    }
  }

  const action = existing ? 'propojen s existujícím účtem' : 'pozvánka odeslána na email'
  return {
    ok: true,
    message: `Medailonek pro ${data.jmeno} ${data.prijmeni} vytvořen. Účet: ${action}.`,
    warnings,
  }
}
