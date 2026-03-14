'use client'
import { Check, Sparkles } from 'lucide-react'

interface MicroActionCardProps {
  action: string
  done: boolean
  onMarkDone: () => void
}

export function MicroActionCard({ action, done, onMarkDone }: MicroActionCardProps) {
  return (
    <div className="bg-[rgba(123,174,132,0.08)] border border-[rgba(123,174,132,0.22)] rounded-[12px] p-4 mx-1">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles size={11} className="text-[#5A9468]" />
        <span className="text-[11px] text-[#5A9468] font-medium tracking-wider">今日微行动</span>
      </div>
      <p className="font-serif text-[14px] text-[#3D2F1F] leading-[1.7] mb-3">{action}</p>
      {done ? (
        <div className="flex items-center gap-1.5 text-[#5A9468]">
          <Check size={14} />
          <span className="text-[13px] font-medium">已完成，真棒</span>
        </div>
      ) : (
        <button
          onClick={onMarkDone}
          className="text-[13px] text-[#5A9468] border border-[rgba(123,174,132,0.3)] rounded-[8px] px-3 py-1.5 hover:bg-[rgba(123,174,132,0.1)] transition-colors active:scale-95"
        >
          我去做了 ✓
        </button>
      )}
    </div>
  )
}
