# Project Context & Preferences

> This file captures stable project-level decisions made during the **Discuss Phase**.
> It is created/updated by the Architect before the Plan phase.
> Unlike ACTIVE_CONTEXT.md (which is volatile per-session), this file is persistent.

---

## Product

ABAA (AI Business Analyst Assistant) is a web app that automates a Business Analyst's workflow using the ACE Framework's BMAD cycle (Analyze, Discuss, Plan, Execute/Verify). It takes a client meeting transcript as input and generates three outputs: a Markdown requirements/tech-spec document, a coder-assignable task breakdown, and a Statement of Work (SOW). The app must use AI both during its own construction and as part of its runtime functionality (LLM-driven transcript analysis).

---

## Visual Style

- **Density**: [Open - not yet decided]
- **Theme**: [Open - not yet decided]
- **Component Library**: [Open - not yet decided]
- **Typography**: [Open - not yet decided]

---

## API Design

- **Style**: [Open - not yet decided]
- **Error Format**: [Open - not yet decided]
- **Auth Strategy**: [Open - not yet decided]
- **Versioning**: [Open - not yet decided]

---

## Data Layer

- **Database**: [Open - not yet decided]
- **ORM/Query Builder**: [Open - not yet decided]
- **Migration Tool**: [Open - not yet decided]

---

## Testing

- **Framework**: [Open - not yet decided]
- **Coverage Target**: [Open - not yet decided]
- **E2E Tool**: [Open - not yet decided]

---

## Code Style

- **Language**: JavaScript (plain, not TypeScript)
- **Linter**: [Open - not yet decided]
- **Formatter**: [Open - not yet decided]

---

## Deployment

- **Platform**: Render
- **CI/CD**: [Open - not yet decided]
- **Environment Strategy**: [Open - not yet decided]

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
