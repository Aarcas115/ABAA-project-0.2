# BA Requirement Standards Reference

> Reference doc for Phase 4 Tasks 16 (gap-analysis) and 18 (classified requirements generation).
> Sources: IIBA BABOK v3 classification schema; Karl Wiegers & Joy Beatty, *Software Requirements* (3rd ed.); IEEE Std 830-1993; Gherkin/BDD conventions (Cucumber).

---

## 1. Requirement Classification

### 1.1 BABOK's actual top-level schema

BABOK (Business Analysis Body of Knowledge) classifies requirements into four levels, not a flat list:

1. **Business Requirements** — the high-level goals/needs of the organization (why the project exists).
2. **Stakeholder Requirements** — needs of specific stakeholder groups, bridging business goals to solution detail.
3. **Solution Requirements** — describe the solution itself, split into:
   - **Functional Requirements** — what the system must *do* (behavior, data handling).
   - **Non-Functional Requirements** — how well the system must do it (quality attributes).
4. **Transition Requirements** — what's needed to move from current state to the new solution (data migration, training).

For a demo-scale project like ABAA, we mainly operate at the **Solution Requirements** level (Functional/Non-Functional), which is where the five working categories below come from.

### 1.2 Working taxonomy for ABAA (five categories)

These five are the practical, SRS-style breakdown we'll classify generated requirements into. The first two map directly to BABOK's split; the last three are common subtypes used in software-engineering requirement docs (IEEE 830 tradition) to make Functional/Non-Functional concrete enough to act on. Karl Wiegers & Joy Beatty's *Software Requirements* (the standard industry reference) dedicates its own chapter specifically to data requirements, separate from general functional requirements — supporting treating Data as its own category here rather than folding it into Functional.

| Type | Definition | Example |
|---|---|---|
| **Functional** | What the system must do — a specific behavior or capability | "Users must be able to filter transactions by date range." |
| **Non-Functional** | A quality attribute of the system — performance, security, usability, reliability, scalability | "The page must load within 2 seconds under normal load." |
| **Data** | What data the system stores, processes, or transforms, and its structure/lifecycle | "Customer records must retain order history for 3 years." |
| **Interface** | How the system interacts with users or other systems (UI/UX, APIs, external integrations) | "The system must expose a REST endpoint for order status." |
| **Connectivity** | Network, integration, or communication-channel requirements — how components/systems connect | "The system must sync with the payment gateway via HTTPS webhook." |

**Note on overlap:** Interface and Connectivity requirements are often themselves Functional requirements described from a different angle (e.g. "must sync via webhook" is both a Functional and a Connectivity requirement). When classifying a generated requirement, pick the **most specific applicable category** — Data/Interface/Connectivity take priority over the generic Functional/Non-Functional label when they apply, since they carry more useful signal for the reader.

---

## 2. Gherkin (Given/When/Then)

### 2.1 What it is

Gherkin is a plain-text, structured language (used by the BDD tool Cucumber) for describing system behavior in a way both technical and non-technical stakeholders can read. It turns a requirement into a concrete, testable scenario instead of a vague sentence.

### 2.2 Syntax

- **Feature** — the capability being described (groups related scenarios)
- **Scenario** — one specific situation/example within that feature
- **Given** — the starting state/context
- **When** — the action or trigger
- **Then** — the expected outcome
- **And / But** — chain additional conditions onto any of the above

### 2.3 Example (in ABAA's domain)

```gherkin
Feature: Order tracking dashboard

  Scenario: Customer views real-time order status
    Given a customer is logged into the customer portal
    And they have at least one active order
    When they navigate to the order tracking dashboard
    Then they should see the current status of each order
    And the status should update without a page reload

  Scenario: Customer with no orders sees an empty state
    Given a customer is logged into the customer portal
    And they have no orders on file
    When they navigate to the order tracking dashboard
    Then they should see a message indicating no orders exist
```

### 2.4 Why this matters for ABAA Phase 4

Using Given/When/Then as an optional secondary format when generating requirements (especially Functional ones) makes each requirement testable and unambiguous — directly useful for the **confidence index** work in Task 18: a requirement that can't be phrased as a concrete Given/When/Then scenario (because a precondition or data source is missing) is a natural signal that it's low-confidence/incomplete.

---

## 3. Quality Criteria for Individual Requirements (IEEE 830)

Beyond classifying *what type* a requirement is, IEEE 830 defines what makes
any single requirement well-formed. These 8 characteristics are the basis
for ABAA's confidence index (Task 18) — the fewer of these a generated
requirement satisfies, the lower its confidence score.

| Characteristic | Meaning | Relevant to ABAA's confidence index? |
|---|---|---|
| **Correct** | Describes something the system should actually do | Not directly measurable pre-build — skip for confidence scoring |
| **Unambiguous** | Has exactly one interpretation | Yes — vague transcript language → lower confidence |
| **Complete** | All needed information is present, nothing left as TBD | **Yes — primary driver.** A requirement built on a gap-analysis item marked "revisit later" is by definition incomplete |
| **Consistent** | Doesn't contradict other requirements | Yes — flag if two generated requirements conflict |
| **Ranked** | Has a stated priority/importance | Not scored — priority is a separate field, not a confidence factor |
| **Verifiable** | A concrete process exists to check it was met | Yes — a requirement with no checkable "Then" outcome scores lower |
| **Modifiable** | Structure allows clean edits without breaking others | Not applicable to a single generated requirement's confidence |
| **Traceable** | Origin (which part of the transcript / which answer) is clear | Yes — a requirement not traceable to a specific transcript line or Q&A answer is inherently lower-confidence |

**Practical rule for Task 18:** score confidence primarily against **Complete, Unambiguous, Verifiable, Traceable** — the four that gap-analysis (Task 16) directly affects. A requirement is only as complete/traceable as the information it was generated from.

---

## 4. Application to Phase 4 pipeline

- **Task 16 (Gap-analysis):** when scanning a transcript, missing information typically shows up as a requirement that can't be classified into one of the five types above without guessing (most often **Data** — "what data source?" — or **Interface** — "which system does this integrate with?"). These are the categories to prioritize when generating clarifying questions.
- **Task 18 (Classified requirements):** tag each generated requirement with one of the five types above, and score its confidence against the four applicable IEEE 830 characteristics from Section 3 (Complete, Unambiguous, Verifiable, Traceable). A requirement whose Given/When/Then scenario has an unresolved "Given" (missing precondition/data, or an item marked "revisit later" in Task 16) fails Completeness and gets a lower confidence score.