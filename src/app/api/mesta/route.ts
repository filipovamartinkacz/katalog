import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const supabase = await createClient()
  const { data } = await supabase
    .from('mesto')
    .select('id, nazev, okres:okres_id(nazev, kraj:kraj_id(nazev))')
    .ilike('nazev', `${q}%`)
    .limit(8)

  return NextResponse.json(data ?? [])
}
