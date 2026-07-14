import { getBlazenaConfig } from '@/app/actions/admin-blazena'
import { BlazenaEditor } from './editor'

export default async function AdminBlazenaPage() {
  const config = await getBlazenaConfig()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Průvodkyně Blažená — konfigurace</h1>
        <p className="mt-2 text-lg font-medium text-foreground max-w-prose">
          Mapování pocitů a oblastí na kategorie katalogu. Editujte JSON a uložte —
          změny se projeví okamžitě ve wizardu na stránce <code>/pruvodce</code>.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
        <p className="font-medium mb-1">Struktura</p>
        <pre className="text-xs text-muted-foreground leading-relaxed">{`{
  "pocity": [{ "id": "...", "label": "...", "emoji": "...", "katSlugy": ["masaze", ...] }],
  "oblasti": [{ "id": "...", "label": "...", "emoji": "...", "katSlugy": ["terapie", ...] }]
}`}</pre>
      </div>
      <BlazenaEditor initialConfig={config} />
    </div>
  )
}
