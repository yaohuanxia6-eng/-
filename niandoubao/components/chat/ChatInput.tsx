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
    <div className="px-4 py-3 bg-[#FBF7F0] border-t border-[rgba(139,115,85,0.1)]">
      <div className="flex gap-2 items-end bg-white border border-[rgba(139,115,85,0.18)] rounded-[12px] px-3 py-2 shadow-[0_1px_4px_rgba(139,115,85,0.05)]">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { setValue(e.target.value); handleInput() }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? '粘豆包正在思考…' : placeholder}
          rows={1}
          className="flex-1 resize-none bg-transparent text-[14px] text-[#3D2F1F] placeholder:text-[#B8A898] focus:outline-none leading-[1.6] py-1 max-h-24 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="w-8 h-8 rounded-full bg-[#8B7355] flex items-center justify-center flex-shrink-0 mb-0.5 disabled:opacity-30 active:scale-95 transition-transform"
        >
          <ArrowUp size={16} className="text-white" />
        </button>
      </div>
      <p className="text-center text-[10px] text-[#B8A898] mt-2">Enter 发送 · Shift+Enter 换行</p>
    </div>
  )
}
