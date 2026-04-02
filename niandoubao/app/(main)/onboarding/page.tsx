'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MBTIPreference } from '@/types'

const dimensions = [
  {
    key: 'EI' as const,
    options: [
      { value: 'E' as const, emoji: '🎉', label: '外向E', desc: '社交让我充电' },
      { value: 'I' as const, emoji: '🧘', label: '内向I', desc: '独处让我充电' },
    ],
  },
  {
    key: 'SN' as const,
    options: [
      { value: 'S' as const, emoji: '📋', label: '实感S', desc: '关注具体细节' },
      { value: 'N' as const, emoji: '💡', label: '直觉N', desc: '关注可能性' },
    ],
  },
  {
    key: 'TF' as const,
    options: [
      { value: 'T' as const, emoji: '🧠', label: '思考T', desc: '逻辑优先' },
      { value: 'F' as const, emoji: '💗', label: '情感F', desc: '感受优先' },
    ],
  },
  {
    key: 'JP' as const,
    options: [
      { value: 'J' as const, emoji: '📅', label: '判断J', desc: '喜欢计划' },
      { value: 'P' as const, emoji: '🎨', label: '感知P', desc: '随性灵活' },
    ],
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [prefs, setPrefs] = useState<MBTIPreference>({
    EI: null,
    SN: null,
    TF: null,
    JP: null,
  })
  const [saving, setSaving] = useState(false)

  const allSelected = prefs.EI && prefs.SN && prefs.TF && prefs.JP

  function select(dim: keyof MBTIPreference, value: string) {
    setPrefs((prev) => ({ ...prev, [dim]: value }))
  }

  async function handleSubmit() {
    if (!allSelected) return
    setSaving(true)
    try {
      await fetch('/api/mbti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mbti: `${prefs.EI}${prefs.SN}${prefs.TF}${prefs.JP}`,
          preferences: prefs,
        }),
      })
    } catch {
      /* continue to chat even if save fails */
    }
    router.push('/chat')
  }

  function handleSkip() {
    router.push('/chat')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-8 max-w-[430px] mx-auto">
      {/* Logo */}
      <h1 className="font-serif text-title-lg text-primary mb-1">粘豆包</h1>
      <p className="text-body-sm text-text-muted mb-6">
        了解你的性格偏好，让我更懂你
      </p>

      {/* MBTI Dimensions */}
      <div className="w-full space-y-4 mb-6">
        {dimensions.map((dim) => (
          <div key={dim.key} className="flex gap-3">
            {dim.options.map((opt) => {
              const isSelected = prefs[dim.key] === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => select(dim.key, opt.value)}
                  className={`flex-1 rounded-card border-2 p-3 text-left transition-all duration-200 active:scale-[0.97] ${
                    isSelected
                      ? 'border-primary bg-primary/[0.06] shadow-card'
                      : 'border-border bg-surface hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{opt.emoji}</span>
                    <span
                      className={`text-body-md font-medium ${
                        isSelected ? 'text-primary' : 'text-text-primary'
                      }`}
                    >
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-body-sm text-text-secondary">{opt.desc}</p>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Actions */}
      <button
        onClick={handleSubmit}
        disabled={!allSelected || saving}
        className="w-full bg-primary text-white rounded-btn px-4 py-3 text-body-md font-medium shadow-btn hover:bg-primary-dark transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:shadow-none mb-3"
      >
        {saving ? '保存中…' : '选完开始聊天'}
      </button>
      <button
        onClick={handleSkip}
        className="text-body-sm text-text-muted hover:text-primary transition-colors"
      >
        跳过，直接开始
      </button>
    </div>
  )
}
