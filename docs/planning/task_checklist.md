# Task Checklist: Backend Scaffold with OpenRouter Integration

> **Plan Reference:** docs/planning/implementation_plan.md
> **Task ID:** 1
> **Last Updated:** 2026-08-12
> **Current Role:** Developer

---

## Progress Summary

| Status | Count |
|--------|-------|
| Completed | 0 |
| In Progress | 0 |
| Pending | 9 |
| Blocked | 0 |

---

## Tasks

### Task 1.1: Create app/backend/requirements.txt
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Create app/backend/requirements.txt with fastapi, uvicorn, python-dotenv, httpx dependencies
- [ ] Verify pip install works with the requirements file

**Notes:**

---

### Task 1.2: Create app/backend/.env.example
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Create app/backend/.env.example with OPENROUTER_API_KEY placeholder
- [ ] Add .env to .gitignore (if not already there)

**Notes:**

---

### Task 1.3: Scaffold app/backend/app.py with FastAPI instance
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Create app/backend/app.py with FastAPI app instance
- [ ] Add root endpoint for health check
- [ ] Configure CORS for frontend communication

**Notes:**

---

### Task 1.4: Implement /api/analyze route
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Create POST /api/analyze endpoint accepting JSON body with "transcript" field
- [ ] Add request validation for transcript field
- [ ] Return a placeholder JSON response (e.g., {"requirements_spec": "stub", "task_breakdown": "stub", "sow": "stub"}) — real analysis output is added in Task 3, not here

**Notes:**
- This endpoint will return stub data initially; the actual LLM-powered analysis pipeline is implemented in Task 3

---

### Task 1.5: Wire up environment variable loading for OpenRouter key
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Load OPENROUTER_API_KEY from environment using python-dotenv
- [ ] Add validation to ensure API key is present at startup
- [ ] Store API key in a way that can be accessed by the analysis pipeline

**Notes:**

---

### Task 1.6: Write pytest test for backend server health check
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Create tests in app/backend/tests/test_app.py
- [ ] Write test that starts the FastAPI test client and checks health endpoint
- [ ] Verify test passes

**Notes:**

---

### Task 1.7: Write pytest test for /api/analyze endpoint
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Write test that POSTs to /api/analyze with valid transcript
- [ ] Verify response is 200 with JSON structure
- [ ] Verify test passes

**Notes:**

---

### Task 1.8: Write pytest test for OpenRouter API key loading
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Write test that verifies OPENROUTER_API_KEY is loaded from environment
- [ ] Write test that handles missing API key gracefully
- [ ] Verify tests pass

**Notes:**

---

### Task 1.9: Verify acceptance criteria
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Verify Python FastAPI server runs on localhost:8000
- [ ] Verify POST /api/analyze with {"transcript": "text"} returns 200 with JSON response
- [ ] Verify OpenRouter API calls succeed with valid API key
- [ ] Verify error handling returns simple JSON { "error": "message" } format

**Notes:**

---

## Blockers

| Task | Blocker | Resolution | Status |
|------|---------|------------|--------|
|      |         |            |        |

---

## Notes

[Any notes discovered during implementation that should inform future tasks]

---

*Task Checklist - ACE-Framework v2.3*
