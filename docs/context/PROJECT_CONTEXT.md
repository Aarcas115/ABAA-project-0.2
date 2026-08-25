# Project Context & Preferences

> This file captures stable project-level decisions made during the **Discuss Phase**.
> It is created/updated by the Architect before the Plan phase.
> Unlike ACTIVE_CONTEXT.md (which is volatile per-session), this file is persistent.

---

## Product

ABAA (AI Business Analyst Assistant) is a web app that automates a Business Analyst's workflow using the ACE Framework's BMAD cycle (Analyze, Discuss, Plan, Execute/Verify). It takes a client meeting transcript as input and generates three outputs: a Markdown requirements/tech-spec document, a coder-assignable task breakdown, and a Statement of Work (SOW). The app must use AI both during its own construction and as part of its runtime functionality (LLM-driven transcript analysis).

---

## Visual Style

- **Density**: Compact
- **Theme**: Dark mode default
- **Component Library**: None — plain Tailwind utility classes, no component library
- **Typography**: System font stack (no custom web fonts for Phase 1)

---

## API Design

- **Style**: REST
- **Error Format**: Simple JSON { "error": "message" } — no RFC 7807, no envelope structure
- **Auth Strategy**: None for Phase 1 (no user accounts, stateless single-session tool)
- **Versioning**: None yet — single unversioned endpoint set until multi-version need arises

---

## Data Layer

- **Database**: None — stateless for Phase 1, transcript in / outputs out, no persistence
- **ORM/Query Builder**: N/A
- **Migration Tool**: N/A

---

## Testing

- **Framework**: Vitest
- **Coverage Target**: No formal target for Phase 1 — MVP/demo focus, test what matters (critical pipeline logic) rather than chasing a percentage
- **E2E Tool**: None for Phase 1 — revisit once the UI is stable, likely in Phase 4 (UI/UX Polish)

---

## Code Style

- **Language**: JavaScript (plain, not TypeScript)
- **Linter**: ESLint
- **Formatter**: Prettier

---

## Deployment

- **Platform**: Vercel
- **CI/CD**: None yet — manual deploy via Vercel for Phase 1, revisit in Phase 2
- **Environment Strategy**: Single environment (local dev + Vercel production), no staging tier yet

---

## Stack & Hosting

- **Frontend**: React + Vite, plain JavaScript (not TypeScript), Tailwind CSS 3
- **Backend**: FastAPI (Python 3.12)
- **LLM Provider**: OpenRouter free tier, model poolside/laguna-xs-2.1:free
- NOTE: (corrected 2026-08-16 — "openrouter/" prefix is not part of the model ID)
- **Hosting**: Vercel — frontend deployed as Vite static site (abaa-project-02.vercel.app), backend deployed as Python serverless function via @vercel/python (abba-backend.vercel.app). Two separate Vercel projects.
- **Constraint**: Every tool/service used must be free (hard constraint, no paid tiers anywhere in the stack)

---

## Phase 3: Video/Audio-to-Transcript Pipeline

### Scope

Users can provide a client meeting transcript as plain text (existing Phase 1/2 behavior, unchanged), OR drop in a single video file, OR drop in a single audio file, into the SAME existing "Client Meeting Transcript" input area. Only one input type is used at a time (mutually exclusive) — the input area is repurposed, not replaced or duplicated.

### Architecture Decisions

- **Transcription Service**: Groq's Whisper API for transcription, NOT client-side Transformers.js/WASM. Rationale: ~228x real-time speed, 2,000 requests/day free tier, no credit card required, OpenAI-compatible API.
- **API Key Storage**: Groq API key stored as client-side VITE_ environment variable (e.g. VITE_GROQ_API_KEY). This is an accepted, known risk for this project's demo scope — audio is sent directly from browser to Groq's API, bypassing the Vercel backend entirely.
- **Vercel Serverless Constraint**: Hard 4.5MB request body limit. Audio/video files must be handled client-side and sent directly to Groq.

### Pipeline Branching Logic

- **Plain text input** → follows existing Phase 1/2 flow unchanged (text goes straight to reqspec extraction).
- **Audio file input** → extract transcript from audio via Groq → pass transcript into existing reqspec extraction step.
- **Video file input** → extract audio from video (client-side) → extract transcript from that audio via Groq → pass transcript into existing reqspec extraction step.

### Out of Scope (Phase 4)

- UI/UX changes: new form fields (Client/Company, Meeting/Project Title, Date & Time, Add Participant, Meeting Reason)
- Redesigned loading/processing state
- Visual restyling of the input area

---

## Project-Specific Decisions

<!-- Record any Discuss Phase decisions that don't fit the categories above -->

| Decision | Choice | Rationale | Date |
|---|---|---|---|
| _Example: Error handling_ | _Global toast notifications_ | _Cleaner UX for multi-step forms_ | _YYYY-MM-DD_ |

---

*Update this file during the Discuss Phase. Reference it as a constraint during Plan and Execute phases.*
