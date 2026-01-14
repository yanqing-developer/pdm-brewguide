PDM-BrewGuide Backend (Prototype)

A small end-to-end backend prototype built for the PDM Technical Interview Task.

This project demonstrates how to scrape real public data, store simple user memory, and generate personalized, explainable, action-oriented recommendations using a modern backend stack.

1. Problem & Domain

Domain: Berlin breweries / brewpubs
Data source: Public Open Brewery DB API

The system recommends breweries based on:

user preferences (stored memory),

simple rules (distance, type, keywords),

recent user actions (save / dismiss / similar).

Scope is intentionally small but complete, designed to be implemented within one day.

2. How This Matches the Task Requirements
Real Data Scraping

Fetches live brewery data from a public API.

Normalizes and persists it into PostgreSQL.

Memory Integration

Stores simple user preferences (preferred types, keywords, radius, etc.).

Memory is reused automatically in later recommendation requests.

Personalized Guidance

Recommendations adapt to:

stored preferences,

user location (if provided),

recent actions (e.g. “similar”).

Action-Oriented Interaction

Supported actions:

Save a brewery

Dismiss a brewery

Show similar (learns from the selected item)

Actions immediately influence future results.

Transparent Reasoning

Each recommendation includes:

a score,

a short explanation (why it was recommended).

npm run db:statusAdaptive Behaviour

The system learns quickly from user actions without ML.

Preferences are updated incrementally and reused.

Note: Streaming is simulated via fast, incremental responses on the main path; no frontend is included in this prototype.

3. Architecture Overview

The backend is split into two clear paths:

Main Path (User-Facing)

Reads only from local PostgreSQL

Always responsive, even if the external API is down

Endpoints:

POST /api/recommendations

GET /api/memory

POST /api/memory

POST /api/actions/*

Side Path (Data Ingestion)

Fetch → normalize → upsert external data

Allowed to fail without breaking the system

Endpoint:

POST /api/admin/refresh-breweries

This separation ensures availability over freshness, which is critical for real systems.

4. Key Endpoints (Quick View)

Health

GET /api/health

Refresh data

POST /api/admin/refresh-breweries

User memory

GET /api/memory

POST /api/memory

Recommendations

POST /api/recommendations

Actions

POST /api/actions/save

POST /api/actions/dismiss

POST /api/actions/similar

5. Tech Stack

Node.js + Express

PostgreSQL

Public REST API (Open Brewery DB)

Rule-based recommendation logic (no ML)

6. How to Run Locally
npm install
npm run db:init
npm run dev


Server runs on:

http://localhost:5080

7. Non-Goals (By Design)

This prototype intentionally excludes:

authentication & multi-user accounts,

complex ML models,

frontend UI,

production-grade crawling pipelines.

Focus: system thinking, data flow, memory, adaptability, and explainability.

8. Summary

This project demonstrates:

real data ingestion,

persistence and memory reuse,

personalized recommendations,

transparent reasoning,

action-driven adaptation,

within a small, coherent, end-to-end system, aligned with the goals of the technical interview task.