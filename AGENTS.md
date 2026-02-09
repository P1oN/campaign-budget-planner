# AGENTS.md — Campaign Budget Planner

This repository contains a small MVP product:
- Backend: NestJS API (budget split + reach estimates + strategy comparison)
- Frontend: Angular + Tailwind UI (planner + comparison panel)
- Dev workflow is Docker-first (no local Node required)

## Product summary
Campaign managers input:
- Total budget
- Duration (days)
- Strategy (balanced / max reach / max engagement / custom)
Optionally:
- CPM overrides per channel
- Custom channel shares (custom strategy)

The system outputs:
- Recommended budget allocation per channel
- Expected impressions per channel and totals
- Strategy comparison across presets
- Sanity warnings

Channels:
- video, display, social

## Rules of engagement
1. Docker-first: do not require local Node tooling.
2. Prefer small, well-typed modules and predictable contracts.
3. Keep calculations deterministic and explainable.
4. Avoid over-engineering: no DB, no external integrations in MVP.
5. When in doubt, prioritize clarity and demo-readiness.

## Local development (Docker)
Development stack:
- backend: http://localhost:3000
- frontend: http://localhost:4200

Start:
```bash
docker compose -f docker-compose.dev.yml up --build
```

Run backend tests:
```bash
docker compose -f docker-compose.dev.yml exec backend npm test
```

Run frontend build check:
```bash
docker compose -f docker-compose.dev.yml exec frontend npm run build
```

## Backend architecture
	•	CampaignPlannerModule
	•	Controller: HTTP endpoints
	•	Service: calculation and orchestration
	•	Repositories: defaults (CPM, strategies)
	•	Rules: sanity checks

Endpoints:
	•	GET /api/config
	•	POST /api/plan
	•	POST /api/compare

Validation:
	•	Global ValidationPipe: whitelist, forbidNonWhitelisted, transform
	•	DTOs with class-validator

## Frontend architecture
	•	PlannerPageComponent: form + plan results
	•	ComparisonPanelComponent: strategy comparison output
	•	CampaignPlannerApi: typed HttpClient wrapper
	•	Tailwind used for layout and styling (no UI library)

## Quality bar (Definition of Done)

Backend:
	•	DTO validation works (invalid inputs result in 400)
	•	/api/plan and /api/compare return correct allocations/totals
	•	Unit tests for service cover:
	•	presets
	•	CPM overrides
	•	custom mix validation
	•	warnings
	•	No TODOs or placeholders

Frontend:
	•	Planner form validates inputs
	•	Custom strategy validates shares sum to 100%
	•	Optional CPM overrides are only sent when provided
	•	Strategy comparison renders 3 preset results
	•	App builds successfully
	•	No TODOs or placeholders

## Conventions
	•	Channel keys: video, display, social
	•	Strategy keys: balanced, max_reach, max_engagement, custom
	•	Impressions formula: floor((budget/cpm)*1000)
	•	Percent inputs in UI are transformed to shares in [0..1] for API payload

## Extensibility notes

Potential future improvements (not MVP):
	•	diminishing returns / saturation curves
	•	unique reach modeling (frequency)
	•	scenario persistence (local storage or DB)
	•	external platform integrations (Google/Meta)
