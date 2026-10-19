from typing import Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geography, Geometry
from civicpulse_app.models.spatial_user import Ward, Zone


class SpatialRoutingService:
    @staticmethod
    async def find_ward_by_coordinates(
        session: AsyncSession, lng: float, lat: float
    ) -> Optional[Ward]:
        """
        Uses ST_Covers on polygon geometry to find which ward covers the given point.
        Points: (lng, lat) in SRID 4326.
        ST_Covers correctly includes points located on polygon boundaries.
        """
        point_geom = func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)

        query = (
            select(Ward)
            .where(func.ST_Covers(Ward.boundary, point_geom))
            .limit(1)
        )
        result = await session.execute(query)
        ward = result.scalar_one_or_none()

        if ward is not None:
            return ward

        # Fallback: Find nearest ward if outside all boundaries
        nearest_query = (
            select(Ward)
            .order_by(
                func.ST_Distance(
                    func.cast(Ward.boundary, Geography),
                    func.cast(point_geom, Geography),
                )
            )
            .limit(1)
        )
        nearest_result = await session.execute(nearest_query)
        return nearest_result.scalar_one_or_none()
