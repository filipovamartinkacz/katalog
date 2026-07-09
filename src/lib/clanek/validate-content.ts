// Ruční validace Tiptap JSON obsahu článku — obsah přichází ze serverové akce
// jako klientem kontrolovaný JSON, takže se nedá důvěřovat beze změny.
// Povoluje jen typy uzlů/značek, které skutečně používá editor (viz tiptap-extensions.ts),
// a odmítá nebezpečné href/src hodnoty (např. javascript:).

const ALLOWED_NODES = new Set([
  'doc', 'paragraph', 'text', 'heading', 'bulletList', 'orderedList', 'listItem',
  'blockquote', 'image', 'hardBreak',
])

const ALLOWED_MARKS = new Set(['bold', 'italic', 'link'])

type JsonNode = {
  type?: string
  text?: string
  content?: JsonNode[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  attrs?: Record<string, unknown>
}

function isSafeUrl(url: unknown): url is string {
  return typeof url === 'string' && url.length > 0 && (/^https?:\/\//.test(url) || url.startsWith('/'))
}

function walk(node: unknown): JsonNode | null {
  if (!node || typeof node !== 'object') return null
  const n = node as JsonNode

  if (n.type && n.type !== 'doc' && !ALLOWED_NODES.has(n.type)) return null

  const clean: JsonNode = { type: n.type ?? 'paragraph' }

  if (typeof n.text === 'string') clean.text = n.text

  if (n.type === 'image') {
    if (!isSafeUrl(n.attrs?.src)) return null
    const width = typeof n.attrs?.width === 'number' ? n.attrs.width : 100
    clean.attrs = {
      src: n.attrs?.src,
      alt: typeof n.attrs?.alt === 'string' ? n.attrs.alt : '',
      width: Math.min(100, Math.max(10, width)),
    }
  }

  if (n.type === 'heading') {
    const level = n.attrs?.level
    clean.attrs = { level: level === 3 ? 3 : 2 }
  }

  if (Array.isArray(n.marks)) {
    clean.marks = n.marks
      .filter(m => ALLOWED_MARKS.has(m.type))
      .map(m => {
        if (m.type !== 'link') return { type: m.type }
        if (!isSafeUrl(m.attrs?.href)) return null
        return {
          type: 'link',
          attrs: {
            href: m.attrs?.href,
            asButton: m.attrs?.asButton === true,
            clanekId: typeof m.attrs?.clanekId === 'string' ? m.attrs.clanekId : null,
          },
        }
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
  }

  if (Array.isArray(n.content)) {
    clean.content = n.content.map(walk).filter((c): c is JsonNode => c !== null)
  }

  return clean
}

export function validateClanekContent(doc: unknown): JsonNode {
  const result = walk(doc)
  return result ?? { type: 'doc', content: [] }
}
