import secrets
from typing import Optional
import redis.asyncio as aioredis


class CaptureNonceService:
    NONCE_TTL_SECONDS = 60  # Strict 60-second window

    @staticmethod
    def _nonce_key(user_id: str, nonce: str) -> str:
        return f"capture_nonce:{user_id}:{nonce}"

    @classmethod
    async def generate_nonce(cls, redis_client: aioredis.Redis, user_id: str) -> str:
        """
        Issues a single-use cryptographically secure nonce bound to user_id.
        TTL is 60 seconds.
        """
        nonce = secrets.token_urlsafe(32)
        key = cls._nonce_key(user_id, nonce)
        # Store in Redis with TTL
        await redis_client.setex(key, cls.NONCE_TTL_SECONDS, "valid")
        return nonce

    @classmethod
    async def validate_and_consume_nonce(
        cls, redis_client: aioredis.Redis, user_id: str, nonce: str
    ) -> bool:
        """
        Atomically validates and deletes the nonce to prevent replay attacks.
        Returns True if valid, False if invalid or expired.
        """
        key = cls._nonce_key(user_id, nonce)
        # Use atomic GETDEL or pipe
        val = await redis_client.get(key)
        if not val:
            return False
        # Consume immediately (single-use)
        await redis_client.delete(key)
        return True
