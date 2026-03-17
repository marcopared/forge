# Forge Phase 4: Task Graph and Coding Packet Decomposition

**Version:** 4.0  
**Date:** March 12, 2026  
**Status:** Design Phase — Task Decomposition  
**Prerequisites:** Phase 1-3 stack (all approved, all amendments applied)

---

# 1. Phase 4 Objective

Phase 4 turns the approved implementation architecture into an executable task graph. It answers: "what are the concrete units of work, what depends on what, and in what order should coding agents execute them?"

This phase does not produce code. It produces the DAG of coding packets that coding agents will later consume. The distinction:

| Concept | What It Is |
|---|---|
| **Implementation architecture** (Phase 3) | Subsystem boundaries, responsibilities, interfaces, data ownership |
| **Task decomposition** (this phase) | Concrete packets of work, dependencies, validators, evidence, sequencing |
| **Coding packets** | Individual task definitions with scope, inputs, outputs, and acceptance criteria |
| **Execution scheduling** | Which packets run when, at what concurrency, with what resources |
| **Code generation** (Phase 5) | Agents consuming packets and producing code |

Task decomposition must come after architecture because packets must decompose along stable subsystem boundaries. A packet that crosses subsystem boundaries is a bad packet — it has unclear ownership, ambiguous interfaces, and untestable completion criteria. Phase 3 provides the boundaries; Phase 4 decomposes within them.

---

# 2. Task Decomposition Philosophy

### What makes a task good for coding agents

A good coding packet is: scoped to one subsystem or interface, independently verifiable (its validators can run without other packets completing), produces a named artifact, has explicit acceptance criteria that can be checked mechanically, and is completable in a single agent session (typically under 30 minutes of agent work).

### What makes a task too vague

"Implement the orchestrator" is too vague. It touches too many files, has too many internal decisions, and cannot be validated incrementally. A good packet is "Implement the DAG dependency resolver: given a task graph, return the set of tasks whose dependencies are all SUCCEEDED."

### What makes a task too large

If a packet touches more than ~10 files or requires more than ~500 lines of new code, it is too large. Large packets produce large diffs that are hard to review, hard to validate, and hard to repair. Split them.

### What makes a task independently verifiable

A packet is independently verifiable if its validators can determine pass/fail using only: the packet's output artifacts, the packet's tests, and the existing codebase at the worktree head. If verification requires running another packet's code first, the dependency should be explicit.

### What makes a task safely parallelizable

Two packets can run in parallel if they have no file-scope overlap and no interface dependency. If packet A defines a TypeScript interface that packet B imports, they cannot be parallel — A must complete first so B has a stable import target. If packet A writes to src/orchestrator/ and packet B writes to src/policy-engine/, they can be parallel as long as neither imports from the other.

### How to avoid agent theater

Every packet must produce a testable artifact. "Research the best approach" is not a packet — it produces no testable artifact. "Implement the policy evaluation function with unit tests" is a packet. If you cannot write a validator for the packet, the packet is theater.

---

# 3. Alpha Implementation Workstreams

## WS-1: Foundation (repo skeleton, domain model, schemas)
- **Purpose:** Create the shared substrate all other workstreams build on.
- **Major deliverables:** Repo structure, Prisma schema, TypeScript interfaces for domain objects, event taxonomy types, shared utilities.
- **Dependencies:** None (first to execute).
- **Risk:** Medium — schema decisions lock in data shapes. Mistakes here cascade.
- **Granularity:** ~8-12 packets.

## WS-2: Orchestrator / DAG Runtime
- **Purpose:** Implement the scheduling engine, DAG management, state machine, concurrency control.
- **Dependencies:** WS-1 (domain model, task schema, event types).
- **Risk:** High — the orchestrator is the brain. Correctness is critical.
- **Granularity:** ~10-14 packets.

## WS-3: Policy Engine
- **Purpose:** Implement the runtime authorization layer.
- **Dependencies:** WS-1 (policy model, action class types). Partial dependency on WS-5 (tool broker interface — policy engine must know what tool requests look like).
- **Risk:** High — security-critical. Fail-closed semantics must be correct from day one.
- **Granularity:** ~6-8 packets.

## WS-4: Runtime Manager
- **Purpose:** Container provisioning, worktree lifecycle, cleanup.
- **Dependencies:** WS-1 (configuration model). Light dependency on WS-7 (GitHub integration for git operations).
- **Risk:** Medium — infrastructure-heavy, but well-bounded.
- **Granularity:** ~5-7 packets.

## WS-5: Tool Broker / Typed ACI
- **Purpose:** Typed tool interfaces for all six action classes.
- **Dependencies:** WS-1 (action class types, tool I/O schemas), WS-3 (policy engine interface — tool broker calls policy engine before every invocation).
- **Risk:** Medium — many individual tool implementations, but each is small and independently testable.
- **Granularity:** ~10-14 packets (one per tool cluster).

## WS-6: Agent Runner
- **Purpose:** Agent invocation lifecycle: context packing, model calls, tool mediation, output routing.
- **Dependencies:** WS-1 (context pack schema), WS-5 (tool broker interface), WS-3 (policy engine for role enforcement).
- **Risk:** High — prompt composition and model interaction are the most fragile components.
- **Granularity:** ~6-8 packets.

## WS-7: GitHub Integration
- **Purpose:** All GitHub API interactions: auth, repo CRUD, branching, commit, push, PR, webhooks.
- **Dependencies:** WS-1 (configuration model).
- **Risk:** Medium — external API dependency, but well-documented and stable.
- **Granularity:** ~6-8 packets.

## WS-8: Validator Runner
- **Purpose:** Four-layer validation pipeline execution, result normalization, confidence scoring.
- **Dependencies:** WS-1 (validator result schema), WS-5 (tool broker for executing lint/test/scan commands), WS-3 (policy engine for policy validators).
- **Risk:** Medium — many validators, but each is small. Sequencing logic is the hard part.
- **Granularity:** ~8-10 packets.

## WS-9: Evidence Pipeline
- **Purpose:** Evidence capture, bundle assembly, completeness checking, retention.
- **Dependencies:** WS-1 (evidence schema), WS-8 (validator results), WS-6 (agent run metadata).
- **Risk:** Low-medium — append-only storage, well-defined schema.
- **Granularity:** ~4-6 packets.

## WS-10: Memory / Indexing
- **Purpose:** Tier R search index, context retrieval, freshness management.
- **Dependencies:** WS-1 (schema), WS-7 (repo content access).
- **Risk:** Low — assistive layer, not critical path.
- **Granularity:** ~3-4 packets.

## WS-11: Audit / Observability
- **Purpose:** Event ingestion, structured storage, audit queries.
- **Dependencies:** WS-1 (event taxonomy), Redis Streams setup.
- **Risk:** Low — append-only pipeline.
- **Granularity:** ~3-4 packets.

## WS-12: Approval / Review Service
- **Purpose:** Checkpoint management, escalation queue, human decision recording.
- **Dependencies:** WS-1 (approval model), WS-2 (orchestrator interaction).
- **Risk:** Low — straightforward CRUD + state management.
- **Granularity:** ~3-4 packets.

## WS-13: Control Plane API
- **Purpose:** REST + WebSocket gateway, request routing, session management.
- **Dependencies:** WS-1 (API schema), most backend workstreams (for data queries).
- **Risk:** Low — standard web API patterns.
- **Granularity:** ~6-8 packets.

## WS-14: Control Plane Frontend
- **Purpose:** Three-pane UI: file tree, execution graph, evidence inspector.
- **Dependencies:** WS-13 (API contracts), WS-2 (execution state for graph rendering).
- **Risk:** Medium — complex UI, but can be built incrementally.
- **Granularity:** ~8-12 packets.

## WS-15: Benchmark / Eval Harness
- **Purpose:** Adversarial test repos, eval runner, metric collection.
- **Dependencies:** Full pipeline (runs Forge end-to-end).
- **Risk:** Low — tests the system, does not affect production.
- **Granularity:** ~4-6 packets.

---

# 4. Milestone Hierarchy

## M0: Foundation (Week 1-2)
- **Contains:** WS-1 (repo skeleton, domain model, Prisma schema, event types, shared interfaces, infrastructure setup: PostgreSQL, Redis, S3, Docker base image).
- **Prerequisites:** None.
- **Completion means:** The repo exists with a compilable TypeScript project, database migrations run, Redis connects, Docker image builds.
- **Risks retired:** Schema shape locked, shared interfaces defined.

## M1: Core Runtime (Week 2-5)
- **Contains:** WS-2 (orchestrator), WS-3 (policy engine), WS-4 (runtime manager), WS-5 (tool broker), WS-7 (GitHub integration core).
- **Prerequisites:** M0 complete.
- **Completion means:** A task can be scheduled, provisioned into a worktree, executed by a stub agent, validated, and merged back to the phase branch. Policy engine gates all tool calls. Evidence is captured.
- **Risks retired:** DAG scheduling works, worktree isolation works, policy enforcement works, merge-back works.

## M2: Agent and Validation (Week 4-7)
- **Contains:** WS-6 (agent runner), WS-8 (validator runner), WS-9 (evidence pipeline), WS-11 (audit pipeline).
- **Prerequisites:** M1 core subsystems operational.
- **Completion means:** A real agent can execute a task, produce code, be validated through the four-layer pipeline, have its evidence bundle assembled and checked for completeness.
- **Risks retired:** Agent <> tool broker <> policy engine loop works end-to-end. Validators produce structured results. Evidence bundles are complete.

## M3: Control Plane (Week 5-8)
- **Contains:** WS-12 (approval service), WS-13 (control plane API), WS-14 (control plane frontend), WS-10 (memory/indexing).
- **Prerequisites:** M1 + M2 (backend must produce data the frontend can display).
- **Completion means:** A user can view the execution graph in the UI, inspect evidence, approve checkpoints, and see real-time status updates.
- **Risks retired:** UI is usable, approval flow works end-to-end.

## M4: Integration and Hardening (Week 7-10)
- **Contains:** WS-15 (benchmark harness), end-to-end integration tests, blessed-stack harness template authoring, planner agent prompt development, full pipeline testing against benchmark repos.
- **Prerequisites:** M1 + M2 + M3.
- **Completion means:** Forge can run a full greenfield build against the CRUD benchmark repo and produce a correct, passing result with full evidence.
- **Risks retired:** Full pipeline works end-to-end. Benchmark passes. Platform metrics are collected.

---

# 5. DAG Decomposition Strategy

## Node Types

| Type | Description | Example |
|---|---|---|
| **Implementation packet** | Produces code within one subsystem | "Implement DAG dependency resolver" |
| **Interface packet** | Defines a shared interface or contract | "Define Tool Invocation Request/Response types" |
| **Integration packet** | Connects two subsystems | "Wire orchestrator to tool broker dispatch" |
| **Validator packet** | Implements a specific validator | "Implement ESLint architecture boundary validator" |
| **Configuration packet** | Produces configuration artifacts | "Author blessed-stack ESLint config" |
| **Test packet** | Produces test suites for a subsystem | "Write orchestrator unit tests" |
| **Documentation packet** | Produces or updates design docs | "Update AGENTS.md with subsystem map" |

## Edge Types

| Type | Meaning |
|---|---|
| **Hard dependency** | B cannot start until A is MERGED |
| **Interface dependency** | B needs A's exported types, not A's implementation |
| **Validator dependency** | B's validator requires A's tool to exist |
| **Integration dependency** | C connects A and B, so both must exist |

## Interface-First Strategy

The critical insight for parallelization: define interfaces before implementations. If WS-3 (policy engine) exports a PolicyDecision evaluate(request) interface, and WS-5 (tool broker) imports that interface, then both can be implemented in parallel as long as the interface packet runs first.

This means M0 must include interface packets for every cross-subsystem boundary. These are small packets (type definitions only, no implementation) that unlock parallel implementation work.

---

# 6. Coding Packet Schema

| Field | Purpose |
|---|---|
| **packet_id** | Unique identifier (e.g., F-WS2-004) |
| **title** | Human-readable one-line description |
| **objective** | What this packet achieves in 2-3 sentences |
| **scope** | Files and directories this packet may modify |
| **out_of_scope** | What this packet must NOT touch |
| **workstream** | Owning workstream (WS-1 through WS-15) |
| **milestone** | Which milestone this belongs to (M0-M4) |
| **prerequisites** | Packet IDs that must be MERGED before this starts |
| **required_inputs** | Artifacts or interfaces this packet reads from |
| **expected_outputs** | Files, exports, or artifacts this packet must produce |
| **validators** | Which validators apply to this packet's output |
| **evidence_requirements** | What must be in the evidence bundle |
| **completion_criteria** | Mechanical checks that must pass |
| **risk_level** | low / medium / high / critical |
| **escalation_triggers** | Conditions that should pause and escalate |
| **policy_sensitivities** | Protected paths, dependency changes, harness mutations |
| **doc_updates_required** | Which docs must be updated as part of this packet |

---

# 7. Packet Sizing Rules

| Rule | Threshold |
|---|---|
| **Maximum file scope** | 10 files |
| **Maximum new code** | 500 lines (excluding tests) |
| **Maximum test code** | 300 lines |
| **Minimum testability** | At least one mechanical validator |
| **Single-subsystem rule** | One subsystem's internal code per packet |
| **Split trigger** | Requires unsettled architectural decisions |
| **Merge trigger** | Two packets share 2-3 files and one is < 30 lines |
| **Cross-cutting rule** | Touching > 3 subsystems = dedicated packet with elevated review |

---

# 8. Foundation Packets (M0)

| Packet ID | Title | Dependencies | Key Output | Blocks |
|---|---|---|---|---|
| F-M0-001 | Repo skeleton and monorepo structure | None | apps/api/, apps/web/, packages/shared/, configs | Everything |
| F-M0-002 | Prisma schema: core domain model | F-M0-001 | All core tables | WS-2,3,7,8,9,11,12 |
| F-M0-003 | Shared TypeScript interfaces: domain objects | F-M0-001 | Task, Plan, Evidence, Policy types | All workstreams |
| F-M0-004 | Cross-subsystem contract interfaces | F-M0-003 | PolicyRequest/Decision, ToolRequest/Result, etc. | WS-2,3,5,6,8 |
| F-M0-005 | Event taxonomy types + Redis Streams setup | F-M0-001, F-M0-003 | Event types, publisher utility | WS-2,11,13 |
| F-M0-006 | Action class taxonomy + tool I/O types | F-M0-003 | READ/MUTATE/EXECUTE/ANALYZE/NETWORK/ATTEST types | WS-3,5 |
| F-M0-007 | Evidence schema + retention tier model | F-M0-003 | EvidenceBundle structure, tier enums | WS-9,8 |
| F-M0-008 | Infrastructure connections + health checks | F-M0-001 | DB pool, Redis client, S3 client, health endpoints | All backend |
| F-M0-009 | Docker base image for blessed stack | F-M0-001 | Dockerfile | WS-4 |
| F-M0-010 | BullMQ job queue setup + worker skeleton | F-M0-008 | Queue definitions, worker process | WS-2,6,8 |

---

# 9. Core Runtime Packet Graph (M1)

### Orchestrator (WS-2) — 10 packets

F-WS2-001: DAG representation and storage
F-WS2-002: Dependency resolver
F-WS2-003: Task state machine (transitions, guards, side effects)
F-WS2-004: Bounded concurrency scheduler
F-WS2-005: Speculative execution tracking + freeze logic
F-WS2-006: Task dispatch (orchestrator to job queue to worker)
F-WS2-007: Merge-back coordinator
F-WS2-008: Conflict detection + resolution task creation
F-WS2-009: Checkpointing and crash recovery
F-WS2-010: Repair/retry insertion into DAG

### Policy Engine (WS-3) — 6 packets

F-WS3-001: Policy loader (YAML from harness/policies/)
F-WS3-002: Role-permission matrix implementation
F-WS3-003: Policy evaluation engine (ALLOW/DENY/ESCALATE) ← CRITICAL GATE
F-WS3-004: Scope enforcement + protected-path checks
F-WS3-005: Budget enforcement (cost + time)
F-WS3-006: Policy audit trail writer

### Runtime Manager (WS-4) — 4 packets

F-WS4-001: Container provisioner (Docker API)
F-WS4-002: Worktree lifecycle (create, init, cleanup)
F-WS4-003: Health check + orphan detection
F-WS4-004: Resource limits + network policy

### Tool Broker (WS-5) — 8 packets

F-WS5-001: Tool broker core (routing, policy gate, audit)
F-WS5-002: READ tools (file_read, search, dir_list, symbol_search)
F-WS5-003: MUTATE tools (file_write, patch, delete, rename, git_commit)
F-WS5-004: EXECUTE tools (run_tests, typecheck, lint, coverage, boot_app)
F-WS5-005: EXECUTE tools (shell_exec with allowlist/blocklist)
F-WS5-006: ANALYZE tools (scan_secrets, scan_deps, scan_code, sbom)
F-WS5-007: NETWORK tools (web_fetch, web_search)
F-WS5-008: ATTEST tools (record_evidence, capture_boot_status)

### GitHub Integration (WS-7) — 5 packets

F-WS7-001: GitHub OAuth + token management
F-WS7-002: Repo creation, cloning, branch management
F-WS7-003: Commit, push, merge operations
F-WS7-004: PR creation + status management
F-WS7-005: Webhook receiver + event forwarding

---

# 10. Security / Policy / Tooling Critical Path

The critical ordering: Policy engine core (F-WS3-003) must be operational before any tool broker tool can execute. Without the policy gate, tool invocations bypass authorization.

```
F-M0-006 (action class types)
    |
F-WS3-001 (policy loader)
    |
F-WS3-002 (permission matrix)
    |
F-WS3-003 (evaluation engine)  <-- CRITICAL GATE
    |
F-WS5-001 (tool broker core)
    |
F-WS5-002..008 (individual tools, fan-out, parallelizable)
```

WS-3 is on the critical path for M1.

---

# 11. Validation / Evidence Packet Graph (M2)

### Validator Runner (WS-8) — 8 packets

F-WS8-001: Validator runner core (sequencing, result collection)
F-WS8-002: Layer 1 correctness: compilation, lint, types
F-WS8-003: Layer 1 correctness: tests, coverage, boot
F-WS8-004: Layer 1 correctness: architecture, structure, schema
F-WS8-005: Layer 2 security: secrets, deps, dangerous shell
F-WS8-006: Layer 3 policy: scope-drift, protected-path, harness integrity
F-WS8-007: Layer 4 evidence: completeness, confidence scoring
F-WS8-008: Cross-task + phase-end validation orchestration

### Evidence Pipeline (WS-9) — 4 packets

F-WS9-001: Evidence collector core
F-WS9-002: Bundle assembly + completeness checker
F-WS9-003: Retention tier management + promotion
F-WS9-004: Evidence API for UI

### Audit Pipeline (WS-11) — 3 packets

F-WS11-001: Event ingestion from Redis Streams
F-WS11-002: Structured audit storage + indexing
F-WS11-003: Audit query API

---

# 12. Memory / Indexing (M3) — 3 packets

F-WS10-001: pgvector setup + embedding pipeline
F-WS10-002: Repo file indexing + refresh on merge
F-WS10-003: Context retrieval API

---

# 13. Control Plane Packet Graph (M3)

### Approval Service (WS-12) — 3 packets

F-WS12-001: Approval model (checkpoints, escalation, decisions)
F-WS12-002: Checkpoint lifecycle (A/B/C/D)
F-WS12-003: Escalation queue

### Control Plane API (WS-13) — 6 packets

F-WS13-001: REST API skeleton (auth, routing, errors)
F-WS13-002: Workspace + project CRUD
F-WS13-003: Task graph + execution state endpoints
F-WS13-004: Evidence + audit query endpoints
F-WS13-005: Approval + checkpoint endpoints
F-WS13-006: WebSocket server (real-time events)

### Control Plane Frontend (WS-14) — 8 packets

F-WS14-001: Frontend skeleton (React, routing, layout shell)
F-WS14-002: Left pane: file tree / repo navigator
F-WS14-003: Center pane: planner workspace
F-WS14-004: Center pane: execution DAG visualization
F-WS14-005: Right pane: evidence inspector
F-WS14-006: Checkpoint approval UI
F-WS14-007: Escalation queue UI
F-WS14-008: Real-time status updates via WebSocket

---

# 14. Critical Path

```
F-M0-001 -> F-M0-003 -> F-M0-004 -> F-M0-006
    |
    v
F-WS3-001 -> F-WS3-002 -> F-WS3-003 (CRITICAL GATE)
    |
    v
F-WS5-001 -> F-WS5-004 (EXECUTE tools)
    |
    v
F-WS8-001 -> F-WS8-002 (correctness validators)
    |
    v
F-WS8-008 (cross-task validation)
    |
    v
End-to-end integration
```

**Critical path runs through: foundation types -> policy engine -> tool broker -> validators -> integration.**

---

# 15. Parallelization Strategy

## Early Parallel (M0 to M1)
Once M0 interfaces merged, start in parallel:
- WS-2 (orchestrator) — depends on domain types
- WS-3 (policy engine) — depends on action class types
- WS-4 (runtime manager) — depends on Docker image
- WS-7 (GitHub integration) — depends on infra connections
- WS-14 (frontend skeleton) — depends on repo skeleton

Recommended M1 concurrency: 4-5 parallel streams.

## Mid-Build (M1 to M2)
Once WS-3 core + WS-5 core merged:
- WS-5 tool implementations fan out (up to 7 parallel)
- WS-8 validators start once corresponding tools exist

Recommended M2 concurrency: 5-7 parallel streams.

## Serial Constraints
- Policy engine core (F-WS3-001 -> 002 -> 003): each builds on the last
- Orchestrator core (F-WS2-001 -> 002 -> 003 -> 004): scheduling depends on DAG + state machine
- Tool broker core -> tool implementations: routing must exist first

## Protected from Parallel Modification
- Prisma schema (F-M0-002): single owner
- Cross-subsystem interfaces (F-M0-004): coordinated changes only
- Event taxonomy (F-M0-005): cross-cutting, dedicated packets

---

# 16. Task Risk Taxonomy

| Risk Class | Description | Extra Validators | Human Oversight | Max Size |
|---|---|---|---|---|
| Low: local | One subsystem, clear I/O | Baseline | None | 500 lines |
| Medium: interface | Shared interface consumed by others | + integration test | None | 500 lines |
| High: cross-cutting | Touches > 2 subsystems | + arch check + elevated review | Recommended | 300 lines |
| Critical: security | Policy engine, permissions, protected paths | + security validators + mandatory review | Required | 200 lines |
| Critical: schema | Prisma schema, event types, shared interfaces | + migration check + all-consumer test | Required | Small, serial only |
| High: prompt/agent | Prompt templates, model interaction | + benchmark run | Recommended | Normal |

---

# 17. Validator Assignment Model

### Baseline (all packets)
Compilation, lint, type-check, file structure, evidence completeness.

### By workstream
- WS-2: state machine transition tests, concurrency invariant tests
- WS-3: policy rule unit tests, fail-closed behavior test
- WS-5: tool I/O schema validation, audit trail completeness
- WS-6: prompt template validation, budget enforcement test
- WS-7: GitHub API mock tests, webhook processing tests
- WS-8: validator result schema validation, ordering test
- WS-14: component render tests

### By risk class
- Critical security: secret scan, scope-drift, policy compliance, mandatory review
- Critical schema: migration check, all-consumer compilation
- High cross-cutting: architecture boundary check, full test suite after merge
- High prompt/agent: benchmark run against test repo

---

# 18. Documentation Update Rules

| Packet Class | Required Doc Updates |
|---|---|
| Foundation (M0) | architecture/system-context.md, AGENTS.md initial |
| Subsystem implementation | Corresponding architecture/{subsystem}.md |
| Interface change | All consuming subsystem docs |
| Policy/security | harness/policies/ updated |
| Cross-cutting | system-context.md + affected subsystem docs |
| Final integration (M4) | Full AGENTS.md, harness/validation-stack.md, harness/definition-of-done.md |

---

# 19. Alpha Task Graph Summary

**Total estimated packets: ~95-110**

| Milestone | Workstreams | Packets | Duration |
|---|---|---|---|
| M0: Foundation | WS-1 | ~10 | Week 1-2 |
| M1: Core Runtime | WS-2,3,4,5,7 | ~40-45 | Week 2-5 |
| M2: Agent + Validation | WS-6,8,9,11 | ~20-25 | Week 4-7 |
| M3: Control Plane | WS-10,12,13,14 | ~18-24 | Week 5-8 |
| M4: Integration | WS-15, E2E, benchmarks | ~8-10 | Week 7-10 |

Critical path: ~8-10 weeks with good parallelization.

---

# 20. Readiness Gates

Before coding agents execute from this graph:

| Gate | Requirement |
|---|---|
| Architecture stability | Phase 3 + amendments locked |
| Interface contracts | All cross-subsystem interfaces type-complete |
| Validators specified | Every packet has assigned validators |
| Policy rules authored | Blessed-stack policies in harness/policies/ |
| Harness templates authored | ESLint, tsconfig, Vitest configs exist and tested |
| Benchmark fixtures | CRUD benchmark repo exists with expected output |
| Prompt templates | Implementer, reviewer, debugger prompts drafted |
| Foundation merged | M0 complete: compiles, DB connects, Redis connects, Docker builds |

---

# 21. Repo Artifacts from This Phase

| Artifact | Contents |
|---|---|
| plans/alpha-milestones.md | Milestone definitions, sequencing, completion criteria |
| plans/task-graph.md | Full packet list, dependencies, milestone assignment |
| plans/packet-schema.md | Canonical packet schema with field explanations |
| plans/dependency-matrix.md | Cross-workstream dependencies, critical path |
| plans/parallelization-strategy.md | Concurrency recommendations, serial constraints |
| plans/validator-assignment.md | Per-packet and per-workstream validator sets |
| plans/risk-taxonomy.md | Risk classes, sizing rules, oversight requirements |
| plans/readiness-gates.md | Pre-execution gates |

---

# 22. Open Questions for Phase 5

1. **Operator workflow.** How does the human operator interact with the running task graph? CLI? Dashboard?
2. **Packet generation format.** Structured YAML in repo or dynamically generated?
3. **Agent prompt iteration.** How rapid is the feedback loop on prompt changes?
4. **Foundation authorship.** Should M0 be human-authored or agent-generated?
5. **Concurrency ramp-up.** Start at 1 then increase, or start at 3?
6. **Early failure budget.** What repair rate is acceptable for M0/M1?
7. **Benchmark timing.** First benchmark run after M2 or after M4?
8. **UI priority.** Full three-pane UI or minimal control surface first?

---

# 23. Phase 4 Decision Summary

## Recommended Task Decomposition Philosophy
Single-subsystem packets, independently verifiable, max 500 lines, max 10 files. Interface-first to unlock parallelism. Every packet produces a testable artifact.

## Recommended Milestone Hierarchy
M0 (Foundation) -> M1 (Core Runtime) -> M2 (Agent + Validation) -> M3 (Control Plane) -> M4 (Integration). Milestones overlap.

## Recommended Packet Schema
Eighteen fields: id, title, objective, scope, out-of-scope, workstream, milestone, prerequisites, inputs, outputs, validators, evidence, completion criteria, risk, escalation, policy sensitivities, doc updates.

## Recommended Critical Path
Foundation types -> policy engine core -> tool broker core -> tool implementations -> validator runner -> cross-task validation -> E2E integration. ~8-10 weeks.

## Recommended Parallelization Strategy
4-5 concurrent streams during M1, 5-7 during M2, up to 8 during M3. Policy engine is the critical gate. Foundation interfaces are the parallelism unlock.

## Recommended Validator Assignment Model
Baseline on all packets. Workstream-specific extras. Risk-class escalation for security and schema packets.

## Recommended Alpha Task Graph Shape
~95-110 packets across 15 workstreams, 5 milestones. Fan-out after M0. Fan-in at M4. Critical path through policy engine -> tool broker -> validators.

## Top Operationalization Questions
Operator workflow, packet format, prompt iteration, foundation authorship, concurrency ramp-up, failure budget, benchmark timing, UI priority.
