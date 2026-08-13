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

- **Platform**: Render
- **CI/CD**: None yet — manual deploy via Render for Phase 1, revisit in Phase 2
- **Environment Strategy**: Single environment (local dev + Render production), no staging tier yet

---

## Stack & Hosting

- **Frontend**: React + Vite, plain JavaScript (not TypeScript), Tailwind CSS 3
- **Backend**: Python
- **LLM Provider**: OpenRouter free tier, model openrouter/poolside/laguna-xs-2.1:free
- **Hosting**: Render — frontend static site and backend web service deployed as two separate services, no local dev process required for the deployed app
- **Constraint**: Every tool/service used must be free (hard constraint, no paid tiers anywhere in the stack)

---

## Project-Specific Decisions

<!-- Record any Discuss Phase decisions that don't fit the categories above -->

| Decision | Choice | Rationale | Date |
|---|---|---|---|
| _Example: Error handling_ | _Global toast notifications_ | _Cleaner UX for multi-step forms_ | _YYYY-MM-DD_ |

---

*Update this file during the Discuss Phase. Reference it as a constraint during Plan and Execute phases.*
