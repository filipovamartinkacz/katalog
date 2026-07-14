'use client'

import { useState, useTransition } from 'react'
import { saveBlazenaConfig } from '@/app/actions/admin-blazena'
import type { BlazenaConfig } from '@/lib/blazena'
import { buttonVariants } from '@/components/ui/button'

export function BlazenaEditor({ initialConfig }: { initialConfig: BlazenaConfig | null }) {
  const [text, setText] = useState(
    JSON.stringify(initialConfig ?? { pocity: [], oblasti: [] }, null, 2)
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    setSuccess(false)

    let parsed: BlazenaConfig
    try {
      parsed = JSON.parse(text)
    } catch {
      setError('Neplatný JSON — zkontrolujte syntaxi.')
      return
    }

    if (!Array.isArray(parsed.pocity) || !Array.isArray(parsed.oblasti)) {
      setError('Config musí obsahovat pole "pocity" a "oblasti".')
      return
    }

    startTransition(async () => {
      const result = await saveBlazenaConfig(parsed)
      if (result.error) setError(result.error)
      else setSuccess(true)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setSuccess(false) }}
        rows={36}
        spellCheck={false}
        className="w-full rounded-lg border border-input bg-background p-4 font-mono text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-primary/40"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Uloženo.</p>}
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className={buttonVariants({ variant: 'admin' }) + ' self-start disabled:opacity-50'}
      >
        {isPending ? 'Ukládám…' : 'Uložit'}
      </button>
    </div>
  )
}
