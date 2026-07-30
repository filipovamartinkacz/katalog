'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { FilterChip } from '@/components/ui/filter-chip'
import { Input } from '@/components/ui/input'

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
    p.delete('page')
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
        <Input
          type="search"
          placeholder="Hledat (jméno, bio, služba, metoda…)"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitText()}
          className="flex-1"
        />
        <div className="flex flex-col gap-0.5">
          <Input
            type="search"
            placeholder="Lokalita (město, okres, kraj)"
            value={lok}
            onChange={e => setLok(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitText()}
            disabled={activeForma === 'online'}
            className="sm:w-52"
          />
          {activeForma === 'online' && (
            <p className="text-xs text-muted-foreground">Online expertky jsou dostupné odkudkoli</p>
          )}
        </div>
        <button
          type="button"
          onClick={submitText}
          className={buttonVariants({ size: 'lg' })}
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
          <FilterChip key={label} selected={activeForma === val} onClick={() => router.push(buildUrl({ forma: val }))}>
            {label}
          </FilterChip>
        ))}
      </div>

      {/* Kategorie — multi-select */}
      <div className="flex flex-col gap-2">
        <span className="w-fit text-sm font-medium text-foreground">Kategorie</span>
        <div className="flex flex-wrap gap-2">
          {kategorie.map(k => (
            <FilterChip key={k.id} selected={activeKats.includes(k.slug)} onClick={() => toggleKat(k.slug)}>
              {k.nazev}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Metody (collapsible) */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowMetody(v => !v)}
          className="flex w-fit items-center gap-1 text-sm font-medium text-foreground"
        >
          Metody
          <span className="text-xs">{showMetody ? '▲' : '▼'}</span>
          {activeMet !== null && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />}
        </button>
        {showMetody && (
          <div className="flex flex-wrap gap-2">
            {metody.map(m => (
              <FilterChip key={m.id} selected={activeMet === m.id} onClick={() => toggle('met', String(m.id))}>
                {m.nazev}{m.ma_ochrannou_znamku && <sup className="ml-0.5 text-xs">®</sup>}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      {/* Výsledky + reset */}
      <div id="vysledky" className="flex items-center justify-between text-sm text-foreground scroll-mt-20">
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
