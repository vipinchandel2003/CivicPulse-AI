from typing import List, Optional
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from civicpulse_app.models.spatial_user import User, UserWardAssignment, Ward
from civicpulse_app.domain.enums import UserRole


async def get_user_scoped_ward_ids(session: AsyncSession, user: User) -> Optional[List[uuid.UUID]]:
    """
    Security.md §4 (RBAC + Scope):
    Role alone is NOT enough; queries must be scoped:
    - SUPER_ADMIN, DEPT_HOD: None (city-wide scope, no ward restriction)
    - WARD_CSI / FIELD_INSPECTOR: List of ward IDs from user_ward_assignments
    - ZONAL_OFFICER: List of ward IDs belonging to the officer's zone
    - CITIZEN: Not authorized for staff review queues
    """
    if user.role in [UserRole.SUPER_ADMIN, UserRole.DEPT_HOD]:
        return None  # Unrestricted city-wide

    if user.role in [UserRole.WARD_CSI, UserRole.FIELD_INSPECTOR]:
        stmt = select(UserWardAssignment.ward_id).where(UserWardAssignment.user_id == user.id)
        ward_ids = (await session.execute(stmt)).scalars().all()
        return list(ward_ids)

    if user.role == UserRole.ZONAL_OFFICER:
        # Get zone from user assignments or zone mapping
        assigned_wards_stmt = select(UserWardAssignment.ward_id).where(UserWardAssignment.user_id == user.id)
        first_ward_id = (await session.execute(assigned_wards_stmt)).scalars().first()
        if not first_ward_id:
            return []
        
        # Get zone_id of that ward
        zone_stmt = select(Ward.zone_id).where(Ward.id == first_ward_id)
        zone_id = (await session.execute(zone_stmt)).scalar_one_or_none()
        if not zone_id:
            return []

        # All wards in that zone
        all_zone_wards = select(Ward.id).where(Ward.zone_id == zone_id)
        return list((await session.execute(all_zone_wards)).scalars().all())

    return []
