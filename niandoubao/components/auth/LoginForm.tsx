'use client'
import { useState } from 'react'
import { Mail, Phone, Send, ChevronRight } from 'lucide-react'

export function LoginForm() {
  const [tab, setTab] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  function startCountdown() {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  function handleSendOtp() {
    if (!phone || countdown > 0) return
    setOtpSent(true)
    startCountdown()
  }

  function handleSendMagicLink() {
    if (!email) return
    setEmailSent(true)
  }

  return (
    <div className="w-full">
      {/* Tab 切换 */}
      <div className="flex bg-[#F5EFE6] rounded-[10px] p-1 mb-6">
        <button
          onClick={() => setTab('email')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[13px] font-medium transition-colors ${
            tab === 'email' ? 'bg-white text-[#8B7355] shadow-sm' : 'text-[#B8A898]'
          }`}
        >
          <Mail size={14} />
          邮箱登录
        </button>
        <button
          onClick={() => setTab('phone')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[13px] font-medium transition-colors ${
            tab === 'phone' ? 'bg-white text-[#8B7355] shadow-sm' : 'text-[#B8A898]'
          }`}
        >
          <Phone size={14} />
          手机登录
        </button>
      </div>

      {/* 邮箱 Tab */}
      {tab === 'email' && (
        <div className="space-y-3">
          {!emailSent ? (
            <>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="输入你的邮箱（163 / QQ / Gmail）"
                className="w-full bg-white border border-[rgba(139,115,85,0.18)] rounded-[10px] px-4 py-3 text-[14px] text-[#3D2F1F] placeholder:text-[#B8A898] focus:outline-none focus:border-[#A89070] transition-colors"
              />
              <button
                onClick={handleSendMagicLink}
                disabled={!email}
                className="w-full bg-[#8B7355] text-white rounded-[10px] py-3 text-[14px] font-medium flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform shadow-[0_2px_8px_rgba(139,115,85,0.25)]"
              >
                <Send size={14} />
                发送登录链接
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-[rgba(123,174,132,0.15)] rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail size={22} className="text-[#5A9468]" />
              </div>
              <p className="text-[14px] text-[#3D2F1F] font-medium mb-1">链接已发送</p>
              <p className="text-[13px] text-[#7A6350]">请查收 <span className="font-medium">{email}</span> 的邮件</p>
              <p className="text-[12px] text-[#B8A898] mt-2">点击邮件中的链接即可登录</p>
              <button onClick={() => setEmailSent(false)} className="text-[12px] text-[#8B7355] mt-4 underline underline-offset-2">
                重新发送
              </button>
            </div>
          )}
        </div>
      )}

      {/* 手机 Tab */}
      {tab === 'phone' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="bg-white border border-[rgba(139,115,85,0.18)] rounded-[10px] px-3 py-3 text-[14px] text-[#7A6350] flex-shrink-0">
              +86
            </div>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="输入手机号"
              className="flex-1 bg-white border border-[rgba(139,115,85,0.18)] rounded-[10px] px-4 py-3 text-[14px] text-[#3D2F1F] placeholder:text-[#B8A898] focus:outline-none focus:border-[#A89070] transition-colors"
            />
          </div>

          {!otpSent ? (
            <button
              onClick={handleSendOtp}
              disabled={!phone || countdown > 0}
              className="w-full bg-[#8B7355] text-white rounded-[10px] py-3 text-[14px] font-medium disabled:opacity-40 active:scale-[0.98] transition-transform shadow-[0_2px_8px_rgba(139,115,85,0.25)]"
            >
              {countdown > 0 ? `${countdown}s 后重发` : '发送验证码'}
            </button>
          ) : (
            <>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="输入6位验证码"
                maxLength={6}
                className="w-full bg-white border border-[rgba(139,115,85,0.18)] rounded-[10px] px-4 py-3 text-[14px] text-[#3D2F1F] placeholder:text-[#B8A898] focus:outline-none focus:border-[#A89070] transition-colors tracking-widest"
              />
              <button
                disabled={otp.length !== 6}
                className="w-full bg-[#8B7355] text-white rounded-[10px] py-3 text-[14px] font-medium flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform shadow-[0_2px_8px_rgba(139,115,85,0.25)]"
              >
                登录
                <ChevronRight size={16} />
              </button>
              <button onClick={handleSendOtp} disabled={countdown > 0} className="text-center w-full text-[12px] text-[#B8A898]">
                {countdown > 0 ? `${countdown}s 后可重发` : '重新发送验证码'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
