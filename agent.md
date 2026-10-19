# CivicPulse AI — Coding Agent Guide

Read this first. It tells an AI coding agent (or a new developer) how to work in this repo.
Related: `superpower.md` (workflow), `skill.md` (task recipes), `architecture.md`, `security.md`, `thinking/research.md`.

## 1. Project in one paragraph

CivicPulse AI is a smart-governance complaint platform modelled on Indore Nagar Nigam / Indore 311 ICCC. Citizens report issues with a live geotagged photo; AI triages and scores them; PostGIS routes to the ward's inspector; closure requires a geofenced live "After" photo verified by AI; an SLA engine escalates breaches up a 6-tier hierarchy; the Super Admin sees heatmaps and an accountability matrix.

## 2. Stack

Backend: Python 3.12, FastAPI, SQLAlchemy 2 + GeoAlchemy2, Alembic, Pydantic v2, Celery + Redis, PostgreSQL 16 + PostGIS 3 + pgvector.
AI: Ultralytics YOLO, CLIP (`clip-vit-base-patch32`), `NlpProvider` (Gemini Flash / local fallback).
Frontend: React + Vite + TypeScript + Tailwind, MapLibre GL, Deck.gl, TanStack Query, Zustand, Recharts. Inspector app: Capacitor (Android).
Infra: Docker Compose (dev), MinIO/S3, Nginx, GitHub Actions.

## 3. Suggested repo layout

```
civicpulse/
  backend/
    app/
      api/v1/            # routers (thin)
      core/              # config, security, rbac, logging
      domain/            # pure logic: scoring, sla, kpi, geofence
      models/            # SQLAlchemy models
      repositories/      # data access + scope filters
      services/          # orchestration (issues, routing, escalation)
      workers/           # celery app, tasks, beat schedule
      ai/                # detector, embedder, nlp providers
      schemas/           # pydantic DTOs
    migrations/
    tests/
  ai-service/            # optional separate inference container
  web-citizen/           # PWA
  app-inspector/         # React + Capacitor
  web-admin/             # command center
  infra/                 # docker, nginx, k8s
  docs/                  # these .md files
```

## 4. Commands (adjust to actual Makefile)

```
make up            # docker compose up (db, redis, minio, api, worker, beat)
make migrate       # alembic upgrade head
make seed          # load demo zones/wards/users
make test          # pytest + vitest
make lint          # ruff, mypy, eslint, tsc
make worker        # celery worker
make beat          # celery beat
```

## 5. Conventions

- **Layering:** router → service → repository → model. Domain functions (`domain/`) are pure and unit-tested.
- **Types everywhere:** mypy strict on `domain/` and `services/`; TypeScript `strict`.
- **Config:** weights, thresholds, SLA hours, radii from `sla_policies` / settings. No magic numbers in code.
- **IDs:** UUID for users/issues; `ticket_code` like `IMC-2026-W64-0892` generated server-side with a DB sequence per ward/year.
- **Time:** store UTC `timestamptz`; display `Asia/Kolkata`.
- **Errors:** typed domain exceptions → consistent JSON `{code, message, details}`.
- **Events:** every status change calls `events.record(...)` in the same transaction.
- **Naming:** snake_case Python, camelCase TS, kebab-case files in web apps.
- **Commits:** Conventional Commits; one concern per PR; migrations in their own commit.

## 6. Definition of Done

- [ ] Acceptance criteria met and demonstrated
- [ ] Unit + integration tests added; CI green
- [ ] Migration has up and down, tested on seeded DB
- [ ] RBAC role × endpoint tests updated
- [ ] `issue_events` written for state changes
- [ ] No new hard-coded thresholds; config documented
- [ ] Security checklist items relevant to the change ticked (`security.md` §12)
- [ ] OpenAPI updated; frontend types regenerated
- [ ] Phase handover file updated

## 7. Boundaries

**Always:** write tests first for logic; use `geography` for metres; scope every query by role; log model versions; keep PRs small.
**Ask first:** changing the scoring formula, SLA hours, KPI weights, role definitions, or retention rules (policy decisions, not code).
**Never:** call AI in `POST /issues`; commit secrets or real citizen data; expose reporter phone to field staff; auto-issue penalties; edit past migrations; mock PostGIS in spatial tests; bypass `issue_events`.

## 8. Where to look

| Question | File |
| --- | --- |
| Why was X decided? | `thinking/research.md` |
| How does the system fit together? | `architecture.md` |
| How do I implement a recurring task? | `skill.md` |
| What AI runs at runtime? | `agent-runtime.md` |
| What must be secure? | `security.md` |
| What's next / handover state? | `phaseswisebackendhandover.md`, `phaseswisefrontend.md` |

## 9. Working agreement for the agent

1. State the plan before editing.
2. Prefer small, reviewable diffs.
3. If the PRD and research disagree, follow research decisions and mention it.
4. If blocked by missing data (ward GeoJSON, API keys), stub with clearly labelled fixtures and record it in the handover.
5. End every task with: what changed, how to run/verify, known gaps.
