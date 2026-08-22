# Task 3 Result: LLM Pipeline Integration

> **Task Reference:** docs/planning/task_checklist.md, Task 3
> **Date Completed:** 2026-08-21
> **Role:** Developer
> **Status:** COMPLETE — all 16 subtasks verified

---

## Summary

Task 3 replaced the stubbed `/api/analyze` endpoint with a real LLM-powered pipeline that turns a client transcript into three structured outputs (requirements/tech spec, task breakdown, SOW) via OpenRouter's free-tier `poolside/laguna-xs-2.1:free` model. This included the prompt template, the `analysis_pipeline.py` module (`load_prompt`, `call_openrouter`, `parse_response`, `analyze_transcript`), full error/retry handling, a 21-test pytest suite for the pipeline, environment configuration, setup documentation, and final end-to-end verification.

---

## What Was Built

- **Prompt template** (`app/backend/prompts/transcript_analysis.txt`) — revised four times to reach reliable literal-delimiter compliance from the model.
- **`analysis_pipeline.py`** — four core functions, two custom exceptions (`OpenRouterError`, `OpenRouterRateLimitError`).
- **Retry logic** — exponential backoff (1s/2s/4s, max 3 retries) scoped strictly to 429 responses, with a fail-fast path when `X-RateLimit-Reset` indicates daily-quota exhaustion (wait >10s) rather than a transient limit.
- **`app.py` integration** — real pipeline call replacing the stub, with a three-tier exception mapping: `OpenRouterRateLimitError` → 429, `OpenRouterError` → 500, generic `Exception` → 500.
- **Test suite** — 21 tests in `test_analysis_pipeline.py` covering all four functions, fully mocked (zero real API calls), plus updates to the pre-existing `test_app.py` (6 tests) to bring the full backend suite to 27/27 passing.
- **Configuration** — `.env.example` with `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_TIMEOUT`; setup guide at `docs/setup/openrouter_setup.md`.

---

## Bugs Found and Fixed During This Task

1. **Prompt delimiter substitution** — the model substituted Markdown headers (e.g. `### Requirements Specification`) for the required literal delimiter strings (`===REQUIREMENTS_SPEC===`), causing `parse_response()` to silently return empty sections. Fixed via prompt revision 4: explicit before/after examples and end-of-prompt reinforcement of the exact literal strings required.

2. **`#`-character content-dropping bug** — a `"#" in content` check in `parse_response()` was silently discarding valid section content that happened to contain a `#` character (e.g. Markdown headers inside a section). Fixed; now guarded by a regression test.

3. **Retry metadata nesting** — `X-RateLimit-Reset` was being read from `error_data["metadata"]["headers"]`, but the real OpenRouter 429 response nests this inside `error_data["error"]["metadata"]["headers"]`. Fixed and covered by tests using the real captured response shape.

4. **Inconsistent exception hierarchy** — `call_openrouter()` was catching `requests.exceptions.Timeout` and `requests.exceptions.ConnectionError` and re-raising them as the built-in `RuntimeError` instead of the custom `OpenRouterError`. This meant these two failure modes bypassed the intended exception hierarchy (though they still happened to map to 500 via the generic `Exception` catch-all in `app.py`, so the user-facing behavior was accidentally correct). Fixed by raising `OpenRouterError` consistently; found and corrected on 2026-08-21 while writing the pytest suite.

5. **Stale stub-content test assertion** — `test_app.py`'s `test_analyze_returns_200_with_valid_transcript` still asserted `data["requirements_spec"] == "stub"`, a leftover from before the real pipeline was wired in (Task 3.3). Updated to assert structure/type/non-empty content instead, and to mock `analysis_pipeline.analyze_transcript` rather than hitting the real API.

6. **`load_dotenv()` re-reading real `.env` during a "missing key" test** — `test_missing_api_key_raises_valueerror` used `monkeypatch.delenv` to simulate a missing API key, but `app.py`'s unconditional `load_dotenv()` call re-populated the environment variable straight from the real `.env` file on re-import, defeating the test. This only surfaced once a real `.env` file existed locally. Fixed by also mocking `dotenv.load_dotenv` to a no-op for the duration of that test.

7. **Module/instance import collision breaking the shared test fixture** — fixing bug #6 required changing `test_app.py`'s top-level import to a bare `import app` (needed for `sys.modules` manipulation), which inadvertently changed what the local name `app` referred to — from the FastAPI instance to the whole module — breaking `TestClient(app)` for every other test in the file. Fixed by introducing a distinctly-named import, `from app import app as fastapi_app`, decoupling the fixture's needs from the reimport test's needs.

---

## Verification

- **Unit/integration tests:** `pytest app/backend -v` → 27 passed, 0 failed.
- **Real end-to-end confirmation (2026-08-21):** Started local server (`uvicorn app:app --reload`), sent a real POST request to `/api/analyze` with a valid `OPENROUTER_API_KEY` and the transcript "Client wants a login page with email and password." Response returned HTTP 200 with all three fields populated with real, non-empty content:
  - `requirements_spec`: 1921 characters
  - `task_breakdown`: 2497 characters
  - `sow`: 3654 characters

All five acceptance criteria for Task 3.12 are met.

---

## Time Invested

- Prompt engineering and revisions (Task 3.1): ~4 sessions
- Pipeline implementation (Task 3.2, 3.3, 3.7–3.10): multiple sessions across error handling and retry logic
- Test suite authoring and debugging (Task 3.4–3.6, 3.11, 3.13): 1 extended session, including 7 real bugs found and fixed
- Configuration and documentation (Task 3.14–3.16): 1 session
- Final verification (Task 3.12): 1 short session

---

## Next Steps

- Task 4: Wire frontend to the now-complete backend pipeline
- Task 5: Final integration and manual QA pass
- Phase 2 planning: Render deployment (frontend static site + backend web service)
