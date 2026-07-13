'use client'

import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { TrackedLink } from './tracked-link'
import { PoptavkaForm } from './poptavka-form'

type Props = {
  medailonekId: string
  rezervaceUrl: string | null
  services: { id: number; nazev: string }[]
  prefill: { jmeno: string; email: string; telefon: string }
  isLoggedIn: boolean
}

export function CtaRezervace({ medailonekId, rezervaceUrl, services, prefill, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false)

  if (rezervaceUrl) {
    return (
      <TrackedLink
        href={rezervaceUrl}
        medailonekId={medailonekId}
        className={buttonVariants({ size: 'lg' }) + ' w-full sm:w-auto'}
      >
        Rezervovat →
      </TrackedLink>
    )
  }

  if (open) {
    return <PoptavkaForm medailonekId={medailonekId} services={services} prefill={prefill} isLoggedIn={isLoggedIn} onCancel={() => setOpen(false)} />
  }

  return (
    <button type="button" onClick={() => setOpen(true)} className={buttonVariants({ size: 'lg' }) + ' w-full sm:w-auto'}>
      Nezávazně poptat
    </button>
  )
}
