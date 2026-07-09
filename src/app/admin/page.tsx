import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Admin</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/medailonky" className={buttonVariants({ variant: 'outline' }) + ' h-auto flex-col items-start gap-1 p-5 text-left'}>
          <span className="font-semibold">Profily</span>
          <span className="text-sm text-muted-foreground font-normal">Schvalovat a spravovat medailonky</span>
        </Link>
        <Link href="/admin/metody" className={buttonVariants({ variant: 'outline' }) + ' h-auto flex-col items-start gap-1 p-5 text-left'}>
          <span className="font-semibold">Metody</span>
          <span className="text-sm text-muted-foreground font-normal">Schvalovat navržené metody z importu</span>
        </Link>
        <Link href="/admin/import" className={buttonVariants({ variant: 'outline' }) + ' h-auto flex-col items-start gap-1 p-5 text-left'}>
          <span className="font-semibold">Import medailonku z JSON</span>
          <span className="text-sm text-muted-foreground font-normal">Nahrát profil sestavený AI asistentem</span>
        </Link>
        <Link href="/admin/blazena" className={buttonVariants({ variant: 'outline' }) + ' h-auto flex-col items-start gap-1 p-5 text-left'}>
          <span className="font-semibold">Průvodkyně Blažena</span>
          <span className="text-sm text-muted-foreground font-normal">Editovat mapování pocitů a oblastí na kategorie</span>
        </Link>
        <Link href="/admin/clanky" className={buttonVariants({ variant: 'outline' }) + ' h-auto flex-col items-start gap-1 p-5 text-left'}>
          <span className="font-semibold">Blog</span>
          <span className="text-sm text-muted-foreground font-normal">Schvalovat, upravovat a zakládat články</span>
        </Link>
      </div>
    </div>
  )
}
