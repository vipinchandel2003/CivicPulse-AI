from datetime import datetime, timezone
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import Geography
import redis.asyncio as aioredis

from civicpulse_app.core.database import get_db
from civicpulse_app.core.redis import get_redis_client
from civicpulse_app.core.rbac import get_current_user
from civicpulse_app.models.spatial_user import User
from civicpulse_app.models.issue import (
    CivicIssue,
    IssueReport,
    IssueMedia,
    IssueUpvote,
    IssueEvent,
)
from civicpulse_app.domain.enums import IssueStatus, PriorityLevel
from civicpulse_app.services.nonce import CaptureNonceService
from civicpulse_app.services.dedup import SpatialDedupService, generate_ticket_code
from civicpulse_app.services.spatial import SpatialRoutingService
from civicpulse_app.workers.triage_task import run_async_triage
from civicpulse_app.schemas.issue import (
    IssueCreateRequest,
    IssueSubmitResponse,
    NearbyIssueItem,
)

router = APIRouter(tags=["Issues"])


@router.post("/capture/nonce")
async def request_capture_nonce(
    current_user: User = Depends(get_current_user),
    redis_client: aioredis.Redis = Depends(get_redis_client),
):
    """
    Issues a server-bound, single-use 60-second capture nonce.
    Prevents pre-recorded gallery uploads and replay spoofing.
    """
    nonce = await CaptureNonceService.generate_nonce(redis_client, str(current_user.id))
    return {
        "nonce": nonce,
        "ttl_seconds": CaptureNonceService.NONCE_TTL_SECONDS,
    }


@router.post("/issues", response_model=IssueSubmitResponse, status_code=status.HTTP_201_CREATED)
async def submit_issue(
    payload: IssueCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis_client: aioredis.Redis = Depends(get_redis_client),
):
    """
    Fast Sync Submit (< 400 ms):
    1. Validate single-use nonce
    2. Check GPS accuracy (<= 50m)
    3. Look up Ward via ST_Covers
    4. Check for duplicate open issue within 25m
       - If duplicate found: merge, increment merged_count, register upvote, emit event
       - If new: create CivicIssue with ticket_code, emit RECEIVED event
    5. Save IssueReport & IssueMedia
    6. Return immediately with status & ticket_code
    """
    # 1. Nonce check
    is_valid_nonce = await CaptureNonceService.validate_and_consume_nonce(
        redis_client, str(current_user.id), payload.capture_nonce
    )
    if not is_valid_nonce:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired or already consumed capture nonce. Live capture required.",
        )

    # 2. GPS check
    if payload.accuracy_m > 50.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"GPS accuracy ({payload.accuracy_m}m) exceeds maximum allowable 50m.",
        )

    # 3. Ward Lookup
    ward = await SpatialRoutingService.find_ward_by_coordinates(
        db, payload.longitude, payload.latitude
    )
    ward_id = ward.id if ward else None
    ward_num = ward.ward_number if ward else None

    # PostGIS point expression
    point_wkt = f"SRID=4326;POINT({payload.longitude} {payload.latitude})"

    # 4. Dedup check (25m radius, same category, open issues)
    duplicate_master = await SpatialDedupService.find_duplicate_master(
        db, payload.category, payload.longitude, payload.latitude
    )

    now = datetime.now(timezone.utc)

    if duplicate_master:
        # Merge into master issue
        duplicate_master.merged_count += 1
        duplicate_master.upvote_count += 1

        # Check existing upvote
        upvote_stmt = select(IssueUpvote).where(
            and_(
                IssueUpvote.issue_id == duplicate_master.id,
                IssueUpvote.user_id == current_user.id,
            )
        )
        existing_upvote = (await db.execute(upvote_stmt)).scalar_one_or_none()
        if not existing_upvote:
            new_upvote = IssueUpvote(
                issue_id=duplicate_master.id,
                user_id=current_user.id,
            )
            db.add(new_upvote)

        # Create report record pointing to master
        report = IssueReport(
            issue_id=duplicate_master.id,
            reporter_id=current_user.id,
            image_key=payload.image_base64_or_key,
            location=point_wkt,
            accuracy_m=payload.accuracy_m,
            note=payload.note,
            captured_at=now,
            device_id=payload.device_id,
        )
        db.add(report)

        # Emit merge event
        event = IssueEvent(
            issue_id=duplicate_master.id,
            actor_id=current_user.id,
            event_type="ISSUE_MERGED",
            from_status=duplicate_master.status,
            to_status=duplicate_master.status,
            payload={
                "reason": "Spatial duplicate within 25m",
                "accuracy_m": payload.accuracy_m,
                "note": payload.note,
            },
        )
        db.add(event)

        await db.commit()

        return IssueSubmitResponse(
            ticket_code=duplicate_master.ticket_code,
            issue_id=duplicate_master.id,
            status=IssueStatus.MERGED,
            is_duplicate=True,
            merged_with=duplicate_master.ticket_code,
            message="Duplicate issue detected within 25m. Report merged into existing master ticket and upvoted.",
        )

    # New Master Issue
    ticket_code = generate_ticket_code(ward_num)
    new_issue = CivicIssue(
        ticket_code=ticket_code,
        title=payload.title,
        description=payload.note,
        category=payload.category,
        department=payload.department or Department.GENERAL,
        location=point_wkt,
        ward_id=ward_id,
        status=IssueStatus.RECEIVED,
        priority=PriorityLevel.STANDARD,
        severity_score=0.0,
        merged_count=1,
        upvote_count=1,
    )
    db.add(new_issue)
    await db.flush()  # populate ID

    # Create initial report
    report = IssueReport(
        issue_id=new_issue.id,
        reporter_id=current_user.id,
        image_key=payload.image_base64_or_key,
        location=point_wkt,
        accuracy_m=payload.accuracy_m,
        note=payload.note,
        captured_at=now,
        device_id=payload.device_id,
    )
    db.add(report)

    # Register initial upvote
    upvote = IssueUpvote(
        issue_id=new_issue.id,
        user_id=current_user.id,
    )
    db.add(upvote)

    # Initial media entry
    media = IssueMedia(
        issue_id=new_issue.id,
        kind="BEFORE",
        key=payload.image_base64_or_key,
    )
    db.add(media)

    # Audit event
    event = IssueEvent(
        issue_id=new_issue.id,
        actor_id=current_user.id,
        event_type="ISSUE_RECEIVED",
        from_status=None,
        to_status=IssueStatus.RECEIVED,
        payload={
            "ticket_code": ticket_code,
            "category": payload.category,
            "accuracy_m": payload.accuracy_m,
        },
    )
    db.add(event)

    await db.commit()

    # Finding 3: Trigger async background Celery triage job
    try:
        run_async_triage.delay(str(new_issue.id))
    except Exception:
        pass

    return IssueSubmitResponse(
        ticket_code=new_issue.ticket_code,
        issue_id=new_issue.id,
        status=IssueStatus.RECEIVED,
        is_duplicate=False,
        merged_with=None,
        message="Issue registered successfully and queued for async AI triage.",
    )


@router.post("/issues/{issue_id}/upvote")
async def upvote_issue(
    issue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Me Too / Upvote endpoint. Unique per user per issue.
    """
    issue_stmt = select(CivicIssue).where(CivicIssue.id == issue_id)
    issue = (await db.execute(issue_stmt)).scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    upvote_stmt = select(IssueUpvote).where(
        and_(IssueUpvote.issue_id == issue_id, IssueUpvote.user_id == current_user.id)
    )
    existing = (await db.execute(upvote_stmt)).scalar_one_or_none()
    if existing:
        return {"message": "Already upvoted", "upvote_count": issue.upvote_count}

    new_upvote = IssueUpvote(issue_id=issue_id, user_id=current_user.id)
    db.add(new_upvote)
    issue.upvote_count += 1
    await db.commit()

    return {"message": "Upvoted successfully", "upvote_count": issue.upvote_count}


@router.post("/issues/{issue_id}/reassign")
async def reassign_issue(
    issue_id: uuid.UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Supervisor Reassign endpoint (Ward CSI / Zonal / Admin):
    Reassigns an issue to a new inspector, logs event.
    """
    stmt = select(CivicIssue).where(CivicIssue.id == issue_id)
    issue = (await db.execute(stmt)).scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    new_inspector_id_str = payload.get("new_inspector_id")
    if not new_inspector_id_str:
        raise HTTPException(status_code=400, detail="new_inspector_id required")
    new_inspector_id = uuid.UUID(new_inspector_id_str)

    old_assigned = issue.assigned_to
    issue.assigned_to = new_inspector_id
    issue.status = IssueStatus.ASSIGNED

    event = IssueEvent(
        issue_id=issue.id,
        actor_id=current_user.id,
        event_type="ISSUE_REASSIGNED_BY_SUPERVISOR",
        from_status=issue.status,
        to_status=IssueStatus.ASSIGNED,
        payload={
            "old_inspector": str(old_assigned) if old_assigned else None,
            "new_inspector": str(new_inspector_id),
            "reason": payload.get("reason", "Manual rebalance"),
        },
    )
    db.add(event)
    await db.commit()

    return {"message": "Issue reassigned successfully", "assigned_to": str(new_inspector_id)}


@router.get("/issues/nearby", response_model=List[NearbyIssueItem])
async def get_nearby_issues(
    longitude: float = Query(..., ge=-180.0, le=180.0),
    latitude: float = Query(..., ge=-90.0, le=90.0),
    radius_metres: float = Query(default=500.0, ge=10.0, le=5000.0),
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Nearby Issues Query for Citizen PWA map and list:
    Returns open and recent issues within radius_metres using ST_DWithin (Geography).
    """
    point_geog = func.cast(func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326), Geography)

    conditions = [func.ST_DWithin(CivicIssue.location, point_geog, radius_metres)]
    if category:
        conditions.append(CivicIssue.category == category)

    stmt = (
        select(
            CivicIssue,
            func.ST_Distance(CivicIssue.location, point_geog).label("distance_m"),
            func.ST_X(func.cast(CivicIssue.location, Geometry)).label("lon"),
            func.ST_Y(func.cast(CivicIssue.location, Geometry)).label("lat"),
        )
        .where(and_(*conditions))
        .order_by("distance_m")
        .limit(50)
    )

    results = (await db.execute(stmt)).all()
    items = []
    for issue, dist_m, lon, lat in results:
        items.append(
            NearbyIssueItem(
                id=issue.id,
                ticket_code=issue.ticket_code,
                title=issue.title,
                category=issue.category,
                status=issue.status,
                priority=issue.priority,
                longitude=lon or longitude,
                latitude=lat or latitude,
                distance_metres=round(dist_m or 0.0, 1),
                upvote_count=issue.upvote_count,
                created_at=issue.created_at,
            )
        )
    return items


@router.get("/issues/{issue_id}")
async def get_issue_details(
    issue_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Detailed ticket tracking view for Citizens and Field Staff.
    """
    stmt = select(CivicIssue).where(CivicIssue.id == issue_id)
    issue = (await db.execute(stmt)).scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    return {
        "id": str(issue.id),
        "ticket_code": issue.ticket_code,
        "title": issue.title,
        "description": issue.description,
        "category": issue.category,
        "department": issue.department.value,
        "status": issue.status.value,
        "priority": issue.priority.value,
        "severity_score": issue.severity_score,
        "sla_deadline": issue.sla_deadline.isoformat() if issue.sla_deadline else None,
        "escalation_level": issue.escalation_level,
        "merged_count": issue.merged_count,
        "upvote_count": issue.upvote_count,
        "created_at": issue.created_at.isoformat(),
    }
