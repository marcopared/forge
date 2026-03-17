# Forge Phase 4 Amendment: Seven Structural Corrections

**Version:** 4.0.1  
**Date:** March 12, 2026  
**Status:** Design Phase — Focused Amendment  
**Baseline:** forge-phase4-task-graph.md

---

# Amendment 1: Timeline Realism

## The Problem

The 8-10 week estimate treats all packets as roughly equal-friction implementation work. They are not. Several packets on the critical path are **architecture-bearing** — they define contracts that downstream work depends on, and they are the exact places where rework concentrates:

- Cross-subsystem interface contracts (F-M0-004)
- Tool action class definitions (F-M0-006)
- Policy rule definitions (WS-3 core)
- Task state machine definition (F-WS2-003)
- Tool broker framework (F-WS5-001)
- EXECUTE tools (F-WS5-004)
- Validator executor (F-WS8-001)
- All four validator layers (F-WS8-002 through 007)
- Orchestrator integration (F-WS2-006, 007)

These packets will likely require revision cycles, interface negotiation, and rework that ordinary implementation packets do not. A lint-tool wrapper can be built in one pass. A state machine definition that six other subsystems depend on cannot.

## The Correction

The 8-10 week figure is an **optimistic best case under ideal conditions**, not planning truth. The design should be read with the following expectations:

| Scenario | Duration | Conditions |
|---|---|---|
| Optimistic | 8-10 weeks | No major interface rework, no architecture surprises, high first-pass success on critical-path packets |
| Realistic | 12-14 weeks | 1-2 interface revision cycles, moderate rework on state machine and policy engine, some packet splitting mid-flight |
| Pessimistic | 16+ weeks | Significant architecture rework discovered during integration, multiple foundation packets require re-opening |

**The plan should target the realistic range.** If the optimistic case materializes, that is a bonus, not an expectation. Phase 5 (operationalization) should build its cadence around the realistic range.

---

# Amendment 2: Foundation Split — M0a and M0b

## The Problem

M0 currently groups all foundation packets together: core domain types, cross-subsystem interfaces, event taxonomy, action class taxonomy, evidence schema, Prisma schema, Docker image, BullMQ setup, and infrastructure connections. These are not equal in foundational weight.

The contracts (interfaces, state machine shape, policy model, action classes, evidence schema) are the load-bearing decisions. Getting them wrong invalidates downstream parallelism. The infrastructure scaffolding (Docker image, Redis connection, BullMQ setup) is important but lower-risk — it is unlikely to require rework that cascades.

## The Correction

Split M0 into two sub-milestones:

### M0a: Core Contracts (Week 1, high scrutiny)

| Packet | Why It's M0a |
|---|---|
| F-M0-003: Shared TypeScript interfaces (domain objects) | Every subsystem imports these |
| F-M0-004: Cross-subsystem contract interfaces | Policy, Tool, Validator, Agent contracts — the most coupling-sensitive definitions in the system |
| F-M0-005: Event taxonomy types | Event shapes used by orchestrator, audit, UI |
| F-M0-006: Action class taxonomy + tool I/O types | Policy engine and tool broker both depend on these |
| F-M0-007: Evidence schema + retention tier model | Validator and evidence pipeline depend on these |

**M0a requires elevated review.** These packets should be human-reviewed (or at minimum, reviewed against the Phase 3 architecture doc by the reviewer agent with mandatory human sign-off) before any M1 packet starts. A mistake in M0a propagates everywhere. The cost of getting M0a right is a few days of careful review. The cost of getting it wrong is weeks of rework.

### M0b: Scaffolding and Infrastructure (Week 1-2, standard review)

| Packet | Why It's M0b |
|---|---|
| F-M0-001: Repo skeleton and monorepo structure | Standard scaffolding |
| F-M0-002: Prisma schema | Depends on M0a domain types; implements them as DB tables |
| F-M0-008: Infrastructure connections + health checks | Standard DevOps |
| F-M0-009: Docker base image | Standard container config |
| F-M0-010: BullMQ setup + worker skeleton | Standard queue setup |

M0b packets can begin in parallel with M0a (F-M0-001 has no M0a dependency), but F-M0-002 (Prisma schema) depends on M0a types being stable. The sequencing:

```
M0a starts immediately (core contracts)
M0b-001 starts immediately (repo skeleton, no M0a dep)
M0b-008, 009, 010 start after M0b-001
M0b-002 (Prisma) starts after M0a is reviewed and merged
    |
    v
M1 begins only after M0a AND M0b-002 are merged
```

---

# Amendment 3: Agent Runner Packet Breakdown

## The Problem

WS-6 (Agent Runner) was listed as a workstream but did not receive the same packet-level breakdown as WS-2, WS-3, WS-4, WS-5, WS-7, and WS-8. This is a gap — the Agent Runner is a core runtime subsystem with several distinct internal concerns.

## The Correction

### Agent Runner (WS-6) — 7 packets, Milestone M2

| Packet ID | Title | Prerequisites | Key Output |
|---|---|---|---|
| **F-WS6-001** | Context pack composer | F-M0-004, F-M0-007, F-WS10-003 (or stub) | Assembles trust-labeled context packs from worktree files, harness docs, task description. Enforces token budget. Records manifest. |
| **F-WS6-002** | Prompt assembly and trust labeling | F-WS6-001, F-M0-004 | Composes LLM prompt from context pack with SYSTEM / HARNESS / CODE / EXTERNAL sections. Injects role constraints, tool permissions, completion criteria into SYSTEM section. |
| **F-WS6-003** | Model invocation abstraction | F-M0-008 | Provider-agnostic model call interface. Handles API keys, timeouts, retries, error normalization. Hardcoded model-per-role for Alpha (Opus for planner/debugger/reviewer, Sonnet for implementer/doc-updater). |
| **F-WS6-004** | Tool call mediation | F-WS6-003, F-WS5-001 | Parses model tool-call responses, forwards structured tool requests to Tool Broker, returns structured results to agent. Handles DENY/ESCALATE responses from policy engine. |
| **F-WS6-005** | Structured output parsing | F-WS6-004 | Parses agent final output: files written, commits made, review findings, completion claims. Normalizes output for downstream consumption by validators, evidence collector, orchestrator. |
| **F-WS6-006** | Budget enforcement | F-WS6-003, F-WS3-005 | Tracks token consumption and wall-clock time per agent run. Terminates on budget exceedance. Reports partial results on termination. |
| **F-WS6-007** | Agent run record persistence | F-WS6-005, F-M0-002 | Persists agent run metadata (tokens, duration, tools called, model used, completion status) to PostgreSQL. Links to task ID and evidence bundle. |

### Dependency Position

WS-6 depends on:
- M0a contracts (context pack schema, trust labels)
- WS-5 core (tool broker — agent calls tools through it)
- WS-3 core (policy engine — agent role enforcement)
- WS-10 or a stub (context retrieval — can stub with scope-only file selection for early integration)

WS-6 is consumed by:
- WS-2 (orchestrator dispatches to agent runner)
- WS-8 (validator runner processes agent outputs)
- WS-9 (evidence collector ingests agent run records)

This places WS-6 squarely in M2, starting after WS-5 core is operational.

---

# Amendment 4: Explicit Integration Packets

## The Problem

The base document leans heavily toward per-subsystem implementation packets. Integration between subsystems is implied by dependency edges but not explicitly packetized. In practice, integration is where the most failures occur — interface mismatches, event format disagreements, timing assumptions, error handling at boundaries.

## The Correction

Add explicit integration packet groups. These are not "wiring" — they are real verification points.

| Packet ID | Integration | Prerequisites | Key Validation |
|---|---|---|---|
| **F-INT-001** | Orchestrator ↔ Runtime Manager | F-WS2-006, F-WS4-002 | Orchestrator schedules task → Runtime Manager provisions worktree → worktree is ready → agent can be dispatched. Test: schedule a stub task, verify worktree exists at expected path. |
| **F-INT-002** | Tool Broker ↔ Policy Engine | F-WS5-001, F-WS3-003 | Tool request → policy evaluation → ALLOW/DENY/ESCALATE → tool execution or structured denial. Test: submit tool requests for each action class, verify correct policy decisions for each agent role. |
| **F-INT-003** | Agent Runner ↔ Tool Broker | F-WS6-004, F-WS5-001 | Agent produces tool call → Agent Runner forwards to Tool Broker → result returns to agent. Test: end-to-end agent run with real tool calls, verify audit trail records all invocations. |
| **F-INT-004** | Orchestrator ↔ Validator Runner | F-WS2-003, F-WS8-001 | Task completes → orchestrator transitions to AWAITING_VALIDATION → validator runner executes pipeline → results return → orchestrator transitions to next state. Test: complete a stub task, verify all four validator layers run, verify state transitions correctly on pass and fail. |
| **F-INT-005** | Validator Runner ↔ Evidence Pipeline | F-WS8-007, F-WS9-002 | Validator results feed into evidence bundle → evidence completeness check runs → bundle is assembled. Test: after validation, verify evidence bundle contains all required items from Phase 2 checklist. |
| **F-INT-006** | Orchestrator ↔ Approval Service | F-WS2-003, F-WS12-002 | Task reaches checkpoint or escalation → approval request created → human decides → orchestrator receives decision → state transitions. Test: trigger each checkpoint type, verify approval flow end-to-end. |
| **F-INT-007** | GitHub Integration ↔ Merge-Back Coordinator | F-WS7-003, F-WS2-007 | Task SUCCEEDED → merge-back to phase branch → cross-task validation → if conflict, create resolution task. Test: merge two non-conflicting tasks, then two conflicting tasks, verify correct behavior for both. |
| **F-INT-008** | Control Plane API ↔ Evidence Pipeline | F-WS13-004, F-WS9-004 | UI requests evidence for a task → API queries evidence collector → returns structured evidence bundle → UI renders inspector. Test: complete a task with full evidence, query via API, verify all fields present. |

### Milestone Assignment

- F-INT-001, F-INT-002: Late M1 (after core subsystems exist)
- F-INT-003, F-INT-004, F-INT-005: Early M2 (after agent runner and validators exist)
- F-INT-006, F-INT-007: Mid M2 (after approval service and GitHub merge-back)
- F-INT-008: M3 (after control plane API exists)

### Impact on Packet Count

This adds 8 explicit integration packets, bringing the total from ~95-110 to ~103-118. This is appropriate — integration testing is not overhead, it is risk retirement.

---

# Amendment 5: Frontend Parallelization Sequencing

## The Problem

The base document says frontend work can start once API stubs exist. This is true for the shell, layout, and navigation. But the three-pane UI has unusually tight coupling to live runtime semantics:

- **Execution DAG visualization** (center pane) depends on the exact shape of task graph state, node lifecycle, and real-time event model.
- **Evidence inspector** (right pane) depends on the exact shape of evidence bundles, validator results, and audit trail records.
- **Real-time updates** depend on the WebSocket event model being stable.

Starting these panes before the read models are stable means building against assumptions that will change.

## The Correction

Sequence frontend packets into two tiers:

### Tier 1: Start in parallel with M1 (safe)
- F-WS14-001: Frontend skeleton (React, routing, layout shell)
- F-WS14-002: Left pane — file tree / repo navigator (depends on GitHub API for file listing, which is straightforward)
- F-WS14-003: Center pane — planner workspace (depends on chat API, not execution state)

### Tier 2: Start after M2 read models are stable (requires backend data shapes)
- F-WS14-004: Center pane — execution DAG visualization (needs task graph state model finalized)
- F-WS14-005: Right pane — evidence inspector (needs evidence bundle schema finalized)
- F-WS14-006: Checkpoint approval UI (needs approval service API)
- F-WS14-007: Escalation queue UI (needs escalation model)
- F-WS14-008: Real-time updates via WebSocket (needs event model stable)

This does not slow the frontend significantly — Tier 1 is 2-3 weeks of work, by which time M2 data models are likely stable. But it prevents building execution graph and inspector views against speculative API shapes.

---

# Amendment 6: Graph Repair Mechanism for Phase 5

## The Problem

Phase 5's open questions list operator workflow, prompt iteration, and failure budgets. Missing: what happens when the packet graph itself is wrong?

Not runtime failure (a packet fails validation) — planning failure (a packet turns out not to be independently verifiable, or two packets have hidden coupling, or a packet's scope was wrong).

## The Correction

Add the following to the Phase 5 open questions (and note it as a required Phase 5 deliverable):

**Graph repair mechanism.** Phase 5 must define how to handle mid-execution discovery that the packet graph needs structural changes. At minimum:

| Situation | Repair Action |
|---|---|
| A packet is not independently verifiable (validator needs another packet's output) | **Insert interface packet** between them. The first packet exports a stable interface; the second imports it. The original packet may need to be split. |
| Two packets have hidden coupling (one breaks when the other merges) | **Insert integration packet** that tests the boundary. Optionally, merge the two packets if they are small enough. |
| A packet's scope was wrong (it needs to touch files outside its declared scope) | **Reclassify and resize.** If the new scope is small, expand the packet's scope declaration. If large, split into two packets. |
| A speculative downstream packet started on assumptions that changed | **Invalidate and requeue.** The downstream packet is canceled, its worktree is discarded, and it is requeued with updated prerequisites. |
| An M0a contract (interface, event type, schema) needs revision after M1 work has started | **Schema migration packet.** Create a new packet that updates the contract and all consuming code. This is a cross-cutting packet with elevated review and critical risk classification. |

This is not theoretical — it will happen in the first few weeks of execution. Phase 5 must have the mechanism ready.

---

# Amendment 7: Packet Sizing — Demote LOC, Promote Structural Rules

## The Problem

The base document uses file count (≤ 10) and line count (≤ 500 new lines) as primary sizing rules. These are useful heuristics but risk becoming the optimization target. An agent that produces exactly 499 lines of poorly structured code in 10 files has satisfied the heuristic while violating the intent.

## The Correction

Restate the sizing rules with structural criteria as primary and LOC as secondary:

### Primary Sizing Rules (structural)

1. **One subsystem concern.** A packet addresses a single internal concern within one subsystem. If you need a conjunction to describe it ("implement the scheduler AND the state machine"), it is two packets.

2. **One validator story.** The packet's output can be assessed by a coherent set of validators. If the validators for the packet come from two different workstreams, the packet probably crosses a boundary.

3. **One evidence story.** The evidence bundle for the packet tells a single story. "These files were changed, these tests were run, these checks passed" should be a coherent narrative, not two unrelated sets of changes.

4. **One clear completion contract.** The completion criteria can be stated in 2-3 sentences. If you need a paragraph to explain what "done" means, the packet is too large or too vague.

### Secondary Sizing Heuristics (guard rails)

5. **File count heuristic.** ≤ 10 files is a useful warning threshold. If a packet touches more than 10 files, check whether the structural rules are satisfied. It may still be valid (a rename refactor touches many files but is one concern), but it warrants a check.

6. **Line count heuristic.** ≤ 500 lines of new code (excluding tests) is a useful warning threshold. Same logic — check structural rules first, use LOC as a red flag, not a target.

7. **Duration heuristic.** If a packet is expected to take more than 30 minutes of agent execution time, it is likely too large. But this is an output metric, not an input rule — you discover it, you don't plan for it.

---

# Summary of Amendments

| # | Amendment | Type | Impact |
|---|---|---|---|
| 1 | Timeline realism | Calibration | 12-14 week realistic range. 8-10 is optimistic best case. |
| 2 | Foundation split (M0a/M0b) | Structural | M0a (core contracts) gets elevated review. M0b (scaffolding) proceeds in parallel. |
| 3 | Agent Runner packets | Gap fill | 7 packets for WS-6: context composer, prompt assembly, model invocation, tool mediation, output parsing, budget enforcement, run persistence. |
| 4 | Integration packets | Risk retirement | 8 explicit integration packets across subsystem boundaries. Total packets: ~103-118. |
| 5 | Frontend parallelization | Sequencing | Tier 1 (shell, file tree, planner) starts early. Tier 2 (DAG viz, inspector, real-time) waits for M2 read models. |
| 6 | Graph repair mechanism | Phase 5 requirement | Five repair actions for mid-execution graph failures: insert interface packet, insert integration packet, reclassify, invalidate, schema migration. |
| 7 | Packet sizing rules | Priority correction | Structural rules (one concern, one validator story, one evidence story, one completion contract) are primary. LOC/file count are secondary heuristics. |
