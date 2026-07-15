'use client'

import { useState, KeyboardEvent } from 'react'

type Props = {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ value, onChange, placeholder = 'Přidat klíčové slovo…' }: Props) {
  const [input, setInput] = useState('')

  function add() {
    const tag = input.trim().toLowerCase()
    if (!tag || value.includes(tag)) { setInput(''); return }
    onChange([...value, tag])
    setInput('')
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex min-h-9 flex-wrap gap-1.5 rounded-lg border border-input bg-background px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2">
      {value.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter(t => t !== tag))}
            className="ml-0.5 text-muted-foreground hover:text-foreground leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={add}
        placeholder={value.length === 0 ? placeholder : ''}
        className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
