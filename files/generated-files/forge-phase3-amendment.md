# Forge Phase 3 Amendment: Five Precision Corrections

**Version:** 3.0.1  
**Date:** March 12, 2026  
**Status:** Design Phase — Focused Amendment  
**Baseline:** forge-phase3-implementation.md

---

# Amendment 1: Container Isolation Model — Explicit Justification

**Location:** Section 6 (Worktree and Runtime Manager).

## The Decision

Alpha uses **one container per build phase, with per-task worktree isolation inside it**. This is a deliberate tradeoff, not an accident.

## Why Phase-Container + Worktree Isolation Is Sufficient for Alpha

Alpha is single-user, single-tenant. The adversary model is: agents misbehaving within their scope, not malicious tenants trying to attack each other. Within that model:

- **Filesystem isolation is provided by git worktrees.** Each task operates in its own directory tree. The Tool Broker enforces filesystem scope — agents can only read/write within their worktree path. Cross-worktree access is denied at the policy engine level before it reaches the filesystem.
- **Process isolation is not the primary concern in Alpha.** Agents interact with the environment through the Tool Broker, not by spawning arbitrary processes. The constrained shell allowlist limits what subprocesses can run. A rogue `shell_exec` is caught by policy before execution.
- **Network isolation is shared but filtered.** All tasks share the container's network namespace. Egress filtering (domain allowlist) is applied at the container level. This is sufficient when all tasks belong to the same user and project.
- **Cost is meaningful.** Per-task containers add 10-30 seconds of provisioning overhead per task. With 15-30 tasks per phase at concurrency 3, that is 50-150 seconds of pure provisioning overhead. Phase-container amortizes this to one provisioning event.

## What Risks Remain

| Risk | Severity | Mitigation |
|---|---|---|
| **Shared process namespace.** A runaway process from one task (e.g., a fork bomb via shell_exec) can starve other concurrent tasks of CPU/memory. | Medium | Shell allowlist prevents most dangerous commands. Per-task cgroups within the container can limit CPU/memory per worktree (implementation detail, not architectural). |
| **Shared /tmp and system state.** Tasks share /tmp, environment variables, and system-level caches (node_modules/.cache, pnpm store). A task that corrupts shared caches could affect concurrent tasks. | Low-Medium | Worktree-scoped file operations mitigate most cases. pnpm's content-addressed store is corruption-resistant. /tmp contamination is possible but unlikely through typed tools. |
| **Shared network namespace.** A task performing unexpected network activity (if it bypasses egress filtering) could be attributed to the wrong task in network logs. | Low | Egress filtering at container level. Audit trail records which task triggered each NETWORK action. Attribution is maintained at the Tool Broker level, not the network level. |
| **No defense against container escape.** If an agent's code exploits a container runtime vulnerability, it has access to the host. | Low (Alpha is single-user on dedicated infra) | Acceptable for Alpha. Per-task VMs (Firecracker) would eliminate this for multi-tenant. |

## What Would Trigger Upgrading to Per-Task Containers

Any of the following should trigger a move to per-task containers (or per-task VMs):

1. **Multi-tenant deployment.** Different users' builds must not share any runtime state. Per-task containers become a correctness requirement, not just a safety improvement.
2. **Observed cross-task contamination in Alpha.** If Alpha metrics show any cross-task contamination incidents (target: 0), investigate whether shared-container state is the cause.
3. **Untrusted code execution.** If Forge begins executing generated application code in more complex ways (e.g., running a full web server with external network access per task), the blast radius of a compromised task increases and per-task isolation becomes necessary.
4. **Security audit finding.** If a security review identifies shared-container risks that are not adequately mitigated by Tool Broker + Policy Engine controls.

Until one of these triggers fires, phase-container with worktree isolation is the correct Alpha choice.

---

# Amendment 2: Action Class Granularity — Explicit Scoping Note

**Location:** Section 8 (Typed Tool Broker / ACI Architecture).

## The Clarification

The six action classes (READ, MUTATE, EXECUTE, ANALYZE, NETWORK, ATTEST) are the **Alpha-normalized classification**. They are intentionally coarse — coarse enough for the policy engine to enforce meaningful blanket rules (e.g., "implementer has no NETWORK access") without requiring per-operation policy authoring for Alpha.

Earlier design discussion used a more domain-explicit classification: repo read, file mutation, git mutation, build/test execution, observability read, etc. That finer-grained taxonomy is valid and may become necessary.

## When Finer-Grained Classes Would Be Added

The current six classes should be split if any of the following emerge:

1. **Policy authoring pressure.** If harness authors find they need to write policies like "allow git_commit but deny file_delete" within the same MUTATE class, the class is too coarse. Split MUTATE into FILE_MUTATION and GIT_MUTATION.
2. **Audit trail ambiguity.** If audit queries like "show me all filesystem changes" return git commits mixed with file writes and the distinction matters for forensics, split the class.
3. **UI explanation needs.** If the inspector needs to show "this agent wrote files and ran tests" as distinct categories but both are currently EXECUTE, split EXECUTE into BUILD_TEST and SHELL.
4. **Security boundary refinement.** If security policy needs to distinguish "read own worktree logs" from "read repo source code" for different trust implications, split READ into REPO_READ and OBSERVABILITY_READ.

For Alpha, the six classes are sufficient. The Tool Broker internally tracks the specific tool name on every invocation (e.g., `file_write` vs. `git_commit`), so the audit trail has full granularity even though the policy engine operates at the class level. Splitting classes later is additive — existing policies continue to work, and new finer-grained policies are layered on top.

---

# Amendment 3: Agentic vs. Deterministic Validators — Explicit Distinction

**Location:** Section 10 (Validator Execution Architecture).

## The Clarification

The validator pipeline contains both **deterministic validators** and **agentic validators**. These are fundamentally different in their trust properties and must be clearly distinguished.

### Deterministic Validators

Run as subprocesses with structured input/output. Produce the same result given the same input. No LLM involved.

| Validator | Type | Notes |
|---|---|---|
| Compilation check | Deterministic | `tsc --noEmit` exit code |
| Lint check | Deterministic | ESLint with fixed rule set |
| Type safety check | Deterministic | Static analysis |
| Unit tests | Deterministic | Test runner, fixed tests |
| Integration tests | Deterministic | Test runner, fixed tests |
| Schema validation | Deterministic | Prisma migration check |
| Architecture boundary check | Deterministic | Structural test on import graph |
| File structure check | Deterministic | Filesystem pattern match |
| Application boot check | Deterministic | Process start + health check |
| Secret scanning | Deterministic | Pattern match (Gitleaks) |
| Dependency vulnerability scan | Deterministic | Advisory database lookup (Trivy) |
| Scope-drift check | Deterministic | Compare modified files against declared scope |
| Protected-path check | Deterministic | Path match against protected-path list |
| Harness integrity check | Deterministic | Diff check on harness files |
| Policy compliance check | Deterministic | Audit trail scan |
| Evidence completeness check | Deterministic | Bundle contents vs. checklist |

### Agentic Validators

Require an LLM to evaluate. Produce probabilistic results. Used for judgments that cannot be reduced to structural checks.

| Validator | Type | Notes |
|---|---|---|
| Agent reviewer (code quality, convention adherence, tautological test detection) | Agentic | Reviewer agent examines diff + architecture doc + conventions. Produces structured findings + verdict. |
| Test adequacy review (are tests testing the spec, not just the implementation?) | Agentic | Reviewer checks test-to-requirement traceability and edge case coverage. |
| Doc freshness (semantic, not just structural) | Agentic (hybrid) | Structural link-check is deterministic. Semantic accuracy check (does the doc describe the current code correctly?) requires LLM judgment. |

### How Agentic Review Plugs Into the Validator Lifecycle

Agentic review runs **after** all deterministic validators pass. It is a separate step (AWAITING_REVIEW) in the state machine, not interleaved with the deterministic pipeline.

```
VALIDATING (deterministic, Layers 1-4)
    │
    ├── all deterministic validators pass
    │     ▼
    │   AWAITING_REVIEW (agentic)
    │     │
    │     ├── reviewer approves → SUCCEEDED
    │     └── reviewer requests changes → CHANGES_REQUESTED → RUNNING
    │
    └── any deterministic validator fails
          ▼
        REPAIRING (no agentic review needed yet — fix the hard failure first)
```

This ordering is intentional:
- Deterministic validators are fast, cheap, and reliable. Run them first. If they fail, there's no point running an expensive LLM review.
- Agentic review is slower, more expensive, and probabilistic. It should only run on code that has already passed all mechanical checks.
- Agentic review can request changes, which triggers a new implementation → validation → review cycle. But the re-implementation is still validated deterministically before being reviewed again.

The key invariant (from Phase 2 Amendment 1) still holds: **agentic review cannot override a deterministic validator failure.** If lint fails, the reviewer cannot approve the task. The reviewer operates on the set of tasks that are deterministically valid and adds a judgment layer on top.

---

# Amendment 4: Evidence Tier 0 Pre-Merge vs. Post-Merge Clarification

**Location:** Section 11 (Evidence Pipeline Architecture).

## The Correction

The base document marks diff evidence as "Tier 0 (committed) + Tier 1 (metadata)." This is imprecise. Before merge, the diff exists only in a task worktree branch that has not yet been merged to the phase branch, let alone to main. It is not yet authoritative repo truth.

### Corrected Model

| Evidence State | Storage Tier | Authority |
|---|---|---|
| **Pre-validation diff** (agent just finished, worktree branch exists) | Tier 2 (captured as blob, ephemeral) | Operational — not yet validated, not yet merged |
| **Post-validation diff metadata** (diff recorded in evidence bundle after validators pass) | Tier 1 (structured record in PostgreSQL) | Operational — validated but not yet merged |
| **Post-merge committed code** (task branch merged to phase branch, phase branch merged to main) | Tier 0 (in GitHub repo) | Authoritative — this is the source of truth |

### Practical Implication

- During the task lifecycle (RUNNING → VALIDATING → REVIEWING → SUCCEEDED), the diff is evidence (Tier 1/2), not truth (Tier 0).
- When the task merges to the phase branch, the code in the phase branch becomes the working truth for subsequent tasks (they branch from it).
- When the phase PR merges to main (Checkpoint D), the code becomes Tier 0 authoritative.
- If a task is CANCELED or FAILED, its worktree is cleaned up. The diff evidence persists in Tier 1/2 for forensic purposes but never reaches Tier 0.

This distinction matters for the memory model: agents working on subsequent tasks should treat the phase branch code as "current working state" (reliable but not yet authoritative), not as Tier 0 truth. Tier 0 is only what has been merged to main.

---

# Amendment 5: PostgreSQL Failure — Stronger Degradation Semantics

**Location:** Section 18 (Failure Domains and Blast Radius).

## The Correction

The base document states: "PostgreSQL down → read from Redis cache, pause writes." This understates the severity. PostgreSQL is the durable state store for the orchestrator, task state machine, evidence bundles, audit trail, and approval records. Losing it is not a graceful degradation — it is a hard pause for anything that matters.

### Corrected Failure Behavior

**When PostgreSQL is unavailable:**

| Subsystem | Behavior |
|---|---|
| **Orchestrator** | **Hard pause.** Cannot persist state transitions. Cannot schedule new tasks. Cannot record merge-back results. Must stop making progress. In-flight tasks that are mid-agent-run may continue their current LLM call, but the result cannot be committed to state. |
| **Task State Machine** | **Frozen.** No transitions. Any transition attempt is queued in memory (bounded buffer) and retried when PostgreSQL recovers. If the buffer fills, the orchestrator shuts down gracefully. |
| **Evidence Collector** | **Queues to Redis.** Evidence items are buffered in Redis (bounded, ~1000 items). If Redis buffer fills, evidence capture blocks (which blocks task completion). On PostgreSQL recovery, the buffer is flushed. |
| **Approval Service** | **Frozen.** Cannot record decisions. Human approvals are queued in the UI and submitted when PostgreSQL recovers. |
| **Audit Pipeline** | **Queues to Redis.** Same buffering strategy as Evidence Collector. Audit events are not lost but are delayed. |
| **Control Plane API** | **Partially readable.** UI can serve cached data from Redis (task states, recent events). No writes accepted. Stale-data indicator shown in UI. |
| **Agent Runner** | **May continue current run.** An agent mid-execution can continue its LLM conversation and tool calls (these don't require PostgreSQL). But when the agent completes, its results cannot be persisted, so the task stays in RUNNING until PostgreSQL recovers and the completion event is processed. |
| **GitHub Integration** | **Paused for writes.** Cannot record commit/push/merge results. Read-only webhook processing may continue (events queued). |

### Recovery

When PostgreSQL recovers:
1. Orchestrator reads last-committed state from PostgreSQL.
2. Redis buffers (evidence, audit events) are flushed to PostgreSQL.
3. Tasks that were in RUNNING during the outage are reconciled: check worktree for completion markers, re-process completion events.
4. Normal scheduling resumes.

### Design Principle

> **PostgreSQL is the single point of durable truth for the control plane. Its loss is a hard pause, not a graceful degradation. The system is designed to pause safely and resume correctly, not to continue making progress without durable state.**

This is the correct posture for Alpha. A system that continues scheduling and completing tasks without durable state persistence is a system that can lose work. Pausing is safer than guessing.

---

# Summary of Amendments

| # | Amendment | Type | Impact |
|---|---|---|---|
| 1 | Container isolation model justification | Decision justification | Explicit rationale for phase-container + worktree. Risks documented. Upgrade triggers defined. |
| 2 | Action class granularity note | Scoping clarification | Six classes are Alpha-normalized. Finer-grained classes added when policy/audit pressure demands. |
| 3 | Agentic vs. deterministic validators | Architectural clarification | Deterministic validators run first. Agentic review runs after. Agentic cannot override deterministic. |
| 4 | Evidence Tier 0 pre/post merge | Precision correction | Pre-merge diff is Tier 1/2 evidence. Post-merge committed code is Tier 0 authority. |
| 5 | PostgreSQL failure semantics | Severity correction | PostgreSQL loss is a hard pause, not graceful degradation. System pauses safely and resumes correctly. |
