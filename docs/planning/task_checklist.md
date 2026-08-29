# Task Checklist: Task 8 - Groq API Integration for Transcription

> **Plan Reference:** docs/planning/implementation_plan.md
> **Task ID:** 8
> **Last Updated:** 2026-08-29
> **Current Role:** Developer
> **Mode:** EXECUTION

---

## Progress Summary

| Status | Count |
|--------|-------|
| Completed | 4 |
| In Progress | 1 |
| Pending | 1 |
| Blocked | 0 |

---

## Tasks

### Task 8.0: Decide Groq transcription API integration approach
- **Status:** [x] Completed

**Subtasks:**
- [x] Determine Groq Whisper API endpoint and authentication method
- [x] Define request format (multipart/form-data with audio blob)
- [x] Select appropriate model for transcription
- [x] Design response parsing strategy
- [x] Determine where the 25MB pre-flight size check lives in the call flow

**Notes:** Design decisions locked in:
- Endpoint: https://api.groq.com/openai/v1/audio/transcriptions
- Model: whisper-large-v3-turbo
- Auth: Bearer token via Authorization header with VITE_GROQ_API_KEY
- Request format: multipart/form-data with FormData (file, model, response_format fields)
- Response parsing: { text: "..." } on success, normalized Error on failure
- 25MB pre-flight size check implemented inside transcription.js function, before fetch call

---

### Task 8.1: Create app/frontend/src/api/transcription.js with transcription call function
- **Status:** [x] Completed

**Subtasks:**
- [x] Create transcription.js file in app/frontend/src/api/
- [x] Implement function to call Groq Whisper API
- [x] Handle request formatting (multipart/form-data)
- [x] Add proper error handling for API responses
- [x] Document the function and its parameters

**Notes:** Created transcription.js with:
- JSDoc header documenting all design decisions
- Exported transcribeAudio(audioBlob) function
- Pre-flight 25MB size check before any network call
- FormData payload construction with file, model, response_format
- Fetch POST request with Bearer token authorization
- Success returns transcribed text string
- Errors throw normalized Error objects with clear messages
- Network errors handled with user-friendly messages
- Post-review fix: removed unreachable error-branch dead code and added filename fallback for FormData blob uploads (required for video-extracted audio, which lacks a filename).

---

### Task 8.2: Wire transcription.js into TranscriptForm.jsx
- **Status:** [x] Completed

**Subtasks:**
- [x] Import transcription function in TranscriptForm.jsx
- [x] Call transcription function for audio input
- [x] Call transcription function for video input after videoToAudio extraction (reference Task 7's extractedAudio state)
- [x] Update state management for transcription progress
- [x] Handle transcription results appropriately

**Notes:** Wired transcription.js into TranscriptForm.jsx:
- Added import for transcribeAudio from '../api/transcription'
- Added new isTranscribing state (separate from isExtracting for video extraction phase)
- Video branch: after videoToAudio succeeds, immediately calls transcribeAudio on the extracted blob, then onResult({ transcript: <result text> })
- Audio branch: replaced pass-through with actual transcribeAudio call, onResult({ transcript: <result text> })
- Both branches use try/catch/finally to manage isTranscribing state and surface errors via setError
- Removed stale "(Task 8)" comment from audio branch
- All three paths now converge on unified onResult({ transcript }) shape

---

### Task 8.3: Implement error handling
- **Status:** [x] Completed

**Subtasks:**
- [x] Handle Groq API errors (401, 429, 500, etc.)
- [x] Implement unsupported audio format rejection
- [x] Handle file size limit errors
- [x] Implement 25MB client-side ceiling check before any network call (explicitly close out the item deferred from Task 7.3)
- [x] Display user-friendly error messages

**Notes:** Error handling implemented:
- Reused existing error state and red-banner UI for all error display
- Video extraction failures: setError(err.message) from videoToAudio catch block
- Transcription failures: setError(err.message) from transcribeAudio catch block
- Groq API errors: transcribeAudio throws normalized Error with clear messages
- Unsupported format rejection: detectFileType throws, caught in handleFileChange, setError(err.message)
- Size limit errors: handled in handleFileChange for audio files, setError('File size exceeds 25MB limit')
- No duplicate client-side size check added in TranscriptForm - transcribeAudio already enforces 25MB ceiling before network call for both direct audio and video-extracted audio paths

---

### Task 8.4: Write Vitest tests (mocked)
- **Status:** [ ] In Progress

**Subtasks:**
- [x] Test successful transcription
- [x] Test Groq API error handling
- [x] Test unsupported format rejection
- [x] Test file size limit handling
- [x] Test video extraction + transcription end-to-end
- [x] Test extraction failure short-circuit
- [x] Test transcription failure after extraction
- [x] Test all three paths converge on same shape
- [x] Test Reset clears error and restores button state

**Notes:** Fixed three issues in TranscriptForm.test.jsx:
1. **Mock leakage fix:** Replaced all `vi.clearAllMocks()` calls in beforeEach/afterEach hooks with `vi.resetAllMocks()` across all describe blocks. Root cause: `clearAllMocks()` does not clear queued `mockResolvedValueOnce`/`mockRejectedValueOnce`/`mockReturnValueOnce` values that were never consumed, causing leftover mock behavior from one test to leak into the next.
2. **Test 4 relocation:** Moved the file size limit error test from the Audio Path block to the Video Path block, renaming it to "4b. File size limit error on video-extracted audio". Rewrote to mock `videoToAudio.mockResolvedValueOnce(smallBlob)` then `transcribeAudio.mockRejectedValueOnce(sizeError)`, since the audio-file-upload path is already gated by `handleFileChange`'s size check and this is the only path where `transcribeAudio`'s internal size check is reachable.
3. **Test 8 assertion fix:** Removed unused `fetch.mockResolvedValueOnce` and `mockResponse` from the text-path portion of the convergence test, and changed the assertion from expecting `{ requirements_spec, task_breakdown, sow }` to expecting `{ transcript: transcriptText }`, matching the actual text-path behavior of the component.
4. **Test 8 stale DOM reference fix:** In the video-path section of Test 8, re-queried the file input fresh after cleanup() + render() instead of reusing the stale fileInput reference from the audio-path section.
5. **Test 8 mock leakage fix:** Changed inline `vi.clearAllMocks()` to `vi.resetAllMocks()` in the video-path section of Test 8 for consistency with the beforeEach/afterEach hooks.

**Outstanding Issue:** 4 pre-existing, unrelated test failures in the top-level 'TranscriptForm' describe block (tests for fetch/'/api/analyze') remain unresolved. These tests are explicitly out of scope for this task and require a decision on where /api/analyze logic now lives.

---

### Task 8.5: Cross-check finished work against acceptance criteria
- **Status:** [ ] Pending

**Subtasks:**
- [ ] Verify audio file is successfully transcribed to text
- [ ] Verify transcription errors return user-friendly messages
- [ ] Verify unsupported formats are rejected with clear error
- [ ] Verify file size limit errors are handled gracefully
- [ ] Verify 25MB client-side audio-blob size check against Groq's ceiling before any network call

**Notes:** Not yet started.

---

## Blockers

None

---

## Notes

- Task 8 planning phase complete. All subtasks identified and documented.
- The 25MB audio-blob size validation against Groq's ceiling, deferred from Task 7.3, is explicitly included in Task 8.3 and 8.5.
- Task 8.4 fixes applied: mock-leakage via resetAllMocks, Test 4 relocation to video path, Test 8 assertion correction, Test 8 stale DOM reference fix, Test 8 inline mock reset fix.
- 4 legacy tests in top-level 'TranscriptForm' block remain unresolved pending architectural decision.
