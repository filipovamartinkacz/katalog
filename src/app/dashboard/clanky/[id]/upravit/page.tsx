import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ClanekEditor, type ClanekEditorInitial } from '@/components/clanek/editor/clanek-editor'

export default async function UpravitClanekPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/prihlaseni')

  const { data: medailonek } = await supabase
    .from('medailonek')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!medailonek) redirect('/dashboard/clanky')

  const { data: clanek } = await supabase
    .from('clanek')
    .select(`
      id, medailonek_id, typ, kategorie_id, nadpis, slug, obsah, cover_url, cover_alt,
      zdroj_url, je_gated, seo_title, seo_description, status, zamitnuti_duvod, published_at,
      clanek_metoda ( metoda_id ),
      clanek_klicove_slovo ( klicove_slovo ( slovo ) )
    `)
    .eq('id', id)
    .maybeSingle()

  if (!clanek || clanek.medailonek_id !== medailonek.id) notFound()

  const [{ data: kategorie }, { data: metody }] = await Promise.all([
    supabase.from('kategorie').select('id, nazev').order('nazev'),
    supabase.from('metoda').select('id, nazev, ma_ochrannou_znamku').eq('status', 'aktivni').order('nazev'),
  ])

  const klicovaSlova = (clanek.clanek_klicove_slovo as unknown as { klicove_slovo: { slovo: string } | { slovo: string }[] }[])
    .map(k => (Array.isArray(k.klicove_slovo) ? k.klicove_slovo[0] : k.klicove_slovo)?.slovo)
    .filter((s): s is string => Boolean(s))

  const initial: ClanekEditorInitial = {
    id: clanek.id,
    typ: clanek.typ,
    kategorie_id: clanek.kategorie_id,
    nadpis: clanek.nadpis,
    obsah: clanek.obsah,
    cover_url: clanek.cover_url,
    cover_alt: clanek.cover_alt,
    zdroj_url: clanek.zdroj_url ?? '',
    je_gated: clanek.je_gated,
    seo_title: clanek.seo_title ?? '',
    seo_description: clanek.seo_description ?? '',
    metoda_ids: (clanek.clanek_metoda as unknown as { metoda_id: number }[]).map(m => m.metoda_id),
    klicova_slova: klicovaSlova,
    status: clanek.status,
    slug: clanek.slug,
    published_at: clanek.published_at,
    zamitnuti_duvod: clanek.zamitnuti_duvod,
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/dashboard/clanky" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        ← Zpět na moje články
      </Link>
      <h1 className="mt-3 text-2xl font-bold">Upravit článek</h1>
      <div className="mt-6">
        <ClanekEditor
          mode="edit"
          userId={user.id}
          kategorie={kategorie ?? []}
          metody={metody ?? []}
          initial={initial}
          readOnly={clanek.status === 'ceka_na_schvaleni'}
        />
      </div>
    </div>
  )
}
