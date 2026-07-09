'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type Kategorie = { id: number; nazev: string; slug: string }

type Props = {
  kategorie: Kategorie[]
  activeKat: string | null
}

export function BlogFilters({ kategorie, activeKat }: Props) {
  const router = useRouter()
  const params = useSearchParams()

  function toggle(slug: string) {
    const p = new URLSearchParams(params.toString())
    p.delete('page')
    if (activeKat === slug) p.delete('kat')
    else p.set('kat', slug)
    const qs = p.toString()
    router.push(`/blog${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => router.push('/blog')}
        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
          !activeKat ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'
        }`}
      >
        Vše
      </button>
      {kategorie.map(k => (
        <button
          key={k.id}
          type="button"
          onClick={() => toggle(k.slug)}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            activeKat === k.slug ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'
          }`}
        >
          {k.nazev}
        </button>
      ))}
    </div>
  )
}
