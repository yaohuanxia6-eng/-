'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

const steps = [
  { count: 5, sense: '看到', emoji: '👁️', instruction: '说出你现在能看到的 5 样东西' },
  { count: 4, sense: '听到', emoji: '👂', instruction: '说出你现在能听到的 4 种声音' },
  { count: 3, sense: '触碰', emoji: '✋', instruction: '说出你现在能触碰到的 3 样东西' },
  { count: 2, sense: '闻到', emoji: '👃', instruction: '说出你现在能闻到的 2 种气味' },
  { count: 1, sense: '尝到', emoji: '👅', instruction: '说出你现在能尝到的 1 种味道' },
]

export default function GroundingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(''))
  const [completed, setCompleted] = useState(false)

  const step = steps[currentStep]
  const canProceed = answers[currentStep].trim().length > 0

  function handleNext() {
    if (currentStep >= steps.length - 1) {
      setCompleted(true)
    } else {
      setCurrentStep((s) => s + 1)
    }
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col max-w-[430px] mx-auto">
        <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0">
          <button onClick={() => router.push('/toolkit')} className="flex items-center text-primary -ml-1 p-1">
            <ChevronLeft size={22} />
          </button>
          <span className="flex-1 text-center text-body-md font-medium text-text-primary">感官落地</span>
          <div className="w-6" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <div className="bg-surface rounded-card shadow-card border border-border p-6 text-center w-full">
            <span className="text-4xl block mb-3">🧘</span>
            <h2 className="font-serif text-title-lg text-primary mb-2">
              你回来了
            </h2>
            <p className="text-body-md text-text-secondary leading-relaxed mb-1">
              你刚刚用五种感官把自己拉回了当下。
            </p>
            <p className="text-body-sm text-text-muted leading-relaxed">
              无论刚才经历了什么，你现在是安全的。
              <br />
              深呼吸，你做得很好。
            </p>
          </div>

          <button
            onClick={() => router.push('/toolkit')}
            className="mt-6 bg-primary text-white rounded-btn px-6 py-2.5 text-body-sm font-medium shadow-btn hover:bg-primary-dark transition-all duration-200 active:scale-95"
          >
            返回工具箱
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[430px] mx-auto">
      {/* Header */}
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0">
        <button onClick={() => router.back()} className="flex items-center text-primary -ml-1 p-1">
          <ChevronLeft size={22} />
        </button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">感官落地</span>
        <div className="w-6" />
      </header>

      <div className="flex-1 flex flex-col px-page-x py-page-y">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                i === currentStep
                  ? 'bg-primary'
                  : i < currentStep
                  ? 'bg-accent'
                  : 'bg-primary/20'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 flex flex-col items-center">
          <span className="text-5xl mb-4">{step.emoji}</span>
          <h2 className="font-serif text-title-lg text-primary mb-2 text-center">
            {step.count} 件你{step.sense}的
          </h2>
          <p className="text-body-md text-text-secondary mb-6 text-center">
            {step.instruction}
          </p>

          <textarea
            className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none mb-6"
            rows={4}
            placeholder={`写下你${step.sense}的${step.count}样东西…`}
            value={answers[currentStep]}
            onChange={(e) => {
              const next = [...answers]
              next[currentStep] = e.target.value
              setAnswers(next)
            }}
          />

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="w-full bg-primary text-white rounded-btn px-4 py-3 text-body-md font-medium shadow-btn hover:bg-primary-dark transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:shadow-none"
          >
            {currentStep >= steps.length - 1 ? '完成' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  )
}
