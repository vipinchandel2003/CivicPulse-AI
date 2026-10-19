import sys
import os

# Ensure local backend directory has precedence over any globally installed editable packages
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir in sys.path:
    sys.path.remove(current_dir)
sys.path.insert(0, current_dir)

import pytest
from httpx import AsyncClient, ASGITransport
from civicpulse_app.main import app


@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "health" in data


@pytest.mark.asyncio
async def test_healthz_degraded_when_services_down():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "services" in data
    assert "database" in data["services"]
    assert "redis" in data["services"]
