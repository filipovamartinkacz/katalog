'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { toSlug } from '@/lib/slug'
import { validateClanekContent } from '@/lib/clanek/validate-content'
import { sendClanekKSchvaleni } from '@/lib/email'

export async function generateUniqueSlug(nadpis: string): Promise<string> {
  const admin = createAdminClient()
  const base = toSlug(nadpis)
  let candidate = base
  let i = 2
  for (;;) {
    const { count } = await admin.from('clanek').select('id', { count: 'exact', head: true }).eq('slug', candidate)
    if (!count) return candidate
    candidate = `${base}-${i}`
    i++
  }
}

export type ClanekInput = {
  typ: 'blog' | 'podcast' | 'video'
  kategorie_id: number
  nadpis: string
  obsah: unknown
  cover_url: string
  cover_alt: string
  zdroj_url: string
  je_gated: boolean
  seo_title: string
  seo_description: string
  metoda_ids: number[]
  klicova_slova: string[]
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function saveClanekMetody(supabase: SupabaseClient, clanekId: string, metodaIds: number[]) {
  if (!metodaIds.length) return
  await supabase.from('clanek_metoda').insert(
    metodaIds.map(metoda_id => ({ clanek_id: clanekId, metoda_id }))
  )
}

async function saveClanekKeywords(supabase: SupabaseClient, clanekId: string, slova: string[]) {
  const normalized = [...new Set(slova.map(s => s.trim().toLowerCase()).filter(Boolean))]
  if (!normalized.length) return

  await supabase.from('klicove_slovo')
    .upsert(normalized.map(slovo => ({ slovo })), { onConflict: 'slovo', ignoreDuplicates: true })

  const { data: kws } = await supabase.from('klicove_slovo').select('id').in('slovo', normalized)
  if (kws?.length) {
    await supabase.from('clanek_klicove_slovo').insert(
      kws.map((k: { id: number }) => ({ clanek_id: clanekId, klicove_slovo_id: k.id }))
    )
  }
}

export async function createClanekDraft(data: ClanekInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nejsi přihlášena.' }

  const { data: medailonek } = await supabase
    .from('medailonek')
    .select('id, is_published')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!medailonek) return { error: 'Nejdřív si vytvoř medailonek.' }
  if (!medailonek.is_published) return { error: 'Články může psát jen odbornice se schváleným medailonkem.' }

  const slug = await generateUniqueSlug(data.nadpis.trim())
  const obsah = validateClanekContent(data.obsah)

  const { data: clanek, error } = await supabase
    .from('clanek')
    .insert({
      medailonek_id: medailonek.id,
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
      status: 'rozpracovano',
    })
    .select('id')
    .single()

  if (error || !clanek) return { error: 'Nepodařilo se vytvořit článek.' }

  await saveClanekMetody(supabase, clanek.id, data.metoda_ids)
  await saveClanekKeywords(supabase, clanek.id, data.klicova_slova)

  revalidatePath('/dashboard/clanky')
  redirect(`/dashboard/clanky/${clanek.id}/upravit`)
}

export async function updateClanekDraft(id: string, data: ClanekInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nejsi přihlášena.' }

  const obsah = validateClanekContent(data.obsah)

  const { data: updated, error } = await supabase
    .from('clanek')
    .update({
      typ: data.typ,
      kategorie_id: data.kategorie_id,
      nadpis: data.nadpis.trim(),
      obsah,
      cover_url: data.cover_url,
      cover_alt: data.cover_alt.trim(),
      zdroj_url: data.zdroj_url.trim() || null,
      je_gated: data.je_gated,
      seo_title: data.seo_title.trim() || null,
      seo_description: data.seo_description.trim() || null,
    })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) return { error: error.message }
  if (!updated) return { error: 'Článek teď nelze upravovat (čeká na schválení).' }

  await supabase.from('clanek_metoda').delete().eq('clanek_id', id)
  await saveClanekMetody(supabase, id, data.metoda_ids)

  await supabase.from('clanek_klicove_slovo').delete().eq('clanek_id', id)
  await saveClanekKeywords(supabase, id, data.klicova_slova)

  revalidatePath(`/dashboard/clanky/${id}/upravit`)
  return { ok: true }
}

export async function submitClanekForReview(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nejsi přihlášena.' }

  const { data: updated, error } = await supabase
    .from('clanek')
    .update({ status: 'ceka_na_schvaleni' })
    .eq('id', id)
    .select('nadpis, medailonek_id')
    .maybeSingle()

  if (error) return { error: error.message }
  if (!updated) return { error: 'Článek nelze odeslat ke schválení.' }

  const { data: medailonek } = await supabase
    .from('medailonek')
    .select('jmeno')
    .eq('id', updated.medailonek_id)
    .maybeSingle()

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  await sendClanekKSchvaleni({
    to: adminEmails,
    autorkaJmeno: medailonek?.jmeno ?? 'Autorka',
    nadpis: updated.nadpis,
  })

  revalidatePath('/dashboard/clanky')
  redirect('/dashboard/clanky')
}

export async function proposeChangesToPublished(id: string, data: ClanekInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nejsi přihlášena.' }

  const obsah = validateClanekContent(data.obsah)

  const { data: updated, error } = await supabase
    .from('clanek')
    .update({
      typ: data.typ,
      kategorie_id: data.kategorie_id,
      nadpis: data.nadpis.trim(),
      obsah,
      cover_url: data.cover_url,
      cover_alt: data.cover_alt.trim(),
      zdroj_url: data.zdroj_url.trim() || null,
      je_gated: data.je_gated,
      seo_title: data.seo_title.trim() || null,
      seo_description: data.seo_description.trim() || null,
      status: 'rozpracovano',
    })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) return { error: error.message }
  if (!updated) return { error: 'Úprava se nezdařila (článek teď nelze upravovat).' }

  await supabase.from('clanek_metoda').delete().eq('clanek_id', id)
  await saveClanekMetody(supabase, id, data.metoda_ids)
  await supabase.from('clanek_klicove_slovo').delete().eq('clanek_id', id)
  await saveClanekKeywords(supabase, id, data.klicova_slova)

  revalidatePath(`/dashboard/clanky/${id}/upravit`)
  revalidatePath('/dashboard/clanky')
  return { ok: true }
}

export async function deleteClanekDraft(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nejsi přihlášena.' }

  const { error, count } = await supabase.from('clanek').delete({ count: 'exact' }).eq('id', id)
  if (error) return { error: error.message }
  if (!count) return { error: 'Článek nelze smazat.' }

  revalidatePath('/dashboard/clanky')
  return { ok: true }
}
