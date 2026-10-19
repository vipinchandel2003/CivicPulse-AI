# CivicPulse AI — Phase-wise Backend Handover

How to use: finish a phase, tick its checklist, fill the **Handover note** block, then start the next. A phase is done only when its **Exit criteria** pass. Estimates assume one full-time developer; adjust for team size.

Status legend: ⬜ not started · 🟨 in progress · ✅ done

---

## Phase 0 — Foundation & Environment ✅
**Goal:** repeatable dev environment and project skeleton.
**Tasks**
- [x] Repo layout per `agent.md` & `civicpulse_app` package setup.
- [x] Docker Compose: postgres+postgis+pgvector, redis, minio.
- [x] FastAPI app, settings (Pydantic Settings), structured logging, `/healthz` (with DB/Redis status).
- [x] Alembic migration harness setup (`backend/alembic.ini`, `backend/migrations/env.py`).
- [x] Pytest async test suite with test verification.
**Deliverables:** Clean project skeleton, FastAPI app runner, Docker Compose for PostGIS/pgvector/Redis/MinIO, tests passing.
**Exit criteria:** CI / test suite green; `/healthz` reports service statuses.
**Handover note:** Backend package initialized as `backend/civicpulse_app` to avoid workspace namespace collision. Docker compose with pgvector/pg16, redis:7-alpine, and minio configured. Smoke tests in `tests/test_health.py` passing 2/2.

## Phase 1 — Spatial Hierarchy & Identity ✅
**Goal:** zones/wards in DB and users with roles.
**Tasks**
- [x] Tables & Models: `zones`, `wards` (MultiPolygon, GIST), `users`, `user_ward_assignments`, `devices`.
- [x] Synthetic wards GeoJSON dataset for Indore (Rajwada, Sarafa, Old Palasia, Vijay Nagar, Bhanwarkuan).
- [x] OTP auth (request/verify), JWT access + rotating refresh, rate limits.
- [x] RBAC dependency (`require_roles`) for 6-tier hierarchy (`CITIZEN`, `FIELD_INSPECTOR`, `WARD_CSI`, `ZONAL_OFFICER`, `DEPT_HOD`, `SUPER_ADMIN`).
- [x] Ward lookup service (`ST_Covers` + nearest fallback).
**Exit criteria:** point-in-ward returns correct ward for test points incl. boundary points; token lifecycle verified.
**Handover note:** 5 synthetic wards mapped to Indore coordinates. Auth flow with OTP + device binding operational. Alembic migration `001_phase1_spatial_user` written. All tests passing (4/4).

## Phase 2 — Issue Capture & Dedup ✅
**Goal:** accept reports fast, merge duplicates.
**Tasks**
- [x] Tables: `civic_issues`, `issue_reports`, `issue_media`, `issue_upvotes`, `issue_events`.
- [x] `POST /capture/nonce`, `POST /issues` (<400 ms sync): validate single-use 60s nonce, GPS accuracy check, ticket code generator.
- [x] Spatial Dedup service (25 m, open issues, same category) + master issue merge and `issue_events` recording.
- [x] Upvote endpoint (`POST /issues/{id}/upvote`) unique per user.
**Exit criteria:** Duplicate scenarios (same spot within 25m vs outside 25m) validated; sync submit flow avoids heavy AI in HTTP request path.
**Handover note:** Alembic migration `002_phase2_issue_capture` created. Nonce and dedup logic tested; pgvector 512-dim embedding column ready for CLIP.

## Phase 3 — AI Triage & Priority ✅
**Goal:** category, severity, SLA assigned automatically.
**Tasks**
- [x] AI service/module: YOLO detector provider abstraction (`VisionDetectorProvider`) with pinned version and golden tests.
- [x] `NlpProvider` interface with robust Hinglish `KeywordFallbackNlpProvider` extracting hazards, urgency, landmarks.
- [x] `places` table (hospitals, schools, arterials) and `sla_policies` table models + Alembic migration `003_phase3_triage_places`.
- [x] Priority engine (`PriorityScoringEngine` implementing S3 formula) with hard overrides (`Open_Manhole`, live wire, road blockage $\rightarrow$ CRITICAL 6h SLA).
- [x] `ai_inference_log` auditable logging table.
**Exit criteria:** Open manhole always triggers CRITICAL priority; pure priority logic without I/O; clean fallback path for offline NLP.
**Handover note:** S3 multi-modal priority formula implemented and tested. Hard overrides verified. 11/11 tests green.

## Phase 4 — Routing & Assignment ✅
**Goal:** every triaged ticket reaches the right inspector.
**Tasks**
- [x] Routing Service (`RoutingService`): ward lookup $\rightarrow$ query active on-duty inspectors for ward $\rightarrow$ least-loaded balancing.
- [x] `UNROUTED` flow handling and supervisor reassign (`POST /issues/{id}/reassign`) with audit event tracking.
- [x] Inspector app endpoints: `GET /inspector/tasks` (scoped to assigned tickets) and `POST /inspector/duty` (on-duty toggle).
- [x] Notification adapter (`MultiChannelNotifier`) supporting tiered FCM $\rightarrow$ WhatsApp $\rightarrow$ SMS templates.
**Exit criteria:** Routing selects least-loaded on-duty inspector; off-duty inspectors filtered; supervisor reassign path fully audited.
**Handover note:** Ward-based load balancing implemented; on-duty toggle integrated; tests passing (14/14).

## Phase 5 — Proof-of-Work & Verification ✅
**Goal:** closure cannot be faked cheaply.
**Tasks**
- [x] Resolve endpoint (`POST /issues/{id}/resolve`): 60s nonce, accuracy $\le 20$ m, geofence $30$ m (`ST_DWithin` Geography), `isMock` rejection, phash reuse detection.
- [x] Verification Agent (`VerificationService`): CLIP background similarity $\ge 0.75$ and target defect absence check.
- [x] Review queue API (`GET /reviews`, `POST /reviews/{id}/decision`) for Ward CSI / Zonal Officer; supervisor reject flags fraud and returns to `IN_PROGRESS`.
- [x] Citizen Reopen (`POST /issues/{id}/reopen`) and CSAT rating (`POST /issues/{id}/csat`) endpoints with immutable event logs.
**Exit criteria:** Test matrix (mock GPS, low background similarity, defect still present, phash reuse) rejected to review; honest case resolves; reopen & CSAT flow verified.
**Handover note:** Proof-of-Work Lock active. All 18 tests passing.

## Phase 6 — SLA Escalation Engine ✅
**Goal:** overdue tickets climb the chain automatically.
**Tasks**
- [x] Models: `escalations`, `kpi_events` (immutable penalty ledger), and `show_cause_recommendations` (drafts only, HOD issues).
- [x] Alembic migration `004_phase6_escalations` created.
- [x] SLA Escalation Engine (`SLAEscalationEngine`): evaluates elapsed ratio $(T_{now} - T_{created}) / (T_{sla} - T_{created})$.
- [x] 75% early warning to inspector, 100% L1 breach (-5 KPI to CSI), 150% L2 breach to Zonal/ICCC red list, 200% L3 show-cause draft to Dept HOD.
- [x] Celery worker and Celery Beat 5-minute cron task configuration (`scan_and_escalate_sla_breaches`).
**Exit criteria:** Simulated clock time-travel tests verify each level transition exactly once; 23/23 tests green.
**Handover note:** Escalation ladder verified with time-travel tests. Show-cause notice is recommendation-only (D7 preserved).

## Phase 7 — Analytics & Governance Intelligence ✅
**Goal:** Super Admin gets actionable data.
**Tasks**
- [x] Models: `chronic_spots` (Superpower 8: $\ge 5$ in $50$ m / $30$ days) and `kpi_snapshots` (monthly performance records).
- [x] Alembic migration `005_phase7_analytics` created.
- [x] S11 Normalized Composite KPI formula implemented in `KPICalculator`: $\text{clamp}(0.4 \cdot \text{SLA}\% + 0.3 \cdot \text{CSAT}_{norm} + 0.3 \cdot \text{Speed}_{norm} - \text{Reopen}\%, 0, 100)$.
- [x] Command Center API: `GET /analytics/overview`, `GET /analytics/leaderboard`, `GET /analytics/blackspots`.
- [x] WebSocket real-time event feed: `/ws/admin` for live dashboard updates.
**Exit criteria:** Analytics and leaderboard calculation validated; chronic blackspot detection qualification tested; 27/27 tests green.
**Handover note:** Command Center feeds and leaderboard logic operational.

## Phase 8 — Hardening & Security ✅
**Goal:** pass the security gate.
**Tasks**
- [x] Run `security.md` §12 checklist; apply mitigations.
- [x] PII masking (`mask_phone_number`): reporter phone strictly redacted for Tier 1 (`FIELD_INSPECTOR`), partially masked for Tier 2/3 (`WARD_CSI`, `ZONAL_OFFICER`).
- [x] Security headers middleware (`SecurityHeadersMiddleware` with nosniff, DENY frame options, referrer-policy).
- [x] Single-use capture nonce and geofence anti-spoof enforcement on mutating endpoints.
**Exit criteria:** Checklist verified; PII and RBAC boundaries confirmed with unit tests; 30/30 tests green.
**Handover note:** Hardening and DPDP data masking active.

## Phase 9 — Release & Operations ⬜ (≈ 3–5 days)
**Goal:** run it for real.
**Tasks**
- Staging + prod deploy, secrets, TLS, CI/CD with migrations gate.
- Prometheus/Grafana/Sentry, alerts (beat heartbeat, queue backlog, fallback rate).
- Runbooks: incident, rollback, model swap.
- Pilot ward rollout plan and feedback loop.
**Exit criteria:** pilot ward live; on-call runbook tested.

---

## Dependency map

```
P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9
              ↘ (ward data) required by P1/P4
```
Frontend can start against mocked contracts after the OpenAPI for P2 exists (see `phaseswisefrontend.md`).

## Handover template (copy per phase)

```
Phase N — status:
What shipped:
How to run / verify:
Config & env added:
Migrations:
Tests added (count, coverage):
Known gaps / tech debt:
Decisions made (link to research.md IDs):
Open questions:
Next phase prerequisites:
```
