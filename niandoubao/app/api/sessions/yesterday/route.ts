import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/** GET /api/sessions/yesterday — 获取昨日会话（用于追问微行动） */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const admin = createAdminClient()
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]

  const { data } = await admin
    .from('sessions')
    .select('id, session_date, emotion_type, micro_action, micro_action_done, status')
    .eq('user_id', user.id)
    .eq('session_date', yesterday)
    .single()

  return NextResponse.json(data ?? null)
}
