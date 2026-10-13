# Task 11 Result: BA Standards Research & Reference Doc

> **Plan Reference:** docs/planning/implementation_plan.md
> **Task ID:** 11
> **Completed:** 2026-09-03
> **Result file written:** 2026-10-13 (retroactively, after Task 17)
> **Authored by:** Claude (result summary). The research and drafting of the deliverable were done manually outside Aider.

---

## Outcome

`docs/context/ba-standards.md` was created and is the canonical BA reference for Phase 4. It was written by hand rather than through Aider, because the Developer role should not generate BA domain content. Tasks 16 (gap analysis), 17 (RAG layer) and 18 (classification and confidence) depend on it, and Task 17 has since put it into the live pipeline.

## What the document contains

| Section | Content |
|---------|---------|
| Requirement Classification (incl. 1.2 "Working taxonomy for ABAA (five categories)") | BABOK's four-level schema, plus the five working categories ABAA classifies into: functional, non-functional, data, interface, connectivity |
| Gherkin | Given/When/Then syntax with ABAA-domain examples |
| 3. Quality Criteria for Individual Requirements (IEEE 830) | The 8-characteristic quality table; the Complete, Unambiguous, Verifiable and Traceable criteria are the confidence-scoring rubric for Task 18 |
| Application to the Phase 4 pipeline | Maps the above to Tasks 16 and 18 |

## Acceptance criteria

| Criterion | Result |
|-----------|--------|
| Covers functional, non-functional, data, interface and connectivity types | Met (all five types in the taxonomy) |
| Includes Gherkin Given/When/Then examples | Met |
| Placed in `docs/context/` | Met |
| Structured for easy lookup by downstream tasks (plan test) | Met, and confirmed in use: the Task 17 chunker splits it on its headings |

## Evidence

- Verified at completion on 2026-09-03 (recorded in `ACTIVE_CONTEXT.md`): all three acceptance criteria checked, taxonomy covers all five types.
- Later confirmation through Task 17: with the real corpus loaded, the query "requirement types functional non-functional data interface connectivity" returns the "1.2 Working taxonomy" chunk first, and "confidence scoring complete unambiguous verifiable traceable" returns the "3. Quality Criteria" chunk first. This held in the pytest run (60 passed), on the local server and on the deployed backend.
- A pytest drift test guards the runtime copy at `app/backend/knowledge/ba-standards.md`, which must stay identical to this file after CRLF normalization. Edit the `docs/context/` file first and then re-copy it, or that test fails.

## Notes

- The `ACTIVE_CONTEXT.md` note for this task says "BABOK's four-level schema", where an earlier version said "BABOK schema". The wording drift came from a later Aider session and is cosmetic.
- This file was written from the plan, `ACTIVE_CONTEXT.md` and the Task 17 evidence, not from a fresh read of `ba-standards.md`. Check the section table above against the real headings.

## Next

Task 12: Multi-Field Input Form Structure. Task 16 (gap analysis) and Task 18 (classified requirements) later build on this document through the RAG layer.
