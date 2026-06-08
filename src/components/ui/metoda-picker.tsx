'use client'

import { useState, useRef, useEffect } from 'react'

type Metoda = { id: number; nazev: string; ma_ochrannou_znamku?: boolean }

export type SelectedMetoda =
  | { type: 'existing'; id: number; nazev: string; ma_ochrannou_znamku?: boolean }
  | { type: 'new'; nazev: string }

type Props = {
  metody: Metoda[]
  value: SelectedMetoda[]
  onChange: (items: SelectedMetoda[]) => void
}

export function MetodaPicker({ metody, value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedIds = new Set(value.flatMap(m => m.type === 'existing' ? [m.id] : []))
  const selectedNames = new Set(value.map(m => m.nazev.toLowerCase()))

  const existingSuggestions = query.trim().length === 0
    ? []
    : metody
        .filter(m => !selectedIds.has(m.id) && m.nazev.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)

  const trimmed = query.trim()
  const exactMatch = metody.some(m => m.nazev.toLowerCase() === trimmed.toLowerCase())
  const alreadyAdded = selectedNames.has(trimmed.toLowerCase())
  const showNewOption = trimmed.length > 1 && !exactMatch && !alreadyAdded

  function addExisting(m: Metoda) {
    onChange([...value, { type: 'existing', id: m.id, nazev: m.nazev, ma_ochrannou_znamku: m.ma_ochrannou_znamku }])
    setQuery('')
    setOpen(false)
  }

  function addNew() {
    if (!trimmed) return
    onChange([...value, { type: 'new', nazev: trimmed }])
    setQuery('')
    setOpen(false)
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx))
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {/* Vybrané metody */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((m, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-sm font-medium ${
                m.type === 'new'
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-accent/40 bg-accent/10 text-accent-foreground'
              }`}
            >
              {m.type === 'new' && <span className="text-xs opacity-70">nový·</span>}
              {m.nazev}{m.type === 'existing' && m.ma_ochrannou_znamku && <sup className="ml-0.5 text-xs">®</sup>}
              <button
                type="button"
                onClick={() => remove(idx)}
                className="ml-0.5 text-muted-foreground hover:text-foreground leading-none"
                aria-label={`Odebrat ${m.nazev}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Vyhledávací pole */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Escape') { setOpen(false); return }
            if (e.key === 'Enter') {
              e.preventDefault()
              if (existingSuggestions.length > 0) addExisting(existingSuggestions[0])
              else if (showNewOption) addNew()
            }
          }}
          placeholder="Začněte psát název metody…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {open && (existingSuggestions.length > 0 || showNewOption) && (
          <ul className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-background shadow-md overflow-hidden">
            {existingSuggestions.map(m => (
              <li key={m.id}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); addExisting(m) }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                >
                  {m.nazev}{m.ma_ochrannou_znamku && <sup className="ml-0.5 text-xs">®</sup>}
                </button>
              </li>
            ))}
            {showNewOption && (
              <li>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); addNew() }}
                  className="w-full px-3 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 transition-colors border-t border-border"
                >
                  Přidat „{trimmed}" jako nový návrh ke schválení
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
      {value.some(m => m.type === 'new') && (
        <p className="text-xs text-amber-700">Amber položky jsou nové návrhy — admin je schválí před zveřejněním.</p>
      )}
    </div>
  )
}
