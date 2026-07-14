'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/katalog', label: 'Hledat' },
  { href: '/blog', label: 'Blog' },
  { href: '/pro-podnikatelky', label: 'Pro podnikatelky' },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="hidden items-center gap-6 text-sm sm:flex">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return active ? (
          <span key={href} className="rounded-full bg-accent px-3 py-1 font-medium text-background">
            {label}
          </span>
        ) : (
          <Link key={href} href={href} className="text-accent transition-colors hover:underline">
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
