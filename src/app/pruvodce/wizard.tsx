'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BlazenaConfig, PocitItem, OblastItem } from '@/lib/blazena'
import { resolveKatSlugy } from '@/lib/blazena'

const STEP_COUNT = 3

function ChipButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border hover:border-primary/50 hover:bg-primary/5'
      }`}
    >
      {children}
    </button>
  )
}

export function PruvodceWizard({ config }: { config: BlazenaConfig }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [pocity, setPocity] = useState<string[]>([])
  const [oblasti, setOblasti] = useState<string[]>([])
  const [lok, setLok] = useState('')

  function togglePocit(id: string) {
    setPocity(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function toggleOblast(id: string) {
    setOblasti(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handleSubmit() {
    const slugs = resolveKatSlugy(config, pocity, oblasti)
    const params = new URLSearchParams()
    if (slugs.length > 0) params.set('kat', slugs.join(','))
    if (lok.trim()) params.set('lok', lok.trim())
    router.push(`/katalog${params.size > 0 ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {Array.from({ length: STEP_COUNT }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i + 1 <= step ? 'bg-primary' : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Step 1 — Pocity */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Krok 1 ze 3
            </p>
            <h2 className="mt-2 text-2xl font-bold">Co tě přivádí?</h2>
            <p className="mt-1 text-muted-foreground">Vyber vše, co na tebe sedí.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {config.pocity.map((p: PocitItem) => (
              <ChipButton key={p.id} selected={pocity.includes(p.id)} onClick={() => togglePocit(p.id)}>
                {p.emoji && <span>{p.emoji}</span>}
                {p.label}
              </ChipButton>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={pocity.length === 0}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              Pokračovat →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Oblast */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Krok 2 ze 3
            </p>
            <h2 className="mt-2 text-2xl font-bold">Které oblasti se to týká?</h2>
            <p className="mt-1 text-muted-foreground">Upřesni, nebo přeskoč dál.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {config.oblasti.map((o: OblastItem) => (
              <ChipButton key={o.id} selected={oblasti.includes(o.id)} onClick={() => toggleOblast(o.id)}>
                {o.emoji && <span>{o.emoji}</span>}
                {o.label}
              </ChipButton>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Zpět
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Přeskočit
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Pokračovat →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Lokalita */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Krok 3 ze 3
            </p>
            <h2 className="mt-2 text-2xl font-bold">Kde hledáš?</h2>
            <p className="mt-1 text-muted-foreground">
              Zadej město, okres nebo kraj — nebo nech prázdné pro celou ČR a online.
            </p>
          </div>
          <input
            type="text"
            placeholder="např. Praha, Brno, Jihomoravský kraj…"
            value={lok}
            onChange={e => setLok(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="h-11 rounded-lg border border-border bg-background px-4 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Zpět
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Zobrazit průvodkyně →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
