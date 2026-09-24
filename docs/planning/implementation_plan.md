# Implementation Plan: ABAA Phase 4 — UI/UX Polish & Requirements Engineering Upgrade

> **Status:** Draft
> **Created:** 2026-09-03
> **Author:** Architect
> **Requirements Source:** Stakeholder requirements (John + Benya), docs/context/PROJECT_CONTEXT.md

---

## Overview

Phase 4 extends ABAA with enhanced business-analysis rigor and a complete UI/UX overhaul. The implementation introduces a multi-field input form with drag-and-drop support, dynamic loading states, and a new light theme. On the requirements side, we add a gap-analysis stage that queries users for missing information before generating classified requirements with confidence indices. An internal RAG layer provides BA best-practice context for the analysis.

---

## Prerequisites

- [x] Phase 3 implementation complete and verified
- [x] Groq API key available (VITE_GROQ_API_KEY)
- [x] OpenRouter integration functional
- [ ] Plan approved by stakeholder

---

## Testing Framework

- **Frontend:** Vitest (as per PROJECT_CONTEXT.md)
- **Backend:** pytest (as per PROJECT_CONTEXT.md) — Tasks 16, 17, and 18 involve backend Python changes and must be tested with pytest
- **Note:** All new components and utilities will be tested with mocked API calls and DOM APIs. Tests validate branching logic, error handling, state transitions, and UI rendering.

---

## Tasks

<task id="11">
  <name>BA Standards Research & Reference Doc</name>
  <objective>Research BA industry-standard requirement types and Gherkin language, creating a reference document for subsequent tasks</objective>
  <files>
    <create>
      - docs/context/ba-standards.md
    </create>
  </files>
  <tests>
    <test>Reference document contains requirement type taxonomy (functional, non-functional, data, interface, connectivity)</test>
    <test>Reference document includes Gherkin syntax examples</test>
    <test>Reference document is structured for easy lookup by downstream tasks</test>
  </tests>
  <acceptance_criteria>
    <criterion>Document covers functional, non-functional, data, interface, and connectivity requirement types</criterion>
    <criterion>Document includes Gherkin Given/When/Then syntax examples</criterion>
    <criterion>Document is placed in docs/context/ for easy reference</criterion>
  </acceptance_criteria>
  <complexity>S</complexity>
  <dependencies>None</dependencies>
</task>

<task id="12">
  <name>Multi-Field Input Form Structure</name>
  <objective>Create the new input form with Client/Company, Meeting/Project Title, Date & Time, Participants, Meeting Reason, and Transcript fields with drag-and-drop support</objective>
  <files>
    <modify>
      - app/frontend/src/components/TranscriptForm.jsx
    </modify>
    <create>
      - app/frontend/src/components/MultiFieldInputForm.jsx
    </create>
  </files>
  <tests>
    <test>Form renders all required input fields</test>
    <test>Form handles drag-and-drop file input</test>
    <test>Form validates required fields before submission</test>
    <test>Participants field supports adding/removing entries</test>
  </tests>
  <acceptance_criteria>
    <criterion>Client/Company name field present and validated</criterion>
    <criterion>Meeting/Project Title field present and validated</criterion>
    <criterion>Date & Time field with HH:MM format validation</criterion>
    <criterion>Repeatable "Add Participant" with name and job title fields</criterion>
    <criterion>Meeting Reason free-text field present</criterion>
    <criterion>Transcript area supports text paste and single file upload</criterion>
    <criterion>Drag-and-drop file input works for audio/video files</criterion>
  </acceptance_criteria>
  <complexity>M</complexity>
  <dependencies>None</dependencies>
</task>

<task id="13">
  <name>Dynamic Loading State Screen</name>
  <objective>Replace static loading text with dynamic stage-based status reflecting actual pipeline progress</objective>
  <files>
    <modify>
      - app/frontend/src/components/TranscriptForm.jsx
    </modify>
    <create>
      - app/frontend/src/components/LoadingState.jsx
    </create>
  </files>
  <tests>
    <test>Loading state displays correct stage text during audio extraction</test>
    <test>Loading state displays correct stage text during transcription</test>
    <test>Loading state displays correct stage text during analysis</test>
    <test>Loading state displays correct stage text during document generation</test>
    <test>Passed-in values echo card displays correctly</test>
  </tests>
  <acceptance_criteria>
    <criterion>Loading text changes to "Extracting audio..." during video processing</criterion>
    <criterion>Loading text changes to "Transcribing..." during Groq API call</criterion>
    <criterion>Loading text changes to "Analyzing transcript..." during LLM processing</criterion>
    <criterion>Loading text changes to "Generating documents..." during output creation</criterion>
    <criterion>Echo card displays all passed-in metadata values</criterion>
  </acceptance_criteria>
  <complexity>S</complexity>
  <dependencies>Task 12</dependencies>
</task>

<task id="14">
  <name>Checkpoint-Based Progress Indicator</name>
  <objective>Implement visual progress indicator for client-side stages (audio extraction, transcription) with indeterminate spinner for backend LLM step</objective>
  <files>
    <modify>
      - app/frontend/src/components/TranscriptForm.jsx
    </modify>
    <create>
      - app/frontend/src/components/ProgressIndicator.jsx
    </create>
  </files>
  <tests>
    <test>Progress indicator shows correct step for audio extraction</test>
    <test>Progress indicator shows correct step for transcription</test>
    <test>Progress indicator shows indeterminate state for LLM generation</test>
    <test>Progress indicator updates correctly on state changes</test>
  </tests>
  <acceptance_criteria>
    <criterion>Text input: no progress indicator needed (goes straight to backend LLM step)</criterion>
    <criterion>Audio input: single-stage progress (transcription only)</criterion>
    <criterion>Video input: two-stage progress (extraction at 25%, transcription at 50%)</criterion>
    <criterion>Progress indicator visually connects to loading state text</criterion>
  </acceptance_criteria>
  <complexity>M</complexity>
  <dependencies>Task 13</dependencies>
</task>

<task id="15">
  <name>Light Theme Implementation</name>
  <objective>Restructure the application from dark theme to light theme using the specified color palette</objective>
  <files>
    <modify>
      - app/frontend/src/index.css
    </modify>
    <modify>
      - app/frontend/tailwind.config.js
    </modify>
  </files>
  <tests>
    <test>Light theme colors are applied correctly to background</test>
    <test>Accent colors (#97dffc, #858ae3, #613dc1, #4e148c, #2c0735) are used for highlights</test>
    <test>Text remains readable on light background</test>
    <test>Dark accent sidebar/header renders correctly</test>
  </tests>
  <acceptance_criteria>
    <criterion>Main background uses light color (#ffffff or similar)</criterion>
    <criterion>Accent colors from palette are used for cards, buttons, highlights</criterion>
    <criterion>Dark sidebar or header with colorful accents is implemented</criterion>
    <criterion>Text colors ensure readability on light background</criterion>
  </acceptance_criteria>
  <complexity>M</complexity>
  <dependencies>Task 14</dependencies>
</task>

<task id="16">
  <name>Gap-Analysis Stage Implementation</name>
  <objective>Implement the gap-analysis stage that identifies missing information and presents clarifying questions to users</objective>
  <files>
    <modify>
      - app/frontend/src/components/TranscriptForm.jsx
    </modify>
    <create>
      - app/frontend/src/components/GapAnalysisQuestions.jsx
    </create>
    <create>
      - app/backend/gap_analysis.py
    </create>
    <modify>
      - app/backend/app.py
    </modify>
  </files>
  <tests>
    <test>Gap analysis identifies missing data sources in transcript</test>
    <test>Questions are presented with rationale text</test>
    <test>User can select pre-written options</test>
    <test>User can provide free-text custom answers</test>
    <test>User can mark items as "revisit later"</test>
  </tests>
  <acceptance_criteria>
    <criterion>System scans transcript for missing information markers</criterion>
    <criterion>Each question includes a short rationale explaining why info is needed</criterion>
    <criterion>Pre-written clickable options are presented for each question</criterion>
    <criterion>Free-text input opens when user selects "Other" or similar option</criterion>
    <criterion>User can mark question as "revisit later" to skip</criterion>
    <criterion>Gap analysis module is called from a live API route in app.py</criterion>
    <criterion>Clarifying questions and missing-information detection are informed by the requirement taxonomy retrieved via the RAG layer (Task 17), not hardcoded independently of ba-standards.md</criterion>
  </acceptance_criteria>
  <complexity>L</complexity>
  <dependencies>Task 11, Task 17</dependencies>
</task>

<task id="17">
  <name>RAG Layer for BA Best Practices</name>
  <objective>Implement internal RAG layer that consults BA best-practice sources during gap-analysis. The RAG implementation must stay within the "no database" hard constraint — using static in-memory/keyword-based retrieval over pre-loaded text rather than a vector database or persistent embeddings store. rag_engine.py loads BOTH docs/context/ba-sources.txt AND docs/context/ba-standards.md as its corpus — ba-standards.md supplies the requirement-type taxonomy and IEEE 830 confidence-scoring rubric that Tasks 16 and 18 need at runtime.</objective>
  <files>
    <create>
      - app/backend/rag_engine.py
    </create>
    <create>
      - docs/context/ba-sources.txt
    </create>
    <modify>
      - app/backend/app.py
    </modify>
  </files>
  <tests>
    <test>RAG engine retrieves relevant BA best-practice snippets</test>
    <test>Gap analysis queries RAG for context when needed</test>
  </tests>
  <acceptance_criteria>
    <criterion>RAG engine loads BA source documents at startup</criterion>
    <criterion>Gap analysis can query RAG for relevant best practices</criterion>
    <criterion>RAG module is called from a live API route in app.py</criterion>
    <criterion>RAG engine's corpus includes docs/context/ba-standards.md alongside ba-sources.txt, and its taxonomy/rubric content is retrievable by the gap-analysis and classification steps</criterion>
  </acceptance_criteria>
  <complexity>L</complexity>
  <dependencies>Task 11</dependencies>
</task>

<task id="18">
  <name>Classified Requirements Generation</name>
  <objective>Generate requirements classified by type (from BA standards research) with confidence/reliability indices</objective>
  <files>
    <modify>
      - app/backend/analysis_pipeline.py
    </modify>
    <modify>
      - app/backend/app.py
    </modify>
  </files>
  <tests>
    <test>Requirements are classified by type (functional, non-functional, data, interface, connectivity)</test>
    <test>Each requirement has a confidence index attached</test>
    <test>Confidence index reflects completeness of underlying information</test>
    <test>Low-confidence requirements are flagged appropriately</test>
  </tests>
  <acceptance_criteria>
    <criterion>Requirements are tagged with type from taxonomy (functional, non-functional, data, interface, connectivity)</criterion>
    <criterion>Each requirement has confidence score (0-100%)</criterion>
    <criterion>Requirements with missing dependencies show <50% confidence</criterion>
    <criterion>Confidence index is visible in output document</criterion>
    <criterion>Classified requirements module is called from a live API route in app.py</criterion>
    <criterion>Confidence scoring applies the IEEE 830 rubric (Complete, Unambiguous, Verifiable, Traceable) retrieved via the RAG layer (Task 17), consistent with docs/context/ba-standards.md Section 3</criterion>
  </acceptance_criteria>
  <complexity>M</complexity>
  <dependencies>Task 16, Task 17</dependencies>
</task>

<task id="19">
  <name>General Polish Pass</name>
  <objective>Refine visual details (spacing, type scale, component consistency) without altering functionality</objective>
  <files>
    <modify>
      - app/frontend/src/index.css
    </modify>
    <modify>
      - app/frontend/tailwind.config.js
    </modify>
    <modify>
      - app/frontend/src/components/*.jsx
    </modify>
  </files>
  <tests>
    <test>Visual spacing is consistent across components</test>
    <test>Type scale follows design system</test>
    <test>Component styling is consistent</test>
  </tests>
  <acceptance_criteria>
    <criterion>Spacing between elements is consistent (margins, padding)</criterion>
    <criterion>Typography follows a clear hierarchy (headings, body, captions)</criterion>
    <criterion>All components use consistent styling patterns</criterion>
    <criterion>No visual regressions from previous tasks</criterion>
  </acceptance_criteria>
  <complexity>S</complexity>
  <dependencies>Task 15, Task 16, Task 17, Task 18</dependencies>
</task>

<task id="20">
  <name>Phase 4 Manual Verification Checklist</name>
  <objective>Create documented manual verification checklist for Phase 4 pipeline</objective>
  <files>
    <create>
      - docs/verification/manual-verification-phase4.md
    </create>
  </files>
  <tests>
    <test>Manual checklist provides clear steps for verification</test>
    <test>Checklist includes sample inputs for all new features</test>
    <test>Checklist documents expected outputs and error scenarios</test>
  </tests>
  <acceptance_criteria>
    <criterion>Manual verification checklist is complete and actionable</criterion>
    <criterion>Multi-field form inputs produce correct requirements</criterion>
    <criterion>Gap-analysis questions appear and can be answered</criterion>
    <criterion>Requirements are classified by type with confidence indices</criterion>
    <criterion>Light theme is applied correctly</criterion>
    <criterion>Progress indicator shows correct stages</criterion>
    <criterion>Invalid inputs return proper error messages</criterion>
  </acceptance_criteria>
  <complexity>S</complexity>
  <dependencies>Task 19</dependencies>
</task>

---

## Verification Plan

After all tasks complete:

- [ ] All unit tests pass (Vitest)
- [ ] Frontend components render properly in light theme
- [ ] Multi-field input form works correctly
- [ ] Gap-analysis stage functions as expected
- [ ] Requirements are classified with confidence indices
- [ ] Progress indicator updates correctly
- [ ] Manual verification checklist completed and validated
- [ ] Code review completed
- [ ] ACTIVE_CONTEXT.md updated
- [ ] Acceptance criteria verified

---

## Risks

| Risk   | Likelihood | Impact  | Mitigation |
|--------|------------|---------|------------|
| RAG layer complexity | M | M | Build incrementally: start with simple keyword/TF-IDF retrieval over the small combined corpus (ba-sources.txt + ba-standards.md), expand only if needed |
| Gap-analysis accuracy | M | H | Start with simple pattern matching, iterate based on feedback |
| Theme redesign breaking existing styles | M | M | Thorough visual regression testing, incremental rollout |
| Free-tier API limits with additional stages | L | M | Monitor usage, implement client-side caching |
| Confidence index accuracy | M | L | Base on clear information completeness metrics |
| RAG implementation conflicts with stateless/no-DB constraint | M | M | Constrain to in-memory keyword retrieval, no vector DB |

---

## Open Items

- [ ] Stakeholder approval on Phase 4 scope
- [ ] Definition of "missing information" patterns for gap-analysis
- [ ] BA source documents for RAG layer
- [ ] docs/context/ba-sources.txt must contain paraphrased/summarized best-practice notes only — never verbatim copyrighted text from BA reference books
- [ ] **OUT OF SCOPE for Phase 4**: Re-running pipeline on new transcript to append to existing project requirements (candidate for future phase)
- [ ] Execution order for Phase 4: Task 17 (RAG layer) is built immediately after Task 11, before Tasks 12-15 (UI chain), since Task 17 now blocks both Task 16 and Task 18 and carries the highest complexity (L) of the remaining tasks. Tasks 12-15 have no dependency on Task 17 and can proceed in any order relative to it, but this project sequences Task 17 first to de-risk the highest-complexity item early.

---

## Approval

| Role        | Name              | Date       | Status   |
| ----------- | ----------------- | ---------- | -------- |
| Architect   | Benyamin Castillo | 2026-09-03 | Pending |
| Stakeholder | Benyamin Castillo | 2026-09-03 | Pending |

---

_Implementation Plan - ACE-Framework v2.3_
