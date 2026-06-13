import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MedailonekWizard } from './wizard'

export default async function NovyMedailonekPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/prihlaseni')

  // Zkontroluj, zda medailonek ještě neexistuje
  const { data: existing } = await supabase
    .from('medailonek')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) redirect('/dashboard')

  const [{ data: kategorie }, { data: metody }, { data: priceLevels }] = await Promise.all([
    supabase.from('kategorie').select('id, nazev').order('poradi'),
    supabase.from('metoda').select('id, nazev, ma_ochrannou_znamku').eq('status', 'aktivni').order('nazev'),
    supabase.from('price_level').select('id, label').order('id'),
  ])

  return (
    <MedailonekWizard
      kategorie={kategorie ?? []}
      metody={metody ?? []}
      priceLevels={priceLevels ?? []}
      userId={user.id}
    />
  )
}
