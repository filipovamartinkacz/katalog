import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const supabase = await createClient()
  const { data } = await supabase
    .from('medailonek')
    .select('id, jmeno, prijmeni, display_name, foto_url')
    .eq('is_published', true)
    .or(`jmeno.ilike.%${q}%,prijmeni.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(8)

  return NextResponse.json(data ?? [])
}
