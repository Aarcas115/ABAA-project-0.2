# Task Checklist: Task 3 - LLM Prompt Engineering for Transcript Analysis

> **Plan Reference:** docs/planning/implementation_plan.md
> **Task ID:** 3
> **Last Updated:** 2026-08-12
> **Current Role:** Developer
> **Mode:** EXECUTION

---

## Progress Summary

| Status | Count |
|--------|-------|
| Completed | 1 |
| In Progress | 0 |
| Pending | 15 |
| Blocked | 0 |

---

## Tasks

### Task 3.1: Create app/backend/prompts/transcript_analysis.txt
- **Status:** [x] Completed

**Subtasks:**
- [x] Create prompts directory under app/backend/
- [x] Create transcript_analysis.txt with well-formed prompt for laguna-xs-2.1:free
- [x] Include clear section delimiters for requirements_spec, task_breakdown, and sow
- [x] Add instructions for Markdown formatting in each section
- [x] Verify prompt file is valid and readable

**Notes:**
- Prompt was revised to reference PRD-template.md, TECH_SPEC-template.md, and SOW-template.md structures instead of generic bullet-point instructions

---

### Task 3.2: Create app/backend/analysis_pipeline.py
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Create analysis_pipeline.py module
- [ ] Implement load_prompt() function to read transcript_analysis.txt
- [ ] Implement call_openrouter() function with proper API integration
- [ ] Implement parse_response() function to extract three sections from LLM output
- [ ] Implement analyze_transcript() main pipeline function
- [ ] Add timeout handling for API calls
- [ ] Add retry logic with exponential backoff
- [ ] Verify analysis_pipeline.py imports and functions correctly

**Notes:**

---

### Task 3.3: Modify app/backend/app.py to integrate pipeline
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Import analysis_pipeline module in app.py
- [ ] Replace stub logic in analyze_transcript endpoint with actual pipeline call
- [ ] Pass transcript to analysis_pipeline.analyze_transcript()
- [ ] Return structured JSON with requirements_spec, task_breakdown, and sow fields
- [ ] Handle pipeline exceptions and return proper error format
- [ ] Verify endpoint still passes existing tests

**Notes:**

---

### Task 3.4: Write pytest for prompt template loading
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Create test for prompt template loading from file
- [ ] Test that prompt contains required section delimiters
- [ ] Test that prompt is properly formatted for laguna-xs-2.1:free
- [ ] Verify test passes

**Notes:**

---

### Task 3.5: Write pytest for analysis pipeline processing
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Create test for pipeline processing with mocked OpenRouter response
- [ ] Test that pipeline returns structured output with all three fields
- [ ] Test that each output section is valid Markdown
- [ ] Verify test passes

**Notes:**

---

### Task 3.6: Write pytest for output structure validation
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Create test verifying output contains requirements_spec field
- [ ] Create test verifying output contains task_breakdown field
- [ ] Create test verifying output contains sow field
- [ ] Verify all tests pass

**Notes:**

---

### Task 3.7: Implement OpenRouter API call with laguna-xs-2.1:free
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Configure OpenRouter API endpoint URL
- [ ] Set model to openrouter/poolside/laguna-xs-2.1:free
- [ ] Add proper headers (Authorization, Content-Type)
- [ ] Format request body with model, messages, and max_tokens
- [ ] Add timeout configuration (default 30 seconds)
- [ ] Verify API call structure is correct

**Notes:**

---

### Task 3.8: Implement error handling for OpenRouter API
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Handle HTTP errors (4xx, 5xx responses)
- [ ] Handle timeout errors
- [ ] Handle malformed response errors
- [ ] Handle rate limit errors with proper error messages
- [ ] Return simple JSON { "error": "message" } format
- [ ] Verify error handling works correctly

**Notes:**

---

### Task 3.9: Implement response parsing for three outputs
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Parse LLM response to extract requirements_spec section
- [ ] Parse LLM response to extract task_breakdown section
- [ ] Parse LLM response to extract sow section
- [ ] Handle malformed or missing sections gracefully
- [ ] Validate each section is valid Markdown
- [ ] Verify parsing works with expected response format

**Notes:**

---

### Task 3.10: Add retry logic with exponential backoff
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Implement retry counter in pipeline
- [ ] Add exponential backoff delay (1s, 2s, 4s)
- [ ] Set max retries (3 attempts)
- [ ] Handle rate limit responses with retry-after header
- [ ] Verify retry logic works correctly

**Notes:**

---

### Task 3.11: Write integration test for full pipeline
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Create test for full pipeline with mocked OpenRouter response
- [ ] Test that transcript produces all three outputs
- [ ] Test error handling with mocked error responses
- [ ] Verify test passes

**Notes:**

---

### Task 3.12: Verify all acceptance criteria
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Verify prompt is well-formed for laguna-xs-2.1:free
- [ ] Verify pipeline returns structured JSON with all three fields
- [ ] Verify each output section is valid Markdown
- [ ] Verify OpenRouter API calls succeed with valid API key
- [ ] Verify error handling returns simple JSON format

**Notes:**

---

### Task 3.13: Run all pytest tests
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Run pytest on all backend tests
- [ ] Verify all tests pass
- [ ] Document test results

**Notes:**

---

### Task 3.14: Update .env.example with OpenRouter configuration
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Add OPENROUTER_API_KEY to .env.example
- [ ] Add OPENROUTER_MODEL to .env.example
- [ ] Add OPENROUTER_TIMEOUT to .env.example
- [ ] Verify .env.example is properly formatted

**Notes:**

---

### Task 3.15: Add environment variable support for configuration
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Read OPENROUTER_MODEL from environment (default to laguna-xs-2.1:free)
- [ ] Read OPENROUTER_TIMEOUT from environment (default to 30)
- [ ] Verify environment variables are read correctly

**Notes:**

---

### Task 3.16: Document API key setup instructions
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Add comment in .env.example with OpenRouter API key setup instructions
- [ ] Document where to obtain OpenRouter API key
- [ ] Verify documentation is clear

**Notes:**

---

## Blockers

None

---

## Notes

- Task 3 replaces the stub implementation in /api/analyze with real OpenRouter API calls
- Must use openrouter/poolside/laguna-xs-2.1:free model (free tier)
- Tests should mock OpenRouter responses, not make real API calls
- Error handling must return simple JSON { "error": "message" } format per PROJECT_CONTEXT.md
- All code uses Python 3.12 per PROJECT_CONTEXT.md, matching Task 1's backend conventions.
