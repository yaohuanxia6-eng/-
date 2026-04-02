'use client'

import Link from 'next/link'
import { BottomNav } from '@/components/layout/BottomNav'

const tools = [
  {
    emoji: '🫁',
    title: '呼吸练习',
    desc: '4-7-8 呼吸法，快速缓解焦虑',
    duration: '3分钟',
    href: '/toolkit/breathing',
  },
  {
    emoji: '✍️',
    title: '情绪日记',
    desc: '记录感受，整理内心',
    duration: '5分钟',
    href: '/toolkit/diary',
  },
  {
    emoji: '🧠',
    title: '认知重构',
    desc: '换个角度看问题',
    duration: '10分钟',
    href: '/toolkit/cbt',
  },
  {
    emoji: '🧘',
    title: '感官落地',
    desc: '5-4-3-2-1 回到当下',
    duration: '3分钟',
    href: '/toolkit/grounding',
  },
  {
    emoji: '🛡️',
    title: '安全计划',
    desc: '为困难时刻提前准备',
    duration: '',
    href: '/toolkit/safety-plan',
  },
  {
    emoji: '🌟',
    title: '感恩记录',
    desc: '发现生活中的美好',
    duration: '',
    href: '/toolkit/gratitude',
  },
]

export default function ToolkitPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-[430px] mx-auto px-page-x py-page-y">
        {/* Header */}
        <h1 className="font-serif text-title-lg text-primary mb-2">工具箱</h1>
        <p className="text-body-md text-text-secondary mb-6 leading-relaxed">
          不只是聊天。这里有经过验证的心理工具，帮你在需要的时候照顾自己。
        </p>

        {/* Section label */}
        <h2 className="text-label uppercase tracking-widest text-text-muted mb-3">
          全部工具
        </h2>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="bg-surface rounded-card border border-border shadow-card p-4 flex flex-col gap-2 hover:shadow-card-hover transition-all duration-200 active:scale-[0.97]"
            >
              <span className="text-2xl">{tool.emoji}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-body-md font-medium text-text-primary">
                    {tool.title}
                  </h3>
                  {tool.duration && (
                    <span className="text-label bg-primary/[0.08] text-primary rounded-chip px-2 py-0.5">
                      {tool.duration}
                    </span>
                  )}
                </div>
                <p className="text-body-sm text-text-muted mt-1">{tool.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
