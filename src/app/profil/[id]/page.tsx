import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle } from 'lucide-react'
import { ApproveButton } from '@/app/admin/medailonky/approve-button'
import { MetodaApproveButton } from './metoda-approve-button'
import { ClanekCard, type ClanekCardData } from '@/app/blog/clanek-card'
import { CtaRezervace } from './cta-rezervace'
import { TrackedLink } from './tracked-link'
import { toWhatsAppUrl } from '@/lib/whatsapp'
import { Breadcrumb } from '@/components/layout/breadcrumb'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const PLATFORM_LABELS: Record<string, string> = {
  web: 'Web',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  jine: 'Odkaz',
}

const DELIVERY_LABELS: Record<string, string> = {
  osobne: 'Osobně',
  online: 'Online',
  oboji: 'Osobně i online',
}

type Props = { params: Promise<{ id: string }> }

export default async function ProfilPage({ params }: Props) {
  const { id: param } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  const isAdmin = !!user && adminEmails.includes(user.email?.toLowerCase() ?? '')

  // Starý UUID odkaz → přesměruj na slug URL
  const isUuid = UUID_RE.test(param)
  if (isUuid) {
    const { data: row } = await admin.from('medailonek').select('slug').eq('id', param).maybeSingle()
    if (row?.slug) redirect(`/profil/${row.slug}`)
  }

  const { data: m } = await admin
    .from('medailonek')
    .select(`
      id, user_id, jmeno, prijmeni, display_name, bio, kontakt_email, telefon, ico,
      foto_url, banner_url, is_published, user_confirmed, rezervace_url,
      social_link ( platform, url ),
      medailonek_location ( mesto ( nazev, okres ( nazev, kraj ( nazev ) ) ) ),
      medailonek_metoda ( metoda ( id, nazev, status, ma_ochrannou_znamku ) ),
      clanek ( id, slug, nadpis, cover_url, typ, published_at, status, kategorie:kategorie_id ( nazev ) ),
      service (
        id, nazev, popis, delivery_form, booking_url,
        price_level ( label ),
        service_kategorie ( kategorie ( id, nazev ) ),
        service_klicove_slovo ( klicove_slovo ( slovo ) )
      )
    `)
    .eq(isUuid ? 'id' : 'slug', param)
    .maybeSingle()

  if (!m) notFound()

  const isPublished = (m as any).is_published as boolean
  const userConfirmed = (m as any).user_confirmed as boolean
  const isVisible = isPublished && userConfirmed
  const isOwner = !!user && (m as any).user_id === user.id

  // Neviditelný profil (nezveřejněný nebo s nepotvrzeným účtem) vidí jen admin nebo vlastník
  if (!isVisible && !isAdmin && !isOwner) notFound()

  const name = m.display_name || `${m.jmeno} ${m.prijmeni}`
  const initials = `${m.jmeno[0] ?? ''}${m.prijmeni[0] ?? ''}`.toUpperCase()

  const mesta = (m.medailonek_location as any[]).flatMap((l: any) => {
    const mesto = Array.isArray(l.mesto) ? l.mesto[0] : l.mesto
    return mesto ? [{ nazev: mesto.nazev, okres: mesto.okres?.nazev }] : []
  })

  const metody = (m.medailonek_metoda as any[]).flatMap((mm: any) => {
    const met = Array.isArray(mm.metoda) ? mm.metoda[0] : mm.metoda
    return met ? [{ id: met.id as number, nazev: met.nazev as string, status: met.status as string, ochrannaZnamka: met.ma_ochrannou_znamku as boolean }] : []
  })

  const fotoUrl = (m as any).foto_url as string | null
  const bannerUrl = (m as any).banner_url as string | null

  type ClanekRelace = {
    id: string
    slug: string
    nadpis: string
    cover_url: string
    typ: 'blog' | 'podcast' | 'video'
    published_at: string | null
    status: string
    kategorie: { nazev: string } | { nazev: string }[] | null
  }

  const clanky: ClanekCardData[] = (m.clanek as ClanekRelace[])
    .filter(c => c.status === 'publikovano')
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
    .map(c => ({
      ...c,
      kategorie: Array.isArray(c.kategorie) ? c.kategorie[0] : c.kategorie,
      autorka: { jmeno: m.jmeno, prijmeni: m.prijmeni },
    }))

  return (
    <div className="mx-auto max-w-3xl">
      {!isVisible && (
        <div className="px-4 pt-4 sm:px-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>
                {isPublished && !userConfirmed
                  ? 'Náhled — profil je schválený, ale zveřejní se, až si odbornice potvrdí účet.'
                  : 'Náhled — profil ještě není zveřejněn.'}{' '}
                {isAdmin && (
                  <Link href="/admin/medailonky" className="font-semibold underline hover:no-underline">
                    Zpět na admin
                  </Link>
                )}
                {isOwner && !isAdmin && (
                  <Link href="/dashboard" className="font-semibold underline hover:no-underline">
                    Zpět na dashboard
                  </Link>
                )}
              </span>
              {isAdmin && <ApproveButton id={m.id} isPublished={isPublished} />}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pt-4 sm:px-6">
        {!isVisible && (isAdmin || isOwner) ? (
          <Link
            href={isAdmin ? '/admin/medailonky' : '/dashboard'}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← {isAdmin ? 'Zpět na admin' : 'Zpět na dashboard'}
          </Link>
        ) : (
          <Breadcrumb items={[{ label: 'Domů', href: '/' }, { label: 'Katalog', href: '/katalog' }, { label: name }]} />
        )}
      </div>

      {/* Banner + avatar */}
      <div className="relative mt-3 px-4 sm:px-6">
        <div className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-background to-accent/20 sm:h-48">
          {bannerUrl && (
            <Image src={bannerUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
          )}
        </div>
        <div className="absolute bottom-0 left-9 translate-y-1/2 sm:left-11">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-background bg-primary/10">
            {fotoUrl ? (
              <Image src={fotoUrl} alt={name} fill className="object-cover" sizes="80px" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-primary">
                {initials}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-10 sm:px-6">
        {/* Jméno a lokace — s odsazením kvůli přesahujícímu avataru */}
        <div className="mt-14">
          <h1 className="text-2xl font-bold">{name}</h1>
          {mesta.length > 0 ? (
            <p className="mt-1 text-sm text-foreground">
              {mesta.map(m => m.nazev).join(' · ')}
            </p>
          ) : (
            <p className="mt-1 text-sm text-foreground">Celá ČR / online</p>
          )}
        </div>

      {/* Bio */}
      <p className="mt-6 leading-relaxed text-foreground/80">{m.bio}</p>

      {/* Rychlý kontakt */}
      {isVisible && (
        <div className="mt-6">
          <CtaRezervace
            medailonekId={m.id}
            rezervaceUrl={(m as unknown as { rezervace_url: string | null }).rezervace_url ?? null}
            services={(m.service as any[]).map(s => ({ id: s.id as number, nazev: s.nazev as string }))}
            prefill={{
              jmeno: (user?.user_metadata?.full_name as string | undefined) ?? (user?.user_metadata?.jmeno as string | undefined) ?? '',
              email: user?.email ?? '',
              telefon: (user?.user_metadata?.telefon as string | undefined) ?? '',
            }}
            isLoggedIn={!!user}
          />
        </div>
      )}

      {/* Kontakt */}
      {(m.kontakt_email || m.telefon || (m.social_link as any[]).length > 0) && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Kontakt</h2>
          <div className="flex flex-col gap-2">
            {m.kontakt_email && (
              <a href={`mailto:${m.kontakt_email}`} className="text-sm text-primary hover:underline">
                {m.kontakt_email}
              </a>
            )}
            {m.telefon && (
              <div className="flex items-center gap-2">
                <a href={`tel:${m.telefon}`} className="text-sm hover:underline">
                  {m.telefon}
                </a>
                {toWhatsAppUrl(m.telefon) && (
                  <a
                    href={toWhatsAppUrl(m.telefon)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
            {(m.social_link as any[]).length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2">
                {(m.social_link as any[]).map((l: any, i: number) => (
                  <a
                    key={i}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:border-primary hover:text-primary transition-colors"
                  >
                    {PLATFORM_LABELS[l.platform] ?? l.platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Služby */}
      {(m.service as any[]).length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Nabízené služby</h2>
          <div className="flex flex-col gap-4">
            {(m.service as any[]).map((s: any) => {
              const kategorie: string[] = s.service_kategorie.flatMap((sk: any) => {
                const k = Array.isArray(sk.kategorie) ? sk.kategorie[0] : sk.kategorie
                return k ? [k.nazev as string] : []
              })
              const priceLevel = Array.isArray(s.price_level) ? s.price_level[0] : s.price_level

              return (
                <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{s.nazev}</h3>
                    <div className="flex shrink-0 items-center gap-2">
                      {priceLevel && (
                        <span className="text-sm font-medium text-muted-foreground">{priceLevel.label}</span>
                      )}
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                        {DELIVERY_LABELS[s.delivery_form] ?? s.delivery_form}
                      </span>
                    </div>
                  </div>

                  {s.popis && <p className="mt-1.5 text-sm text-foreground">{s.popis}</p>}

                  {kategorie.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {kategorie.map(k => (
                        <span key={k} className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}

                  {(s.service_klicove_slovo as any[]).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(s.service_klicove_slovo as any[]).map((sk: any) => {
                        const kw = Array.isArray(sk.klicove_slovo) ? sk.klicove_slovo[0] : sk.klicove_slovo
                        return kw ? (
                          <span key={kw.slovo} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {kw.slovo}
                          </span>
                        ) : null
                      })}
                    </div>
                  )}

                  {s.booking_url && (
                    <TrackedLink
                      href={s.booking_url}
                      medailonekId={m.id}
                      serviceId={s.id}
                      className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
                    >
                      Rezervovat →
                    </TrackedLink>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Metody */}
      {metody.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Metody a přístupy</h2>
          <div className="flex flex-wrap gap-2">
            {metody.map(met => (
              <span
                key={met.id}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm ${
                  met.status === 'navrzena'
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-border'
                }`}
              >
                {met.nazev}{met.ochrannaZnamka && <sup className="ml-0.5 text-xs">®</sup>}
                {isAdmin && met.status === 'navrzena' && (
                  <MetodaApproveButton id={met.id} />
                )}
              </span>
            ))}
          </div>
          {isAdmin && metody.some(m => m.status === 'navrzena') && (
            <p className="mt-2 text-xs text-amber-700">Amber = čeká na schválení</p>
          )}
        </div>
      )}

      {/* Její články */}
      {clanky.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Články</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {clanky.map(c => (
              <ClanekCard key={c.id} clanek={c} />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
