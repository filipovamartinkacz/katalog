'use client'

import { useEffect } from 'react'
import { recordClanekView } from '@/app/actions/clanek-view'

export function ViewTracker({ clanekId }: { clanekId: string }) {
  useEffect(() => {
    recordClanekView(clanekId)
  }, [clanekId])
  return null
}
