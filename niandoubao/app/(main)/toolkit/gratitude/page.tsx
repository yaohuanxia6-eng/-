'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus } from 'lucide-react'

const ICONS = ['🌸', '🌟', '💖', '🌈', '🍀', '✨', '🦋', '🌻']
const CHALLENGE_DAYS = 21

export default function GratitudePage() {
  const router = useRouter()
  const [items, setItems] = useState<string[]>(['', '', ''])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [totalDays, setTotalDays] = useState(0)
  const [loading, setLoading] = useState(true)

  // Load total days count
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/gratitude')
        if (res.ok) {
          const data = await res.json()
          const entries = data.entries ?? data ?? []
          setTotalDays(entries.length)
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const anyFilled = items.some((item) => item.trim())

  function addItem() {
    if (items.length < 8) {
      setItems([...items, ''])
    }
  }

  function updateItem(index: number, value: string) {
    const next = [...items]
    next[index] = value
    setItems(next)
  }

  async function handleSave() {
    if (!anyFilled) return
    setSaving(true)
    try {
      const filledItems = items.filter((i) => i.trim())
      await fetch('/api/gratitude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: filledItems }),
      })
      setSaved(true)
      setTotalDays((d) => d + 1)
    } catch {
      alert('保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const progressDays = Math.min(totalDays, CHALLENGE_DAYS)

  if (saved) {
    const filledItems = items.filter((i) => i.trim())
    return (
      <div className="min-h-screen bg-background max-w-[430px] mx-auto">
        <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0">
          <button onClick={() => router.push('/toolkit')} className="flex items-center text-primary -ml-1 p-1">
            <ChevronLeft size={22} />
          </button>
          <span className="flex-1 text-center text-body-md font-medium text-text-primary">感恩记录</span>
          <div className="w-6" />
        </header>

        <div className="px-page-x py-page-y flex flex-col items-center">
          <div className="bg-surface rounded-card shadow-card border border-border p-6 text-center w-full">
            <span className="text-4xl block mb-3">🌟</span>
            <h2 className="font-serif text-title-md text-primary mb-2">
              今天的美好已记录
            </h2>
            <p className="text-body-sm text-text-secondary mb-3">
              你记下了 {filledItems.length} 件好事
            </p>
            <div className="text-left space-y-1.5">
              {filledItems.map((item, i) => (
                <p key={i} className="text-body-sm text-text-primary">
                  {ICONS[i % ICONS.length]} {item}
                </p>
              ))}
            </div>
          </div>

          <Link
            href="/toolkit/gratitude/history"
            className="mt-6 text-body-sm text-primary hover:underline underline-offset-2"
          >
            过往记录 · 查看详情 →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto">
      {/* Header */}
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0 sticky top-0 z-10">
        <button onClick={() => router.back()} className="flex items-center text-primary -ml-1 p-1">
          <ChevronLeft size={22} />
        </button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">感恩记录</span>
        <div className="w-6" />
      </header>

      <div className="px-page-x py-page-y space-y-5">
        {/* 21-day challenge */}
        <div className="bg-surface rounded-card shadow-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-body-md font-medium text-text-primary">
              21天感恩挑战
            </h3>
            <span className="text-label text-primary bg-primary/[0.08] rounded-chip px-2 py-0.5">
              {loading ? '…' : `${progressDays}/${CHALLENGE_DAYS}`}
            </span>
          </div>
          {/* Progress dots */}
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: CHALLENGE_DAYS }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i < progressDays ? 'bg-accent' : 'bg-primary/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Gratitude items */}
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-lg mt-2.5 flex-shrink-0">
                {ICONS[i % ICONS.length]}
              </span>
              <textarea
                className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
                rows={2}
                placeholder={
                  i === 0
                    ? '今天让你感到开心或感激的事…'
                    : i === 1
                    ? '哪怕很小的事也值得记录…'
                    : '还有什么让你微笑的瞬间…'
                }
                value={item}
                onChange={(e) => updateItem(i, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Add button */}
        {items.length < 8 && (
          <button
            onClick={addItem}
            className="flex items-center gap-2 text-body-sm text-primary hover:underline underline-offset-2"
          >
            <Plus size={16} />
            再写一件好事
          </button>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!anyFilled || saving}
          className="w-full bg-primary text-white rounded-btn px-4 py-3 text-body-md font-medium shadow-btn hover:bg-primary-dark transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:shadow-none"
        >
          {saving ? '保存中…' : '记录今天的美好'}
        </button>

        {/* Link to history */}
        <div className="text-center pb-4">
          <Link
            href="/toolkit/gratitude/history"
            className="text-body-sm text-primary hover:underline underline-offset-2"
          >
            过往记录 · 查看详情 →
          </Link>
        </div>
      </div>
    </div>
  )
}
