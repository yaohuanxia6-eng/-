from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime, date, time


# ── 通用响应 ──

class ApiResponse(BaseModel):
    code: int = 0
    data: object = None
    msg: str = "ok"


# ── 用户资料 ──

class ProfileUpdate(BaseModel):
    nickname: Optional[str] = Field(None, max_length=50)
    reminder_email: Optional[str] = None
    reminder_time: Optional[str] = None  # HH:MM 格式
    reminder_enabled: Optional[bool] = None


class ProfileOut(BaseModel):
    id: str
    email: Optional[str] = None
    nickname: str = "小豆包"
    reminder_email: Optional[str] = None
    reminder_time: str = "21:00"
    reminder_enabled: bool = False
    created_at: Optional[datetime] = None


# ── 会话 ──

EmotionType = Literal["焦虑", "空虚", "低落", "平静", "愉悦", "混乱", "危机"]


class MessageItem(BaseModel):
    role: Literal["ai", "user"]
    content: str
    timestamp: Optional[str] = None


class SessionOut(BaseModel):
    id: str
    user_id: str
    session_date: date
    emotion_type: Optional[str] = None
    micro_action: Optional[str] = None
    micro_action_done: bool = False
    messages: list[MessageItem] = []
    status: str = "in_progress"
    created_at: Optional[datetime] = None


# ── 对话请求 ──

class ChatRequest(BaseModel):
    message: str = Field(..., max_length=2000)
    session_id: str


# ── 记忆 ──

class MemoryFact(BaseModel):
    fact: str
    category: Literal["压力源", "人际关系", "近期困境", "有效策略", "其他"]
    updated_at: Optional[str] = None


class MemoryOut(BaseModel):
    user_id: str
    key_facts: list[MemoryFact] = []
    updated_at: Optional[datetime] = None
