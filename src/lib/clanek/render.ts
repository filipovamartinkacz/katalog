import { generateHTML } from '@tiptap/html'
import type { JSONContent } from '@tiptap/core'
import { getClanekExtensions } from './tiptap-extensions'

// Server-side render Tiptap JSON → HTML, bez DOM/jsdom (generateHTML z @tiptap/html).
// Používá se v /blog/[slug] pro SEO — obsah musí být v initial HTML, ne client-render.
export function renderClanekHtml(obsah: JSONContent): string {
  return generateHTML(obsah, getClanekExtensions({ interactive: false }))
}
