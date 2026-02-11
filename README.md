# Campaign Budget Planner (NestJS + Angular + Tailwind)

A lightweight planning tool that helps campaign managers split a campaign budget across **Video / Display / Social** channels, estimate expected reach (impressions), and compare preset strategies side-by-side.

## Features (MVP)
- Budget allocation across channels:
  - **Video** (higher CPM, stronger engagement)
  - **Display** (medium CPM, broad reach)
  - **Social** (lower CPM, broad reach)
- **Plan** endpoint: calculate allocations + expected impressions
- **Strategy Comparison** endpoint: compare `balanced`, `max_reach`, `max_engagement` for the same input
- Optional CPM overrides per channel (if omitted, defaults are used)
- Warnings (sanity checks) for potentially mismatched mixes vs selected strategy
- Angular + Tailwind UI:
  - Planner form
  - Results table
  - Comparison panel
  - Simple bar-style visualizations

## Default CPM
- video: 12
- display: 6
- social: 4

## Strategy presets
- balanced: video 0.30, display 0.30, social 0.40
- max_reach: video 0.15, display 0.35, social 0.50
- max_engagement: video 0.55, display 0.25, social 0.20

## Tech stack
- Backend: NestJS (TypeScript)
- Frontend: Angular + TailwindCSS
- Containers: Docker + Docker Compose

---

# Quick start (Development, Docker only)

> No local Node.js installation required. Only Docker is needed.

1. Build & run dev containers:
```bash
docker compose -f docker-compose.dev.yml up --build
```
2. Open frontend:
  •	Frontend: http://localhost:4200
  •	Backend: http://localhost:3000

## Notes about dev setup:
  - Code is bind-mounted into containers.
  - node_modules live inside Docker volumes (not on your host).
  - File watching uses polling for reliability on macOS/Windows.

---

# Quick start (Production, Docker only)

> No local Node.js installation required. Only Docker is needed.

1. Build & run prod containers:
```bash
docker compose -f docker-compose.prod.yml up --build
```
2. Open frontend:
  •	App (nginx serving Angular): http://localhost:8080
  •	API (NestJS): http://localhost:3000

In prod, nginx also proxies /api/* to the backend.

---

# API

## GET /api/config

Returns default CPM and available strategy presets.

## POST /api/plan

Calculates plan for a chosen strategy (or custom mix).

Request example:

```json
{
  "totalBudget": 10000,
  "durationDays": 30,
  "strategy": "max_reach",
  "cpmOverrides": {
    "video": 14
  }
}
```

Response includes:
	•	allocations: channelKey, share, budget, cpm, impressions
	•	totals: impressionsTotal
	•	warnings: list of strings

## POST /api/compare

Compares the three preset strategies for the same input.

Request example:

```json
{
  "totalBudget": 10000,
  "durationDays": 30,
  "cpmOverrides": {
    "social": 5
  }
}
```

---

# Assumptions

	- We estimate impressions using a simple CPM-based formula:
	  - impressions = floor((allocatedBudget / cpm) * 1000)
	- We do not model diminishing returns, frequency capping, or audience overlap in MVP.
	-	CPM values are simplified defaults and can be overridden per request.
	
---

# Decisions postponed / left flexible

	-	Diminishing returns & saturation curves per channel
	-	Unique reach (vs impressions) and frequency models
	-	Audience overlap across channels
	-	Auth, persistence, saved scenarios
	-	Integrations with Google/Meta APIs

---

# If I had more time (production extensions)

  - Historical performance inputs per region/targeting to calibrate CPM/reach
  - Diminishing returns and saturation modeling
	-	“Quality reach” metric (engagement weights) and multi-objective optimization
	-	User accounts + saved scenarios
	-	Observability: structured logs, Sentry, metrics, dashboards
	-	CI pipelines: lint/test/build in containers

---

# Repo structure

```
.
├── backend/
├── frontend/
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── openapi.yaml
├── AGENTS.md
└── README.md
```

---

# Running tests (Docker only)

Backend unit tests:
```bash
docker compose -f docker-compose.dev.yml exec backend npm test
```

Frontend unit tests:
```bash
docker compose -f docker-compose.dev.yml exec frontend npm run test-headless
```

Frontend build check:
```bash
docker compose -f docker-compose.dev.yml exec frontend npm run build
```
