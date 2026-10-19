import pytest
from httpx import AsyncClient, ASGITransport
from civicpulse_app.main import app
from civicpulse_app.core.pii import mask_phone_number


def test_reporter_phone_redacted_for_field_inspector():
    """
    Hard rule / Security.md §6: Never expose reporter phone to Tier 1.
    """
    raw_phone = "+919876543210"
    masked = mask_phone_number(raw_phone, user_role="FIELD_INSPECTOR")
    assert masked == "[REDACTED_FIELD_TIER]"
    assert "9876543210" not in masked


def test_reporter_phone_partially_masked_for_supervisor():
    """
    Tier 2/3 supervisor sees masked digits for audit sanity.
    """
    raw_phone = "+919876543210"
    masked = mask_phone_number(raw_phone, user_role="WARD_CSI")
    assert "****" in masked
    assert "+919" in masked
    assert "210" in masked


@pytest.mark.asyncio
async def test_security_headers_present_in_responses():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
