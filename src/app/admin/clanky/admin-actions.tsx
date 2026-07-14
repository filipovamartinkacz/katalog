'use client'

import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { schvalitClanek, zamitnoutClanek, adminSmazatClanek } from '@/app/actions/admin-clanky'

export function AdminClanekActions({ id, status }: { id: string; status: string }) {
  const [loading, setLoading] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [duvod, setDuvod] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setLoading(true)
    setError(null)
    const result = await schvalitClanek(id)
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  async function handleReject() {
    setLoading(true)
    setError(null)
    const result = await zamitnoutClanek(id, duvod)
    if (result?.error) { setError(result.error); setLoading(false); return }
    setRejecting(false)
    setLoading(false)
  }

  async function handleDelete() {
    setLoading(true)
    await adminSmazatClanek(id)
    setLoading(false)
  }

  if (confirmingDelete) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-foreground">Opravdu smazat?</span>
        <button
          type="button"
          disabled={loading}
          onClick={handleDelete}
          className={buttonVariants({ variant: 'outline-admin', size: 'sm' }) + ' disabled:opacity-50'}
        >
          {loading ? '…' : 'Smazat'}
        </button>
        <button type="button" onClick={() => setConfirmingDelete(false)} className={buttonVariants({ variant: 'outline-admin', size: 'sm' })}>
          Zrušit
        </button>
      </div>
    )
  }

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          value={duvod}
          onChange={e => setDuvod(e.target.value)}
          placeholder="Důvod zamítnutí (uvidí ho autorka)…"
          rows={2}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading || !duvod.trim()}
            onClick={handleReject}
            className={buttonVariants({ variant: 'outline-admin', size: 'sm' }) + ' disabled:opacity-50'}
          >
            {loading ? '…' : 'Odeslat zamítnutí'}
          </button>
          <button type="button" onClick={() => setRejecting(false)} className={buttonVariants({ variant: 'outline-admin', size: 'sm' })}>
            Zrušit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== 'publikovano' && (
        <button type="button" disabled={loading} onClick={handleApprove} className={buttonVariants({ variant: 'admin', size: 'sm' }) + ' disabled:opacity-50'}>
          {loading ? '…' : 'Schválit'}
        </button>
      )}
      {status === 'ceka_na_schvaleni' && (
        <button type="button" onClick={() => setRejecting(true)} className={buttonVariants({ variant: 'outline-admin', size: 'sm' })}>
          Zamítnout
        </button>
      )}
      <button
        type="button"
        onClick={() => setConfirmingDelete(true)}
        className={buttonVariants({ variant: 'outline-admin', size: 'sm' })}
      >
        Smazat
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
