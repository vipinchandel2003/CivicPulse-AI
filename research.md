# CivicPulse AI — Research & PRD Analysis

Source: `civicpulse_ai_product_requirements_document.md` (IMC / Indore 311 ICCC model).
Purpose: record what the PRD says, what is strong, what is risky or wrong, and the decisions every other doc in this folder builds on.

---

## 1. What the PRD actually defines

| Area | PRD position |
| --- | --- |
| Problem | Civic complaints get marked "Resolved" without work; no accountability, no spatial/priority intelligence |
| Users | 6 tiers: Citizen → Field Executor → Ward Supervisor → Zonal Officer → Dept Head → Super Admin |
| Core loop | Live capture → dedup → AI triage → priority score → ward routing → geofenced resolution → AI verify → SLA escalation |
| Differentiators | No gallery uploads, 25 m dedup, 30 m geofence, Before/After AI check, auto-escalation, inspector KPI |
| Stack | React+Vite+Tailwind, MapLibre+Deck.gl, FastAPI+GeoAlchemy2, PostGIS, Redis+Celery, YOLOv8/11, CLIP, Gemini Flash |

## 2. Strengths (keep as-is)

1. **Anti-fake-closure is the product.** Geofence + visual verification attacks the real Indore 311 failure mode. This is the demo hook and the moat.
2. **Spatial-first data model.** Ward polygon routing via PostGIS is the right primitive; everything else (heatmap, blackspots, load balancing) falls out of it.
3. **Async AI.** Keeping inference out of the HTTP path (<400 ms submit) is correct.
4. **Accountability metrics are concrete** (SLA%, MTTR, reopen rate, KPI), not vanity charts.
5. **Escalation ladder is explicit** (75% / 100% / 150%) and maps to IMC roles.

## 3. Gaps, bugs and risks found

Severity: 🔴 must fix before build · 🟠 fix in design · 🟡 note.

### 3.1 Spatial / data correctness
- 🔴 **Distance on SRID 4326 geometry is in degrees.** `ST_DWithin(geom, geom, 25)` on `GEOMETRY(Point,4326)` means 25 *degrees*. Use `geography` casts (or reproject to EPSG:32643, UTM 43N, for Indore). Same for `ST_DistanceSphere` — acceptable, but `geography` is cleaner and index-friendly.
- 🔴 **`ST_Contains` drops boundary points.** A report exactly on a ward edge matches nothing. Use `ST_Covers`, and define a nearest-ward fallback.
- 🟠 `GEOMETRY(Polygon)` for wards — real ward boundaries are often `MultiPolygon`. Use `MultiPolygon`.
- 🟠 **Zone/ward counts are unverified.** PRD says 22 zones / 85 wards. 85 wards is consistent with IMC; the zone count should be checked against the official IMC dataset (I believe IMC administers ~19 zones). Do not hard-code 22 anywhere; derive from data.
- 🟠 **Ward boundary data is a dependency, not a given.** Need an authoritative shapefile/GeoJSON (IMC GIS, Smart City open data, or digitized). Without it Phase 2 is blocked. Plan a stub with 3–5 synthetic wards for dev.
- 🟡 GPS accuracy in dense areas is 10–50 m. A 25 m dedup and 30 m geofence must account for the reported accuracy radius.

### 3.2 Dedup logic
- 🟠 PRD checks only "last 48 h". A pothole open for 10 days would spawn duplicates. Dedup against **all open issues** of the category within 25 m; use time only to decide whether to *reopen* a resolved one.
- 🟠 CLIP similarity threshold is unspecified. Needs calibration on real data (start 0.85, tune with a labelled pair set).
- 🟠 Schema has no master/child link. Add `master_issue_id` and an `issue_reports` table so merged reports keep their own photo, reporter and timestamp.
- 🟠 Upvote ("Me Too") needs one-per-user uniqueness → `issue_upvotes(issue_id, user_id)` unique.

### 3.3 Scoring
- 🔴 **A weighted sum can bury true emergencies.** An open manhole with no hazard keywords: `0.35·90 + 0 + 0 + 0.15·10` ≈ 33 → "Standard, 72 h". Add **hard overrides**: `Open_Manhole`, `sparking/live wire`, `main-road blockage` → force CRITICAL regardless of S.
- 🟠 `C_vision` is undefined (detector confidence ≠ severity). Define it as `class_weight × area_scale × confidence`.
- 🟠 Upvotes change after creation. Rule: **recompute S on every upvote; SLA may only shorten, never extend.**
- 🟠 Max weight of upvotes capped at 10 upvotes — fine, but make it config.
- 🟡 NLP and spatial weights (0.25 each) should be A/B-tunable via `sla_policies`/config, not hard-coded.

### 3.4 Anti-cheat
- 🔴 **WebRTC live camera does not stop spoofing.** Virtual cameras, emulators, screen-recording injection, and mock-GPS apps all bypass a browser PWA. A PWA cannot detect mock location. Required mitigations:
  - Tier 1 (inspectors) must use a **native/Capacitor wrapper** with Play Integrity / device attestation and `isMock` flag from Android Location API.
  - Server-issued **capture nonce + server timestamp**; reject images older than N seconds.
  - Reject GPS with accuracy worse than a threshold (e.g. > 20 m for resolve).
  - Photo metadata + perceptual hash to catch reused "After" images across tickets.
  - Rate-limit and device-bind accounts.
- 🟠 **AI false rejects punish honest inspectors.** Add a human review path: AI-rejected → `PENDING_REVIEW` → CSI decides; only confirmed rejects hit the fraud rate.
- 🟡 Citizen reporters can also fake — Tier 0 needs trust scoring (reports confirmed vs rejected).

### 3.5 SLA & KPI
- 🟠 **SLA clock rules missing.** Pause on "awaiting material/contractor approval"? Business hours or 24×7? Define in `sla_policies`; default 24×7 for Critical.
- 🟠 **KPI formula mixes scales.** `0.4·SLA% + 0.3·CSAT + 0.2·Speed − 0.5·Reopen%` — CSAT is 1–5, Speed undefined, weights sum 0.9. Normalise all to 0–100, weights 0.4/0.3/0.3, minus reopen penalty, clamp 0–100.
- 🟠 **Two scoring mechanisms conflict:** `kpi_score DEFAULT 100` with "−5 per L1 breach" vs. a monthly composite. Use a `kpi_events` ledger for deltas and a monthly snapshot for ranking.
- 🟠 **Show-Cause Notice is an HR/legal act.** System may *recommend* and draft; a human (HOD) must issue it. Never auto-issue.
- 🟡 `escalation_level` comment lists 0–3 but the ladder defines L1 and L2 only; define L3 = HOD/Commissioner (chronic repeat breach).

### 3.6 Schema gaps
Missing: `user_ward_assignments` (CSI owns 1–3 wards, so a single `assigned_ward_id` is wrong), `issue_media`, `issue_reports`, `issue_upvotes`, `issue_events` (immutable audit trail), `sla_policies`, `escalations`, `kpi_events`, `notifications`, `devices`, `ai_inference_log`, `chronic_spots`. `role` and `status` as free `VARCHAR` should be enums/CHECK. No OTP/auth tables. No `leave/on_duty` flag for inspectors (load balancer would assign to someone absent).

### 3.7 AI/ML
- 🟠 **No datasets/metrics defined.** Need per-class precision/recall targets, Indian-road images (Roboflow generic sets are mostly Western roads), and a held-out Indore test set.
- 🟠 **Before/After "same place" check via CLIP** is a similarity score, not geometric proof. Combine with GPS lock and (stretch) local feature matching (e.g. ORB/LoFTR) for structure.
- 🟠 **Gemini 2.5 Flash is a vendor/model dependency.** Hide behind an `NlpProvider` interface; keep a local zero-shot fallback; version prompts; validate output with Pydantic.
- 🟠 **Prompt injection:** citizen notes are untrusted text. Treat as data, never as instructions; schema-constrained output only.
- 🟡 Indic voice notes need ASR (Whisper / Bhashini); PRD mentions "voice/text" but no ASR step.

### 3.8 Privacy & governance
- 🟠 Photos contain faces and number plates → blur on ingestion; DPDP Act 2023 consent, purpose limitation and retention policy.
- 🟠 Reporter phone numbers must be hidden from field staff by default.
- 🟡 Public heatmaps should aggregate; never expose individual reporter data.

### 3.9 Scale & ops
- 🟡 Indore ≈ 3M people. Assume 5–20k reports/day peak after monsoon/festival. Beat scan every 5 min over open tickets is fine with the `(status, sla_deadline)` index; prefer per-ticket ETA tasks for exact timers if scan cost grows.
- 🟡 Cost: GPU inference, Gemini calls, WhatsApp Business API templates (per-message cost). Budget these.

## 4. Decisions adopted (feed into all other docs)

| # | Decision |
| --- | --- |
| D1 | Spatial columns use `geography(Point,4326)`; wards `geometry(MultiPolygon,4326)`; metric ops via geography |
| D2 | Ward routing uses `ST_Covers` + nearest-ward fallback |
| D3 | Dedup against all open issues in 25 m same category; CLIP threshold configurable |
| D4 | Priority = weighted score **plus** hard-override rules; SLA never extends |
| D5 | Inspector app is native-wrapped (Capacitor) with attestation; Citizen app is PWA |
| D6 | AI reject → human review before fraud flag |
| D7 | Show-Cause is recommendation-only |
| D8 | All role actions write immutable `issue_events` |
| D9 | NLP and CV behind provider interfaces; versioned and logged |
| D10 | Zones/wards loaded from data; never hard-coded |

## 5. Open questions for the product owner

1. Official ward/zone GeoJSON source and zone count?
2. Is the inspector app allowed to be Android-only (needed for attestation)?
3. SLA pause rules (material shortage, rain, contractor approval)?
4. Who is the real pilot user (IMC, a ward, or a demo for hackathon)? Scope of Phase 1 depends on it.
5. WhatsApp Business API access vs. SMS/push only?
6. Languages: Hindi UI, Hinglish input, Devanagari input?
7. Data retention period for photos and location?

## 6. Evaluation plan

| Component | Metric | Target (initial) |
| --- | --- | --- |
| Defect detector | mAP@0.5, per-class recall (manhole recall priority) | mAP ≥ 0.70, manhole recall ≥ 0.90 |
| Dedup | Precision of merges, false-merge rate | ≥ 0.95 precision |
| NLP hazard extractor | F1 on labelled Hinglish set | ≥ 0.85 |
| Before/After verifier | Fake-closure catch rate vs honest false-reject rate | ≥ 0.9 / ≤ 0.1 |
| Submit API | p95 latency | < 400 ms |
| Routing | Correct ward on test points | 100% (deterministic) |
| SLA engine | Missed-escalation count | 0 |

## 7. Suggested scope for MVP vs full

- **MVP (hackathon/pilot):** live capture, dedup, YOLO triage, scoring, ward routing, inspector resolve with geofence, SLA L1/L2, basic admin map + leaderboard.
- **v1:** CLIP before/after, Hinglish NLP, WhatsApp, chronic blackspots, KPI snapshots, human review queue.
- **v2:** attestation hardening, ASR, H3 analytics, anomaly detection, policy analytics, public transparency page.
