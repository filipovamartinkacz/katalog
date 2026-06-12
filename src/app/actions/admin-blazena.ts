'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BlazenaConfig } from '@/lib/blazena'

export async function getBlazenaConfig(): Promise<BlazenaConfig | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blazena_config')
    .select('config')
    .single()
  return (data?.config as BlazenaConfig) ?? null
}

export async function saveBlazenaConfig(
  config: BlazenaConfig
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nepřihlášen' }

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  if (!adminEmails.includes(user.email?.toLowerCase() ?? '')) {
    return { error: 'Nedostatečná oprávnění' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('blazena_config')
    .upsert({ id: 1, config, updated_at: new Date().toISOString() })

  return error ? { error: error.message } : {}
}
