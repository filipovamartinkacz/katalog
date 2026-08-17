'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { buttonVariants } from '@/components/ui/button'
import { CityPicker, type SelectedMesto } from './city-picker'
import { createMedailonek, type ServiceInput, type SocialLinkInput } from '@/app/actions/medailonek'
import { TagInput } from '@/components/ui/tag-input'
import { MetodaPicker, type SelectedMetoda } from '@/components/ui/metoda-picker'
import { ImageUpload } from '@/components/ui/image-upload'
import { FilterChip } from '@/components/ui/filter-chip'
import { cn } from '@/lib/utils'
import { Coins } from 'lucide-react'

type Kategorie = { id: number; nazev: string }
type Metoda = { id: number; nazev: string }
type PriceLevel = { id: number; label: string }

type Props = {
  kategorie: Kategorie[]
  metody: Metoda[]
  priceLevels: PriceLevel[]
  userId: string
}

const EMPTY_SERVICE: ServiceInput = {
  nazev: '', popis: '', delivery_form: 'osobne',
  booking_url: '', price_level_id: null, kategorie_ids: [], klicova_slova: [],
}

// Počet mincí podle délky uloženého labelu ('€'..'€€€€' = 1-4 úrovně)
const PRICE_LEVEL_HINTS = ['řádově stokoruny', 'řádově tisíce korun', 'řádově desetitisíce korun', 'řádově statisíce korun']

const STEPS = ['O mně', 'Kde působím', 'Co nabízím']

export function MedailonekWizard({ kategorie, metody, priceLevels, userId }: Props) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serviceInvalid, setServiceInvalid] = useState<{ idx: number; sub: 'nazev' | 'kategorie' } | null>(null)

  // Fotky
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)

  // Step 1
  const [jmeno, setJmeno] = useState('')
  const [prijmeni, setPrijmeni] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [email, setEmail] = useState('')
  const [telefon, setTelefon] = useState('')
  const [ico, setIco] = useState('')
  const [rezervaceUrl, setRezervaceUrl] = useState('')

  // Sociální sítě (Step 1)
  const [socWeb, setSocWeb] = useState('')
  const [socInstagram, setSocInstagram] = useState('')
  const [socFacebook, setSocFacebook] = useState('')
  const [socLinkedin, setSocLinkedin] = useState('')
  const [socTiktok, setSocTiktok] = useState('')

  // Step 2
  const [mesta, setMesta] = useState<SelectedMesto[]>([])

  // Step 3
  const [services, setServices] = useState<ServiceInput[]>([{ ...EMPTY_SERVICE }])
  const [selectedMetody, setSelectedMetody] = useState<SelectedMetoda[]>([])

  function updateService(idx: number, patch: Partial<ServiceInput>) {
    setServices(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  function toggleKategorie(svcIdx: number, katId: number) {
    const ids = services[svcIdx].kategorie_ids
    updateService(svcIdx, {
      kategorie_ids: ids.includes(katId) ? ids.filter(i => i !== katId) : [...ids, katId]
    })
  }


  const [step1Error, setStep1Error] = useState<string | null>(null)
  const [step1Invalid, setStep1Invalid] = useState<'jmeno' | 'prijmeni' | 'bio' | null>(null)

  function tryAdvanceStep1() {
    if (!jmeno.trim()) { setStep1Error('Vyplňte jméno a příjmení.'); setStep1Invalid('jmeno'); return }
    if (!prijmeni.trim()) { setStep1Error('Vyplňte jméno a příjmení.'); setStep1Invalid('prijmeni'); return }
    if (bio.trim().length < 30) { setStep1Error('Bio musí mít alespoň 30 znaků.'); setStep1Invalid('bio'); return }
    setStep1Error(null)
    setStep1Invalid(null)
    setStep(1)
  }

  function canAdvanceStep3() {
    return services.every(s => s.nazev.trim() && s.kategorie_ids.length > 0)
  }

  async function handleSubmit() {
    setError(null)
    setServiceInvalid(null)
    for (let i = 0; i < services.length; i++) {
      const s = services[i]
      if (!s.nazev.trim()) {
        setError('Každá služba musí mít název a alespoň jednu kategorii.')
        setServiceInvalid({ idx: i, sub: 'nazev' })
        return
      }
      if (s.kategorie_ids.length === 0) {
        setError('Každá služba musí mít název a alespoň jednu kategorii.')
        setServiceInvalid({ idx: i, sub: 'kategorie' })
        return
      }
    }
    setSaving(true)
    const socialLinks: SocialLinkInput[] = [
      { platform: 'web', url: socWeb },
      { platform: 'instagram', url: socInstagram },
      { platform: 'facebook', url: socFacebook },
      { platform: 'linkedin', url: socLinkedin },
      { platform: 'tiktok', url: socTiktok },
    ].filter(l => l.url.trim()) as SocialLinkInput[]

    const result = await createMedailonek({
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
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Step indicator */}
      <div className="mb-10 flex items-center justify-center gap-0">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                i < step ? 'bg-primary text-primary-foreground'
                : i === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                : 'bg-muted text-muted-foreground'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`mt-1 text-xs ${i === step ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 mb-5 h-px w-16 sm:w-24 ${i < step ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── STEP 1: O mně ── */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <h2 className="text-xl font-sans font-semibold">O mně</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jmeno">Jméno *</Label>
              <Input id="jmeno" value={jmeno} onChange={e => setJmeno(e.target.value)} aria-invalid={step1Invalid === 'jmeno'} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prijmeni">Příjmení *</Label>
              <Input id="prijmeni" value={prijmeni} onChange={e => setPrijmeni(e.target.value)} aria-invalid={step1Invalid === 'prijmeni'} />
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
            <Textarea
              id="bio"
              className="leading-snug"
              rows={5}
              placeholder="Napište něco o sobě, své cestě a přístupu ke klientkám… (alespoň 30 znaků)"
              value={bio}
              onChange={e => { setBio(e.target.value); if (step1Invalid === 'bio') { setStep1Error(null); setStep1Invalid(null) } }}
              aria-invalid={step1Invalid === 'bio'}
            />
            <p className={`text-sm md:text-xs font-medium ${step1Invalid === 'bio' ? 'text-destructive' : 'text-accent'}`}>
              {bio.trim().length} / min. 30 znaků
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Kontaktní e-mail <span className="text-sm md:text-xs font-medium text-accent">(veřejný)</span></Label>
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
              {([
                { id: 'web', label: 'Web', placeholder: 'https://vase-stranka.cz', value: socWeb, set: setSocWeb },
                { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/vase_jmeno', value: socInstagram, set: setSocInstagram },
                { id: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/vase_stranka', value: socFacebook, set: setSocFacebook },
                { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/vase-jmeno', value: socLinkedin, set: setSocLinkedin },
                { id: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@vase_jmeno', value: socTiktok, set: setSocTiktok },
              ] as const).map(({ id, label, placeholder, value, set }) => (
                <div key={id} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-base md:text-sm text-foreground">{label}</span>
                  <Input id={id} type="url" placeholder={placeholder} value={value} onChange={e => set(e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-5">
            <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">Fotky</h3>
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
          </div>

          {step1Error && (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{step1Error}</p>
          )}

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={tryAdvanceStep1}
              className={buttonVariants({ variant: 'admin' })}
            >
              Pokračovat →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Kde působím ── */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-sans font-semibold">Kde působím</h2>
            <p className="mt-1 text-sm md:text-xs font-medium text-accent">
              Přidej města nebo obce kde pracuješ. Pokud nepřidáš žádnou lokaci, bude profil zobrazený jako <strong>celá ČR / pouze online</strong>.
            </p>
          </div>

          <CityPicker value={mesta} onChange={setMesta} />

          <div className="mt-2 flex justify-between">
            <button type="button" onClick={() => setStep(0)} className={buttonVariants({ variant: 'outline-admin' })}>
              ← Zpět
            </button>
            <button type="button" onClick={() => setStep(2)} className={buttonVariants({ variant: 'admin' })}>
              Pokračovat →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Co nabízím ── */}
      {step === 2 && (
        <div className="flex flex-col gap-8">
          <h2 className="text-xl font-sans font-semibold">Co nabízím</h2>

          {/* Služby */}
          <div className="flex flex-col gap-6">
            <h3 className="font-sans font-semibold">Služby <span className="text-sm md:text-xs font-medium text-accent">(alespoň 1)</span></h3>

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
                    placeholder="např. Relaxační masáž"
                    aria-invalid={serviceInvalid?.idx === idx && serviceInvalid.sub === 'nazev'}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Popis</Label>
                  <Textarea className="leading-snug" rows={3} value={svc.popis} onChange={e => updateService(idx, { popis: e.target.value })} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Forma *</Label>
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
                    serviceInvalid?.idx === idx && serviceInvalid.sub === 'kategorie'
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

          {/* Metody */}
          <div className="flex flex-col gap-3">
            <h3 className="font-sans font-semibold border-b border-border pb-2">Metody</h3>
            <p className="text-sm md:text-xs font-medium text-accent">Vyhledejte metody, které ve své práci využíváte.</p>
            <MetodaPicker metody={metody} value={selectedMetody} onChange={setSelectedMetody} />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className={buttonVariants({ variant: 'outline-admin' })}>
              ← Zpět
            </button>
            <button type="button" disabled={saving || !canAdvanceStep3()} onClick={handleSubmit}
              className={buttonVariants({ variant: 'admin' }) + ' disabled:opacity-50'}>
              {saving ? 'Ukládám…' : 'Dokončit a odeslat ke schválení'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
