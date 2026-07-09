import type { JSONContent } from '@tiptap/core'
import { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

function collectClanekIds(node: JSONContent, ids: Set<string>) {
  node.marks?.forEach(mark => {
    if (mark.type === 'link' && typeof mark.attrs?.clanekId === 'string') {
      ids.add(mark.attrs.clanekId)
    }
  })
  node.content?.forEach(child => collectClanekIds(child, ids))
}

function rewriteHrefs(node: JSONContent, slugById: Map<string, string>): JSONContent {
  const marks = node.marks?.map(mark => {
    if (mark.type === 'link' && typeof mark.attrs?.clanekId === 'string') {
      const slug = slugById.get(mark.attrs.clanekId)
      if (slug) return { ...mark, attrs: { ...mark.attrs, href: `/blog/${slug}` } }
    }
    return mark
  })

  return {
    ...node,
    ...(marks ? { marks } : {}),
    ...(node.content ? { content: node.content.map(child => rewriteHrefs(child, slugById)) } : {}),
  }
}

// Interní odkazy na jiné články ukládají clanek_id, ne pevné href (slug je editovatelný
// adminem i po publikaci) — aktuální URL se dořeší tady, těsně před vykreslením.
export async function resolveInternalLinks(doc: JSONContent, supabase: SupabaseClient): Promise<JSONContent> {
  const ids = new Set<string>()
  collectClanekIds(doc, ids)
  if (ids.size === 0) return doc

  const { data } = await supabase
    .from('clanek')
    .select('id, slug')
    .in('id', [...ids])
    .eq('status', 'publikovano')

  const slugById = new Map((data ?? []).map((c: { id: string; slug: string }) => [c.id, c.slug]))
  if (slugById.size === 0) return doc

  return rewriteHrefs(doc, slugById)
}
