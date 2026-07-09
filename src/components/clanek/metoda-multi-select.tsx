'use client'

import { useState, useRef, useEffect } from 'react'

type Metoda = { id: number; nazev: string; ma_ochrannou_znamku?: boolean }

type Props = {
  metody: Metoda[]
  value: number[]
  onChange: (ids: number[]) => void
}

// Ořezaná verze MetodaPicker jen pro existující metody — u článku nemá smysl
// navrhovat novou metodu do číselníku, jen vybrat z těch schválených.
export function MetodaMultiSelect({ metody, value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = metody.filter(m => value.includes(m.id))
  const suggestions = query.trim().length === 0
    ? []
    : metody.filter(m => !value.includes(m.id) && m.nazev.toLowerCase().includes(query.toLowerCase())).slice(0, 8)

  function add(m: Metoda) {
    onChange([...value, m.id])
    setQuery('')
    setOpen(false)
  }

  function remove(id: number) {
    onChange(value.filter(v => v !== id))
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(m => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-0.5 text-sm font-medium text-accent-foreground"
            >
              {m.nazev}
              {m.ma_ochrannou_znamku && <sup className="ml-0.5 text-xs">®</sup>}
              <button
                type="button"
                onClick={() => remove(m.id)}
                className="ml-0.5 text-muted-foreground hover:text-foreground leading-none"
                aria-label={`Odebrat ${m.nazev}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Začněte psát název metody…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-background shadow-md overflow-hidden">
            {suggestions.map(m => (
              <li key={m.id}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); add(m) }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                >
                  {m.nazev}
                  {m.ma_ochrannou_znamku && <sup className="ml-0.5 text-xs">®</sup>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
