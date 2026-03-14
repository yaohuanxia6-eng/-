'use client'

interface ChatBubbleProps {
  role: 'ai' | 'user'
  content: string
  isStreaming?: boolean
}

export function ChatBubble({ role, content, isStreaming }: ChatBubbleProps) {
  if (role === 'ai') {
    return (
      <div className="flex gap-2 items-end">
        {/* 豆包头像 */}
        <div className="w-7 h-7 rounded-full bg-[#8B7355] flex-shrink-0 flex items-center justify-center mb-0.5">
          <span className="text-white text-[11px]">豆</span>
        </div>
        <div className="bg-white border border-[rgba(139,115,85,0.15)] rounded-[4px_14px_14px_14px] px-4 py-3 text-[14px] leading-[1.8] text-[#3D2F1F] shadow-[0_1px_6px_rgba(139,115,85,0.08)] max-w-[82%]">
          {content}
          {isStreaming && (
            <span className="inline-block w-[2px] h-[14px] bg-[#8B7355] ml-0.5 align-middle animate-pulse" />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-end">
      <div className="bg-[rgba(139,115,85,0.08)] border border-[rgba(139,115,85,0.2)] rounded-[14px_4px_14px_14px] px-4 py-3 text-[14px] leading-[1.8] text-[#3D2F1F] max-w-[82%]">
        {content}
      </div>
    </div>
  )
}
