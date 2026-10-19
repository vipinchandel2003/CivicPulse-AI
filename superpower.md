# CivicPulse AI — Superpowers

Two meanings, both covered: **Part A** is what makes the product different. **Part B** is the working method any coding agent must follow while building it.

---

## Part A — Product superpowers

| # | Superpower | What it does | Why it beats a basic CRUD complaint app |
| --- | --- | --- | --- |
| 1 | **Proof-of-Work Lock** | Closure needs a live in-app photo taken within 30 m of the issue, with fresh nonce and device attestation | Kills "Resolved without work", the core Indore 311 failure |
| 2 | **Spatial Deduplication** | Same category within 25 m of an open issue merges into one master ticket; Me Too count rises | One real problem = one ticket; priority grows with public pressure |
| 3 | **Multi-Modal Triage** | YOLO finds category and size; Hinglish NLP finds hazards (school, hospital, accident) | Priority reflects danger, not who shouted loudest |
| 4 | **Dynamic Severity + SLA** | 0–100 score with hard overrides sets a 4–72 h countdown | Open manhole never waits 72 h |
| 5 | **Ward Intelligence Routing** | Point-in-polygon finds ward/zone, then least-loaded on-duty inspector | Right person, instantly, fairly loaded |
| 6 | **Self-Enforcing Escalation** | 75% warn, 100% L1 to CSI/AE, 150% L2 to Zonal Officer + ICCC red list | Accountability without anyone chasing |
| 7 | **AI Before/After Verification** | CLIP background match + detector says defect is gone; humans review rejects | Catches fake photos fairly |
| 8 | **Chronic Blackspot Detection** | 5+ repeats within 50 m in 30 days flags structural failure | Moves from patching to permanent fixes |
| 9 | **Accountability Matrix** | SLA%, MTTR, load ratio, reopen/fake-closure rate, composite KPI | Commissioner sees who performs, with evidence |
| 10 | **Immutable Audit Trail** | Every state change is an append-only event | Disputes resolved with facts |

### Product principles
1. **Evidence over claims.** No status change without evidence or an audited reason.
2. **Fair to staff.** AI assists, humans decide on penalties.
3. **Citizen-first speed.** Submit in < 400 ms; heavy work is async.
4. **Config over code.** Weights, SLA hours, thresholds live in tables.
5. **Privacy by default.** Mask reporter data; blur faces and plates.

---

## Part B — Engineering superpowers (workflow for coding agents)

Follow this loop on every task. Do not skip steps.

1. **Clarify** — Restate the goal and acceptance criteria. If the PRD conflicts with `thinking/research.md`, the research decisions (D1–D10) win. Ask only if truly blocked.
2. **Brainstorm** — List 2–3 approaches with trade-offs for non-trivial work; pick one and say why.
3. **Plan** — Write a short numbered plan (files to touch, tests to add, migrations). Keep steps small enough to verify.
4. **Test first** — Write a failing test for behaviour (pytest / Vitest). For spatial logic use real PostGIS (testcontainers), never mocks.
5. **Implement minimal** — Smallest change that passes. No speculative features.
6. **Verify** — Run tests, linters, type checks, migration up/down. Check the relevant SLO (latency, idempotency).
7. **Review yourself** — Security checklist (`security.md` §12), RBAC scope, event logging, config not hard-coded.
8. **Document & hand over** — Update the phase handover file with what changed, how to run it, known gaps.

### Debugging superpower
Reproduce → isolate → form a hypothesis → prove it with a log/test → fix root cause → add regression test. Never patch symptoms.

### Hard rules (never break)
- Never compute distance on `geometry(4326)` with metre values. Use `geography`.
- Never mutate ticket status without writing `issue_events`.
- Never expose reporter phone to Tier 1.
- Never put AI calls in the request path of `POST /issues`.
- Never hard-code zone/ward counts or SLA hours.
- Never auto-issue penalties or show-cause notices.
- Never trust client-sent role, ward or distance.
