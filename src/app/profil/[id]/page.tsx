import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ApproveButton } from '@/app/admin/medailonky/approve-button'
import { MetodaApproveButton } from './metoda-approve-button'

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
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  const isAdmin = !!user && adminEmails.includes(user.email?.toLowerCase() ?? '')

  const query = isAdmin ? createAdminClient() : supabase
  const builder = query
    .from('medailonek')
    .select(`
      id, jmeno, prijmeni, display_name, bio, kontakt_email, telefon, ico,
      is_published,
      social_link ( platform, url ),
      medailonek_location ( mesto ( nazev, okres ( nazev, kraj ( nazev ) ) ) ),
      medailonek_metoda ( metoda ( id, nazev, status, ma_ochrannou_znamku ) ),
      service (
        id, nazev, popis, delivery_form, booking_url,
        price_level ( label ),
        service_kategorie ( kategorie ( id, nazev ) ),
        service_klicove_slovo ( klicove_slovo ( slovo ) )
      )
    `)
    .eq('id', id)

  const { data: m } = isAdmin
    ? await builder.maybeSingle()
    : await builder.eq('is_published', true).maybeSingle()

  if (!m) notFound()

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

  const isPublished = (m as any).is_published as boolean

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {isAdmin && !isPublished && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Náhled — profil ještě není zveřejněn.{' '}
              <Link href="/admin/medailonky" className="font-semibold underline hover:no-underline">
                Zpět na admin
              </Link>
            </span>
            <ApproveButton id={id} isPublished={false} />
          </div>
        </div>
      )}
      <Link href={isAdmin && !isPublished ? '/admin/medailonky' : '/katalog'} className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        ← {isAdmin && !isPublished ? 'Zpět na admin' : 'Zpět do katalogu'}
      </Link>

      {/* Hlavička */}
      <div className="flex items-start gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          {mesta.length > 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {mesta.map(m => m.nazev).join(' · ')}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Celá ČR / online</p>
          )}
        </div>
      </div>

      {/* Bio */}
      <p className="mt-6 leading-relaxed text-foreground/80">{m.bio}</p>

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
              <a href={`tel:${m.telefon}`} className="text-sm hover:underline">
                {m.telefon}
              </a>
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

                  {s.popis && <p className="mt-1.5 text-sm text-muted-foreground">{s.popis}</p>}

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
                    <a
                      href={s.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
                    >
                      Rezervovat →
                    </a>
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
    </div>
  )
}
