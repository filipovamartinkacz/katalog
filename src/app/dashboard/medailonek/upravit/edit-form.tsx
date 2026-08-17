'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { buttonVariants } from '@/components/ui/button'
import { CityPicker, type SelectedMesto } from '../novy/city-picker'
import { updateMedailonek, type ServiceInput, type SocialLinkInput } from '@/app/actions/medailonek'
import { TagInput } from '@/components/ui/tag-input'
import { MetodaPicker, type SelectedMetoda } from '@/components/ui/metoda-picker'
import { ImageUpload } from '@/components/ui/image-upload'
import { FilterChip } from '@/components/ui/filter-chip'
import { cn } from '@/lib/utils'
import { Coins } from 'lucide-react'

type Kategorie = { id: number; nazev: string }
type Metoda = { id: number; nazev: string; ma_ochrannou_znamku?: boolean }
type PriceLevel = { id: number; label: string }

type MedailonekData = {
  jmeno: string
  prijmeni: string
  display_name: string | null
  bio: string
  kontakt_email: string | null
  telefon: string | null
  ico: string | null
  rezervace_url: string | null
  foto_url: string | null
  banner_url: string | null
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
  linkedMetody: Metoda[]
  priceLevels: PriceLevel[]
  userId: string
}

const SOCIAL_PLATFORMS = [
  { platform: 'web' as const, label: 'Web', placeholder: 'https://vase-stranka.cz' },
  { platform: 'instagram' as const, label: 'Instagram', placeholder: 'https://instagram.com/vase_jmeno' },
  { platform: 'facebook' as const, label: 'Facebook', placeholder: 'https://facebook.com/vase_stranka' },
  { platform: 'linkedin' as const, label: 'LinkedIn', placeholder: 'https://linkedin.com/in/vase-jmeno' },
  { platform: 'tiktok' as const, label: 'TikTok', placeholder: 'https://tiktok.com/@vase_jmeno' },
]

type Invalid =
  | { field: 'jmeno' | 'prijmeni' | 'bio' }
  | { field: 'service'; idx: number; sub: 'nazev' | 'kategorie' }
  | null

const EMPTY_SERVICE: ServiceInput = {
  nazev: '', popis: '', delivery_form: 'osobne',
  booking_url: '', price_level_id: null, kategorie_ids: [], klicova_slova: [],
}

// Počet mincí podle délky uloženého labelu ('€'..'€€€€' = 1-4 úrovně)
const PRICE_LEVEL_HINTS = ['řádově stokoruny', 'řádově tisíce korun', 'řádově desetitisíce korun', 'řádově statisíce korun']

function getSocialUrl(links: { platform: string; url: string }[], platform: string) {
  return links.find(l => l.platform === platform)?.url ?? ''
}

export function EditForm({ medailonek, kategorie, metody, linkedMetody, priceLevels, userId }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invalid, setInvalid] = useState<Invalid>(null)

  // Fotky
  const [fotoUrl, setFotoUrl] = useState<string | null>(medailonek.foto_url ?? null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(medailonek.banner_url ?? null)

  // O mně
  const [jmeno, setJmeno] = useState(medailonek.jmeno)
  const [prijmeni, setPrijmeni] = useState(medailonek.prijmeni)
  const [displayName, setDisplayName] = useState(medailonek.display_name ?? '')
  const [bio, setBio] = useState(medailonek.bio)
  const [email, setEmail] = useState(medailonek.kontakt_email ?? '')
  const [telefon, setTelefon] = useState(medailonek.telefon ?? '')
  const [ico, setIco] = useState(medailonek.ico ?? '')
  const [rezervaceUrl, setRezervaceUrl] = useState(medailonek.rezervace_url ?? '')

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
  const [selectedMetody, setSelectedMetody] = useState<SelectedMetoda[]>(
    medailonek.medailonek_metoda.map(m => {
      const found = linkedMetody.find(mt => mt.id === m.metoda_id)
      return found
        ? { type: 'existing' as const, id: found.id, nazev: found.nazev, ma_ochrannou_znamku: found.ma_ochrannou_znamku ?? false }
        : { type: 'existing' as const, id: m.metoda_id, nazev: String(m.metoda_id) }
    })
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


  async function handleSubmit() {
    setError(null)
    setInvalid(null)

    if (!jmeno.trim()) { setError('Jméno a příjmení jsou povinné.'); setInvalid({ field: 'jmeno' }); return }
    if (!prijmeni.trim()) { setError('Jméno a příjmení jsou povinné.'); setInvalid({ field: 'prijmeni' }); return }
    if (bio.trim().length < 30) { setError('Bio musí mít alespoň 30 znaků.'); setInvalid({ field: 'bio' }); return }
    for (let i = 0; i < services.length; i++) {
      const s = services[i]
      if (!s.nazev.trim()) {
        setError('Každá služba musí mít název a alespoň jednu kategorii.')
        setInvalid({ field: 'service', idx: i, sub: 'nazev' })
        return
      }
      if (s.kategorie_ids.length === 0) {
        setError('Každá služba musí mít název a alespoň jednu kategorii.')
        setInvalid({ field: 'service', idx: i, sub: 'kategorie' })
        return
      }
    }

    setSaving(true)

    const socialLinks: SocialLinkInput[] = SOCIAL_PLATFORMS
      .map(p => ({ platform: p.platform, url: socials[p.platform] ?? '' }))
      .filter(l => l.url.trim())

    const result = await updateMedailonek({
      jmeno, prijmeni, display_name: displayName,
      bio, kontakt_email: email, telefon, ico, rezervace_url: rezervaceUrl,
      mesto_ids: mesta.map(m => m.id),
      metoda_ids: selectedMetody.filter(m => m.type === 'existing').map(m => (m as { type: 'existing'; id: number; nazev: string }).id),
      nove_metody: selectedMetody.filter(m => m.type === 'new').map(m => m.nazev),
      services,
      social_links: socialLinks,
      foto_url: fotoUrl,
      banner_url: bannerUrl,
    })

    if (result?.error) { setError(result.error); setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-10">

      {/* Fotky */}
      <section className="flex flex-col gap-5">
        <h2 className="text-lg font-sans font-semibold border-b border-border pb-2">Fotky</h2>
        <ImageUpload
          value={bannerUrl}
          onChange={setBannerUrl}
          userId={userId}
          fileKey="banner"
          aspect="banner"
          label="Banner (záhlaví profilu)"
        />
        <ImageUpload
          value={fotoUrl}
          onChange={setFotoUrl}
          userId={userId}
          fileKey="foto"
          aspect="avatar"
          label="Profilová fotka"
        />
      </section>

      {/* O mně */}
      <section className="flex flex-col gap-5">
        <h2 className="text-lg font-sans font-semibold border-b border-border pb-2">O mně</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="jmeno">Jméno *</Label>
            <Input id="jmeno" value={jmeno} onChange={e => setJmeno(e.target.value)} aria-invalid={invalid?.field === 'jmeno'} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prijmeni">Příjmení *</Label>
            <Input id="prijmeni" value={prijmeni} onChange={e => setPrijmeni(e.target.value)} aria-invalid={invalid?.field === 'prijmeni'} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="display_name">Název v katalogu (nepovinné)</Label>
          <Input id="display_name" placeholder="necháš prázdné → použije se jméno a příjmení" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          <p className="text-sm md:text-xs font-medium text-accent">
            V katalogu se bude tvůj medailonek zobrazovat jako: <span className="text-foreground">{displayName.trim() || `${jmeno} ${prijmeni}`.trim() || '…'}</span>
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bio">O sobě *</Label>
          <Textarea id="bio" className="leading-snug" rows={5} value={bio} onChange={e => setBio(e.target.value)} aria-invalid={invalid?.field === 'bio'} />
          <p className="text-sm md:text-xs font-medium text-accent">{bio.trim().length} / min. 30 znaků</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Kontaktní e-mail</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telefon">Telefon</Label>
            <Input id="telefon" type="tel" value={telefon} onChange={e => setTelefon(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ico">IČO</Label>
            <Input id="ico" value={ico} onChange={e => setIco(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rezervace_url">Hlavní rezervační odkaz</Label>
          <Input
            id="rezervace_url"
            type="url"
            placeholder="https://…"
            value={rezervaceUrl}
            onChange={e => setRezervaceUrl(e.target.value)}
          />
          <p className="text-sm md:text-xs font-medium text-accent">
            Pokud ho vyplníš, na profilu se místo poptávkového formuláře zobrazí tlačítko vedoucí rovnou na tvůj rezervační systém.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Label>Online přítomnost</Label>
          <div className="flex flex-col gap-2">
            {SOCIAL_PLATFORMS.map(({ platform, label, placeholder }) => (
              <div key={platform} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-base md:text-sm text-foreground">{label}</span>
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
        <h2 className="text-lg font-sans font-semibold border-b border-border pb-2">Kde působím</h2>
        <p className="text-sm md:text-xs font-medium text-accent">
          Pokud nepřidáš žádnou lokaci, bude profil zobrazený jako <strong>celá ČR / pouze online</strong>.
        </p>
        <CityPicker value={mesta} onChange={setMesta} />
      </section>

      {/* Co nabízím */}
      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-sans font-semibold border-b border-border pb-2">Co nabízím</h2>

        <div className="flex flex-col gap-4">
          <h3 className="font-sans font-semibold">Služby</h3>
          {services.map((svc, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Služba {idx + 1}</span>
                {services.length > 1 && (
                  <button type="button" onClick={() => setServices(prev => prev.filter((_, i) => i !== idx))}
                    className="text-xs text-foreground hover:text-destructive">
                    Odebrat
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Název služby *</Label>
                <Input
                  value={svc.nazev}
                  onChange={e => updateService(idx, { nazev: e.target.value })}
                  aria-invalid={invalid?.field === 'service' && invalid.idx === idx && invalid.sub === 'nazev'}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Popis</Label>
                <Textarea className="leading-snug" rows={3} value={svc.popis} onChange={e => updateService(idx, { popis: e.target.value })} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Forma</Label>
                <div className="flex gap-2 flex-wrap">
                  {([['osobne', 'Osobně'], ['online', 'Online'], ['oboji', 'Osobně i online']] as const).map(([val, label]) => (
                    <FilterChip key={val} selected={svc.delivery_form === val} onClick={() => updateService(idx, { delivery_form: val })}>
                      {label}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Cenová hladina</Label>
                <div className="flex gap-2 flex-wrap">
                  {priceLevels.map(pl => (
                    <FilterChip
                      key={pl.id}
                      selected={svc.price_level_id === pl.id}
                      onClick={() => updateService(idx, { price_level_id: svc.price_level_id === pl.id ? null : pl.id })}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-flex gap-0.5" aria-hidden="true">
                          {Array.from({ length: pl.label.length }, (_, i) => <Coins key={i} className="size-3.5" />)}
                        </span>
                        {PRICE_LEVEL_HINTS[pl.label.length - 1] ?? pl.label}
                      </span>
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Kategorie * <span className="text-sm md:text-xs font-medium text-accent">(alespoň 1)</span></Label>
                <div className={cn(
                  'flex flex-wrap gap-2 rounded-lg border p-2 transition-colors',
                  invalid?.field === 'service' && invalid.idx === idx && invalid.sub === 'kategorie'
                    ? 'border-destructive ring-3 ring-destructive/20'
                    : 'border-transparent'
                )}>
                  {kategorie.map(k => (
                    <FilterChip key={k.id} selected={svc.kategorie_ids.includes(k.id)} onClick={() => toggleKategorie(idx, k.id)}>
                      {k.nazev}
                    </FilterChip>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Klíčová slova <span className="text-sm md:text-xs font-medium text-accent">(oddělte Enterem nebo čárkou)</span></Label>
                <TagInput
                  value={svc.klicova_slova}
                  onChange={tags => updateService(idx, { klicova_slova: tags })}
                  placeholder="relaxace, úleva od bolesti…"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Odkaz na rezervaci</Label>
                <Input type="url" value={svc.booking_url} onChange={e => updateService(idx, { booking_url: e.target.value })} placeholder="https://" />
              </div>
            </div>
          ))}

          <button type="button" onClick={() => setServices(prev => [...prev, { ...EMPTY_SERVICE }])}
            className={buttonVariants({ variant: 'admin' }) + ' self-start'}>
            + Přidat další službu
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-sans font-semibold border-b border-border pb-2">Metody</h3>
          <MetodaPicker metody={metody} value={selectedMetody} onChange={setSelectedMetody} />
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-6">
        <a href="/dashboard" className={buttonVariants({ variant: 'outline-admin' })}>Zrušit</a>
        <button type="button" disabled={saving} onClick={handleSubmit}
          className={buttonVariants({ variant: 'admin' }) + ' disabled:opacity-50'}>
          {saving ? 'Ukládám…' : 'Uložit změny'}
        </button>
      </div>
    </div>
  )
}
