'use client'

import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { buttonVariants } from '@/components/ui/button'

type Props = {
  editor: Editor
  pos: number
  attrs: { src: string; alt: string | null; width: number | null }
  onClose: () => void
}

const WIDTHS = [25, 50, 75, 100]

export function ImagePanel({ editor, pos, attrs, onClose }: Props) {
  const [alt, setAlt] = useState(attrs.alt ?? '')
  const width = attrs.width ?? 100

  function setWidth(w: number) {
    editor.chain().focus().setNodeSelection(pos).updateAttributes('image', { width: w }).run()
  }

  function saveAlt() {
    editor.chain().focus().setNodeSelection(pos).updateAttributes('image', { alt }).run()
    onClose()
  }

  function removeImage() {
    editor.chain().focus().setNodeSelection(pos).deleteSelection().run()
    onClose()
  }

  return (
    <div className="flex items-start gap-3 border-b border-t border-border bg-muted/30 p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={attrs.src} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Šířka obrázku</span>
          <div className="flex gap-1.5">
            {WIDTHS.map(w => (
              <button
                key={w}
                type="button"
                onClick={() => setWidth(w)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  width === w ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                }`}
              >
                {w} %
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          value={alt}
          onChange={e => setAlt(e.target.value)}
          placeholder="Alt text obrázku…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={saveAlt} className={buttonVariants({ variant: 'admin', size: 'sm' })}>
            Uložit
          </button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={removeImage} className="text-xs font-medium text-foreground hover:underline">
              Odstranit obrázek
            </button>
            <button type="button" onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
              Zavřít
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
