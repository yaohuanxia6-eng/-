'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Wrench, BarChart3, User } from 'lucide-react'

const tabs = [
  { label: '聊天', href: '/chat', icon: MessageSquare },
  { label: '工具箱', href: '/toolkit', icon: Wrench },
  { label: '情绪记录', href: '/history', icon: BarChart3 },
  { label: '我的', href: '/settings', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border">
      <div className="max-w-[430px] mx-auto flex items-center justify-around h-14 px-2">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + '/')
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 transition-colors duration-200 ${
                isActive
                  ? 'text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] leading-tight font-medium">
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
