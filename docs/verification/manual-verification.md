# Manual Verification Checklist

## Prerequisites

- OPENROUTER_API_KEY environment variable must be set
- Backend server running: `uvicorn app:app --reload --port 8000` from app/backend
- Frontend dev server running on port 5173 from app/frontend
- Confirm OpenRouter free-tier quota has not been exhausted for the day

## Sample Transcript

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

*Note: If the main sample transcript produces unreliable model output, the simpler transcript "Client wants a login page with email and password." is confirmed to work end-to-end per docs/progress/task_3_result.md as a quick sanity check (though it will produce mostly [NEEDS CLARIFICATION] content).*

## Verification Steps

- [x] Open the frontend at http://localhost:5173 in a browser
  Dev Note: The window opened up successfully after starting the backend and frontend.
- [x] Verify the TranscriptForm component is visible with a textarea and submit button
  Dev Note: the button is indeed visible
- [x] Copy the sample transcript from above (including the opening and closing ``` lines)
- [x] Paste the transcript into the textarea in the form
  Dev Note: transcript was ale to be pasted successfully
- [X] Click the "Analyze Transcript" button
  Dev Note: button was there and was able to be pressed
- [x] Observe the loading state change to "Analyzing..." on the button
  Dev Note: The app successfully displayed Analyzing... when the call to the LLM was made
- [x] Wait for the API response (may take several seconds)
  Dev Note: wait was faster, probably dependant on the LLM´s current traffic
- [x] Verify three output sections appear: Requirements Specification, Task Breakdown, Statement of Work
  Dev Note: Dev Note: On one occasion, a table in the output did not render correctly. Retested several times afterward with different sample transcripts and was unable to reproduce it. Likely a transient formatting inconsistency from the free-tier LLM (poolside/laguna-xs-2.1:free) rather than a rendering bug, consistent with the model reliability risk already noted in implementation_plan.md. Not treated as blocking for Phase 1.
- [x] Confirm no console errors in browser developer tools
  Dev Note: confirmed no red or yellow errors or warnings in the developer tools, confirmed this information asking the chatbot inside the developer tools powered by google.
- [x] Confirm no network errors in browser developer tools Network tab
  Dev Note: network tab confirmed al requests as either 200 OK or 304 Not modified.

## Expected Outputs

| Output | Must Contain | Acceptance Criterion |
|--------|--------------|----------------------|
| Requirements Specification | Business requirements section with Problem Statement, Goals, and Requirements table | Requirements spec contains business requirements section |
| Task Breakdown | Numbered task list with descriptions, dependencies, and acceptance criteria | Task breakdown contains numbered task list |
| Statement of Work | Scope, deliverables, and timeline sections | SOW contains scope, deliverables, and timeline sections |

Dev note: output rendered succesfully

## Error Scenarios

### Empty Transcript Submission

Do submit the form with an empty textarea → Expect error message "Please enter a transcript" displayed in a red alert box.
Dev Note: error handling and message accurate  

### Whitespace-Only Input

Do submit the form with only spaces or newlines in the textarea → Expect error message "Please enter a transcript" displayed in a red alert box.
Dev Note: error handling and message accurate

### Backend Unreachable

Do submit the form when the backend server is not running → Expect a browser-generated network error message (e.g., "Failed to fetch" in Chromium-based browsers, or a similar network-error message in Firefox) displayed in a red alert box. The exact wording is browser-dependent since it comes from the browser's Fetch API rather than the application's own error handling; treat any message appearing in the red alert box as a pass for this scenario.
Dev Note: error handling and message accurate

### Empty Transcript Field (Backend Validation)

Do submit the form with an empty transcript field via direct API call or when frontend validation is bypassed → Expect HTTP 400 response with JSON body `{"error": "Transcript field is required and must be non-empty"}`.
Dev note: error handling and message accurate  

### Rate Limit Exceeded

Do submit the form when OpenRouter API rate limit is exceeded → Expect HTTP 429 response with JSON body `{"error": "<rate limit error message>"}`.
Dev note: tested during coding

### Server Error

Do submit the form when the backend encounters an unexpected error → Expect HTTP 500 response with JSON body `{"error": "<error message>"}`.

Dev note: error handling and message accurate
