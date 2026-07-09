import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ClanekEditor } from '@/components/clanek/editor/clanek-editor'

export default async function AdminNovyClanekPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()
  const [{ data: kategorie }, { data: metody }] = await Promise.all([
    admin.from('kategorie').select('id, nazev').order('nazev'),
    admin.from('metoda').select('id, nazev, ma_ochrannou_znamku').eq('status', 'aktivni').order('nazev'),
  ])

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/clanky" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        ← Zpět na Blog
      </Link>
      <h1 className="text-2xl font-bold">Nový článek</h1>
      <ClanekEditor
        mode="create"
        userId={user?.id ?? ''}
        kategorie={kategorie ?? []}
        metody={metody ?? []}
        isAdminMode
      />
    </div>
  )
}
