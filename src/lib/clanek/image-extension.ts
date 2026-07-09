import Image from '@tiptap/extension-image'

type AttributeConfig = {
  default?: unknown
  parseHTML?: (element: HTMLElement) => unknown
  renderHTML?: (attrs: Record<string, unknown>) => Record<string, unknown>
}

// Rozšiřuje standardní Image o šířku v procentech stránky (10–100).
export const ClanekImage = Image.extend({
  addAttributes() {
    const parentAttrs = (this.parent?.() ?? {}) as Record<string, AttributeConfig>
    return {
      ...parentAttrs,
      width: {
        default: 100,
        parseHTML: (element: HTMLElement) => {
          const raw = element.style.width || element.getAttribute('width') || '100'
          const n = parseInt(raw, 10)
          return Number.isFinite(n) ? n : 100
        },
        renderHTML: (attrs: Record<string, unknown>) => {
          const width = typeof attrs.width === 'number' ? attrs.width : 100
          return { style: `width: ${width}%;` }
        },
      },
    }
  },
})
