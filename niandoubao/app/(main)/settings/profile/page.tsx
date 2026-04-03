'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { styles as s } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'

export default function ProfileEditPage() {
  const router = useRouter()
  const supabase = createClient()
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setUserEmail(user.email)
      const res = await fetch('/api/profile')
      if (res.ok) {
        const p = await res.json()
        setNickname(p.nickname ?? '')
      }
    }
    load()
  }, [supabase.auth])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  async function handleChangePw() {
    if (!curPw || !newPw) return
    if (newPw.length < 6) { setPwMsg('新密码至少需要6位'); return }
    setChangingPw(true); setPwMsg('')
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
    })
    const result = await res.json()
    if (res.ok) {
      setPwMsg('密码修改成功'); setCurPw(''); setNewPw('')
      setTimeout(() => { setShowPw(false); setPwMsg('') }, 2000)
    } else { setPwMsg(result.error || '修改失败') }
    setChangingPw(false)
  }

  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto">
      <header className="h-14 bg-white/90 border-b border-border flex items-center px-5 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-primary -ml-1 p-1"><ChevronLeft size={22} /></button>
        <span className="flex-1 text-center text-body-md font-medium text-text-primary">个人信息</span>
        <div className="w-6" />
      </header>

      <div className="px-page-x py-page-y space-y-5">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[32px] font-serif font-semibold">
            {(nickname || '?').charAt(0)}
          </div>
          <p className="text-body-sm text-text-muted">{userEmail}</p>
        </div>

        {/* Nickname */}
        <div>
          <label className="block text-body-sm text-text-secondary mb-1.5">昵称</label>
          <input className={s.input} value={nickname} onChange={e => setNickname(e.target.value)} placeholder="你想让我怎么称呼你？" />
        </div>

        <button onClick={handleSave} disabled={saving} className={`w-full ${s.btnPrimary} disabled:opacity-60 ${saved ? 'bg-accent shadow-none' : ''}`}>
          {saving ? '保存中…' : saved ? '已保存' : '保存修改'}
        </button>

        {/* Password */}
        <div className="pt-2 border-t border-border">
          {!showPw ? (
            <button onClick={() => setShowPw(true)} className="text-body-sm text-primary">修改密码</button>
          ) : (
            <div className="space-y-3 animate-card-in">
              <input className={s.input} type="password" value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="当前密码" />
              <input className={s.input} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="新密码（至少6位）" />
              {pwMsg && <p className={`text-body-sm ${pwMsg.includes('成功') ? 'text-accent-dark' : 'text-crisis'}`}>{pwMsg}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setShowPw(false); setPwMsg('') }} className={`flex-1 ${s.btnSecondary}`}>取消</button>
                <button onClick={handleChangePw} disabled={changingPw || !curPw || !newPw} className={`flex-1 ${s.btnPrimary} disabled:opacity-40`}>{changingPw ? '修改中…' : '确认修改'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
