# Forge: A Repo-Native Agentic Engineering Control Plane

## Product Design Document — Phase 1

**Version:** 1.0  
**Date:** March 9, 2026  
**Status:** Design Phase — No Implementation Code

---

# 1. Product Thesis

**Forge** is a repo-native agentic engineering control plane. It is not a chat-based coding assistant. It is not a canvas workspace. It is not a multi-agent demo. It is the missing layer between human intent and reliable agent-produced software.

**What the product is.** Forge is a web application that functions as a technical cofounder and engineering control plane. It lets a human describe what they want to build, iterates through planning and research with them, then orchestrates agents to produce code, tests, documentation, and infrastructure — all committed to a real GitHub repository. The web app is the governance, observability, and intervention surface. The repo is the source of truth.

**Why it is different from current AI coding assistants.** Every major AI coding tool today — Cursor, Copilot, Windsurf, Codex CLI, Claude Code — operates at the level of individual prompts or tasks. The human writes a prompt, the agent produces code, the human reviews it. There is no durable planning phase. There is no structured research step. There is no mechanical validation pipeline. There is no execution observability. There is no harness that prevents drift, regression, or false success across runs. The result: AI coding is fast but unreliable. It works for small edits and breaks down for anything requiring architectural coherence, multi-file coordination, or sustained correctness over time.

**Why repo-native design matters.** The OpenAI Harness Engineering team discovered a principle that should be the foundation of every serious agentic engineering system: from the agent's point of view, anything it cannot access in-context while running effectively does not exist. Knowledge in chat threads, canvas documents, or proprietary databases is invisible to agents. Only repository-local, versioned artifacts — code, markdown, schemas, executable plans — are durable and legible. Therefore, the repository must be the system of record. The web app visualizes, governs, and orchestrates. But nothing of permanent value should live only in the UI.

**Why a control plane is the right mental model.** Kubernetes did not become dominant because it ran containers. It became dominant because it provided a control plane — a declarative layer where humans specify desired state, and the system continuously reconciles actual state toward it. Forge applies the same pattern to software development. The human specifies intent through plans, requirements, and acceptance criteria. Agents attempt to realize that intent. The control plane provides visibility into execution, gates for approval, mechanisms for intervention, and feedback loops for self-correction. This is fundamentally different from a prompt box.

**Why Harness Engineering materially changes the design.** The OpenAI team's core insight was that agent performance is dominated by environment quality, not model capability. They built a million-line codebase with zero manually-written code — not because models got smarter, but because they invested in: short agent-readable documentation, strict architectural boundaries enforced by custom linters, mechanical validation at every layer, ephemeral observability stacks per worktree, progressive disclosure of context, and recurring "garbage collection" agents that prevent drift. Forge productizes this insight. Instead of asking users to hand-craft their own harness (which requires staff-level engineering judgment), Forge generates, maintains, and enforces the harness as a first-class product feature.

**Why the visual center execution plane is useful but must not be the source of truth.** A live execution graph is valuable for the same reason an air traffic control radar is valuable: it shows what is happening right now. But no one stores flight plans on the radar screen. The execution plane shows agent state, task dependencies, running/blocked/failed nodes, and handoff points. When the user clicks a node, they see evidence — diffs, logs, test results, traces. But the durable artifacts (code, docs, plans, tests, harness files) live in the repository. The graph is ephemeral observability. The repo is permanent record.

---

# 2. Product Concept

## One Sentence

Forge is a repo-native engineering control plane that turns unreliable coding agents into dependable engineering contributors by embedding them inside a structured harness of plans, validation gates, observability, and human governance.

## One Paragraph

Forge combines a technical cofounder, a deep research engine, and a multi-agent execution system into a single web application. A user arrives with an idea or problem. Forge's planner agent engages in genuine back-and-forth: clarifying requirements, challenging assumptions, researching feasibility, and drafting architecture. When the user approves the plan, Forge creates or connects a GitHub repository, generates harness artifacts (AGENTS.md, architecture docs, validation policies, test contracts), and orchestrates specialized agents to implement the plan. Every action is visible in a live execution graph. Every output is validated against mechanical gates. Every artifact is committed to the repo. The human retains full authority to intervene, re-plan, approve, or stop — but the system is designed so that intervention is the exception, not the default.

## One Page

Software development is entering an agent-first era, but the tooling has not caught up. Today's AI coding assistants are individual-prompt tools bolted onto IDEs. They generate code fast but provide no planning, no research, no validation pipeline, no execution visibility, no harness that prevents drift across hundreds of generated files. The result is what the OpenAI Harness Engineering team calls "agent theater" — impressive demos that collapse under real-world complexity.

Forge is built on the premise that reliable agentic development requires three things existing tools do not provide.

First, a planning layer. Before any code is written, the system must understand the problem, research feasibility, design architecture, draft requirements, and iterate with the human until both sides agree on what "done" looks like. This is the technical cofounder mode — a high-reasoning agent that discusses the problem as a peer, not a code-completion engine that responds to prompts.

Second, a harness. The OpenAI team demonstrated that the leverage in agentic engineering comes from the environment: short repo-local guidance, strict boundaries enforced by linters, mechanical validation, agent-readable documentation, and structured context packaging. Forge generates and maintains this harness automatically. As the project evolves, the harness evolves — learning from failures, encoding human corrections into policy, and preventing pattern replication of mistakes.

Third, a control plane. Once agents are executing, the human needs to see what is happening, understand why agents made specific decisions, inspect evidence, gate approvals, intervene on failures, and trace outputs back to inputs. Forge provides this through a three-pane interface: a repo/file navigator on the left (like an IDE), a live execution graph in the center (showing agent work in motion), and an evidence inspector on the right (showing logs, diffs, tests, traces, and approval controls for any selected node).

The entire system is repo-native. Code, documentation, plans, research outputs, harness files, and test contracts are committed to a GitHub repository that the user owns. The web app is the governance layer. The repo is the source of truth. Agents operate on branches and worktrees. PRs are the unit of delivery. This means the user is never locked in — they can take their repository, leave Forge, and continue development with any tool. The repo is the product. Forge is the process.

---

# 3. User Journey and Primary Workflow

The end-to-end workflow has five major phases, with explicit transitions between them.

## Phase A — Discover and Plan

**Step 1: User arrives.** The user opens Forge and either describes a new project ("I want to build a Polymarket compression arbitrage engine") or connects an existing GitHub repository that needs work.

**Step 2: Planner engages.** The planner agent — routed to a high-reasoning model (Claude Opus class) — begins a consultative conversation. It does not immediately start generating code. Instead, it asks clarifying questions: What is the target market? What are the key constraints? What APIs are involved? What is the acceptance criteria for a working MVP? It challenges vague requirements and surfaces ambiguity.

**Step 3: Deep research runs (optional).** If feasibility is uncertain, the planner proposes a research task. The user approves. Forge's deep research subsystem deploys parallel sub-agents to investigate: API documentation, competitor implementations, library compatibility, regulatory constraints, technical gotchas. Research produces a structured report committed to `research/` in the repo. The planner reads the report and adjusts its recommendations.

**Step 4: System drafts plan artifacts.** The planner generates: a requirements document (`docs/requirements.md`), an architecture document (`docs/architecture.md`), an execution plan (`plans/active/phase-1.md`), acceptance criteria (`harness/acceptance-criteria.md`), a test strategy (`harness/test-strategy.md`), and a draft AGENTS.md. These are shown to the user in the file navigator and can be edited inline.

**Step 5: User iterates.** The user reviews the plan, pushes back ("I don't want a database, use flat files for MVP"), and the planner revises. This loop continues until the user is satisfied.

**Step 6: "Ready to Build?" transition.** The UI presents a deliberate handoff: a summary of the plan, the harness configuration, the repo structure, and a prominent "Build" button. This is not an automatic transition. The user must consciously approve.

## Phase B — Provision

**Step 7: Repo is created or linked.** If greenfield, Forge creates a GitHub repo under the user's account, initializes it with the generated harness files, and pushes the initial commit. If connecting to an existing repo, Forge creates a feature branch and generates harness files as a PR.

**Step 8: Harness artifacts are committed.** AGENTS.md, architecture docs, coding conventions, validation policies, test contracts, and the execution plan are committed to the repo. These are the "rules of the road" that all agents will follow.

**Step 9: Execution environment is provisioned.** Forge provisions an ephemeral sandbox — an isolated container with the repo cloned, dependencies installed, and the application bootable. Each agent task gets its own worktree within this sandbox.

## Phase C — Build

**Step 10: Agents begin work.** The execution plan is decomposed into a task graph. Tasks are assigned to specialized agents: implementer, test writer, validator, doc updater. The task graph appears in the center execution pane. Nodes light up as agents start work.

**Step 11: Validation runs continuously.** After each implementation task, a validator agent runs: linters, type checks, unit tests, integration tests, and custom harness validators (e.g., architecture boundary checks, file size limits, naming conventions). Failures trigger targeted repair loops, not blind retries.

**Step 12: Partial results are visible.** As files are created or modified, they appear in the file navigator. Diffs are available in the inspector. The user can open any file, inspect any diff, and read any log at any time.

## Phase D — Review and Intervene

**Step 13: User reviews evidence.** For any completed or failed task, the inspector shows: the prompt/context pack sent to the agent, files read and written, commands run, test results, screenshots (if UI work), diffs, and a confidence assessment. The user can approve, request changes, retry, or escalate.

**Step 14: User intervenes.** If the plan is wrong, the user can re-enter planner mode ("this approach won't work, let's use WebSockets instead"). Forge pauses execution, the planner revises the plan, affected tasks are re-scoped, and execution resumes.

**Step 15: Outputs are committed.** Completed work is committed to the feature branch. When all tasks pass validation, Forge opens a PR against the main branch. The PR includes a summary of what was done, evidence links, and test results.

## Phase E — Learn

**Step 16: Harness learns.** Failures during the build are classified (bad plan, incomplete context, flaky test, architecture drift, etc.). Classified failures feed back into harness policies. If an agent repeatedly violated a naming convention, the harness adds a linter rule. If a test was flaky, the test contract is updated. Over time, the harness becomes more specific to the project.

---

# 4. Product Surfaces / UX Architecture

## 4.1 — Landing / Workspace Selection

**Purpose:** Entry point. The user sees their workspaces (projects), recent activity, and a "New Project" action.

**Major UI components:** Project cards with status summaries (active tasks, last commit, health score). Quick-start button for new projects. Connected GitHub repos shown per workspace.

**Interactions:** Click a project to enter it. Click "New Project" to start the planner flow. Filter/sort by activity or status.

**Data emphasized:** Project health, active/blocked task counts, last human activity timestamp.

**Trust contribution:** Shows the user that all projects are tied to real repos with real state.

## 4.2 — Planner / Technical Cofounder Workspace

**Purpose:** The consultative pre-build environment. This is where the user and the planner agent design the project before execution begins.

**Major UI components:** Left: file navigator showing any generated plan/research artifacts. Center: conversation thread between user and planner. Right: live artifact preview (the plan document, architecture diagram, requirements spec) that updates as the planner refines its output.

**Interactions:** User types messages. Planner responds with questions, proposals, and artifacts. User can edit generated artifacts directly in the right pane. "Request Research" button triggers deep research. "Ready to Build?" button appears when the planner deems the plan sufficient.

**Data emphasized:** Clarity of requirements, completeness of plan, open questions, risk flags.

**Trust contribution:** The user can see exactly what the system plans to do before any execution begins. Nothing happens without explicit approval.

## 4.3 — Deep Research Workspace

**Purpose:** Serious pre-build and mid-build research.

**Major UI components:** Research request card (what the system proposes to research). Progress view showing parallel sub-agents and their status. Final report rendered as a readable document with inline citations.

**Interactions:** User approves or skips proposed research. User can watch sub-agents work in real time. Final report is committed to `research/` and linked in the plan.

**Data emphasized:** Source quality, citation density, confidence in findings, gaps identified.

**Trust contribution:** Research is transparent — the user sees what was searched, what was found, and how conclusions were reached.

## 4.4 — Repo Browser / File Explorer (Left Sidebar)

**Purpose:** IDE-style navigation of the repository. This is where all durable artifacts are accessed.

**Major UI components:** Tree view with expandable folders: `src/`, `docs/`, `plans/`, `research/`, `harness/`, `tests/`. Open file tabs. Search bar. Changed files indicator (files modified since last commit). Generated files indicator. Branch/PR status badge.

**Interactions:** Click a file to open it in a center tab (replacing or alongside the execution graph). Right-click for context menu (view diff, view history, open in GitHub). Drag files between folders.

**Data emphasized:** File structure, changed files, harness file freshness, generated vs. human-edited files.

**Trust contribution:** The user can always verify what is actually in the repo. Nothing is hidden behind a proprietary canvas.

## 4.5 — Live Execution Graph / Agent Canvas (Center Pane)

**Purpose:** Real-time observability of agent work in motion.

**Major UI components:** Directed graph of task nodes with edges showing dependencies. Each node shows: task name, assigned agent type, status (queued/running/validating/blocked/failed/completed), and a mini progress indicator. Toolbar to switch between graph, timeline, and swimlane views.

**Interactions:** Click a node to select it (loads details in right inspector). Double-click to expand a collapsed group. Scroll/zoom to navigate. Filter by status (show only failed, show only running). Collapse completed phases.

**Data emphasized:** What is running now, what is blocked, what has failed, dependency structure.

**Trust contribution:** The user can see the entire execution topology and immediately identify problems.

## 4.6 — Timeline / Swimlane View (Center Pane, Alternate)

**Purpose:** Chronological view of execution, useful when the graph becomes complex.

**Major UI components:** Horizontal timeline with events stacked by time. Swimlane variant groups events by agent type (planner, implementer, validator, etc.). Each event shows: task name, duration bar, status color.

**Interactions:** Scroll horizontally through time. Click any event to select it. Filter by agent type or phase.

**Data emphasized:** Temporal ordering, concurrency visualization, duration of tasks, gaps where nothing was running.

**Trust contribution:** Shows the user the story of what happened and when — useful for post-hoc review.

## 4.7 — File Editor / Doc Viewer (Center Pane, Tab Mode)

**Purpose:** Inspect and edit any file from the repo without leaving Forge.

**Major UI components:** Code editor with syntax highlighting. Markdown renderer for docs. Inline diff view for changed files. Breadcrumb navigation showing file path.

**Interactions:** Edit files directly (generates a commit). Toggle between rendered and raw view for markdown. Compare current version to last committed version.

**Data emphasized:** File content, diff against previous version, which agent last touched the file.

**Trust contribution:** The user can verify file contents without switching to a separate IDE or GitHub.

## 4.8 — Diff Review Surface

**Purpose:** Review changes proposed by agents before they are committed or merged.

**Major UI components:** Side-by-side diff view. File-by-file navigation. Inline comments. Approve/reject controls per file and per PR.

**Interactions:** Review diff, leave comments (fed back to agents), approve or request changes. Bulk approve for trusted changes.

**Data emphasized:** What changed, what was the context (linked to the task that produced the change), test results for the changed code.

**Trust contribution:** The user reviews real diffs against real code, not summaries or abstractions.

## 4.9 — Test and Validation Surface

**Purpose:** Centralized view of all validation results.

**Major UI components:** Test suite list with pass/fail/skip counts. Individual test detail with output, duration, and failure messages. Validation policy compliance dashboard (architecture checks, lint results, coverage).

**Interactions:** Click a failing test to see its output and the code it tests. Re-run individual tests. Link test failures to specific agent tasks.

**Data emphasized:** Pass/fail rates, coverage, policy compliance, newly introduced failures vs. pre-existing.

**Trust contribution:** The user can verify that the system's claim of "task complete" is backed by evidence.

## 4.10 — Logs / Traces Surface

**Purpose:** Deep inspection of what agents actually did.

**Major UI components:** Structured log viewer with filters (by agent, by task, by severity). Trace waterfall showing the sequence of operations within a task. Token/cost breakdown per agent run.

**Interactions:** Filter and search logs. Expand trace spans. Click any operation to see its inputs and outputs.

**Data emphasized:** What the agent did, in what order, how long it took, what it cost, and whether anything anomalous occurred.

**Trust contribution:** Full auditability — the user can reconstruct exactly what happened.

## 4.11 — Harness Configuration / AGENTS.md Manager

**Purpose:** View and edit the harness that governs agent behavior.

**Major UI components:** Structured editor for AGENTS.md (showing the map, not the raw file). Policy editor for validation rules, coding conventions, architecture boundaries, escalation rules. Freshness indicators (when each harness document was last updated, whether it matches current code).

**Interactions:** Edit harness files (changes committed to repo). Add new policies. Toggle policies on/off for experimentation. View policy violation history.

**Data emphasized:** What rules exist, what is enforced, what is stale, what was recently violated.

**Trust contribution:** The user can see and control the constraints that govern agent behavior.

## 4.12 — Policy / Rules Manager

**Purpose:** Fine-grained control over validation, approval, and escalation policies.

**Major UI components:** Policy list with type (validation gate, approval requirement, retry policy, escalation rule). Policy detail showing when it applies, what it checks, and what happens on violation.

**Interactions:** Create, edit, toggle, and delete policies. View enforcement history. Link policies to specific agent roles or task types.

**Data emphasized:** What is enforced, how often it triggers, what the consequences are.

**Trust contribution:** The user controls the reliability mechanisms, not just the agents.

## 4.13 — Run History

**Purpose:** Historical record of all agent runs and task executions.

**Major UI components:** Table/list of past runs with date, task, agent, status, duration, cost. Filterable and searchable. Drill into any run to see its full evidence bundle.

**Interactions:** Click a run to replay its state (view the graph as it was at that point). Compare runs. Identify patterns in failures.

**Data emphasized:** Success rate trends, failure patterns, cost trends, frequently failing tasks.

**Trust contribution:** The user can learn from history and identify systematic issues.

## 4.14 — Failure Analysis Surface

**Purpose:** Understand why things went wrong.

**Major UI components:** Failure timeline showing what failed and when. Failure classification (bad plan, incomplete context, agent loop, false success, flaky test, architecture drift). Root cause analysis linking the failure to its probable origin. Suggested remediation (update harness, add test, re-scope task).

**Interactions:** Click a failure to see its full context. Accept suggested remediations (which update harness files). Dismiss false alarms.

**Data emphasized:** What went wrong, why, and what to do about it.

**Trust contribution:** Failures are not hidden — they are surfaced, classified, and actionable.

## 4.15 — Approvals / Review Queue

**Purpose:** Centralized queue of items awaiting human decision.

**Major UI components:** List of pending approvals: PRs to merge, plans to approve, escalated failures to resolve, research to approve. Each item shows context, evidence, and recommended action.

**Interactions:** Approve, reject, or defer each item. Batch approve trusted items. Set auto-approve rules for low-risk changes.

**Data emphasized:** What needs human attention right now, ordered by urgency and impact.

**Trust contribution:** The human is always in control of what ships.

---

# 5. The Center Execution Plane

This section defines the most critical visual surface in Forge: the center pane that shows live agent work.

## What Appears Here

The execution plane contains **execution objects** — entities that represent active or completed computational work:

- **Task nodes:** The primary unit. Each represents a scoped piece of work (implement function X, write tests for module Y, validate architecture constraints). Displayed as compact cards showing: task name, agent type icon, status indicator (color-coded), and a mini progress bar.
- **Phase groups:** Collapsible containers that group related tasks (e.g., "Phase 1: Core Data Layer"). When collapsed, they show aggregate status (3/5 complete, 1 failed).
- **Handoff edges:** Directed lines showing dependencies between tasks. Solid for data dependencies, dashed for sequencing constraints.
- **Gate nodes:** Diamond-shaped nodes representing approval points or validation checkpoints. These are where the system pauses for human input.
- **Repair branches:** When a task fails and enters a repair loop, a branching path appears showing the retry attempts.

## What Does NOT Appear Here

- **File contents.** Files are navigated in the left sidebar, not displayed as giant blocks on the graph.
- **Document bodies.** Research reports, plans, and specs live in the file tree, not on the canvas.
- **Chat history.** The planner conversation is in its own workspace, not scattered across the graph.
- **Configuration.** Harness settings and policies are in dedicated management surfaces.

This distinction is critical. The graph shows **work in motion**. It does not store **artifacts at rest**.

## Units of Visualization

The atomic unit is the **task node**. Tasks are small: "implement the WebSocket connection handler," "write unit tests for the order book parser," "validate architecture boundary compliance." A task should be completable by a single agent in a single run (minutes to a few hours). If a task is too large, it should be decomposed during planning.

## How the Graph Scales

Large projects can have hundreds of tasks. The graph handles this through:

- **Phase collapsing.** Completed phases collapse to a single summary node. Only the active phase is expanded by default.
- **Status filtering.** The user can filter to show only running, only failed, or only blocked nodes.
- **Zoom levels.** Zoomed out: phases as nodes. Zoomed in: individual tasks within a phase.
- **Swimlane layout.** When the graph becomes wide, switch to swimlane view (one lane per agent type or per service/module).

## Concurrency

Concurrent tasks appear side-by-side in the same horizontal band. Swimlane view makes concurrency most legible — parallel tasks in the same lane show as stacked bars on a timeline.

## Dependencies

Edges connect producer tasks to consumer tasks. When a task is blocked (its dependency has not completed), the node shows a "blocked" badge and the blocking edge is highlighted in amber.

## Failures

Failed nodes turn red. The failure type is shown as a badge (e.g., "test failure," "timeout," "architecture violation"). Clicking the failed node loads the failure detail in the right inspector.

## Retries and Repair Branches

When a failed task enters a repair loop, a branching path extends from the failed node. Each retry attempt appears as a sub-node. If the repair succeeds, the branch merges back into the main path. If repair is exhausted, the node stays red and escalates to the human.

## Graph View vs. Timeline View

**Graph view is better when:** the user wants to understand the dependency structure, identify blocked tasks, and see the overall topology of work. Best for planning-phase review and intervention decisions.

**Timeline view is better when:** the user wants to understand what happened chronologically, diagnose why something took too long, or review a completed build. Best for post-hoc analysis and failure investigation.

**Recommendation:** Default to graph view during active execution. Default to timeline view for completed runs.

## Relationship to Repo Tree and Inspector

When the user clicks a node in the execution plane:
- The **right inspector** loads with that node's details (logs, diffs, test results, etc.)
- The **left file tree** highlights the files that node touched (with badges showing "read" or "written")
- If the user wants to see a full file, they click it in the left tree, and the center pane switches to the file editor (the graph is still accessible via a tab)

This three-pane coordination is the core interaction model.

---

# 6. Left Sidebar / IDE-Style Workspace

The left sidebar is the repo-native anchor of the entire application. It must feel like a serious IDE file explorer, not a toy file list.

## Structure

The sidebar has a tabbed top section and a tree below:

**Tabs:**
- **Files** — Full repository tree
- **Docs** — Filtered view showing only `docs/`, `plans/`, `research/`
- **Harness** — Filtered view showing only `harness/` (AGENTS.md, policies, conventions, test contracts)
- **Changes** — Files modified in the current execution, grouped by task
- **Search** — Full-text search across all repo files

**Tree contents (Files tab):**
```
my-project/
├── AGENTS.md
├── ARCHITECTURE.md
├── src/
│   ├── core/
│   ├── services/
│   └── ui/
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   └── design-decisions/
├── plans/
│   ├── active/
│   │   └── phase-1.md
│   └── completed/
├── research/
│   ├── feasibility-report.md
│   └── api-investigation.md
├── harness/
│   ├── policies/
│   │   ├── reliability.yaml
│   │   └── coding-conventions.yaml
│   ├── test-contracts/
│   └── acceptance-criteria.md
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── .forge/
    └── run-history/
```

## File Metadata

Each file in the tree shows contextual badges:
- **Modified** (dot) — changed in the current build
- **Generated** (robot icon) — created by an agent, not by the user
- **Stale** (clock icon) — harness file that hasn't been updated in N runs
- **Failing** (red) — associated tests are failing

## Open Tabs

Files opened for inspection appear as tabs above the center pane. Multiple files can be open simultaneously. The execution graph is always available as a persistent tab.

## Branch / PR State

At the top of the sidebar: current branch name, ahead/behind main indicators, open PR link (if one exists). The user can switch branches, create new branches, or open a PR directly from the sidebar.

## How This Prevents Graph Overload

The key design decision: **large files live in the tree, not the graph.** When an agent generates a 500-line source file, that file appears in the left tree. The execution graph only shows a compact task node saying "Implement order-book-parser.ts — Complete." The user clicks the file in the tree to read it. The graph stays clean.

---

# 7. Right-Side Inspector / Evidence Panel

The right inspector is the trust engine of Forge. When the user selects any node in the execution graph, any task in the timeline, or any file in the tree, the inspector shows everything needed to decide whether to trust the result.

## Inspector Content by Selection Type

### For a selected execution node (task):

| Section | Contents |
|---------|----------|
| **Status** | Current state, duration, agent type, model used |
| **Inputs** | Context pack summary — what files, docs, and instructions were provided to the agent |
| **Tools used** | List of tools invoked (file read, file write, shell command, browser, API call) |
| **Commands run** | Actual shell commands executed, with output |
| **Files read** | Files the agent read for context, with relevance score |
| **Files written** | Files created or modified, with inline diff links |
| **Diff summary** | Compact view of all changes made |
| **Test results** | Pass/fail for tests run against this task's output |
| **Logs** | Structured logs from the agent run |
| **Screenshots** | If UI work — before/after screenshots |
| **Traces** | Detailed execution trace (operations in order) |
| **Model / Cost** | Which model was used, token count, estimated cost |
| **Failure classification** | If failed: type (test failure, timeout, architecture violation, loop detection) |
| **Suggested actions** | Retry, retry with modified context, escalate to human, re-scope task |
| **Approval buttons** | Approve, Request Changes, Retry, Stop, Escalate |

### For a selected file:

| Section | Contents |
|---------|----------|
| **File info** | Path, size, last modified, created by (agent/human) |
| **Diff** | Changes since last commit |
| **History** | Which tasks have touched this file |
| **Test coverage** | Tests that exercise this file |
| **Harness compliance** | Whether the file passes all relevant policies |

### For a selected failure:

| Section | Contents |
|---------|----------|
| **Failure type** | Classification |
| **Error output** | Actual error messages, stack traces |
| **Root cause hypothesis** | System's best guess at what went wrong |
| **Repair history** | Previous repair attempts and their outcomes |
| **Remediation options** | Suggested fixes (retry, re-scope, update harness, manual fix) |

## How the Inspector Reinforces Trust

The inspector answers three questions the user always has:
1. **What did the agent actually do?** — Not what it claimed, but what operations it performed.
2. **How do I know this is correct?** — Test results, validation outcomes, evidence.
3. **What should I do next?** — Clear action buttons, not just information.

---

# 8. Planner / Technical Cofounder Mode

The planner is the most important agent in Forge. It is not a code generator. It is a thinking partner.

## How It Talks to the User

The planner communicates in a conversational thread, but with structure. Each planner message includes:
- **Prose reasoning** — natural language explanation of its thinking
- **Artifact updates** — when it drafts a requirement, plan, or architecture decision, the artifact appears in the right pane and is committed to the repo
- **Open questions** — explicit list of things it still needs to know
- **Confidence assessment** — where it feels solid vs. uncertain

The planner uses a high-reasoning model (Opus-class). It is explicitly not optimized for speed. It is optimized for correctness, thoroughness, and architectural judgment.

## How It Asks Clarifying Questions

The planner has a structured discovery protocol:
1. **Problem framing:** What are you trying to build? Who is it for? What is the core value?
2. **Constraint elicitation:** What are the hard constraints (budget, timeline, platform, APIs)?
3. **Ambiguity surfacing:** What decisions have not been made yet? Where are you unsure?
4. **Architecture probing:** What are the major components? How do they communicate? What are the data flows?
5. **Risk identification:** What could go wrong? What are the hard technical problems?

It does not ask all questions at once. It adapts based on the user's responses, going deeper where the user is vague and moving on where the user is specific.

## How It Reasons About Architecture

The planner has access to:
- Deep research reports (if run)
- The repository contents (if connecting to an existing repo)
- Common architectural patterns for the domain
- Known failure modes for the proposed approach

It produces an `ARCHITECTURE.md` that follows the Harness Engineering pattern: a top-level map of domains, layers, and dependencies, with strict boundaries and explicit cross-cutting concerns.

## How It Generates Plan Artifacts

The planner produces, in order:
1. `docs/requirements.md` — What the system must do, with acceptance criteria
2. `docs/architecture.md` — How the system is structured, with boundaries
3. `plans/active/phase-N.md` — The execution plan: ordered tasks, dependencies, estimated effort, acceptance criteria per task
4. `harness/AGENTS.md` — Short agent-readable map of the repo
5. `harness/policies/reliability.yaml` — Validation gates, retry rules, escalation triggers
6. `harness/acceptance-criteria.md` — Definition of done for the overall project

## How "Ready to Build?" Works

The transition from planning to building is a deliberate gate.

The UI shows a "Handoff Summary" panel containing:
- Problem statement (one paragraph)
- Architecture summary (key components and boundaries)
- Task list (what agents will do, in what order)
- Harness configuration (what policies are active)
- Risk flags (what the planner is uncertain about)
- Estimated cost and duration range

Two buttons: **"Refine Plan"** (continue iterating) and **"Build"** (begin execution).

The user must click Build. There is no auto-transition.

## What Remains Deterministic

The planner is an LLM, but certain decisions should not be delegated:
- **Repo creation** — always requires user confirmation
- **GitHub permissions** — always explicit
- **Cost commitments** — estimated before execution, user approves
- **Merge to main** — always gated by human approval
- **Policy changes** — proposed by planner, applied by user

---

# 9. Deep Research Mode

Deep research is a first-class subsystem, not a chat feature. It is the intelligence-gathering arm of the system.

## What It Researches

Research tasks fall into several categories:

- **Product feasibility:** Does this idea already exist? What's the competitive landscape? What are the market constraints?
- **Technical feasibility:** Can this be built with available APIs/libraries? What are the known limitations? What are the performance characteristics?
- **Architecture investigation:** What patterns work for this problem domain? What are the tradeoffs between approach A and approach B?
- **API/dependency research:** What does this API actually do? What are the rate limits, authentication requirements, and edge cases? What does the SDK support?
- **Implementation pattern research:** How have others solved this? What open-source implementations exist? What are the known pitfalls?
- **Debugging research (mid-build):** Why is this failing? What does this error mean? What are known fixes?
- **Repo-specific discovery (for existing repos):** What is the architecture? Where are the boundaries? What conventions are followed? Where is the tech debt?

## How It Differs from Planner Mode

The planner reasons about what to build and how to structure it. Research gathers facts. The planner uses research outputs as inputs, but they are distinct roles:

| Planner | Research |
|---------|----------|
| Makes decisions | Gathers evidence |
| Proposes architecture | Investigates options |
| Drafts plans | Produces reports |
| Iterates with user | Runs independently |
| Uses Opus-class model | Uses a mix of models for breadth |

## When It Runs

Research can run at three points:
1. **Pre-plan:** Before the planner finalizes architecture. The user or planner requests a research task.
2. **Mid-plan:** During planning iteration, when a specific question needs investigation.
3. **Mid-build:** When an agent encounters an unexpected problem that requires investigation.

## How It Produces Artifacts

Research outputs are committed to the repo in `research/`:
```
research/
├── feasibility-report-2026-03-09.md
├── api-investigation-polymarket-clob.md
├── architecture-alternatives.md
└── debugging-websocket-auth-failure.md
```

Each report includes:
- Executive summary
- Key findings (structured, not prose-only)
- Sources with inline citations
- Confidence assessment per finding
- Open questions and recommended next steps

## How It Feeds Planning and Execution

Research reports are added to the context pack for relevant agent runs. The planner reads them when making architecture decisions. The implementer reads them when working on tasks that the research informed. The research is not just "nice to know" — it is a formal input to downstream work.

## UI for Research

The research workspace shows:
- **Research queue:** Proposed and active research tasks
- **Sub-agent status:** Parallel agents and their current progress (similar to the screenshot provided — compact status nodes showing "Searching...", "Analyzing...", "Synthesizing...")
- **Source list:** URLs and documents being analyzed
- **Final report:** Rendered with citations, committed to repo

---

# 10. Build Phase and Live Orchestration

## How Execution Begins

When the user clicks "Build," the following sequence occurs:

1. **Plan decomposition.** The execution plan (`plans/active/phase-N.md`) is parsed into a task graph. Each task has: a unique ID, a description, dependencies, assigned agent type, acceptance criteria, and a context packaging specification.

2. **Dependency resolution.** Tasks are ordered by dependencies. Independent tasks are marked as parallelizable.

3. **Environment provisioning.** An ephemeral sandbox is created with the repo cloned, dependencies installed, and the application bootable. Each concurrent task gets its own git worktree within the sandbox.

4. **Execution begins.** The orchestrator starts executing tasks in dependency order. Tasks without unmet dependencies are started immediately (up to a concurrency limit). The execution graph in the center pane starts updating in real time.

## Agent Spawning

Each task is assigned to an agent with a specific role. The orchestrator:
1. Assembles the context pack for the task (see section 12)
2. Selects the appropriate model (Opus for architecture-sensitive work, Sonnet for implementation, Haiku for simple validation)
3. Spawns the agent with the context pack, tools, and the task's acceptance criteria
4. Monitors the agent's execution

## Task Grouping

Tasks are grouped by:
- **Phase** — major project milestones
- **Module** — the service/component being worked on
- **Type** — implementation, testing, documentation, validation

Groups can be expanded/collapsed in the execution graph.

## Validation Interleaving

Validation is not a post-build step. It is interleaved with implementation:
- After each implementation task: lint, type-check, and run affected unit tests
- After each module is complete: run integration tests for that module
- After each phase is complete: run the full test suite and architecture validation
- Continuously: check harness policy compliance

## Partial Results

As tasks complete, the user sees:
- New/modified files in the file tree (with "new" badges)
- Diffs available in the inspector
- Test results updating in real time
- The execution graph nodes transitioning from "running" to "validating" to "completed"

## Branch/Worktree Management

- Each build operates on a feature branch (e.g., `forge/phase-1-core-data-layer`)
- Concurrent tasks use git worktrees for isolation
- Completed work is merged back to the feature branch
- The feature branch is PR'd against main when the phase is complete

## Evidence Capture

Every agent run produces an evidence bundle stored in the system database (not in the repo — evidence is ephemeral control-plane data):
- Input context pack
- Operations performed
- Files read/written
- Commands executed
- Model used, tokens consumed
- Validation results
- Duration and cost

---

# 11. Multi-Agent Architecture

## Agent Roles

Not every role needs to be an autonomous agent. Some are better as deterministic functions with LLM assistance at specific decision points.

### Planner (Agent)
- **Purpose:** Consultative pre-build planning. Understands the problem, designs architecture, drafts requirements and plans.
- **Inputs:** User conversation, research reports, existing repo state.
- **Outputs:** Requirements docs, architecture docs, execution plans, harness configuration.
- **Tools:** Repo read, web search, deep research invocation.
- **Model:** Opus-class (high reasoning).
- **When invoked:** At project start, when re-planning is needed, when the user requests consultation.
- **What should be deterministic instead:** Repo creation, permission grants, cost approvals.

### Deep Research Agent (Agent)
- **Purpose:** Parallel web research and synthesis.
- **Inputs:** Research question, scope constraints.
- **Outputs:** Structured research report with citations.
- **Tools:** Web search, web fetch, document parsing.
- **Model:** Lead agent uses Opus-class. Sub-agents use Sonnet-class for breadth.
- **When invoked:** By planner or user request.
- **What should be deterministic instead:** Source quality scoring thresholds, citation verification.

### Repo Mapper (Deterministic + LLM)
- **Purpose:** Analyze an existing repository to produce a structural map.
- **Inputs:** Repository contents.
- **Outputs:** ARCHITECTURE.md draft, dependency graph, module boundary map, convention inference.
- **Tools:** AST parsing, dependency analysis, file stats.
- **Model:** Sonnet-class for inference, but heavy reliance on static analysis tools.
- **When invoked:** When connecting to an existing repo.
- **What should be deterministic instead:** Dependency graphing, file type classification, size analysis.

### Implementer (Agent)
- **Purpose:** Write code for a specific, scoped task.
- **Inputs:** Task description, context pack (relevant files, architecture docs, coding conventions, test contracts).
- **Outputs:** New or modified source files.
- **Tools:** File read/write, shell commands, application boot/test, browser automation (for UI work).
- **Model:** Sonnet-class for most tasks. Opus-class for architecture-sensitive implementations.
- **Failure modes:** Incomplete implementation, wrong approach, architectural boundary violation, hallucinated APIs.
- **When invoked:** During build phase, for each implementation task.

### Test Designer (Agent)
- **Purpose:** Design and write test suites.
- **Inputs:** Requirements, acceptance criteria, implementation files, test strategy.
- **Outputs:** Test files (unit, integration, e2e).
- **Tools:** File read/write, test runner, coverage tools.
- **Model:** Sonnet-class.
- **When invoked:** In parallel with or immediately after implementation.
- **What should be deterministic instead:** Test runner invocation, coverage measurement.

### Validator (Mostly Deterministic)
- **Purpose:** Run all validation checks against agent output.
- **Inputs:** Changed files, test suite, harness policies.
- **Outputs:** Validation report (pass/fail per check, coverage, policy compliance).
- **Tools:** Lint, type-check, test runner, architecture checker, policy evaluator.
- **Model:** Minimal LLM use — primarily for interpreting ambiguous test failures.
- **When invoked:** After every implementation and test-writing task.
- **What should be deterministic instead:** Nearly everything. The validator is primarily a deterministic pipeline.

### Debugger (Agent)
- **Purpose:** Diagnose and fix failures identified by the validator.
- **Inputs:** Failure report, relevant code, test output, logs.
- **Outputs:** Targeted fix (code changes) or escalation with diagnosis.
- **Tools:** File read/write, log analysis, stack trace parsing, application boot.
- **Model:** Opus-class (debugging requires strong reasoning).
- **Failure modes:** Fix introduces new problems, fix is cosmetic (suppresses error without solving root cause).
- **When invoked:** When validator reports failures that are attributable to the current task.

### Reviewer (Agent)
- **Purpose:** Review agent-produced code for quality, correctness, and convention compliance.
- **Inputs:** Diff, architecture docs, coding conventions.
- **Outputs:** Review comments, approval or rejection.
- **Tools:** File read, diff analysis.
- **Model:** Opus-class.
- **When invoked:** Before merging task output to the feature branch. Can be configured to run always or only for high-risk changes.

### Doc Updater (Agent)
- **Purpose:** Keep documentation synchronized with code changes.
- **Inputs:** Changed files, existing docs, AGENTS.md.
- **Outputs:** Updated docs, updated AGENTS.md.
- **Tools:** File read/write.
- **Model:** Sonnet-class.
- **When invoked:** After each phase completes. Also on a recurring schedule ("doc gardening").

### Harness Maintainer (Agent)
- **Purpose:** Update harness artifacts based on execution history and failure patterns.
- **Inputs:** Failure classification history, policy violations, user corrections.
- **Outputs:** Updated policies, new lint rules, updated test contracts.
- **Tools:** File read/write, history analysis.
- **Model:** Opus-class (harness changes are high-leverage).
- **When invoked:** After each build phase, or when failure patterns are detected.

## Orchestration Model Recommendation

**Hybrid: DAG-based orchestration with agent autonomy within tasks.**

The task graph is a directed acyclic graph managed by a deterministic orchestrator. The orchestrator decides what runs when and in what order — this is not an LLM decision. Within each task, the assigned agent has autonomy to decide how to accomplish the work. But the agent cannot change the task graph, skip validation, or merge without approval.

This is the pattern the OpenAI team used: "enforce boundaries centrally, allow autonomy locally."

---

# 12. Harness Architecture

The harness is the set of constraints, documentation, and policies that make agent behavior reliable and predictable.

## Harness Artifacts and Their Location

All harness artifacts live in the repo, committed and versioned.

### `AGENTS.md` (Root)
The table of contents. ~100 lines. Maps the repo structure, points to deeper docs, lists active conventions, and defines the agent's operating context. Following the OpenAI pattern: this is the map, not the encyclopedia.

### `ARCHITECTURE.md` (Root)
Top-level architecture document. Defines domains, layers, dependency directions, and cross-cutting concerns. This is the document agents read to understand where code should go and what boundaries exist.

### `docs/` Directory
- `docs/requirements.md` — What the system must do
- `docs/design-docs/` — Detailed design decisions (ADR-style)
- `docs/product-specs/` — Product specifications
- `docs/generated/` — Auto-generated docs (schema docs, API docs)

### `plans/` Directory
- `plans/active/` — Currently executing plans
- `plans/completed/` — Archived plans with decision logs
- `plans/tech-debt-tracker.md` — Known debt and remediation schedule

### `research/` Directory
- Research reports, feasibility analyses, API investigations

### `harness/` Directory
- `harness/policies/reliability.yaml` — Validation gates, retry rules, escalation triggers
- `harness/policies/coding-conventions.yaml` — Style, naming, structure rules
- `harness/policies/architecture-boundaries.yaml` — Dependency direction rules, layer restrictions
- `harness/test-contracts/` — What must be tested, to what coverage, with what types of tests
- `harness/acceptance-criteria.md` — Project-level definition of done
- `harness/escalation-rules.yaml` — When to stop and ask the human
- `harness/context-packaging.yaml` — What context to include for each agent role

## How the UI Helps Create and Edit Harness Files

The Harness Configuration surface (Section 4.11) provides:
- **Guided creation:** When starting a new project, the planner generates initial harness files. The user reviews and edits them.
- **Template library:** Pre-built harness templates for common project types (web app, API service, CLI tool).
- **Inline editing:** Edit harness files directly in the file editor, with validation (YAML syntax checking, policy consistency checking).
- **Drift alerts:** When code changes without corresponding harness updates, the UI shows a staleness warning.

## How Agents Consume Harness Files

Each agent's context pack includes the relevant harness files:
- Implementer gets: AGENTS.md, architecture doc, coding conventions, relevant test contracts
- Validator gets: All policies, architecture boundaries, test contracts
- Reviewer gets: Architecture doc, coding conventions, acceptance criteria
- Debugger gets: AGENTS.md, relevant policies, failure classification history

The context packaging is defined in `harness/context-packaging.yaml` and is deterministic — the orchestrator assembles context packs, not the agents.

## How the Harness Evolves

The harness is not static. It evolves through three mechanisms:
1. **Failure-driven updates:** When a failure is classified (e.g., "architecture boundary violation"), the harness maintainer proposes a new lint rule or updated policy.
2. **Human corrections:** When the user corrects an agent's output, the correction is analyzed for generalizable lessons. If the correction reflects a missing convention, the harness maintainer proposes an update.
3. **Periodic gardening:** On a recurring schedule, the doc updater scans for stale documentation and the harness maintainer checks for unenforced policies.

---

# 13. Reliability Model

Reliability is the central design problem. Every mechanism below exists to prevent a specific failure mode.

## Task Scoping
- **Problem it solves:** Unbounded tasks that agents wander through without converging.
- **How it works:** Every task has explicit inputs, outputs, and acceptance criteria defined during planning. Tasks are sized to be completable in a single agent run.
- **Where it appears:** Plan decomposition, task state machine.
- **Tradeoffs:** More tasks mean more orchestration overhead. But smaller tasks fail faster and cheaper.

## Bounded Execution
- **Problem:** Agents running forever without producing useful output.
- **How:** Each task has a time limit and token budget. If exceeded, the task is failed and escalated.
- **Where:** Orchestrator enforcement.
- **Tradeoffs:** Tight bounds may kill legitimate long-running tasks. Solution: configurable per task type.

## Context Packaging
- **Problem:** Agents receiving irrelevant context that crowds out important information.
- **How:** Context packs are assembled deterministically based on the task type and the files it needs. Progressive disclosure: start with the map (AGENTS.md), include task-specific files, exclude unrelated code.
- **Where:** Orchestrator, before each agent invocation.
- **Tradeoffs:** Too little context causes failures. Too much causes confusion. The harness defines the balance.

## Model Routing
- **Problem:** Using expensive models for trivial tasks or weak models for complex ones.
- **How:** Tasks are tagged with complexity tiers. Opus for planning, architecture, debugging. Sonnet for implementation. Haiku for simple validation queries.
- **Where:** Orchestrator, during agent spawning.
- **Tradeoffs:** Routing heuristics may misclassify. Solution: allow manual override.

## Structured Outputs
- **Problem:** Agents producing ambiguous or unparseable output.
- **How:** Agents are required to produce structured outputs for specific operations (file writes, test definitions, policy updates). The harness enforces schemas.
- **Where:** Agent runtime layer.
- **Tradeoffs:** Structured outputs constrain expressiveness. For implementation tasks, free-form code is fine. For metadata and configuration, structure is enforced.

## Validation Gates
- **Problem:** False success — the agent claims it's done but the output is wrong.
- **How:** Every task must pass its validation gate before being marked complete. Gates include: compilation, lint, type-check, tests, architecture check, policy compliance.
- **Where:** Between task completion and status transition to "completed."
- **Tradeoffs:** Strict gates slow progress. Solution: gate strictness is configurable per policy.

## Deterministic Tests
- **Problem:** Agent-written tests that are designed to pass rather than to validate.
- **How:** Test contracts define what must be tested and to what standard. The test designer writes tests. The validator runs them. But the tests are also auditable — the user can inspect what is being tested.
- **Where:** Test contracts in `harness/test-contracts/`.
- **Tradeoffs:** Test contracts add overhead. But without them, agents write tautological tests.

## Worktree/Sandbox Isolation
- **Problem:** Agent work corrupting the main codebase or interfering with concurrent tasks.
- **How:** Each task operates on its own git worktree within an ephemeral sandbox. The sandbox has full dependency installation and an isolated application instance.
- **Where:** Execution environment layer.
- **Tradeoffs:** Higher infrastructure cost. Slower startup. But essential for reliability.

## Approval Points
- **Problem:** Agents making irreversible decisions without human oversight.
- **How:** Configurable approval gates: always for merge-to-main, optional for intermediate steps. The user can auto-approve low-risk tasks.
- **Where:** Task state machine, approval queue.
- **Tradeoffs:** Too many approvals make the human a bottleneck. Solution: progressive trust — as the system proves reliable, more tasks are auto-approved.

## Retry Semantics
- **Problem:** Blind retries that repeat the same mistake.
- **How:** On failure, the system first classifies the failure type. Then it routes to the appropriate repair strategy: modify context (if the problem was missing information), modify approach (if the implementation was wrong), or escalate (if the problem requires human judgment).
- **Where:** Orchestrator, repair loop logic.
- **Tradeoffs:** Repair loops consume resources. Solution: bounded repair attempts (configurable, default 3).

## Anti-Loop Protections
- **Problem:** Agent caught in a repair loop that never converges.
- **How:** Loop detection: if the same failure occurs N times, or if the agent's output is substantially similar across retries, the loop is broken and the task is escalated.
- **Where:** Orchestrator, loop detector.
- **Tradeoffs:** Aggressive loop detection may kill legitimate iterative improvements. Solution: configurable thresholds.

## Failure Classification
- **Problem:** Treating all failures the same.
- **How:** Failures are classified into: test failure, compilation error, architecture violation, timeout, loop detection, flaky test, false success, insufficient context, bad plan.
- **Where:** Validator, failure analysis surface.
- **Tradeoffs:** Classification can be wrong. Solution: allow human override of classification.

## Architecture Drift Detection
- **Problem:** Agents gradually violating architectural boundaries.
- **How:** Architecture boundaries are encoded as lint rules and structural tests. The validator runs these after every change. Any violation is flagged immediately.
- **Where:** Validator, architecture boundary policy.
- **Tradeoffs:** Requires upfront architecture specification. Solution: the planner generates initial boundaries, the harness maintainer refines them.

## Evidence Requirements
- **Problem:** Tasks marked complete without proof.
- **How:** Each task type has required evidence. Implementation tasks require: tests passing, lint passing, diff recorded. UI tasks additionally require: before/after screenshots. The task cannot transition to "completed" without all required evidence.
- **Where:** Task state machine, evidence model.
- **Tradeoffs:** Evidence collection adds time. But without evidence, "complete" is meaningless.

## Confidence Scoring
- **Problem:** The user cannot distinguish between high-confidence and low-confidence completions.
- **How:** Each completed task gets a confidence score based on: test coverage, validation gate results, repair loop count, known risk factors. High-confidence tasks can be auto-approved. Low-confidence tasks require review.
- **Where:** Task completion logic, approval queue.
- **Tradeoffs:** Confidence scores can be misleading. Solution: expose the factors behind the score.

---

# 14. Technical Architecture

## Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                            │
│  React + TypeScript + TailwindCSS                           │
│  Three-pane layout: sidebar / center / inspector            │
│  WebSocket connection for real-time updates                  │
│  Monaco editor for file viewing/editing                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS + WSS
┌────────────────────────▼────────────────────────────────────┐
│                    API GATEWAY                               │
│  Auth (OAuth via GitHub), rate limiting, routing             │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│  REST API   │  │  WebSocket   │  │  Webhook     │
│  Server     │  │  Server      │  │  Receiver    │
│  (CRUD,     │  │  (Real-time  │  │  (GitHub     │
│  queries)   │  │  events)     │  │  events)     │
└──────┬──────┘  └──────┬───────┘  └──────┬───────┘
       │                │                  │
       └────────┬───────┴──────────┬───────┘
                ▼                  ▼
┌──────────────────────┐  ┌──────────────────────┐
│  ORCHESTRATION       │  │  EVENT BUS           │
│  ENGINE              │  │  (Redis Streams or   │
│  Task graph manager, │  │  NATS)               │
│  scheduler, state    │  │  Event routing,      │
│  machine, context    │  │  pub/sub             │
│  packager            │  │                      │
└──────────┬───────────┘  └──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  JOB QUEUE           │
│  (BullMQ on Redis)   │
│  Agent task dispatch, │
│  retry logic,         │
│  priority scheduling  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  AGENT RUNTIME                                │
│  Sandboxed execution environments             │
│  Git worktrees per task                       │
│  Tool access: file I/O, shell, browser, APIs  │
│  Evidence collection                          │
│  Token/cost metering                          │
└──────────────────────────────────────────────┘
```

## Data Stores

| Store | Technology | Data |
|-------|-----------|------|
| **Primary DB** | PostgreSQL | Workspaces, tasks, runs, users, plans, policies, approvals |
| **State Store** | Redis | Task state machine, real-time execution state, locks |
| **Event Stream** | Redis Streams or NATS | Execution events, status transitions, log events |
| **Artifact Storage** | S3-compatible (MinIO for self-host) | Evidence bundles, screenshots, large logs |
| **Search/Index** | MeiliSearch or TypeSense | Full-text search across repo files, docs, logs |
| **GitHub** | GitHub API + webhooks | Source of truth for code, docs, harness files |

## Control Flow

1. User action (approve plan, click Build) → REST API → Orchestration Engine
2. Orchestration Engine decomposes plan → creates tasks → enqueues to Job Queue
3. Job Queue dispatches tasks to Agent Runtime
4. Agent Runtime executes, streams events to Event Bus
5. Event Bus → WebSocket Server → Frontend (real-time updates)
6. Agent Runtime completes → evidence captured → Orchestration Engine updates task state
7. State transitions → validation gates → next task dispatched or escalation

## Data Flow

- **Repo → Agent:** Context packaging reads repo files, assembles context pack, sends to agent
- **Agent → Repo:** Agent writes files to worktree, commits, pushes to feature branch
- **Agent → DB:** Evidence, logs, metrics stored in artifact storage
- **DB → Frontend:** Task states, run history, evidence bundles served via REST API
- **Frontend ← Event Bus:** Real-time state updates, log streaming via WebSocket

## GitHub Integration Layer

A dedicated service handles all GitHub operations:
- OAuth authentication
- Repository creation and cloning
- Branch management
- Commit and push operations
- PR creation and management
- Webhook processing (push events, PR events, review events)
- File sync (ensuring web app view matches repo state)

---

# 15. Execution Environment Model

## Options Analysis

| Option | Security | Reproducibility | Cost | Speed | Secrets | Best For |
|--------|----------|----------------|------|-------|---------|----------|
| **Hosted containers** | High | High | Medium | Medium | Managed | MVP |
| **Ephemeral VMs** | Highest | Highest | High | Slow | Most isolated | Enterprise |
| **Worktrees on connected runners** | Medium | Medium | Low | Fast | Shared | Local dev |
| **Browser-based (WebContainers)** | Medium | Medium | Low | Fast | Limited | Simple projects |
| **Hybrid local/remote** | Mixed | Mixed | Variable | Variable | Complex | Flexibility |

## MVP Recommendation

**Hosted ephemeral containers (Docker-based).**

Each build gets a container with:
- The repo cloned and dependencies installed
- A git worktree per concurrent task
- Shell access for build/test commands
- Network access for package installation and API calls (with egress filtering)
- Browser automation (Playwright) for UI validation
- Ephemeral observability stack (logs, metrics) per container

The container is torn down after the build completes. Evidence is extracted before teardown.

## Long-Term Recommendation

**Ephemeral VMs with snapshot-based fast-start.**

VMs provide stronger isolation (important for multi-tenant) and can support full OS-level tooling. Use snapshot-based provisioning (Firecracker-style) to keep startup under 5 seconds. Each build gets a fresh VM with the repo pre-warmed.

---

# 16. GitHub-Native Lifecycle

## Core Operations

| Operation | When | How |
|-----------|------|-----|
| **Create repo** | New project, user approves | GitHub API `POST /user/repos` under user's account |
| **Connect repo** | Existing project | OAuth grant, webhook registration |
| **Clone to sandbox** | Build start | `git clone` into ephemeral container |
| **Create branch** | Build start | `git checkout -b forge/phase-N-description` |
| **Create worktrees** | Per concurrent task | `git worktree add` within sandbox |
| **Commit changes** | Task completion | `git add && git commit` with structured message |
| **Push branch** | After validation | `git push origin forge/...` |
| **Open PR** | Phase completion | GitHub API `POST /repos/{owner}/{repo}/pulls` |
| **Sync harness** | After harness changes | Commit and push to feature branch |
| **Merge** | Human approval | GitHub API merge |

## Repo Ownership

The user always owns the repo. Forge operates via an OAuth token with repo scope. The user can revoke access at any time. If the user leaves Forge, their repo is complete and usable — all code, docs, plans, and harness files are in the repo.

## Source of Truth Principle

GitHub is always authoritative. The web app reads from GitHub and caches locally. If there is a conflict, GitHub wins. The user can make changes directly on GitHub (via another tool) and Forge will sync.

---

# 17. Domain Model / Internal Objects

## Core Objects

### Workspace
- **Fields:** id, name, user_id, github_repo_url, created_at, updated_at, status (active/archived)
- **Relationships:** has many Tasks, Plans, ResearchRuns, AgentRuns
- **Lifecycle:** Created when user starts a project. Active during development. Archived when done.
- **Storage:** PostgreSQL

### Task
- **Fields:** id, workspace_id, plan_id, title, description, type (implement/test/validate/doc/review), status (see state machine), agent_type, dependencies (task_ids), acceptance_criteria, context_pack_spec, model_tier, created_at, started_at, completed_at, cost_tokens, cost_usd
- **Relationships:** belongs to Plan, has many AgentRuns, has many ValidationRuns, has one EvidenceBundle
- **Lifecycle:** See state machine (Section 18)
- **Storage:** PostgreSQL

### Plan
- **Fields:** id, workspace_id, title, phase_number, status (draft/active/completed/superseded), content_path (repo path), tasks (ordered list)
- **Relationships:** belongs to Workspace, has many Tasks
- **Lifecycle:** Drafted by planner → approved by user → active during build → completed or superseded
- **Storage:** PostgreSQL metadata + repo for content

### ResearchRun
- **Fields:** id, workspace_id, question, status (pending/running/complete), sub_agent_count, report_path (repo path), created_at, completed_at, cost_tokens
- **Relationships:** belongs to Workspace, has many ResearchSubRuns
- **Lifecycle:** Proposed → approved → running → complete
- **Storage:** PostgreSQL metadata + repo for report

### AgentRun
- **Fields:** id, task_id, agent_type, model_used, status (running/completed/failed), started_at, completed_at, tokens_in, tokens_out, cost_usd
- **Relationships:** belongs to Task, has one EvidenceBundle
- **Lifecycle:** Started → running → completed/failed
- **Storage:** PostgreSQL

### ValidationRun
- **Fields:** id, task_id, checks (array of check results), overall_status (pass/fail), run_at
- **Relationships:** belongs to Task
- **Storage:** PostgreSQL

### EvidenceBundle
- **Fields:** id, task_id, agent_run_id, context_pack_hash, files_read, files_written, commands_run, diffs, test_results, screenshots_urls, logs_url, traces_url, confidence_score
- **Relationships:** belongs to Task and AgentRun
- **Storage:** PostgreSQL metadata + S3 for large artifacts

### FailureReport
- **Fields:** id, task_id, agent_run_id, classification, error_output, root_cause_hypothesis, repair_attempts, remediation_applied, resolved
- **Relationships:** belongs to Task
- **Storage:** PostgreSQL

### Policy
- **Fields:** id, workspace_id, type (validation/approval/retry/escalation/architecture), name, content (YAML), active, created_at, violation_count
- **Relationships:** belongs to Workspace
- **Storage:** PostgreSQL metadata + repo for content

### ContextPack
- **Fields:** id, task_id, agent_run_id, files_included (paths + hashes), harness_files_included, total_tokens, assembled_at
- **Relationships:** belongs to AgentRun
- **Storage:** PostgreSQL

### ExecutionNode (Graph rendering)
- **Fields:** id, task_id, position (x, y), status, group_id (phase), edges_in, edges_out
- **Relationships:** Derived from Task graph
- **Storage:** Redis (ephemeral, recomputed from task state)

---

# 18. Task State Machine

```
                    ┌──────────┐
                    │ DRAFTED  │
                    └────┬─────┘
                         │ plan approved
                         ▼
                    ┌──────────┐
              ┌────►│ QUEUED   │
              │     └────┬─────┘
              │          │ dependencies met + resources available
              │          ▼
              │     ┌──────────┐
              │     │ RUNNING  │◄──────────────────────────┐
              │     └────┬─────┘                           │
              │          │ agent completes                  │
              │          ▼                                  │
              │     ┌───────────┐                          │
              │     │VALIDATING │                          │
              │     └────┬──────┘                          │
              │          │                                  │
              │     ┌────┴────┐                            │
              │     │         │                             │
              │     ▼         ▼                             │
              │ ┌────────┐ ┌────────┐                     │
              │ │ PASSED │ │ FAILED │                     │
              │ └───┬────┘ └───┬────┘                     │
              │     │          │                            │
              │     │          ▼                            │
              │     │     ┌──────────┐     repair          │
              │     │     │REPAIRING │─────succeeds────────┘
              │     │     └────┬─────┘
              │     │          │ repair exhausted
              │     │          ▼
              │     │     ┌──────────────┐
              │     │     │  BLOCKED     │
              │     │     │(needs human) │
              │     │     └──────┬───────┘
              │     │            │ human provides input
              │     │            ▼
              │     │     ┌──────────────┐
              │     │     │  RE-SCOPED   │──► back to QUEUED
              │     │     └──────────────┘
              │     │
              │     ▼
              │ ┌────────────┐
              │ │ AWAITING   │
              │ │ APPROVAL   │
              │ └────┬───────┘
              │      │
              │ ┌────┴──────┐
              │ │           │
              │ ▼           ▼
              │┌─────────┐ ┌──────────┐
              ││COMPLETED│ │CHANGES   │──► back to QUEUED
              │└────┬────┘ │REQUESTED │
              │     │      └──────────┘
              │     ▼
              │┌─────────┐
              ││ MERGED  │
              │└────┬────┘
              │     ▼
              │┌──────────┐
              └│ ARCHIVED │
               └──────────┘
```

**Key transitions:**
- **DRAFTED → QUEUED:** Plan approved by user
- **QUEUED → RUNNING:** Dependencies satisfied, resources available
- **RUNNING → VALIDATING:** Agent produces output
- **VALIDATING → PASSED → AWAITING_APPROVAL:** All gates pass, needs human review (if configured)
- **VALIDATING → FAILED → REPAIRING:** Gate fails, repair loop begins
- **REPAIRING → RUNNING:** Repair attempt (modified context or approach)
- **REPAIRING → BLOCKED:** Repair attempts exhausted, escalated to human
- **BLOCKED → RE-SCOPED → QUEUED:** Human provides new direction
- **AWAITING_APPROVAL → COMPLETED:** Human approves
- **AWAITING_APPROVAL → CHANGES_REQUESTED → QUEUED:** Human requests changes
- **COMPLETED → MERGED:** PR merged
- **MERGED → ARCHIVED:** Phase complete, task archived

---

# 19. Failure Modes and UI Handling

| Failure Mode | Detection | User Sees | Next Action |
|-------------|-----------|-----------|-------------|
| **Bad plan** | Build fails systematically across multiple tasks | Multiple red nodes, pattern indicator | Re-enter planner mode, revise plan |
| **Bad research** | Plan based on incorrect research findings | Research quality flag in failure analysis | Re-run research with different scope |
| **Incomplete context** | Agent output misses constraints that exist in repo | Diff shows violation of existing code patterns | Update context packaging rules |
| **Agent loops** | Same error repeated N times | Loop detection badge on node, amber warning | Auto-escalation, human re-scopes |
| **False success** | Tests pass but behavior is wrong | Requires human review — confidence score is low if coverage is thin | Improve test contracts, add manual review gate |
| **Silent regression** | Existing tests break | Test delta report (N tests went from pass to fail) | Debugger agent investigates, human reviews |
| **Doc drift** | Docs don't match code | Staleness indicator on harness files | Doc updater runs, human reviews |
| **Architecture drift** | Code violates boundary rules | Architecture check failure in validation | Immediate flag, block merge |
| **Flaky tests** | Test passes/fails inconsistently | Flaky test indicator, excluded from gate blocking | Quarantine, fix separately |
| **Permission issues** | GitHub API errors | Error banner with specific permission needed | User re-authenticates with correct scopes |
| **Broken sandbox** | Container fails to boot | Environment error, clear error message | Retry provisioning, check dependencies |
| **Cost explosion** | Token budget exceeded | Cost warning, budget limit reached | Pause execution, user decides to continue or stop |
| **Execution dead ends** | Agent cannot make progress | Task stuck in running with no output for N minutes | Timeout, escalate to human |
| **UX overload** | Too many runs/nodes | Graph becomes unreadable | Phase collapsing, status filtering, swimlane view |

---

# 20. Evaluation and Metrics

## Primary Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **Validated completion rate** | % of tasks that pass all validation gates on first attempt | >70% |
| **False positive completion rate** | % of "completed" tasks that later reveal defects | <5% |
| **Time to trustworthy completion** | Time from Build click to all tasks validated | Track trend, minimize |
| **Retry count** | Average repair attempts per task | <1.5 |
| **Human intervention rate** | % of tasks requiring human input | <20% |
| **Regression rate** | % of builds that introduce regressions | <5% |
| **Documentation freshness** | % of harness docs updated within last N runs | >80% |
| **Harness coverage** | % of project aspects covered by explicit policies | Track and improve |
| **Evidence completeness** | % of completed tasks with full evidence bundles | >95% |
| **Task abandonment rate** | % of tasks that are abandoned (never completed) | <10% |
| **Plan-to-build conversion** | % of planner sessions that reach Build | Track as product metric |
| **Plan revision rate** | Number of plan revisions before Build | Track (higher early, lower over time) |
| **PR acceptance rate** | % of Forge-generated PRs merged without changes | >80% |

## Benchmarking

Benchmark projects (internal): Build a TodoMVC app, build a REST API with CRUD, build a CLI tool with tests. Measure all metrics on these standard benchmarks to track system improvement over time.

---

# 21. MVP Proposal

## Target User
Solo technical founder or small team (1-3 engineers) building a new web application from scratch.

## Target Use Case
Greenfield full-stack web app (Next.js or similar) with database, API, and frontend.

## Must-Have Surfaces (MVP)
1. **Planner chat** — Consultative conversation with high-reasoning model
2. **File navigator** (left sidebar) — Browse repo files, docs, plans, harness
3. **Execution graph** (center) — Task nodes with status, basic graph view only (no timeline/swimlane yet)
4. **Inspector** (right) — Logs, diffs, test results, approval buttons
5. **Build transition** — "Ready to Build?" → "Build" gate

## Minimal Orchestration
- Sequential task execution (no parallelism in MVP)
- Three agent types: planner, implementer, validator
- Single repair loop (1 retry on failure, then escalate)
- BullMQ job queue on Redis

## Minimal Harness
- AGENTS.md generation
- Basic coding conventions (lint + type-check)
- Test contract: "unit tests required for all new functions"
- Architecture doc: generated but not mechanically enforced (no custom linters in MVP)

## Minimal GitHub Integration
- Create repo under user's GitHub account
- Single feature branch per build
- Commit after each task
- Open PR when build completes
- No worktree isolation (serial execution eliminates the need)

## Minimal Evidence
- Diffs recorded per task
- Test results recorded per task
- Logs stored per task
- No screenshots, no browser automation

## Minimal Research/Planner
- Planner chat with Opus-class model
- Deep research: single-agent web search (no parallel sub-agents yet)
- Research outputs committed to `research/`

## What Is Deferred
- Parallel task execution
- Swimlane/timeline views
- Browser automation and screenshots
- Custom linter generation
- Architecture boundary enforcement (mechanical)
- Harness auto-evolution from failure patterns
- Multi-tenant
- Ephemeral VMs (use containers)
- Advanced approval workflows
- Cost optimization / model routing
- Run history analytics

## Why This Is the Right Cut

The MVP tests the core thesis: does a planning → harness → build → validate pipeline, with repo-native artifacts and a control plane UI, produce better outcomes than prompting a coding agent directly? If users complete builds with higher confidence and fewer manual interventions than using Cursor/Copilot/Claude Code alone, the thesis is validated.

---

# 22. Final Recommendation

## Product Shape
Build Forge as a repo-native agentic engineering control plane. Not a canvas. Not a chat wrapper. Not an IDE plugin. A standalone web app that governs agent development work against a real GitHub repository.

## UI Shape
Three-pane layout: IDE file tree (left), execution graph (center), evidence inspector (right). Planner mode occupies the center pane before build. The execution graph occupies the center pane during and after build. Files open in tabs over the center pane.

## Orchestration Model
DAG-based deterministic orchestration with agent autonomy within tasks. The orchestrator decides what runs when. Agents decide how to accomplish their assigned task. This is not negotiable — autonomous multi-agent coordination without a deterministic backbone produces unreliable results.

## Harness Strategy
Generate harness artifacts during planning. Commit to repo. Enforce mechanically during build. Evolve based on failure patterns. The harness is the product moat. Models improve for everyone. The harness is specific to each project and compounds over time.

## Repo Strategy
GitHub is the source of truth. All durable artifacts live in the repo. The web app is a view + governance layer. The user is never locked in.

## Agent Specialization Strategy
Prefer fewer, well-defined roles over an army of persona agents. Planner (Opus), Implementer (Sonnet), Validator (mostly deterministic), Debugger (Opus), Doc Updater (Sonnet). Add roles only when a clear functional boundary justifies them.

## Evidence Strategy
Every completed task must have an evidence bundle. Evidence is how the user decides whether to trust the output. No evidence = no completion.

## MVP Cut
Planner chat + file sidebar + execution graph + inspector + sequential build + basic harness + GitHub integration. Ship this in 6-8 weeks. Validate the thesis.

## What to Build First
The planner. If the planning experience is excellent — if users feel like they're working with a technical cofounder who clarifies, challenges, and structures their idea before building — the product has a core loop worth investing in. Build the planner first, connect it to GitHub for artifact commits, and validate that users prefer this over prompting directly.

## What to Avoid
1. Do not build a visually impressive graph with weak semantics. Every node must map to a real task with real evidence.
2. Do not store documents in the UI. Everything lives in the repo.
3. Do not let agents modify the task graph. Orchestration is deterministic.
4. Do not build multi-tenant before the single-user experience is excellent.
5. Do not optimize model routing before the pipeline works reliably with one model.

## What Design Choice Matters Most
The separation between planning and building. The "Ready to Build?" gate is the most important UX decision in the product. It forces clarity before execution. It prevents the collapse of intent and implementation into one uncontrolled loop. It is the difference between a tool that generates code and a system that builds software.

---

# Appendix A — Proposed Folder Structure (Product Itself)

```
forge/
├── apps/
│   ├── web/                    # Frontend (React + TypeScript)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── sidebar/    # File tree, docs tree, harness tree
│   │   │   │   ├── graph/      # Execution graph, timeline, swimlane
│   │   │   │   ├── inspector/  # Evidence panel, approval controls
│   │   │   │   ├── planner/    # Planner chat, artifact preview
│   │   │   │   ├── editor/     # File editor (Monaco-based)
│   │   │   │   └── common/     # Shared UI components
│   │   │   ├── hooks/
│   │   │   ├── stores/         # State management
│   │   │   ├── services/       # API clients, WebSocket client
│   │   │   └── types/
│   │   └── public/
│   │
│   └── api/                    # Backend (Node.js + TypeScript)
│       ├── src/
│       │   ├── routes/         # REST API routes
│       │   ├── ws/             # WebSocket handlers
│       │   ├── webhooks/       # GitHub webhook handlers
│       │   ├── orchestrator/   # Task graph, scheduler, state machine
│       │   ├── agents/         # Agent runtime, context packaging
│       │   ├── github/         # GitHub API integration
│       │   ├── sandbox/        # Execution environment management
│       │   ├── harness/        # Harness file management
│       │   ├── evidence/       # Evidence collection and storage
│       │   ├── validation/     # Validation gate runner
│       │   ├── models/         # Database models (Prisma)
│       │   └── events/         # Event bus publishers/subscribers
│       └── prisma/
│           └── schema.prisma
│
├── packages/
│   ├── shared/                 # Shared types, utilities
│   └── harness-templates/      # Default harness file templates
│
├── infra/
│   ├── docker/                 # Container definitions for sandboxes
│   ├── terraform/              # Cloud infrastructure
│   └── k8s/                    # Kubernetes manifests (if applicable)
│
└── docs/
    ├── architecture.md
    ├── design-decisions/
    └── api-reference/
```

---

# Appendix B — Suggested Repo Artifact Structure for User Projects

```
my-project/
├── AGENTS.md                   # Short map (~100 lines). Points to deeper docs.
├── ARCHITECTURE.md             # Top-level architecture: domains, layers, boundaries
│
├── src/                        # Application source code
│   └── ...
│
├── docs/
│   ├── requirements.md         # What the system must do
│   ├── architecture.md         # Detailed architecture (expanded from root)
│   ├── design-docs/            # Architecture Decision Records
│   │   ├── index.md
│   │   └── 001-database-choice.md
│   ├── product-specs/          # Product specifications
│   └── generated/              # Auto-generated docs (schema, API)
│
├── plans/
│   ├── active/                 # Currently executing plans
│   │   └── phase-1.md
│   ├── completed/              # Archived plans with decision logs
│   └── tech-debt-tracker.md    # Known debt, remediation timeline
│
├── research/
│   ├── feasibility-report.md   # Pre-build feasibility research
│   ├── api-investigation.md    # API/library research
│   └── architecture-alternatives.md
│
├── harness/
│   ├── policies/
│   │   ├── reliability.yaml    # Validation gates, retry rules
│   │   ├── coding-conventions.yaml
│   │   └── architecture-boundaries.yaml
│   ├── test-contracts/
│   │   ├── unit-test-requirements.md
│   │   └── e2e-test-requirements.md
│   ├── acceptance-criteria.md  # Project-level definition of done
│   ├── escalation-rules.yaml   # When to stop and ask the human
│   └── context-packaging.yaml  # What context each agent role receives
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── .forge/
    └── run-metadata/           # Local run metadata (gitignored)
```

**What belongs where:**
- `docs/` — Durable project knowledge: what the system is, how it works, why decisions were made
- `plans/` — Execution plans: what to build, in what order, with what acceptance criteria
- `research/` — Investigation outputs: feasibility, API research, competitive analysis
- `harness/` — Agent governance: rules, policies, conventions, test contracts
- `tests/` — Test code: unit, integration, e2e
- `.forge/` — Forge-specific metadata (gitignored, ephemeral)

---

# Appendix C — Sample AGENTS.md

```markdown
# AGENTS.md

## Repository Map

This is a full-stack web application for compression arbitrage on Polymarket.

### Structure
- `src/core/` — Domain logic: order book parsing, spread detection, position management
- `src/services/` — External integrations: Polymarket CLOB API, WebSocket feeds
- `src/api/` — REST API endpoints for the web dashboard
- `src/ui/` — React frontend for monitoring and control
- `tests/` — All tests (unit, integration, e2e)

### Key Documents
- `docs/requirements.md` — System requirements and acceptance criteria
- `docs/architecture.md` — Architecture overview, domain layering, dependency rules
- `harness/policies/reliability.yaml` — Validation and retry policies
- `plans/active/` — Current execution plan

### Architecture Rules
- Dependency direction: Types → Config → Service → API → UI
- Cross-cutting concerns (auth, telemetry) enter through Providers only
- All data shapes validated at boundaries (Zod or equivalent)
- No direct imports across domain boundaries

### Conventions
- TypeScript strict mode
- All exports must have JSDoc
- File size limit: 300 lines
- One function per file for service-layer modules
- Structured logging only (no console.log)

### Testing Requirements
- Unit tests required for all domain logic functions
- Integration tests required for all API endpoints
- Minimum 80% line coverage for `src/core/`

### When You Are Stuck
1. Read `docs/architecture.md` for structural guidance
2. Check `plans/active/` for task context
3. Check `harness/policies/` for rules
4. If still stuck, stop and escalate — do not guess
```

---

# Appendix D — Sample Reliability Policy

```yaml
# harness/policies/reliability.yaml

validation_gates:
  after_each_task:
    - type: compilation
      required: true
      blocking: true
    - type: lint
      required: true
      blocking: true
      config:
        rules: "harness/policies/coding-conventions.yaml"
    - type: type_check
      required: true
      blocking: true
    - type: unit_tests
      required: true
      blocking: true
      config:
        scope: "affected_files"
    - type: architecture_check
      required: true
      blocking: true
      config:
        rules: "harness/policies/architecture-boundaries.yaml"

  after_each_phase:
    - type: full_test_suite
      required: true
      blocking: true
    - type: coverage_check
      required: true
      blocking: false
      config:
        minimum_line_coverage: 0.80
        scope: "src/core/"

retry_policy:
  max_repair_attempts: 3
  strategies:
    - on: test_failure
      action: targeted_fix
      description: "Debugger agent analyzes failure and produces targeted fix"
    - on: compilation_error
      action: targeted_fix
    - on: architecture_violation
      action: re_scope
      description: "Task is re-scoped to comply with architecture boundaries"
    - on: timeout
      action: escalate
      description: "Timeout indicates fundamental problem, escalate to human"
    - on: loop_detected
      action: escalate

escalation_rules:
  - condition: repair_attempts_exhausted
    action: block_and_notify
  - condition: cost_exceeds_budget
    threshold_usd: 5.00
    action: pause_and_notify
  - condition: architecture_violation_persists
    action: block_and_notify
  - condition: human_approval_required
    scope: [merge_to_main, plan_change, harness_policy_change]
    action: queue_for_approval

approval_policy:
  auto_approve:
    - type: doc_update
      confidence_threshold: 0.9
    - type: test_addition
      confidence_threshold: 0.9
  require_human:
    - type: merge_to_main
    - type: plan_revision
    - type: harness_policy_change
    - type: new_dependency_added

evidence_requirements:
  implementation_task:
    required: [diff, test_results, lint_results, compilation_status]
    optional: [screenshots, browser_trace]
  test_task:
    required: [test_files_created, coverage_delta]
  documentation_task:
    required: [diff, freshness_check]
```

---

# Appendix E — Sample Task Execution Trace

```
=== Task Execution Trace ===
Task: TASK-007 — Implement WebSocket connection handler
Agent: Implementer (claude-sonnet-4)
Started: 2026-03-09T14:23:01Z
Duration: 4m 38s

[14:23:01] CONTEXT_PACK assembled
           Files included: AGENTS.md, docs/architecture.md,
           harness/policies/coding-conventions.yaml,
           src/services/polymarket-api.ts (existing),
           plans/active/phase-1.md (task description)
           Total tokens: 12,847

[14:23:03] AGENT_START
           Task: "Implement WebSocket connection handler for
           Polymarket price feeds. Must handle reconnection,
           heartbeat, and message parsing per CLOB API docs."

[14:23:15] FILE_READ src/services/polymarket-api.ts
[14:23:18] FILE_READ docs/architecture.md (service layer section)
[14:23:22] FILE_CREATE src/services/websocket-handler.ts (287 lines)
[14:24:01] FILE_CREATE src/types/websocket-messages.ts (54 lines)
[14:24:30] FILE_MODIFY src/services/index.ts (add export)
[14:25:12] SHELL_EXEC npx tsc --noEmit → EXIT 0
[14:25:18] FILE_CREATE tests/unit/websocket-handler.test.ts (142 lines)
[14:25:45] SHELL_EXEC npx vitest run tests/unit/websocket-handler.test.ts
           → 8/8 passed, EXIT 0

[14:26:22] AGENT_COMPLETE

[14:26:23] VALIDATION_START
[14:26:24] CHECK compilation → PASS
[14:26:26] CHECK lint → PASS
[14:26:27] CHECK type_check → PASS
[14:26:30] CHECK unit_tests (affected) → PASS (8/8)
[14:26:35] CHECK architecture_check → PASS
[14:26:36] VALIDATION_COMPLETE → ALL GATES PASSED

[14:26:36] STATUS → AWAITING_APPROVAL
           Confidence: 0.92
           Evidence: diff (3 files), tests (8 pass), lint (clean)

[14:27:39] HUMAN_APPROVED (user: marco)
[14:27:40] STATUS → COMPLETED
[14:27:41] COMMIT abc1234 "feat: WebSocket connection handler"
```

---

# Appendix F — Sample UI State Model

```typescript
interface ForgeUIState {
  // Current workspace
  workspace: {
    id: string;
    name: string;
    repoUrl: string;
    status: 'planning' | 'building' | 'reviewing' | 'idle';
  };

  // Left sidebar
  sidebar: {
    activeTab: 'files' | 'docs' | 'harness' | 'changes' | 'search';
    expandedPaths: Set<string>;
    selectedFile: string | null;
    openTabs: Array<{ path: string; modified: boolean }>;
    searchQuery: string;
    changedFiles: Array<{ path: string; taskId: string; changeType: 'added' | 'modified' | 'deleted' }>;
  };

  // Center pane
  center: {
    mode: 'planner' | 'graph' | 'file' | 'research';
    graph: {
      view: 'dag' | 'timeline' | 'swimlane';
      selectedNodeId: string | null;
      collapsedGroups: Set<string>;
      statusFilter: Set<TaskStatus>;
      zoomLevel: number;
      nodes: Array<GraphNode>;
      edges: Array<GraphEdge>;
    };
    planner: {
      messages: Array<PlannerMessage>;
      generatedArtifacts: Array<{ path: string; status: 'draft' | 'committed' }>;
      readyToBuild: boolean;
    };
  };

  // Right inspector
  inspector: {
    visible: boolean;
    selectedType: 'task' | 'file' | 'failure' | null;
    taskDetail: TaskDetail | null;
    fileDetail: FileDetail | null;
    failureDetail: FailureDetail | null;
  };

  // Global
  approvalQueue: Array<ApprovalItem>;
  activeBuild: BuildState | null;
  notifications: Array<Notification>;
}
```

---

# Appendix G — Sample Event Taxonomy

```
# Orchestration Events
task.created
task.queued
task.started
task.completed
task.failed
task.repair.started
task.repair.succeeded
task.repair.failed
task.blocked
task.escalated
task.approved
task.rejected
task.re_scoped
task.archived

# Agent Events
agent.spawned
agent.context_packed
agent.file.read
agent.file.written
agent.shell.executed
agent.browser.screenshot
agent.completed
agent.failed
agent.timeout

# Validation Events
validation.started
validation.check.passed
validation.check.failed
validation.completed
validation.gate.blocked

# Plan Events
plan.drafted
plan.revised
plan.approved
plan.build_started
plan.phase_completed
plan.superseded

# Research Events
research.proposed
research.approved
research.subagent.started
research.subagent.completed
research.synthesizing
research.completed
research.committed

# Repo Events
repo.created
repo.connected
repo.branch.created
repo.commit
repo.push
repo.pr.opened
repo.pr.merged
repo.pr.closed

# Harness Events
harness.file.created
harness.file.updated
harness.policy.violated
harness.policy.updated
harness.drift.detected

# System Events
sandbox.provisioned
sandbox.destroyed
cost.threshold.warning
cost.threshold.exceeded
loop.detected
```

---

# Appendix H — Sample Task State Machine (Formal)

```
States: {
  DRAFTED,
  QUEUED,
  RUNNING,
  VALIDATING,
  PASSED,
  FAILED,
  REPAIRING,
  BLOCKED,
  RE_SCOPED,
  AWAITING_APPROVAL,
  COMPLETED,
  CHANGES_REQUESTED,
  MERGED,
  ARCHIVED,
  CANCELLED
}

Transitions: {
  DRAFTED          → QUEUED              [plan_approved]
  DRAFTED          → CANCELLED           [plan_superseded]
  QUEUED           → RUNNING             [deps_met AND resources_available]
  QUEUED           → CANCELLED           [plan_superseded]
  RUNNING          → VALIDATING          [agent_output_produced]
  RUNNING          → FAILED              [agent_timeout OR agent_crash]
  VALIDATING       → PASSED              [all_gates_pass]
  VALIDATING       → FAILED              [any_gate_fails]
  PASSED           → AWAITING_APPROVAL   [approval_required]
  PASSED           → COMPLETED           [auto_approve_eligible]
  FAILED           → REPAIRING           [repair_budget > 0]
  FAILED           → BLOCKED             [repair_budget == 0]
  REPAIRING        → RUNNING             [repair_attempt_starts]
  BLOCKED          → RE_SCOPED           [human_provides_direction]
  BLOCKED          → CANCELLED           [human_cancels]
  RE_SCOPED        → QUEUED              [re_scoped_task_ready]
  AWAITING_APPROVAL→ COMPLETED           [human_approves]
  AWAITING_APPROVAL→ CHANGES_REQUESTED   [human_requests_changes]
  CHANGES_REQUESTED→ QUEUED              [changes_applied]
  COMPLETED        → MERGED              [pr_merged]
  MERGED           → ARCHIVED            [phase_complete]
}

Invariants:
  - A task cannot enter RUNNING if any dependency is not COMPLETED
  - A task cannot enter COMPLETED without a non-empty evidence bundle
  - REPAIRING increments repair_attempt_count; if >= max_repair_attempts, must transition to BLOCKED
  - CANCELLED is terminal
  - ARCHIVED is terminal
```

---

# Appendix I — Sample "Ready to Build" Handoff Package

```yaml
# Handoff package: planner → build orchestrator

project:
  name: "Polymarket Compression Arbitrage Engine"
  description: "Automated system that detects and exploits mispriced YES/NO binary pairs on Polymarket"
  repo: "github.com/marcoparedes/polymarket-arb"
  branch: "forge/phase-1-core-engine"

plan:
  ref: "plans/active/phase-1.md"
  phase: 1
  title: "Core Engine"
  tasks:
    - id: TASK-001
      title: "Initialize repo structure and dependencies"
      type: scaffold
      agent: implementer
      dependencies: []
      acceptance: "Project compiles. Lint passes. Test runner configured."

    - id: TASK-002
      title: "Implement Polymarket CLOB API client"
      type: implement
      agent: implementer
      dependencies: [TASK-001]
      acceptance: "Authenticated API calls succeed. Rate limiting handled. Types defined."

    - id: TASK-003
      title: "Implement WebSocket price feed handler"
      type: implement
      agent: implementer
      dependencies: [TASK-001]
      acceptance: "Real-time price updates received. Reconnection logic works. Heartbeat maintained."

    - id: TASK-004
      title: "Implement spread detection algorithm"
      type: implement
      agent: implementer
      dependencies: [TASK-002, TASK-003]
      acceptance: "Correctly identifies when pY + pN + fees < 1.00 - min_edge. Unit tests pass."

    - id: TASK-005
      title: "Write comprehensive test suite"
      type: test
      agent: test_designer
      dependencies: [TASK-002, TASK-003, TASK-004]
      acceptance: ">80% coverage on src/core/. Edge cases covered."

    - id: TASK-006
      title: "Validate full pipeline"
      type: validate
      agent: validator
      dependencies: [TASK-005]
      acceptance: "All tests pass. Lint clean. Architecture check passes."

harness:
  agents_md: "harness/AGENTS.md"
  architecture: "docs/architecture.md"
  policies: "harness/policies/reliability.yaml"
  conventions: "harness/policies/coding-conventions.yaml"
  test_contracts: "harness/test-contracts/unit-test-requirements.md"

research:
  refs:
    - "research/polymarket-clob-api-investigation.md"
    - "research/compression-arb-feasibility.md"

risk_flags:
  - "Polymarket API rate limits may constrain real-time operation"
  - "WebSocket reconnection edge cases need careful testing"
  - "Fee calculation precision critical — floating point errors could cause losses"

estimates:
  tasks: 6
  estimated_duration: "15-30 minutes"
  estimated_cost: "$2-5 in API tokens"
```

---

# Appendix J — Sample Definition-of-Done Contract

```yaml
# harness/acceptance-criteria.md (rendered as YAML for precision)

definition_of_done:
  task_level:
    implementation:
      - code compiles without errors
      - lint passes with zero warnings
      - type-check passes in strict mode
      - unit tests exist for all public functions
      - unit tests pass
      - no files exceed 300 lines
      - all functions have JSDoc documentation
      - no console.log statements (structured logging only)
      - architecture boundary check passes
      - diff is recorded in evidence bundle

    test:
      - test files are syntactically valid
      - all new tests pass
      - no existing tests broken
      - coverage delta is non-negative
      - edge cases documented in test comments

    documentation:
      - doc reflects current code behavior
      - no stale references
      - links to source files are valid
      - freshness timestamp updated

  phase_level:
    - all tasks in phase are COMPLETED
    - full test suite passes
    - coverage meets minimum threshold (80% for core)
    - architecture check passes on full repo
    - AGENTS.md is current
    - no open BLOCKED tasks
    - PR is open with clean diff

  project_level:
    - all phases completed
    - acceptance criteria from requirements.md are met
    - documentation is comprehensive and current
    - harness policies have zero unresolved violations
    - user has reviewed and approved final PR
```

---

# Phase 1 Decision Summary

## Recommended Product Shape
A repo-native agentic engineering control plane with a technical cofounder planner, deep research capability, multi-agent build orchestration, and a harness-first reliability model. Not a canvas, not a chat wrapper, not an IDE plugin.

## Recommended UX Shape
Three-pane layout: IDE file tree (left), execution graph / planner chat (center, mode-switched), evidence inspector (right). The center pane shows the planner during discovery, the execution graph during build, and file tabs when inspecting code. The graph shows execution objects, not documents.

## Recommended Orchestration Model
DAG-based deterministic orchestration. Tasks form a directed acyclic graph defined during planning. The orchestrator executes tasks in dependency order. Agents have autonomy within tasks but cannot alter the graph. Validation is interleaved after every task.

## Recommended Harness Strategy
Generate harness artifacts (AGENTS.md, architecture docs, policies, test contracts) during planning. Commit to repo. Enforce mechanically during build. Evolve based on failure classification and human corrections. The harness is the moat — it compounds over time and is specific to each project.

## Recommended Repo / Source-of-Truth Strategy
GitHub is always authoritative. All code, docs, plans, research, and harness files live in the repo. The web app reads from and writes to GitHub. The user owns the repo. No lock-in.

## Recommended MVP Cut
Planner chat + file sidebar + execution graph + inspector + sequential build (3 agent types: planner, implementer, validator) + basic harness (AGENTS.md, lint, tests) + GitHub integration (create repo, branch, commit, PR). Ship in 6-8 weeks. Validate the core thesis.

## Top Unresolved Questions for Phase 2
1. **Parallel execution complexity:** How much does concurrent task execution improve outcomes vs. add complexity? Test in Phase 2.
2. **Harness auto-evolution:** Can failure classification reliably generate useful harness updates, or does it produce noise? Requires empirical data.
3. **Browser automation value:** How important are screenshots and browser-driven validation for real-world use cases? Validate with users.
4. **Model routing:** Can task complexity be reliably estimated for model selection, or should all tasks use the same model? Requires benchmarking.
5. **Multi-tenant sandboxing:** What is the right isolation model for multi-user? Defer until single-user is validated.
6. **Agent-to-agent review:** Should the reviewer agent be a mandatory step, or is validation-gate-only sufficient for MVP? Test with users.
7. **Cost model:** What is the right pricing model given variable token costs per build? Requires usage data.
