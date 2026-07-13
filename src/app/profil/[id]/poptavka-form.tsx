'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { submitPoptavka } from '@/app/actions/poptavka'

type Props = {
  medailonekId: string
  services: { id: number; nazev: string }[]
  prefill: { jmeno: string; email: string; telefon: string }
  isLoggedIn: boolean
  onCancel: () => void
}

const JINE = 'jine'

type Field = 'jmeno' | 'email' | 'sluzba' | 'zprava'

export function PoptavkaForm({ medailonekId, services, prefill, isLoggedIn, onCancel }: Props) {
  const [jmeno, setJmeno] = useState(prefill.jmeno)
  const [email, setEmail] = useState(prefill.email)
  const [telefon, setTelefon] = useState(prefill.telefon)
  const [sluzba, setSluzba] = useState('')
  const [zprava, setZprava] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invalidField, setInvalidField] = useState<Field | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInvalidField(null)

    if (!jmeno.trim()) { setError('Vyplň prosím jméno.'); setInvalidField('jmeno'); return }
    if (!email.trim()) { setError('Vyplň prosím e-mail.'); setInvalidField('email'); return }
    if (!sluzba) { setError('Vyber prosím, o co máš zájem.'); setInvalidField('sluzba'); return }
    if (!zprava.trim()) { setError('Napiš prosím zprávu.'); setInvalidField('zprava'); return }

    setLoading(true)

    const service = sluzba === JINE ? null : services.find(s => String(s.id) === sluzba)
    const serviceId = service?.id ?? null
    const serviceNazev = sluzba === JINE ? 'Jiné' : (service?.nazev ?? null)

    const result = await submitPoptavka({ medailonekId, jmeno, email, telefon, zprava, serviceId, serviceNazev, honeypot })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        Poptávka byla odeslána. Expertka se ti brzy ozve.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <h2 className="text-lg font-semibold">Nezávazná poptávka</h2>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      {!isLoggedIn && (
        <p className="text-xs text-muted-foreground">
          Máš u nás účet?{' '}
          <Link href="/prihlaseni" className="text-primary hover:underline">Přihlas se</Link>
          {' '}nebo se{' '}
          <Link href="/registrace" className="text-primary hover:underline">zaregistruj</Link>
          , ať příště nemusíš údaje vyplňovat znovu.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="poptavka-jmeno">Jméno *</Label>
          <Input id="poptavka-jmeno" value={jmeno} onChange={e => setJmeno(e.target.value)} aria-invalid={invalidField === 'jmeno'} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="poptavka-email">E-mail *</Label>
          <Input id="poptavka-email" type="email" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={invalidField === 'email'} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="poptavka-telefon">Telefon <span className="text-muted-foreground">(nepovinný)</span></Label>
          <Input id="poptavka-telefon" type="tel" value={telefon} onChange={e => setTelefon(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 sm:w-2/3">
        <Label htmlFor="poptavka-sluzba">Mám zájem o *</Label>
        <select
          id="poptavka-sluzba"
          value={sluzba}
          onChange={e => setSluzba(e.target.value)}
          aria-invalid={invalidField === 'sluzba'}
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
        >
          <option value="" disabled>Vyber prosím…</option>
          {services.map(s => (
            <option key={s.id} value={s.id}>{s.nazev}</option>
          ))}
          <option value={JINE}>Jiné</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="poptavka-zprava">Zpráva *</Label>
        <Textarea id="poptavka-zprava" rows={4} value={zprava} onChange={e => setZprava(e.target.value)} aria-invalid={invalidField === 'zprava'} />
      </div>

      {/* Honeypot — pro člověka neviditelné, boti ho často vyplní */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="poptavka-web">Web</label>
        <input
          id="poptavka-web"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={e => setHoneypot(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className={cn(buttonVariants(), 'h-auto flex-col gap-0 px-6 py-1 disabled:opacity-50')}
        >
          <span>{loading ? 'Odesílám…' : 'Odeslat poptávku'}</span>
          {!loading && <span className="text-[11px] font-normal opacity-80">Ozvu se zpět co nejdříve</span>}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">
          Zrušit
        </button>
      </div>
    </form>
  )
}
