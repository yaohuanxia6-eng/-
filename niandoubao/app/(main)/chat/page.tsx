'use client'
import { useState, useRef, useEffect } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import { MicroActionCard } from '@/components/chat/MicroActionCard'
import { CrisisCard } from '@/components/chat/CrisisCard'
import { Message } from '@/types'

// 今天的开场白（第一次打开）
const OPENING: Message = {
  role: 'ai',
  content: '嗨，今天怎么样？有什么想聊聊的吗',
  timestamp: new Date().toISOString(),
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([OPENING])
  // 最新的 AI 消息（流式追加中）
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showCrisis, setShowCrisis] = useState(false)
  const [microAction, setMicroAction] = useState<string | null>(null)
  const [actionDone, setActionDone] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // 从流式内容中提取微行动（检测"今天可以"开头的句子）
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

  async function handleSend(text: string) {
    if (isStreaming) return

    // 添加用户消息
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date().toISOString() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setIsStreaming(true)
    setStreamingContent('')

    // 构造传给 API 的消息历史（排除 opening 的 ai 角色转换）
    const apiMessages = nextMessages.map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user' as 'assistant' | 'user',
      content: m.content,
    }))

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) throw new Error('API error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        // SSE 格式：每行 data: ...
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') continue

          try {
            const json = JSON.parse(payload)
            if (json.crisis) {
              setShowCrisis(true)
            } else if (json.token) {
              accumulated += json.token
              setStreamingContent(accumulated)
            }
          } catch {
            // 忽略解析错误
          }
        }
      }

      // 流结束，把流式内容固化为完整消息
      const aiMsg: Message = {
        role: 'ai',
        content: accumulated,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMsg])
      setStreamingContent('')

      // 尝试提取微行动
      const action = extractMicroAction(accumulated)
      if (action) setMicroAction(action)

    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return
      // 网络错误时降级提示
      const errMsg: Message = {
        role: 'ai',
        content: '网络有点问题，稍等一下再试试？',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errMsg])
      setStreamingContent('')
    } finally {
      setIsStreaming(false)
    }
  }

  const today = new Date()
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`

  return (
    <div className="flex flex-col h-screen bg-[#FBF7F0]">
      <AppHeader nickname="小豆包" showSettings />

      {/* 对话区 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4 pb-2">
        {/* 日期标签 */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 h-px bg-[rgba(139,115,85,0.1)]" />
          <span className="text-[11px] text-[#B8A898] px-2">{dateStr}</span>
          <div className="flex-1 h-px bg-[rgba(139,115,85,0.1)]" />
        </div>

        {/* 对话气泡 */}
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <ChatBubble
              key={i}
              role={msg.role}
              content={msg.content}
            />
          ))}

          {/* 流式输出中的 AI 气泡 */}
          {isStreaming && streamingContent && (
            <ChatBubble role="ai" content={streamingContent} isStreaming />
          )}

          {/* 等待 AI 响应（还没有任何 token）*/}
          {isStreaming && !streamingContent && (
            <div className="flex gap-2 items-end">
              <div className="w-7 h-7 rounded-full bg-[#8B7355] flex-shrink-0 flex items-center justify-center">
                <span className="text-white text-[11px]">豆</span>
              </div>
              <div className="bg-white border border-[rgba(139,115,85,0.15)] rounded-[4px_14px_14px_14px] px-4 py-3 shadow-[0_1px_6px_rgba(139,115,85,0.08)]">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#B8A898] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#B8A898] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#B8A898] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 微行动卡片 */}
        {microAction && (
          <div className="mt-5 mb-2">
            <MicroActionCard
              action={microAction}
              done={actionDone}
              onMarkDone={() => setActionDone(true)}
            />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 底部 */}
      {showCrisis ? (
        <CrisisCard onDismiss={() => setShowCrisis(false)} />
      ) : (
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      )}
    </div>
  )
}
