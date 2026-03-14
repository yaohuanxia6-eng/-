// app/api/chat/route.ts — Kimi 流式对话接口

import { NextRequest } from 'next/server'
import { aiClient, CHAT_MODEL } from '@/lib/deepseek/client'
import { buildChatSystemPrompt } from '@/lib/deepseek/prompts'
import { detectCrisis } from '@/lib/crisis/detector'
import { MemoryFact } from '@/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { messages, memory = [], yesterdayAction } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    memory?: MemoryFact[]
    yesterdayAction?: string
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
