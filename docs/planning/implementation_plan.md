# Implementation Plan: ABAA Phase 1 - Core Pipeline MVP

> **Status:** Draft
> **Created:** 2026-08-12
> **Author:** Architect
> **PRD Reference:** docs/requirements/PRD-001-core-pipeline.md

---

## Overview

Build the Core Pipeline MVP for ABAA (AI Business Analyst Assistant). This Phase 1 implementation enables a user to paste a client meeting transcript into a web interface and receive three AI-generated outputs: (1) a Markdown requirements/tech-spec document, (2) a coder-assignable task breakdown, and (3) a Statement of Work (SOW). The system uses OpenRouter's free-tier model (laguna-xs-2.1:free) for LLM processing, with a Python backend and React frontend. No database, authentication, or deployment infrastructure is included in this phase.

---

## Prerequisites

- [x] Requirements analyzed and understood
- [x] Relevant ADRs reviewed (none required for Phase 1)
- [ ] Dependencies identified (OpenRouter API key required)
- [ ] Environment ready (Node.js, Python 3.12, OpenRouter account)
- [ ] Plan approved by stakeholder

---

## Tasks

<task id="1">
  <name>Backend Scaffold with OpenRouter Integration</name>
  <objective>Backend server running with OpenRouter API integration, exposing a /api/analyze endpoint that accepts transcript text and returns structured analysis results</objective>
  <files>
    <create>
      - backend/app.py
      - backend/requirements.txt
      - backend/.env.example
    </create>
    <modify>
      - None (fresh scaffold)
    </modify>
  </files>
  <tests>
    <test>Backend server starts and responds to health check</test>
    <test>/api/analyze endpoint accepts POST with transcript and returns JSON</test>
    <test>OpenRouter API key is read from environment variable</test>
  </tests>
  <acceptance_criteria>
    <criterion>Python Flask/FastAPI server runs on localhost:5000</criterion>
    <criterion>POST /api/analyze with {"transcript": "text"} returns 200 with JSON response</criterion>
    <criterion>OpenRouter API calls succeed with valid API key</criterion>
    <criterion>Error handling returns simple JSON { "error": "message" } format</criterion>
  </acceptance_criteria>
  <complexity>M</complexity>
  <dependencies>None</dependencies>
</task>

<task id="2">
  <name>Frontend Scaffold with Transcript Input Form</name>
  <objective>React frontend with a textarea for transcript input and a submit button, connected to the backend /api/analyze endpoint</objective>
  <files>
    <create>
      - frontend/index.html
      - frontend/src/main.js
      - frontend/src/App.js
      - frontend/src/components/TranscriptForm.js
      - frontend/vite.config.js
      - frontend/package.json
      - frontend/tailwind.config.js
      - frontend/postcss.config.js
      - frontend/index.css
    </create>
    <modify>
      - None (fresh scaffold)
    </modify>
  </files>
  <tests>
    <test>Frontend dev server starts and loads App component</test>
    <test>TranscriptForm renders textarea and submit button</test>
    <test>Form submission triggers API call to backend</test>
  </tests>
  <acceptance_criteria>
    <criterion>Frontend runs on localhost:5173</criterion>
    <criterion>TranscriptForm accepts multiline text input</criterion>
    <criterion>Submit button triggers POST to /api/analyze</criterion>
    <criterion>Form shows loading state during API call</criterion>
  </acceptance_criteria>
  <complexity>M</complexity>
  <dependencies>Task 1</dependencies>
</task>

<task id="3">
  <name>LLM Prompt Engineering for Transcript Analysis</name>
  <objective>Create the prompt template and pipeline logic that transforms a raw transcript into the three required outputs: requirements spec, task breakdown, and SOW</objective>
  <files>
    <create>
      - backend/prompts/transcript_analysis.txt
      - backend/analysis_pipeline.py
    </create>
    <modify>
      - backend/app.py (add prompt loading and pipeline integration)
    </modify>
  </files>
  <tests>
    <test>Prompt template loads correctly from file</test>
    <test>Analysis pipeline processes transcript and returns structured output</test>
    <test>Output contains all three required sections (requirements, tasks, SOW)</test>
  </tests>
  <acceptance_criteria>
    <criterion>Transcript analysis prompt is well-formed for laguna-xs-2.1:free</criterion>
    <criterion>Pipeline returns structured JSON with requirements_spec, task_breakdown, and sow fields</criterion>
    <criterion>Each output section is valid Markdown</criterion>
  </acceptance_criteria>
  <complexity>L</complexity>
  <dependencies>Task 1</dependencies>
</task>

<task id="4">
  <name>Output Rendering in Frontend</name>
  <objective>Display the three AI-generated outputs (requirements spec, task breakdown, SOW) in the frontend with proper Markdown rendering and organized layout</objective>
  <files>
    <create>
      - frontend/src/components/RequirementsSpec.js
      - frontend/src/components/TaskBreakdown.js
      - frontend/src/components/StatementOfWork.js
      - frontend/src/components/OutputDisplay.js
    </create>
    <modify>
      - frontend/src/App.js (integrate output components)
      - frontend/src/components/TranscriptForm.js (handle response display)
    </modify>
  </files>
  <tests>
    <test>OutputDisplay renders all three output sections</test>
    <test>Markdown content is properly formatted</test>
    <test>Each output section has appropriate heading/label</test>
  </tests>
  <acceptance_criteria>
    <criterion>Three distinct output sections are visible after form submission</criterion>
    <criterion>Requirements spec displays as formatted Markdown</criterion>
    <criterion>Task breakdown shows structured list of tasks</criterion>
    <criterion>SOW displays as formatted document</criterion>
  </acceptance_criteria>
  <complexity>M</complexity>
  <dependencies>Task 2, Task 3</dependencies>
</task>

<task id="5">
  <name>Local End-to-End Smoke Test</name>
  <objective>Verify the complete pipeline works end-to-end: transcript input → backend processing → frontend display of all three outputs</objective>
  <files>
    <create>
      - tests/e2e/smoke.test.js
      - tests/e2e/sample-transcript.txt
    </create>
    <modify>
      - None (verification only)
    </modify>
  </files>
  <tests>
    <test>Full pipeline processes sample transcript and returns all three outputs</test>
    <test>Each output section contains expected content markers</test>
    <test>Error handling works for invalid transcript</test>
  </tests>
  <acceptance_criteria>
    <criterion>Sample transcript produces all three outputs without errors</criterion>
    <criterion>Requirements spec contains business requirements section</criterion>
    <criterion>Task breakdown contains numbered task list</criterion>
    <criterion>SOW contains scope, deliverables, and timeline sections</criterion>
    <criterion>Invalid input returns proper error message</criterion>
  </acceptance_criteria>
  <complexity>S</complexity>
  <dependencies>Task 4</dependencies>
</task>

---

## Verification Plan

After all tasks complete:

- [ ] All unit tests pass (Vitest)
- [ ] Backend API endpoints respond correctly
- [ ] Frontend components render properly
- [ ] End-to-end smoke test passes
- [ ] Code review completed
- [ ] Documentation updated (README.md)
- [ ] ACTIVE_CONTEXT.md updated
- [ ] Acceptance criteria verified

---

## Risks

| Risk   | Likelihood | Impact  | Mitigation |
|--------|------------|---------|------------|
| OpenRouter free-tier rate limits | M | H | Implement basic rate limiting, add user guidance for API key setup, cache responses for identical transcripts |
| laguna-xs-2.1:free output reliability | M | H | Add response validation, implement retry logic with exponential backoff, provide clear error messages when output is malformed |
| Model may not produce structured output consistently | M | M | Use explicit prompt formatting with clear section delimiters, validate output structure before returning, provide fallback parsing |
| No database means no persistence | L | M | Document that transcripts and outputs are ephemeral, consider localStorage for session persistence if needed |
| Plain JavaScript may lack type safety | L | M | Add runtime validation for API responses, use JSDoc for basic type documentation |
| Free-tier model may be slower | M | L | Add loading states, optimize prompt length, consider streaming if supported |

---

## Open Items

- [ ] OpenRouter API key setup instructions for users
- [ ] Error message wording for rate limit scenarios
- [ ] Whether to add localStorage persistence for transcripts (currently out of scope)
- [ ] Prompt template refinement based on initial test runs

---

## Approval

| Role        | Name | Date | Status |
| ----------- | ---- | ---- | ------ |
| Architect   |      |      |        |
| Stakeholder |      |      |        |

---

_Implementation Plan - ACE-Framework v2.3_
