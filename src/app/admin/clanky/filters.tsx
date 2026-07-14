'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { FilterChip } from '@/components/ui/filter-chip'

const STATUSY = [
  { value: 'ceka_na_schvaleni', label: 'Čeká na schválení' },
  { value: 'publikovano', label: 'Publikované' },
  { value: 'zamitnuto', label: 'Zamítnuté' },
  { value: 'rozpracovano', label: 'Rozpracované' },
] as const

const TYPY = [
  { value: 'blog', label: 'Článek' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'video', label: 'Video' },
] as const

export const RAZENI = [
  { value: 'nejnovejsi', label: 'Nejnovější' },
  { value: 'nejstarsi', label: 'Nejstarší' },
  { value: 'nejctenejsi', label: 'Nejvíce čtené' },
  { value: 'nejmene-ctene', label: 'Nejméně čtené' },
  { value: 'nejoblibenejsi', label: 'Nejvíce oblíbené' },
  { value: 'nejmene-oblibene', label: 'Nejméně oblíbené' },
] as const

type Kategorie = { id: number; nazev: string; slug: string }

type Props = {
  activeStatus: string
  activeQ: string
  activeGated: boolean
  activeSort: string
  activeKat: string | null
  activeTyp: string | null
  kategorie: Kategorie[]
  counts: Record<string, number>
}

export function AdminClankyFilters({ activeStatus, activeQ, activeGated, activeSort, activeKat, activeTyp, kategorie, counts }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(activeQ)

  function buildUrl(overrides: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString())
    p.delete('page')
    for (const [key, val] of Object.entries(overrides)) {
      if (val) p.set(key, val)
      else p.delete(key)
    }
    const qs = p.toString()
    return `/admin/clanky${qs ? `?${qs}` : ''}`
  }

  function submitSearch() {
    router.push(buildUrl({ q: q.trim() || null }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {STATUSY.map(s => (
          <FilterChip key={s.value} variant="admin" selected={activeStatus === s.value} onClick={() => router.push(buildUrl({ status: s.value }))}>
            {s.label} ({counts[s.value] ?? 0})
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip variant="admin" selected={!activeKat} onClick={() => router.push(buildUrl({ kat: null }))}>
          Všechny kategorie
        </FilterChip>
        {kategorie.map(k => (
          <FilterChip key={k.id} variant="admin" selected={activeKat === k.slug} onClick={() => router.push(buildUrl({ kat: k.slug }))}>
            {k.nazev}
          </FilterChip>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitSearch()}
          placeholder="Hledat podle názvu…"
          className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="button"
          onClick={submitSearch}
          className={buttonVariants({ variant: 'admin', size: 'lg' })}
        >
          Hledat
        </button>
        {activeQ && (
          <button type="button" onClick={() => { setQ(''); router.push(buildUrl({ q: null })) }} className="text-sm text-foreground hover:underline">
            Zrušit hledání
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex w-fit items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={activeGated}
            onChange={e => router.push(buildUrl({ gated: e.target.checked ? '1' : null }))}
          />
          Jen s placenou (paywall) částí
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground">
          Typ:
          <select
            value={activeTyp ?? ''}
            onChange={e => router.push(buildUrl({ typ: e.target.value || null }))}
            className="rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Všechny typy</option>
            {TYPY.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground">
          Řadit:
          <select
            value={activeSort}
            onChange={e => router.push(buildUrl({ sort: e.target.value === 'nejnovejsi' ? null : e.target.value }))}
            className="rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {RAZENI.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
