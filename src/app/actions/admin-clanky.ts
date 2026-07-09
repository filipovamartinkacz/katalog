'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { validateClanekContent } from '@/lib/clanek/validate-content'
import { sendClanekSchvalen, sendClanekZamitnut } from '@/lib/email'
import { generateUniqueSlug } from './clanek'

function isAdmin(email: string | undefined) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  return adminEmails.includes(email?.toLowerCase() ?? '')
}

export async function schvalitClanek(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return { error: 'Nemáš oprávnění.' }

  const admin = createAdminClient()
  const { data: clanek, error } = await admin
    .from('clanek')
    .update({ status: 'publikovano', published_at: new Date().toISOString(), zamitnuti_duvod: null })
    .eq('id', id)
    .select('nadpis, slug, medailonek_id')
    .single()

  if (error || !clanek) return { error: error?.message ?? 'Schválení se nezdařilo.' }

  const { data: medailonek } = await admin
    .from('medailonek')
    .select('jmeno, user_id')
    .eq('id', clanek.medailonek_id)
    .single()

  if (medailonek) {
    const { data: authUser } = await admin.auth.admin.getUserById(medailonek.user_id)
    if (authUser.user?.email) {
      await sendClanekSchvalen({ to: authUser.user.email, jmeno: medailonek.jmeno, nadpis: clanek.nadpis, slug: clanek.slug })
    }
  }

  revalidatePath('/admin/clanky')
  revalidatePath(`/blog/${clanek.slug}`)
  revalidatePath('/blog')
  return { ok: true }
}

export async function zamitnoutClanek(id: string, duvod: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return { error: 'Nemáš oprávnění.' }

  const trimmed = duvod.trim()
  if (!trimmed) return { error: 'Napiš prosím důvod zamítnutí.' }

  const admin = createAdminClient()
  const { data: clanek, error } = await admin
    .from('clanek')
    .update({ status: 'zamitnuto', zamitnuti_duvod: trimmed })
    .eq('id', id)
    .select('nadpis, medailonek_id')
    .single()

  if (error || !clanek) return { error: error?.message ?? 'Zamítnutí se nezdařilo.' }

  const { data: medailonek } = await admin
    .from('medailonek')
    .select('jmeno, user_id')
    .eq('id', clanek.medailonek_id)
    .single()

  if (medailonek) {
    const { data: authUser } = await admin.auth.admin.getUserById(medailonek.user_id)
    if (authUser.user?.email) {
      await sendClanekZamitnut({ to: authUser.user.email, jmeno: medailonek.jmeno, nadpis: clanek.nadpis, duvod: trimmed })
    }
  }

  revalidatePath('/admin/clanky')
  return { ok: true }
}

export type AdminClanekInput = {
  typ: 'blog' | 'podcast' | 'video'
  kategorie_id: number
  nadpis: string
  slug: string
  obsah: unknown
  cover_url: string
  cover_alt: string
  zdroj_url: string
  je_gated: boolean
  seo_title: string
  seo_description: string
  status: 'rozpracovano' | 'ceka_na_schvaleni' | 'publikovano' | 'zamitnuto'
  published_at: string | null
  zamitnuti_duvod: string | null
  metoda_ids: number[]
  klicova_slova: string[]
}

export async function adminUpravitClanek(id: string, data: AdminClanekInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return { error: 'Nemáš oprávnění.' }

  const slug = data.slug.trim()
  if (!slug) return { error: 'Slug nemůže být prázdný.' }
  if (data.status === 'zamitnuto' && !data.zamitnuti_duvod?.trim()) {
    return { error: 'Napiš prosím důvod zamítnutí.' }
  }

  const admin = createAdminClient()
  const obsah = validateClanekContent(data.obsah)

  const { error } = await admin
    .from('clanek')
    .update({
      typ: data.typ,
      kategorie_id: data.kategorie_id,
      nadpis: data.nadpis.trim(),
      slug,
      obsah,
      cover_url: data.cover_url,
      cover_alt: data.cover_alt.trim(),
      zdroj_url: data.zdroj_url.trim() || null,
      je_gated: data.je_gated,
      seo_title: data.seo_title.trim() || null,
      seo_description: data.seo_description.trim() || null,
      status: data.status,
      published_at: data.status === 'publikovano' ? (data.published_at ?? new Date().toISOString()) : null,
      zamitnuti_duvod: data.status === 'zamitnuto' ? data.zamitnuti_duvod?.trim() : null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  await admin.from('clanek_metoda').delete().eq('clanek_id', id)
  if (data.metoda_ids.length > 0) {
    await admin.from('clanek_metoda').insert(data.metoda_ids.map(metoda_id => ({ clanek_id: id, metoda_id })))
  }

  const normalized = [...new Set(data.klicova_slova.map(s => s.trim().toLowerCase()).filter(Boolean))]
  await admin.from('clanek_klicove_slovo').delete().eq('clanek_id', id)
  if (normalized.length) {
    await admin.from('klicove_slovo').upsert(normalized.map(slovo => ({ slovo })), { onConflict: 'slovo', ignoreDuplicates: true })
    const { data: kws } = await admin.from('klicove_slovo').select('id').in('slovo', normalized)
    if (kws?.length) {
      await admin.from('clanek_klicove_slovo').insert(kws.map((k: { id: number }) => ({ clanek_id: id, klicove_slovo_id: k.id })))
    }
  }

  revalidatePath('/admin/clanky')
  revalidatePath(`/admin/clanky/${id}/upravit`)
  revalidatePath(`/blog/${slug}`)
  revalidatePath('/blog')
  return { ok: true }
}

export type AdminClanekCreateInput = AdminClanekInput & { medailonek_id: string }

// Admin může založit článek i za expertku (např. na základě rozhovoru) a přiřadit ji
// jako autorku — nemusí ho psát ona sama.
export async function adminVytvoritClanek(data: AdminClanekCreateInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return { error: 'Nemáš oprávnění.' }

  if (!data.medailonek_id) return { error: 'Vyber autorku.' }
  if (data.status === 'zamitnuto' && !data.zamitnuti_duvod?.trim()) {
    return { error: 'Napiš prosím důvod zamítnutí.' }
  }

  const admin = createAdminClient()
  const slug = await generateUniqueSlug(data.nadpis.trim())
  const obsah = validateClanekContent(data.obsah)

  const { data: clanek, error } = await admin
    .from('clanek')
    .insert({
      medailonek_id: data.medailonek_id,
      typ: data.typ,
      kategorie_id: data.kategorie_id,
      nadpis: data.nadpis.trim(),
      slug,
      obsah,
      cover_url: data.cover_url,
      cover_alt: data.cover_alt.trim(),
      zdroj_url: data.zdroj_url.trim() || null,
      je_gated: data.je_gated,
      seo_title: data.seo_title.trim() || null,
      seo_description: data.seo_description.trim() || null,
      status: data.status,
      published_at: data.status === 'publikovano' ? (data.published_at ?? new Date().toISOString()) : null,
      zamitnuti_duvod: data.status === 'zamitnuto' ? data.zamitnuti_duvod?.trim() : null,
    })
    .select('id')
    .single()

  if (error || !clanek) return { error: error?.message ?? 'Nepodařilo se vytvořit článek.' }

  if (data.metoda_ids.length > 0) {
    await admin.from('clanek_metoda').insert(data.metoda_ids.map(metoda_id => ({ clanek_id: clanek.id, metoda_id })))
  }

  const normalized = [...new Set(data.klicova_slova.map(s => s.trim().toLowerCase()).filter(Boolean))]
  if (normalized.length) {
    await admin.from('klicove_slovo').upsert(normalized.map(slovo => ({ slovo })), { onConflict: 'slovo', ignoreDuplicates: true })
    const { data: kws } = await admin.from('klicove_slovo').select('id').in('slovo', normalized)
    if (kws?.length) {
      await admin.from('clanek_klicove_slovo').insert(kws.map((k: { id: number }) => ({ clanek_id: clanek.id, klicove_slovo_id: k.id })))
    }
  }

  revalidatePath('/admin/clanky')
  redirect(`/admin/clanky/${clanek.id}/upravit`)
}

export async function adminSmazatClanek(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return { error: 'Nemáš oprávnění.' }

  const { error } = await createAdminClient().from('clanek').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/clanky')
  return { ok: true }
}
