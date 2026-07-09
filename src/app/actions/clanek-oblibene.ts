'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleOblibene(clanekId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Přihlas se, abys mohla článek uložit.' }

  const { data: existing } = await supabase
    .from('clanek_oblibene')
    .select('clanek_id')
    .eq('user_id', user.id)
    .eq('clanek_id', clanekId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('clanek_oblibene')
      .delete()
      .eq('user_id', user.id)
      .eq('clanek_id', clanekId)
    if (error) return { error: error.message }
    revalidatePath('/moje-oblibene')
    return { ok: true, oblibeno: false }
  }

  const { error } = await supabase.from('clanek_oblibene').insert({ user_id: user.id, clanek_id: clanekId })
  if (error) return { error: error.message }
  revalidatePath('/moje-oblibene')
  return { ok: true, oblibeno: true }
}
