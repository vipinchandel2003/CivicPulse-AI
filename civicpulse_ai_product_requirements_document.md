# Product Requirements Document (PRD): CivicPulse AI
**Smart Municipal Grievance, Geospatial Routing & Authority Accountability Engine (Indore Nagar Nigam Model)**

| Document Metadata | Details |
| :--- | :--- |
| **Product Name** | **CivicPulse AI** (ICCC Smart Grievance & Field Accountability Platform) |
| **Reference Governance Model** | Indore Municipal Corporation (IMC) — **22 Zones, 85 Wards**, Smart City ICCC |
| **Target Tech Stack** | React (Vite + Tailwind CSS + MapLibre GL + Deck.gl), FastAPI, PostgreSQL + PostGIS, Redis, Celery, YOLOv8 + CLIP + Hinglish LLM |
| **Document Version** | v1.0 — Production Architecture & Feature Specification |

---

## 1. Executive Summary & Problem Statement

Municipal corporations handle thousands of daily civic complaints (potholes, garbage dumps, broken streetlights, water leaks, open manholes). Even in benchmark systems like **Indore 311**, three critical operational bottlenecks persist:

1. **Manual Triage & Duplicate Flooding:** A single overflowing garbage bin or major pothole on an arterial road generates 30+ separate tickets, overwhelming call-center operators and distorting ward metrics.
2. **Blind Departmental Routing:** Citizens frequently select the wrong category, sending civil road defects to sanitation staff and delaying resolution by 24–48 hours.
3. **Unverified "Fake Closures" & Opaque Accountability:** Field inspectors occasionally close tickets from their desk or upload unrelated photos without visiting the site, while the Municipal Commissioner (Super Admin) lacks real-time visibility into which specific inspector, ward, or zone is causing SLA bottlenecks.

**CivicPulse AI** solves this end-to-end by combining **WebRTC anti-spoof capture**, **PostGIS spatial deduplication**, **Computer Vision + Hinglish NLP severity scoring**, **automated Ward/Zone polygon routing**, **30-meter geofenced AI proof-of-work**, and a **6-tier IMC authority hierarchy** culminating in an executive **Super Admin Command Dashboard**.

---

## 2. User Personas & 6-Tier Role-Based Access Control (RBAC) Matrix

The platform enforces strict territorial (Polygon-based) and departmental isolation across six operational tiers modeled directly on Indore Nagar Nigam:

| Tier & Role Code | IMC Authority Persona | Geographic Scope | Departmental Scope | Key System Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 0:** `CITIZEN` | Citizen / Ward Mitra | City-wide (Public View) | All | Submit live geotagged reports, upvote ("Me Too") nearby open issues, track live SLA timer, verify/re-open resolved tickets within 48h. |
| **Tier 1:** `FIELD_INSPECTOR` | **Daroga** (Health), **Sub-Engineer/JE** (Civil), **Lineman** (Electrical) | **1 Assigned Ward** (Beat-level) | Single Assigned Dept | View prioritized task queue, navigate to GPS pin, mark `IN_PROGRESS`, upload live geofenced "After" photo for AI verification. Cannot manually delete or reassign tickets. |
| **Tier 2:** `WARD_SUPERVISOR` | **Chief Sanitary Inspector (CSI)** / **Assistant Engineer (AE)** | **1 to 3 Wards** | Single Assigned Dept | Monitor all Tier-1 inspectors in their ward(s), reallocate tickets if an inspector is overloaded/on leave, resolve **Level-1 SLA Breaches**, request heavy machinery (JCB/Jetting machine). |
| **Tier 3:** `ZONAL_OFFICER` | **Zonal Officer (ZO)** / **Zonal Health Officer (ZHO)** | **1 Zone (4–5 Wards)** | All Depts within Zone | Cross-departmental coordination (e.g., Civil + Water pipeline dig), approve emergency micro-tenders, handle **Level-2 SLA Breaches**, audit rejected AI closures. |
| **Tier 4:** `DEPT_HOD` | **Additional Commissioner / HOD** (Sanitation, Civil, Electrical, Water) | **All 22 Zones / 85 Wards** | Single Vertical City-wide | Track city-wide departmental MTTR (Mean Time to Resolve), identify chronic infrastructure blackspots, issue automated **Show-Cause Notices** to underperforming inspectors. |
| **Tier 5:** `SUPER_ADMIN` | **Municipal Commissioner / Mayor Helpline / ICCC Admin** | **Full City (22 Zones, 85 Wards)** | **All Departments** | Full read/write override, live H3/Ward Heatmaps, Inspector Efficiency Leaderboard, Fraud/Audit flag monitoring, SLA policy configuration, Zone boundary management. |

---

## 3. End-to-End Smart Complaint Lifecycle

1. **Stage 1 — Anti-Spoof Capture & Spatial Deduplication:**
   * Citizen captures a live camera frame via WebRTC alongside hardware GPS coordinates and accuracy radius.
   * Backend executes a PostGIS `ST_DWithin` query to check if an active issue of the same category exists within a **25-meter radius** in the last 48 hours.
   * If a match is found, CLIP image embedding similarity is checked; duplicates are merged into the existing **Master Ticket** and `upvote_count` is incremented by $+1$.
2. **Stage 2 — Multi-Modal AI Triage (Computer Vision + Hinglish NLP):**
   * **Vision Pipeline (YOLOv8 / RT-DETR):** Detects defect class (`Pothole`, `Garbage_Dump`, `Broken_Streetlight`, `Open_Manhole`, `Water_Leakage`) and calculates the bounding-box area ratio.
   * **NLP Pipeline (IndicBERT / LLM API):** Parses citizen Hinglish voice/text notes (e.g., *"Bhanwarkuan square ke paas main road pe khula chamber hai, school bus nikalti hai"*) to extract hazard entities (`school`, `hospital`, `main_road`, `accident`, `sparking`).
3. **Stage 3 — Dynamic Severity & Priority Scoring:**
   * Computes a composite priority score $S \in [0, 100]$ combining visual scale, NLP urgency, spatial proximity to critical POIs, and citizen upvotes, setting an automated SLA deadline.
4. **Stage 4 — PostGIS Point-in-Polygon Routing & Load Balancing:**
   * Executes `ST_Contains(ward.boundary, point)` to map the exact **Ward (1–85)** and **Zone (1–22)**, routing the ticket to the least-loaded active Tier-1 Field Inspector in that ward and department.
5. **Stage 5 — Geofenced Proof-of-Work & AI Verification:**
   * Inspector must stand within **30 meters** (`ST_DistanceSphere <= 30`) of the original coordinates to unlock the resolution camera.
   * Backend verifies background structural similarity via CLIP/Siamese network and confirms defect removal via YOLOv8 before marking `RESOLVED`.
6. **Stage 6 — Automated SLA Escalation Engine:**
   * Redis + Celery Beat checks active tickets every 5 minutes:
     * $75\%$ SLA Elapsed $\to$ Yellow warning alert to Tier-1 Field Inspector.
     * $100\%$ SLA Breached (L1) $\to$ Deducts $-5$ KPI points from Inspector and escalates to **Tier-2 Ward CSI/AE**.
     * $150\%$ SLA Breached (L2) $\to$ Escalates to **Tier-3 Zonal Officer** and flags the **Super Admin ICCC Red List**.

---

## 4. Detailed Functional Requirements (FRs) by Module

### Module 1: Citizen Reporting PWA & Spatial Deduplication Engine
* **FR-1.1 (Live Anti-Spoof Capture):** The client interface must disable file-system gallery uploads for standard complaints. It must invoke `navigator.mediaDevices.getUserMedia` to capture a live frame alongside hardware GPS (`enableHighAccuracy: true`), compass heading, and device timestamp.
* **FR-1.2 (GPS Accuracy Gate):** If the device reports GPS accuracy worse than $50\text{ meters}$, the UI must prompt the user to step into an open area or lock the pin manually within a $30\text{-meter}$ radius on the mini-map.
* **FR-1.3 (PostGIS + CLIP Deduplication):** Upon submission, before creating a new database row, the backend must query existing open tickets of the same category within a $25\text{-meter}$ radius (`ST_DWithin`).
  * If a spatial match exists, the system computes the Cosine Similarity between the **CLIP (`ViT-B/32`)** image embeddings of the existing ticket and the new upload.
  * If similarity is $\ge 0.85$ (or if $2+$ reports occur within $15\text{ meters}$ regardless of angle), the system attaches the new user as a **Sub-Reporter** on the **Master Ticket**, increments `upvote_count` by $1$, recalculates priority, and notifies the user that they are tracking the active master ticket.
* **FR-1.4 (Hinglish Voice/Text Context):** Citizens can attach a 15-second voice note or Hinglish text description (e.g., *"Chhappan Dukan ke piche kachre ka dher laga hai aur stray dogs jama hain"*).

### Module 2: Multi-Modal AI Triage & Dynamic Severity Scoring
* **FR-2.1 (Computer Vision Defect Classification):** An asynchronous YOLOv8/RT-DETR inference worker must classify the image into one of the core civic classes:
  * `GARBAGE_DUMP` $\to$ routes to **Health & Sanitation (`SANITATION`)**
  * `DEAD_ANIMAL` / `OVERFLOWING_DUSTBIN` $\to$ routes to **Health & Sanitation (`SANITATION`)**
  * `POTHOLE` / `BROKEN_FOOTPATH` $\to$ routes to **Civil Engineering (`CIVIL_PWD`)**
  * `OPEN_MANHOLE` / `WATERLOGGING` / `SEWAGE_OVERFLOW` $\to$ routes to **Water Supply & Drainage (`WATER_DRAINAGE`)**
  * `BROKEN_STREETLIGHT` / `SPARKING_WIRE` $\to$ routes to **Electrical (`STREETLIGHT`)**
* **FR-2.2 (Low-Confidence Human-in-the-Loop Fallback):** If CV model confidence is $< 0.60$, the system uses the citizen's selected category as provisional and routes the ticket to an **ICCC Triage Queue** for 1-click human verification without blocking initial assignment.
* **FR-2.3 (Hinglish NLP Urgency Extraction):** The NLP parser processes the text/transcribed audio to output an **Urgency Score ($U_{\text{nlp}} \in [0, 100]$)** and extracts hazard entities (`school`, `hospital`, `main_road`, `live_wire`, `child_hazard`, `night_darkness`).
* **FR-2.4 (Composite Severity Formula & SLA Assignment):**
  $$S = 0.35(C_{\text{vision\_scale}}) + 0.25(U_{\text{nlp}}) + 0.25(P_{\text{spatial\_POI}}) + 0.15(\min(N_{\text{upvotes}} \times 10, 100))$$
  Where $P_{\text{spatial\_POI}}$ equals $100$ if PostGIS detects a Hospital, School, or Major Arterial Road within $100\text{ meters}$, $50$ for commercial markets, and $20$ for internal residential lanes.

| Priority Tier | Score Range ($S$) | SLA Resolution Deadline | Escalation Trigger Interval |
| :--- | :--- | :--- | :--- |
| **P0 — Emergency** | $S \ge 85$ (or `OPEN_MANHOLE` / `SPARKING_WIRE`) | **4 Hours** | L1 at 4h $\to$ L2 at 6h $\to$ Super Admin Alert at 6h |
| **P1 — High** | $65 \le S < 85$ | **12 Hours** | L1 at 12h $\to$ L2 at 18h $\to$ HOD Alert at 24h |
| **P2 — Medium** | $40 \le S < 65$ | **24 Hours** | L1 at 24h $\to$ L2 at 36h |
| **P3 — Standard** | $S < 40$ | **48 Hours** | L1 at 48h $\to$ L2 at 72h |

### Module 3: PostGIS Spatial Routing & Inspector Load Balancing
* **FR-3.1 (Point-in-Polygon Ward Detection):** Using official IMC GeoJSON boundaries stored in PostGIS, every incoming coordinate pair $(\text{lng}, \text{lat})$ executes `ST_Contains(ward.boundary, point)` to deterministically stamp `ward_id` (1–85) and `zone_id` (1–22).
* **FR-3.2 (Weighted Least-Loaded Assignment):** If a Ward has multiple active Tier-1 Field Inspectors for the target department (e.g., two Sanitation Darogas in Ward 64), the assignment engine calculates each inspector's **Active Weighted Load**:
  $$\text{Load}_i = \sum (\text{Open Tickets}_i \times \text{Priority Weight})$$
  The ticket is automatically assigned to the on-duty inspector with the lowest active weighted load.

### Module 4: Field Inspector App & Geofenced AI Proof-of-Work
* **FR-4.1 (30-Meter Geofence Camera Lock):** When a Tier-1 Inspector opens a ticket to mark it `RESOLVED`, the app computes the real-time Haversine/PostGIS sphere distance (`ST_DistanceSphere`) between the inspector's current GPS and the ticket's original coordinates.
  * The "Capture Resolution Photo" button remains **locked** until the inspector is within $30\text{ meters}$ of the site.
* **FR-4.2 (Dual-Stage AI Proof-of-Work Audit):** When the "After" photo is uploaded:
  1. **Scene Consistency Check (Siamese/CLIP Structural Match):** Verifies that background landmarks/road geometry share visual context with the "Before" photo (preventing inspectors from photographing a clean wall or a different street).
  2. **Defect Absence Check (YOLOv8 Verification):** Runs object detection on the "After" image to verify that the originally detected `POTHOLE` or `GARBAGE_DUMP` bounding box is either gone or reduced below a $0.15$ confidence threshold.
* **FR-4.3 (Audit Failure Handling):** If the AI audit fails, the ticket transitions to `PENDING_SUPERVISOR_AUDIT` instead of `RESOLVED`, alerting the **Tier-2 Ward CSI/AE** to manually inspect the before/after pair.
* **FR-4.4 (Citizen Closure Feedback Loop):** Once marked `RESOLVED`, the citizen receives a WhatsApp/Push notification with the side-by-side Before/After card and a **48-hour window** to either rate the resolution (1–5 stars) or click **"Still Not Fixed (Re-open)"** with a fresh photo. Re-opened tickets bypass Tier-1 and escalate directly to **Tier-2 (Ward CSI/AE)** while deducting $10$ KPI points from the Tier-1 Inspector.

### Module 5: Super Admin (Commissioner / ICCC) Command Center
* **FR-5.1 (Multi-Layer Geospatial Heatmap):** Built on **Deck.gl + MapLibre GL**, the Super Admin view must support three toggleable map modes:
  1. **Real-Time Density Heatmap (H3 Hexagons):** Shows live volume of incoming complaints across Indore.
  2. **Choropleth Ward Performance Map:** Colors all 85 Wards by **SLA Compliance %** (Emerald: $> 90\%$, Amber: $70\text{--}90\%$, Crimson: $< 70\%$).
  3. **Chronic Blackspot Cluster Layer (DBSCAN):** Automatically highlights $50\text{-meter}$ spatial clusters where $5+$ tickets of the same category have occurred within 30 days—indicating structural failure (e.g., broken underground sewer line causing recurring potholes).
* **FR-5.2 (Inspector & Officer Accountability Matrix):** A filterable, sortable drill-down table (Zone $\to$ Ward $\to$ Individual Inspector) tracking key governance metrics:

| Metric | Formula / Logic | Governance Insight |
| :--- | :--- | :--- |
| **Pending Load Ratio** | $\text{Open Tickets} / \text{Ward Avg Daily Inflow}$ | Indicates whether an Inspector is genuinely overloaded or delaying work. |
| **SLA Compliance %** | $(\text{Resolved within SLA} / \text{Total Assigned}) \times 100$ | $\ge 85\%$ = Top Performer; $< 60\%$ = Defaulter requiring intervention. |
| **MTTR (Mean Time to Resolve)** | $\text{Avg}(\text{Resolved Timestamp} - \text{Created Timestamp})$ | Identifies which Zone/Ward clears complaints fastest. |
| **Fake Closure / Re-open Rate** | $(\text{Citizen Reopened} + \text{AI Rejected}) / \text{Total Closed}$ | Flags inspectors attempting to close tickets with invalid photos. |
| **Composite Inspector KPI Score** | $0.4(\text{SLA\%}) + 0.3(\text{CSAT}) + 0.2(\text{Speed}) - 0.5(\text{Reopen\%})$ | Automated ranking for monthly municipal review meetings and awards. |

* **FR-5.3 (1-Click Administrative Interventions):** From the Super Admin dashboard, the Commissioner can:
  * **Rebalance Workload:** Bulk-reassign pending tickets from an overwhelmed inspector to a reserve zonal team.
  * **Issue Automated Show-Cause Warning:** Trigger an official system-logged warning notice to any inspector or Zonal Officer whose SLA compliance drops below $60\%$ or whose fake-closure rejection rate exceeds $10\%$.

---

## 5. Database Schema Blueprint (PostgreSQL + PostGIS)

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Spatial Hierarchy: 22 Zones & 85 Wards
CREATE TABLE zones (
    id SERIAL PRIMARY KEY,
    zone_number INT UNIQUE NOT NULL, -- 1 to 22
    name VARCHAR(100) NOT NULL,      -- e.g., "Zone 13 - Bhanwarkuan / Rajendra Nagar"
    boundary GEOMETRY(Polygon, 4326) NOT NULL
);

CREATE TABLE wards (
    id SERIAL PRIMARY KEY,
    ward_number INT UNIQUE NOT NULL, -- 1 to 85
    name VARCHAR(100) NOT NULL,      -- e.g., "Ward 64 - Chitawad"
    zone_id INT REFERENCES zones(id),
    boundary GEOMETRY(Polygon, 4326) NOT NULL
);
CREATE INDEX idx_wards_boundary ON wards USING GIST (boundary);

-- 2. Hierarchical Users & Authorities
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL, -- CITIZEN, FIELD_INSPECTOR, WARD_SUPERVISOR, ZONAL_OFFICER, DEPT_HOD, SUPER_ADMIN
    department VARCHAR(40),    -- SANITATION, CIVIL_PWD, STREETLIGHT, WATER_DRAINAGE, ALL
    assigned_ward_id INT REFERENCES wards(id),
    assigned_zone_id INT REFERENCES zones(id),
    kpi_score NUMERIC(5,2) DEFAULT 100.00,
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. Master Civic Issues Table
CREATE TABLE civic_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., "IMC-2026-W64-0892"
    reporter_id UUID REFERENCES users(id),
    category VARCHAR(40) NOT NULL,           -- POTHOLE, GARBAGE_DUMP, STREETLIGHT, OPEN_MANHOLE
    department VARCHAR(40) NOT NULL,
    
    -- Spatial & Media Data
    location GEOMETRY(Point, 4326) NOT NULL,
    address_landmark TEXT,
    ward_id INT REFERENCES wards(id),
    zone_id INT REFERENCES zones(id),
    before_image_url TEXT NOT NULL,
    after_image_url TEXT,
    
    -- AI & Scoring Metadata
    cv_confidence NUMERIC(4,3),
    bbox_area_ratio NUMERIC(4,3),
    severity_score NUMERIC(5,2) NOT NULL,    -- 0 to 100
    priority_level VARCHAR(15) NOT NULL,     -- P0_EMERGENCY, P1_HIGH, P2_MEDIUM, P3_STANDARD
    upvote_count INT DEFAULT 1,
    
    -- Assignment & SLA Tracking
    assigned_to UUID REFERENCES users(id),
    escalation_level INT DEFAULT 0,          -- 0: Field, 1: CSI/AE, 2: ZO, 3: HOD/Commissioner
    status VARCHAR(30) DEFAULT 'OPEN',       -- OPEN, ASSIGNED, IN_PROGRESS, PENDING_SUPERVISOR_AUDIT, RESOLVED, REOPENED
    sla_deadline TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    ai_audit_passed BOOLEAN
);
CREATE INDEX idx_issues_location ON civic_issues USING GIST (location);
CREATE INDEX idx_issues_status_sla ON civic_issues (status, sla_deadline);
```

---

## 6. Technical Architecture & API Specification

### 6.1 System Microservices & Stack
* **Client Layer:** React 18 + Vite + Tailwind CSS (PWA with Service Workers for offline field queuing) + MapLibre GL + Deck.gl.
* **API Gateway & Core Service:** Python **FastAPI** (Async REST + WebSockets for live ICCC dashboard streaming).
* **Spatial & Relational Database:** **PostgreSQL 16 + PostGIS 3.4** managed via **SQLAlchemy 2.0 (Async) + GeoAlchemy2**.
* **Async Task Queue & Scheduler:** **Redis + Celery** (AI inference workers, push notifications) + **Celery Beat** (runs every 5 minutes to scan `sla_deadline` and trigger L1/L2 escalations).
* **Object Storage:** AWS S3 / MinIO / Cloudflare R2 for storing signed `before_image` and `after_image` WebP blobs with EXIF/GPS metadata preserved.

### 6.2 Core REST & WebSocket API Contracts

| Method & Endpoint | Allowed Roles | Purpose & Core Backend Logic |
| :--- | :--- | :--- |
| `POST /api/v1/issues/report` | `CITIZEN` | Accepts `multipart/form-data` (live image, lat, lng, accuracy, voice/text). Runs PostGIS `ST_DWithin(25m)` check; either merges into Master Ticket or creates ticket + dispatches Celery AI triage job. |
| `GET /api/v1/issues/nearby` | `CITIZEN`, `ALL` | Returns active issues within `radius_m` (default $500\text{m}$) using `ST_DWithin` so citizens can upvote existing issues before filing duplicates. |
| `POST /api/v1/issues/{id}/upvote` | `CITIZEN` | Increments `upvote_count`, logs voter ID to prevent double-voting, and dynamically recalculates severity score $S$ and SLA tier. |
| `GET /api/v1/field/my-queue` | `FIELD_INSPECTOR` | Returns assigned open/in-progress tickets in the inspector's ward sorted by `sla_deadline ASC, severity_score DESC`. |
| `POST /api/v1/field/issues/{id}/resolve` | `FIELD_INSPECTOR` | Validates `ST_DistanceSphere(inspector_gps, issue_gps) <= 30`. Uploads "After" image, triggers YOLOv8 + CLIP verification, updates status to `RESOLVED` or `PENDING_SUPERVISOR_AUDIT`. |
| `POST /api/v1/issues/{id}/reopen` | `CITIZEN` | Allowed within 48h of resolution. Sets status to `REOPENED`, increments `escalation_level` to Tier-2 (`WARD_SUPERVISOR`), penalizes inspector KPI by $-10$. |
| `GET /api/v1/admin/analytics/heatmap` | `ZONAL_OFFICER`, `DEPT_HOD`, `SUPER_ADMIN` | Returns GeoJSON FeatureCollection of all 85 Wards with aggregated metrics (`open_count`, `sla_breached_count`, `mttr_hours`) and DBSCAN chronic blackspot polygons. |
| `GET /api/v1/admin/analytics/inspectors` | `WARD_SUPERVISOR` to `SUPER_ADMIN` | Paginated leaderboard of inspectors filtered by `zone_id`, `ward_id`, `department`, sorted by `kpi_score`, `sla_compliance_pct`, or `reopen_rate`. |
| `WS /ws/v1/iccc/live-feed` | `SUPER_ADMIN`, `DEPT_HOD` | WebSocket stream pushing real-time ticket creations, P0 critical alerts, and live L1/L2 SLA breach events to the ICCC command wall. |

---

## 7. Non-Functional Requirements (NFRs) & Edge Cases

1. **Performance & Latency:**
   * Citizen report submission acknowledgment must complete in $< 500\text{ ms}$ (spatial deduplication + DB insert happen synchronously; heavy CV/NLP scoring executes asynchronously via Celery within $3\text{ seconds}$ and updates the client via polling/WebSocket).
   * PostGIS spatial queries across $100,000+$ historical rows must execute in $< 80\text{ ms}$ using **GiST spatial indexes** (`CREATE INDEX USING GIST`).
2. **Offline / Poor Connectivity Tolerance (Field App):**
   * Field inspectors working in basements or dense markets often lose 4G/5G signal. The React PWA must cache the cryptographic GPS-timestamped "After" photo in **IndexedDB** at the exact moment of capture on-site and auto-sync via Background Sync API once connectivity returns.
3. **Adversarial & Spoof Protection:**
   * **Mock Location Detection:** Reject payloads if browser/OS telemetry flags mock GPS providers or instantaneous velocity anomalies (e.g., an inspector "teleporting" $8\text{ km}$ between two wards in $30\text{ seconds}$).
   * **Screen-Recapture Detection:** Lightweight Moiré pattern / EXIF check in the CV pipeline to block users or inspectors taking a photo of another phone or monitor screen.

---

## 8. Phased Implementation Roadmap (8-Week Build Plan)

| Phase | Timeline | Deliverables |
| :--- | :--- | :--- |
| **Phase 1: Spatial Core & RBAC** | Weeks 1–2 | PostgreSQL + PostGIS setup, seeding Indore's **22 Zones & 85 Wards GeoJSON polygons**, JWT 6-tier RBAC authentication, Point-in-Polygon auto-routing API. |
| **Phase 2: AI Triage & Deduplication** | Weeks 3–4 | YOLOv8 multi-class civic model integration, CLIP duplicate image matcher (`ST_DWithin` $25\text{m}$), Hinglish NLP urgency parser, Composite Severity Score calculator. |
| **Phase 3: Field App & Celery SLA Engine** | Weeks 5–6 | Citizen & Field Inspector React PWA, live WebRTC camera + $30\text{m}$ geofence lock, Before-vs-After AI verification, Redis + Celery Beat L1/L2 auto-escalation worker. |
| **Phase 4: Super Admin ICCC Command Center** | Weeks 7–8 | Deck.gl H3/Ward Heatmaps, DBSCAN Chronic Blackspot detector, Inspector KPI Leaderboard, WebSocket live ticker, Docker Compose deployment setup. |