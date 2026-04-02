import { createClient } from '@supabase/supabase-js'

/** 服务端 admin 客户端（使用 service_role key，绕过 RLS）*/
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
