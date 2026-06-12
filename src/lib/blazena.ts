export type PocitItem = {
  id: string
  label: string
  emoji?: string
  katSlugy: string[]
}

export type OblastItem = {
  id: string
  label: string
  emoji?: string
  katSlugy: string[]
}

export type BlazenaConfig = {
  pocity: PocitItem[]
  oblasti: OblastItem[]
}

/** Vrátí unikátní set slug kategorií na základě vybraných pocitů a oblastí. */
export function resolveKatSlugy(
  config: BlazenaConfig,
  pocityIds: string[],
  oblastiIds: string[]
): string[] {
  const slugs = new Set<string>()
  for (const id of pocityIds) {
    config.pocity.find(p => p.id === id)?.katSlugy.forEach(s => slugs.add(s))
  }
  for (const id of oblastiIds) {
    config.oblasti.find(o => o.id === id)?.katSlugy.forEach(s => slugs.add(s))
  }
  return [...slugs]
}
