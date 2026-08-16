# Task Result: T002 — Frontend Scaffold with Transcript Input Form

- **Task ID:** 2
- **Role:** Developer
- **Date:** 2026-08-15
- **Status:** Completed (verified)

---

## Objective

Scaffold the Vite + React + Tailwind frontend for ABAA: dev server, dark-mode
UI shell, and a `TranscriptForm` component that POSTs to the backend's
`/api/analyze` stub and displays the response — per
`docs/planning/implementation_plan.md` Task 2. Split into two sessions
(2.1–2.8 config/scaffold, 2.9–2.17 component/tests/verification) to avoid
the batching problem that caused false completions in Task 1.

---

## Trace

**Thought:** Build the Vite/Tailwind config layer first (2.1–2.8) before any
component code, so the dev server can be verified independently.
**Action:** Generated `package.json`, `vite.config.js`, `tailwind.config.js`,
`postcss.config.js`, `index.css`, `index.html`, `main.jsx`, `App.jsx`.
**Observation:** `npm run dev` initially failed — `index.css` was written to
`app/frontend/index.css` instead of `app/frontend/src/index.css`, but
`main.jsx` imports it via the relative path `'./index.css'`, which resolves
relative to `src/`. Fixed by manually moving the file. Root cause: file
placement wasn't verified, only file existence.

**Thought:** Check `npm audit` output before dismissing the vulnerability
warnings shown during install.
**Action:** Ran `npm audit`, reviewed the advisory chain.
**Observation:** All 4 reported vulnerabilities trace to one root advisory
(`esbuild <=0.24.2`, moderate) cascading through `vite → vite-node →
vitest`. Confirmed dev-server-only exposure (not present in the deployed
`vite build` output). Declined `npm audit fix --force` since it would have
force-installed `vite@8`, a breaking major-version jump, to fix a
low-severity local-dev-only issue. Documented as an accepted risk.

**Thought:** Build `TranscriptForm.jsx` and its test suite (2.9–2.12).
**Action:** Generated the component and `TranscriptForm.test.jsx`.
**Observation:** Two real bugs found on review, before running anything:
(1) the test file used Jest's API (`jest.fn()`, `jest.clearAllMocks()`) in
a Vitest project — `jest` isn't a global in Vitest, this would throw
`ReferenceError` immediately; (2) `vite.config.js` already referenced
`jsdom` as the test environment and a `setupTests.js` file, but neither
`jsdom` nor `@testing-library/react`/`jest-dom` were in `package.json`, and
`setupTests.js` didn't exist.

**Thought:** Fix both gaps before attempting a real test run.
**Action:** Replaced `jest.*` calls with `vi.*` (imported from `'vitest'`),
added the missing test dependencies to `package.json`, created
`setupTests.js`.
**Observation:** First real `npm run test` run: Vitest's own CLI detected
`jsdom` still wasn't actually installed and offered an interactive
auto-install prompt — confirmed the dependency had been referenced in
config but not yet reflected correctly in `package.json` on the first
pass. Accepted the auto-install, then explicitly added `jsdom` to
`package.json` directly so a fresh `npm install` wouldn't depend on an
interactive prompt.

**Thought:** Also hit `RateLimitError` (429) from OpenRouter mid-session
before any 2.9–2.12 code was written.
**Action:** Diagnosed via the error's `"is_byok":false` field — Aider was
authenticating to the free-tier model's shared anonymous pool, not a
personal key. Set `OPENROUTER_API_KEY` as a permanent Windows User env var
via `setx`, opened a fresh terminal to pick it up.
**Observation:** Confirmed via `echo $env:OPENROUTER_API_KEY`. Re-ran the
same session; no data was lost since nothing had been written before the
rate limit hit. Subsequent sessions authenticated with `is_byok: true`.

**Thought:** Run the real test suite once dependencies were fixed.
**Action:** Ran `npm run test`.
**Observation:** 8/9 passed, 1 genuine failure — not a flaky test. The
submit button's `disabled={isLoading || !transcript.trim()}` meant the
button was already disabled on empty input, so `handleSubmit`'s empty-
transcript validation branch was unreachable dead code (disabled buttons
never fire click handlers). The "shows error when submitting empty
transcript" test correctly caught this — no user could ever see that
error message as originally written.

**Thought:** Fix the dead code, expect a downstream test conflict.
**Action:** Changed `disabled` to `disabled={isLoading}` only.
**Observation:** This flipped which test failed — "submit button is
disabled when transcript is empty" now failed, since it asserted the
opposite of the just-fixed behavior. The two tests were mutually
exclusive by design (one assumed silent-disable UX, the other assumed
enabled-with-explicit-feedback UX). Resolved by keeping the better UX
(explicit feedback over silent disabling) and updating the now-outdated
test to match, rather than reverting the fix.
**Result:** Re-ran `npm run test`: **9/9 passed**, genuine, no
contradictions remaining.

**Thought:** Verify end-to-end against the real backend, not just mocked
`fetch` calls in unit tests.
**Action:** Ran both servers concurrently (`uvicorn` on :8000, Vite on
:5173), manually typed a transcript in the browser, clicked Analyze.
**Observation:** Real POST reached the live FastAPI backend, real stub
JSON (`{"requirements_spec": "stub", "task_breakdown": "stub", "sow":
"stub"}`) returned and rendered correctly in the UI. Confirms 2.15/2.16
genuinely work beyond what the mocked test suite alone could prove.

---

## Final Verified State

- `app/frontend/` — full Vite + React + Tailwind scaffold, dark mode
  default, compact density, system font stack, no component library.
- `TranscriptForm.jsx` — functional, POSTs to `/api/analyze`, handles
  loading/error states, empty-input validation reachable and correct.
- `TranscriptForm.test.jsx` — 9 Vitest tests, all genuinely passing.
- Manually verified live against the real backend (not just mocks).
- One accepted, documented risk: moderate `esbuild` dev-server-only
  vulnerability, not fixed (would require a breaking Vite major upgrade).

---

## Lessons (candidates for Reflector distillation)

- Category: File Ops — "Verify generated files land at the *correct path*,
  not just that they exist. A relative import failing to resolve is a
  silent, easy-to-miss placement bug, not a content bug."
- Category: Testing — "When scaffolding a Vitest project, check test
  files for accidental Jest API usage (`jest.fn()` vs `vi.fn()`) — the
  two are near-identical in most methods, making the mistake easy to miss
  on read-through and only surface as a runtime `ReferenceError`."
- Category: Test Design — "A failing test can be correctly catching dead
  code, not just be 'wrong.' Before patching a test to pass, check
  whether the code path it exercises is actually reachable given the
  component's current logic."
- Category: Environment — "OpenRouter free-tier models without a
  personal key resolve to a shared, heavily-rate-limited anonymous pool
  (`is_byok:false`). Setting a personal key via `setx` requires a fresh
  terminal to take effect — an already-open shell won't see it."
