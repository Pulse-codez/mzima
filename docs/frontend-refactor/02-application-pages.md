# Mzima application pages and sectors

The landing page introduces the platform; the product experience should then guide each user to the tasks relevant to their role. This document proposes a consistent page structure for the other sectors and routes while retaining the project’s prototype and synthetic-data boundary.

## Shared application shell

Use a consistent shell for authenticated workspaces:

- A compact header with Mzima identity, current facility/context, help, and account actions.
- A role-aware navigation area with clear active-page indication.
- A main content region with page title, short explanation, and primary action.
- A visible status and error area for loading, empty, offline, and permission states.
- Responsive behavior: collapsible navigation on small screens, with the current section always identifiable.

Keep the marketing header/footer separate from the authenticated workspace shell. Do not show public-site navigation inside dense operational screens.

## Public pages

### How it works

Explain Connect → Standardize → Coordinate with the same three steps as the landing page. Show the MCP layer and the boundary between a request and a facility resource. Link to the simulation and capabilities. Avoid implying that MCP alone guarantees security; explain that permissions, configuration, and audit controls shape access.

### Story / About

Describe the problem of fragmented hospital workflows and Mzima’s intended role. Keep the language grounded and avoid unverified claims about impact, partnerships, or deployment. Include the synthetic-data/prototype notice if the page discusses current capabilities.

### Capabilities

Give each capability a short detail section: Patient Flow, Lab and Diagnostics, Pharmacy, Records, Bed Management, and Alerts. For each, say what information or workflow can be coordinated, what the system does not decide, and what human role remains responsible. Use abstract diagrams and icons rather than people imagery.

### Access request / Sign up

State who should request access and what happens after submission. Ask only for the minimum fields required by the actual backend. Give validation, submission, and failure feedback. Do not claim account creation or approval until the backend confirms it.

### Login

Keep login focused on authentication. Provide clear field labels, password visibility control, error messaging that does not expose sensitive account status, and a route back to the public site. After login, redirect users to their authorized workspace or to the originally requested page where permitted.

## Authenticated role workspaces

The current prototype includes clerk, nurse, and shift-lead roles. Use role-specific navigation and task language, while preserving backend authorization as the source of truth.

### Clerk / Front desk — Visits

- Primary task: find or register an arriving synthetic visit and update its operational status.
- Show queue summary, searchable visit list, arrival details, status, and permitted check-in/call actions.
- Make wait and fast-track indicators textual as well as visual.
- Empty state: explain that no visits match; provide a reset/search-clear action.
- Confirm consequential status changes and provide a visible completion or failure message.

### Nurse — Triage

- Primary task: review the next visit and record allowed triage observations.
- Present queue order, waiting time, relevant operational flags, and a focused visit detail panel.
- Keep clinical decision-making explicit and human-led; do not present generated recommendations as diagnoses.
- Use a save state, validation feedback, and a clear indication when data is stale or unavailable.
- Ensure refresh/polling does not unexpectedly move focus or discard unsaved input.

### Shift lead — Review

- Primary task: review proposals or operational requests and make an authorized decision.
- Show request details, evidence, current status, and the action history needed for review.
- Separate approve and reject actions visually and require any required reason before submission.
- Confirm the result from the server and retain a clear audit context.
- If a proposal is stale or capacity has changed, explain that the user must refresh/review before deciding.

### Extract / AI-assisted workflow

- Introduce the input, the extraction result, and the source of each extracted field.
- Keep unverified output visibly marked as a proposal requiring human review.
- Provide edit/correction and retry states only where supported by the product contract.
- Never silently submit an extracted result to a facility resource.

## Reusable page pattern

Use the same sequence across operational pages:

1. Page title and one-sentence purpose.
2. Context, such as role, facility, and data freshness.
3. Primary task area.
4. Supporting detail and audit/status information.
5. Empty, loading, error, permission-denied, and success states.

On mobile, prioritize the current task and its next action. Move secondary metadata below the task rather than compressing wide desktop tables. Tables should become labelled cards or a deliberate horizontally scrollable region with a visible cue.

## Route inventory to preserve during refactor

| Route | Page / role | Access intent |
| --- | --- | --- |
| `/` | Landing | Public |
| `/how-it-works` | Workflow explanation | Public |
| `/story` | About / story | Public |
| `/sign-up` | Request access | Public |
| `/login` | General login | Public, then authenticated |
| `/clerk-login` | Clerk login | Public, role-specific entry |
| `/nurse-login` | Nurse login | Public, role-specific entry |
| `/shiftlead-login` | Shift-lead login | Public, role-specific entry |
| `/visits` | Front desk workspace | Clerk or administrator |
| `/triage` | Triage workspace | Nurse or administrator |
| `/review` | Review workspace | Shift lead or administrator |
| `/extract` | Extraction workflow | Authenticated |

Keep authorization checks on protected routes and on the server/API. A hidden navigation link is not an access control.

## Refactor sequence

1. Inventory existing routes, components, API calls, and role checks.
2. Establish shared tokens and primitives before restyling individual pages.
3. Separate the public site shell from the authenticated dashboard shell.
4. Migrate one route at a time, beginning with public pages and then role workspaces.
5. Preserve API contracts and visible loading/error/empty states while changing layout.
6. Update route documentation and deployment configuration with each completed route.
