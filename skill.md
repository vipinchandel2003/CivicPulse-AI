# CivicPulse AI — Skills Catalog

Reusable, task-sized skills a coding agent applies. Each has a trigger, steps, guardrails and a reference snippet. Skills reference decisions D1–D10 in `thinking/research.md`.

---

## S1. PostGIS spatial query

**Trigger:** any distance, containment, nearest, or clustering logic.
**Steps:** 1) choose type (`geography` for distance, `geometry` for polygons) 2) write query with bound params 3) confirm GIST index used (`EXPLAIN`) 4) test with real PostGIS.
**Guardrails:** metres only via geography; `ST_Covers` not `ST_Contains`; lng before lat in `ST_MakePoint`.

```sql
-- within 25 m
ST_DWithin(location, ST_SetSRID(ST_MakePoint(:lng,:lat),4326)::geography, 25)
-- ward lookup
ST_Covers(boundary, ST_SetSRID(ST_MakePoint(:lng,:lat),4326))
```

```python
# GeoAlchemy2
from geoalchemy2 import Geography
from sqlalchemy import func
pt = func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
q = select(Issue.id).where(func.ST_DWithin(Issue.location, func.cast(pt, Geography), 25))
```

## S2. Ward routing & inspector assignment

**Trigger:** new or reopened ticket needs an owner.
**Steps:** find ward (`ST_Covers`, fallback nearest) → find zone → select on-duty inspector by `(ward, department)` with fewest open tickets → set `assigned_to`, write event, notify. If none: status `UNROUTED`, alert CSI.
**Guardrails:** respect `on_duty`; use `FOR UPDATE SKIP LOCKED` to avoid double-assign; never assign across departments.

## S3. Priority & SLA computation

**Trigger:** triage finished, upvote added, policy change.
**Steps:** compute `C_vision`, `U_nlp`, `P_spatial`, upvote term → weighted `S` → apply hard overrides → map to priority → compute `sla_deadline = created_at + hours`.
**Guardrails:** pure function, no I/O; weights from config; on recompute SLA may only shorten.

```python
def priority(s: float, override: bool) -> str:
    if override or s >= 80: return "CRITICAL"
    return "HIGH" if s >= 60 else "STANDARD"
```

## S4. Capture nonce & anti-spoof validation

**Trigger:** `POST /issues`, `POST /issues/{id}/resolve`.
**Steps:** validate nonce (single-use, 60 s, bound to user+ticket) → check accuracy → check `isMock` → verify attestation → compute phash → compare with prior hashes → continue.
**Guardrails:** reject on any failure with a specific code; log to `issue_events`; never reveal which check failed to the client beyond a generic code in production.

## S5. Geofenced resolve

**Trigger:** inspector submits After photo.
**Steps:** authorize (assigned to caller) → run S4 → `ST_DWithin(issue.location, resolver_point, 30)` and `accuracy ≤ 20` → store media → status `PENDING_AUDIT` → enqueue `verify.run`.

## S6. CV inference (YOLO)

**Trigger:** classify/localize defect in Before or After photo.
**Steps:** load pinned model → resize/normalise → infer → return `{class, conf, bbox_area_ratio}` list → log to `ai_inference_log` with model version.
**Guardrails:** model weights from registry; batch where possible; timeout and fallback to `category=UNKNOWN` plus human triage.

## S7. Duplicate & Before/After similarity (CLIP)

**Trigger:** dedup candidate found, or After photo uploaded.
**Steps:** compute embedding (`clip-vit-base-patch32`) → store in `pgvector` → cosine similarity → compare to threshold from config.
**Guardrails:** dedup threshold and verify threshold are separate; log scores; treat as evidence, not truth.

```python
sim = (a @ b) / (np.linalg.norm(a) * np.linalg.norm(b))
```

## S8. Hinglish NLP extraction

**Trigger:** citizen note or voice transcript present.
**Steps:** call `NlpProvider.extract(note)` → JSON `{hazards[], urgency 0-100, landmark}` validated by Pydantic → fallback to keyword rules on error.
**Guardrails:** note is untrusted data; cap length 500 chars; strip PII; per-day cost cap.

```python
class Extraction(BaseModel):
    hazards: list[Literal["school","hospital","main_road","accident","sparking","other"]]
    urgency: int = Field(ge=0, le=100)
    landmark: str | None
```

## S9. Celery task authoring

**Trigger:** any background job.
**Steps:** idempotent by design → accept ids not objects → `acks_late`, retries with backoff, `max_retries` → route to named queue → emit event on success/failure.
**Guardrails:** no DB session shared across tasks; tasks must be re-runnable safely.

## S10. SLA escalation job

**Trigger:** Celery Beat every 5 min.
**Steps:** select active tickets `FOR UPDATE SKIP LOCKED` → compute elapsed ratio → apply 0.75 / 1.0 / 1.5 rules once each → write `escalations`, `kpi_events`, `issue_events` → notify.
**Guardrails:** idempotent via `escalation_level`; never escalate paused or resolved tickets.

## S11. KPI & accountability metrics

**Trigger:** monthly snapshot, leaderboard query.
**Formula (normalised 0–100):** `score = clamp(0.4·SLA% + 0.3·CSAT_norm + 0.3·Speed_norm − Reopen%, 0, 100)`; `CSAT_norm=(csat−1)/4·100`; `Speed_norm=clamp(1−MTTR/target,0,1)·100`.
**Guardrails:** only confirmed rejects count as fake closures; keep raw metrics beside the score.

## S12. Alembic migration with PostGIS

**Steps:** autogenerate → hand-check geography/GIST indexes → add `CREATE EXTENSION` guards → test upgrade and downgrade on a populated DB.
**Guardrails:** no data-destroying downgrade without a backup note; `issue_events` insert-only grants.

## S13. RBAC scope guard

**Trigger:** new endpoint.
**Steps:** declare required role → apply scope filter in repository → add 200/403/404 tests per role.
**Guardrails:** scope enforced in data layer, not router only.

## S14. Deck.gl / MapLibre layer

**Trigger:** map visualisation.
**Steps:** fetch aggregated GeoJSON/H3 from API (never raw 10k rows per tick) → `H3HexagonLayer` or `ScatterplotLayer` → colour scale Green/Amber/Red → viewport-bounded queries → debounce filters.
**Guardrails:** memoise layers; use binary/typed arrays for large sets; provide a table fallback for accessibility.

## S15. WebSocket live feed

**Steps:** authenticate at connect → subscribe by scope channel (`admin`, `ward:{id}`) → Redis pub/sub fan-out → client reconnect with backoff and resync via REST.

## S16. Notification dispatch

**Steps:** template + locale → channel preference (WhatsApp → FCM → SMS) → delivery status in `notifications` → retry; throttle per user.
**Guardrails:** no PII beyond ticket code and category in message body.

## S17. Test strategy

- Unit: pure scoring/SLA functions.
- Integration: PostGIS via testcontainers; Celery in eager mode plus one real-broker smoke.
- Contract: OpenAPI schema snapshot.
- E2E: Playwright for capture → resolve → escalation (time-travel clock).
- ML: fixed golden-image set with expected classes.

## S18. Frontend capture component

**Steps:** `getUserMedia` (rear camera) → request nonce → capture frame to canvas → read GPS with `enableHighAccuracy` and accuracy → block submit if accuracy > threshold → queue offline with retry.
**Guardrails:** no `<input type=file>`; show accuracy ring; handle permission denial gracefully.
