# Task 17 Result: RAG Layer for BA Best Practices

> **Plan Reference:** docs/planning/implementation_plan.md
> **Date:** 2026-10-13
> **Authored by:** Claude (audit and evidence). Code and tests written by Aider; verification run by Benya.

---

## Outcome

Task 17 is complete and verified locally and on the deployed backend. A stateless, standard-library-only RAG layer now serves BA best-practice chunks from `POST /api/rag/query`. Tasks 16 and 18 can call `rag_engine.search()` directly.

## What was built

| Piece | File | Notes |
|-------|------|-------|
| Corpus | `app/backend/knowledge/ba-sources.txt` | 10 elicitation-focused sections, paraphrased only, authored by Claude outside Aider |
| Corpus | `app/backend/knowledge/ba-standards.md` | Byte-identical runtime copy of `docs/context/ba-standards.md` (the docs copy stays canonical) |
| Engine | `app/backend/rag_engine.py` | Heading-based chunker (1-3 `#`, fence-aware, CRLF-safe), in-memory TF-IDF, `RagEngine`, lazy `get_engine()` singleton |
| Wiring | `app/backend/app.py` | Additive only: cold-start warm-up, `RagQueryRequest`, `POST /api/rag/query` |
| Tests | `app/backend/tests/test_rag_engine.py` | 21 tests incl. real-corpus ranking and drift guard |
| Tests | `app/backend/tests/test_rag_route.py` | 12 collected items |

Scoring: `idf = ln((N+1)/(df+1)) + 1`; `score = sum over distinct query tokens of (1 + ln(tf)) * idf`, divided by `sqrt(chunk token count)`; rounded to 4 decimals; stable sort.

Route behavior: 400 for a blank query, 503 when the corpus is empty, otherwise `{"results": [{source, heading, text, score}, ...]}`. Missing fields and `top_k` outside 1-10 fall through to the existing validation handler (400 `{"error": "Validation error"}`).

## Verification evidence

- **Backend pytest (Benya, real output):** 60 passed = 27 existing + 21 engine + 12 route. Output saved as test_results.txt.
- **Local route check (uvicorn):** query "requirement types functional non-functional data interface connectivity" returned "1.2 Working taxonomy for ABAA (five categories)" first; query "confidence scoring complete unambiguous verifiable traceable" returned "3. Quality Criteria for Individual Requirements (IEEE 830)" first.
- **Deployed route check:** `POST https://abba-backend.vercel.app/api/rag/query` returned 200 with "1.2 Working taxonomy for ABAA (five categories)" first. The corpus shipped with the function.
- **Smoke checks:** `GET /` returned `healthy` (local). `POST /api/analyze` on the deployed backend returned 200 with a `requirements_spec` starting "## Problem Statement" (the screenshot showed that field only).
- **Static review (Task 17.4):** `git status --short` showed exactly the expected files: `rag_engine.py`, `app.py` (additive), the two new test files, and `knowledge/`, plus planning docs. None of the protected files (`analysis_pipeline.py`, `prompts/`, `requirements.txt`, `vercel.json`, `test_app.py`, `test_analysis_pipeline.py`) were modified.

## Deployment note

The Vercel project `abba-backend` is **not connected to git**. Its production deployment is updated only with `vercel --prod` from `app/backend`. After pushing the Task 17 commits, the deployed route returned 404 (`{"detail":"Not Found"}`, FastAPI's default for a missing route) until `vercel --prod` was run. Remember this for every future backend change.

## Deviations and cleanup

- Plan amended by hand: corpus moved from `docs/context/` to `app/backend/knowledge/` because only files inside `app/backend` are deployed; a pytest drift test guards the `ba-standards.md` copy.
- Aider's Group 3 session deleted one Task 17.4 subtask and removed five `---` separators in `ACTIVE_CONTEXT.md`. A corrective prompt in the same session restored both; a diff confirmed nothing else moved.
- A stray `docs/context/test_results.txt` (pytest output) should not be committed to `docs/context/`.
- Minor wording drifts from earlier Aider sessions were left as is: "Free-tier only across the stack" (was "across entire stack") and "BABOK's four-level schema" (was "BABOK schema").
- `implementation_plan.md` line 218 may still lack its leading "- " (flagged earlier, not confirmed fixed).

## Next

Task 12: Multi-Field Input Form Structure (UI chain, Tasks 12-15), then Tasks 16 and 18, which depend on this RAG layer.
