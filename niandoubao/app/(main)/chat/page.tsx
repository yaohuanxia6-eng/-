'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import { MicroActionCard } from '@/components/chat/MicroActionCard'
import { CrisisCard } from '@/components/chat/CrisisCard'
import { Message, MemoryFact } from '@/types'

/** 按日期给消息列表分组 */
function groupMessagesByDate(messages: Message[]): { date: string; messages: Message[] }[] {
  const groups: { date: string; messages: Message[] }[] = []
  let currentDate = ''

  for (const msg of messages) {
    const ts = msg.timestamp ? new Date(msg.timestamp) : new Date()
    const dateStr = `${ts.getMonth() + 1}月${ts.getDate()}日`
    if (dateStr !== currentDate) {
      currentDate = dateStr
      groups.push({ date: dateStr, messages: [] })
    }
    groups[groups.length - 1].messages.push(msg)
  }
  return groups
}

export default function ChatPage() {
  const [messages, setMessages]               = useState<Message[]>([])
  const [nickname, setNickname]               = useState('小豆包')
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming]          = useState(false)
  const [showCrisis, setShowCrisis]           = useState(false)
  const [microAction, setMicroAction]         = useState<string | null>(null)
  const [actionDone, setActionDone]           = useState(false)
  const [isLoading, setIsLoading]             = useState(true)

  // 持久化上下文
  const sessionIdRef      = useRef<string | null>(null)
  const memoryRef         = useRef<MemoryFact[]>([])
  const yesterdayActionRef = useRef<string | null>(null)
  const abortRef          = useRef<AbortController | null>(null)
  const bottomRef         = useRef<HTMLDivElement>(null)

  // ── 初始化：加载今日会话 + 记忆 + 昨日行动 ───────────────────
  useEffect(() => {
    async function init() {
      try {
        const [sessionRes, memRes, ydRes] = await Promise.all([
          fetch('/api/sessions/today', { method: 'POST' }),
          fetch('/api/memory'),
          fetch('/api/sessions/yesterday'),
        ])

        // 用户资料（昵称）
        const profileRes = await fetch('/api/profile')
        if (profileRes.ok) {
          const profile = await profileRes.json()
          if (profile.data?.nickname) setNickname(profile.data.nickname)
        }

        // 记忆
        if (memRes.ok) {
          const mem = await memRes.json()
          memoryRef.current = mem.data?.key_facts ?? []
        }

        // 昨日微行动
        if (ydRes.ok) {
          const yd = await ydRes.json()
          if (yd.data?.micro_action) yesterdayActionRef.current = yd.data.micro_action
        }

        // 今日会话
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json()
          const session = sessionData.data ?? sessionData
          sessionIdRef.current = session.id

          const history: Message[] = session.messages ?? []
          if (history.length > 0) {
            setMessages(history)
            if (session.micro_action) {
              setMicroAction(session.micro_action)
              setActionDone(session.micro_action_done ?? false)
            }
          } else {
            // 今天第一次打开 — 生成带记忆的问候
            const greeting = buildGreeting(yesterdayActionRef.current)
            setMessages([{
              role: 'ai',
              content: greeting,
              timestamp: new Date().toISOString(),
            }])
          }
        }
      } catch (e) {
        console.error('[chat] init error:', e)
        setMessages([{
          role: 'ai',
          content: '嗨，今天怎么样？有什么想聊聊的吗',
          timestamp: new Date().toISOString(),
        }])
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  /** 根据昨日行动生成带记忆的问候 */
  function buildGreeting(yesterdayAction: string | null): string {
    if (yesterdayAction) {
      return `早上好呀 ☀️ 昨天给你建议的「${yesterdayAction}」，有去试试吗？`
    }
    const greetings = [
      '嗨，今天怎么样？有什么想聊聊的吗',
      '新的一天 ☀️ 今天感觉怎么样？',
      '嗨，今天过得还好吗？',
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  // 从流式内容中提取微行动
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

  // 标记微行动完成
  const handleMarkDone = useCallback(async () => {
    setActionDone(true)
    if (sessionIdRef.current) {
      await fetch(`/api/sessions/${sessionIdRef.current}/micro-action-done`, { method: 'PUT' })
    }
  }, [])

  // 发送消息
  async function handleSend(text: string) {
    if (isStreaming) return

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date().toISOString() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setIsStreaming(true)
    setStreamingContent('')

    const apiMessages = nextMessages.map(m => ({
      role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }))

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          memory: memoryRef.current,
          yesterdayAction: yesterdayActionRef.current ?? undefined,
          session_id: sessionIdRef.current ?? undefined,
        }),
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
        for (const line of chunk.split('\n')) {
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
          } catch { /* ignore */ }
        }
      }

      const aiMsg: Message = {
        role: 'ai',
        content: accumulated,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMsg])
      setStreamingContent('')

      const action = extractMicroAction(accumulated)
      if (action && !microAction) setMicroAction(action)

      if (action && sessionIdRef.current) {
        fetch('/api/memory/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionIdRef.current }),
        }).catch(() => {})
      }

    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return
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

  // 初始加载骨架
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <AppHeader nickname={nickname} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-text-muted">
            <span className="flex gap-1.5">
              {[0, 150, 300].map(d => (
                <span
                  key={d}
                  className="w-2 h-2 bg-primary/30 rounded-full animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </span>
            <p className="text-body-sm">正在准备今天的空间…</p>
          </div>
        </div>
      </div>
    )
  }

  // 消息按日期分组
  const dateGroups = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader nickname={nickname} />

      {/* 对话区 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4 pb-2">
        {/* AI 数据告知 */}
        <div className="bg-surface-2 rounded-btn px-3 py-2 mb-4 text-center">
          <p className="text-label text-text-muted leading-relaxed">
            对话内容由 AI 生成，仅供参考，不构成专业建议。<br />
            你的消息会经第三方 AI 服务处理，详见
            <a href="/privacy" className="underline underline-offset-2 text-primary">隐私政策</a>
          </p>
        </div>

        {/* 按日期分组的对话 */}
        {dateGroups.map((group, gi) => (
          <div key={gi}>
            {/* 日期分隔线 */}
            <div className="flex items-center gap-2 mb-5 mt-4">
              <div className="flex-1 h-px bg-primary/10" />
              <span className="text-label text-text-muted px-2">{group.date}</span>
              <div className="flex-1 h-px bg-primary/10" />
            </div>

            {/* 该日期的气泡 */}
            <div className="space-y-4">
              {group.messages.map((msg, i) => (
                <ChatBubble key={`${gi}-${i}`} role={msg.role} content={msg.content} />
              ))}
            </div>
          </div>
        ))}

        {/* 流式 AI 气泡 */}
        {isStreaming && streamingContent && (
          <div className="mt-4">
            <ChatBubble role="ai" content={streamingContent} isStreaming />
          </div>
        )}

        {/* 等待 AI 响应 */}
        {isStreaming && !streamingContent && (
          <div className="flex gap-2.5 items-start mt-4 animate-bubble-in">
            <div className="w-9 h-9 rounded-[10px] bg-primary flex-shrink-0 flex items-center justify-center mt-0.5 shadow-sm">
              <span className="text-white text-[14px] font-semibold font-serif">豆</span>
            </div>
            <div className="bg-surface border border-border rounded-[4px_16px_16px_16px] px-4 py-3 shadow-card">
              <span className="flex gap-1">
                {[0, 150, 300].map(d => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}

        {/* 微行动卡片 */}
        {microAction && (
          <div className="mt-5 mb-2">
            <MicroActionCard
              action={microAction}
              done={actionDone}
              onMarkDone={handleMarkDone}
            />
          </div>
        )}

        {/* 危机卡片 */}
        {showCrisis && (
          <div className="mt-4">
            <CrisisCard onDismiss={() => setShowCrisis(false)} />
          </div>
        )}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* 输入框 */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  )
}
