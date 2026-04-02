import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/** GET /api/memory — 获取用户记忆 */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('memory_summary')
    .select('key_facts, updated_at')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({
    user_id: user.id,
    key_facts: data?.key_facts ?? [],
    updated_at: data?.updated_at ?? null,
  })
}
