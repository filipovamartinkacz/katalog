'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const LINKS = [
  { href: '/katalog', label: 'Hledat' },
  { href: '/blog', label: 'Blog' },
  { href: '/pro-odbornice', label: 'Pro odbornice' },
]

export function NavLinks() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
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

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Zavřít menu' : 'Otevřít menu'}
        aria-expanded={open}
        className="order-last flex items-center justify-center text-accent sm:hidden"
      >
        {open ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {open && (
        <nav className="absolute left-0 right-0 top-full flex flex-col gap-1 border-t border-border bg-background px-4 py-3 shadow-md sm:hidden">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={
                  active
                    ? 'rounded-lg bg-accent px-3 py-2 text-sm font-medium text-background'
                    : 'rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted'
                }
              >
                {label}
              </Link>
            )
          })}
        </nav>
      )}
    </>
  )
}
