'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'

type Medailonek = {
  id: string
  jmeno: string
  prijmeni: string
  display_name: string | null
  foto_url: string | null
}

type Props = {
  value: string
  onChange: (id: string) => void
}

// Vyhledávací picker autorky pro admina — server-side hledání (ne fetch celého
// seznamu), protože expertek na serveru časem budou tisíce. Zobrazuje fotku
// a display_name (nick), aby šlo rozlišit shodná jména.
export function AutorkaPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Medailonek[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Medailonek | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (query.trim().length < 2) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/medailonky/hledat?q=${encodeURIComponent(query.trim())}`)
      const data: Medailonek[] = await res.json()
      setResults(data)
      setOpen(true)
    }, 250)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(m: Medailonek) {
    setSelected(m)
    onChange(m.id)
    setQuery('')
    setOpen(false)
  }

  function clear() {
    setSelected(null)
    onChange('')
  }

  if (selected || value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-input bg-background px-3 py-2">
        <Avatar medailonek={selected} />
        <div className="min-w-0 flex-1">
          {selected ? (
            <>
              <p className="truncate text-sm font-medium">{selected.jmeno} {selected.prijmeni}</p>
              {selected.display_name && <p className="truncate text-xs text-muted-foreground">{selected.display_name}</p>}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Vybraná autorka (ID: {value})</p>
          )}
        </div>
        <button type="button" onClick={clear} className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground">
          Změnit
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Začni psát jméno expertky…"
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover py-1 shadow-lg">
          {results.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">Žádná shoda</li>
          )}
          {results.map(m => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => select(m)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted"
              >
                <Avatar medailonek={m} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{m.jmeno} {m.prijmeni}</span>
                  {m.display_name && <span className="block truncate text-xs text-muted-foreground">{m.display_name}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Avatar({ medailonek }: { medailonek: Medailonek | null }) {
  const initials = medailonek ? `${medailonek.jmeno[0] ?? ''}${medailonek.prijmeni[0] ?? ''}`.toUpperCase() : '?'
  return (
    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/10">
      {medailonek?.foto_url ? (
        <Image src={medailonek.foto_url} alt="" fill className="object-cover" sizes="32px" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-primary">
          {initials}
        </span>
      )}
    </div>
  )
}
