import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ClanekEditor } from '@/components/clanek/editor/clanek-editor'

export default async function NovyClanekPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/prihlaseni')

  const { data: medailonek } = await supabase
    .from('medailonek')
    .select('id, is_published')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!medailonek) redirect('/dashboard/medailonek/novy')
  if (!medailonek.is_published) redirect('/dashboard/clanky')

  const [{ data: kategorie }, { data: metody }] = await Promise.all([
    supabase.from('kategorie').select('id, nazev').order('nazev'),
    supabase.from('metoda').select('id, nazev, ma_ochrannou_znamku').eq('status', 'aktivni').order('nazev'),
  ])

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/dashboard/clanky" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        ← Zpět na moje články
      </Link>
      <h1 className="mt-3 text-2xl font-bold">Nový článek</h1>
      <div className="mt-6">
        <ClanekEditor
          mode="create"
          userId={user.id}
          kategorie={kategorie ?? []}
          metody={metody ?? []}
        />
      </div>
    </div>
  )
}
