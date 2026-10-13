# Task Checklist: Task 17 - RAG Layer for BA Best Practices

> **Plan Reference:** docs/planning/implementation_plan.md
> **Task ID:** 17
> **Last Updated:** 2026-10-11
> **Current Role:** Developer
> **Mode:** IMPLEMENTATION

---

## Progress Summary

| Status | Count |
|--------|-------|
| Completed | 3 |
| In Progress | 1 |
| Pending | 2 |
| Blocked | 0 |

---

## Task Constraints

- Stateless: no database, no vector store, no embeddings, no persisted index file
- Python standard library only; app/backend/requirements.txt is not modified
- Retrieval is in-memory TF-IDF over a small static corpus (formula in Task 17.1)
- Corpus lives in app/backend/knowledge/ (same pattern as app/backend/prompts/, resolved with Path(__file__).parent) because only files inside app/backend are deployed to the backend's Vercel function
- Corpus files: ba-sources.txt and ba-standards.md. The ba-standards.md in app/backend/knowledge/ is a byte-identical runtime copy of docs/context/ba-standards.md; the docs/context copy stays canonical for humans
- ba-sources.txt contains paraphrased/summarized notes only, never verbatim text from BA reference books
- Established backend conventions to follow: routes live under /api/; errors are raised as HTTPException(status_code=..., detail={"error": "message"}) and are handled by the existing global handlers; request validation failures already return 400 {"error": "Validation error"}; modules are imported as modules (import rag_engine, like import analysis_pipeline); Python files use snake_case
- Files that must NOT be modified: app/backend/analysis_pipeline.py, app/backend/prompts/, app/backend/requirements.txt, app/backend/vercel.json, app/backend/tests/test_app.py, app/backend/tests/test_analysis_pipeline.py. In app/backend/app.py only additive edits are allowed
- The existing 27 backend tests (21 in test_analysis_pipeline.py, 6 in test_app.py) must keep passing
- Free-tier only across the stack

---

## Tasks

### Task 17.0: Put the runtime corpus in place (Benya, manual — Aider cannot run commands)
- **Status:** [x] Completed

**Subtasks:**
- [ ] Create the folder app/backend/knowledge/
- [ ] Copy docs/context/ba-standards.md to app/backend/knowledge/ba-standards.md unchanged
- [ ] Place ba-sources.txt at app/backend/knowledge/ba-sources.txt (content is authored outside Aider, same precedent as Task 11; the Developer role must not generate BA content for it)
- [ ] ba-sources.txt format: plain text, one "## Topic Title" heading per section, sections separated by a blank line, roughly 80-200 words each, using the same heading convention as ba-standards.md so one chunker handles both files
- [ ] ba-sources.txt topics are elicitation-focused and must NOT duplicate the taxonomy, Gherkin, or IEEE 830 content already in ba-standards.md: spotting missing information in meeting transcripts; clarifying-question patterns and rationale phrasing; ambiguity signal words; capturing assumptions, constraints and dependencies; non-functional requirement prompting; data requirement prompting; interface and integration prompting; connectivity prompting; stakeholder and role identification; basic prioritization
- [ ] ba-sources.txt content is paraphrased/summarized only

**Notes:** Task 16 (gap analysis) will draw its clarifying-question patterns from ba-sources.txt, which is why the topics target gap detection rather than taxonomy. This task must be done before Task 17.3 tests can use the real corpus.

### Task 17.1: Implement app/backend/rag_engine.py
- **Status:** [x] Completed

**Subtasks:**
- [x] Constants: CORPUS_DIR = Path(__file__).parent / "knowledge" and CORPUS_FILES = ("ba-sources.txt", "ba-standards.md")
- [x] class RagEngine whose __init__ takes a list of file paths (so tests can build an engine from tmp_path files) and exposes a chunk_count attribute
- [x] Loading: read each file as UTF-8; a missing or unreadable file is skipped and logged with the logging module; loading never raises
- [x] Chunker: split on lines that start with 1-3 "#" characters followed by a space; ignore such lines inside triple-backtick fenced blocks; use splitlines() so Windows CRLF files chunk identically to LF files; each chunk keeps source (file name), heading (text without the leading #), and text (body); drop chunks whose body is empty (for example a heading immediately followed by a subheading); ignore any text before the first heading
- [x] Tokenizer: lowercase, re.findall(r"[a-z0-9]+"), remove words from a small built-in stopword set
- [x] Index built once at load: each chunk is tokenized from its heading plus body; idf = ln((N + 1) / (df + 1)) + 1 where N is the chunk count and df is the number of chunks containing the term
- [x] search(query, top_k=3, source=None): score = sum over the unique query tokens present in the chunk of (1 + ln(tf)) * idf, divided by sqrt(total token count of the chunk); exclude chunks with score 0; sort by score descending with corpus order as tie-break; return a list of dicts with keys source, heading, text, score (score rounded to 4 decimals); a blank or stopword-only query returns an empty list; the source argument filters by exact file name
- [x] get_engine(): lazy module-level singleton stored in a module variable named _engine (initially None), built from CORPUS_DIR and CORPUS_FILES on first call
- [x] Module docstring states that Task 16 (gap analysis) and Task 18 (classification and confidence) will call search()

**Notes:** The plan's risk table says to start simple. Do not add stemming, caching, embeddings, or extra public functions. Design was prototyped against the real ba-standards.md: the query "requirement types functional non-functional data interface connectivity" ranks the "1.2 Working taxonomy" chunk first and "confidence scoring complete unambiguous verifiable traceable" ranks the "3. Quality Criteria" chunk first.

### Task 17.2: Wire rag_engine into app/backend/app.py (additive edits only)
- **Status:** [x] In Progress

**Subtasks:**
- [x] Add import rag_engine next to import analysis_pipeline, and change the pydantic import to also import Field
- [x] After the existing OPENROUTER_API_KEY startup check, add a module-level call rag_engine.get_engine() so the corpus loads at cold start; this call must not raise; do not use FastAPI startup or lifespan events
- [x] Add a request model RagQueryRequest(BaseModel) with query: str and top_k: int = Field(default=3, ge=1, le=10)
- [x] Add POST /api/rag/query after the /api/analyze endpoint. A blank or whitespace-only query raises HTTPException 400 with detail {"error": "Query field is required and must be non-empty"}. The handler calls rag_engine.get_engine() on every request (so tests can patch it); if the engine's chunk_count is 0 it raises HTTPException 503 with detail {"error": "RAG corpus is unavailable"}; otherwise it returns {"results": engine.search(query, top_k)}
- [x] Missing query, wrong types, and top_k outside 1-10 are already handled by the existing RequestValidationError handler (400 {"error": "Validation error"}); do not add a new handler
- [x] Do not change existing routes, CORS config, exception handlers, or the API key check

**Notes:** This satisfies the acceptance criterion "RAG module is called from a live API route in app.py". The route also lets Benya confirm on the deployed backend that the corpus files shipped (a 503 there means they did not).

### Task 17.3: Write pytest tests (new files only)
- **Status:** [x] In Progress

**Subtasks:**
- [ ] Create app/backend/tests/test_rag_engine.py and app/backend/tests/test_rag_route.py; do not edit any existing test file
- [ ] test_rag_engine.py, synthetic corpus built with tmp_path: both files load and results carry the right source and heading; the chunker ignores "#" lines inside triple-backtick fences; heading-only sections are dropped; a CRLF file chunks the same as an LF file; a targeted query returns the expected chunk first; top_k is respected; the source filter works; blank and stopword-only queries return an empty list; zero-score chunks are excluded; a missing file is skipped without raising and the remaining files stay searchable; with all files missing chunk_count is 0 and search returns an empty list
- [ ] test_rag_engine.py, singleton: get_engine() returns the same object on repeated calls; any test that touches the singleton resets it with monkeypatch.setattr(rag_engine, "_engine", None) so state does not leak between tests
- [ ] test_rag_engine.py, real corpus (reset the singleton first): searching with source="ba-sources.txt" and source="ba-standards.md" each return results for the query "requirement"; the query "requirement types functional non-functional data interface connectivity" returns, within its top 3 results, a ba-standards.md chunk whose heading contains "Working taxonomy"; the query "confidence scoring complete unambiguous verifiable traceable" returns, within its top 3 results, a ba-standards.md chunk whose heading contains "Quality Criteria"
- [ ] test_rag_engine.py, drift guard: app/backend/knowledge/ba-standards.md equals docs/context/ba-standards.md after normalizing CRLF to LF; the repo root is Path(__file__).resolve().parents[3]
- [ ] test_rag_engine.py, interface contract: every search result has keys source, heading, text (all str) and score (float). This stands in for the plan test "Gap analysis queries RAG for context when needed", because gap_analysis.py does not exist until Task 16. Do not create gap_analysis.py
- [ ] test_rag_route.py: use the same client fixture style as tests/test_app.py (from app import app as fastapi_app, TestClient); tests cover 200 with a results list of the expected keys, default top_k returns at most 3 results, top_k=1 returns at most 1, blank query returns 400 with an "error" key, whitespace-only query returns 400, missing query returns 400, top_k=0 and top_k=11 return 400, and 503 with an "error" key when patch('rag_engine.get_engine') returns a MagicMock with chunk_count=0
- [ ] No test-run commands in this task or in any prompt

**Notes:** Benya runs pytest and pastes real terminal output; nothing here is marked complete on Aider's word.

### Task 17.4: Cross-check against Task 17 acceptance criteria (static review)
- **Status:** [ ] Pending

**Subtasks:**
- [ ] RAG engine loads BA source documents at startup (cold-start warm-up in app.py)
- [ ] Gap analysis can query RAG for relevant best practices (search() and the route)
- [ ] RAG module is called from a live API route in app.py
- [ ] Corpus includes ba-standards.md alongside ba-sources.txt and its taxonomy and IEEE 830 rubric content is retrievable
- [ ] Corpus files live inside app/backend/ and a drift test guards the ba-standards.md copy
- [ ] All Task Constraints above are respected, and the only files changed are: app/backend/rag_engine.py (new), app/backend/app.py (additive), the two new test files, and the two corpus files

**Notes:** This is a static review of the files on disk. Do not claim tests pass.

### Task 17.5: Manual verification (Benya)
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Run the full backend pytest suite from app/backend (existing 27 plus the new tests) and paste the real terminal output
- [ ] Run the backend locally via py -3.12 -m uvicorn, POST both canonical queries to /api/rag/query, and confirm the expected ba-standards.md chunks come back
- [ ] After deploying the backend to Vercel, POST the same query to https://abba-backend.vercel.app/api/rag/query: 200 with results confirms the corpus shipped, 503 means it did not
- [ ] Smoke-check that GET / and POST /api/analyze still behave as before

**Notes:** Only Benya marks these complete, after real terminal output has been reviewed. Suggested commit grouping: corpus files, backend code, tests, planning docs as separate commits.
