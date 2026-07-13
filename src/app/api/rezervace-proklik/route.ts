import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { medailonekId, serviceId } = await request.json()
    if (typeof medailonekId !== 'string') return NextResponse.json({ ok: false })

    const supabase = await createClient()
    await supabase.from('rezervace_proklik').insert({
      medailonek_id: medailonekId,
      service_id: typeof serviceId === 'number' ? serviceId : null,
    })
  } catch {
    // sledování prokliku nesmí nikdy prosáknout jako chyba uživatelce
  }
  return NextResponse.json({ ok: true })
}
