// types/index.ts

export interface UserProfile {
  id: string
  phone: string | null
  email: string | null
  nickname: string
  reminder_email: string | null
  reminder_time: string
  reminder_enabled: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  role: 'ai' | 'user'
  content: string
  timestamp: string
}

export type EmotionType = '焦虑' | '空虚' | '低落' | '平静' | '愉悦' | '混乱' | '危机'

export interface Session {
  id: string
  user_id: string
  session_date: string
  emotion_type: EmotionType | null
  emotion_snapshot: string | null
  micro_action: string | null
  micro_action_done: boolean
  micro_action_feedback: string | null
  messages: Message[]
  status: 'in_progress' | 'completed'
  created_at: string
}

export interface MemoryFact {
  fact: string
  category: '压力源' | '人际关系' | '近期困境' | '有效策略' | '其他'
  updated_at: string
}

export interface MemorySummary {
  id: string
  user_id: string
  key_facts: MemoryFact[]
  updated_at: string
}

export interface ChatRequest {
  message: string
  session_id: string
}
