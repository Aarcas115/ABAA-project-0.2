# Task Checklist: Task 6 - Client-Side File Type Detection

> **Plan Reference:** docs/planning/implementation_plan.md
> **Task ID:** 6
> **Last Updated:** 2026-08-25
> **Current Role:** Architect
> **Mode:** PLANNING

---

## Progress Summary

| Status | Count |
|--------|-------|
| Completed | 0 |
| In Progress | 0 |
| Pending | 11 |
| Blocked | 0 |

---

## Tasks

### Task 6.0: Decide file detection approach and structure
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Determine detection method (MIME type check, file extension check, or both)
- [ ] Define how "text" input is distinguished as default/fallback case
- [ ] Document the chosen approach in Notes

**Notes:** Will use MIME type check as primary method with file extension as fallback. Text input is the default when no file is provided.

---

### Task 6.1: Draft/implement fileDetection.js utility
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Create app/frontend/src/utils/fileDetection.js
- [ ] Implement detectFileType function
- [ ] Define supported audio MIME types and extensions
- [ ] Define supported video MIME types and extensions
- [ ] Add clear documentation for the utility

**Notes:** Utility will export a detectFileType function that returns 'text', 'audio', 'video', or throws an error for unsupported types.

---

### Task 6.2: Wire detection into TranscriptForm.jsx
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Import fileDetection utility in TranscriptForm.jsx
- [ ] Add file input handler to detect file type on drop/select
- [ ] Update state management to track input type (text/audio/video)
- [ ] Clear transcript when file is dropped (mutual exclusivity)
- [ ] Clear file when text is typed (mutual exclusivity)

**Notes:** TranscriptForm will manage three states: text-only, audio-file, video-file. Switching between them clears the other.

---

### Task 6.3: Implement audio type detection
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Verify audio files (.mp3, .wav, .m4a, .ogg, .flac) are identified as "audio" type
- [ ] Test with various audio file formats
- [ ] Document supported audio formats

**Notes:** Audio detection must handle common formats: mp3, wav, m4a, ogg, flac.

---

### Task 6.4: Implement video type detection
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Verify video files (.mp4, .mov, .avi, .mkv, .webm) are identified as "video" type
- [ ] Test with various video file formats
- [ ] Document supported video formats

**Notes:** Video detection must handle common formats: mp4, mov, avi, mkv, webm.

---

### Task 6.5: Implement unsupported type rejection
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Verify unsupported file types return appropriate error
- [ ] Display user-friendly error message for rejected files
- [ ] Prevent submission of unsupported file types

**Notes:** Unsupported files should be rejected with clear error message before any processing.

---

### Task 6.6: Implement mutual exclusivity/clear-on-switch behavior
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Verify text input is cleared when file is dropped
- [ ] Verify file is cleared when text is typed/pasted
- [ ] Test edge cases (rapid switching, empty states)

**Notes:** Only one input type can be active at a time. Switching clears the other.

---

### Task 6.7: Implement reset control
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Add UI control to reset back to empty/neutral state
- [ ] Verify reset clears both text and file inputs
- [ ] Test reset functionality

**Notes:** Users need a way to clear all input and start fresh.

---

### Task 6.8: Write Vitest tests for file detection
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Test file detection correctly identifies text input
- [ ] Test file detection correctly identifies audio file types
- [ ] Test file detection correctly identifies video file types
- [ ] Test file detection rejects unsupported file types

**Notes:** Tests will be in app/frontend/src/utils/fileDetection.test.js

---

### Task 6.9: Cross-check finished work against acceptance criteria
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Verify text input is identified as "text" type
- [ ] Verify audio files are identified as "audio" type
- [ ] Verify video files are identified as "video" type
- [ ] Verify unsupported file types return appropriate error
- [ ] Verify text input is cleared when file is dropped
- [ ] Verify file is cleared when text is typed/pasted
- [ ] Verify there is a way to reset to empty state
- [ ] Document any discrepancies found

**Notes:** All acceptance criteria from implementation_plan.md Task 6 must be verified before marking complete.

---

## Blockers

None

---

## Notes

- Task 6 is the first task of Phase 3 (Video/Audio-to-Transcript Pipeline)
- This checklist was authored by the Architect during the PLANNING phase
- All subtasks are currently pending and await Developer-mode execution
- Task 7 (Client-Side Video to Audio Extraction) depends on Task 6 completion
- Phase 1 and Phase 2 are both complete and deployed to Vercel
