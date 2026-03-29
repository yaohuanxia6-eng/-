'use client'

interface ChatBubbleProps {
  role: 'ai' | 'user'
  content: string
  isStreaming?: boolean
}

export function ChatBubble({ role, content, isStreaming }: ChatBubbleProps) {
  if (role === 'ai') {
    return (
      <div className="flex gap-2.5 items-start animate-bubble-in">
        {/* 豆包头像 */}
        <div className="w-9 h-9 rounded-full bg-primary flex-shrink-0 flex items-center justify-center mt-0.5">
          <span className="text-white text-[14px] font-medium">豆</span>
        </div>
        <div className="bg-surface border border-border rounded-[4px_16px_16px_16px] px-4 py-3 text-[15px] leading-[1.8] text-text-primary shadow-card max-w-[78%]">
          {content}
          {isStreaming && (
            <span className="inline-block w-[2px] h-[15px] bg-primary ml-0.5 align-middle animate-pulse" />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-end animate-bubble-in">
      <div className="bg-primary/[0.08] border border-border-dark rounded-[16px_4px_16px_16px] px-4 py-3 text-[15px] leading-[1.8] text-text-primary max-w-[78%]">
        {content}
      </div>
    </div>
  )
}
