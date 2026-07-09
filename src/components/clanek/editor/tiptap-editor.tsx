'use client'

import { useEditor, useEditorState, EditorContent, type Editor } from '@tiptap/react'
import { useCallback, useState } from 'react'
import type { JSONContent } from '@tiptap/core'
import { getClanekExtensions } from '@/lib/clanek/tiptap-extensions'
import { createClient } from '@/lib/supabase/client'
import { convertImageToWebp } from '@/lib/image-convert'
import { LinkMenu } from './link-menu'
import { ImagePanel } from './image-panel'

type Props = {
  value: JSONContent
  onChange: (json: JSONContent) => void
  userId: string
}

const MAX_MB = 8

export function TiptapEditor({ value, onChange, userId }: Props) {
  const [linkMenuOpen, setLinkMenuOpen] = useState(false)
  const [imagePanelOpen, setImagePanelOpen] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const editor = useEditor({
    extensions: getClanekExtensions({ interactive: true }),
    content: value,
    immediatelyRender: false,
    // JSON round-trip zaručí čistě prostá data (žádné skryté reference/prototypy),
    // aby šel obsah bez problémů poslat jako argument server akce.
    onUpdate: ({ editor }) => onChange(JSON.parse(JSON.stringify(editor.getJSON()))),
    editorProps: {
      attributes: {
        class: 'clanek-body min-h-[300px] px-4 py-3 focus:outline-none',
      },
      // Odkaz v editoru se nikdy nemá otevírat kliknutím (jde jen o editaci
      // textu, ne o procházení). Zachyceno přímo na DOM elementu (ne přes
      // rozpoznávání uzlu editorem), ať to funguje spolehlivě ve všech
      // prohlížečích bez ohledu na to, kam přesně klik padne.
      handleDOMEvents: {
        click: (_view, event) => {
          const target = event.target as HTMLElement
          if (target.closest('a')) {
            event.preventDefault()
            return true
          }
          return false
        },
      },
    },
  })

  // Reaktivně sleduje, jestli je teď v editoru vybraný (kliknutý) obrázek —
  // podle toho se tlačítko v liště přepíná mezi "vložit nový" a "upravit vybraný".
  const selectedImage = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor || !editor.isActive('image')) return null
      return { pos: editor.state.selection.from, attrs: editor.getAttributes('image') as { src: string; alt: string | null; width: number | null } }
    },
  })

  const uploadInlineImage = useCallback(async (file: File, editorInstance: Editor) => {
    if (!file.type.startsWith('image/')) { alert('Vyberte obrázek (JPG, PNG, WebP…)'); return }
    if (file.size > MAX_MB * 1024 * 1024) { alert(`Maximální velikost je ${MAX_MB} MB.`); return }

    setUploadingImage(true)

    let webpFile: File
    try {
      webpFile = await convertImageToWebp(file)
    } catch {
      alert('Obrázek se nepodařilo zpracovat. Zkuste jiný soubor.')
      setUploadingImage(false)
      return
    }

    const supabase = createClient()
    const path = `${userId}/${crypto.randomUUID()}.webp`
    const { error } = await supabase.storage.from('clanek-obrazky').upload(path, webpFile, { contentType: webpFile.type })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('clanek-obrazky').getPublicUrl(path)
      const alt = window.prompt('Alt text obrázku (pro čtečky a SEO):', '') ?? ''
      editorInstance.chain().focus().setImage({ src: publicUrl, alt }).run()
    } else {
      alert('Upload obrázku se nezdařil.')
    }
    setUploadingImage(false)
  }, [userId])

  if (!editor) return null

  return (
    <div className="rounded-lg border border-input bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
        <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          Tučně
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          Kurzíva
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          Seznam
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          Číslovaný
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          Citace
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('link') || linkMenuOpen} onClick={() => setLinkMenuOpen(o => !o)}>
          Odkaz
        </ToolbarButton>
        {selectedImage ? (
          <ToolbarButton active={imagePanelOpen} onClick={() => setImagePanelOpen(o => !o)}>
            Upravit obrázek
          </ToolbarButton>
        ) : (
          <label className="cursor-pointer rounded px-2 py-1 text-xs font-medium hover:bg-muted">
            {uploadingImage ? 'Nahrávám…' : 'Obrázek'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingImage}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) uploadInlineImage(file, editor)
                e.target.value = ''
              }}
            />
          </label>
        )}
      </div>

      {linkMenuOpen && <LinkMenu editor={editor} onClose={() => setLinkMenuOpen(false)} />}
      {imagePanelOpen && selectedImage && (
        <ImagePanel editor={editor} pos={selectedImage.pos} attrs={selectedImage.attrs} onClose={() => setImagePanelOpen(false)} />
      )}

      <div
        className="max-h-[70vh] overflow-y-auto"
        // Capture fáze proběhne dřív, než se k dané události vůbec dostane
        // cokoliv uvnitř editoru (i interní logika Tiptapu) — nejspolehlivější
        // způsob, jak zaručit, že klik na odkaz v editoru nikdy nic neotevře.
        onClickCapture={e => {
          if ((e.target as HTMLElement).closest('a')) {
            e.preventDefault()
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function ToolbarButton({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
    >
      {children}
    </button>
  )
}
