'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { toSlug } from '@/lib/slug'

async function generateUniqueSlug(jmeno: string, prijmeni: string, excludeId?: string): Promise<string> {
  const admin = createAdminClient()
  const base = toSlug(`${jmeno}-${prijmeni}`)
  let candidate = base
  let i = 2
  for (;;) {
    let q = admin.from('medailonek').select('id', { count: 'exact', head: true }).eq('slug', candidate)
    if (excludeId) q = q.neq('id', excludeId)
    const { count } = await q
    if (!count) return candidate
    candidate = `${base}-${i}`
    i++
  }
}

export type ServiceInput = {
  nazev: string
  popis: string
  delivery_form: 'osobne' | 'online' | 'oboji'
  booking_url: string
  price_level_id: number | null
  kategorie_ids: number[]
  klicova_slova: string[]
}

export type SocialLinkInput = {
  platform: 'web' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube'
  url: string
}

export type MedailonekInput = {
  jmeno: string
  prijmeni: string
  display_name: string
  bio: string
  kontakt_email: string
  telefon: string
  ico: string
  mesto_ids: number[]
  metoda_ids: number[]
  nove_metody: string[]
  services: ServiceInput[]
  social_links: SocialLinkInput[]
  foto_url: string | null
  banner_url: string | null
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function saveNoveMetody(supabase: SupabaseClient, medailonekId: string, nazvy: string[]): Promise<void> {
  const admin = createAdminClient()
  const unique = [...new Set(nazvy.map(n => n.trim()).filter(Boolean))]
  for (const nazev of unique) {
    // Upsert — pokud metoda se stejným názvem už existuje (i jako 'navrzena'), použijeme ji
    await admin.from('metoda')
      .upsert({ nazev, status: 'navrzena' }, { onConflict: 'nazev', ignoreDuplicates: true })
    const { data: metoda } = await admin.from('metoda').select('id').eq('nazev', nazev).single()
    if (!metoda) continue
    // Propojení — ignorujeme pokud už existuje (medailonek mohl mít tuto metodu dřív)
    await supabase.from('medailonek_metoda')
      .upsert({ medailonek_id: medailonekId, metoda_id: metoda.id }, { onConflict: 'medailonek_id,metoda_id', ignoreDuplicates: true })
  }
}

async function saveKeywords(supabase: SupabaseClient, serviceId: number, slova: string[]) {
  const normalized = slova.map(s => s.trim().toLowerCase()).filter(Boolean)
  if (!normalized.length) return

  await supabase.from('klicove_slovo')
    .upsert(normalized.map(slovo => ({ slovo })), { onConflict: 'slovo', ignoreDuplicates: true })

  const { data: kws } = await supabase.from('klicove_slovo').select('id').in('slovo', normalized)
  if (kws?.length) {
    await supabase.from('service_klicove_slovo').insert(
      kws.map((k: { id: number }) => ({ service_id: serviceId, klicove_slovo_id: k.id }))
    )
  }
}

export async function createMedailonek(data: MedailonekInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nejsi přihlášena.' }

  const slug = await generateUniqueSlug(data.jmeno.trim(), data.prijmeni.trim())

  // Vytvoř medailonek
  const { data: medailonek, error: medErr } = await supabase
    .from('medailonek')
    .insert({
      user_id: user.id,
      jmeno: data.jmeno.trim(),
      prijmeni: data.prijmeni.trim(),
      display_name: data.display_name.trim() || null,
      bio: data.bio.trim(),
      kontakt_email: data.kontakt_email.trim() || null,
      telefon: data.telefon.trim() || null,
      ico: data.ico.trim() || null,
      foto_url: data.foto_url || null,
      banner_url: data.banner_url || null,
      slug,
    })
    .select('id')
    .single()

  if (medErr || !medailonek) return { error: 'Nepodařilo se vytvořit profil.' }

  const mid = medailonek.id

  // Lokace
  if (data.mesto_ids.length > 0) {
    await supabase.from('medailonek_location').insert(
      data.mesto_ids.map(mesto_id => ({ medailonek_id: mid, mesto_id }))
    )
  }

  // Metody
  if (data.metoda_ids.length > 0) {
    await supabase.from('medailonek_metoda').insert(
      data.metoda_ids.map(metoda_id => ({ medailonek_id: mid, metoda_id }))
    )
  }
  if (data.nove_metody.length > 0) await saveNoveMetody(supabase, mid, data.nove_metody)

  // Služby
  for (const svc of data.services) {
    const { data: service, error: svcErr } = await supabase
      .from('service')
      .insert({
        medailonek_id: mid,
        nazev: svc.nazev.trim(),
        popis: svc.popis.trim() || null,
        delivery_form: svc.delivery_form,
        booking_url: svc.booking_url.trim() || null,
        price_level_id: svc.price_level_id,
      })
      .select('id')
      .single()

    if (svcErr || !service) continue

    if (svc.kategorie_ids.length > 0) {
      await supabase.from('service_kategorie').insert(
        svc.kategorie_ids.map(kategorie_id => ({ service_id: service.id, kategorie_id }))
      )
    }
    await saveKeywords(supabase, service.id, svc.klicova_slova)
  }

  // Sociální sítě
  const validLinks = data.social_links.filter(l => l.url.trim())
  if (validLinks.length > 0) {
    await supabase.from('social_link').insert(
      validLinks.map(l => ({ medailonek_id: mid, platform: l.platform, url: l.url.trim() }))
    )
  }

  redirect('/dashboard/medailonek/odeslano')
}

export async function updateMedailonek(data: MedailonekInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nejsi přihlášena.' }

  // Ověř vlastnictví
  const { data: existing } = await supabase
    .from('medailonek').select('id').eq('user_id', user.id).maybeSingle()
  if (!existing) return { error: 'Profil nenalezen.' }
  const mid = existing.id

  // Základní údaje
  const { error: medErr } = await supabase
    .from('medailonek')
    .update({
      jmeno: data.jmeno.trim(),
      prijmeni: data.prijmeni.trim(),
      display_name: data.display_name.trim() || null,
      bio: data.bio.trim(),
      kontakt_email: data.kontakt_email.trim() || null,
      telefon: data.telefon.trim() || null,
      ico: data.ico.trim() || null,
      foto_url: data.foto_url || null,
      banner_url: data.banner_url || null,
    })
    .eq('id', mid)

  if (medErr) return { error: 'Nepodařilo se uložit profil.' }

  // Lokace — vymaž a znovu vlož
  await supabase.from('medailonek_location').delete().eq('medailonek_id', mid)
  if (data.mesto_ids.length > 0) {
    await supabase.from('medailonek_location').insert(
      data.mesto_ids.map(mesto_id => ({ medailonek_id: mid, mesto_id }))
    )
  }

  // Metody
  await supabase.from('medailonek_metoda').delete().eq('medailonek_id', mid)
  if (data.metoda_ids.length > 0) {
    await supabase.from('medailonek_metoda').insert(
      data.metoda_ids.map(metoda_id => ({ medailonek_id: mid, metoda_id }))
    )
  }
  if (data.nove_metody.length > 0) await saveNoveMetody(supabase, mid, data.nove_metody)

  // Sociální sítě
  await supabase.from('social_link').delete().eq('medailonek_id', mid)
  const validLinks = data.social_links.filter(l => l.url.trim())
  if (validLinks.length > 0) {
    await supabase.from('social_link').insert(
      validLinks.map(l => ({ medailonek_id: mid, platform: l.platform, url: l.url.trim() }))
    )
  }

  // Služby — vymaž existující (cascade smaže service_kategorie) a znovu vlož
  const { data: oldServices } = await supabase
    .from('service').select('id').eq('medailonek_id', mid)
  if (oldServices?.length) {
    const ids = oldServices.map(s => s.id)
    await supabase.from('service_klicove_slovo').delete().in('service_id', ids)
    await supabase.from('service_kategorie').delete().in('service_id', ids)
    await supabase.from('service').delete().eq('medailonek_id', mid)
  }

  for (const svc of data.services) {
    const { data: service } = await supabase
      .from('service')
      .insert({
        medailonek_id: mid,
        nazev: svc.nazev.trim(),
        popis: svc.popis.trim() || null,
        delivery_form: svc.delivery_form,
        booking_url: svc.booking_url.trim() || null,
        price_level_id: svc.price_level_id,
      })
      .select('id')
      .single()

    if (service) {
      if (svc.kategorie_ids.length > 0) {
        await supabase.from('service_kategorie').insert(
          svc.kategorie_ids.map(kategorie_id => ({ service_id: service.id, kategorie_id }))
        )
      }
      await saveKeywords(supabase, service.id, svc.klicova_slova)
    }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard?updated=1')
}
