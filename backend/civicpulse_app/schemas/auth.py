from pydantic import BaseModel, Field
from typing import Optional
from civicpulse_app.domain.enums import UserRole, Department


class OTPRequest(BaseModel):
    phone: str = Field(..., description="10-digit mobile number, e.g. +919876543210")


class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str
    device_id: str
    platform: str = "web"  # web, android, ios
    fcm_token: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: UserRole
    phone: str
