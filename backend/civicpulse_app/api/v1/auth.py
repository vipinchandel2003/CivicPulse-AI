import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from civicpulse_app.core.database import get_db
from civicpulse_app.core.redis import get_redis_client
from civicpulse_app.core.security import create_access_token, create_refresh_token
from civicpulse_app.services.otp import OTPService
from civicpulse_app.schemas.auth import OTPRequest, OTPVerifyRequest, TokenResponse
from civicpulse_app.models.spatial_user import User, Device
from civicpulse_app.domain.enums import UserRole

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/otp/request")
async def request_otp(
    payload: OTPRequest,
    redis_client: aioredis.Redis = Depends(get_redis_client),
):
    otp = await OTPService.generate_otp(redis_client, payload.phone)
    # In production SMS/WhatsApp is sent; for dev return debug_otp
    return {
        "message": "OTP generated and sent successfully",
        "debug_otp": otp,
    }


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(
    payload: OTPVerifyRequest,
    db: AsyncSession = Depends(get_db),
    redis_client: aioredis.Redis = Depends(get_redis_client),
):
    valid = await OTPService.verify_otp(redis_client, payload.phone, payload.otp)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    # Find or create user
    stmt = select(User).where(User.phone == payload.phone)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        user = User(
            phone=payload.phone,
            role=UserRole.CITIZEN,  # Self-signup default is citizen
            is_active=True,
            on_duty=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Record or update device
    device_stmt = select(Device).where(Device.device_id == payload.device_id)
    dev_res = await db.execute(device_stmt)
    device = dev_res.scalar_one_or_none()

    if not device:
        device = Device(
            user_id=user.id,
            device_id=payload.device_id,
            platform=payload.platform,
            fcm_token=payload.fcm_token,
            last_active=datetime.now(timezone.utc),
        )
        db.add(device)
    else:
        device.last_active = datetime.now(timezone.utc)
        if payload.fcm_token:
            device.fcm_token = payload.fcm_token

    await db.commit()

    access_token = create_access_token(str(user.id), user.role.value)
    refresh_token = create_refresh_token(str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        phone=user.phone,
    )
