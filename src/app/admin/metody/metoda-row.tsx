'use client'

import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { schvalitMetodu, zamitnoutMetodu, upravitMetodu } from '@/app/actions/admin-metody'

type Props = {
  id: number
  nazev: string
  popis: string | null
  status: string
  maOchrannaZnamka: boolean
  pouzitaV: number
}

export function MetodaRow({ id, nazev, popis, status, maOchrannaZnamka, pouzitaV }: Props) {
  const [editing, setEditing] = useState(false)
  const [editNazev, setEditNazev] = useState(nazev)
  const [editPopis, setEditPopis] = useState(popis ?? '')
  const [editOchrannaZnamka, setEditOchrannaZnamka] = useState(maOchrannaZnamka)
  const [loading, setLoading] = useState(false)

  async function handle(fn: () => Promise<unknown>) {
    setLoading(true)
    await fn()
    setLoading(false)
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-primary/30 bg-card p-4 flex flex-col gap-3">
        <input
          value={editNazev}
          onChange={e => setEditNazev(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40"
        />
        <textarea
          value={editPopis}
          onChange={e => setEditPopis(e.target.value)}
          rows={2}
          placeholder="Popis (nepovinný)"
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={editOchrannaZnamka}
            onChange={e => setEditOchrannaZnamka(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          Ochranná známka <span className="text-muted-foreground">(za názvem se zobrazí ®)</span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading || !editNazev.trim()}
            onClick={() => handle(() => upravitMetodu(id, editNazev, editPopis || null, editOchrannaZnamka)).then(() => setEditing(false))}
            className={buttonVariants({ size: 'sm' }) + ' disabled:opacity-50'}
          >
            {loading ? '…' : 'Schválit a uložit'}
          </button>
          <button type="button" onClick={() => setEditing(false)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Zrušit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold">
            {nazev}{maOchrannaZnamka && <sup className="ml-0.5 text-xs">®</sup>}
          </p>
          {status === 'navrzena' && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Návrh</span>
          )}
        </div>
        {popis && <p className="mt-0.5 text-sm text-muted-foreground">{popis}</p>}
        <p className="mt-1 text-xs text-muted-foreground">
          Použita v {pouzitaV} {pouzitaV === 1 ? 'profilu' : 'profilech'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {status === 'navrzena' && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={() => handle(() => schvalitMetodu(id))}
              className={buttonVariants({ size: 'sm' }) + ' disabled:opacity-50'}
            >
              {loading ? '…' : 'Schválit'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Upravit
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handle(() => zamitnoutMetodu(id))}
              className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' disabled:opacity-50 hover:border-destructive hover:text-destructive'}
            >
              Zamítnout
            </button>
          </>
        )}
        {status === 'aktivni' && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Upravit
          </button>
        )}
      </div>
    </div>
  )
}
