# CivicPulse AI — Security & Privacy

Scope: the full platform (Citizen PWA, Inspector app, Command Center, API, workers, AI, storage).
Principle: **the product's value is trust in "Resolved". Every control below protects that.**

## 1. Assets to protect

| Asset | Why it matters |
| --- | --- |
| Integrity of ticket status & audit trail | Fake closures defeat the product |
| Reporter identity, phone, location, photos | Personal data (DPDP Act 2023) |
| Inspector KPI & fraud flags | Career impact; must be accurate and contestable |
| Ward/zone data, role mapping | Defines who can see/act on what |
| AI models, prompts, API keys | Cost and abuse exposure |

## 2. Threat model (STRIDE-style, top threats)

| # | Threat | Actor | Mitigation |
| --- | --- | --- | --- |
| T1 | Fake "After" photo (gallery, reused, virtual camera) | Inspector | In-app capture only, server nonce + timestamp, perceptual-hash reuse check, CLIP+YOLO verify, attestation |
| T2 | GPS spoofing / mock location | Inspector, citizen | Native wrapper reads `isMock`, Play Integrity, accuracy ≤ 20 m, server-side plausibility (speed/jump check) |
| T3 | Report flooding / fake reports | Citizen, bots | OTP login, per-user & per-device rate limits, dedup, reporter trust score, CAPTCHA on anomaly |
| T4 | Privilege escalation (citizen acts as inspector) | Any | Server-side RBAC + scope checks on every endpoint; never trust client role |
| T5 | IDOR on tickets/photos | Any | Object-level authorization; signed short-lived media URLs |
| T6 | Prompt injection via citizen note | Citizen | Note is data; schema-constrained output; no tool access for NLP model; strip/limit length |
| T7 | Tampering with audit history | Insider, DBA | Append-only `issue_events`, DB role without UPDATE/DELETE, periodic hash-chain checkpoint |
| T8 | Mass data exfiltration | Insider, API abuse | Least privilege, export logging, rate limits, field-level masking |
| T9 | Malicious image upload (polyglot, huge) | Any | Content-type sniffing, re-encode via Pillow, size/dimension caps, AV scan optional |
| T10 | Retaliation / unfair KPI hits | Supervisors | Human review before fraud flag; appeal flow; all KPI changes in `kpi_events` |
| T11 | DoS on AI queue | Any | Queue limits, backpressure, per-user quotas, separate queues |
| T12 | Secret leakage | Dev | Secret manager, no secrets in repo, CI secret scanning |

## 3. Authentication

- **Citizens:** phone OTP (SMS/WhatsApp), OTP expiry 5 min, 5 attempts max, resend throttle, device binding.
- **Staff (Tier 1–5):** phone OTP + admin-provisioned accounts; Tier 3–5 additionally TOTP or hardware key. No self-signup for staff roles.
- **Tokens:** short-lived JWT access (15 min) + rotating refresh token stored server-side (revocable). Bind to device id. Logout/rotate on role change.
- **Session:** concurrent-session limit for staff; forced logout when `is_active=false`.

## 4. Authorization (RBAC + scope)

Role alone is not enough; every query is also **scoped** by ward/zone/department.

| Role | Scope filter | Can |
| --- | --- | --- |
| CITIZEN | own reports + public nearby | create, upvote, reopen own |
| FIELD_INSPECTOR | assigned tickets in own ward + dept | start, resolve (geofenced) |
| WARD_CSI / AE | wards in `user_ward_assignments` | reassign, review AI rejects, view staff load |
| ZONAL_OFFICER | wards in own zone | all ward actions + approvals |
| DEPT_HOD | own department city-wide | read all, request show-cause draft |
| SUPER_ADMIN | all | analytics, audit, policy config |

Implementation: FastAPI dependency `require(role, scope)`; SQL filters applied in the repository layer (not the router) so no endpoint can forget them. Unit tests assert a 403/404 matrix for every role × endpoint.

## 5. Anti-fake-closure controls (core)

1. **Server-issued capture nonce** (single-use, 60 s TTL) bound to user + ticket.
2. **In-app capture only.** No file picker in Citizen or Inspector capture screens.
3. **Geofence:** `ST_DWithin(issue.location, resolver_point, 30)` and `accuracy_m ≤ 20`.
4. **Device attestation** (Play Integrity) for Tier 1; reject rooted/emulated devices when policy = strict.
5. **Mock-location flag** from native layer; server rejects and logs.
6. **Perceptual hash** compared to all prior After photos; reuse → reject + flag.
7. **AI verify:** CLIP background similarity ≥ threshold and detector confidence for target class below threshold.
8. **Human review** for AI rejects (CSI/AE). Only confirmed rejects count toward Fraud Flag.
9. **Citizen reopen** feeds the reopen-rate metric; abusive reopen patterns are rate-limited and reviewed.
10. **Immutable evidence:** media keys, hashes and model versions stored in `issue_events`.

## 6. Data protection & privacy (DPDP Act 2023 aligned)

- **Lawful basis & notice:** clear consent screen at first capture (what is collected, why, retention).
- **Minimisation:** collect phone, name (optional), location at capture only; no background location for citizens.
- **Face & plate blurring** at ingestion; keep the original encrypted with restricted access for audits only.
- **Masking:** field staff see ticket, location, photo — **not** reporter phone. Supervisors see masked phone. Super Admin unmask requires reason and is logged.
- **Retention:** photos 12–24 months (configurable), then archive/delete; reporter PII purge on request after statutory hold.
- **Rights:** access, correction, erasure workflows via admin tool.
- **Encryption:** TLS 1.2+ everywhere, HSTS; encryption at rest for Postgres volumes and object store; phone numbers encrypted/hashed (HMAC for lookup).
- **Public views:** only aggregated or anonymised data; no reporter info; blur coordinates at ward-level for sensitive categories if needed.

## 6a. Media handling

- Re-encode all uploads server-side; strip EXIF after extracting what is needed (timestamp, device).
- Private bucket; access via signed URLs, 5–15 min TTL.
- Max size 8 MB, max 4096 px; allow JPEG/WebP only.
- Filename = random UUID; never trust client names.

## 7. AI-specific security

- **Model supply chain:** pin model versions and hashes; load weights only from internal registry.
- **Provider abstraction:** Gemini (or other LLM) behind `NlpProvider`; send only the note text + minimal context, never PII.
- **Output validation:** Pydantic schema; reject/clamp out-of-range values; fallback to rule-based extractor on failure.
- **Prompt hygiene:** fixed system prompt, note passed as delimited data, length cap, no tool use.
- **Adversarial images:** log low-confidence and out-of-distribution results; sample for manual QA.
- **Fairness:** monitor false-reject rate per ward/inspector; investigate outliers before acting on KPI.
- **Cost guard:** per-day LLM budget cap with circuit breaker.

## 8. API & application security

- Input validation with Pydantic; strict enum/range checks; max body sizes.
- SQL only through SQLAlchemy/bound parameters; no string-built SQL, including PostGIS fragments.
- Rate limits: per IP, per user, per device (Redis token bucket). Stricter on `/auth/*`, `/issues`.
- `Idempotency-Key` on mutating calls; replay protection on resolve.
- CORS allow-list; CSRF not needed for bearer tokens, but use `SameSite` and httpOnly cookies if cookies are used.
- Security headers (CSP, X-Content-Type-Options, Referrer-Policy, frame-ancestors).
- WebSockets: authenticate at connect, authorize channel subscription by scope, heartbeat and idle timeout.
- Dependency hygiene: `pip-audit`, `npm audit`, Dependabot/Renovate, lockfiles committed.

## 9. Infrastructure

- Network segmentation: DB/Redis/MinIO not publicly reachable; only reverse proxy exposed.
- Least-privilege DB roles: `app_rw`, `app_ro`, `analytics_ro`, `migrator`; `issue_events` insert-only for `app_rw`.
- Secrets in a manager (Vault / cloud secret store); rotate keys; no secrets in images or repo.
- Container hardening: non-root, read-only FS where possible, minimal base images, image scanning.
- Backups encrypted, offsite, restore drills monthly.
- Logging: no PII or tokens in logs; central log store with retention and access control.

## 10. Audit & monitoring

- Everything privileged (unmask, role change, policy edit, manual status override) logs actor, reason, IP, device.
- Alerts: spike in rejects, mock-location detections, OTP abuse, 403 bursts, beat heartbeat missing, queue backlog.
- Monthly review of fraud flags and appeal outcomes.

## 11. Incident response

1. Detect (alert/report) → 2. Triage severity → 3. Contain (revoke tokens, disable account/device, pause queue) → 4. Eradicate & recover → 5. Notify (affected users; regulator within statutory windows) → 6. Post-mortem and control update.
Keep a runbook for: leaked credentials, data exposure, model compromise, mass-spoof event.

## 12. Security acceptance checklist (gate before each release)

- [ ] RBAC matrix tests green for all roles/endpoints
- [ ] No endpoint returns reporter phone to Tier 1
- [ ] Geofence, nonce, accuracy and mock-location checks covered by tests
- [ ] Media re-encode + signed URLs verified
- [ ] Rate limits and OTP lockout verified
- [ ] `issue_events` cannot be updated/deleted by app role
- [ ] Dependency and image scans clean (no critical/high)
- [ ] Secrets scan clean; no keys in repo
- [ ] PII absent from logs and LLM payloads
- [ ] Backup restore tested this month
