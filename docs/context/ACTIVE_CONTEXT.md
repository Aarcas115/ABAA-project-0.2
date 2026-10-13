# Active Context: ABAA — Phase 4 Planning

## Session Metadata

- **Last Updated:** 2026-10-11
- **Session ID:** abaa-task17-group3-tests
- **Active Role:** Developer
- **Mode:** IMPLEMENTATION

---

## Current Objective

Pytest tests for the RAG layer written (Task 17.3): test_rag_engine.py and test_rag_route.py. Awaiting Benya's pytest run and Claude's audit before Task 17.4 (static cross-check) and Task 17.5 (manual verification).

---

## Current State

### Working

- RAG test files written, pending pytest run

### In Progress

- Task 17.3 (pytest tests) — not yet run or reviewed

### Completed

- Phase 3 implementation complete and verified (Tasks 6-10, all acceptance criteria met)
- All Phase 3 tests passing (60/60 frontend, 27/27 backend)
- Manual verification checklist created for Phase 3
- Task 11 (BA Standards Research & Reference Doc) completed — docs/context/ba-standards.md created with requirement taxonomy, Gherkin examples, and IEEE 830 quality criteria
- Task 17 checklist drafted in docs/planning/task_checklist.md (6 items, all Pending)
- Task 17.1 (app/backend/rag_engine.py) completed — heading-based chunker, TF-IDF index, search(), lazy get_engine() singleton; audited by Claude and approved by Benya
- Task 17.0 (runtime corpus in app/backend/knowledge/: ba-sources.txt and ba-standards.md) completed by Benya
- Task 17.2 (app.py wiring: cold-start warm-up and POST /api/rag/query) completed — audited by Claude and approved by Benya

---

## Next Steps

1. [ ] Benya runs the full backend pytest suite from app/backend (existing 27 plus the new RAG tests) and pastes the real terminal output
2. [ ] Claude audits the two new test files and interprets the pytest output; Benya marks Task 17.3 Completed once all tests pass
3. [ ] Claude performs the Task 17.4 static cross-check and reports the evidence; Benya marks Task 17.4 Completed
4. [ ] Benya performs Task 17.5 manual verification (local route check with both canonical queries, deployed backend check, smoke checks)
5. [ ] Draft Task 12 checklist (Multi-Field Input Form Structure) afterward

---

## Active Constraints

### Standards

- `.ace/standards/coding.md` — Using plain JavaScript, following naming conventions
- `.ace/standards/security.md` — No secrets in code, simple error handling
- `docs/rca/regression-guards.yaml` — Currently empty, no special guards

### Project Context

- Stack: React + Vite (plain JS), Python backend, OpenRouter laguna-xs-2.1:free
- No database, no auth, REST API with simple JSON errors
- Vitest for frontend testing, pytest for backend testing
- No E2E tooling for Phase 1
- Dark theme currently, transitioning to light theme in Phase 4
- **Hard constraint:** All tools/services must be free tier (Groq Whisper API for transcription, OpenRouter for analysis)

### Phase 4 Specific Constraints

- No SSE/streaming/polling for backend LLM call
- Free-tier only across the stack
- Plain JavaScript only — no TypeScript
- Plain Tailwind CSS only — no component libraries
- Stateless MVP — no database, no auth
- Task 17 RAG: Python standard library only, no new dependencies, in-memory TF-IDF retrieval, corpus in app/backend/knowledge/ (ba-sources.txt + runtime copy of ba-standards.md)

---

## Session Notes

- 2026-09-03: Created Phase 4 implementation plan draft. Scope expanded per stakeholder (John) meeting for business-analysis rigor plus additional UI requirements from project owner. Plan includes:
  - BA standards research and reference doc
  - Multi-field input form with drag-and-drop
  - Dynamic loading states and progress indicators
  - Light theme implementation
  - Gap-analysis stage with user Q&A
  - Optional RAG layer for BA best practices
  - Classified requirements with confidence indices
  - General polish pass
  - Manual verification checklist
  
- OUT OF SCOPE for Phase 4: Re-running pipeline on new transcript to append to existing project requirements (flagged for future phase)

- Phase 3 remains complete and unchanged; all verification artifacts preserved.

- 2026-09-03: CORRECTIVE session on Phase 4 plan — applied 8 fixes:
  1. Fixed Task 19 dependency chain (now depends on Tasks 15, 16, 17, 18)
  2. Fixed Task 17 dependency (now depends on Task 11)
  3. Added backend wiring requirements to Tasks 16, 17, 18 (app.py modifications)
  4. Updated Testing Framework section to note pytest for backend tasks
  5. Added stateless-constraint note to Task 17 objective
  6. Added risk row for RAG vs stateless constraint
  7. Rewrote Task 14 acceptance criteria for conditional progress indicator
  8. Added open item noting ba-sources.txt must use paraphrased content only

- 2026-09-03: Task 11 (BA Standards Research & Reference Doc) completed manually. The research and drafting were done outside of Aider, and docs/context/ba-standards.md was created with the finished content. The file includes:
  - Requirement Classification section with BABOK's four-level schema and five working categories
  - Gherkin section with Given/When/Then syntax and ABAA-domain examples
  - Quality Criteria section with IEEE 830 8-characteristic table
  - Application to Phase 4 pipeline section mapping to Tasks 16 and 18
  - All three acceptance criteria verified: taxonomy covers all 5 types, Gherkin examples included, file placed in docs/context/

- 2026-09-03: SCOPE & SEQUENCING DECISION — Task 17 changed from optional to mandatory. It now also wires docs/context/ba-standards.md into the live pipeline (not just inert documentation). Tasks 16 and 18 now depend on Task 17. Execution order: Task 17 will be tackled immediately after Task 11, before Tasks 12-15 (UI chain), since it now blocks two downstream tasks and carries the highest remaining complexity (L). Task numbering unchanged — this is a sequencing choice, not a renumbering.

- 2026-09-24: Task 17 checklist drafted (Architect) after inspecting the repo. PLAN AMENDED BY HAND: the RAG corpus moved from docs/context/ to app/backend/knowledge/ because the backend deploys as its own Vercel function from app/backend and docs/ is not deployed; docs/context/ba-standards.md stays canonical and app/backend/knowledge/ba-standards.md is a byte-identical runtime copy guarded by a pytest drift test. Other decisions: in-memory TF-IDF with a single heading-based chunker for both corpus files; standard library only; corpus loaded at module import via a lazy singleton after the API key check (no FastAPI lifespan events); POST /api/rag/query returns 503 when the corpus is empty, so a missing corpus never breaks existing routes; existing tests and modules are left untouched and new tests go in new files; ba-sources.txt content is authored outside Aider and must be paraphrased only. The gap-analysis test for Task 17 covers the search()/route interface contract because gap_analysis.py does not exist until Task 16.

- 2026-10-06: Task 17.1 implemented (Developer, Group 1 of 3). app/backend/rag_engine.py created: heading-based chunker (1-3 #'s, fence-aware, CRLF-safe via splitlines()), TF-IDF index built once at construction, RagEngine.__init__ takes explicit file_paths (not the module constants) so tests can point it at tmp_path, get_engine() is a lazy singleton stored in module-level _engine. No files other than rag_engine.py were touched by code changes. Not yet audited or reviewed; Task 17.1 set to In Progress, not Completed.

- 2026-10-11: Task 17.2 implemented (Developer, Group 2 of 3). app/backend/app.py edited additively: import rag_engine added, Field added to the pydantic import, rag_engine.get_engine() called once at module level after the OPENROUTER_API_KEY check (cold-start warm-up, no FastAPI lifespan events), RagQueryRequest model added (query: str, top_k: int = Field(default=3, ge=1, le=10)), and POST /api/rag/query added after /api/analyze. The route returns 400 for a blank query, 503 when engine.chunk_count is 0, and {"results": [...]} otherwise; missing or invalid fields and out-of-range top_k fall through to the existing RequestValidationError handler (400 {"error": "Validation error"}). No existing route, exception handler, CORS config, or the API key check was changed. Not yet audited or reviewed; Task 17.2 set to In Progress, not Completed. Task 17.1 was audited by Claude and marked Completed by Benya before this session.

- 2026-10-11: Task 17.3 tests written (Developer, Group 3 of 3). Created app/backend/tests/test_rag_engine.py (synthetic-corpus unit tests built with tmp_path, singleton tests that reset rag_engine._engine via monkeypatch, real-corpus ranking tests for the two canonical queries, a drift guard comparing app/backend/knowledge/ba-standards.md with docs/context/ba-standards.md, and a search() result-shape contract test standing in for the gap-analysis test) and app/backend/tests/test_rag_route.py (POST /api/rag/query: 200 shape, default and explicit top_k, 400 for blank, whitespace-only and missing query and for out-of-range top_k, 503 via patch('rag_engine.get_engine') with chunk_count=0). No existing test file or application file was modified. Tests have not been run; Task 17.3 set to In Progress, not Completed. Task 17.4 is left Pending: Claude performs the static cross-check during the audit and Benya marks it. Task 17.0 and Task 17.2 were marked Completed by Benya before this session.
