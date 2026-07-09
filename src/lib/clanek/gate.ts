import type { JSONContent } from '@tiptap/core'

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

export function countTotalWords(doc: JSONContent): number {
  let total = 0
  function visit(node: JSONContent) {
    if (typeof node.text === 'string') total += countWords(node.text)
    node.content?.forEach(visit)
  }
  visit(doc)
  return total
}

// Ořízne Tiptap JSON strom na daný počet slov — pracuje na stromu, ne na vykresleném
// HTML řetězci, takže nikdy neuřízne uprostřed tagu ani nenechá neuzavřený seznam/citaci.
function walkAndTruncate(node: JSONContent, remaining: { count: number }): JSONContent | null {
  if (remaining.count <= 0) return null

  if (typeof node.text === 'string') {
    const words = node.text.split(/\s+/).filter(Boolean)
    if (words.length <= remaining.count) {
      remaining.count -= words.length
      return { ...node }
    }
    const sliced = words.slice(0, remaining.count).join(' ')
    remaining.count = 0
    return { ...node, text: sliced }
  }

  if (Array.isArray(node.content)) {
    const newContent: JSONContent[] = []
    for (const child of node.content) {
      if (remaining.count <= 0) break
      const truncatedChild = walkAndTruncate(child, remaining)
      if (truncatedChild) newContent.push(truncatedChild)
    }
    return { ...node, content: newContent }
  }

  return { ...node }
}

export function truncateContentByWords(
  doc: JSONContent,
  maxWords: number
): { truncated: JSONContent; totalWords: number; wasTruncated: boolean } {
  const totalWords = countTotalWords(doc)
  if (totalWords <= maxWords) {
    return { truncated: doc, totalWords, wasTruncated: false }
  }
  const remaining = { count: maxWords }
  const truncated = walkAndTruncate(doc, remaining) ?? { type: 'doc', content: [] }
  return { truncated, totalWords, wasTruncated: true }
}
