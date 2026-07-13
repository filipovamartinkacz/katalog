'use client'

type Props = {
  href: string
  medailonekId: string
  serviceId?: number | null
  className?: string
  children: React.ReactNode
}

// Odkaz, který se ihned normálně otevře (žádný preventDefault) a zároveň na
// pozadí zaznamená proklik — keepalive zaručí, že požadavek přežije i odchod
// ze stránky.
export function TrackedLink({ href, medailonekId, serviceId, className, children }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        fetch('/api/rezervace-proklik', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ medailonekId, serviceId: serviceId ?? null }),
        }).catch(() => {})
      }}
    >
      {children}
    </a>
  )
}
