# CivicPulse AI — Phase-wise Frontend Plan

Three clients share one design system and API client:
- **web-citizen** — PWA for Tier 0 (report, track, Me Too, reopen)
- **app-inspector** — React + Capacitor (Android) for Tier 1 field staff
- **web-admin** — Command Center for Tiers 2–5 (supervisor to Commissioner)

Stack: React + Vite + TypeScript + Tailwind, TanStack Query, Zustand, React Router, MapLibre GL + Deck.gl, Recharts, i18next (English/Hindi), Vitest + Testing Library + Playwright.
Backend dependencies are noted per phase; mock with MSW from the OpenAPI schema until the backend phase lands.

Status legend: ⬜ not started · 🟨 in progress · ✅ done

---

## F0 — Foundation & Design System ⬜ (≈ 4–5 days) · needs: B0
- Monorepo (pnpm workspaces): `packages/ui`, `packages/api-client`, `packages/config`, three apps.
- Tailwind tokens: severity colours (Critical red, High amber, Standard green/blue), spacing, type scale; dark mode for admin.
- Components: Button, Input, Badge (priority/status), Card, Modal, Toast, Table, Skeleton, EmptyState, MapContainer.
- API client generated from OpenAPI; auth interceptor; MSW mocks; i18n scaffolding (Hindi + English).
- Lint, tsc strict, Storybook (optional), CI.
**Exit:** all apps boot; UI package consumed by all three; accessibility baseline (axe) clean.

## F1 — Auth & App Shells ⬜ (≈ 1 week) · needs: B1
- Phone OTP screens (request, verify, resend timer), token refresh, device id.
- Role-based routing guards; shells: citizen bottom-nav, inspector task-centric nav, admin sidebar.
- Language switcher; session expiry handling; offline banner.
**Exit:** all 6 roles log in and land on the right shell; unauthorised routes redirect.

## F2 — Citizen: Live Capture & Submit ⬜ (≈ 1.5 weeks) · needs: B2
- Capture screen: `getUserMedia` rear camera, **no file input**, nonce request, GPS with accuracy ring, block submit if accuracy poor.
- Optional note (text now; voice later), category preview after triage.
- Submit with `Idempotency-Key`; offline queue with retry (IndexedDB) and clear "pending upload" state.
- Permission-denied flows; low-light/blur hint; consent screen on first use.
- Duplicate result UI: "Already reported nearby, your Me Too was added".
**Exit:** report submitted in < 3 taps; works on a mid-range Android Chrome; offline then online sync works.

## F3 — Citizen: Map, Track, Engage ⬜ (≈ 1.5 weeks) · needs: B2, B3
- Nearby issues map (MapLibre), clustering, filters; issue detail with timeline from `issue_events`.
- Me Too button, status tracker with SLA countdown, push/WhatsApp deep links.
- Resolved view: Before/After side-by-side, CSAT rating, **Reopen** with reason.
- My reports list; empty/error states in Hindi and English.
**Exit:** citizen can follow a ticket end-to-end; reopen creates `REOPENED`.

## F4 — Inspector App (Capacitor) ⬜ (≈ 2 weeks) · needs: B4, B5
- Task list sorted by priority and SLA remaining (colour-coded 75% warning).
- Issue detail with navigation intent (Google Maps), distance-to-site, on-duty toggle.
- **Resolve flow:** nonce → in-app camera → GPS check (≤ 30 m shown live) → upload After photo → status `PENDING_AUDIT` → result.
- Native plugin: mock-location flag, Play Integrity token; background-safe upload queue.
- Handles AI-rejected state with reason; resubmit path.
**Exit:** resolve blocked when > 30 m, mock location, or stale nonce; passes on a real device in field test.

## F5 — Supervisor Console (Tier 2–3) ⬜ (≈ 1.5 weeks) · needs: B4, B5, B6
- Ward/zone board (kanban by status) with SLA badges and workload per inspector.
- Reassign, material/vehicle note, **Review queue** (Before/After compare, AI scores, approve/reject with reason).
- L1/L2 breach lists, bulk actions with confirmation.
- Real-time updates via WebSocket (`/ws/ward/{id}`) with reconnect and REST resync.
**Exit:** CSI/AE can clear a review queue and rebalance a ward without leaving the screen.

## F6 — Command Center: Geospatial Intelligence ⬜ (≈ 2 weeks) · needs: B7
- Deck.gl H3 hex heatmap and ward polygons; Green/Amber/Red scale; 10k+ points at 60 FPS.
- Layer filters: zone, ward, department, severity, date; viewport-bounded queries, debounce.
- Chronic blackspot layer with detail drawer (history, photos, suggested action).
- Live ticker of new/critical/escalated tickets; table fallback for accessibility.
**Exit:** smooth pan/zoom on a 100k-ticket dataset; filters reflected in URL for sharing.

## F7 — Command Center: Accountability & Governance ⬜ (≈ 1.5–2 weeks) · needs: B7
- Inspector leaderboard and **Accountability Matrix** (load ratio, SLA%, MTTR, reopen/fake-closure, KPI) with drill-down to tickets.
- SLA audit view, ICCC red list, Zone vs Zone comparison, monthly KPI trend charts.
- Show-Cause **recommendation drafts** for HOD (review + approve; never auto-sent).
- Anomaly list for human review; export CSV/PDF with audit log entry.
**Exit:** Commissioner can answer "who is slacking, where, and why" in under 3 clicks.

## F8 — Quality, Accessibility, Performance ⬜ (≈ 1 week) · needs: all
- Playwright E2E: capture → assign → resolve → verify → escalate (clock control) → reopen.
- Lighthouse PWA ≥ 90; LCP < 2.5 s on 4G; bundle splitting (map libs lazy-loaded).
- WCAG 2.1 AA pass; Hindi copy review; low-bandwidth mode (compressed images, reduced map tiles).
- Security UI checks: no reporter phone in field/supervisor views; unmask action requires reason (admin).
**Exit:** all E2E green; accessibility and performance budgets met.

## F9 — Release ⬜ (≈ 3–4 days) · needs: B9
- Build pipelines: PWA to CDN, Android APK/AAB for inspector, admin behind SSO/VPN as per policy.
- Sentry, web-vitals, feature flags, versioned API compatibility check.
- Pilot onboarding: in-app tutorial, training deck, feedback widget.
**Exit:** pilot ward users onboarded; crash-free sessions ≥ 99%.

---

## Screen inventory

| App | Screens |
| --- | --- |
| Citizen | Login, Consent, Capture, Submit result, Nearby map, Issue detail, My reports, Reopen, CSAT |
| Inspector | Login, Task list, Task detail, Resolve camera, Resolve result, Profile/on-duty |
| Admin | Login, Ward board, Review queue, Staff load, Zone overview, Heatmap, Blackspots, Leaderboard, Accountability matrix, SLA audit, ICCC red list, Policy config, Audit log |

## UX rules
1. Capture is one-hand, big targets, minimal text; show GPS accuracy honestly.
2. Priority/status colours are consistent everywhere and never the only signal (add icon/text).
3. Every destructive or penalty-related action needs confirmation and a reason.
4. Optimistic UI only where the server can't reject; otherwise show pending state.
5. Never show reporter phone to field/supervisor roles; mask by default.
6. Hindi-first copy for citizen and inspector; English toggle everywhere.

## Frontend ↔ backend contract
- Source of truth: OpenAPI; regenerate `api-client` on every backend merge; CI fails on breaking diff.
- Errors: `{code, message, details}` mapped to localised messages.
- Realtime: WS channels per scope; on reconnect, refetch via REST then resume.

## Handover template (copy per phase)

```
Phase Fn — status:
Screens/components shipped:
API endpoints consumed (and mock vs real):
Feature flags / env:
Tests (unit, e2e) and coverage:
Devices/browsers verified:
Accessibility & performance results:
Known gaps / tech debt:
Next phase prerequisites:
```
