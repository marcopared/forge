# Forge Phase 1 Design — Revision 1.1

## Validator-Heavy, Harness-First Revision

**Version:** 1.1  
**Date:** March 10, 2026  
**Status:** Design Phase — Revision Pass  
**Baseline:** forge-product-design-v1.md (March 9, 2026)

---

# 1. Harness Alignment Check

The revised design remains fully aligned with Harness Engineering. Here is why.

The Harness Engineering article describes a system where three engineers drove 1,500 PRs across five months — an average of 3.5 PRs per engineer per day — with zero manually-written code. This throughput was not achieved by adding human review to every step. It was achieved by building an environment so legible, constrained, and mechanically validated that agents could execute, self-review, self-repair, and often self-merge with minimal human gating.

The core operating model from that article is: humans steer at the level of intent, architecture, and taste. Agents execute within an environment designed to make correct behavior easy and incorrect behavior detectable. Validators and structural tests are the primary quality gate. Humans review when judgment is needed, not as a checkbox on every PR.

The **validator-heavy, selective-human-review** model proposed in this revision is a faithful translation of that operating model. It is, in fact, closer to the spirit of Harness Engineering than the v1.0 design, which still had a latent assumption that humans would approve individual implementation tasks. The article explicitly says: "Humans may review pull requests, but aren't required to. Over time, we've pushed almost all review effort towards being handled agent-to-agent."

The revision makes this explicit by distinguishing between:
- **Pre-build phases** where the human steers (problem framing, product design, architecture, validation strategy, task graph approval)
- **Post-build phases** where validators steer (implementation, testing, repair, agent review, PR progression)

This maps directly to the article's statement: "Humans always remain in the loop, but work at a different layer of abstraction than we used to. We prioritize work, translate user feedback into acceptance criteria, and validate outcomes."

The revision preserves all other Harness Engineering principles:
- Repository-local knowledge as system of record
- AGENTS.md as short map with pointers to deeper docs
- Progressive disclosure of context
- Mechanical enforcement via linters, structural tests, and validation gates
- Observability designed for machine consumption
- Fast correction loops (repair, not blind retry)
- Explicit architectural boundaries with local autonomy within them

No revision in this document weakens these principles.

---

# 2. Revision Summary

## Major Changes

### Change 1: Explicit staged autonomy model
The v1.0 design implied a trust model but never stated it. The revision makes it explicit: human governance before build, validator governance during build. The human is not a bottleneck on implementation — they are a decision-maker on intent, design, and strategy.

### Change 2: Phased pre-build structure
The v1.0 planner collapsed product design, validation strategy, and task decomposition into one blurred phase. The revision separates these into distinct, sequentially gated phases: (1) consultation and product/system design, (2) validation and test strategy, (3) task graph and coding packet design. Each phase has its own approval checkpoint.

### Change 3: Validator-driven post-build progression
The v1.0 design had an AWAITING_APPROVAL state after every implementation task. The revision changes the default: implementation tasks progress automatically if all validation gates pass and confidence is above threshold. Human approval is required only at strategic checkpoints (design, strategy, merge-to-main) or on escalation.

### Change 4: Mechanical enforcement moved earlier
The v1.0 MVP deferred architecture boundary enforcement and custom linters. The revision includes a minimal but real mechanical enforcement layer in the MVP: the blessed stack ships with a pre-built linter configuration that enforces architecture boundaries, naming conventions, and structural rules out of the box. No custom linter generation yet — but the standard linter is real, not aspirational.

### Change 5: Standardized MVP archetype
The v1.0 MVP targeted "greenfield full-stack web app (Next.js or similar)" with open variance. The revision locks a single blessed stack (e.g., Next.js + PostgreSQL + Prisma + Tailwind) with pre-built harness templates, pre-built validation pipeline, and pre-built architecture boundaries. Ambition stays high; variance drops.

### Change 6: Evidence retention model added
The v1.0 design said evidence is required but did not define retention tiers. The revision adds a concrete tiered model: durable (repo artifacts), time-bounded durable (validation summaries, failure reports), and ephemeral (raw logs, traces, intermediate sandbox state).

### Change 7: Approval policy matrix added
The v1.0 design scattered approval rules across sections. The revision adds a single consolidated matrix showing exactly what requires human approval, what is validator-driven, what is agent-driven, and what triggers escalation.

### Change 8: Updated task state machine
The sample execution trace in v1.0 showed AWAITING_APPROVAL after every implementation task. The revision changes the default post-validation transition from AWAITING_APPROVAL to COMPLETED (auto-progressed) for implementation tasks where all gates pass and confidence exceeds threshold. AWAITING_APPROVAL is reserved for strategic gates and escalation.

---

# 3. Revised Sections

## 3.1 — Product Thesis (Amendment)

Add the following paragraph after the existing thesis:

**Why validator-heavy execution matters.** The Harness Engineering operating model demonstrates that human review scales poorly with agent throughput. When agents produce 3.5 PRs per engineer per day, human review of every task becomes the bottleneck. The solution is not to remove humans — it is to invest so heavily in mechanical validation, structural tests, architecture enforcement, and deterministic gates that the system can be trusted to progress without human approval on routine implementation. Humans govern intent, strategy, and design. Validators govern execution. This is not less human involvement — it is human involvement at the right level of abstraction.

---

## 3.2 — Revised User Journey and Primary Workflow

The end-to-end workflow has six phases with explicit transitions. The key structural change from v1.0 is that Phases A through C are human-governed and Phase D onward is validator-governed.

### Phase A — Consult and Discover (Human-Governed)

**Step 1: User arrives.** Unchanged from v1.0.

**Step 2: Planner engages.** Unchanged from v1.0 — consultative conversation, clarifying questions, challenging ambiguity.

**Step 3: Deep research runs (optional).** Unchanged — user approves research, reports committed to `research/`.

**Step 4: System drafts product and system design.** The planner generates: requirements document (`docs/requirements.md`), architecture document (`docs/architecture.md`), and a high-level product design summary. These are visible in the file navigator.

**Step 5: User iterates on product/system design.** The user reviews, pushes back, revises. This loop continues until the user is satisfied with the product definition and system architecture.

**Checkpoint A: Product/System Design Approval.** The user explicitly approves the product and architecture design. This is a named gate in the UI. Nothing proceeds without it.

### Phase B — Validation Strategy (Human-Governed)

**Step 6: System drafts validation and test strategy.** Based on the approved design, the planner (or a specialized validation designer agent) produces: a test strategy document (`harness/test-strategy.md`), acceptance criteria (`harness/acceptance-criteria.md`), a validation policy (`harness/policies/reliability.yaml`), and a definition-of-done contract (`harness/definition-of-done.yaml`). This is a distinct phase, not merged into product design.

**Step 7: User reviews validation strategy.** The user verifies that the test strategy covers what they care about. They can add acceptance criteria, modify coverage thresholds, or flag areas where automated testing is insufficient.

**Checkpoint B: Validation Strategy Approval.** The user explicitly approves the validation strategy. This is a named gate.

### Phase C — Task Design (Human-Governed)

**Step 8: System decomposes into task graph.** Based on the approved design and validation strategy, the planner produces a task graph: ordered implementation tasks, test-writing tasks, and validation gates. Each task includes a "coding packet" — a scoped description with inputs, outputs, acceptance criteria, context files, and the specific validation checks that apply.

**Step 9: User reviews task graph.** The user verifies the decomposition makes sense. They can reorder, split, merge, or remove tasks. They can flag high-risk tasks for human review.

**Checkpoint C: Task Graph Approval.** The user explicitly approves the task graph. After this point, the system transitions to validator-governed execution.

### Phase D — Build (Validator-Governed)

**Step 10: Repo is created or linked.** Unchanged from v1.0.

**Step 11: Harness artifacts are committed.** Unchanged — AGENTS.md, architecture docs, validation policies, test contracts committed to repo.

**Step 12: Execution environment provisioned.** Unchanged — ephemeral sandbox with repo cloned.

**Step 13: Agents begin work.** The orchestrator executes the approved task graph. Each task runs, then passes through the validation pipeline. If all gates pass and confidence is above threshold, the task auto-progresses to COMPLETED without human approval. The user can watch in real time but is not a bottleneck.

**Step 14: Repair loops run automatically.** On validation failure, the debugger agent analyzes the failure, produces a targeted fix, and re-runs validation. This loops up to N times (configurable, default 3). The user is notified but not blocked.

**Step 15: Agent review runs.** After implementation tasks pass validation, a reviewer agent checks for convention compliance, architectural coherence, and code quality. Review feedback is applied automatically and re-validated. This mirrors the OpenAI "Ralph Wiggum Loop" pattern: iterate until reviewers are satisfied.

**Step 16: Partial results are visible.** Unchanged — files appear in tree, diffs in inspector, logs in real time.

### Phase E — Review and Intervene (Selective Human)

**Step 17: System opens PR.** When all tasks in a phase pass validation and agent review, Forge opens a PR against main. The PR summary includes: task completion status, validation results, evidence links, aggregate confidence score.

**Step 18: User reviews PR (required).** Merge to main always requires human approval. The user reviews the PR, which is a focused review of the aggregate output — not a task-by-task review. The inspector provides evidence for any concern.

**Step 19: User intervenes if needed.** The user can re-enter planner mode at any time. But the design intent is that intervention is the exception. The validation pipeline is designed to catch problems before the user needs to.

**Checkpoint D: Merge Approval.** Human approves merge to main. This is the only mandatory human gate during the build cycle.

### Phase F — Learn (Automatic)

**Step 20: Harness learns.** Unchanged from v1.0 — failures classified, harness policies updated, patterns encoded.

---

## 3.3 — Revised Trust Model and Approval Architecture

### The Staged Autonomy Principle

Forge operates on a principle of **staged autonomy**: human governance before build, validator governance during build, human governance at merge.

This is not a reduction of human involvement. It is a reallocation. The human spends their time on the decisions where judgment matters most — what to build, how to validate it, and whether the output is acceptable — rather than on approving individual implementation tasks that the validation pipeline can assess mechanically.

### The Validator-Heavy Execution Model

During the build phase (Phase D), the following default behaviors apply:

- **Implementation tasks** auto-progress on validation pass + confidence threshold
- **Repair loops** run automatically up to N attempts
- **Agent review** runs automatically and applies feedback
- **PR progression** is validator-driven (all tasks pass → PR opens)
- **Merge** requires human approval

The human is **notified** of all activity but **blocks** only on:
- Strategic design decisions
- Merge to main
- Escalation triggers (confidence drop, policy violation, repair exhaustion, novel risk)

### Escalation Triggers

The system escalates to human review when:
- Repair attempts are exhausted (N failures on same task)
- Confidence score drops below threshold
- A policy is violated that the system cannot auto-remediate
- Architecture drift is detected
- Cost budget is exceeded
- The agent detects it needs judgment it cannot make (novel architectural question, ambiguous requirement)
- A task is flagged as high-risk by the user during task graph review

---

## 3.4 — Revised Orchestration Model

### Target Architecture (Long-Term)

Deterministic DAG-based orchestration with:
- Parallel task execution (bounded concurrency)
- Per-task worktree isolation
- Ephemeral observability stack per worktree
- Rich validation pipeline (lint, type-check, unit tests, integration tests, architecture checks, structural tests, custom invariants)
- Agent-to-agent review loops
- Automatic repair with targeted context enrichment
- Model routing by task complexity
- Progressive harness evolution from run history

### MVP Runtime (Phase 1)

A constrained sequential subset of the target architecture:
- **Sequential task execution** — one task at a time, no parallelism
- **Single branch** — no worktree isolation needed (serial execution eliminates conflicts)
- **Standard validation pipeline** — compilation, lint, type-check, unit tests, architecture boundary check (pre-built for the blessed stack, not custom-generated)
- **Single repair loop** — up to 3 repair attempts per failed task
- **Agent review** — reviewer agent runs after implementation, applies feedback, re-validates
- **Auto-progression** — tasks that pass all gates auto-progress; no human approval per task
- **Human gates** — only at Checkpoint A (design), Checkpoint B (validation strategy), Checkpoint C (task graph), and Checkpoint D (merge)

This is not a different system from the target architecture. It is the same system with concurrency set to 1, isolation simplified, and some validators pre-built rather than generated. The upgrade path is additive, not architectural.

---

## 3.5 — Revised Reliability Model (Amendments)

### Mechanical Enforcement in MVP

The v1.0 design deferred architecture boundary enforcement. The revision brings a subset of mechanical enforcement into the MVP through the **blessed stack pattern**:

The MVP targets a single standardized stack (e.g., Next.js + PostgreSQL + Prisma + Tailwind + TypeScript strict mode). For this stack, Forge ships with:

- **Pre-built ESLint configuration** with architecture boundary rules (e.g., no direct database access from UI components, no cross-module imports that violate the layer model)
- **Pre-built TypeScript strict configuration** (strict mode, no any, no implicit returns)
- **Pre-built file structure validator** (files in correct directories, naming conventions enforced)
- **Pre-built test runner configuration** (vitest, coverage thresholds, test file location rules)
- **Pre-built Prisma schema validation** (schema changes must pass migration check)

These are not custom-generated linters (that remains deferred). They are standard, opinionated, pre-built configurations that ship with Forge for the blessed stack. They provide real mechanical enforcement from day one.

### False-Success Prevention (Strengthened)

The v1.0 design noted false success as a risk. The revision adds an explicit mechanism:

**Validator cross-check:** After an implementation task claims completion, the validator runs tests that were designed during Phase B (validation strategy) — not tests the implementer wrote. This separation prevents the implementer from writing tests designed to pass. The test designer and the implementer are different agents with different context packs.

---

## 3.6 — Revised Planner / Build Phase Boundary

The v1.0 design had one gate: "Ready to Build?" The revision replaces this with a three-checkpoint model that separates product design, validation design, and task decomposition.

### Checkpoint Structure

```
Consultation / Discovery
    ↓
[Checkpoint A] Product/System Design Approval
    ↓
Validation / Test Strategy Design
    ↓
[Checkpoint B] Validation Strategy Approval
    ↓
Task Decomposition / Coding Packets
    ↓
[Checkpoint C] Task Graph Approval → BUILD BEGINS
    ↓
Validator-governed execution
    ↓
[Checkpoint D] Merge Approval
```

### Why Three Checkpoints, Not One

A single "Ready to Build?" gate conflates three distinct decisions:
1. **Is the design right?** — Product/system design approval
2. **Will we know if it works?** — Validation strategy approval
3. **Is the work plan sensible?** — Task decomposition approval

Separating these ensures that:
- The user can approve the design before validation strategy is finalized
- The validation strategy is reviewed as a first-class artifact, not a footnote in the plan
- The task graph is reviewed with full knowledge of what will be validated

Each checkpoint is a named UI state with a summary panel, artifact links, and explicit Approve/Revise controls. The flow is sequential but fast — for simple projects, all three checkpoints can be approved in a single session.

---

## 3.7 — Revised Task State Machine (Post-Build)

The key change: AWAITING_APPROVAL is no longer the default post-validation state. Tasks auto-progress when validators pass.

```
QUEUED
  │ dependencies met
  ▼
RUNNING
  │ agent output produced
  ▼
VALIDATING
  │
  ├── all gates pass + confidence ≥ threshold
  │     ▼
  │   REVIEWING (agent review)
  │     │
  │     ├── review passes
  │     │     ▼
  │     │   COMPLETED ──► COMMITTED
  │     │
  │     └── review requests changes
  │           ▼
  │         RUNNING (apply review feedback)
  │
  └── any gate fails
        ▼
      REPAIRING
        │
        ├── repair succeeds → VALIDATING
        │
        └── repair exhausted
              ▼
            BLOCKED (escalated to human)
              │
              ├── human re-scopes → QUEUED
              └── human cancels → CANCELLED
```

**Notable changes from v1.0:**
- AWAITING_APPROVAL removed from the default implementation path
- REVIEWING (agent review) added as a standard step
- Auto-progression from COMPLETED to COMMITTED (commit to branch)
- Human involvement only on BLOCKED (escalation) or at Checkpoint D (merge)

---

# 4. Approval Policy Matrix

| Phase / Action | Default Governance | Human Required? | Validator Required? | Agent Required? | Escalation Condition |
|---|---|---|---|---|---|
| **Consultation / requirements** | Human-governed | Yes — interactive | N/A | N/A | N/A |
| **Product/system design (Checkpoint A)** | Human-governed | Yes — explicit approval | N/A | N/A | N/A |
| **Validation/test strategy (Checkpoint B)** | Human-governed | Yes — explicit approval | N/A | N/A | N/A |
| **Task graph / coding packets (Checkpoint C)** | Human-governed | Yes — explicit approval | N/A | N/A | N/A |
| **Implementation task execution** | Validator-governed | No | Yes — all gates must pass | Yes — agent review | Confidence < threshold, policy violation, repair exhausted |
| **Repair loops** | Validator-governed | No | Yes — re-validates after fix | Yes — debugger agent | Repair attempts exhausted → escalate |
| **Agent review** | Agent-governed | No | Yes — re-validates after feedback applied | Yes — reviewer agent | Review/repair loop > 3 cycles → escalate |
| **PR progression** | Validator-governed | No | Yes — all tasks completed, all gates green | N/A | Any task BLOCKED → PR blocked |
| **Merge to main (Checkpoint D)** | Human-governed | Yes — explicit approval | Yes — final full-suite validation | N/A | N/A |
| **Harness policy changes** | Human-governed | Yes — explicit approval | N/A | Proposed by harness maintainer | N/A |
| **New dependency added** | Escalation | Yes — requires approval | Flagged by validator | Proposed by implementer | Always escalates |
| **Plan revision (mid-build)** | Human-governed | Yes — explicit approval | N/A | N/A | N/A |

### Escalation Triggers (Consolidated)

Any of these conditions causes the system to pause the affected task and notify the human:

1. **Repair attempts exhausted** — Debugger failed N times on same task
2. **Confidence below threshold** — Validation passes but confidence score is low (e.g., thin coverage, unusual patterns)
3. **Policy violation persists** — Architecture violation or convention violation that repair cannot fix
4. **Cost budget exceeded** — Token spend for a task or phase exceeds configured limit
5. **Loop detected** — Agent output is substantially similar across multiple repair attempts
6. **Novel judgment required** — Agent explicitly flags that it needs a decision it cannot make
7. **User-flagged high-risk task** — Task was marked as requiring human review during Checkpoint C

---

# 5. Evidence Retention Model

## Tier 1: Durable (Permanent, in Repo)

These artifacts are committed to the GitHub repository and persist forever as versioned files.

| Artifact | Location | Notes |
|---|---|---|
| Source code | `src/` | All agent-produced code |
| Tests | `tests/` | All agent-produced tests |
| Requirements | `docs/requirements.md` | Planner output |
| Architecture | `docs/architecture.md` + `ARCHITECTURE.md` | Planner output |
| Design decisions | `docs/design-docs/` | ADR-style records |
| Plans | `plans/active/` and `plans/completed/` | Execution plans with decision logs |
| Research reports | `research/` | Deep research outputs |
| AGENTS.md | Root | Short map |
| Harness policies | `harness/policies/` | Validation rules, conventions, boundaries |
| Test strategy | `harness/test-strategy.md` | Validation design output |
| Acceptance criteria | `harness/acceptance-criteria.md` | Definition of done |
| Definition of done | `harness/definition-of-done.yaml` | Machine-readable completion contract |

## Tier 2: Time-Bounded Durable (Database, 90-Day Default Retention)

These are stored in the Forge database and retained for a configurable period (default 90 days). They are queryable, searchable, and available for failure analysis and harness evolution.

| Artifact | Storage | Notes |
|---|---|---|
| Validation summaries | PostgreSQL | Pass/fail per check, per task, per run |
| Failure reports | PostgreSQL | Classification, root cause, remediation applied |
| Evidence bundles (metadata) | PostgreSQL | What files were read/written, commands run, costs |
| Repair histories | PostgreSQL | Each repair attempt with before/after |
| Agent review comments | PostgreSQL | Review feedback and responses |
| Confidence scores | PostgreSQL | Per-task confidence with factor breakdown |
| Task execution summaries | PostgreSQL | Duration, model, tokens, cost, status |
| Context pack manifests | PostgreSQL | What was included in each agent's context |

## Tier 3: Ephemeral (Expire After Run Completion, Unless Pinned)

These are produced during execution and discarded after the build completes (or after a short TTL, e.g., 7 days). They can be "pinned" by the user or system (e.g., on failure) to promote them to Tier 2.

| Artifact | Storage | TTL | Pin Condition |
|---|---|---|---|
| Raw agent logs | S3/blob | 7 days | Pinned on task failure |
| Full execution traces | S3/blob | 7 days | Pinned on task failure |
| Screenshots / browser evidence | S3/blob | 7 days | Pinned on UI-related tasks |
| Sandbox filesystem snapshots | Container storage | End of run | Pinned on debugging escalation |
| Intermediate diffs (pre-merge) | S3/blob | 7 days | Pinned on merge conflict |
| WebSocket / streaming logs | Not stored | End of session | N/A |

### Pinning Behavior

When a task fails, enters BLOCKED, or is escalated, all Tier 3 artifacts for that task are automatically promoted to Tier 2 retention (90 days). The user can also manually pin any artifact from the inspector.

---

# 6. Revised MVP Positioning

## The Blessed Stack Approach

The v1.0 MVP said "greenfield full-stack web app (Next.js or similar)" — this creates unbounded variance. Every "or similar" introduces new edge cases in harness templates, validation pipelines, architecture boundaries, and test configurations.

The revision locks the MVP to a **single blessed stack** with pre-built everything:

### Blessed Stack (MVP)

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | Most popular full-stack React framework, strong TypeScript support, well-represented in training data |
| **Language** | TypeScript (strict mode) | Type safety enables static validation |
| **Database** | PostgreSQL + Prisma | Strong schema validation, migration support, ORM legibility for agents |
| **Styling** | Tailwind CSS | Utility-first, no custom CSS sprawl, agent-friendly |
| **Testing** | Vitest + Playwright (e2e deferred) | Fast, compatible, standard |
| **Package manager** | pnpm | Strict, deterministic installs |
| **Deployment** | Vercel (or export-ready) | Zero-config for Next.js, predictable |

### What the Blessed Stack Buys

For this specific stack, Forge ships with:
- **Pre-built AGENTS.md template** — not generated, pre-written and battle-tested
- **Pre-built ARCHITECTURE.md template** — defines the Next.js App Router layer model
- **Pre-built ESLint configuration** — architecture boundary rules, naming conventions, import restrictions
- **Pre-built TypeScript tsconfig** — strict mode, path aliases, barrel file rules
- **Pre-built Vitest configuration** — coverage thresholds, test file conventions
- **Pre-built Prisma validation** — schema checks, migration validation
- **Pre-built file structure rules** — `app/` for routes, `lib/` for domain logic, `components/` for UI, `tests/` for tests
- **Pre-built validation pipeline** — the exact sequence of checks, in order, with known pass criteria

This means the MVP harness is **real, mechanical, and enforced from task one**. It is not generated. It is pre-built for the blessed stack. This is faster to build, more reliable, and eliminates the hardest problem (generating correct linter rules from scratch).

### Adding More Stacks Later

The blessed stack is the MVP. Adding more stacks (Python/FastAPI, Go, Rails, etc.) is the expansion model. Each new stack requires its own pre-built harness templates. This is labor-intensive but well-bounded — it is configuration, not novel architecture.

## Revised MVP Definition

### Target User
Solo technical founder or small team (1-3 engineers) building a new web application from scratch using the blessed stack.

### Target Use Case
Greenfield Next.js application with PostgreSQL database, REST/tRPC API, and React UI.

### Must-Have Surfaces
1. **Planner workspace** — Consultative conversation with Opus-class model, three-checkpoint flow
2. **File navigator** (left sidebar) — Browse repo, docs, plans, harness files
3. **Execution graph** (center) — Task nodes with status, basic DAG view
4. **Inspector** (right) — Diffs, test results, logs, validation status, escalation controls
5. **Three checkpoint gates** — Product design → Validation strategy → Task graph → Build
6. **Merge review** — PR summary with aggregate evidence

### Must-Have Orchestration
- Sequential task execution
- Four agent roles: planner, implementer, validator (mostly deterministic), reviewer
- Repair loop (up to 3 attempts)
- Agent review loop (reviewer → feedback → re-implement → re-validate)
- Auto-progression on validation pass (no per-task human approval)
- Escalation on failure/threshold/policy
- BullMQ job queue on Redis

### Must-Have Harness (Pre-Built for Blessed Stack)
- AGENTS.md (pre-built template, customized during planning)
- Architecture boundary enforcement (ESLint rules, pre-built)
- TypeScript strict mode enforcement
- File structure validation
- Vitest test runner with coverage thresholds
- Prisma schema validation
- Coding conventions (naming, imports, structured logging)
- Definition-of-done contract (pre-built, customized during Checkpoint B)

### Must-Have GitHub Integration
- Create repo under user's GitHub account
- Single feature branch per build phase
- Commit after each completed task (auto-progressed)
- Open PR when phase completes (all tasks pass)
- Human approves merge (Checkpoint D)

### Must-Have Evidence
- Diffs recorded per task
- Test results recorded per task (with coverage)
- Validation summary recorded per task
- Failure reports with classification
- Aggregate confidence score per phase
- Repair history recorded
- Tier 1/2/3 retention model active

### What Is Deferred
- Parallel task execution
- Multiple blessed stacks (Python, Go, etc.)
- Timeline/swimlane views
- Browser automation and screenshots
- Custom linter generation (beyond pre-built)
- Harness auto-evolution from failure patterns
- Multi-tenant
- Ephemeral VMs (use containers)
- Deep research with parallel sub-agents
- Advanced model routing
- Run history analytics dashboard

### Why This Cut Is Right

The MVP tests the full thesis — planner → design approval → validation strategy → task graph → validator-governed build → merge review — against a single well-understood stack. The blessed stack eliminates variance in harness configuration, letting us focus on whether the pipeline works. If the pipeline produces trustworthy results on Next.js + PostgreSQL, adding more stacks is an expansion problem, not a validation risk.

---

# 7. Updated Phase 1 Decision Summary

## Recommended Product Shape
Forge is a repo-native agentic engineering control plane with a validator-heavy execution model. Humans govern intent, design, and strategy through explicit checkpoints. Validators govern implementation through mechanical gates. The system auto-progresses on validation pass and escalates on failure.

## Recommended UX Shape
Three-pane layout: IDE file tree (left), execution graph / planner (center), evidence inspector (right). The center pane hosts the planner during Phases A–C and the execution graph during Phase D. Three sequential checkpoints replace the single "Ready to Build?" gate. The inspector shows validation evidence, not just logs.

## Recommended Orchestration Model
DAG-based deterministic orchestration. MVP runs sequentially (concurrency = 1). Tasks auto-progress on validation pass. Repair loops are automatic. Agent review is automatic. Human approval is required only at four named checkpoints: product design, validation strategy, task graph, and merge.

## Recommended Harness Strategy
Pre-built harness templates for the blessed stack (Next.js + PostgreSQL + Prisma + Tailwind). Mechanical enforcement from day one via pre-built ESLint rules, TypeScript strict mode, file structure validation, and test coverage thresholds. No custom linter generation in MVP — instead, opinionated pre-built configurations that work out of the box for the blessed stack.

## Recommended Repo / Source-of-Truth Strategy
Unchanged from v1.0. GitHub is authoritative. All durable artifacts live in the repo. The web app is a governance and observability layer. The user owns the repo.

## Recommended Trust / Approval Model
**Staged autonomy with validator-heavy execution.**

| Phase | Governance |
|---|---|
| Consultation | Human |
| Product/system design | Human (Checkpoint A) |
| Validation strategy | Human (Checkpoint B) |
| Task graph | Human (Checkpoint C) |
| Implementation | Validator + Agent |
| Repair | Validator + Agent |
| Agent review | Agent + Validator |
| PR creation | Validator (automatic) |
| Merge to main | Human (Checkpoint D) |

Escalation to human on: repair exhaustion, confidence drop, policy violation, cost overrun, loop detection, novel judgment, user-flagged risk.

## Recommended MVP Cut
Blessed stack (Next.js + Postgres + Prisma + Tailwind) with pre-built harness. Three-checkpoint pre-build flow. Validator-governed sequential build. Four agent roles (planner, implementer, validator, reviewer). Auto-progression on validation pass. Three-tier evidence retention. Single-user. Single-tenant. 8-10 weeks to initial internal build.

## Top Unresolved Questions for Phase 2

1. **Parallel execution:** How much does concurrency improve throughput vs. complicate debugging? Test with 2-3 concurrent tasks before scaling further.

2. **Harness evolution:** Can failure classification reliably drive harness updates, or does it produce noise? Requires empirical data from MVP runs.

3. **Second blessed stack:** Which stack to add next? Python/FastAPI is the likely candidate. Requires building a second full harness template set.

4. **Browser automation:** How important are screenshots and Playwright-based validation for real-world MVP projects? Validate with user feedback.

5. **Agent review quality:** Does the agent reviewer catch issues that validators miss, or is it redundant? Measure the delta between validator-only and validator+reviewer pipelines.

6. **Confidence scoring calibration:** Are the confidence scores actually predictive of human satisfaction? Requires correlation analysis against user acceptance of merged PRs.

7. **Existing repo support:** The MVP targets greenfield. How much additional work is required to support connecting to an existing repo with its own conventions? This is a significant expansion.

8. **Cost model:** What does a typical MVP build cost in tokens? Need real usage data to set pricing.
