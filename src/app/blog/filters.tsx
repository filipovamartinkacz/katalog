'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FilterChip } from '@/components/ui/filter-chip'

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
      <FilterChip selected={!activeKat} onClick={() => router.push('/blog')}>
        Vše
      </FilterChip>
      {kategorie.map(k => (
        <FilterChip key={k.id} selected={activeKat === k.slug} onClick={() => toggle(k.slug)}>
          {k.nazev}
        </FilterChip>
      ))}
    </div>
  )
}
