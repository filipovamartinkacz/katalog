'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BlazenaConfig, PocitItem, OblastItem } from '@/lib/blazena'
import { resolveKatSlugy } from '@/lib/blazena'
import { buttonVariants } from '@/components/ui/button'
import { FilterChip } from '@/components/ui/filter-chip'

const STEP_COUNT = 3

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
    router.push(`/katalog${params.size > 0 ? `?${params.toString()}` : ''}#vysledky`)
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-foreground">
        Krok {step} ze {STEP_COUNT}
      </p>
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
            <h2 className="text-2xl font-bold">Co tě přivádí?</h2>
            <p className="mt-1 text-foreground">Vyber vše, co na tebe sedí.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {config.pocity.map((p: PocitItem) => {
              const sel = pocity.includes(p.id)
              return (
                <FilterChip key={p.id} selected={sel} onClick={() => togglePocit(p.id)}>
                  {!sel && p.emoji && <span className="mr-1.5">{p.emoji}</span>}
                  {p.label}
                </FilterChip>
              )
            })}
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={pocity.length === 0}
              className={buttonVariants({ size: 'lg' }) + ' disabled:opacity-40'}
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
            <h2 className="text-2xl font-bold">Které oblasti se to týká?</h2>
            <p className="mt-1 text-foreground">Upřesni, nebo přeskoč dál.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {config.oblasti.map((o: OblastItem) => {
              const sel = oblasti.includes(o.id)
              return (
                <FilterChip key={o.id} selected={sel} onClick={() => toggleOblast(o.id)}>
                  {!sel && o.emoji && <span className="mr-1.5">{o.emoji}</span>}
                  {o.label}
                </FilterChip>
              )
            })}
          </div>
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-foreground"
            >
              ← Zpět
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-sm text-foreground"
              >
                Přeskočit
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className={buttonVariants({ size: 'lg' })}
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
            <h2 className="text-2xl font-bold">Kde hledáš?</h2>
            <p className="mt-1 text-foreground">
              Zadej město, okres nebo kraj — nebo nech prázdné pro celou ČR a online.
            </p>
          </div>
          <input
            type="text"
            placeholder="např. Praha, Brno, Jihomoravský kraj…"
            value={lok}
            onChange={e => setLok(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="h-11 rounded-lg border border-input bg-background px-4 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm text-foreground"
            >
              ← Zpět
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className={buttonVariants({ size: 'lg' })}
            >
              Zobrazit průvodkyně →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
