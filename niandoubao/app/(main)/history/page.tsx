'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { EmotionType } from '@/types'

interface SessionSummary {
  id: string
  session_date: string
  emotion_type: EmotionType | null
  micro_action: string | null
  micro_action_done: boolean
  status: string
}

// 情绪 → 颜色 / Emoji
const EMOTION_CONFIG: Record<EmotionType, { bg: string; text: string; label: string; emoji: string }> = {
  焦虑: { bg: 'bg-amber-400',  text: 'text-amber-700',  label: '焦虑', emoji: '😰' },
  低落: { bg: 'bg-blue-400',   text: 'text-blue-700',   label: '低落', emoji: '😔' },
  愉悦: { bg: 'bg-accent',     text: 'text-accent-dark', label: '愉悦', emoji: '😊' },
  平静: { bg: 'bg-teal-300',   text: 'text-teal-700',   label: '平静', emoji: '🍃' },
  空虚: { bg: 'bg-gray-300',   text: 'text-gray-600',   label: '空虚', emoji: '😶' },
  混乱: { bg: 'bg-orange-400', text: 'text-orange-700', label: '混乱', emoji: '🌀' },
  危机: { bg: 'bg-crisis',     text: 'text-white',      label: '危机', emoji: '🆘' },
}
const EMPTY_DAY = { bg: 'bg-surface-2', text: 'text-text-muted', label: '无记录', emoji: '' }

/** 生成近 N 天的日期数组（YYYY-MM-DD） */
function buildDayRange(days: number): string[] {
  const result: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000)
    result.push(d.toISOString().split('T')[0])
  }
  return result
}

/** 格式化日期 "4/1" */
function fmtDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}

export default function HistoryPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sessions/history')
      .then(r => r.json())
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

  // 建 map 方便查询
  const sessionByDate = Object.fromEntries(sessions.map(s => [s.session_date, s]))

  const days30 = buildDayRange(30)

  // 情绪分布统计
  const emotionCount: Partial<Record<EmotionType, number>> = {}
  let actionTotal = 0, actionDone = 0
  for (const s of sessions) {
    if (s.emotion_type) emotionCount[s.emotion_type] = (emotionCount[s.emotion_type] ?? 0) + 1
    if (s.micro_action) { actionTotal++; if (s.micro_action_done) actionDone++ }
  }
  const totalWithEmotion = Object.values(emotionCount).reduce((a, b) => a + b, 0)

  // 连续签到天数
  let streak = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().split('T')[0]
    if (sessionByDate[d]) streak++
    else break
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 overflow-y-auto px-page-x py-page-y space-y-5 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="flex items-baseline gap-3 mb-0">
          <h1 className="font-serif text-[28px] font-bold text-text-primary flex-shrink-0">情绪记录</h1>
          <p className="text-body-sm text-text-muted">你已经和粘豆包相伴了 {sessions.length} 天</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 pt-20 text-text-muted">
            <span className="flex gap-1.5">
              {[0, 150, 300].map(d => (
                <span key={d} className="w-2 h-2 bg-primary/30 rounded-full animate-bounce"
                  style={{ animationDelay: `${d}ms` }} />
              ))}
            </span>
            <p className="text-body-sm">加载中…</p>
          </div>
        ) : (
          <>
            {/* ── 概览数字 ── */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard value={sessions.length} label="已签到" unit="天" />
              <StatCard value={streak} label="连续签到" unit="天" />
              <StatCard value={actionTotal > 0 ? Math.round(actionDone / actionTotal * 100) : 0} label="行动完成率" unit="%" />
            </div>

            {/* ── 30 天情绪日历 ── */}
            <section>
              <SectionTitle>近 30 天</SectionTitle>
              <div className="bg-surface rounded-card shadow-card p-4">
                <div className="grid grid-cols-7 gap-1.5">
                  {days30.map(date => {
                    const session = sessionByDate[date]
                    const cfg = session?.emotion_type
                      ? EMOTION_CONFIG[session.emotion_type]
                      : EMPTY_DAY
                    const isToday = date === new Date().toISOString().split('T')[0]
                    return (
                      <div key={date} className="flex flex-col items-center gap-0.5">
                        <div
                          title={`${fmtDate(date)} ${cfg.label}`}
                          className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center text-[11px] select-none
                            ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                        >
                          {session?.emotion_type ? cfg.emoji : (
                            <span className="text-text-muted/40 text-[10px]">·</span>
                          )}
                        </div>
                        {isToday && (
                          <span className="text-[9px] text-primary font-medium leading-none">今天</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* 图例 */}
                <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
                  {(Object.entries(EMOTION_CONFIG) as [EmotionType, typeof EMOTION_CONFIG[EmotionType]][]).map(([type, cfg]) => (
                    <div key={type} className="flex items-center gap-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.bg} flex-shrink-0`} />
                      <span className="text-label text-text-muted">{cfg.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-2 flex-shrink-0 border border-border" />
                    <span className="text-label text-text-muted">未签到</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 情绪分布 ── */}
            {totalWithEmotion > 0 && (
              <section>
                <SectionTitle>情绪分布</SectionTitle>
                <div className="bg-surface rounded-card shadow-card p-4 space-y-3">
                  {(Object.entries(emotionCount) as [EmotionType, number][])
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => {
                      const cfg = EMOTION_CONFIG[type]
                      const pct = Math.round(count / totalWithEmotion * 100)
                      return (
                        <div key={type} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-body-sm text-text-primary flex items-center gap-1.5">
                              <span>{cfg.emoji}</span>{cfg.label}
                            </span>
                            <span className="text-body-sm text-text-muted">{count} 天</span>
                          </div>
                          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${cfg.bg} transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </section>
            )}

            {/* ── 微行动记录 ── */}
            {actionTotal > 0 && (
              <section>
                <SectionTitle>微行动记录</SectionTitle>
                <div className="bg-surface rounded-card shadow-card p-4 space-y-2.5">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-body-sm text-text-secondary">共 {actionTotal} 个微行动</span>
                    <span className="text-body-sm font-medium text-accent-dark">
                      完成 {actionDone} 个 🌱
                    </span>
                  </div>
                  {sessions
                    .filter(s => s.micro_action)
                    .slice(0, 10)
                    .map(s => (
                      <div key={s.id} className="flex items-start gap-2.5">
                        <span className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] ${
                          s.micro_action_done
                            ? 'bg-accent/20 text-accent-dark'
                            : 'bg-surface-2 text-text-muted'
                        }`}>
                          {s.micro_action_done ? '✓' : '·'}
                        </span>
                        <div>
                          <p className="text-body-sm text-text-primary">{s.micro_action}</p>
                          <p className="text-label text-text-muted">{fmtDate(s.session_date)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* 空状态 */}
            {sessions.length === 0 && (
              <div className="flex flex-col items-center gap-3 pt-16 text-text-muted">
                <p className="text-title-sm font-serif text-text-secondary">还没有签到记录</p>
                <p className="text-body-sm text-center">每天和粘豆包聊聊，<br />这里会慢慢长出你的情绪地图 🗺️</p>
                <button
                  onClick={() => router.push('/chat')}
                  className="mt-2 bg-primary text-white rounded-btn px-5 py-2.5 text-body-sm font-medium shadow-btn"
                >
                  开始今天的签到
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ value, label, unit }: { value: number; label: string; unit: string }) {
  return (
    <div className="bg-surface rounded-card shadow-card p-3 text-center">
      <p className="text-title-md font-serif text-primary">
        {value}<span className="text-body-sm text-text-muted ml-0.5">{unit}</span>
      </p>
      <p className="text-label text-text-muted mt-0.5">{label}</p>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-label uppercase tracking-widest text-text-muted mb-2">{children}</h2>
  )
}
