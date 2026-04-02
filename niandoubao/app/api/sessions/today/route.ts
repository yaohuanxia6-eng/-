import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/** POST /api/sessions/today — 获取或创建今日会话 */
export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // 先查已有会话
  const { data: existing } = await admin
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('session_date', today)
    .single()

  if (existing) return NextResponse.json(existing)

  // 创建新会话
  const { data: created, error } = await admin
    .from('sessions')
    .insert({ user_id: user.id, session_date: today, messages: [], status: 'in_progress' })
    .select()
    .single()

  if (error) {
    // 唯一约束冲突（并发）—— 重新查一次
    const { data: retry } = await admin
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_date', today)
      .single()
    if (retry) return NextResponse.json(retry)
    return NextResponse.json({ error: '创建会话失败' }, { status: 500 })
  }

  return NextResponse.json(created)
}
