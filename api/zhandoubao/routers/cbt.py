import uuid
from datetime import date
from fastapi import APIRouter, Depends
from auth import get_current_user
from database import get_conn
from models import ApiResponse, CBTCreate, CBTOut

router = APIRouter(prefix="/cbt", tags=["CBT 认知行为"])


def _parse_cbt(row: dict) -> dict:
    return CBTOut(
        id=row["id"],
        user_id=row["user_id"],
        thought=row["thought"],
        score_before=row["score_before"],
        evidence=row["evidence"],
        counter_evidence=row["counter_evidence"],
        friend_advice=row["friend_advice"],
        reframe=row["reframe"],
        score_after=row["score_after"],
        observation=row["observation"],
        created_at=row["created_at"],
    ).model_dump()


@router.post("")
async def create_cbt(body: CBTCreate, user_id: str = Depends(get_current_user)):
    """保存 CBT 记录"""
    record_id = str(uuid.uuid4())

    async with get_conn() as (conn, cur):
        await cur.execute(
            """INSERT INTO cbt_records
               (id, user_id, thought, score_before, evidence, counter_evidence,
                friend_advice, reframe, score_after, observation)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (record_id, user_id, body.thought, body.score_before, body.evidence,
             body.counter_evidence, body.friend_advice, body.reframe,
             body.score_after, body.observation),
        )

    return ApiResponse(data={"id": record_id}, msg="CBT 记录已保存")


@router.get("")
async def list_cbt(
    page: int = 1,
    page_size: int = 20,
    user_id: str = Depends(get_current_user),
):
    """获取 CBT 记录列表（最新优先）"""
    offset = (page - 1) * page_size

    async with get_conn() as (conn, cur):
        await cur.execute(
            "SELECT COUNT(*) AS total FROM cbt_records WHERE user_id = %s",
            (user_id,),
        )
        total = (await cur.fetchone())["total"]

        await cur.execute(
            "SELECT * FROM cbt_records WHERE user_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (user_id, page_size, offset),
        )
        rows = await cur.fetchall()

    return ApiResponse(data={
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [_parse_cbt(r) for r in rows],
    })


@router.get("/today")
async def check_today(user_id: str = Depends(get_current_user)):
    """检查今日是否已有 CBT 记录"""
    today = date.today()

    async with get_conn() as (conn, cur):
        await cur.execute(
            "SELECT * FROM cbt_records WHERE user_id = %s AND DATE(created_at) = %s ORDER BY created_at DESC LIMIT 1",
            (user_id, today),
        )
        row = await cur.fetchone()

    if not row:
        return ApiResponse(data={"has_today": False, "record": None})

    return ApiResponse(data={"has_today": True, "record": _parse_cbt(row)})
