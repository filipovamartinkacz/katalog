'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { schvalitMetodu } from '@/app/actions/admin-metody'

export function MetodaApproveButton({ id }: { id: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleApprove() {
    setLoading(true)
    await schvalitMetodu(id)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleApprove}
      className="ml-2 rounded-full border border-foreground bg-background px-2 py-0.5 text-xs font-medium text-foreground hover:bg-foreground/5 transition-colors disabled:opacity-50"
    >
      {loading ? '…' : 'Schválit'}
    </button>
  )
}
