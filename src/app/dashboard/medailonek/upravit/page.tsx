import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
        id, jmeno, prijmeni, display_name, bio, kontakt_email, telefon, ico, foto_url, banner_url,
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

  // Fetch linked metody via admin client to include 'navrzena' methods
  const linkedMetodaIds = medailonek.medailonek_metoda.map((m: { metoda_id: number }) => m.metoda_id)
  const { data: linkedMetody } = linkedMetodaIds.length > 0
    ? await createAdminClient().from('metoda').select('id, nazev, ma_ochrannou_znamku').in('id', linkedMetodaIds)
    : { data: [] }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold">Upravit profil</h1>
      <EditForm
        medailonek={medailonek}
        kategorie={kategorie ?? []}
        metody={metody ?? []}
        linkedMetody={linkedMetody ?? []}
        priceLevels={priceLevels ?? []}
        userId={user.id}
      />
    </div>
  )
}
