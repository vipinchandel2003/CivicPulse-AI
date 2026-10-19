from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis
from civicpulse_app.core.database import get_db
from civicpulse_app.core.redis import get_redis_client

router = APIRouter(tags=["Health"])


@router.get("/healthz")
async def health_check(
    db: AsyncSession = Depends(get_db),
    redis_client: aioredis.Redis = Depends(get_redis_client),
) -> dict[str, Any]:
    db_status = "error"
    redis_status = "error"

    # DB Check
    try:
        result = await db.execute(text("SELECT 1"))
        if result.scalar() == 1:
            db_status = "ok"
    except Exception as exc:
        db_status = f"error: {str(exc)}"

    # Redis Check
    try:
        pong = await redis_client.ping()
        if pong:
            redis_status = "ok"
    except Exception as exc:
        redis_status = f"error: {str(exc)}"

    overall_ok = db_status == "ok" and redis_status == "ok"

    return {
        "status": "healthy" if overall_ok else "degraded",
        "services": {
            "database": db_status,
            "redis": redis_status,
        },
    }
