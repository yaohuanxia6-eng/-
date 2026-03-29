// app/api/chat/route.ts — Kimi 流式对话接口

import { NextRequest, NextResponse } from 'next/server'
import { aiClient, CHAT_MODEL } from '@/lib/deepseek/client'
import { buildChatSystemPrompt } from '@/lib/deepseek/prompts'
import { detectCrisis } from '@/lib/crisis/detector'
import { MemoryFact } from '@/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// 简易内存频率限制：每用户每分钟最多 10 次请求
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 60 * 1000 // 1 分钟

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

export async function POST(req: NextRequest) {
  // 鉴权：验证用户登录状态
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  // 频率限制
  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: '请求太频繁，请稍后再试' }, { status: 429 })
  }

  const { messages, memory = [], yesterdayAction } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    memory?: MemoryFact[]
    yesterdayAction?: string
  }

  // 输入校验：限制消息数量和长度
  if (messages.length > 30) {
    return NextResponse.json({ error: '对话太长了，开启新对话吧' }, { status: 400 })
  }
  const lastMsg = messages[messages.length - 1]
  if (lastMsg && lastMsg.content.length > 2000) {
    return NextResponse.json({ error: '消息太长了，精简一下吧' }, { status: 400 })
  }

  // 1. 危机检测 — 只检查最后一条用户消息
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  const crisis = lastUserMsg ? detectCrisis(lastUserMsg.content) : false

  // 2. 构建系统提示
  const systemPrompt = buildChatSystemPrompt(memory, yesterdayAction)

  // 3. 调用 Kimi streaming
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

  // 4. 将 Kimi stream 转为 Web ReadableStream
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      // 如果检测到危机，先发一个 JSON 信号
      if (crisis) {
        controller.enqueue(encoder.encode(`data: {"crisis":true}\n\n`))
      }

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) {
          // SSE 格式：data: <token>\n\n
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: delta })}\n\n`))
        }
        // 流结束信号
        if (chunk.choices[0]?.finish_reason === 'stop') {
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
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
