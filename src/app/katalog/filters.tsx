'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

type Kategorie = { id: number; nazev: string; slug: string }
type Metoda = { id: number; nazev: string; ma_ochrannou_znamku: boolean }

type Props = {
  kategorie: Kategorie[]
  metody: Metoda[]
  activeKats: string[]
  activeMet: number | null
  activeForma: string | null
  activeQ: string
  activeLok: string
  total: number
}

export function Filters({ kategorie, metody, activeKats, activeMet, activeForma, activeQ, activeLok, total }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(activeQ)
  const [lok, setLok] = useState(activeLok)
  const [showMetody, setShowMetody] = useState(activeMet !== null)

  function buildUrl(overrides: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString())
    for (const [key, val] of Object.entries(overrides)) {
      if (val) p.set(key, val)
      else p.delete(key)
    }
    return `/katalog?${p.toString()}`
  }

  function toggleKat(slug: string) {
    const current = params.get('kat')?.split(',').filter(Boolean) ?? []
    const next = current.includes(slug)
      ? current.filter(s => s !== slug)
      : [...current, slug]
    router.push(buildUrl({ kat: next.length > 0 ? next.join(',') : null }))
  }

  function toggle(key: string, value: string) {
    const current = params.get(key)
    router.push(buildUrl({ [key]: current === value ? null : value }))
  }

  function submitText() {
    router.push(buildUrl({ q: q.trim() || null, lok: lok.trim() || null }))
  }

  const hasFilters = activeKats.length > 0 || activeMet !== null || activeForma !== null || activeQ || activeLok

  return (
    <div className="flex flex-col gap-4">
      {/* Textové vyhledávání + lokace */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          placeholder="Hledat (jméno, bio, služba, metoda…)"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitText()}
          className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-primary/40"
        />
        <div className="flex flex-col gap-0.5">
          <input
            type="search"
            placeholder="Lokalita (město, okres, kraj)"
            value={lok}
            onChange={e => setLok(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitText()}
            disabled={activeForma === 'online'}
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-primary/40 disabled:opacity-40 sm:w-52"
          />
          {activeForma === 'online' && (
            <p className="text-xs text-muted-foreground">Online expertky jsou dostupné odkudkoli</p>
          )}
        </div>
        <button
          type="button"
          onClick={submitText}
          className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Hledat
        </button>
      </div>

      {/* Forma */}
      <div className="flex flex-wrap gap-2">
        {([
          [null, 'Vše'],
          ['osobne', 'Osobně'],
          ['online', 'Online'],
        ] as const).map(([val, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => router.push(buildUrl({ forma: val }))}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              activeForma === val
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary/40'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Kategorie — multi-select */}
      <div className="flex flex-wrap gap-2">
        {kategorie.map(k => (
          <button
            key={k.id}
            type="button"
            onClick={() => toggleKat(k.slug)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              activeKats.includes(k.slug)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary/40'
            }`}
          >
            {k.nazev}
          </button>
        ))}
      </div>

      {/* Metody (collapsible) */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowMetody(v => !v)}
          className="flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Metody
          <span className="text-xs">{showMetody ? '▲' : '▼'}</span>
          {activeMet !== null && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />}
        </button>
        {showMetody && (
          <div className="flex flex-wrap gap-2">
            {metody.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle('met', String(m.id))}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  activeMet === m.id
                    ? 'border-accent bg-accent/15 text-accent-foreground font-medium'
                    : 'border-border hover:border-accent/40'
                }`}
              >
                {m.nazev}{m.ma_ochrannou_znamku && <sup className="ml-0.5 text-xs">®</sup>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Výsledky + reset */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total === 0 ? 'Žádné výsledky' : `${total} ${total === 1 ? 'profil' : total < 5 ? 'profily' : 'profilů'}`}
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setQ(''); setLok(''); router.push('/katalog') }}
            className="text-primary hover:underline"
          >
            Zrušit filtry
          </button>
        )}
      </div>
    </div>
  )
}
