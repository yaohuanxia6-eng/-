'use client'
import { useState, useRef, KeyboardEvent } from 'react'
import { ArrowUp } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder = '说说现在的感受…' }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 96) + 'px'
  }

  return (
    <div className="px-4 py-3 bg-background border-t border-border pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="flex gap-2 items-end bg-surface border border-border-dark rounded-card px-3 py-2 shadow-input transition-all duration-200 focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary-light">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { setValue(e.target.value); handleInput() }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? '粘豆包正在思考…' : placeholder}
          rows={1}
          className="flex-1 resize-none bg-transparent text-body-md text-text-primary placeholder:text-text-muted focus:outline-none leading-[1.6] py-1 max-h-24 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-30 active:scale-90 hover:bg-primary-dark transition-all duration-200"
        >
          <ArrowUp size={18} className="text-white" />
        </button>
      </div>
      <p className="text-center text-label text-text-muted mt-2">Enter 发送 · Shift+Enter 换行</p>
    </div>
  )
}
