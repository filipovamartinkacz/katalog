'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { buttonVariants } from '@/components/ui/button'
import { CityPicker, type SelectedMesto } from '../novy/city-picker'
import { updateMedailonek, type ServiceInput, type SocialLinkInput } from '@/app/actions/medailonek'
import { TagInput } from '@/components/ui/tag-input'
import { MetodaPicker } from '@/components/ui/metoda-picker'

type Kategorie = { id: number; nazev: string }
type Metoda = { id: number; nazev: string }
type PriceLevel = { id: number; label: string }

type MedailonekData = {
  jmeno: string
  prijmeni: string
  display_name: string | null
  bio: string
  kontakt_email: string | null
  telefon: string | null
  ico: string | null
  social_link: { platform: string; url: string }[]
  medailonek_location: { mesto_id: number; mesto: { id: number; nazev: string; okres: { nazev: string } }[] | { id: number; nazev: string; okres: { nazev: string } } | null }[]
  medailonek_metoda: { metoda_id: number }[]
  service: {
    id: number
    nazev: string
    popis: string | null
    delivery_form: string
    booking_url: string | null
    price_level_id: number | null
    service_kategorie: { kategorie_id: number }[]
    service_klicove_slovo: { klicove_slovo: { slovo: string } | { slovo: string }[] | null }[]
  }[]
}

type Props = {
  medailonek: MedailonekData
  kategorie: Kategorie[]
  metody: Metoda[]
  priceLevels: PriceLevel[]
}

const SOCIAL_PLATFORMS = [
  { platform: 'web' as const, label: 'Web', placeholder: 'https://vase-stranka.cz' },
  { platform: 'instagram' as const, label: 'Instagram', placeholder: 'https://instagram.com/vase_jmeno' },
  { platform: 'facebook' as const, label: 'Facebook', placeholder: 'https://facebook.com/vase_stranka' },
  { platform: 'linkedin' as const, label: 'LinkedIn', placeholder: 'https://linkedin.com/in/vase-jmeno' },
  { platform: 'tiktok' as const, label: 'TikTok', placeholder: 'https://tiktok.com/@vase_jmeno' },
]

const EMPTY_SERVICE: ServiceInput = {
  nazev: '', popis: '', delivery_form: 'osobne',
  booking_url: '', price_level_id: null, kategorie_ids: [], klicova_slova: [],
}

function getSocialUrl(links: { platform: string; url: string }[], platform: string) {
  return links.find(l => l.platform === platform)?.url ?? ''
}

export function EditForm({ medailonek, kategorie, metody, priceLevels }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // O mně
  const [jmeno, setJmeno] = useState(medailonek.jmeno)
  const [prijmeni, setPrijmeni] = useState(medailonek.prijmeni)
  const [displayName, setDisplayName] = useState(medailonek.display_name ?? '')
  const [bio, setBio] = useState(medailonek.bio)
  const [email, setEmail] = useState(medailonek.kontakt_email ?? '')
  const [telefon, setTelefon] = useState(medailonek.telefon ?? '')
  const [ico, setIco] = useState(medailonek.ico ?? '')

  // Sociální sítě
  const [socials, setSocials] = useState<Record<string, string>>(() =>
    Object.fromEntries(SOCIAL_PLATFORMS.map(p => [p.platform, getSocialUrl(medailonek.social_link, p.platform)]))
  )

  // Lokace
  const [mesta, setMesta] = useState<SelectedMesto[]>(() =>
    medailonek.medailonek_location.flatMap(l => {
      const m = Array.isArray(l.mesto) ? l.mesto[0] : l.mesto
      return m ? [{ id: m.id, nazev: m.nazev, okres: m.okres.nazev }] : []
    })
  )

  // Metody
  const [metodaIds, setMetodaIds] = useState<number[]>(
    medailonek.medailonek_metoda.map(m => m.metoda_id)
  )

  // Služby
  const [services, setServices] = useState<ServiceInput[]>(() =>
    medailonek.service.length > 0
      ? medailonek.service.map(s => ({
          nazev: s.nazev,
          popis: s.popis ?? '',
          delivery_form: s.delivery_form as ServiceInput['delivery_form'],
          booking_url: s.booking_url ?? '',
          price_level_id: s.price_level_id,
          kategorie_ids: s.service_kategorie.map(k => k.kategorie_id),
          klicova_slova: s.service_klicove_slovo.flatMap(sk => {
            const kw = Array.isArray(sk.klicove_slovo) ? sk.klicove_slovo[0] : sk.klicove_slovo
            return kw ? [kw.slovo] : []
          }),
        }))
      : [{ ...EMPTY_SERVICE }]
  )

  function updateService(idx: number, patch: Partial<ServiceInput>) {
    setServices(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  function toggleKategorie(svcIdx: number, katId: number) {
    const ids = services[svcIdx].kategorie_ids
    updateService(svcIdx, {
      kategorie_ids: ids.includes(katId) ? ids.filter(i => i !== katId) : [...ids, katId]
    })
  }

  function toggleMetoda(id: number) {
    setMetodaIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  async function handleSubmit() {
    if (!jmeno.trim() || !prijmeni.trim()) { setError('Jméno a příjmení jsou povinné.'); return }
    if (bio.trim().length < 30) { setError('Bio musí mít alespoň 30 znaků.'); return }
    if (!services.every(s => s.nazev.trim() && s.kategorie_ids.length > 0)) {
      setError('Každá služba musí mít název a alespoň jednu kategorii.')
      return
    }

    setSaving(true)
    setError(null)

    const socialLinks: SocialLinkInput[] = SOCIAL_PLATFORMS
      .map(p => ({ platform: p.platform, url: socials[p.platform] ?? '' }))
      .filter(l => l.url.trim())

    const result = await updateMedailonek({
      jmeno, prijmeni, display_name: displayName,
      bio, kontakt_email: email, telefon, ico,
      mesto_ids: mesta.map(m => m.id),
      metoda_ids: metodaIds,
      services,
      social_links: socialLinks,
    })

    if (result?.error) { setError(result.error); setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-10">

      {/* O mně */}
      <section className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold border-b border-border pb-2">O mně</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="jmeno">Jméno *</Label>
            <Input id="jmeno" value={jmeno} onChange={e => setJmeno(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prijmeni">Příjmení *</Label>
            <Input id="prijmeni" value={prijmeni} onChange={e => setPrijmeni(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="display_name">Jak vás zákaznice oslovují <span className="text-muted-foreground">(nepovinné)</span></Label>
          <Input id="display_name" placeholder="např. Mgr. Jana Nováková nebo Jana" value={displayName} onChange={e => setDisplayName(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bio">O sobě *</Label>
          <Textarea id="bio" rows={5} value={bio} onChange={e => setBio(e.target.value)} />
          <p className="text-xs text-muted-foreground">{bio.trim().length} / min. 30 znaků</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Kontaktní e-mail <span className="text-muted-foreground">(nepovinný)</span></Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telefon">Telefon <span className="text-muted-foreground">(nepovinný)</span></Label>
            <Input id="telefon" type="tel" value={telefon} onChange={e => setTelefon(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ico">IČO <span className="text-muted-foreground">(nepovinné)</span></Label>
          <Input id="ico" className="max-w-xs" value={ico} onChange={e => setIco(e.target.value)} />
        </div>

        <div className="flex flex-col gap-3">
          <Label>Online přítomnost <span className="text-muted-foreground">(nepovinné)</span></Label>
          <div className="flex flex-col gap-2">
            {SOCIAL_PLATFORMS.map(({ platform, label, placeholder }) => (
              <div key={platform} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm text-muted-foreground">{label}</span>
                <Input
                  type="url"
                  placeholder={placeholder}
                  value={socials[platform] ?? ''}
                  onChange={e => setSocials(prev => ({ ...prev, [platform]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kde působím */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold border-b border-border pb-2">Kde působím</h2>
        <p className="text-sm text-muted-foreground">
          Pokud nepřidáš žádnou lokaci, bude profil zobrazený jako <strong>celá ČR / pouze online</strong>.
        </p>
        <CityPicker value={mesta} onChange={setMesta} />
      </section>

      {/* Co nabízím */}
      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold border-b border-border pb-2">Co nabízím</h2>

        <div className="flex flex-col gap-4">
          <h3 className="font-medium">Služby</h3>
          {services.map((svc, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Služba {idx + 1}</span>
                {services.length > 1 && (
                  <button type="button" onClick={() => setServices(prev => prev.filter((_, i) => i !== idx))}
                    className="text-xs text-muted-foreground hover:text-destructive">
                    Odebrat
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Název služby *</Label>
                <Input value={svc.nazev} onChange={e => updateService(idx, { nazev: e.target.value })} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Popis <span className="text-muted-foreground">(nepovinný)</span></Label>
                <Textarea rows={3} value={svc.popis} onChange={e => updateService(idx, { popis: e.target.value })} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Forma</Label>
                <div className="flex gap-4 flex-wrap">
                  {([['osobne', 'Osobně'], ['online', 'Online'], ['oboji', 'Osobně i online']] as const).map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name={`delivery-${idx}`} value={val} checked={svc.delivery_form === val}
                        onChange={() => updateService(idx, { delivery_form: val })} />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Cenová hladina <span className="text-muted-foreground">(nepovinná)</span></Label>
                <div className="flex gap-2 flex-wrap">
                  {priceLevels.map(pl => (
                    <button key={pl.id} type="button"
                      onClick={() => updateService(idx, { price_level_id: svc.price_level_id === pl.id ? null : pl.id })}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        svc.price_level_id === pl.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/40'
                      }`}>
                      {pl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Kategorie * <span className="text-muted-foreground text-xs">(alespoň 1)</span></Label>
                <div className="flex flex-wrap gap-2">
                  {kategorie.map(k => (
                    <button key={k.id} type="button"
                      onClick={() => toggleKategorie(idx, k.id)}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        svc.kategorie_ids.includes(k.id)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/40'
                      }`}>
                      {k.nazev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Klíčová slova <span className="text-muted-foreground text-xs">(nepovinná — oddělte Enterem nebo čárkou)</span></Label>
                <TagInput
                  value={svc.klicova_slova}
                  onChange={tags => updateService(idx, { klicova_slova: tags })}
                  placeholder="relaxace, úleva od bolesti…"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Odkaz na rezervaci <span className="text-muted-foreground">(nepovinný)</span></Label>
                <Input type="url" value={svc.booking_url} onChange={e => updateService(idx, { booking_url: e.target.value })} placeholder="https://" />
              </div>
            </div>
          ))}

          <button type="button" onClick={() => setServices(prev => [...prev, { ...EMPTY_SERVICE }])}
            className={buttonVariants({ variant: 'outline' }) + ' self-start'}>
            + Přidat další službu
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-medium">Metody <span className="text-sm text-muted-foreground font-normal">(nepovinné)</span></h3>
          <MetodaPicker metody={metody} value={metodaIds} onChange={setMetodaIds} />
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <a href="/dashboard" className={buttonVariants({ variant: 'outline' })}>Zrušit</a>
        <button type="button" disabled={saving} onClick={handleSubmit}
          className={buttonVariants() + ' disabled:opacity-50'}>
          {saving ? 'Ukládám…' : 'Uložit změny'}
        </button>
      </div>
    </div>
  )
}
