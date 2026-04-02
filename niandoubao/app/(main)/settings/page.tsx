'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/layout/AppHeader'
import { styles as s } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'
import { MemoryFact } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  压力源: '😤 压力',
  人际关系: '🤝 人际',
  近期困境: '🌧 困境',
  有效策略: '✨ 策略',
  其他: '📌 其他',
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userEmail, setUserEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [reminderEmail, setReminderEmail] = useState('')
  const [reminderTime, setReminderTime] = useState('21:00')
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [memoryFacts, setMemoryFacts] = useState<MemoryFact[]>([])
  const [profileLoaded, setProfileLoaded] = useState(false)

  // 加载用户资料
  useEffect(() => {
    async function loadProfile() {
      // 邮箱从 Supabase Auth 读
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setUserEmail(user.email)

      // 资料从 API 读
      const res = await fetch('/api/profile')
      if (res.ok) {
        const profile = await res.json()
        setNickname(profile.nickname ?? '')
        setReminderEmail(profile.reminder_email ?? user?.email ?? '')
        setReminderTime(profile.reminder_time ?? '21:00')
        setReminderEnabled(profile.reminder_enabled ?? false)
      }
      setProfileLoaded(true)
    }

    async function loadMemory() {
      const res = await fetch('/api/memory')
      if (res.ok) {
        const data = await res.json()
        setMemoryFacts(data.key_facts ?? [])
      }
    }

    loadProfile()
    loadMemory()
  }, [supabase.auth])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, reminder_email: reminderEmail, reminder_time: reminderTime, reminder_enabled: reminderEnabled }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) return
    if (newPassword.length < 6) {
      setPasswordMsg('新密码至少需要6位')
      return
    }
    setChangingPassword(true)
    setPasswordMsg('')
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const result = await res.json()
    if (res.ok) {
      setPasswordMsg('密码修改成功')
      setCurrentPassword('')
      setNewPassword('')
      setTimeout(() => { setShowPasswordChange(false); setPasswordMsg('') }, 2000)
    } else {
      setPasswordMsg(result.error || '修改失败')
    }
    setChangingPassword(false)
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    const res = await fetch('/api/auth/delete', { method: 'DELETE' })
    if (res.ok) {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } else {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className={s.page}>
      <AppHeader title="设置" showBack onBack={() => router.back()} />

      <div className="flex-1 overflow-y-auto px-page-x py-page-y space-y-4">

        {/* 用户信息 */}
        <section>
          <h2 className="text-label uppercase tracking-widest text-text-muted mb-3">个人信息</h2>
          <div className="bg-surface rounded-card shadow-card p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-title-md font-serif font-semibold">
                {(nickname || '?').charAt(0)}
              </div>
              <div>
                <p className="text-body-md text-text-primary font-medium">
                  {profileLoaded ? nickname || '小豆包' : '加载中…'}
                </p>
                <p className="text-body-sm text-text-muted">{userEmail}</p>
              </div>
            </div>
            <div>
              <label className="block text-body-sm text-text-secondary mb-1.5">昵称</label>
              <input
                className={s.input}
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="你想让我怎么称呼你？"
              />
            </div>

            {/* 修改密码 */}
            {!showPasswordChange ? (
              <button
                onClick={() => setShowPasswordChange(true)}
                className="text-body-sm text-primary hover:underline underline-offset-2"
              >
                修改密码
              </button>
            ) : (
              <div className="space-y-3 pt-2 border-t border-border animate-card-in">
                <input
                  className={s.input}
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="当前密码"
                />
                <input
                  className={s.input}
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="新密码（至少6位）"
                />
                {passwordMsg && (
                  <p className={`text-body-sm ${passwordMsg.includes('成功') ? 'text-accent-dark' : 'text-crisis'}`}>
                    {passwordMsg}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowPasswordChange(false); setPasswordMsg('') }}
                    className={`flex-1 ${s.btnSecondary}`}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword}
                    className={`flex-1 ${s.btnPrimary} disabled:opacity-40`}
                  >
                    {changingPassword ? '修改中…' : '确认修改'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 粘豆包记住了什么 */}
        <section>
          <h2 className="text-label uppercase tracking-widest text-text-muted mb-3">粘豆包记住了你</h2>
          <div className="bg-surface rounded-card shadow-card p-4">
            {memoryFacts.length === 0 ? (
              <p className="text-body-sm text-text-muted text-center py-2">
                聊得越多，我对你的了解就越深 🫘
              </p>
            ) : (
              <div className="space-y-2.5">
                {memoryFacts.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-label bg-primary/8 text-primary rounded-chip px-2 py-0.5 flex-shrink-0 mt-0.5">
                      {CATEGORY_LABELS[f.category] ?? f.category}
                    </span>
                    <p className="text-body-sm text-text-primary leading-relaxed">{f.fact}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 每日提醒 */}
        <section>
          <h2 className="text-label uppercase tracking-widest text-text-muted mb-3">每日提醒</h2>
          <div className="bg-surface rounded-card shadow-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-md text-text-primary font-medium">开启每日提醒</p>
                <p className="text-body-sm text-text-muted">设定时间后会发邮件提醒你</p>
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
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-body-md text-text-primary">版本</span>
              <span className="text-body-sm text-text-muted">v0.2.0 Beta</span>
            </div>
            <Link href="/history" className="flex items-center justify-between px-4 py-3">
              <span className="text-body-md text-text-primary">情绪记录</span>
              <span className="text-body-sm text-text-muted">查看 →</span>
            </Link>
            <Link href="/privacy" className="flex items-center justify-between px-4 py-3">
              <span className="text-body-md text-text-primary">隐私政策</span>
              <span className="text-body-sm text-text-muted">查看 →</span>
            </Link>
            <Link href="/terms" className="flex items-center justify-between px-4 py-3">
              <span className="text-body-md text-text-primary">用户协议</span>
              <span className="text-body-sm text-text-muted">查看 →</span>
            </Link>
          </div>
        </section>

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full ${s.btnPrimary} transition-all duration-300 disabled:opacity-60 ${saved ? 'bg-accent shadow-none' : ''}`}
        >
          {saving ? '保存中…' : saved ? '✓ 已保存' : '保存设置'}
        </button>

        {/* 退出登录 */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full bg-surface rounded-card border border-border py-3 text-body-md text-text-muted hover:border-crisis/20 hover:text-crisis transition-all duration-200 active:scale-[0.98]"
        >
          {loggingOut ? '退出中…' : '退出登录'}
        </button>

        {/* 删除账户 */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2 text-body-sm text-text-muted hover:text-crisis transition-colors"
          >
            删除账户
          </button>
        ) : (
          <div className="bg-crisis-bg border border-crisis/20 rounded-card p-4 space-y-3 animate-card-in">
            <p className="text-body-sm text-text-primary font-medium">确定要删除账户吗？</p>
            <p className="text-body-sm text-text-secondary">此操作不可撤销，你的所有数据将被永久删除。</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className={`flex-1 ${s.btnSecondary}`}>
                取消
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-crisis text-white rounded-btn px-4 py-2.5 text-body-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
              >
                {deleting ? '删除中…' : '确认删除'}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-body-sm text-text-muted pb-6">
          粘豆包会记住你 🫘
        </p>
      </div>
    </div>
  )
}
