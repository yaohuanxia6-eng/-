'use client'
import { Heart } from 'lucide-react'

interface CrisisCardProps {
  onDismiss?: () => void
}

export function CrisisCard({ onDismiss }: CrisisCardProps) {
  return (
    <div className="px-4 py-3 bg-[#FBF7F0] border-t border-[rgba(139,115,85,0.1)]">
      <div className="bg-[#FEF2F2] border border-[rgba(192,57,43,0.18)] rounded-[12px] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Heart size={14} className="text-[#C0392B]" fill="currentColor" />
          <h3 className="font-serif text-[15px] text-[#C0392B] font-semibold">我在这里陪着你</h3>
        </div>
        <p className="text-[13px] text-[#3D2F1F] leading-[1.8] mb-3">
          听起来你现在很难受，感谢你愿意告诉我。这种时刻，和专业的人说说话会更有帮助。
        </p>
        <div className="space-y-2 mb-3">
          <a href="tel:4001619995" className="flex items-center justify-between bg-white rounded-[8px] px-3 py-2.5 border border-[rgba(192,57,43,0.12)]">
            <span className="text-[13px] text-[#3D2F1F]">全国心理援助热线</span>
            <span className="text-[13px] font-medium text-[#C0392B]">400-161-9995</span>
          </a>
          <a href="tel:01082951332" className="flex items-center justify-between bg-white rounded-[8px] px-3 py-2.5 border border-[rgba(192,57,43,0.12)]">
            <span className="text-[13px] text-[#3D2F1F]">北京心理危机中心</span>
            <span className="text-[13px] font-medium text-[#C0392B]">010-82951332</span>
          </a>
        </div>
        <p className="text-[11px] text-[#B8A898] mb-2">粘豆包不是心理医生，但这些人可以帮你</p>
        {onDismiss && (
          <button onClick={onDismiss} className="text-[12px] text-[#B8A898] underline underline-offset-2">
            我没事，继续聊
          </button>
        )}
      </div>
    </div>
  )
}
