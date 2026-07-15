import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderClanekHtml } from '@/lib/clanek/render'
import { resolveInternalLinks } from '@/lib/clanek/resolve-links'
import { truncateContentByWords, countTotalWords } from '@/lib/clanek/gate'
import { buttonVariants } from '@/components/ui/button'
import { FavoriteButton } from '@/components/clanek/favorite-button'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { ViewTracker } from '@/components/clanek/view-tracker'
import { Rss, Mic, Video } from 'lucide-react'

const GATE_WORD_LIMIT = Number(process.env.GATE_WORD_LIMIT ?? 300)

const TYP_LABEL: Record<string, string> = { blog: 'Článek', podcast: 'Podcast', video: 'Video' }
const TYP_ICON = { blog: Rss, podcast: Mic, video: Video }

type Props = { params: Promise<{ slug: string }> }

const getClanekBySlug = cache(async (slug: string) => {
  const admin = createAdminClient()
  const { data } = await admin
    .from('clanek')
    .select(`
      id, nadpis, slug, typ, obsah, cover_url, cover_alt, zdroj_url, je_gated,
      seo_title, seo_description, status, published_at, view_count,
      medailonek:medailonek_id ( id, user_id, jmeno, prijmeni, slug, bio, foto_url ),
      kategorie:kategorie_id ( nazev, slug ),
      clanek_metoda ( metoda ( id, nazev, ma_ochrannou_znamku ) ),
      clanek_klicove_slovo ( klicove_slovo ( slovo ) )
    `)
    .eq('slug', slug)
    .maybeSingle()
  return data
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const clanek = await getClanekBySlug(slug)
  if (!clanek || clanek.status !== 'publikovano') return {}

  const title = clanek.seo_title || clanek.nadpis
  const description = clanek.seo_description || undefined
  const keywords = (clanek.clanek_klicove_slovo as unknown as { klicove_slovo: { slovo: string } | { slovo: string }[] }[])
    .map(k => (Array.isArray(k.klicove_slovo) ? k.klicove_slovo[0] : k.klicove_slovo)?.slovo)
    .filter((s): s is string => Boolean(s))

  return {
    title,
    description,
    keywords: keywords.length ? keywords : undefined,
    alternates: { canonical: `/blog/${clanek.slug}` },
    openGraph: {
      type: 'article',
      title,
      description,
      publishedTime: clanek.published_at ?? undefined,
      images: clanek.cover_url ? [clanek.cover_url] : undefined,
    },
  }
}

export default async function ClanekPage({ params }: Props) {
  const { slug } = await params
  const clanek = await getClanekBySlug(slug)
  if (!clanek) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  const isAdmin = !!user && adminEmails.includes(user.email?.toLowerCase() ?? '')

  const autorka = Array.isArray(clanek.medailonek) ? clanek.medailonek[0] : clanek.medailonek
  const isPublished = clanek.status === 'publikovano'
  const isOwner = !!user && autorka?.user_id === user.id

  if (!isPublished && !isAdmin && !isOwner) notFound()

  const kategorie = Array.isArray(clanek.kategorie) ? clanek.kategorie[0] : clanek.kategorie
  const metody = (clanek.clanek_metoda as unknown as { metoda: { id: number; nazev: string; ma_ochrannou_znamku?: boolean } | { id: number; nazev: string; ma_ochrannou_znamku?: boolean }[] }[])
    .flatMap(cm => {
      const m = Array.isArray(cm.metoda) ? cm.metoda[0] : cm.metoda
      return m ? [m] : []
    })

  let oblibeno = false
  if (user) {
    const { data } = await supabase
      .from('clanek_oblibene')
      .select('clanek_id')
      .eq('user_id', user.id)
      .eq('clanek_id', clanek.id)
      .maybeSingle()
    oblibeno = !!data
  }

  const resolved = await resolveInternalLinks(clanek.obsah, supabase)
  const totalWords = countTotalWords(resolved)
  const isGatedForReader = clanek.je_gated && !user
  const { truncated, wasTruncated } = isGatedForReader
    ? truncateContentByWords(resolved, GATE_WORD_LIMIT)
    : { truncated: resolved, wasTruncated: false }

  const html = renderClanekHtml(truncated)
  const readingMinutes = Math.max(1, Math.ceil(totalWords / 200))

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: clanek.nadpis,
            image: clanek.cover_url ? [clanek.cover_url] : undefined,
            datePublished: clanek.published_at ?? undefined,
            author: autorka ? { '@type': 'Person', name: `${autorka.jmeno} ${autorka.prijmeni}` } : undefined,
          }),
        }}
      />

      {!isPublished && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Náhled — článek ještě není zveřejněný.{' '}
          {isAdmin && <Link href="/admin/clanky" className="font-semibold underline hover:no-underline">Zpět na admin</Link>}
          {isOwner && !isAdmin && <Link href="/dashboard/clanky" className="font-semibold underline hover:no-underline">Zpět na moje články</Link>}
        </div>
      )}

      <Breadcrumb items={[
        { label: 'Domů', href: '/' },
        { label: 'Blog', href: '/blog' },
        kategorie ? { label: kategorie.nazev, href: `/blog?kat=${kategorie.slug}` } : { label: clanek.nadpis },
      ]} />

      <div className="relative mt-4 h-56 w-full overflow-hidden rounded-2xl bg-muted sm:h-72">
        <Image src={clanek.cover_url} alt={clanek.cover_alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" priority />
        {(() => {
          const Icon = TYP_ICON[clanek.typ as keyof typeof TYP_ICON]
          return (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">
              {Icon && <Icon className="h-3.5 w-3.5" />} {TYP_LABEL[clanek.typ] ?? clanek.typ}
            </span>
          )
        })()}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
        {metody.map(m => (
          <span key={m.id} className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">
            {m.nazev}{m.ma_ochrannou_znamku && <sup>®</sup>}
          </span>
        ))}
      </div>

      <h1 className="mt-3 text-3xl font-bold">{clanek.nadpis}</h1>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5 text-sm text-foreground">
        <div className="flex flex-wrap items-center gap-2">
          {autorka && (
            <Link href={`/profil/${autorka.slug ?? autorka.id}`} className="font-medium text-foreground hover:underline">
              {autorka.jmeno} {autorka.prijmeni}
            </Link>
          )}
          {clanek.published_at && <span>· {new Date(clanek.published_at).toLocaleDateString('cs-CZ')}</span>}
          <span>· {readingMinutes} min čtení</span>
          <span>· {clanek.view_count} zobrazení</span>
        </div>
        <FavoriteButton clanekId={clanek.id} initialOblibeno={oblibeno} loggedIn={!!user} />
      </div>

      {clanek.zdroj_url && (
        <p className="mt-4 text-xs text-foreground">
          Zdroj:{' '}
          <a href={clanek.zdroj_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {clanek.zdroj_url}
          </a>
        </p>
      )}

      <div className="clanek-body mt-6" dangerouslySetInnerHTML={{ __html: html }} />

      {wasTruncated && (
        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
          <p className="font-medium">Zbytek článku je jen pro přihlášené čtenářky.</p>
          <Link
            href={`/prihlaseni?redirect=${encodeURIComponent(`/blog/${clanek.slug}`)}`}
            className={buttonVariants() + ' mt-3'}
          >
            Přihlásit se a číst dál
          </Link>
        </div>
      )}

      {autorka && (
        <div className="mt-10 flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-primary/10">
            {autorka.foto_url ? (
              <Image src={autorka.foto_url} alt={`${autorka.jmeno} ${autorka.prijmeni}`} fill className="object-cover" sizes="64px" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-primary">
                {`${autorka.jmeno[0] ?? ''}${autorka.prijmeni[0] ?? ''}`.toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">O autorce</p>
            <Link href={`/profil/${autorka.slug ?? autorka.id}`} className="font-semibold hover:underline">
              {autorka.jmeno} {autorka.prijmeni}
            </Link>
            {autorka.bio && <p className="mt-1.5 line-clamp-3 text-sm text-foreground">{autorka.bio}</p>}
            <Link href={`/profil/${autorka.slug ?? autorka.id}`} className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
              Zobrazit profil →
            </Link>
          </div>
        </div>
      )}

      {isPublished && <ViewTracker clanekId={clanek.id} />}
    </div>
  )
}
