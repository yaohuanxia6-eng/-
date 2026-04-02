'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function CBTPage() {
  const router = useRouter()

  const [thought, setThought] = useState('')
  const [distress, setDistress] = useState(5)
  const [evidenceFor, setEvidenceFor] = useState('')
  const [evidenceAgainst, setEvidenceAgainst] = useState('')
  const [friendAdvice, setFriendAdvice] = useState('')
  const [reframe, setReframe] = useState('')
  const [generating, setGenerating] = useState(false)
  const [insight, setInsight] = useState<{
    before: number
    after: number
    observation: string
    newCognition: string
  } | null>(null)

  const canGenerate =
    thought.trim() && evidenceAgainst.trim() && reframe.trim()

  async function handleGenerate() {
    if (!canGenerate) return
    setGenerating(true)

    const after = Math.max(1, Math.round(distress * 0.5))

    const observation = `你注意到了"${thought.trim().slice(0, 30)}"这个想法带来的困扰。但你也找到了相反的证据——${evidenceAgainst.trim().slice(0, 50)}。这说明你有能力看到事情的另一面。${
      friendAdvice.trim()
        ? `你对朋友说的话——"${friendAdvice.trim().slice(0, 40)}"——其实也是你内心的智慧。`
        : ''
    }试着用同样的温柔对待自己。`

    try {
      await fetch('/api/cbt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thought,
          distress_before: distress,
          distress_after: after,
          evidence_for: evidenceFor,
          evidence_against: evidenceAgainst,
          friend_advice: friendAdvice,
          reframe,
          insight: observation,
        }),
      })
    } catch {
      /* continue showing result even if save fails */
    }

    setInsight({
      before: distress,
      after,
      observation,
      newCognition: reframe,
    })
    setGenerating(false)
  }

  function handleReset() {
    setThought('')
    setDistress(5)
    setEvidenceFor('')
    setEvidenceAgainst('')
    setFriendAdvice('')
    setReframe('')
    setInsight(null)
  }

  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto">
      {/* Header */}
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center text-primary -ml-1 p-1"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">
          认知重构
        </span>
        {insight ? (
          <button
            onClick={handleReset}
            className="text-body-sm text-primary hover:underline underline-offset-2"
          >
            重新开始
          </button>
        ) : (
          <div className="w-14" />
        )}
      </header>

      <div className="px-page-x py-page-y">
        {!insight ? (
          <div className="space-y-5">
            {/* Intro */}
            <p className="text-body-md text-text-secondary leading-relaxed">
              认知重构帮你发现思维中的"自动化偏差"，用更平衡的方式看待问题。
            </p>

            {/* Step 1: Thought */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-1.5">
                1. 让你难受的想法是什么？
              </label>
              <textarea
                className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
                rows={3}
                placeholder="写下让你反复想、很难受的那个想法…"
                value={thought}
                onChange={(e) => setThought(e.target.value)}
              />
            </div>

            {/* Step 2: Distress slider */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-1.5">
                2. 难受程度（1-10）
              </label>
              <div className="flex items-center gap-3">
                <span className="text-body-sm text-text-muted w-4">1</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={distress}
                  onChange={(e) => setDistress(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-body-sm text-text-muted w-4">10</span>
                <span className="text-body-md text-primary font-medium w-6 text-center">
                  {distress}
                </span>
              </div>
            </div>

            {/* Step 3: Evidence for */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-1.5">
                3. 有什么证据支持这个想法？
              </label>
              <textarea
                className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
                rows={3}
                placeholder="列出支持这个想法的事实或证据…"
                value={evidenceFor}
                onChange={(e) => setEvidenceFor(e.target.value)}
              />
            </div>

            {/* Step 4: Evidence against */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-1.5">
                4. 有没有相反的证据？
              </label>
              <textarea
                className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
                rows={3}
                placeholder="有没有一些事实不支持这个想法…"
                value={evidenceAgainst}
                onChange={(e) => setEvidenceAgainst(e.target.value)}
              />
            </div>

            {/* Step 5: Friend advice */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-1.5">
                5. 好朋友有这个想法，你会怎么说？
              </label>
              <textarea
                className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
                rows={3}
                placeholder="想象好朋友跟你说了同样的话…"
                value={friendAdvice}
                onChange={(e) => setFriendAdvice(e.target.value)}
              />
            </div>

            {/* Step 6: Reframe */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-1.5">
                6. 重新看待这件事
              </label>
              <textarea
                className="bg-surface border border-border rounded-input px-4 py-3 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-light focus:ring-1 focus:ring-primary/20 w-full transition-all duration-200 resize-none"
                rows={3}
                placeholder="综合以上，你能怎样更平衡地看待这件事…"
                value={reframe}
                onChange={(e) => setReframe(e.target.value)}
              />
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="w-full bg-primary text-white rounded-btn px-4 py-3 text-body-md font-medium shadow-btn hover:bg-primary-dark transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:shadow-none"
            >
              {generating ? '生成中…' : '生成认知分析'}
            </button>
          </div>
        ) : (
          /* Insight card */
          <div className="space-y-5">
            {/* Score card */}
            <div className="bg-surface rounded-card shadow-card border border-border p-5 text-center">
              <p className="text-body-sm text-text-muted mb-3">难受程度变化</p>
              <div className="flex items-center justify-center gap-4">
                <div>
                  <span className="text-title-lg text-crisis font-serif">
                    {insight.before}
                  </span>
                  <p className="text-label text-text-muted mt-1">之前</p>
                </div>
                <span className="text-title-md text-text-muted">→</span>
                <div>
                  <span className="text-title-lg text-accent font-serif">
                    {insight.after}
                  </span>
                  <p className="text-label text-text-muted mt-1">之后</p>
                </div>
              </div>
            </div>

            {/* Observation */}
            <div className="bg-accent/[0.08] border border-accent/20 rounded-card p-4">
              <h3 className="text-body-md font-medium text-text-primary mb-2">
                粘豆包的观察
              </h3>
              <p className="text-body-sm text-text-secondary leading-relaxed">
                {insight.observation}
              </p>
            </div>

            {/* New cognition */}
            <div className="bg-surface rounded-card shadow-card border border-border p-4">
              <h3 className="text-body-md font-medium text-text-primary mb-2">
                你的新认知
              </h3>
              <p className="text-body-md text-primary leading-relaxed font-medium">
                &ldquo;{insight.newCognition}&rdquo;
              </p>
            </div>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="w-full bg-surface border border-border text-text-primary rounded-btn px-4 py-3 text-body-md hover:bg-surface-2 transition-colors"
            >
              重新开始
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
