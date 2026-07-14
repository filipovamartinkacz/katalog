import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/prihlaseni')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  if (!adminEmails.includes(user.email?.toLowerCase() ?? '')) {
    redirect('/')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {children}
    </div>
  )
}
