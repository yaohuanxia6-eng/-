'use client'

interface ChatBubbleProps {
  role: 'ai' | 'user'
  content: string
  isStreaming?: boolean
}

export function ChatBubble({ role, content, isStreaming }: ChatBubbleProps) {
  if (role === 'ai') {
    return (
      <div className="flex gap-2 items-end animate-bubble-in">
        {/* 豆包头像 */}
        <div className="w-7 h-7 rounded-full bg-primary flex-shrink-0 flex items-center justify-center mb-0.5">
          <span className="text-white text-label font-medium">豆</span>
        </div>
        <div className="bg-surface border border-border rounded-[4px_14px_14px_14px] px-4 py-3 text-body-md text-text-primary shadow-card max-w-[82%]">
          {content}
          {isStreaming && (
            <span className="inline-block w-[2px] h-[14px] bg-primary ml-0.5 align-middle animate-pulse" />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-end animate-bubble-in">
      <div className="bg-primary/[0.08] border border-border-dark rounded-[14px_4px_14px_14px] px-4 py-3 text-body-md text-text-primary max-w-[82%]">
        {content}
      </div>
    </div>
  )
}
