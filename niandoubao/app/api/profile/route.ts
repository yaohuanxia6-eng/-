import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/** GET /api/profile — 获取用户资料 */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!data) {
    return NextResponse.json({
      id: user.id,
      email: user.email ?? '',
      nickname: user.email?.split('@')[0] ?? '小豆包',
      reminder_email: user.email ?? '',
      reminder_time: '21:00',
      reminder_enabled: false,
      created_at: user.created_at,
    })
  }

  return NextResponse.json({
    ...data,
    email: user.email ?? data.email ?? '',
    // TIME 类型在 Postgres 返回 "HH:MM:SS"，截成 "HH:MM"
    reminder_time: typeof data.reminder_time === 'string'
      ? data.reminder_time.slice(0, 5)
      : '21:00',
  })
}

/** PUT /api/profile — 保存用户资料（upsert） */
export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const body = await req.json() as {
    nickname?: string
    reminder_email?: string
    reminder_time?: string
    reminder_enabled?: boolean
  }

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  const now = new Date().toISOString()

  if (existing) {
    const patch: Record<string, unknown> = { updated_at: now }
    if (body.nickname !== undefined)
      patch.nickname = body.nickname.trim().slice(0, 50) || '小豆包'
    if (body.reminder_email !== undefined) patch.reminder_email = body.reminder_email
    if (body.reminder_time !== undefined)  patch.reminder_time  = body.reminder_time
    if (body.reminder_enabled !== undefined) patch.reminder_enabled = body.reminder_enabled

    const { error } = await admin.from('user_profiles').update(patch).eq('id', user.id)
    if (error) return NextResponse.json({ error: '保存失败' }, { status: 500 })
  } else {
    const { error } = await admin.from('user_profiles').insert({
      id: user.id,
      email: user.email ?? '',
      nickname: (body.nickname ?? '').trim().slice(0, 50) || '小豆包',
      reminder_email: body.reminder_email ?? user.email ?? '',
      reminder_time:  body.reminder_time  ?? '21:00',
      reminder_enabled: body.reminder_enabled ?? false,
    })
    if (error) return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
