'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { styles as s } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'

export default function ReminderPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [time, setTime] = useState('21:00')
  const [enabled, setEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const res = await fetch('/api/profile')
      if (res.ok) {
        const p = await res.json()
        setEmail(p.reminder_email ?? user?.email ?? '')
        setTime(p.reminder_time ?? '21:00')
        setEnabled(p.reminder_enabled ?? false)
      }
    }
    load()
  }, [supabase.auth])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminder_email: email, reminder_time: time, reminder_enabled: enabled }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto">
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-primary -ml-1 p-1"><ChevronLeft size={22} /></button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">每日提醒</span>
        <div className="w-6" />
      </header>

      <div className="px-page-x py-page-y space-y-5">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body-md text-text-primary font-medium">开启每日提醒</p>
            <p className="text-body-sm text-text-muted mt-0.5">设定时间后会发邮件提醒你</p>
          </div>
          <button
            onClick={() => setEnabled(v => !v)}
            className={`relative w-12 h-[26px] rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-accent' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className={enabled ? '' : 'opacity-40 pointer-events-none'}>
          <div>
            <label className="block text-body-sm text-text-secondary mb-1.5">提醒邮箱</label>
            <input className={s.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email" />
          </div>
          <div className="mt-4">
            <label className="block text-body-sm text-text-secondary mb-1.5">提醒时间</label>
            <input className={s.input} value={time} onChange={e => setTime(e.target.value)} type="time" />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className={`w-full ${s.btnPrimary} disabled:opacity-60 ${saved ? 'bg-accent shadow-none' : ''}`}>
          {saving ? '保存中…' : saved ? '已保存' : '保存设置'}
        </button>
      </div>
    </div>
  )
}
