'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'

type MestoResult = {
  id: number
  nazev: string
  okres: { nazev: string; kraj: { nazev: string } }
}

export type SelectedMesto = { id: number; nazev: string; okres: string }

type Props = {
  value: SelectedMesto[]
  onChange: (val: SelectedMesto[]) => void
}

export function CityPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MestoResult[]>([])
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (query.length < 2) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/mesta?q=${encodeURIComponent(query)}`)
      const data: MestoResult[] = await res.json()
      setResults(data)
      setOpen(data.length > 0)
    }, 250)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(m: MestoResult) {
    if (value.some(v => v.id === m.id)) return
    onChange([...value, { id: m.id, nazev: m.nazev, okres: m.okres.nazev }])
    setQuery('')
    setOpen(false)
  }

  function remove(id: number) {
    onChange(value.filter(v => v.id !== id))
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(m => (
            <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              {m.nazev}
              <span className="text-muted-foreground text-xs">({m.okres})</span>
              <button type="button" onClick={() => remove(m.id)} className="ml-1 text-muted-foreground hover:text-foreground leading-none">×</button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Začni psát název města nebo obce…"
          autoComplete="off"
        />
        {open && (
          <ul className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover py-1 shadow-lg">
            {results.map(m => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => select(m)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted text-left"
                >
                  <span className="font-medium">{m.nazev}</span>
                  <span className="text-muted-foreground text-xs">{m.okres.nazev}, {m.okres.kraj.nazev}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
