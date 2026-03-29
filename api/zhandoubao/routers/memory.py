import os
import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from auth import get_current_user
from database import get_conn
from models import ApiResponse

router = APIRouter(prefix="/memory", tags=["记忆系统"])

ai_client = OpenAI(
    api_key=os.getenv("KIMI_API_KEY", os.getenv("DEEPSEEK_API_KEY", "")),
    base_url=os.getenv("KIMI_BASE_URL", os.getenv("DEEPSEEK_BASE_URL", "https://api.moonshot.cn/v1")),
)
CHAT_MODEL = os.getenv("AI_MODEL", "moonshot-v1-8k")

MEMORY_EXTRACT_PROMPT = """你是一个记忆提炼助手。从以下对话中提取最多5条重要且稳定的事实。

分类标准：压力源｜人际关系｜近期困境｜有效策略｜其他

规则：
- 只提炼稳定信息（人物、长期状态、重要事件），不提炼当天心情
- 输出纯 JSON 数组，不要其他文字
- 格式：[{"fact": "...", "category": "压力源"}]

对话内容：
"""


@router.get("")
async def get_memory(user_id: str = Depends(get_current_user)):
    """获取当前用户的记忆"""
    async with get_conn() as (conn, cur):
        await cur.execute("SELECT * FROM memory_summary WHERE user_id = %s", (user_id,))
        row = await cur.fetchone()

    if not row:
        return ApiResponse(data={"user_id": user_id, "key_facts": [], "updated_at": None})

    facts = row.get("key_facts")
    if isinstance(facts, str):
        facts = json.loads(facts)

    return ApiResponse(data={
        "user_id": user_id,
        "key_facts": facts or [],
        "updated_at": row.get("updated_at"),
    })


@router.post("/extract")
async def extract_memory(session_id: str, user_id: str = Depends(get_current_user)):
    """从已完成会话中提炼记忆事实"""
    # 获取会话
    async with get_conn() as (conn, cur):
        await cur.execute(
            "SELECT * FROM sessions WHERE id = %s AND user_id = %s AND status = 'completed'",
            (session_id, user_id),
        )
        session = await cur.fetchone()

    if not session:
        raise HTTPException(status_code=404, detail="会话不存在或未完成")

    # 解析消息
    messages_raw = session.get("messages")
    if isinstance(messages_raw, str):
        messages_raw = json.loads(messages_raw)
    if not messages_raw:
        return ApiResponse(msg="对话为空，无法提炼")

    # 拼接对话文本
    dialog = "\n".join(f"{'用户' if m['role'] == 'user' else 'AI'}: {m['content']}" for m in messages_raw)

    # 调用 AI 提炼
    response = ai_client.chat.completions.create(
        model=CHAT_MODEL,
        temperature=0.2,
        max_tokens=500,
        messages=[
            {"role": "system", "content": MEMORY_EXTRACT_PROMPT + dialog},
        ],
    )

    ai_text = response.choices[0].message.content or "[]"

    # 解析 JSON
    try:
        # 提取 JSON 部分（AI 可能返回带 markdown 代码块）
        if "```" in ai_text:
            ai_text = ai_text.split("```")[1]
            if ai_text.startswith("json"):
                ai_text = ai_text[4:]
        new_facts = json.loads(ai_text.strip())
    except (json.JSONDecodeError, IndexError):
        return ApiResponse(code=1, msg="记忆提炼结果解析失败")

    now = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    for f in new_facts:
        f["updated_at"] = now

    # 读取现有记忆
    async with get_conn() as (conn, cur):
        await cur.execute("SELECT key_facts FROM memory_summary WHERE user_id = %s", (user_id,))
        row = await cur.fetchone()

    existing = []
    if row and row.get("key_facts"):
        existing = row["key_facts"] if isinstance(row["key_facts"], list) else json.loads(row["key_facts"])

    # 合并规则：同类别≤3条，总共≤10条
    for nf in new_facts:
        cat = nf.get("category", "其他")
        same_cat = [f for f in existing if f.get("category") == cat]
        if len(same_cat) >= 3:
            # 替换最旧的
            oldest = min(same_cat, key=lambda x: x.get("updated_at", ""))
            existing.remove(oldest)
        existing.append(nf)

    # 总量限制
    if len(existing) > 10:
        existing.sort(key=lambda x: x.get("updated_at", ""))
        existing = existing[-10:]

    # upsert
    async with get_conn() as (conn, cur):
        facts_json = json.dumps(existing, ensure_ascii=False)
        if row:
            await cur.execute(
                "UPDATE memory_summary SET key_facts = %s WHERE user_id = %s",
                (facts_json, user_id),
            )
        else:
            await cur.execute(
                "INSERT INTO memory_summary (id, user_id, key_facts) VALUES (%s, %s, %s)",
                (str(uuid.uuid4()), user_id, facts_json),
            )

    return ApiResponse(data={"extracted": len(new_facts), "total": len(existing)}, msg="记忆提炼完成")
