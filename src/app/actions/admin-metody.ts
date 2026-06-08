'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

function isAdmin(email: string | undefined) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  return adminEmails.includes(email?.toLowerCase() ?? '')
}

export async function schvalitMetodu(id: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return { error: 'Nemáš oprávnění.' }

  const { error } = await createAdminClient()
    .from('metoda')
    .update({ status: 'aktivni' })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/metody')
  revalidatePath('/profil', 'layout')
  return { ok: true }
}

export async function zamitnoutMetodu(id: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return { error: 'Nemáš oprávnění.' }

  // Smaž napojení na medailonky i samotnou metodu
  const admin = createAdminClient()
  await admin.from('medailonek_metoda').delete().eq('metoda_id', id)
  const { error } = await admin.from('metoda').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/metody')
  return { ok: true }
}

export async function upravitMetodu(id: number, nazev: string, popis: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return { error: 'Nemáš oprávnění.' }

  const { error } = await createAdminClient()
    .from('metoda')
    .update({ nazev: nazev.trim(), popis: popis?.trim() || null, status: 'aktivni' })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/metody')
  return { ok: true }
}
