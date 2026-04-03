'use client'

interface ChatBubbleProps {
  role: 'ai' | 'user'
  content: string
  isStreaming?: boolean
}

export function ChatBubble({ role, content, isStreaming }: ChatBubbleProps) {
  if (role === 'ai') {
    return (
      <div className="flex animate-bubble-in">
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-[20px] px-4 py-3 text-[15px] leading-[1.8] text-text-primary shadow-card max-w-[80%]">
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
      <div className="bg-primary/[0.10] backdrop-blur-sm border border-primary/[0.06] rounded-[20px] px-4 py-3 text-[15px] leading-[1.8] text-text-primary max-w-[80%]">
        {content}
      </div>
    </div>
  )
}
