import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 使用 service_role key 创建管理员客户端，可以跳过邮箱确认
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: '请填写邮箱和密码' }, { status: 400 })
  }

  // 用管理员权限创建用户，自动确认邮箱
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // 自动确认，不发验证邮件
  })

  if (error) {
    // 用户已存在
    if (error.message.includes('already been registered')) {
      return NextResponse.json(
        { error: '这个邮箱已经注册过了，试试直接登录？' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ user: data.user })
}
