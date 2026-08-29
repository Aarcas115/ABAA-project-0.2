# Task 7 Result: Client-Side Video to Audio Extraction

> **Plan Reference:** docs/planning/implementation_plan.md
> **Task ID:** 7
> **Status:** COMPLETE
> **Date Completed:** 2026-08-29

---

## Objective

Implement client-side extraction of an audio track from a user-uploaded
video file, producing an audio Blob that Task 8 can hand off to Groq's
Whisper API for transcription. This is the second task of Phase 3
(Video/Audio-to-Transcript Pipeline), building directly on Task 6's file
type detection. Per the locked Phase 3 architecture, extraction must use
only native browser APIs (MediaRecorder + AudioContext) — no ffmpeg.wasm
or other third-party media processing library. The Groq API call itself
and the 25MB size check on the extracted audio are explicitly out of
scope for this task (Task 8).

---

## Scope Delivered

- `app/frontend/src/utils/videoToAudio.js` — new utility exporting
  `async videoToAudio(videoFile)`. Loads the video into an off-DOM
  `<video>` element, routes its audio track through an `AudioContext`
  graph (`MediaElementSourceNode` → `MediaStreamAudioDestinationNode`),
  and uses `MediaRecorder` to capture the stream into a Blob once the
  video's `'ended'` event fires. Prefers `'audio/webm;codecs=opus'`,
  falling back to plain `'audio/webm'`. A 10-second timeout is armed
  unconditionally so extraction can never hang silently; rejects
  descriptively on video load errors, timeout, or playback failure.
- `app/frontend/src/components/TranscriptForm.jsx` — wired
  `videoToAudio` in, gated strictly to `type === 'video'` so text and
  audio inputs are unaffected. Added `isExtracting` state to disable
  form controls mid-extraction, routed errors through the existing
  Task 6 error-display pattern, and ensured the form is fully resettable
  after a failed extraction.
- `app/frontend/src/utils/videoToAudio.test.js` — new Vitest suite
  covering the 3 scenarios specified in `implementation_plan.md`: valid
  blob creation (both MIME paths), format-agnostic behavior across
  mp4/webm/quicktime input, and graceful rejection on error/timeout.
  `MediaRecorder`, `AudioContext`, and `MediaStream` are fully mocked,
  since none exist natively in Vitest's jsdom environment.
- `docs/planning/task_checklist.md` and `docs/context/ACTIVE_CONTEXT.md`
  — fully overwritten/updated to reflect Task 7's 6 subtasks (7.0-7.5),
  all closed, with Task 8 queued as the next objective.

---

## Session Breakdown

Work followed the Architect → Developer BMAD pattern, split across
several small, targeted Aider sessions with manual review between each,
consistent with prior tasks:

| Session | Scope |
|---|---|
| Architect | Rewrote `task_checklist.md` (Task 7, subtasks 7.0-7.5) and updated `ACTIVE_CONTEXT.md` from the locked Task 7 architecture in `implementation_plan.md` |
| Corrective fix 1 | Fabricated subtask count (Pending: 7 vs. actual 6) in both files — hand-corrected |
| Developer 1 | Implemented Task 7.0 (design decision) and 7.1 — created `videoToAudio.js` |
| Corrective fix 2 | Deadlock bug and false-positive stall rejection in `videoToAudio.js` (see below) |
| Developer 2 | Implemented Task 7.2 and 7.3 — wired extraction into `TranscriptForm.jsx`, error handling |
| Corrective fix 3 | Checklist wording overstated test coverage; flagged a stale deferred-validation note |
| Developer 3 (attempt 1) | Task 7.4 test-writing session stalled in an Aider narration loop, never executing the test runner |
| Developer 3 (attempt 2) | Re-scoped: Aider writes tests only, human runs `npm run test` separately and reports real output |
| Corrective fixes 4-8 | Five rounds of mock-infrastructure debugging to get the test suite genuinely passing (see below) |
| Documentation closeout | Marked Task 7.4/7.5 complete in `task_checklist.md` with real 7/7 results; updated `ACTIVE_CONTEXT.md` for the Task 7 → Task 8 transition |

---

## Problems Encountered & Solutions Implemented

Manual review — not trusting Aider's self-reported completions —
surfaced the following issues:

1. **Fabricated progress count.** Both `task_checklist.md`'s Progress
   Summary and its `ACTIVE_CONTEXT.md` note claimed 7 subtasks for a
   task that only has 6 (7.0-7.5). **Fixed** by hand-correcting both
   counts to 6.

2. **Deadlock in `videoToAudio.js`.** The original implementation set
   `video.src = videoUrl` *inside* the `'loadstart'` event handler — but
   `'loadstart'` only fires in response to `src` being assigned,
   creating a circular dependency where the returned Promise would hang
   forever with no timeout ever armed. **Fixed** by moving the `src`
   assignment out to run immediately, switching the setup trigger to
   `'loadedmetadata'`, and arming the 10-second timeout unconditionally
   before assignment.

3. **False-positive stall rejection.** A `'waiting'` event listener
   treated any momentary buffering pause — normal behavior during
   playback — as a hard failure, which would have wrongly rejected valid
   videos that briefly stutter while decoding. **Fixed** by removing the
   listener entirely; the timeout alone now guards against genuinely
   stuck playback.

4. **Checklist overstated test coverage.** A Task 7.3 subtask was
   checked off as "Test error handling with invalid video input" when
   only manual/code-level verification had occurred — no automated test
   existed at that point (that's Task 7.4's job). **Fixed** by
   rewording the subtask to accurately describe manual verification
   without changing its completed status, since the underlying check
   genuinely happened.

5. **Aider narration loop.** The first Task 7.4 attempt got stuck
   repeating "Let me run this and capture the output" without ever
   invoking the test runner, consistent with the project's standing
   distrust of Aider's self-reported progress. **Fixed** by re-scoping
   the session so Aider only writes the test file and is explicitly told
   not to attempt running anything; the human runs
   `npm run test -- --run` directly and reports real output back.

6. **`document.querySelector('video')` returning `null`.** The video
   element created inside `videoToAudio.js` is intentionally off-DOM by
   design (never appended to the document), so a test's DOM query for it
   could never succeed — causing all 7 tests to fail identically.
   **Fixed** by spying on `document.createElement` to capture the actual
   video element reference directly, rather than querying for it.

7. **Infinite recursion in the `createElement` spy.** The spy's own
   mock implementation called `document.createElement` again to get the
   real element — but that call landed on the spy itself, recursing
   forever and corrupting its internal call tracking. **Fixed** by
   capturing the real original implementation via
   `document.createElement.bind(document)` *before* installing the spy,
   and calling that captured reference inside the mock. A leftover
   reference to an undeclared `originalHTMLVideoElement` variable in
   `afterEach` (from an earlier, since-removed mock class) was also
   removed in the same pass — it was throwing a `ReferenceError` on
   every test's cleanup.

8. **`MediaStream is not defined`.** The `AudioContext` mock's
   `createMediaStreamDestination()` tried to instantiate a real
   `MediaStream`, a browser API jsdom doesn't implement at all.
   **Fixed** by returning a plain mock object instead, since
   `MediaRecorder`'s mock never inspects the stream's internals.

9. **`dataavailable` event shape mismatch.** The mock wrapped the audio
   payload in a `CustomEvent`'s `.detail` property, but `videoToAudio.js`
   reads `event.data` directly, matching the real browser
   `MediaRecorder` API. **Fixed** by dispatching a plain object shaped
   like the real event instead of a DOM `CustomEvent`.

10. **MIME-type test false pass.** The default `isTypeSupported` mock
    returned `true` for every MIME type string, so the "plain
    `audio/webm`" test silently inherited the higher-priority
    `audio/webm;codecs=opus` path instead of exercising the fallback
    logic it claimed to test. **Fixed** by narrowing that specific
    test's mock to report only `audio/webm` as supported, forcing the
    intended code path.

No bugs were found in `videoToAudio.js`'s design or `TranscriptForm.jsx`'s
integration logic after corrective fix 2 — fixes 6 through 10 were all
isolated to the test file's mock infrastructure, not the application code.

---

## Verification

- **Automated tests:** Final real test run
  (`npm run test -- --run videoToAudio.test.js`) confirmed 0 failures:
  - `videoToAudio.test.js` — 7 tests across 3 scenario groups (valid blob
    creation, format-agnostic handling, graceful rejection)
  - **Total: 7/7 passing.**
- **Code review:** `TranscriptForm.jsx`'s Task 7.2/7.3 integration was
  re-confirmed by reading the code (not re-tested): extraction gated to
  `type === 'video'` only, errors surfaced via the existing Task 6
  error-display pattern, form resettable after failure.
- **Acceptance criteria:** All 3 acceptance criteria for Task 7 in
  `implementation_plan.md` — audio blob produced via MediaRecorder +
  AudioContext, correct MIME type for Groq, graceful failure on
  corrupted video — confirmed met via the tests above.

---

## Time Invested

- Architect rewrite of `task_checklist.md`/`ACTIVE_CONTEXT.md` for
  Task 7: 1 short session, plus 1 hand-correction for the count bug
- Task 7.0/7.1 implementation: 1 Developer session
- Corrective fix for the deadlock and false-positive-stall bugs:
  1 follow-up session
- Task 7.2/7.3 implementation: 1 Developer session
- Corrective fix for checklist wording: 1 short follow-up
- Task 7.4 test-writing: 1 stalled attempt (narration loop) + 1
  successful re-scoped attempt
- Test-suite debugging: 5 corrective rounds, each isolating and fixing
  one distinct mock-infrastructure bug, run and reported by the human
  operator each time
- Documentation closeout (7.4/7.5 checklist entries, `ACTIVE_CONTEXT.md`
  Task 8 transition): 2 short sessions

---

## Next Steps

- **Task 7: COMPLETE.**
- Task 8 (Groq Whisper transcription integration) is next up for
  Architect-stage planning. Its acceptance criteria must include the
  25MB size check on the *extracted audio blob* — deferred from both
  Task 6 (on the source video) and Task 7 (on the extraction output) —
  before any network call to Groq.
- The full styled "Transcribing..." progress UI remains deferred to
  Task 9/Phase 4; Task 7 only required the underlying extraction
  mechanism to exist and fail gracefully.
