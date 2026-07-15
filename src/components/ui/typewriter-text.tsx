'use client'

import { useEffect, useState } from 'react'

const WORDS = ['terapeutku', 'koučku', 'průvodkyni']
const TYPE_SPEED = 95
const DELETE_SPEED = 55
const PAUSE_MS = 1800

type Phase = 'typing' | 'deleting'

export function TypewriterText() {
  const [wordIndex, setWordIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('typing')

  useEffect(() => {
    const word = WORDS[wordIndex]

    if (phase === 'typing') {
      if (charIndex < word.length) {
        const t = setTimeout(() => setCharIndex(c => c + 1), TYPE_SPEED)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => setPhase('deleting'), PAUSE_MS)
      return () => clearTimeout(t)
    }

    if (phase === 'deleting') {
      if (charIndex > 0) {
        const t = setTimeout(() => setCharIndex(c => c - 1), DELETE_SPEED)
        return () => clearTimeout(t)
      }
      setPhase('typing')
      setWordIndex(i => (i + 1) % WORDS.length)
    }
  }, [charIndex, phase, wordIndex])

  return (
    <span className="text-foreground">
      {WORDS[wordIndex].slice(0, charIndex)}
      <span className="ml-0.5 inline-block w-[3px] h-[0.8em] translate-y-[0.1em] rounded-sm bg-foreground align-middle animate-[blink_1s_step-end_infinite]" />
    </span>
  )
}
