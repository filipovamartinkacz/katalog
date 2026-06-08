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

type Kategorie = { id: number; nazev: string }
type Metoda = { id: number; nazev: string }
type PriceLevel = { id: number; label: string }

type Props = {
  kategorie: Kategorie[]
  metody: Metoda[]
  priceLevels: PriceLevel[]
}

const EMPTY_SERVICE: ServiceInput = {
  nazev: '', popis: '', delivery_form: 'osobne',
  booking_url: '', price_level_id: null, kategorie_ids: [], klicova_slova: [],
}

const STEPS = ['O mně', 'Kde působím', 'Co nabízím']

export function MedailonekWizard({ kategorie, metody, priceLevels }: Props) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1
  const [jmeno, setJmeno] = useState('')
  const [prijmeni, setPrijmeni] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [email, setEmail] = useState('')
  const [telefon, setTelefon] = useState('')
  const [ico, setIco] = useState('')

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


  function canAdvanceStep1() {
    return jmeno.trim() && prijmeni.trim() && bio.trim().length >= 30
  }

  function canAdvanceStep3() {
    return services.every(s => s.nazev.trim() && s.kategorie_ids.length > 0)
  }

  async function handleSubmit() {
    if (!canAdvanceStep3()) { setError('Každá služba musí mít název a alespoň jednu kategorii.'); return }
    setSaving(true)
    setError(null)
    const socialLinks: SocialLinkInput[] = [
      { platform: 'web', url: socWeb },
      { platform: 'instagram', url: socInstagram },
      { platform: 'facebook', url: socFacebook },
      { platform: 'linkedin', url: socLinkedin },
      { platform: 'tiktok', url: socTiktok },
    ].filter(l => l.url.trim()) as SocialLinkInput[]

    const result = await createMedailonek({
      jmeno, prijmeni, display_name: displayName,
      bio, kontakt_email: email, telefon, ico,
      mesto_ids: mesta.map(m => m.id),
      metoda_ids: selectedMetody.filter(m => m.type === 'existing').map(m => (m as { type: 'existing'; id: number; nazev: string }).id),
      nove_metody: selectedMetody.filter(m => m.type === 'new').map(m => m.nazev),
      services,
      social_links: socialLinks,
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
          <h2 className="text-xl font-semibold">O mně</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jmeno">Jméno *</Label>
              <Input id="jmeno" value={jmeno} onChange={e => setJmeno(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prijmeni">Příjmení *</Label>
              <Input id="prijmeni" value={prijmeni} onChange={e => setPrijmeni(e.target.value)} required />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="display_name">Jak vás zákaznice oslovují <span className="text-muted-foreground">(nepovinné)</span></Label>
            <Input id="display_name" placeholder="např. Mgr. Jana Nováková nebo Jana" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bio">O sobě *</Label>
            <Textarea id="bio" rows={5} placeholder="Napište něco o sobě, své cestě a přístupu ke klientkám… (alespoň 30 znaků)" value={bio} onChange={e => setBio(e.target.value)} />
            <p className="text-xs text-muted-foreground">{bio.trim().length} / min. 30 znaků</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Kontaktní e-mail <span className="text-muted-foreground">(nepovinný, veřejný)</span></Label>
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
              {([
                { id: 'web', label: 'Web', placeholder: 'https://vase-stranka.cz', value: socWeb, set: setSocWeb },
                { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/vase_jmeno', value: socInstagram, set: setSocInstagram },
                { id: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/vase_stranka', value: socFacebook, set: setSocFacebook },
                { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/vase-jmeno', value: socLinkedin, set: setSocLinkedin },
                { id: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@vase_jmeno', value: socTiktok, set: setSocTiktok },
              ] as const).map(({ id, label, placeholder, value, set }) => (
                <div key={id} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-sm text-muted-foreground">{label}</span>
                  <Input id={id} type="url" placeholder={placeholder} value={value} onChange={e => set(e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={!canAdvanceStep1()}
              onClick={() => setStep(1)}
              className={buttonVariants() + ' disabled:opacity-50'}
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
            <h2 className="text-xl font-semibold">Kde působím</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Přidej města nebo obce kde pracuješ. Pokud nepřidáš žádnou lokaci, bude profil zobrazený jako <strong>celá ČR / pouze online</strong>.
            </p>
          </div>

          <CityPicker value={mesta} onChange={setMesta} />

          <div className="mt-2 flex justify-between">
            <button type="button" onClick={() => setStep(0)} className={buttonVariants({ variant: 'outline' })}>
              ← Zpět
            </button>
            <button type="button" onClick={() => setStep(2)} className={buttonVariants()}>
              Pokračovat →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Co nabízím ── */}
      {step === 2 && (
        <div className="flex flex-col gap-8">
          <h2 className="text-xl font-semibold">Co nabízím</h2>

          {/* Služby */}
          <div className="flex flex-col gap-6">
            <h3 className="font-medium">Služby <span className="text-sm text-muted-foreground">(alespoň 1)</span></h3>

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
                  <Input value={svc.nazev} onChange={e => updateService(idx, { nazev: e.target.value })} placeholder="např. Relaxační masáž" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Popis <span className="text-muted-foreground">(nepovinný)</span></Label>
                  <Textarea rows={3} value={svc.popis} onChange={e => updateService(idx, { popis: e.target.value })} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Forma *</Label>
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

          {/* Metody */}
          <div className="flex flex-col gap-3">
            <h3 className="font-medium">Metody <span className="text-sm text-muted-foreground">(nepovinné)</span></h3>
            <p className="text-sm text-muted-foreground">Vyhledejte metody, které ve své práci využíváte.</p>
            <MetodaPicker metody={metody} value={selectedMetody} onChange={setSelectedMetody} />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className={buttonVariants({ variant: 'outline' })}>
              ← Zpět
            </button>
            <button type="button" disabled={saving || !canAdvanceStep3()} onClick={handleSubmit}
              className={buttonVariants() + ' disabled:opacity-50'}>
              {saving ? 'Ukládám…' : 'Dokončit a odeslat ke schválení'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
