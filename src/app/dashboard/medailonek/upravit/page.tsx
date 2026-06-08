import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EditForm } from './edit-form'

export default async function UpravitPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/prihlaseni')

  const [
    { data: medailonek },
    { data: kategorie },
    { data: metody },
    { data: priceLevels },
  ] = await Promise.all([
    supabase
      .from('medailonek')
      .select(`
        id, jmeno, prijmeni, display_name, bio, kontakt_email, telefon, ico,
        social_link ( platform, url ),
        medailonek_location ( mesto_id, mesto ( id, nazev, okres ( nazev ) ) ),
        medailonek_metoda ( metoda_id ),
        service (
          id, nazev, popis, delivery_form, booking_url, price_level_id,
          service_kategorie ( kategorie_id ),
          service_klicove_slovo ( klicove_slovo ( slovo ) )
        )
      `)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('kategorie').select('id, nazev').order('nazev'),
    supabase.from('metoda').select('id, nazev, ma_ochrannou_znamku').order('nazev'),
    supabase.from('price_level').select('id, label').order('id'),
  ])

  if (!medailonek) redirect('/dashboard')

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold">Upravit profil</h1>
      <EditForm
        medailonek={medailonek}
        kategorie={kategorie ?? []}
        metody={metody ?? []}
        priceLevels={priceLevels ?? []}
      />
    </div>
  )
}
