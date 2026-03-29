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
    <header className="h-14 backdrop-blur-sm bg-white/90 border-b border-border flex items-center px-5 flex-shrink-0 sticky top-0 z-10">
      {/* 左侧 */}
      <div className="flex-1">
        {showBack ? (
          <button onClick={onBack} className="flex items-center gap-1 text-primary -ml-1 p-1 transition-colors duration-200 hover:text-primary-dark">
            <ChevronLeft size={22} />
          </button>
        ) : (
          <h1 className="font-serif text-primary text-title-md tracking-wide">粘豆包</h1>
        )}
      </div>

      {/* 中间 title */}
      {title && (
        <span className="text-body-md font-medium text-text-primary">{title}</span>
      )}

      {/* 右侧 */}
      <div className="flex-1 flex justify-end items-center gap-3">
        {showSettings && (
          <Link href="/settings" className="transition-colors duration-200 hover:text-primary">
            <Settings size={18} className="text-text-muted" />
          </Link>
        )}
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-white text-body-sm font-medium">{initial}</span>
        </div>
      </div>
    </header>
  )
}
