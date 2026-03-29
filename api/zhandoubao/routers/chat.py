import os
import json
import re
import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAI
from auth import get_current_user
from database import get_conn
from models import ChatRequest, ApiResponse

router = APIRouter(tags=["AI 对话"])

# ── AI 客户端 ──
ai_client = OpenAI(
    api_key=os.getenv("KIMI_API_KEY", os.getenv("DEEPSEEK_API_KEY", "")),
    base_url=os.getenv("KIMI_BASE_URL", os.getenv("DEEPSEEK_BASE_URL", "https://api.moonshot.cn/v1")),
)
CHAT_MODEL = os.getenv("AI_MODEL", "moonshot-v1-8k")

# ── 危机关键词 ──
CRISIS_KEYWORDS = ["想死", "去死", "不想活", "自杀", "结束生命", "活不下去", "不想活了", "消失算了", "了结", "跳楼", "割腕", "轻生"]

# ── 频率限制 ──
_rate_map: dict[str, dict] = defaultdict(lambda: {"count": 0, "reset_at": 0.0})
RATE_LIMIT = 10
RATE_WINDOW = 60


def _check_rate_limit(user_id: str) -> bool:
    now = time.time()
    entry = _rate_map[user_id]
    if now > entry["reset_at"]:
        entry["count"] = 1
        entry["reset_at"] = now + RATE_WINDOW
        return True
    if entry["count"] >= RATE_LIMIT:
        return False
    entry["count"] += 1
    return True


def _detect_crisis(text: str) -> bool:
    return any(kw in text for kw in CRISIS_KEYWORDS)


def _build_system_prompt(memory_facts: list[dict], yesterday_action: str | None) -> str:
    """构建系统提示词"""
    memory_block = ""
    if memory_facts:
        facts_text = "\n".join(f"- {f['fact']}（{f['category']}）" for f in memory_facts)
        memory_block = f"\n\n【你记住的关于她的事】\n{facts_text}"

    action_block = ""
    if yesterday_action:
        action_block = f"\n\n【昨天给她的微行动】{yesterday_action}\n（今天开头先温柔追问：做了没有、感觉怎样。不管她做没做都先肯定她。）"

    return f"""你是"粘豆包"，一个温柔的情绪陪伴伙伴。你像一个懂她的闺蜜，不像心理咨询师。

【性格】温柔、共情、偶尔幽默，绝不油腻、不说教
【对话节奏】先接住情绪，再往下走。用户说"好烦啊"，先说"听起来今天挺累的"，不急着问为什么
【回复规范】每条 80 字以内，像发微信，结尾带一个具体追问推动对话继续

【签到步骤（按顺序引导，不要一次全问完）】
1. 开放式问"大概感觉怎样"
2. 追问具体原因
3. 再追问深层担忧/难受点
4. 给出情绪"命名"（如"听起来是一种被困住的焦虑"）
5. 给1个微行动建议（格式：今天可以：xxx），要具体、5-15分钟内完成
6. 温暖结束语

【微行动规范】只给1个，走向真实生活，不是留在App里

【禁止事项】
- 不做心理诊断
- 不给药物建议
- 不超过80字
- 不重复用户原话
- 不说"你要学会接受""这很正常""你应该"
- 一次只问1个问题{memory_block}{action_block}"""


def _extract_micro_action(text: str) -> str | None:
    patterns = [
        r"今天可以[：:]\s*(.+?)(?:\n|$)",
        r"微行动[：:]\s*(.+?)(?:\n|$)",
        r"试着(.{6,30})(?:\n|$)",
        r"可以试试(.{4,25})(?:\n|$)",
    ]
    for p in patterns:
        m = re.search(p, text)
        if m:
            return m.group(1).strip()
    return None


@router.post("/chat")
async def chat(body: ChatRequest, user_id: str = Depends(get_current_user)):
    # 频率限制
    if not _check_rate_limit(user_id):
        raise HTTPException(status_code=429, detail="请求太频繁，请稍后再试")

    # 获取会话
    async with get_conn() as (conn, cur):
        await cur.execute("SELECT * FROM sessions WHERE id = %s AND user_id = %s", (body.session_id, user_id))
        session = await cur.fetchone()

    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    # 解析历史消息
    messages_raw = session.get("messages")
    if isinstance(messages_raw, str):
        messages_raw = json.loads(messages_raw)
    history: list[dict] = messages_raw if messages_raw else []

    # 危机检测
    crisis = _detect_crisis(body.message)

    # 读取记忆
    async with get_conn() as (conn, cur):
        await cur.execute("SELECT key_facts FROM memory_summary WHERE user_id = %s", (user_id,))
        mem_row = await cur.fetchone()
    memory_facts = []
    if mem_row and mem_row.get("key_facts"):
        facts = mem_row["key_facts"]
        if isinstance(facts, str):
            facts = json.loads(facts)
        memory_facts = facts

    # 读取昨日微行动
    from datetime import date, timedelta
    yesterday = date.today() - timedelta(days=1)
    async with get_conn() as (conn, cur):
        await cur.execute(
            "SELECT micro_action FROM sessions WHERE user_id = %s AND session_date = %s",
            (user_id, yesterday),
        )
        yd_row = await cur.fetchone()
    yesterday_action = yd_row["micro_action"] if yd_row else None

    # 构建 API 消息
    system_prompt = _build_system_prompt(memory_facts, yesterday_action)
    api_messages = [{"role": "system", "content": system_prompt}]
    for m in history:
        role = "assistant" if m.get("role") == "ai" else "user"
        api_messages.append({"role": role, "content": m["content"]})
    api_messages.append({"role": "user", "content": body.message})

    # 限制历史长度（最多30条 + system）
    if len(api_messages) > 31:
        api_messages = [api_messages[0]] + api_messages[-30:]

    async def event_stream():
        # 危机信号
        if crisis:
            yield f"data: {json.dumps({'crisis': True})}\n\n"

        accumulated = ""
        stream = ai_client.chat.completions.create(
            model=CHAT_MODEL,
            stream=True,
            temperature=0.85,
            max_tokens=200,
            presence_penalty=0.3,
            messages=api_messages,
        )

        for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices[0].delta else None
            if delta:
                accumulated += delta
                yield f"data: {json.dumps({'token': delta})}\n\n"
            if chunk.choices[0].finish_reason == "stop":
                yield "data: [DONE]\n\n"

        # 流结束后保存消息到数据库
        new_user_msg = {"role": "user", "content": body.message, "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")}
        new_ai_msg = {"role": "ai", "content": accumulated, "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")}
        history.append(new_user_msg)
        history.append(new_ai_msg)

        # 提取微行动
        micro = _extract_micro_action(accumulated)
        update_fields = "messages = %s"
        update_values: list = [json.dumps(history, ensure_ascii=False)]
        if micro:
            update_fields += ", micro_action = %s"
            update_values.append(micro)
        if crisis:
            update_fields += ", emotion_type = '危机'"
        update_values.append(body.session_id)

        async with get_conn() as (conn2, cur2):
            await cur2.execute(
                f"UPDATE sessions SET {update_fields} WHERE id = %s",
                update_values,
            )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
