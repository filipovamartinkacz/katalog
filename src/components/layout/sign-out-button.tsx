'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { buttonVariants } from '@/components/ui/button'

export function SignOutButton() {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button type="button" onClick={signOut} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
      Odhlásit se
    </button>
  )
}
