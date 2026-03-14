'use client'

import { useState } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { styles as s } from '@/lib/styles'

export default function SettingsPage() {
  const [nickname, setNickname] = useState('小鱼')
  const [reminderEmail, setReminderEmail] = useState('xiaoyu@163.com')
  const [reminderTime, setReminderTime] = useState('20:00')
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={s.page}>
      <AppHeader title="设置" />

      <div className="flex-1 overflow-y-auto px-page-x py-page-y space-y-4">

        {/* 用户信息 */}
        <section>
          <h2 className="text-label uppercase tracking-widest text-text-muted mb-3">个人信息</h2>
          <div className="bg-surface rounded-card shadow-card p-4 space-y-4">
            {/* 头像 */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-title-md font-serif font-semibold">
                {nickname.charAt(0)}
              </div>
              <div>
                <p className="text-body-md text-text-primary font-medium">{nickname}</p>
                <p className="text-body-sm text-text-muted">{reminderEmail}</p>
              </div>
            </div>

            {/* 昵称 */}
            <div>
              <label className="block text-body-sm text-text-secondary mb-1.5">昵称</label>
              <input
                className={s.input}
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="你想让我怎么称呼你？"
              />
            </div>
          </div>
        </section>

        {/* 每日提醒 */}
        <section>
          <h2 className="text-label uppercase tracking-widest text-text-muted mb-3">每日提醒</h2>
          <div className="bg-surface rounded-card shadow-card p-4 space-y-4">
            {/* 开关 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-md text-text-primary font-medium">开启每日提醒</p>
                <p className="text-body-sm text-text-muted">粘豆包会在你设定的时间发邮件提醒你</p>
              </div>
              <button
                onClick={() => setReminderEnabled(v => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  reminderEnabled ? 'bg-accent' : 'bg-border-dark'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    reminderEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 提醒邮箱 */}
            <div className={`space-y-4 transition-opacity ${reminderEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div>
                <label className="block text-body-sm text-text-secondary mb-1.5">提醒邮箱</label>
                <input
                  className={s.input}
                  value={reminderEmail}
                  onChange={e => setReminderEmail(e.target.value)}
                  placeholder="your@email.com"
                  type="email"
                />
              </div>
              <div>
                <label className="block text-body-sm text-text-secondary mb-1.5">提醒时间</label>
                <input
                  className={s.input}
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  type="time"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 关于 */}
        <section>
          <h2 className="text-label uppercase tracking-widest text-text-muted mb-3">关于</h2>
          <div className="bg-surface rounded-card shadow-card divide-y divide-border">
            {[
              { label: '版本', value: 'v0.1.0 Beta' },
              { label: '隐私政策', value: '查看 →' },
              { label: '用户协议', value: '查看 →' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-body-md text-text-primary">{item.label}</span>
                <span className="text-body-sm text-text-muted">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          className={`w-full ${s.btnPrimary} ${saved ? 'bg-accent' : ''}`}
        >
          {saved ? '✓ 已保存' : '保存设置'}
        </button>

        {/* 退出登录 */}
        <button className="w-full py-3 text-body-md text-text-muted hover:text-crisis transition-colors">
          退出登录
        </button>

        <p className="text-center text-body-sm text-text-muted pb-6">
          粘豆包会记住你 🫘
        </p>
      </div>
    </div>
  )
}
