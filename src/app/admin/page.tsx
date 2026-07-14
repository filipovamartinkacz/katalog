import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Administrace</h1>
      <div className="mt-6 flex flex-wrap gap-4">
        <Link href="/admin/medailonky" className={buttonVariants({ variant: 'outline-admin' }) + ' h-auto w-fit flex-col items-center gap-0 px-7 py-1.5 text-center'}>
          <span className="text-lg font-medium">Profily</span>
          <span className="text-xs font-normal">Schvalovat a spravovat medailonky</span>
        </Link>
        <Link href="/admin/metody" className={buttonVariants({ variant: 'outline-admin' }) + ' h-auto w-fit flex-col items-center gap-0 px-7 py-1.5 text-center'}>
          <span className="text-lg font-medium">Metody</span>
          <span className="text-xs font-normal">Schvalovat navržené metody</span>
        </Link>
        <Link href="/admin/clanky" className={buttonVariants({ variant: 'outline-admin' }) + ' h-auto w-fit flex-col items-center gap-0 px-7 py-1.5 text-center'}>
          <span className="text-lg font-medium">Blog</span>
          <span className="text-xs font-normal">Schvalovat, upravovat a zakládat články</span>
        </Link>
        <Link href="/admin/blazena" className={buttonVariants({ variant: 'outline-admin' }) + ' h-auto w-fit flex-col items-center gap-0 px-7 py-1.5 text-center'}>
          <span className="text-lg font-medium">Průvodkyně Blažená</span>
          <span className="text-xs font-normal">Editovat mapování pocitů a oblastí na kategorie</span>
        </Link>
      </div>
    </div>
  )
}
