'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  variant?: 'primary' | 'admin'
  className?: string
}

// Tailwind scans for literal class strings, so each variant/state combo is
// spelled out in full below — building class names like `bg-${tint}/10`
// wouldn't be picked up by the JIT scanner.
const COLORS = {
  primary: {
    selected: 'border-accent/40 bg-accent/25 text-primary',
    idle: 'border-accent/20 bg-card text-foreground hover:bg-accent/10',
  },
  admin: {
    selected: 'border-transparent bg-foreground/10 text-foreground',
    idle: 'border-border bg-card text-foreground hover:bg-foreground/5',
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
        'inline-flex h-8 items-center rounded-tl-[20px] rounded-tr-[33px] rounded-br-[20px] rounded-bl-[40px] border-l-0 border-t border-r-2 border-b-2 pl-3 pr-4 text-sm font-medium shadow-[inset_0_-2px_6px_oklch(0.70_0.13_78_/_25%)] outline-offset-2 focus-visible:outline-accent transition-[background-color,color,border-color,box-shadow] duration-200',
        selected
          ? cn(colors.selected, 'shadow-[inset_0_-2px_7px_oklch(0.70_0.13_78_/_45%)]')
          : cn(colors.idle, 'hover:shadow-[inset_0_-2px_7px_oklch(0.70_0.13_78_/_35%)]'),
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
