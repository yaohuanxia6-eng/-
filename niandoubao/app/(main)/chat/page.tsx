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
            // 今天第一次打开 — 获取天气并生成诗意问候
            const weather = await fetchWeather()
            const greeting = buildGreeting(yesterdayActionRef.current, weather)
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

  /** 获取天气 */
  async function fetchWeather(): Promise<string> {
    try {
      const res = await fetch('/api/weather')
      if (!res.ok) return ''
      const data = await res.json()
      return data.desc || ''
    } catch { return '' }
  }

  function getTimeSlot(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) return 'morning'
    if (h >= 12 && h < 17) return 'afternoon'
    if (h >= 17 && h < 22) return 'evening'
    return 'night'
  }

  /** 根据天气+时间+昨日行动生成诗意问候 */
  function buildGreeting(yesterdayAction: string | null, weather?: string): string {
    if (yesterdayAction) {
      return `昨天给你建议的「${yesterdayAction}」，有去试试吗？不管结果怎样，愿意尝试就很棒了`
    }

    const time = getTimeSlot()
    const w = (weather || '').toLowerCase()
    const isRain = /雨|rain|shower|drizzle/.test(w)
    const isCloudy = /阴|多云|cloud|overcast/.test(w)
    const isSnow = /雪|snow/.test(w)
    const isClear = /晴|clear|sunny/.test(w)

    const poeticGreetings: Record<string, string[]> = {
      morning_clear: [
        '晨光轻轻敲了敲窗，新的一天又温柔地来了。今天想聊点什么？',
        '阳光很好，像一封写给你的温暖情书。新的一天，有什么想说的吗？',
      ],
      morning_rain: [
        '窗外下着雨，空气里都是湿润的温柔。这样的早晨，特别适合说说心里话',
        '雨声像一首轻轻的歌，陪你慢慢醒来。今天心情如何？',
      ],
      morning_cloudy: [
        '天空铺了一层柔柔的云，像替你盖了条薄毯。今天有什么想聊的吗？',
        '多云的早晨有种安静的温柔。新的一天，你好呀',
      ],
      morning_snow: [
        '世界被白雪轻轻包裹了，好安静好温柔。这样的日子，想和你聊聊天',
      ],
      afternoon_clear: [
        '午后的阳光懒洋洋地洒进来，像一只暖暖的猫。你今天还好吗？',
      ],
      afternoon_rain: [
        '下午的雨让一切慢了下来，刚好可以停下来，和自己待一会儿',
      ],
      afternoon_cloudy: [
        '午后的天空灰灰柔柔的，像一幅水墨画。这个下午过得怎样？',
      ],
      evening_clear: [
        '傍晚的天空染上了橘色和粉色，好温柔。今天有什么想说的吗？',
      ],
      evening_rain: [
        '雨还在下，夜色渐渐浓了。这样的傍晚，特别想听你说说话',
      ],
      evening_cloudy: [
        '天色暗下来了，一天又快过完了。今天过得怎么样？',
      ],
      night_clear: [
        '夜色像一条温柔的毯子，把整个城市都裹住了。月亮和星星都在陪着你',
        '深夜的安静是属于你的。想聊聊今天的事吗？',
      ],
      night_rain: [
        '深夜的雨声像温柔的催眠曲，一切都慢了下来。有什么想说的吗？',
      ],
      night_cloudy: [
        '夜深了，云层后面藏着月亮，它在悄悄陪你。今天还好吗？',
      ],
    }

    // determine weather key
    let weatherKey = 'cloudy'
    if (isRain) weatherKey = 'rain'
    else if (isSnow) weatherKey = 'snow'
    else if (isClear) weatherKey = 'clear'
    else if (isCloudy) weatherKey = 'cloudy'

    const key = `${time}_${weatherKey}`
    const candidates = poeticGreetings[key] || poeticGreetings[`${time}_cloudy`] || ['嗨，今天怎么样？有什么想聊聊的吗']
    return candidates[Math.floor(Math.random() * candidates.length)]
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
      <div
        className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4 pb-2"
        style={{
          background: `
            radial-gradient(ellipse 60% 60% at 10% 10%, rgba(247,192,162,0.30) 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at 90% 5%, rgba(232,208,155,0.26) 0%, transparent 65%),
            radial-gradient(ellipse 55% 55% at 50% 80%, rgba(225,188,198,0.22) 0%, transparent 65%),
            radial-gradient(ellipse 60% 60% at 20% 50%, rgba(240,230,202,0.36) 0%, transparent 70%),
            radial-gradient(ellipse 45% 45% at 75% 40%, rgba(200,225,210,0.18) 0%, transparent 55%),
            radial-gradient(ellipse 40% 40% at 40% 30%, rgba(225,215,236,0.15) 0%, transparent 50%),
            #F3ECE0`,
          backgroundAttachment: 'fixed',
        }}
      >
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
          <div className="flex mt-4 animate-bubble-in">
            <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-[20px] px-4 py-3 shadow-card">
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
