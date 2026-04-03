'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { MemoryFact } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  压力源: '😤 压力',
  人际关系: '🤝 人际',
  近期困境: '🌧 困境',
  有效策略: '✨ 策略',
  其他: '📌 其他',
}

export default function MemoryPage() {
  const router = useRouter()
  const [facts, setFacts] = useState<MemoryFact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/memory')
      if (res.ok) {
        const data = await res.json()
        setFacts(data.key_facts ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto">
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-primary -ml-1 p-1"><ChevronLeft size={22} /></button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">粘豆包的记忆</span>
        <div className="w-6" />
      </header>

      <div className="px-page-x py-page-y">
        <p className="text-body-sm text-text-muted mb-4">粘豆包从对话中记住了这些关于你的事：</p>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-card p-4 animate-pulse">
                <div className="h-3 bg-surface-2 rounded w-1/3 mb-2" />
                <div className="h-3 bg-surface-2 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : facts.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="text-4xl mb-3">🫘</span>
            <p className="text-body-md text-text-muted">聊得越多，我对你的了解就越深</p>
          </div>
        ) : (
          <div className="space-y-3">
            {facts.map((f, i) => (
              <div key={i} className="bg-surface rounded-card shadow-card p-4">
                <span className="inline-block text-[11px] bg-primary/[0.08] text-primary rounded-full px-2.5 py-0.5 mb-2">
                  {CATEGORY_LABELS[f.category] ?? f.category}
                </span>
                <p className="text-body-sm text-text-primary leading-relaxed">{f.fact}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
