import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/** PUT /api/sessions/[id]/complete — 标记会话已完成 */
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin
    .from('sessions')
    .update({ status: 'completed' })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: '操作失败' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
