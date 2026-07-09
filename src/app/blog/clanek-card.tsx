import Link from 'next/link'
import Image from 'next/image'
import { Rss, Mic, Video } from 'lucide-react'

export type ClanekCardData = {
  id: string
  slug: string
  nadpis: string
  cover_url: string
  typ: 'blog' | 'podcast' | 'video'
  published_at: string | null
  kategorie?: { nazev: string } | null
  autorka?: { jmeno: string; prijmeni: string } | null
}

const TYP_ICON = { blog: Rss, podcast: Mic, video: Video }
const TYP_LABEL = { blog: 'Článek', podcast: 'Podcast', video: 'Video' }

export function ClanekCard({ clanek }: { clanek: ClanekCardData }) {
  const Icon = TYP_ICON[clanek.typ]

  return (
    <Link
      href={`/blog/${clanek.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
    >
      <div className="relative h-40 w-full overflow-hidden bg-muted">
        <Image
          src={clanek.cover_url}
          alt=""
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, 360px"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">
          <Icon className="h-3.5 w-3.5" /> {TYP_LABEL[clanek.typ]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {clanek.kategorie && (
          <span className="text-xs font-medium text-primary">{clanek.kategorie.nazev}</span>
        )}
        <h3 className="font-semibold leading-snug">{clanek.nadpis}</h3>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
          {clanek.autorka && <span>{clanek.autorka.jmeno} {clanek.autorka.prijmeni}</span>}
          {clanek.published_at && <span>{new Date(clanek.published_at).toLocaleDateString('cs-CZ')}</span>}
        </div>
      </div>
    </Link>
  )
}
