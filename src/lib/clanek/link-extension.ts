import Link, { type LinkOptions } from '@tiptap/extension-link'

export type ClanekLinkOptions = LinkOptions & {
  // Safari na rozdíl od Chromu prokliká odkazy v contenteditable i přes
  // openOnClick:false — jediná spolehlivá obrana je nevykreslovat href do
  // DOM v editoru vůbec (odkaz v uloženém dokumentu zůstává beze změny).
  suppressHrefInDom: boolean
}

type AttributeConfig = {
  default?: unknown
  parseHTML?: (element: HTMLElement) => unknown
  renderHTML?: (attrs: Record<string, unknown>) => Record<string, unknown>
}

// Rozšiřuje standardní Link o dva atributy nezávislé na sobě:
// - asButton: vizuální styl (text vs. tlačítko), nastavitelný u jakéhokoli odkazu
// - clanekId: u interních odkazů na jiný článek — slug je editovatelný adminem,
//   takže se href dořeší až při vykreslení (viz resolve-links.ts), ne při ukládání.
export const ClanekLink = Link.extend<ClanekLinkOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      suppressHrefInDom: false,
    } as ClanekLinkOptions
  },
  addAttributes() {
    const parentAttrs = (this.parent?.() ?? {}) as Record<string, AttributeConfig>
    return {
      ...parentAttrs,
      href: {
        ...(parentAttrs.href ?? {}),
        renderHTML: (attrs: Record<string, unknown>) => {
          if (this.options.suppressHrefInDom) return {}
          return attrs.href ? { href: attrs.href } : {}
        },
      },
      asButton: {
        default: false,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-as-button') === 'true',
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.asButton ? { 'data-as-button': 'true', class: 'clanek-link-btn' } : {},
      },
      clanekId: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-clanek-id'),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.clanekId ? { 'data-clanek-id': attrs.clanekId } : {},
      },
    }
  },
})
