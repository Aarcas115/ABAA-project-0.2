# Manual Verification Checklist: ABAA Phase 3 - Video/Audio-to-Transcript Pipeline

## Prerequisites

- [x] OPENROUTER_API_KEY environment variable must be set
- [x] VITE_GROQ_API_KEY environment variable must be set (for audio/video transcription)
- [x] Backend server running: `uvicorn app:app --reload --port 8000` from app/backend
- [x] Frontend dev server running on port 5173 from app/frontend
- [x] Confirm OpenRouter free-tier quota has not been exhausted for the day
- [x] Browser supports MediaRecorder API and AudioContext (Chrome 72+, Firefox 66+, Safari 14.1+, Edge 79+)
- [x] Confirm Groq free-tier quota has not been exhausted for the day

## Sample Inputs

### Text Input

```
Meeting with TechFlow Solutions - Product Requirements Discussion
Date: 2024-03-15
Attendees: Sarah Chen (Product Manager, TechFlow), Mike Rodriguez (CTO, TechFlow), Alex Kim (Lead Engineer, TechFlow)

Sarah: Thanks for joining us today. We're looking to build a customer portal for our e-commerce platform. The current system is all admin-facing, and we need something our customers can access directly.

Mike: Right. The main pain point is that customers can't track their orders or update their shipping information without calling support. We want to reduce support tickets by at least 40%.

Sarah: Exactly. We need three core features: First, an order tracking dashboard where customers can see all their orders with real-time status updates. Second, a profile management section where they can update addresses, payment methods, and communication preferences. Third, a returns portal where they can initiate returns and print labels.

Alex: What's the timeline looking like? We have a big marketing push scheduled for Q4.

Sarah: Ideally, we'd have the MVP ready by October 15th for the holiday season launch. The returns portal can come later, maybe November.

Mike: Budget-wise, we're looking at about $25,000 for the initial build. We have one developer dedicated to this, and we can provide QA resources from our team.

Sarah: We also need integration with our existing order management system. All order statuses need to sync in real-time, and we need to support both email and SMS notifications.

Alex: Got it. And what about security requirements?

Mike: Standard PCI compliance for payment data, and we need role-based access - customers see their own data only, admins see everything.

Sarah: Perfect. That covers our main requirements. Let's make sure the task breakdown includes testing for all three features, and the SOW should specify our $100/hour rate for development work.
```

### Audio Input

- Format: MP3 (128kbps)
- Length: 45 seconds
- Content: A clear recording of the first 45 seconds of the sample text transcript above, spoken by a single voice
- Source: Can be recorded using any standard audio recording tool (e.g., phone voice memo, Audacity, online recorder)

### Video Input

- Format: MP4 (H.264 codec, 720p)
- Length: 60 seconds
- Content: A video showing a speaker (or avatar) reading the first 60 seconds of the sample text transcript, with simple static background or slide transitions
- Source: Can be recorded using any standard video recording tool (e.g., phone camera, Zoom recording, Loom)

## Verification Steps

### Text Input Verification

1. Open the frontend at http://localhost:5173 in a browser
2. Verify the TranscriptForm component is visible with a textarea and submit button
3. Copy the sample text transcript from above
4. Paste the transcript into the textarea in the form
5. Click the "Analyze Transcript" button
6. Wait for the API response (may take several seconds)
7. Verify three output sections appear: Requirements Specification, Task Breakdown, Statement of Work
8. Confirm no console errors in browser developer tools
9. Confirm no network errors in browser developer tools Network tab

### Audio Input Verification

1. Open the frontend at http://localhost:5173 in a browser
2. Verify the TranscriptForm component is visible with a textarea and submit button
3. Click the file input button and select the sample audio file
4. Verify the file is displayed in the form
5. Click the "Analyze Transcript" button
6. Wait for the API response (may take several seconds for transcription + analysis)
7. Verify three output sections appear: Requirements Specification, Task Breakdown, Statement of Work
8. Confirm no console errors in browser developer tools
9. Confirm no network errors in browser developer tools Network tab

### Video Input Verification

1. Open the frontend at http://localhost:5173 in a browser
2. Verify the TranscriptForm component is visible with a textarea and submit button
3. Click the file input button and select the sample video file
4. Verify the file is displayed in the form
5. Wait for video-to-audio extraction to complete (UI shows "Transcribing..." status)
6. Click the "Analyze Transcript" button
7. Wait for the API response (may take several seconds for transcription + analysis)
8. Verify three output sections appear: Requirements Specification, Task Breakdown, Statement of Work
9. Confirm no console errors in browser developer tools
10. Confirm no network errors in browser developer tools Network tab

## Expected Outputs

| Output | Must Contain | Acceptance Criterion |
|--------|--------------|----------------------|
| Requirements Specification | Display title "Requirements Specification" with content containing ## Problem Statement, ## Goals, ## Requirements (table with ID, Requirement, Priority, Notes columns), ## Technical Considerations, ## Timeline | Requirements spec displays with heading "Requirements Specification" and contains Problem Statement, Goals, Requirements table, Technical Considerations, and Timeline sections |
| Task Breakdown | Display title "Task Breakdown" with content containing component-tag task IDs as Markdown subsections (### BACKEND-001: [Title], ### FRONTEND-002: [Title], etc.) — NOT a numbered list, explicitly forbidding effort estimates | Task breakdown displays with heading "Task Breakdown" and contains task items formatted as component-tagged subsections (e.g., ### BACKEND-001: [Title]) rather than a numbered list |
| Statement of Work | Display title "Statement of Work" with content containing eleven sections: Project Name, Project Term, Service Description, Staffing, Milestones and Deliverables, Location of Services, Fees, Management, Special Conditions, Business Continuity, Exhibit A (with its own Background/Project Description/Scope of Services/Responsibilities/Dependencies-Assumptions sub-sections) | SOW displays with heading "Statement of Work" and contains all eleven required sections including Project Name, Project Term, Service Description, Staffing, Milestones and Deliverables, Location of Services, Fees, Management, Special Conditions, Business Continuity, and Exhibit A |

## Error Scenarios

### Empty Transcript Submission

Do submit the form with an empty textarea → Expect error message "Please enter a transcript" displayed in a red alert box.

### Whitespace-Only Input

Do submit the form with only spaces or newlines in the textarea → Expect error message "Please enter a transcript" displayed in a red alert box.

### Backend Unreachable

Do submit the form when the backend server is not running → Expect a browser-generated network error message (e.g., "Failed to fetch" in Chromium-based browsers, or a similar network-error message in Firefox) displayed in a red alert box. The exact wording is browser-dependent since it comes from the browser's Fetch API rather than the application's own error handling; treat any message appearing in the red alert box as a pass for this scenario.

### Empty Transcript Field (Backend Validation)

Do submit the form with an empty transcript field via direct API call or when frontend validation is bypassed → Expect HTTP 400 response with JSON body `{"error": "Transcript field is required and must be non-empty"}`.

### Rate Limit Exceeded

Do submit the form when OpenRouter API rate limit is exceeded → Expect HTTP 429 response with JSON body `{"error": "<rate limit error message>"}`.

### Server Error

Do submit the form when the backend encounters an unexpected error → Expect HTTP 500 response with JSON body `{"error": "<error message>"}`.

### Unsupported File Type

Do upload a file that is not an audio or video file (e.g., .txt, .pdf, .docx) → Expect error message "Unsupported file type. Please upload an audio or video file." displayed in a red alert box.

### Oversized Audio File (>25MB)

Do upload an audio file larger than 25MB → Expect error message "File size exceeds 25MB limit. Please upload a smaller file." displayed in a red alert box. This validation occurs at file selection time before any network call to Groq.

### Oversized Video File (Extracted Audio >25MB)

Do upload a video file whose extracted audio blob exceeds 25MB (the video file itself may be well within normal size limits) → Expect error message "Extracted audio exceeds 25MB limit. Please upload a shorter video or smaller file." displayed in a red alert box. This validation occurs after client-side video-to-audio extraction, before the Groq API call.

### Corrupted/Empty File

Do upload a corrupted audio/video file or an empty file → Expect error message "Unable to process file. The file may be corrupted or unsupported." displayed in a red alert box.

### Silent Audio (Edge Case)

Do upload an audio file with no audible content → The transcription will produce empty or minimal text, which is then passed to the analysis pipeline. The system handles this gracefully and produces all three outputs (which may be minimal or empty).

### Black Video (Edge Case)

Do upload a video with no visual content → The video-to-audio extraction will produce silent audio, which follows the same path as the silent audio case above.
