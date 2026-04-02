import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/** GET /api/sessions/history — 近 90 天会话记录（用于情绪可视化） */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const admin = createAdminClient()
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString().split('T')[0]

  const { data, error } = await admin
    .from('sessions')
    .select('id, session_date, emotion_type, micro_action, micro_action_done, status, created_at')
    .eq('user_id', user.id)
    .gte('session_date', since)
    .order('session_date', { ascending: true })

  if (error) return NextResponse.json({ error: '获取记录失败' }, { status: 500 })
  return NextResponse.json(data ?? [])
}
