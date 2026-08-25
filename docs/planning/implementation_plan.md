# Implementation Plan: ABAA Phase 3 - Video/Audio-to-Transcript Pipeline

> **Status:** Draft
> **Created:** 2026-08-25
> **Author:** Architect
> **Requirements Source:** docs/context/PROJECT_CONTEXT.md (Phase 3 scope)

---

## Overview

Extend ABAA to accept video and audio files in addition to plain text transcripts. When a file is provided, extract the transcript via Groq's Whisper API, then pass it through the existing reqspec extraction pipeline. The frontend input area is repurposed to accept file drops alongside text paste. No UI/UX changes beyond minimum wiring required.

---

## Prerequisites

- [x] Phase 1/2 implementation complete and deployed
- [x] Groq API key available (VITE_GROQ_API_KEY)
- [x] Existing transcript processing pipeline functional
- [ ] Plan approved by stakeholder

---

## Testing Framework

- **Frontend:** Vitest (as per PROJECT_CONTEXT.md)
- **Note:** MediaRecorder/AudioContext and Groq fetch calls will be mocked in tests (via vi.mock or manual stubs). Tests validate branching logic, error handling, and state transitions rather than real media processing or live network calls.

---

## Tasks

<task id="6">
  <name>Client-Side File Type Detection</name>
  <objective>Add file type detection logic to the existing TranscriptForm component to distinguish between plain text, audio files, and video files</objective>
  <files>
    <modify>
      - app/frontend/src/components/TranscriptForm.jsx
    </modify>
    <create>
      - app/frontend/src/utils/fileDetection.js
    </create>
  </files>
  <tests>
    <test>File detection correctly identifies text input (Vitest)</test>
    <test>File detection correctly identifies audio file types (Vitest)</test>
    <test>File detection correctly identifies video file types (Vitest)</test>
    <test>File detection rejects unsupported file types (Vitest)</test>
  </tests>
  <acceptance_criteria>
    <criterion>Text input is identified as "text" type</criterion>
    <criterion>Audio files (.mp3, .wav, .m4a, .ogg, .flac) are identified as "audio" type</criterion>
    <criterion>Video files (.mp4, .mov, .avi, .mkv, .webm) are identified as "video" type</criterion>
    <criterion>Unsupported file types return appropriate error</criterion>
    <criterion>If a file is dropped while text is present, the pasted text must be cleared</criterion>
    <criterion>If text is typed/pasted while a file is loaded, the file must be cleared</criterion>
    <criterion>There must be a way for the user to reset back to an empty/neutral input state</criterion>
  </acceptance_criteria>
  <complexity>M</complexity>
  <dependencies>None</dependencies>
</task>

<task id="7">
  <name>Client-Side Video to Audio Extraction</name>
  <objective>Implement client-side audio extraction from video files using the native MediaRecorder API combined with AudioContext before sending to Groq</objective>
  <files>
    <modify>
      - app/frontend/src/components/TranscriptForm.jsx
    </modify>
    <create>
      - app/frontend/src/utils/videoToAudio.js
    </create>
  </files>
  <tests>
    <test>Video to audio extraction creates valid audio blob (Vitest, mocked)</test>
    <test>Extraction handles common video formats (Vitest, mocked)</test>
    <test>Extraction rejects invalid video input (Vitest, mocked)</test>
  </tests>
  <acceptance_criteria>
    <criterion>Video file is converted to audio blob using MediaRecorder + AudioContext</criterion>
    <criterion>Audio blob has correct MIME type for Groq</criterion>
    <criterion>Extraction fails gracefully for corrupted video files</criterion>
  </acceptance_criteria>
  <complexity>M</complexity>
  <dependencies>Task 6</dependencies>
</task>

<task id="8">
  <name>Groq API Integration for Transcription</name>
  <objective>Implement client-side call to Groq's Whisper API for audio transcription, handling the response and errors</objective>
  <files>
    <modify>
      - app/frontend/src/components/TranscriptForm.jsx
    </modify>
    <create>
      - app/frontend/src/api/transcription.js
    </create>
  </files>
  <tests>
    <test>Transcription API call succeeds with valid audio (Vitest, mocked)</test>
    <test>Transcription handles Groq API errors (Vitest, mocked)</test>
    <test>Transcription rejects unsupported audio formats (Vitest, mocked)</test>
    <test>Transcription handles file size limit errors (Vitest, mocked)</test>
  </tests>
  <acceptance_criteria>
    <criterion>Audio file is successfully transcribed to text</criterion>
    <criterion>Transcription errors return user-friendly messages</criterion>
    <criterion>Unsupported formats are rejected with clear error</criterion>
    <criterion>File size limit errors are handled gracefully</criterion>
    <criterion>Extracted/provided audio must be checked against 25MB ceiling client-side before any network call to Groq</criterion>
  </acceptance_criteria>
  <complexity>M</complexity>
  <dependencies>Task 7</dependencies>
</task>

<task id="9">
  <name>Pipeline Branching Logic Integration</name>
  <objective>Wire the three input branches (text, audio, video) into the existing state management flow so all paths converge at the reqspec extraction step</objective>
  <files>
    <modify>
      - app/frontend/src/components/TranscriptForm.jsx
    </modify>
  </files>
  <tests>
    <test>Text input follows existing pipeline (Vitest)</test>
    <test>Audio input goes through Groq transcription then existing pipeline (Vitest)</test>
    <test>Video input goes through video-to-audio, Groq transcription, then existing pipeline (Vitest)</test>
  </tests>
  <acceptance_criteria>
    <criterion>Text input produces same output as Phase 1/2 (unchanged behavior)</criterion>
    <criterion>Audio input produces transcript via Groq, then reqspec output</criterion>
    <criterion>Video input produces transcript via video→audio→Groq, then reqspec output</criterion>
    <criterion>All three paths converge at the same backend /api/analyze endpoint</criterion>
    <criterion>While transcription is in progress (video extraction and/or the Groq call), the UI must show a plain-text indication like "Transcribing..."</criterion>
  </acceptance_criteria>
  <complexity>M</complexity>
  <dependencies>Task 8</dependencies>
</task>

<task id="10">
  <name>Phase 3 Manual Verification Checklist</name>
  <objective>Create a documented manual verification checklist for human operators to validate the complete Phase 3 pipeline works end-to-end for all three input types</objective>
  <files>
    <create>
      - docs/verification/manual-verification-phase3.md
    </create>
  </files>
  <tests>
    <test>Manual checklist provides clear steps for verification</test>
    <test>Checklist includes sample inputs for all three types (text, audio, video)</test>
    <test>Checklist documents expected outputs and error scenarios</test>
  </tests>
  <acceptance_criteria>
    <criterion>Manual verification checklist is complete and actionable</criterion>
    <criterion>Text input produces all three outputs without errors</criterion>
    <criterion>Audio input produces all three outputs without errors</criterion>
    <criterion>Video input produces all three outputs without errors</criterion>
    <criterion>Requirements spec contains business requirements section</criterion>
    <criterion>Task breakdown contains numbered task list</criterion>
    <criterion>SOW contains scope, deliverables, and timeline sections</criterion>
    <criterion>Invalid/unsupported inputs return proper error messages</criterion>
  </acceptance_criteria>
  <complexity>S</complexity>
  <dependencies>Task 9</dependencies>
</task>

---

## Verification Plan

After all tasks complete:

- [ ] All unit tests pass (Vitest)
- [ ] Frontend components render properly
- [ ] All three input branches work correctly
- [ ] Manual verification checklist completed and validated
- [ ] Code review completed
- [ ] ACTIVE_CONTEXT.md updated
- [ ] Acceptance criteria verified

---

## Risks

| Risk   | Likelihood | Impact  | Mitigation |
|--------|------------|---------|------------|
| Groq free-tier rate limits (2,000 req/day) | M | H | Add user guidance for API key setup, implement client-side caching for identical files |
| Browser API limitations for video-to-audio extraction | M | M | Use MediaRecorder API with fallback, test across browsers |
| Vercel 4.5MB request body limit | L | M | Validate file size client-side before processing, show clear error for oversized files |
| CORS issues with Groq API | M | M | Verify CORS headers, use fetch with proper options |
| Unsupported audio/video formats | M | L | Document supported formats, validate MIME types client-side |

---

## Open Items

- [ ] Groq API key setup instructions for users
- [ ] Supported file format documentation
- [ ] File size limit guidance for users

---

## Approval

| Role        | Name              | Date       | Status   |
| ----------- | ----------------- | ---------- | -------- |
| Architect   | Benyamin Castillo | 2026-08-17 | Pending |
| Stakeholder | Benyamin Castillo | 2026-08-17 | Pending |

---

_Implementation Plan - ACE-Framework v2.3_
