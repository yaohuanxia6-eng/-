'use client'
import Link from 'next/link'
import { ChevronLeft, Settings } from 'lucide-react'

interface AppHeaderProps {
  showBack?: boolean
  onBack?: () => void
  title?: string
  nickname?: string
  showSettings?: boolean
}

export function AppHeader({ showBack, onBack, title, nickname = '小豆包', showSettings = false }: AppHeaderProps) {
  const initial = nickname.charAt(0)

  return (
    <header className="h-14 bg-white border-b border-[rgba(139,115,85,0.12)] flex items-center px-5 flex-shrink-0">
      {/* 左侧 */}
      <div className="flex-1">
        {showBack ? (
          <button onClick={onBack} className="flex items-center gap-1 text-[#8B7355] -ml-1 p-1">
            <ChevronLeft size={22} />
          </button>
        ) : (
          <h1 className="font-serif text-[#8B7355] text-[18px] font-semibold tracking-wide">粘豆包</h1>
        )}
      </div>

      {/* 中间 title */}
      {title && (
        <span className="text-[14px] font-medium text-[#3D2F1F]">{title}</span>
      )}

      {/* 右侧 */}
      <div className="flex-1 flex justify-end items-center gap-3">
        {showSettings && (
          <Link href="/settings">
            <Settings size={18} className="text-[#B8A898]" />
          </Link>
        )}
        <div className="w-8 h-8 rounded-full bg-[#8B7355] flex items-center justify-center">
          <span className="text-white text-[13px] font-medium">{initial}</span>
        </div>
      </div>
    </header>
  )
}
