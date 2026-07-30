'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendProfilSchvalen } from '@/lib/email'

function isAdmin(email: string | undefined) {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  return adminEmails.includes(email?.toLowerCase() ?? '')
}

export async function approveMedailonek(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return { error: 'Nemáš oprávnění.' }

  const admin = createAdminClient()

  const { data: med, error } = await admin
    .from('medailonek')
    .update({ is_published: true })
    .eq('id', id)
    .select('jmeno, user_id')
    .single()

  if (error) return { error: error.message }

  // E-mail notifikace odbornici
  const { data: authUser } = await admin.auth.admin.getUserById(med.user_id)
  if (authUser.user?.email) {
    await sendProfilSchvalen({
      to: authUser.user.email,
      jmeno: med.jmeno,
      profilId: id,
    })
  }

  revalidatePath('/admin/medailonky')
  return { ok: true }
}

export async function unpublishMedailonek(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return { error: 'Nemáš oprávnění.' }

  const { error } = await createAdminClient()
    .from('medailonek')
    .update({ is_published: false })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/medailonky')
  return { ok: true }
}

export async function deleteMedailonek(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return { error: 'Nemáš oprávnění.' }

  const { error } = await createAdminClient()
    .from('medailonek')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/medailonky')
  return { ok: true }
}
