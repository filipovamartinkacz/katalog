'use client'

import { useState, useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import { getMarkRange } from '@tiptap/core'
import { buttonVariants } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type SearchResult = { id: string; nadpis: string; slug: string }

const KATALOG_STRANKY = [
  { label: 'Domů', href: '/' },
  { label: 'Katalog', href: '/katalog' },
  { label: 'Průvodce', href: '/pruvodce' },
  { label: 'Pro podnikatelky', href: '/pro-podnikatelky' },
]

type Props = {
  editor: Editor
  onClose: () => void
}

export function LinkMenu({ editor, onClose }: Props) {
  const [mode, setMode] = useState<'interni' | 'externi'>('interni')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [externalUrl, setExternalUrl] = useState('')
  const [externalLabel, setExternalLabel] = useState('')
  const [asButton, setAsButton] = useState(false)
  const [currentLabel, setCurrentLabel] = useState<string | null>(null)
  const [hasExistingLink, setHasExistingLink] = useState(false)
  const [existingRange, setExistingRange] = useState<{ from: number; to: number } | null>(null)

  // Při otevření panelu na už existujícím odkazu předvyplní správný režim,
  // cíl i viditelný text, ať se dá upravit stejně snadno jako při vytváření —
  // ne jen zadat znovu od nuly.
  useEffect(() => {
    const attrs = editor.getAttributes('link') as { href?: string; clanekId?: string; asButton?: boolean }
    if (!attrs.href) return

    setHasExistingLink(true)
    setAsButton(!!attrs.asButton)

    const linkType = editor.schema.marks.link
    const range = linkType ? getMarkRange(editor.state.selection.$from, linkType) : undefined
    if (range) {
      setExistingRange(range)
      setExternalLabel(editor.state.doc.textBetween(range.from, range.to, ''))
    }

    if (attrs.clanekId) {
      setMode('interni')
      setCurrentLabel('Načítám…')
      createClient()
        .from('clanek')
        .select('nadpis, slug')
        .eq('id', attrs.clanekId)
        .maybeSingle()
        .then(({ data }) => {
          setCurrentLabel(data ? `${data.nadpis} (/blog/${data.slug})` : `(článek už neexistuje: ${attrs.href})`)
        })
      return
    }

    const stranka = KATALOG_STRANKY.find(s => s.href === attrs.href)
    if (stranka) {
      setMode('interni')
      setCurrentLabel(`${stranka.label} (${stranka.href})`)
      return
    }

    setMode('externi')
    setExternalUrl(attrs.href)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (mode !== 'interni' || query.trim().length < 2) { setResults([]); return }
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/clanky/hledat?q=${encodeURIComponent(query.trim())}`)
      setResults(await res.json())
    }, 250)
    return () => clearTimeout(handle)
  }, [mode, query])

  function removeLink() {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    onClose()
  }

  function applyLink(href: string, label: string, clanekId?: string) {
    let chain = editor.chain().focus()

    if (existingRange) {
      // Úprava existujícího odkazu — vždy nahradí jeho text novým popiskem.
      chain = chain
        .insertContentAt(existingRange, label)
        .setTextSelection({ from: existingRange.from, to: existingRange.from + label.length })
    } else {
      const { from, to } = editor.state.selection
      const hasSelection = from !== to
      if (!hasSelection) {
        chain = chain.insertContentAt(from, label).setTextSelection({ from, to: from + label.length })
      }
    }

    chain
      .extendMarkRange('link')
      .setLink({ href, asButton, clanekId: clanekId ?? null } as never)
      .run()
    onClose()
  }

  function insertExternal() {
    const url = externalUrl.trim()
    if (!/^https?:\/\//.test(url)) { alert('Odkaz musí začínat http:// nebo https://'); return }
    applyLink(url, externalLabel.trim() || url)
  }

  // U existujícího odkazu vždy nabídnout editovatelný popisek (předvyplněný
  // aktuálním textem) — jen u zcela nového odkazu se řídí podle výběru textu.
  const showLabelInput = hasExistingLink || editor.state.selection.from === editor.state.selection.to

  const filteredStranky = KATALOG_STRANKY.filter(s => s.label.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="border-b border-t border-border bg-muted/30 p-3">
      <div className="mb-2 flex gap-1">
        <button
          type="button"
          onClick={() => setMode('interni')}
          className={`rounded px-2 py-1 text-xs font-medium ${mode === 'interni' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
        >
          Interní odkaz
        </button>
        <button
          type="button"
          onClick={() => setMode('externi')}
          className={`rounded px-2 py-1 text-xs font-medium ${mode === 'externi' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
        >
          Externí URL
        </button>
        <button type="button" onClick={onClose} className="ml-auto rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
          Zavřít
        </button>
      </div>

      {mode === 'interni' ? (
        <div className="flex flex-col gap-1.5">
          {currentLabel && (
            <p className="text-xs text-muted-foreground">
              Aktuální odkaz: <span className="font-medium text-foreground">{currentLabel}</span>
            </p>
          )}
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Hledat článek nebo stránku katalogu…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {(filteredStranky.length > 0 || results.length > 0) && (
            <ul className="max-h-48 overflow-y-auto rounded-lg border border-border bg-background">
              {filteredStranky.map(s => (
                <li key={s.href}>
                  <button
                    type="button"
                    onClick={() => applyLink(s.href, s.label)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  >
                    {s.label} <span className="text-xs text-muted-foreground">{s.href}</span>
                  </button>
                </li>
              ))}
              {results.map(r => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => applyLink(`/blog/${r.slug}`, r.nadpis, r.id)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  >
                    {r.nadpis} <span className="text-xs text-muted-foreground">/blog/{r.slug}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <input
            type="url"
            value={externalUrl}
            onChange={e => setExternalUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {showLabelInput ? (
            <input
              type="text"
              value={externalLabel}
              onChange={e => setExternalLabel(e.target.value)}
              placeholder="Popisek odkazu (nepovinné, jinak se použije URL)…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          ) : (
            <p className="text-xs text-muted-foreground">Jako popisek se použije označený text v článku.</p>
          )}
          <button type="button" onClick={insertExternal} className={buttonVariants({ variant: 'admin', size: 'sm' }) + ' self-start'}>
            Vložit
          </button>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={asButton} onChange={e => setAsButton(e.target.checked)} />
          Zobrazit jako tlačítko
        </label>
        {hasExistingLink && (
          <button type="button" onClick={removeLink} className="text-xs font-medium text-foreground hover:underline">
            Odebrat odkaz
          </button>
        )}
      </div>
    </div>
  )
}
