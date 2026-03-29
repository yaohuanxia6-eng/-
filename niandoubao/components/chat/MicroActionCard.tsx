'use client'
import { Check, Sparkles } from 'lucide-react'

interface MicroActionCardProps {
  action: string
  done: boolean
  onMarkDone: () => void
}

export function MicroActionCard({ action, done, onMarkDone }: MicroActionCardProps) {
  return (
    <div className="bg-accent/[0.08] border border-accent/20 rounded-card p-4 mx-1 animate-card-in">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles size={11} className="text-accent-dark" />
        <span className="text-label text-accent-dark font-medium tracking-wider">今日微行动</span>
      </div>
      <p className="font-serif text-body-md text-text-primary leading-[1.7] mb-3">{action}</p>
      {done ? (
        <div className="flex items-center gap-1.5 text-accent-dark animate-bubble-in">
          <Check size={14} />
          <span className="text-body-sm font-medium">已完成，真棒</span>
        </div>
      ) : (
        <button
          onClick={onMarkDone}
          className="text-body-sm text-accent-dark border border-accent/30 rounded-btn px-3 py-1.5 hover:bg-accent/10 transition-all duration-200 active:scale-95"
        >
          我去做了 ✓
        </button>
      )}
    </div>
  )
}
