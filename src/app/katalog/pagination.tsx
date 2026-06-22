import Link from 'next/link'

type Props = {
  page: number
  totalPages: number
  searchParams: Record<string, string>
}

function buildUrl(searchParams: Record<string, string>, page: number): string {
  const p = new URLSearchParams(searchParams)
  if (page > 1) p.set('page', String(page))
  else p.delete('page')
  const qs = p.toString()
  return `/katalog${qs ? `?${qs}` : ''}`
}

function pageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '…')[] = [1]

  if (current > 3) pages.push('…')

  const lo = Math.max(2, current - 1)
  const hi = Math.min(total - 1, current + 1)
  for (let i = lo; i <= hi; i++) pages.push(i)

  if (current < total - 2) pages.push('…')

  pages.push(total)
  return pages
}

export function Pagination({ page, totalPages, searchParams }: Props) {
  const pages = pageNumbers(page, totalPages)
  const prevUrl = page > 1 ? buildUrl(searchParams, page - 1) : null
  const nextUrl = page < totalPages ? buildUrl(searchParams, page + 1) : null

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Stránkování">
      <PaginationLink href={prevUrl} disabled={!prevUrl}>
        ←
      </PaginationLink>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <PaginationLink
            key={p}
            href={buildUrl(searchParams, p)}
            active={p === page}
          >
            {p}
          </PaginationLink>
        )
      )}

      <PaginationLink href={nextUrl} disabled={!nextUrl}>
        →
      </PaginationLink>
    </nav>
  )
}

function PaginationLink({
  href,
  children,
  active,
  disabled,
}: {
  href: string | null
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
}) {
  const base = 'flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors'

  if (disabled || !href) {
    return (
      <span className={`${base} text-muted-foreground/40 cursor-not-allowed`}>
        {children}
      </span>
    )
  }

  if (active) {
    return (
      <span className={`${base} bg-primary text-primary-foreground`}>
        {children}
      </span>
    )
  }

  return (
    <Link href={href} className={`${base} border border-border hover:border-primary/40 hover:text-primary`}>
      {children}
    </Link>
  )
}
