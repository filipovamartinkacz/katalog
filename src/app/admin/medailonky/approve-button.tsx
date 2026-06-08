'use client'

import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { approveMedailonek, unpublishMedailonek, deleteMedailonek } from '@/app/actions/admin-approve'

export function ApproveButton({ id, isPublished }: { id: string; isPublished: boolean }) {
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleApprove() {
    setLoading(true)
    if (isPublished) {
      await unpublishMedailonek(id)
    } else {
      await approveMedailonek(id)
    }
    setLoading(false)
  }

  async function handleDelete() {
    setLoading(true)
    await deleteMedailonek(id)
    setLoading(false)
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Opravdu smazat?</span>
        <button
          type="button"
          disabled={loading}
          onClick={handleDelete}
          className={buttonVariants({ size: 'sm' }) + ' disabled:opacity-50 bg-destructive hover:bg-destructive/90'}
        >
          {loading ? '…' : 'Smazat'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          Zrušit
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={handleApprove}
        className={buttonVariants({ variant: isPublished ? 'outline' : 'default', size: 'sm' }) + ' disabled:opacity-50'}
      >
        {loading ? '…' : isPublished ? 'Skrýt' : 'Schválit'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' hover:border-destructive hover:text-destructive'}
      >
        Smazat
      </button>
    </div>
  )
}
