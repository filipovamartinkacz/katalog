'use client'

import { useState, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'

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
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-tag px-2.5 py-0.5 text-sm font-medium text-tag-foreground">
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter(t => t !== tag))}
                className="leading-none"
                aria-label={`Odebrat ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={add}
        placeholder={placeholder}
      />
    </div>
  )
}
