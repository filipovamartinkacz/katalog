import { getBlazenaConfig } from '@/app/actions/admin-blazena'
import { PruvodceWizard } from './wizard'
import Link from 'next/link'

export default async function PruvodcePage() {
  const config = await getBlazenaConfig()

  if (!config) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-foreground">Průvodkyně není momentálně dostupná.</p>
        <Link href="/katalog" className="mt-4 inline-block text-primary hover:underline">
          Přejít do katalogu →
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          Jsem Blažená, tvá průvodkyně
        </h1>
        <p className="mt-3 text-lg font-medium text-foreground">
          Pomohu ti najít správnou podporu — i když ještě nevíš, jakou přesně potřebuješ.
          Zabere nám to asi 2 minuty.
        </p>
      </div>
      <PruvodceWizard config={config} />
    </div>
  )
}
