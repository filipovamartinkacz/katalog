'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { toggleOblibene } from '@/app/actions/clanek-oblibene'

type Props = {
  clanekId: string
  initialOblibeno: boolean
  loggedIn: boolean
}

export function FavoriteButton({ clanekId, initialOblibeno, loggedIn }: Props) {
  const [oblibeno, setOblibeno] = useState(initialOblibeno)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!loggedIn) {
      window.location.href = `/prihlaseni?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }
    setLoading(true)
    setOblibeno(v => !v)
    const result = await toggleOblibene(clanekId)
    if (result?.error) setOblibeno(v => !v)
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-background px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/5 disabled:opacity-50"
    >
      <Heart className="h-4 w-4" fill={oblibeno ? 'currentColor' : 'none'} />
      {oblibeno ? 'V oblíbených' : 'Uložit'}
    </button>
  )
}
