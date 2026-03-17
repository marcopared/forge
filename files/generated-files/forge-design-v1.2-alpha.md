# Forge Design — Revision 1.2: Alpha Core Harness

## Scope Correction: From MVP Thesis Probe to Alpha Core Harness

**Version:** 1.2  
**Date:** March 10, 2026  
**Status:** Design Phase — Scope Correction  
**Baseline:** forge-design-v1.1-revision.md + forge-product-design-v1.md

---

# 1. Harness Alignment Check

The Alpha reframing is more faithful to Harness Engineering than either v1.0 or v1.1.

The OpenAI team's article describes a system that works because of the integrated operation of several capabilities simultaneously: worktree isolation per change, ephemeral observability per worktree, mechanical enforcement via linters and structural tests, agent-to-agent review loops, progressive disclosure of context, and background harness maintenance. These are not independent features that can be tested in isolation. They are a system. The sequential, single-branch, no-worktree MVP described in v1.1 amputates the core mechanism — task isolation — that makes the rest of the harness trustworthy.

Specifically:

**Worktree isolation is not an optimization. It is a correctness requirement.** The article states that the team made the app bootable per git worktree so each agent could work on a fully isolated version of the application. This is not about parallelism. It is about preventing interference between tasks, enabling per-task validation against a clean state, and making evidence bundles meaningful. A sequential system on a single branch where each task mutates shared state makes it impossible to attribute failures to specific tasks. Worktrees are core harness.

**Concurrent execution is not a throughput luxury. It is how the harness generates trust.** When tasks run in parallel on isolated worktrees, each task's validation runs against its own clean state. Merge conflicts between tasks surface real architectural coupling that the system needs to detect. Sequential execution on a shared branch hides these signals. Bounded concurrency (2-4 tasks) is sufficient for Alpha. Full-scale parallelism can come later.

**Agent-to-agent review is not polish. It is the primary quality gate.** The article describes how human review was progressively replaced by agent-to-agent review. The "Ralph Wiggum Loop" — iterate until agent reviewers are satisfied — is not a nice-to-have. It is the mechanism that lets the system run without human bottlenecks. Deferring it forces the system back into a human-heavy model that contradicts the thesis.

**Per-worktree observability is not advanced tooling. It is how agents validate their own work.** The article describes an ephemeral observability stack per worktree — logs, metrics, traces — that agents can query directly. This is what makes prompts like "ensure startup completes in under 800ms" tractable. Without per-task observability, agents cannot self-validate beyond running tests.

Moving all of these into Alpha does not expand scope beyond the harness thesis. It moves the design from "test whether the thesis might work in a reduced form" to "build the actual system the thesis describes." The difference is important: a sequential, single-branch, no-worktree system is not a reduced version of the harness — it is a different system that lacks the properties that make the harness work.

What remains deferred — multiple stacks, multi-tenant, enterprise VMs, analytics dashboards, marketplace features — is genuinely outside the core harness. The line is clean.

---

# 2. Revision Summary

## What Moves from "Deferred" into Alpha

| Capability | Was | Now | Justification |
|---|---|---|---|
| **Deterministic DAG orchestration** | "Target architecture" | Alpha must-have | Core orchestration model, not an upgrade |
| **Bounded parallel execution** | Deferred | Alpha must-have (2-4 concurrent tasks) | Task isolation requires independent worktrees; concurrency is how they prove value |
| **Per-task worktree isolation** | Deferred | Alpha must-have | Correctness requirement, not optimization |
| **Per-worktree observability** | Mentioned in long-term | Alpha must-have (logs + test output per worktree) | Agents need isolated feedback to self-validate |
| **Agent-to-agent review loop** | In v1.1 but weak | Strengthened to primary quality gate | Replaces per-task human approval; central to trust model |
| **Richer validation pipeline** | Partially in v1.1 (pre-built) | Strengthened: compilation + lint + type-check + unit tests + architecture check + integration tests (per worktree) | Validators are the core trust mechanism |
| **Structured repair with context enrichment** | "Single repair loop, 3 attempts" | Structured repair with failure classification, context enrichment, and targeted re-scope | Repair is not blind retry; it is informed correction |
| **Worktree-aware GitHub lifecycle** | Single branch | Branch-per-phase + worktree-per-task + merge-back to phase branch | Isolation model requires branching model |
| **Background harness maintenance** | Deferred to harness evolution | Alpha: doc-gardening pass after each phase, staleness checks | Core to preventing doc drift — the article's "garbage collection" pattern |

## What Remains Deferred (Platform Breadth)

| Capability | Reason for Deferral |
|---|---|
| Multiple blessed stacks (Python, Go, etc.) | Configuration breadth, not core harness |
| Multi-tenant support | Platform infrastructure, not harness architecture |
| Ephemeral VMs (Firecracker-style) | Containers are sufficient for single-user Alpha |
| Browser automation / Playwright | Valuable but not required for non-UI-heavy validation |
| Deep research with parallel sub-agents | Single-agent research is sufficient for Alpha |
| Custom linter generation (beyond pre-built) | Pre-built linters cover the blessed stack; generation is an expansion feature |
| Advanced model routing | Single model tier per role is sufficient for Alpha |
| Run history analytics dashboard | Observability of current run is sufficient; historical analytics is platform polish |
| Timeline / swimlane views | DAG view is the primary execution view; alternate views are UX polish |
| Enterprise compliance / audit features | Platform breadth |
| Plugin / marketplace / extensibility | Platform breadth |

## Why This Is the Correct Boundary

The core harness thesis is: **agents produce reliable software when the environment provides isolation, mechanical validation, structured repair, and evidence-based completion.** Every feature in the Alpha list directly implements a component of that thesis. Every feature in the deferred list is either a second instance of something already covered (second blessed stack), a scaling concern (multi-tenant), or a UX polish item (swimlane views). The line is clean: core harness now, platform breadth later.

---

# 3. Revised Product Scope Framing

## What Alpha Is Trying to Prove

Alpha proves that the full core harness — not a reduced subset — produces reliable, trustworthy software from a single blessed stack. Specifically, Alpha must demonstrate:

1. **Planner-to-merge pipeline works end-to-end.** A user describes an idea, iterates with the planner, approves design + validation strategy + task graph, and the system produces a working application committed to GitHub with a mergeable PR — with the human approving only at strategic checkpoints.

2. **Validator-governed execution is trustworthy.** Implementation tasks auto-progress on validation pass without per-task human review. The validation pipeline (compilation, lint, type-check, tests, architecture checks) is strong enough that "all gates pass" is meaningful.

3. **Task isolation produces clean evidence.** Each task runs on its own worktree, produces its own evidence bundle, and is validated independently. Failures are attributable to specific tasks. Merge conflicts between tasks surface real coupling.

4. **Repair loops converge.** When tasks fail, the debugger agent produces targeted fixes — not blind retries — and the system converges to a passing state within bounded attempts. Failures that cannot be repaired are correctly escalated.

5. **Agent review reduces human burden.** The reviewer agent catches convention and quality issues that validators miss. The implement → validate → review → apply feedback → re-validate loop runs without human intervention on routine work.

6. **The harness compounds.** After a build phase completes, harness maintenance (doc gardening, staleness checks, policy updates from failure patterns) measurably reduces failure rates in subsequent phases.

## Why Alpha Includes the Full Core Harness

A sequential, single-branch system cannot demonstrate properties 3, 5, or 6 above. Without worktree isolation, evidence bundles reflect cumulative state rather than per-task state. Without bounded concurrency, the system cannot demonstrate that isolation works under realistic conditions. Without agent review as a primary gate, the system falls back to human-heavy review that contradicts the thesis.

The v1.1 "MVP" was designed to validate whether the pipeline concept works. Alpha is designed to validate whether the harness actually produces trust. These are different questions. The second is the one that matters.

## What Is Intentionally Not in Alpha

Alpha does not prove:
- That the system works across multiple tech stacks
- That the system works at enterprise scale or multi-tenant
- That the system can handle arbitrary existing codebases with their own conventions
- That historical analytics improve long-term outcomes
- That browser automation is essential for validation

These are genuine questions for future phases. They are not part of the core harness thesis.

---

# 4. Revised Orchestration Model

## Alpha Runtime: Deterministic DAG with Bounded Concurrency

The Alpha runtime is the real orchestration architecture, not a toy subset.

### Task Graph Execution

The approved task graph is a directed acyclic graph. The orchestrator:

1. **Resolves dependencies.** Identifies tasks with no unmet dependencies.
2. **Schedules concurrently.** Up to N tasks (Alpha default: 3) may execute simultaneously if they have no mutual dependencies.
3. **Provisions worktrees.** Each scheduled task gets its own git worktree within the sandbox container, branched from the phase branch.
4. **Dispatches agents.** Each task is dispatched to the appropriate agent with its context pack, scoped to its worktree.
5. **Validates independently.** Each task's validation pipeline runs against its worktree — not against shared state.
6. **Merges back.** Completed, validated tasks are merged back into the phase branch. Merge conflicts trigger a specific conflict-resolution task.
7. **Continues scheduling.** Once a task completes and merges, newly unblocked tasks are scheduled.

### Concurrency Model

Alpha supports bounded concurrency with a configurable limit (default 3). This is not full-scale parallelism — it is enough to prove task isolation and detect task coupling. The concurrency limit can be set to 1 for fallback/debugging purposes, but sequential execution is a degraded mode, not the canonical runtime.

### Worktree Lifecycle

```
Phase branch: forge/phase-1-core-engine
  │
  ├── worktree: task-001-api-client
  │     └── (agent works, validates, completes)
  │     └── merged back to phase branch
  │
  ├── worktree: task-002-websocket-handler  (concurrent with 003)
  │     └── (agent works, validates, completes)
  │     └── merged back to phase branch
  │
  ├── worktree: task-003-type-definitions   (concurrent with 002)
  │     └── (agent works, validates, completes)
  │     └── merged back to phase branch
  │
  ├── worktree: task-004-spread-detector    (depends on 001, 002)
  │     └── (scheduled after 001+002 merge)
  │     └── ...
  │
  └── Phase PR: forge/phase-1-core-engine → main
        └── Human approves merge (Checkpoint D)
```

### Merge Conflict Handling

When a completed task's worktree cannot cleanly merge back to the phase branch (because another concurrent task modified overlapping files):

1. The orchestrator detects the conflict.
2. A conflict-resolution task is created, assigned to the implementer agent with both diffs as context.
3. The resolution is validated through the standard pipeline.
4. If resolution fails after N attempts, escalate to human.

This is a natural consequence of concurrency and must be handled in Alpha. It is also a valuable signal — frequent merge conflicts between tasks indicate that the task decomposition is too tightly coupled, which should feed back into the planner.

### Fallback to Sequential

If concurrency causes persistent problems (e.g., frequent merge conflicts on a particular project), the user or system can reduce the concurrency limit to 1. This is a degradation, not a different system. The worktree isolation still applies (each task still gets its own worktree even at concurrency = 1). The only change is that tasks execute one at a time.

---

# 5. Revised Reliability Model

## Mechanical Enforcement in Alpha

Alpha ships with the full blessed-stack enforcement layer from v1.1, plus the following additions justified by the stronger runtime:

### Per-Task Validation Pipeline (Runs in Task Worktree)

Every implementation task, after the agent produces output, runs through this ordered pipeline in the task's own worktree:

1. **Compilation check** — `tsc --noEmit` (TypeScript strict mode). Blocking.
2. **Lint check** — ESLint with pre-built architecture boundary rules, import restrictions, naming conventions, file size limits. Blocking.
3. **Type safety check** — No `any` types, no implicit returns, no type assertions without justification comment. Blocking.
4. **Unit tests** — Vitest runs tests for the affected module. Must pass. Coverage must not decrease. Blocking.
5. **Schema validation** — If Prisma schema was modified: migration check, schema consistency. Blocking.
6. **Architecture boundary check** — Structural test: dependency direction compliance, layer isolation, no prohibited cross-module imports. Blocking.
7. **File structure check** — Files are in correct directories per convention. No orphan files. Blocking.
8. **Integration tests** — If the task touches a service boundary: run integration tests for that boundary. Blocking.

All checks run against the task's worktree, not against the phase branch. This means each task is validated against its own clean delta, not against cumulative state.

### Cross-Task Validation (Runs After Merge to Phase Branch)

After a task merges back to the phase branch, a lighter cross-task validation runs:

1. **Full compilation** — Ensure the merged state compiles.
2. **Full lint** — Ensure no lint regressions from merge.
3. **Full unit test suite** — Run all tests, not just affected ones.
4. **Architecture check** — Full-repo boundary check.

If cross-task validation fails, the most recently merged task is the likely cause. The orchestrator flags it and may create a repair task.

### Phase-End Validation

When all tasks in a phase are complete and merged to the phase branch:

1. Everything in cross-task validation, plus:
2. **Coverage threshold check** — Overall coverage meets minimum (e.g., 80% for `src/core/`).
3. **Harness freshness check** — AGENTS.md, architecture docs, and policies are still consistent with the code.
4. **Definition-of-done contract** — All acceptance criteria from Checkpoint B are mechanically verifiable and verified.

Phase-end validation must pass before the PR is opened.

### False-Success Prevention (Strengthened)

The v1.1 design noted that the test designer and implementer should be different agents. Alpha reinforces this:

- **Test design happens during Phase B** (validation strategy). The test strategy defines what must be tested and to what standard.
- **Implementer writes code and may write co-located tests** for its own verification.
- **The validation pipeline runs the Phase B-designed tests** — not only the implementer's tests. If the implementer's code passes its own tests but fails the Phase B tests, the task fails.
- **Agent reviewer** specifically checks whether the implementer's tests are tautological (testing the implementation rather than the specification).

### Repair with Context Enrichment

When a task fails validation, the repair loop is not a blind retry. It is an informed correction cycle:

1. **Classify failure.** The validator produces a structured failure report: which check failed, what the error was, what file(s) are involved, what the expected behavior was.
2. **Enrich context.** The debugger agent receives: the original task description, the implementation diff, the failure report, the relevant harness policies, and (if available) the specific passing/failing test output.
3. **Targeted fix.** The debugger produces a minimal fix — not a rewrite. The fix is applied to the worktree.
4. **Re-validate.** The full per-task validation pipeline runs again.
5. **Iterate or escalate.** Up to N repair attempts (default 3). If the failure changes classification between attempts (e.g., lint failure → test failure), the counter resets for the new classification. If the same classification persists N times, escalate.

### Per-Worktree Observability (Alpha Scope)

Each task worktree has access to:

- **Structured logs.** The agent's operations are logged in a structured format (JSON lines) to a per-worktree log file. Agents can read their own logs to diagnose issues.
- **Test output.** Full test runner output (pass/fail, coverage, error messages) is captured and stored in the evidence bundle.
- **Application boot check.** If the task modifies application code, the app is booted in the worktree and a basic health check runs. Boot failure is a blocking validation check.
- **Command output.** All shell commands executed by the agent are logged with exit codes and output (stdout/stderr).

Full metric/trace observability stacks (Victoria Metrics, Grafana, etc.) are deferred. Alpha provides structured logs, test output, and application boot checks — enough for agents to self-validate.

### Policy-Aware Execution

Execution respects policies defined in `harness/policies/`:

- **Cost budget.** Per-task and per-phase token budgets. Exceeding triggers pause and escalation.
- **Time budget.** Per-task timeout (configurable, default 30 minutes). Exceeding triggers failure and escalation.
- **Dependency policy.** Adding a new dependency (package.json change) always escalates to human approval.
- **Architecture policy.** Architecture boundary violations cannot be auto-repaired by simply removing the boundary. The repair must make the code comply with the boundary.
- **Harness policy.** Changes to harness files (AGENTS.md, policies, conventions) during implementation always escalate.

---

# 6. Revised GitHub / Execution Environment Model

## Execution Environment: Container with Worktree Isolation

Alpha runs on hosted ephemeral containers (Docker-based). Each build phase gets a container with:

- The repo cloned at the phase branch head
- Dependencies installed (`pnpm install`)
- The application bootable (`pnpm dev` starts successfully)
- Git configured for worktree operations
- Network access for package installation (with egress filtering)
- Structured logging enabled per worktree
- Evidence collection agents running

### Worktree Provisioning

When the orchestrator schedules a task:

1. `git worktree add /work/task-{id} -b forge/task-{id}` from the phase branch head
2. `pnpm install` in the worktree (incremental, fast if deps unchanged)
3. Agent is dispatched to work within `/work/task-{id}/`
4. All file operations are scoped to this worktree
5. Validation runs within this worktree

### Evidence Extraction

Before a worktree is torn down:

1. Diff is captured: `git diff forge/phase-branch..forge/task-{id}`
2. Test results are captured from the test runner output
3. Structured logs are captured from the per-worktree log file
4. Application boot status is captured
5. All of the above are packaged into the evidence bundle and stored (Tier 2/3 per retention model)

### Worktree Merge-Back

After a task passes validation and agent review:

1. `git checkout forge/phase-branch`
2. `git merge forge/task-{id}` (fast-forward preferred; three-way merge if necessary)
3. If merge conflict → conflict-resolution task (see Section 4)
4. Cross-task validation runs on the updated phase branch
5. Worktree is removed: `git worktree remove /work/task-{id}`

### Container Lifecycle

| Event | Action |
|---|---|
| Phase starts | Container provisioned, repo cloned, deps installed |
| Task scheduled | Worktree created within container |
| Task completes | Evidence extracted, worktree merged back, worktree removed |
| Phase completes | Phase-end validation runs, PR opened, evidence finalized |
| PR merged or abandoned | Container torn down, Tier 3 evidence TTL starts |

### Deferred: VM Isolation

Containers provide sufficient isolation for single-user Alpha. Ephemeral VMs (Firecracker, gVisor) are deferred to the multi-tenant phase, where stronger tenant isolation is required.

## GitHub Lifecycle: Worktree-Aware Branching

### Branch Model

```
main
  └── forge/phase-1-core-engine          (phase branch)
        ├── forge/task-001-api-client     (task branch, lives in worktree)
        ├── forge/task-002-ws-handler     (task branch, concurrent)
        ├── forge/task-003-types          (task branch, concurrent)
        └── ...
```

### Commit Model

Each task produces a single squashed commit when merging back to the phase branch. The commit message is structured:

```
feat(task-001): Implement Polymarket CLOB API client

Agent: implementer (claude-sonnet-4)
Validation: compilation ✓ lint ✓ types ✓ tests(12/12) ✓ arch ✓
Review: agent-reviewer approved
Evidence: forge.dev/evidence/task-001
Confidence: 0.94
```

This makes the git history machine-readable and auditable.

### PR Model

When all tasks in a phase pass and merge to the phase branch, Forge opens a PR:

```
forge/phase-1-core-engine → main

## Phase 1: Core Engine

### Tasks Completed
- [x] TASK-001: Implement API client (confidence: 0.94)
- [x] TASK-002: WebSocket handler (confidence: 0.91)
- [x] TASK-003: Type definitions (confidence: 0.96)
- [x] TASK-004: Spread detector (confidence: 0.89)
- [x] TASK-005: Test suite (confidence: 0.93)

### Validation
- All per-task validations passed
- Cross-task validation passed
- Phase-end validation passed
- Coverage: 84% (threshold: 80%)
- Architecture checks: all boundaries respected

### Evidence
Link to full evidence dashboard for all tasks.

### Merge requires human approval (Checkpoint D).
```

The user reviews the aggregate PR, not individual task commits. The evidence dashboard provides drill-down for any concern.

---

# 7. Revised Alpha Cut

## Alpha Must-Haves (Core Harness Thesis)

### Orchestration and Runtime
- Deterministic DAG-based task orchestration
- Bounded parallel execution (default concurrency: 3)
- Per-task worktree isolation within container
- Worktree-aware branching model (phase branch + task branches)
- Merge-back with conflict detection and resolution
- Structured repair loops with failure classification and context enrichment (up to 3 attempts)
- Escalation on repair exhaustion, confidence drop, policy violation, cost/time budget, loop detection
- Sequential execution as configurable fallback (concurrency = 1), not canonical mode

### Agents
- **Planner** (Opus-class): Consultative pre-build, three-checkpoint flow
- **Implementer** (Sonnet-class): Code generation within worktree scope
- **Validator** (mostly deterministic): Full per-task, cross-task, and phase-end validation pipelines
- **Debugger** (Opus-class): Failure analysis and targeted repair
- **Reviewer** (Opus-class): Agent-to-agent code review, convention/quality checks
- **Doc Updater** (Sonnet-class): Post-phase harness maintenance, doc gardening

### Validation Pipeline
- Compilation (TypeScript strict)
- Lint (ESLint with pre-built architecture boundaries, naming, imports, file size)
- Type safety (no `any`, no implicit returns)
- Unit tests (Vitest, affected scope + coverage)
- Schema validation (Prisma migration check)
- Architecture boundary check (structural test)
- File structure check
- Integration tests (for service boundary changes)
- Application boot check (per worktree)
- Cross-task validation (after merge-back)
- Phase-end full validation (before PR)

### Evidence and Observability
- Evidence bundle required for every task (diff, test results, validation summary, logs, commands)
- Per-worktree structured logs
- Per-worktree test output capture
- Application boot check per worktree
- Three-tier retention model (durable / time-bounded / ephemeral with auto-pin)
- Aggregate confidence scoring per task and per phase

### Harness
- Pre-built blessed-stack harness (AGENTS.md, ARCHITECTURE.md, policies, conventions, test strategy template)
- Mechanical enforcement from task one (lint, type-check, architecture boundaries, file structure, coverage)
- Definition-of-done contracts (machine-readable, enforced)
- Post-phase harness maintenance pass (doc gardening, staleness detection)
- Policy-aware execution (cost budget, time budget, dependency escalation, architecture policy, harness change escalation)

### Pre-Build Flow
- Planner / technical cofounder workspace
- Deep research (single-agent web search, reports committed to repo)
- Three-checkpoint flow: product/system design → validation strategy → task graph
- All plan artifacts committed to repo before build begins

### UX Surfaces
- Planner workspace (center pane, pre-build)
- File navigator (left sidebar, IDE-style)
- Execution DAG (center pane, during build, with real-time status)
- Evidence inspector (right pane, per-task drill-down)
- Three checkpoint gates (pre-build approvals)
- PR review surface (aggregate evidence, merge approval)
- Escalation queue (blocked tasks requiring human input)

### GitHub Integration
- Create repo under user's account
- Phase branch + task branch model
- Worktree-per-task isolation
- Squashed merge-back per task with structured commit messages
- PR opened at phase completion
- Human merge approval (Checkpoint D)
- Harness artifacts committed to repo

### Blessed Stack
- Next.js 14+ (App Router) + TypeScript strict + PostgreSQL + Prisma + Tailwind + Vitest + pnpm
- Pre-built harness templates, lint configs, architecture rules, test configs
- Single stack only; additional stacks are platform expansion

### Single User / Single Tenant
- One user per workspace
- No team collaboration features
- No multi-tenant isolation requirements

## Explicitly Deferred (Platform Breadth)

| Feature | Category | Why Deferred |
|---|---|---|
| Additional blessed stacks (Python, Go, Rails) | Stack breadth | Configuration labor, not core harness |
| Multi-tenant support | Platform infra | Requires tenant isolation, billing, auth complexity |
| Ephemeral VMs (Firecracker) | Platform infra | Containers sufficient for single-user |
| Browser automation / Playwright | Validation breadth | Not required for non-UI-heavy validation |
| Deep research with parallel sub-agents | Research depth | Single-agent research sufficient for Alpha |
| Custom linter generation | Harness generation | Pre-built linters cover blessed stack |
| Advanced model routing | Cost optimization | Single model per role sufficient for Alpha |
| Run history analytics dashboard | Analytics | Current-run observability sufficient |
| Timeline / swimlane alternate views | UX polish | DAG view covers Alpha needs |
| Harness auto-evolution from failure patterns | Harness intelligence | Manual harness maintenance + doc gardening sufficient for Alpha |
| Enterprise compliance / audit | Enterprise breadth | Not in scope |
| Existing repo onboarding | Repo breadth | Greenfield only for Alpha |
| Content calendar / marketing features | Product breadth | N/A |
| Plugin / extension marketplace | Platform breadth | N/A |

---

# 8. Revised Phase 1 Decision Summary

## Recommended Product Shape
Forge is a repo-native agentic engineering control plane that implements the full core harness thesis: deterministic DAG orchestration, worktree-isolated task execution, validator-heavy pipelines, agent-to-agent review, structured repair, evidence-based completion, and policy-aware execution. All against a single blessed stack (Next.js + PostgreSQL), with pre-built mechanical enforcement from task one.

## Recommended UX Shape
Three-pane layout unchanged: IDE file tree (left), execution DAG / planner (center), evidence inspector (right). The execution DAG now shows real concurrent task execution with worktree status, merge-back events, and conflict resolution. The inspector shows per-worktree evidence. Three sequential checkpoints gate the pre-build flow. Escalation queue surfaces blocked tasks.

## Recommended Orchestration Model
Deterministic DAG with bounded concurrency (default 3 parallel tasks). Per-task worktree isolation. Merge-back to phase branch after validation + review. Conflict resolution as a first-class task type. Sequential execution available as a configurable degradation, not the canonical mode. BullMQ job queue on Redis. Orchestrator is deterministic — agents do not modify the task graph.

## Recommended Harness Strategy
Pre-built harness for the blessed stack. Mechanical enforcement from task one: ESLint with architecture boundaries, TypeScript strict, file structure validation, coverage thresholds, Prisma schema validation, application boot check. Definition-of-done contracts are machine-readable and enforced. Post-phase doc gardening maintains harness freshness. Harness artifacts live in the repo.

## Recommended Repo / Source-of-Truth Strategy
Unchanged. GitHub is authoritative. All durable artifacts live in the repo. Phase branch + task branch model. Structured commit messages. PR as unit of delivery.

## Recommended Trust / Approval Model
Staged autonomy with validator-heavy execution. Unchanged from v1.1:

| Phase | Governance |
|---|---|
| Consultation | Human |
| Product/system design | Human (Checkpoint A) |
| Validation strategy | Human (Checkpoint B) |
| Task graph | Human (Checkpoint C) |
| Implementation | Validator + Agent |
| Repair | Validator + Agent |
| Agent review | Agent + Validator |
| Conflict resolution | Agent + Validator (escalate if unresolvable) |
| PR creation | Validator (automatic on phase completion) |
| Merge to main | Human (Checkpoint D) |

## Recommended Alpha Cut
Full core harness against a single blessed stack. DAG orchestration with bounded concurrency. Worktree isolation. Per-task and cross-task and phase-end validation. Agent-to-agent review. Structured repair. Evidence bundles. Policy-aware execution. Post-phase harness maintenance. Single user, single tenant. Pre-built mechanical enforcement from task one.

## What Is Explicitly Deferred
Multiple stacks. Multi-tenant. Enterprise VMs. Browser automation. Parallel deep research. Custom linter generation. Advanced model routing. Analytics dashboards. Alternate graph views. Harness auto-evolution. Existing repo support. Enterprise features.

## Top Unresolved Questions for Next Phase

1. **Merge conflict frequency.** How often do concurrent tasks produce merge conflicts on real projects? If frequently, the task decomposition quality needs to improve, or the concurrency default should be lower.

2. **Agent review calibration.** Does the agent reviewer produce meaningful quality improvements beyond what the validation pipeline catches? Measure the delta.

3. **Worktree overhead.** What is the real-world overhead of provisioning and tearing down worktrees per task? If significant, consider worktree pooling.

4. **Second blessed stack.** Which stack to add next and what harness template work is required. Python/FastAPI is the likely candidate.

5. **Existing repo support.** What is needed to support connecting to a repo with existing conventions? This is the hardest expansion: the harness must coexist with existing code, not replace it.

6. **Harness auto-evolution.** Can failure classification reliably drive automatic harness updates, or does it produce noise? Requires empirical data from Alpha runs.

7. **Cost model.** What does a typical Alpha build cost in tokens across planner + implementer + validator + reviewer + debugger? Needed for pricing.

8. **Container lifecycle optimization.** Can container startup time be reduced by pre-warming images for the blessed stack? What is the cold-start latency?

9. **Application boot reliability.** The boot check assumes the app can start in the worktree. How often does this fail for legitimate reasons (e.g., missing environment variables, external service dependencies)? Need a strategy for graceful degradation.
