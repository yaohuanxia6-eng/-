import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aiClient, CHAT_MODEL } from '@/lib/deepseek/client'
import { MEMORY_EXTRACT_PROMPT } from '@/lib/deepseek/prompts'
import { MemoryFact } from '@/types'

export const runtime = 'nodejs'

/** POST /api/memory/extract — 从会话中 AI 提炼记忆事实 */
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const { session_id } = await req.json() as { session_id: string }
  if (!session_id) return NextResponse.json({ error: '缺少 session_id' }, { status: 400 })

  const admin = createAdminClient()

  // 读取会话消息
  const { data: session } = await admin
    .from('sessions')
    .select('messages')
    .eq('id', session_id)
    .eq('user_id', user.id)
    .single()

  const msgs = (session?.messages ?? []) as Array<{ role: string; content: string }>
  if (msgs.length < 4) {
    // 消息太少，跳过
    return NextResponse.json({ ok: true, skipped: true })
  }

  // 构造对话文本
  const dialog = msgs
    .map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
    .join('\n')

  // 调用 AI 提炼
  let newFacts: MemoryFact[] = []
  try {
    const response = await aiClient.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      max_tokens: 400,
      messages: [{ role: 'user', content: `${MEMORY_EXTRACT_PROMPT}\n\n${dialog}` }],
    })
    const raw = response.choices[0]?.message?.content ?? '[]'
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) newFacts = parsed
  } catch {
    // AI 解析失败，静默跳过
    return NextResponse.json({ ok: true, skipped: true })
  }

  if (newFacts.length === 0) return NextResponse.json({ ok: true, skipped: true })

  const now = new Date().toISOString()
  newFacts = newFacts.map(f => ({ ...f, updated_at: now }))

  // 读取现有记忆
  const { data: memRow } = await admin
    .from('memory_summary')
    .select('key_facts')
    .eq('user_id', user.id)
    .single()

  let existing: MemoryFact[] = (memRow?.key_facts as MemoryFact[]) ?? []

  // 合并规则：同类别最多 3 条，总量最多 10 条
  for (const nf of newFacts) {
    const sameCat = existing.filter(f => f.category === nf.category)
    if (sameCat.length >= 3) {
      const oldest = sameCat.sort((a, b) =>
        (a.updated_at ?? '').localeCompare(b.updated_at ?? '')
      )[0]
      existing = existing.filter(f => f !== oldest)
    }
    existing.push(nf)
  }
  if (existing.length > 10) {
    existing = existing
      .sort((a, b) => (a.updated_at ?? '').localeCompare(b.updated_at ?? ''))
      .slice(-10)
  }

  // upsert
  if (memRow) {
    await admin
      .from('memory_summary')
      .update({ key_facts: existing, updated_at: now })
      .eq('user_id', user.id)
  } else {
    await admin
      .from('memory_summary')
      .insert({ user_id: user.id, key_facts: existing, updated_at: now })
  }

  return NextResponse.json({ ok: true, extracted: newFacts.length, total: existing.length })
}
