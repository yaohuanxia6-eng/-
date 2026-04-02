// app/api/chat/route.ts — Kimi 流式对话接口（含消息持久化）

import { NextRequest, NextResponse } from 'next/server'
import { aiClient, CHAT_MODEL } from '@/lib/deepseek/client'
import { buildChatSystemPrompt } from '@/lib/deepseek/prompts'
import { detectCrisis } from '@/lib/crisis/detector'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EmotionType, MemoryFact } from '@/types'

export const runtime = 'nodejs'

// 简易内存频率限制：每用户每分钟最多 10 次请求
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 60 * 1000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

/** 从 AI 回复中推断情绪类型（AI 在步骤 4 会明确命名情绪） */
function detectEmotionFromText(text: string): EmotionType | null {
  if (text.includes('焦虑') || text.includes('紧张')) return '焦虑'
  if (text.includes('低落') || text.includes('难过') || text.includes('沮丧') || text.includes('悲伤')) return '低落'
  if (text.includes('愉悦') || text.includes('开心') || text.includes('高兴') || text.includes('喜悦')) return '愉悦'
  if (text.includes('平静') || text.includes('平和') || text.includes('还不错') || text.includes('挺好')) return '平静'
  if (text.includes('空虚') || text.includes('迷茫') || text.includes('无聊') || text.includes('空洞')) return '空虚'
  if (text.includes('混乱') || text.includes('烦躁') || text.includes('纠结') || text.includes('烦乱')) return '混乱'
  return null
}

/** 从 AI 回复中提取微行动（与客户端逻辑保持一致） */
function extractMicroAction(text: string): string | null {
  const patterns = [
    /今天可以[：:]\s*(.+?)(?:\n|$)/,
    /微行动[：:]\s*(.+?)(?:\n|$)/,
    /试着(.{6,30})(?:\n|$)/,
    /可以试试(.{4,25})(?:\n|$)/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1].trim()
  }
  return null
}

export async function POST(req: NextRequest) {
  // 鉴权
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  // 频率限制
  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: '请求太频繁，请稍后再试' }, { status: 429 })
  }

  const { messages, memory = [], yesterdayAction, session_id } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    memory?: MemoryFact[]
    yesterdayAction?: string
    session_id?: string
  }

  // 输入校验
  if (messages.length > 30) {
    return NextResponse.json({ error: '对话太长了，开启新对话吧' }, { status: 400 })
  }
  const lastMsg = messages[messages.length - 1]
  if (lastMsg && lastMsg.content.length > 2000) {
    return NextResponse.json({ error: '消息太长了，精简一下吧' }, { status: 400 })
  }

  // 危机检测（只看最后一条用户消息）
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  const crisis = lastUserMsg ? detectCrisis(lastUserMsg.content) : false

  // 构建系统提示
  const systemPrompt = buildChatSystemPrompt(memory, yesterdayAction)

  // 调用 Kimi streaming
  const stream = await aiClient.chat.completions.create({
    model: CHAT_MODEL,
    stream: true,
    temperature: 0.8,
    max_tokens: 200,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  })

  // 捕获关键值供闭包使用
  const userId = user.id
  const currentUserContent = lastMsg?.content ?? ''
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      // 危机信号优先发出
      if (crisis) {
        controller.enqueue(encoder.encode(`data: {"crisis":true}\n\n`))
      }

      let accumulated = ''
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) {
          accumulated += delta
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: delta })}\n\n`))
        }
        if (chunk.choices[0]?.finish_reason === 'stop') {
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
        }
      }

      // ── 流结束后持久化到 Supabase ────────────────────────────
      if (session_id) {
        try {
          const admin = createAdminClient()

          // 读取现有消息
          const { data: sessionRow } = await admin
            .from('sessions')
            .select('messages')
            .eq('id', session_id)
            .eq('user_id', userId)
            .single()

          const existing = (sessionRow?.messages ?? []) as Array<{ role: string; content: string; timestamp: string }>
          const ts = new Date().toISOString()
          const updated = [
            ...existing,
            { role: 'user', content: currentUserContent, timestamp: ts },
            { role: 'ai',   content: accumulated,         timestamp: ts },
          ]

          const microAction = extractMicroAction(accumulated)
          const emotionType = crisis ? '危机' : detectEmotionFromText(accumulated)

          const patch: Record<string, unknown> = { messages: updated }
          if (microAction) patch.micro_action = microAction
          if (emotionType) patch.emotion_type  = emotionType

          await admin
            .from('sessions')
            .update(patch)
            .eq('id', session_id)
            .eq('user_id', userId)
        } catch (e) {
          // 持久化失败不影响用户体验，仅记录
          console.error('[chat] save error:', e)
        }
      }

      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
