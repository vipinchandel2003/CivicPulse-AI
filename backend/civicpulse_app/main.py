from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog
from civicpulse_app.api.v1.health import router as health_router
from civicpulse_app.api.v1.auth import router as auth_router
from civicpulse_app.api.v1.issues import router as issues_router
from civicpulse_app.api.v1.inspector import router as inspector_router
from civicpulse_app.api.v1.verification import router as verification_router
from civicpulse_app.api.v1.analytics import router as analytics_router
from civicpulse_app.api.v1.websocket import router as websocket_router
from civicpulse_app.core.config import get_settings
from civicpulse_app.core.logging import setup_logging
from civicpulse_app.core.middleware import SecurityHeadersMiddleware

settings = get_settings()
setup_logging()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application starting up...", environment=settings.ENVIRONMENT)
    yield
    logger.info("Application shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

# Security headers and CORS
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router, prefix="")
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(issues_router, prefix=settings.API_V1_PREFIX)
app.include_router(inspector_router, prefix=settings.API_V1_PREFIX)
app.include_router(verification_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(websocket_router, prefix="")

@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "status": "online",
        "docs": "/docs",
        "health": "/healthz",
    }
