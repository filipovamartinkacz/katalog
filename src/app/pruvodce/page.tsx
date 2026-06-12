import { getBlazenaConfig } from '@/app/actions/admin-blazena'
import { PruvodceWizard } from './wizard'
import Link from 'next/link'

export default async function PruvodcePage() {
  const config = await getBlazenaConfig()

  if (!config) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Průvodkyně není momentálně dostupná.</p>
        <Link href="/katalog" className="mt-4 inline-block text-primary hover:underline">
          Přejít do katalogu →
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Průvodkyně
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">
          Ahoj, jsem Blažena.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Pomohu ti najít správnou podporu — i když ještě nevíš, jakou přesně potřebuješ.
          Zabere nám to asi 2 minuty.
        </p>
      </div>
      <PruvodceWizard config={config} />
    </div>
  )
}
