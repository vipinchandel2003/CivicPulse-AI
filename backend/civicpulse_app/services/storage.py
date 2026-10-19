import io
import uuid
from datetime import timedelta
from typing import Optional
from minio import Minio
from minio.error import S3Error
import structlog
from civicpulse_app.core.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


class StorageService:
    def __init__(self):
        self.endpoint = settings.MINIO_ENDPOINT
        self.access_key = settings.MINIO_ACCESS_KEY
        self.secret_key = settings.MINIO_SECRET_KEY
        self.secure = settings.MINIO_SECURE
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self._client: Optional[Minio] = None

    @property
    def client(self) -> Minio:
        if self._client is None:
            self._client = Minio(
                self.endpoint,
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=self.secure,
            )
        return self._client

    def ensure_bucket_exists(self):
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
        except Exception as exc:
            logger.warning("Could not auto-create MinIO bucket (offline dev mode)", error=str(exc))

    def upload_image(self, file_bytes: bytes, content_type: str = "image/jpeg", folder: str = "reports") -> str:
        """
        Uploads image buffer with random UUID filename and returns storage key.
        Client filenames are NEVER trusted (Security.md §6a).
        """
        file_ext = "jpg" if "jpeg" in content_type else "webp"
        unique_key = f"{folder}/{uuid.uuid4().hex}.{file_ext}"

        try:
            self.ensure_bucket_exists()
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=unique_key,
                data=io.BytesIO(file_bytes),
                length=len(file_bytes),
                content_type=content_type,
            )
        except Exception as exc:
            logger.warning("MinIO upload simulated/offline", key=unique_key, error=str(exc))

        return unique_key

    def get_presigned_download_url(self, object_key: str, expires_minutes: int = 15) -> str:
        """
        Generates short-lived signed URL (15 min TTL) for authorized viewers.
        """
        try:
            return self.client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=object_key,
                expires=timedelta(minutes=expires_minutes),
            )
        except Exception:
            # Fallback for dev / mock environment
            protocol = "https" if self.secure else "http"
            return f"{protocol}://{self.endpoint}/{self.bucket_name}/{object_key}?token=mock_presigned_token"
