'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  variant?: 'primary' | 'admin' | 'accent'
  className?: string
}

// Tailwind scans for literal class strings, so each variant/state combo is
// spelled out in full below — building class names like `bg-${tint}/10`
// wouldn't be picked up by the JIT scanner.
const COLORS = {
  primary: {
    selected: 'border-transparent bg-primary/10 text-primary',
    idle: 'border-border bg-card text-foreground hover:bg-primary/5',
  },
  admin: {
    selected: 'border-transparent bg-foreground/10 text-foreground',
    idle: 'border-border bg-card text-foreground hover:bg-foreground/5',
  },
  accent: {
    selected: 'border-transparent bg-accent/15 text-accent-foreground',
    idle: 'border-border bg-card text-foreground hover:bg-accent/5',
  },
}

export function FilterChip({ selected, onClick, children, variant = 'primary', className }: Props) {
  const colors = COLORS[variant]

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'inline-flex h-9 items-center rounded-[14px] border pl-3 pr-4 text-sm font-medium transition-colors duration-200',
        selected ? colors.selected : colors.idle,
        className
      )}
    >
      <span
        className={cn(
          'grid overflow-hidden transition-all duration-200 ease-out',
          selected ? 'grid-cols-[14px] mr-1.5' : 'grid-cols-[0px] mr-0'
        )}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
      {children}
    </button>
  )
}
