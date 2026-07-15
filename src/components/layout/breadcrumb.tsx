import Link from 'next/link'

type Crumb = { label: string; href?: string }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Drobečková navigace" className="flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted-foreground">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-accent hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
