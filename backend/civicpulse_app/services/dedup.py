import secrets
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geography
from civicpulse_app.models.issue import CivicIssue, IssueStatus
from civicpulse_app.domain.enums import Department


def generate_ticket_code(ward_number: Optional[int] = None) -> str:
    """
    Format: IMC-{YEAR}-W{WARD}-{RANDOM_HEX}
    Example: IMC-2026-W04-7F89
    """
    year = datetime.now(timezone.utc).year
    w_str = f"W{ward_number:02d}" if ward_number else "W00"
    rand = secrets.token_hex(2).upper()
    return f"IMC-{year}-{w_str}-{rand}"


class SpatialDedupService:
    DEDUP_RADIUS_METRES = 25.0

    @classmethod
    async def find_duplicate_master(
        cls,
        session: AsyncSession,
        category: str,
        lng: float,
        lat: float,
    ) -> Optional[CivicIssue]:
        """
        D3 decision from research.md:
        Dedup checks ALL open issues of the same category within 25m.
        Uses Geography cast for true metric distance calculation.
        """
        point_geog = func.cast(func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326), Geography)

        open_statuses = [
            IssueStatus.RECEIVED,
            IssueStatus.TRIAGED,
            IssueStatus.ASSIGNED,
            IssueStatus.UNROUTED,
            IssueStatus.IN_PROGRESS,
            IssueStatus.REOPENED,
        ]

        query = (
            select(CivicIssue)
            .where(
                and_(
                    CivicIssue.category == category,
                    CivicIssue.status.in_(open_statuses),
                    func.ST_DWithin(CivicIssue.location, point_geog, cls.DEDUP_RADIUS_METRES),
                )
            )
            .order_by(
                func.ST_Distance(CivicIssue.location, point_geog)
            )
            .limit(1)
        )

        res = await session.execute(query)
        return res.scalar_one_or_none()
