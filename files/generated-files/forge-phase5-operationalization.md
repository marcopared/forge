# Forge Phase 5: Operationalization and Execution Planning

**Version:** 5.0  
**Date:** March 13, 2026  
**Status:** Design Phase — Execution Planning  
**Prerequisites:** Phase 1-4 stack (all approved, all amendments applied)

---

# 1. Phase 5 Objective

Phase 5 answers: "Now that we have an approved architecture, a validated evaluation harness, and a decomposed task graph — how do we actually start running it safely?"

The distinction matters:

| Concept | What It Decides |
|---|---|
| **Task graph design** (Phase 4) | What the packets are, what depends on what |
| **Execution planning** (this phase) | How packets are activated, supervised, reviewed, repaired, and rolled out |
| **Operator workflow** | What the human does before, during, and after agent execution |
| **Rollout strategy** | What order, what concurrency, what gates between waves |
| **Coding execution** (Phase 6) | Agents consuming packets and producing code |

An approved graph is not the same as an executable graph. Packets exist in a dependency structure, but activating them requires: precondition checks, validator readiness verification, review capacity planning, fallback procedures, and operator confidence in the pipeline. Phase 5 designs all of that.

---

# 2. Execution Philosophy

**The first rollout is staged, not all-at-once.** Even though the graph is approved, the pipeline has never been exercised end-to-end. The first packets test the pipeline as much as they test the code they produce. Running 30 packets on day one would produce 30 potential failures with no baseline for distinguishing packet failures from pipeline failures.

**Validator-heavy execution changes operator behavior.** The operator does not review every diff. They review: escalations, graph health, metric trends, and merge candidates. Their loop is closer to an SRE monitoring a deployment than an engineer reviewing PRs.

**Coding agents behave differently from planning agents.** The planner engages in open-ended dialogue with the human. Coding agents execute scoped contracts with structured inputs, constrained tools, and mechanical validators. They do not negotiate — they produce output within the packet's contract and let validators judge it.

**Rollout safety matters because the architecture is untested under real load.** The subsystem boundaries are designed. The interfaces are defined. The policies are authored. But no real agent has executed a real packet through the real pipeline. The first waves surface the gap between design and reality.

---

# 3. Packet Activation Model

## What "Eligible for Activation" Means

A packet becomes eligible when all of the following are true:

1. **All prerequisite packets are MERGED.** Not just SUCCEEDED — the code is merged to the phase branch and cross-task validation has passed.
2. **Validator readiness confirmed.** Every validator assigned to this packet is operational (the tool it depends on exists and passes a health check).
3. **Evidence requirements are achievable.** The evidence collector can capture the required evidence types for this packet class.
4. **Policy engine can evaluate this packet's action classes.** The relevant policy rules are loaded and tested.
5. **Concurrency budget available.** The current number of active packets is below the wave's concurrency limit.
6. **Rollout wave permits this packet class.** The current wave allows the packet's risk class (see Section 4).

## What Makes a Packet Ineligible

- Prerequisite not yet MERGED
- Assigned validator not yet operational (validator packet hasn't shipped yet)
- Rollout wave restriction (high-risk packet in a low-risk wave)
- Workstream paused (operator paused the workstream due to failures)
- Graph repair pending (packet's dependency graph is being restructured)

## Activation Classes

| Class | Meaning | Trigger |
|---|---|---|
| **Auto-activatable** | Packet activates as soon as all preconditions are met. Orchestrator schedules it. | Low-risk local packets in approved waves. |
| **Operator-launched** | Packet is eligible but waits for operator to explicitly activate it. | Interface packets, first-of-workstream packets, integration packets. |
| **Gated** | Packet requires explicit human approval before activation, even if preconditions are met. | Security-sensitive, schema-changing, policy-sensitive, graph-repair packets. |

The default in Wave 1-2 is operator-launched. As confidence builds, more packets become auto-activatable.

---

# 4. Initial Rollout Strategy

## Wave 0: Dry Run (Before Real Execution)

**Purpose:** Verify the pipeline works end-to-end before any real packet executes.

**What happens:**
- Run a synthetic "hello world" packet through the full pipeline: dispatch → provision worktree → stub agent writes a file → validator runs (compilation, lint, structure check) → evidence is captured → merge-back to phase branch.
- Verify: policy engine gates the stub agent's tool calls correctly. Audit trail records all invocations. Evidence bundle is complete. State machine transitions correctly.
- Run policy enforcement unit tests.
- Run evidence completeness assertions.

**Success means:** The pipeline works. Not the agents — the pipeline.

**Concurrency:** 1.
**Duration:** 1-2 days.

## Wave 1: Foundation Contracts (M0a)

**Purpose:** Execute the most foundational, highest-scrutiny packets with maximum human attention.

**Packets:** F-M0-003, F-M0-004, F-M0-005, F-M0-006, F-M0-007 (core contracts from M0a).

**Activation:** Operator-launched, one at a time.
**Review:** Human reviews every output. These define the contracts everything else depends on.
**Concurrency:** 1 (serial). The goal is correctness, not speed.
**Duration estimate:** 3-5 days (allowing for revision cycles).

**Success means:** Core type definitions, cross-subsystem interfaces, event types, action classes, and evidence schema are merged and stable. M1 can begin.

## Wave 2: Foundation Scaffolding (M0b) + First M1 Locals

**Purpose:** Stand up infrastructure and begin the first real subsystem implementations.

**Packets:** M0b scaffolding (repo skeleton, Prisma schema, Docker image, infrastructure, BullMQ). Plus: first local implementation packets from low-risk workstreams (WS-4 runtime manager, WS-7 GitHub integration basics, WS-11 audit pipeline).

**Activation:** Auto-activatable for M0b scaffolding. Operator-launched for first M1 packets.
**Review:** Human reviews Prisma schema (M0b-002). Standard validator + agent review for others.
**Concurrency:** 2-3.
**Duration estimate:** 1-2 weeks.

**Success means:** Repo compiles, database migrates, Docker image builds, Redis connects. First M1 subsystem code is in place.

## Wave 3: Critical Path Runtime (M1 Core)

**Purpose:** Build the critical-path subsystems: policy engine, tool broker core, orchestrator core.

**Packets:** WS-3 (policy engine: F-WS3-001 through 003), WS-5 (tool broker core: F-WS5-001), WS-2 (orchestrator: F-WS2-001 through 003).

**Activation:** Operator-launched for critical-path packets (policy engine, tool broker core). Auto-activatable for non-critical locals.
**Review:** Security-sensitive policy engine packets get mandatory human review. Others use validator + agent review.
**Concurrency:** 3-4 (policy engine is serial internally, but can run parallel with orchestrator and runtime manager).
**Duration estimate:** 2-3 weeks.

**Success means:** Policy engine evaluates tool requests. Tool broker routes through policy gate. Orchestrator manages DAG state. The "hard center" exists.

## Wave 4: Tool Fan-Out + Agent/Validator Build (M1 completion + M2)

**Purpose:** Fan out tool implementations and begin agent runner and validator runner.

**Packets:** WS-5 tool implementations (F-WS5-002 through 008), WS-6 (agent runner), WS-8 (validator runner), WS-9 (evidence pipeline). Integration packets (F-INT-001 through 005).

**Activation:** Auto-activatable for tool implementations (they are independent, well-scoped). Operator-launched for integration packets.
**Review:** Agent review for tool implementations. Human review for integration packets and agent runner prompt-related packets.
**Concurrency:** 5-7 (tool implementations fan out widely).
**Duration estimate:** 3-4 weeks.

**Success means:** A real agent can execute a packet, call tools through the broker, be validated through the four-layer pipeline, and have its evidence bundle assembled. The first end-to-end agent-driven packet succeeds.

## Wave 5: Control Plane + Hardening (M3 + M4)

**Purpose:** Build the UI, approval service, benchmark harness, and run end-to-end integration tests.

**Packets:** WS-12, WS-13, WS-14 (Tier 1 frontend first, Tier 2 after read models stable), WS-10, WS-15, remaining integration packets.

**Activation:** Auto-activatable for most. Operator-launched for benchmark harness.
**Concurrency:** 6-8.
**Duration estimate:** 3-4 weeks.

**Success means:** Full pipeline works end-to-end against benchmark repos. UI is usable. Benchmarks pass.

---

# 5. Operator Workflow

## The Core Operator Loop

```
MORNING:
  1. Check overnight results (which packets completed, which failed, which are pending)
  2. Review escalation queue (blocked tasks, policy escalations)
  3. Review merge candidates (completed phases with open PRs)
  4. Triage failures (classify as packet failure vs pipeline failure vs graph defect)

ACTIVE WORK:
  5. Launch operator-gated packets if prerequisites are met
  6. Approve or reject gated actions (dependency additions, harness changes)
  7. Perform graph repair if needed (split packets, insert interface packets)
  8. Review and approve high-risk packet outputs

PERIODIC:
  9. Check metrics dashboard (success rate, repair rate, review queue depth)
  10. Adjust concurrency if needed (increase if stable, decrease if unstable)
  11. Run benchmark suite if pipeline changes were made
  12. Update operational notes (what worked, what surprised)

END OF DAY:
  13. Queue overnight packets (low-risk auto-activatable packets that can run unsupervised)
  14. Set alerts for critical failures
```

## Key Operator Actions

| Action | When | What Happens |
|---|---|---|
| **Launch packet** | Operator-launched packet is eligible | Operator reviews packet spec, confirms readiness, activates |
| **Approve escalation** | Policy engine or repair loop escalated | Operator reviews evidence, makes decision (approve/reject/re-scope) |
| **Approve merge** | Phase complete, PR ready | Operator reviews aggregate evidence, approves merge to main |
| **Pause workstream** | Multiple failures in same workstream | Operator pauses all packets in that workstream, investigates |
| **Graph repair** | Packet spec is wrong, dependency is missing | Operator or system proposes repair, operator approves |
| **Adjust concurrency** | Metrics indicate instability or capacity | Operator changes concurrency limit |
| **Rollback** | Critical failure affecting merged code | Operator triggers revert of specific merge-back |

---

# 6. Coding-Agent Operating Model by Packet Class

### Foundation Packets (M0a contracts)
- **Behavior:** Produce type definitions and interface contracts. No implementation logic.
- **Scope:** `packages/shared/` types only.
- **Context:** Architecture docs, Phase 3 subsystem specs, domain model description.
- **Failure modes:** Types that don't compose, missing fields, wrong cardinality.
- **Validator emphasis:** Compilation, type consistency.
- **Human review:** Always in Wave 1-2.
- **Split trigger:** If a single interface packet defines contracts for > 3 consumers.

### Interface Packets (cross-subsystem)
- **Behavior:** Define the contract between two subsystems. Export types and function signatures.
- **Scope:** The interface file(s) between two subsystems.
- **Context:** Both subsystems' architecture docs, existing types, consuming code if any.
- **Failure modes:** Interface that doesn't match either consumer's expectations.
- **Validator emphasis:** Compilation + consumer import check.
- **Human review:** Operator-launched in early waves. Auto after Wave 3 if stable.

### Implementation Packets (local subsystem)
- **Behavior:** Implement internal logic within one subsystem boundary.
- **Scope:** Files within one subsystem directory.
- **Context:** Subsystem architecture doc, relevant interfaces, test strategy.
- **Failure modes:** Logic errors, missing edge cases, architecture boundary violations.
- **Validator emphasis:** Full four-layer pipeline.
- **Human review:** Agent review default. Human on high-risk only.

### Integration Packets
- **Behavior:** Wire two subsystems together and verify the boundary works.
- **Scope:** Thin glue code + integration tests spanning both subsystems.
- **Context:** Both subsystems' code, interface contracts, expected behavior.
- **Failure modes:** Interface mismatch, event format disagreement, timing assumption.
- **Validator emphasis:** Integration tests, architecture check, evidence completeness.
- **Human review:** Operator-launched. Human reviews integration test results.

### Policy-Sensitive Packets
- **Behavior:** Modify policy engine rules, permission matrix, or protected-path logic.
- **Scope:** `harness/policies/`, policy engine internals.
- **Context:** Current policies, Phase 2 security eval requirements, permission matrix.
- **Failure modes:** Permissive policy that weakens security, restrictive policy that breaks agents.
- **Validator emphasis:** Policy unit tests, fail-closed test, security evals.
- **Human review:** Always required. Gated activation.

### Graph-Repair Packets
- **Behavior:** Fix a structural problem in the graph: insert interface packet, split oversized packet, reclassify.
- **Scope:** Depends on the repair needed.
- **Context:** Failed packet evidence, dependency analysis, operator diagnosis.
- **Failure modes:** Repair introduces new coupling, repair scope is too broad.
- **Validator emphasis:** Whatever the repaired packet's class requires.
- **Human review:** Always required. Operator must approve the repair action and the resulting packet.

---

# 7. Context-Pack Assembly by Packet Class

| Context Layer | Foundation | Implementation | Interface | Integration | Policy-Sensitive |
|---|---|---|---|---|---|
| **Packet spec** | Full | Full | Full | Full | Full |
| **Milestone context** | M0 goals | Milestone goals | Both subsystem milestones | Both subsystem milestones | Security milestone |
| **Architecture docs** | System context | Subsystem doc | Both subsystem docs | Both subsystem docs | Policy engine doc |
| **Policy docs** | Minimal | Coding conventions | Coding conventions | Boundary rules | Full policy set |
| **Relevant source files** | Existing types | Subsystem files | Interface + both sides | Both subsystems | Policy engine internals |
| **Prior evidence** | None (first run) | Prior related task evidence | Prior interface attempts | Prior integration attempts | Prior policy changes |
| **Retry/repair context** | None (first run) | Failure report + last diff | Failure report | Failure report | Failure report + security eval |
| **Trust labels** | SYSTEM + HARNESS | SYSTEM + HARNESS + CODE | SYSTEM + HARNESS + CODE | SYSTEM + HARNESS + CODE | SYSTEM + HARNESS + CODE |

### Context Minimization Rules

1. **Include only files in the packet's declared scope + direct dependencies.** Do not include the entire repo.
2. **For retries, include the failure report and the prior diff.** Do not re-include the full original context — the agent should focus on the failure, not re-read everything.
3. **For integration packets, include both subsystems' interface files but not their full internals.** The integration agent wires boundaries, not rewrites internals.
4. **Token budget: stay under 60% of model context window.** Reserve 40% for agent reasoning and tool call responses.

---

# 8. Prompt/Input Strategy at Packet Level

### Initial Execution Input Structure

```
[SYSTEM]
  Role: {implementer | reviewer | debugger}
  Packet: {packet_id} — {title}
  Objective: {objective from packet spec}
  Scope: {allowed file paths}
  Out of scope: {forbidden paths}
  Tools available: {tool list per permission matrix}
  Completion criteria: {from packet spec}
  Validator expectations: {what validators will check}
  Evidence requirements: {what must be in the evidence bundle}
  Policy boundaries: {relevant policies}
  Output format: {structured output expectations}

[HARNESS]
  {AGENTS.md excerpt relevant to this subsystem}
  {Architecture doc section for this subsystem}
  {Coding conventions relevant to this packet}

[CODE]
  {Files in scope — existing code the packet reads/modifies}
  {Interface definitions the packet depends on}

[EXTERNAL]
  {None for most packets. Research results if applicable.}
```

### Repair Execution Input (after failure)

Same structure, plus:
```
[REPAIR CONTEXT]
  Prior attempt diff: {the diff that failed}
  Failure report: {structured failure output from validator}
  Failure classification: {which validator layer, which check}
  Repair attempt number: {N of max}
  Guidance: "Focus on the specific failure. Do not rewrite the entire implementation.
             The prior attempt was {partially correct | fundamentally wrong}.
             The validator reported: {specific error}."
```

### Reviewer Execution Input

```
[SYSTEM]
  Role: reviewer
  Reviewing packet: {packet_id}
  Review scope: {diff to review}
  Check for: convention compliance, architecture boundary respect,
             test adequacy (are tests testing the spec?), code quality,
             scope drift (did the agent write outside declared scope?)

[HARNESS]
  {Architecture doc, coding conventions, test strategy}

[CODE]
  {The diff under review}
  {Test files}
  {Architecture boundary definitions}
```

---

# 9. Review Load Management

## Alpha Review Capacity Model

Assume one operator (Marco) reviewing part-time (~2-3 hours/day dedicated to Forge execution oversight).

| Wave | Packets/Day | Human Review Needed | Manageable? |
|---|---|---|---|
| Wave 1 | 1-2 | All (foundation contracts) | Yes |
| Wave 2 | 2-4 | ~30% (Prisma schema, first M1 packets) | Yes |
| Wave 3 | 3-5 | ~20% (policy engine, critical-path) | Yes |
| Wave 4 | 5-8 | ~10% (integration packets, agent runner prompts) | Manageable |
| Wave 5 | 6-10 | ~5% (merge candidates, benchmarks) | Yes |

## Review Priority Queue

When multiple packets await review, prioritize:
1. **Escalations** (blocked tasks, policy violations) — immediate
2. **Graph-repair proposals** — same day
3. **Security-sensitive packet outputs** — same day
4. **Integration packet outputs** — within 24 hours
5. **Merge candidates** — within 24 hours
6. **Routine packet outputs** — validator + agent review sufficient, human reviews weekly batch

## Avoiding Review Bottleneck

- **Do not review every packet.** After Wave 2, most packets use validator + agent review only.
- **Batch low-risk reviews.** Review 5-10 low-risk completed packets in a single session rather than one at a time.
- **Trust the evidence.** If evidence bundle is complete, validators passed, agent reviewer approved, and confidence is above threshold — that is sufficient for low-risk packets.
- **Escalation is the signal.** The system tells you when it needs you. Do not proactively audit every packet.

---

# 10. Fallback, Pause, and Rollback

| Trigger | Response | Scope | Operator Action |
|---|---|---|---|
| **Single packet failure** (validator catches it) | Repair loop runs automatically | One packet | None unless repair exhausts |
| **Repair loop exhausted** | Packet BLOCKED, escalated | One packet | Operator triages: re-scope, split, or cancel |
| **Multiple failures in same workstream** (>30% fail rate) | Workstream pause recommended | All packets in workstream | Operator investigates root cause. Common: bad interface contract, missing dependency, wrong architecture assumption. Fix root cause, resume. |
| **Interface contract wrong** (downstream packets fail because interface is wrong) | Graph repair: revise interface, invalidate downstream | Interface packet + all dependents | Operator approves interface revision. Downstream packets are requeued with updated contract. |
| **Pipeline instability** (validator crashes, policy engine errors, evidence capture failures) | Full rollout pause | All active packets | Operator fixes pipeline issue. Runs Wave 0 dry-run to verify. Resumes. |
| **Widespread benchmark regression** | Full rollout pause | All | Operator investigates which merge-back introduced regression. Revert if identified. Re-run benchmarks. |
| **Unsafe action detected** (policy violation, secret leak, scope drift) | Immediate packet cancellation + workstream pause | Affected workstream | Operator investigates. If policy engine failure: full pause. If agent misbehavior: revise prompt, tighten policy. |
| **Cost explosion** (token budget exceeded significantly) | Workstream pause | Affected workstream | Operator reviews: are packets too large? Are repair loops thrashing? Adjust sizing or repair budget. |

### Rollback Mechanics

If a merged packet introduced a problem detected by cross-task validation:
1. Identify the problematic merge-back commit.
2. Revert the commit on the phase branch: `git revert {commit}`.
3. The reverted packet re-enters QUEUED with the cross-task failure as repair context.
4. Cross-task validation re-runs on the reverted state.

Rollback is commit-level, not worktree-level. The worktree is already torn down by this point.

---

# 11. Graph Repair Workflow

## Detection

Graph defects are detected by:
- **Operator observation:** "These two packets keep failing at the interface boundary — the contract is wrong."
- **Repair loop analysis:** "This packet has exhausted repairs and the failure is always at the same interface call."
- **Cross-task validation:** "Two packets conflict on merge because they both modify the same file — the graph has a hidden coupling."
- **Validator mismatch:** "The assigned validator can't run because the tool it depends on doesn't exist yet — there's a missing validator-readiness dependency."

## Repair Actions

| Defect | Repair | Operator Role |
|---|---|---|
| **Interface mismatch** | Revise the interface packet. Re-queue consumers. | Operator approves revised interface. |
| **Hidden coupling** (two packets modify same file) | Insert an integration packet between them, or merge them. | Operator decides: merge or separate. |
| **Packet too large** (failure is hard to diagnose) | Split into 2-3 smaller packets with clearer contracts. | Operator approves split and new dependencies. |
| **Missing dependency** (packet needs output that no other packet produces) | Insert a new packet that produces the missing artifact. | Operator approves new packet insertion. |
| **Validator not ready** (assigned validator depends on unbuilt tool) | Re-sequence: build the validator's tool first, then the packet. | Operator approves re-sequencing. |

## Graph Versioning

Each graph repair produces a new graph version. The control plane shows:
- Graph v1 (original approved graph)
- Graph v1.1 (after first repair: interface packet inserted)
- Graph v1.2 (after second repair: packet split)

Each version records: what changed, why, who approved, which packets were affected.

## Downstream Impact

When a graph repair changes a packet's contract or dependencies:
- **In-progress downstream packets on the old contract:** Canceled and requeued with updated context.
- **Completed downstream packets that consumed the old contract:** Flagged for re-validation. If re-validation passes, no action needed. If it fails, the packet re-enters repair.
- **Not-yet-started downstream packets:** Automatically pick up the new contract when activated.

---

# 12. Human Checkpoints During Execution

| Checkpoint | When | Operator Action |
|---|---|---|
| **M0a contract review** | Before any M1 packet starts | Operator reviews all interface types, domain objects, event taxonomy. Approves or requests revision. |
| **Policy engine code review** | F-WS3-003 completes | Operator reviews the policy evaluation logic. Fail-closed behavior must be verified. |
| **First integration test results** | F-INT-001 completes | Operator reviews: does the orchestrator → runtime manager integration actually work? |
| **First real agent run** | F-WS6-004 completes (tool mediation works) | Operator reviews: did a real agent call real tools through the real policy engine and produce real evidence? |
| **Phase PR merge** | Phase complete, all tasks MERGED | Operator reviews aggregate PR, approves merge to main. |
| **Graph repair approval** | Any graph repair proposed | Operator approves or revises the repair action. |
| **Dependency addition** | Agent requests a new npm package | Operator reviews the dependency: license, vulnerability status, necessity. |
| **Harness mutation** | Any proposal to change harness files | Operator reviews the proposed change and its justification. |

---

# 13. Evidence Review Workflow

## What to Review First

1. **Validation summary:** Did all four layers pass? Which checks had warnings?
2. **Confidence score:** Above or below threshold? What factors are low?
3. **Diff summary:** How many files changed? How large is the diff? Does it match the packet's declared scope?
4. **Agent review findings:** Did the reviewer flag anything? Were changes requested and resolved?

## When to Open Full Traces

- When confidence is below threshold
- When a repair loop ran (review the repair history — did it converge or oscillate?)
- When a security validator produced warnings (even non-blocking)
- When the packet is on the critical path
- When the diff is unusually large

## How Evidence Supports Graph Repair

When a packet fails repeatedly, the evidence trail shows:
- What the agent tried each time (context pack manifests)
- What the validators caught each time (failure classifications)
- Whether the repairs were convergent (diff similarity, failure-set tracking)
- Whether the problem is in the packet (wrong spec) or the pipeline (wrong validator)

This evidence is the input to graph repair decisions.

---

# 14. First Executable Packet Set

The very first packets to execute (after Wave 0 dry run):

**Wave 1 — M0a Contracts (5 packets, serial, human-reviewed):**

| Order | Packet | Why First | What It Unlocks |
|---|---|---|---|
| 1 | F-M0-003 (domain object types) | Everything imports these | All workstreams |
| 2 | F-M0-004 (cross-subsystem contracts) | Policy, tool, validator interfaces | WS-2, WS-3, WS-5, WS-6, WS-8 |
| 3 | F-M0-005 (event taxonomy) | Event types used by orchestrator, audit, UI | WS-2, WS-11, WS-13 |
| 4 | F-M0-006 (action class types) | Policy engine and tool broker depend on these | WS-3, WS-5 |
| 5 | F-M0-007 (evidence schema) | Validator and evidence pipeline depend on these | WS-8, WS-9 |

**Success on this first set demonstrates:**
- The pipeline can dispatch a packet to an agent
- The agent can produce TypeScript type definitions
- The validator can check compilation and lint
- The evidence bundle is captured and complete
- The merge-back to phase branch works
- The operator can review output and approve

If Wave 1 succeeds, the most foundational contracts are stable and M1 implementation can begin with confidence.

---

# 15. Alpha Throughput Strategy

| Phase | Concurrency | Condition to Advance |
|---|---|---|
| **Wave 0** (dry run) | 1 | Pipeline completes successfully |
| **Wave 1** (M0a contracts) | 1 (serial) | All 5 contracts merged and human-reviewed |
| **Wave 2** (M0b + first M1) | 2-3 | First-pass success rate > 60%, no pipeline failures |
| **Wave 3** (M1 critical path) | 3-4 | Policy engine operational, tool broker operational, no graph repairs needed |
| **Wave 4** (M1 completion + M2) | 5-7 | First integration test passes, agent runner operational, repair loops converge |
| **Wave 5** (M3 + M4) | 6-8 | Benchmark passes at least one test repo, evidence completeness 100% |

### Conditions for Restricting Concurrency

- Repair-loop rate > 40% of active packets → reduce concurrency by 2
- Graph-repair rate > 1 per day → reduce concurrency to 2 and investigate
- Oscillation detected in any repair loop → reduce concurrency by 1 and review
- Pipeline instability (validator crash, evidence capture failure) → concurrency = 1 until fixed
- Operator review queue depth > 10 → reduce concurrency until queue drains

---

# 16. Operational Metrics

| Metric | Wave 1-2 Target | Wave 3-4 Target | Wave 5 Target | Gates Expansion? |
|---|---|---|---|---|
| **Packet success rate** (first pass) | > 50% | > 60% | > 70% | Yes |
| **Repair loop convergence rate** | > 50% | > 60% | > 70% | Yes |
| **Oscillation rate** | 0 | < 5% | < 3% | Yes |
| **Graph repair rate** | ≤ 1/day | ≤ 0.5/day | ≤ 0.2/day | Yes |
| **Review queue depth** | < 5 | < 8 | < 10 | Yes |
| **Approval latency** (escalations) | < 4 hours | < 8 hours | < 12 hours | No |
| **Evidence completeness** | 100% | 100% | 100% | Yes |
| **Security alert rate** | 0 critical | 0 critical | 0 critical | Yes |
| **Unsafe action attempts** | 0 | < 2% | < 1% | Yes |
| **Benchmark pass rate** | N/A | N/A | > 80% | Yes |
| **Workstream stall rate** | 0 | 0 | 0 | Yes |

**Expansion gate:** All "Gates Expansion?" = Yes metrics must meet their target for the current wave before concurrency increases for the next wave.

---

# 17. Packet-Class Execution Policies

| Class | Launch | Review | Retry Budget | Repair Policy | Human Gate | Speculative? |
|---|---|---|---|---|---|---|
| **Foundation (M0a)** | Operator-launched | Human mandatory | 2 | Re-scope on failure | Always | No |
| **Scaffolding (M0b)** | Auto (after M0a) | Agent review | 3 | Standard repair | Schema changes only | No |
| **Local implementation** | Auto (after Wave 2) | Agent review | 3 | Standard repair | No | Yes |
| **Interface** | Operator-launched | Agent + human (early waves) | 2 | Re-scope or split | Early waves yes | No |
| **Integration** | Operator-launched | Agent + human | 2 | Insert interface packet or merge | Always | No |
| **Security/policy** | Gated | Human mandatory | 2 | Conservative (no auto-retry of security logic) | Always | No |
| **Schema/event change** | Gated | Human mandatory | 1 | Schema migration packet if needed | Always | No |
| **Graph-repair** | Gated | Human mandatory | 2 | Escalate to full graph review | Always | No |
| **Documentation** | Auto | Agent review | 3 | Standard repair | No | Yes |
| **Benchmark/eval** | Operator-launched | Human reviews results | 3 | Standard repair | Results review | No |

---

# 18. Control-Plane Operational Requirements

Before live execution, the control plane must support:

| Capability | Why |
|---|---|
| **Packet queue with status** | Operator needs to see what's eligible, active, completed, blocked |
| **Launch button per packet** | Operator-launched packets need explicit activation |
| **Risk labels on packets** | Operator needs to see risk class at a glance |
| **Validator status per packet** | Which validators passed, failed, or errored |
| **Evidence inspector** | Drill into any packet's evidence bundle |
| **Escalation inbox** | See all blocked tasks and policy escalations in one place |
| **Pause/resume per workstream** | Operator can halt a workstream without affecting others |
| **Concurrency control** | Operator can adjust active packet limit |
| **Graph version history** | See what graph repairs have been applied |
| **Metric dashboard** | Key metrics from Section 16 at a glance |
| **Rollout wave indicator** | Which wave is active, what packet classes are permitted |

This is not the full three-pane UI. This is the minimum operational surface needed before agents start executing. The full execution DAG visualization, planner workspace, and file tree can come in Wave 5.

---

# 19. Repo Artifacts from This Phase

| Artifact | Contents |
|---|---|
| `ops/rollout-strategy.md` | Wave definitions, concurrency progression, expansion gates |
| `ops/operator-workflow.md` | Daily loop, actions, decision points, escalation handling |
| `ops/packet-activation-rules.md` | Eligibility checks, activation classes, preconditions |
| `ops/review-load-policy.md` | Review priority queue, capacity model, bottleneck prevention |
| `ops/graph-repair-workflow.md` | Detection signals, repair actions, versioning, downstream impact |
| `ops/fallback-and-rollback.md` | Trigger → response table, pause/cancel/rollback mechanics |
| `ops/first-execution-wave.md` | Wave 0-1 packet list, success criteria, go/no-go gates |
| `ops/execution-metrics.md` | Metric definitions, targets per wave, expansion gating rules |
| `ops/packet-class-policies.md` | Per-class launch, review, retry, repair, and approval policies |
| `ops/control-plane-requirements.md` | Minimum operational UI capabilities before live execution |

---

# 20. Open Questions for Phase 6

1. **Prompt template finalization.** Phase 5 defines the input structure. Phase 6 must produce the actual prompt templates per role, tested against at least one dry-run packet.

2. **Packet instantiation format.** Are packets committed as YAML files in `plans/packets/`? Or generated dynamically by the orchestrator from `plans/task-graph.md`? Phase 6 must decide.

3. **M0a authorship.** Should M0a contracts (domain types, interfaces) be human-authored for maximum precision, or agent-generated with heavy human review? Phase 6 must decide based on agent capability assessment.

4. **Blessed-stack harness template authoring.** The ESLint config, tsconfig, Vitest config, and architecture boundary rules must be authored before Wave 2. Phase 6 must produce these.

5. **Benchmark repo creation.** The CRUD benchmark repo must exist before Wave 5. Phase 6 must produce it with expected outputs defined.

6. **Policy rule authoring.** The blessed-stack policy rules (shell allowlist, domain allowlist, protected paths, scope rules) must exist before Wave 3. Phase 6 must produce these as YAML in `harness/policies/`.

7. **Operator tooling.** Is the minimum control-plane operational surface (Section 18) built as part of the Forge build itself (WS-13/14), or is a temporary CLI/dashboard used for early waves?

8. **Cost baseline.** What is the expected token cost per packet? Per wave? Per full Alpha build? Phase 6 should estimate this to set budget guardrails.

---

# 21. Phase 5 Decision Summary

## Recommended Alpha Rollout Strategy
Six waves: dry run → M0a contracts (serial, human-reviewed) → M0b scaffolding + first M1 → M1 critical path → M1 completion + M2 fan-out → M3 + M4 hardening. Concurrency starts at 1 and ramps to 6-8 based on metrics gates.

## Recommended Operator Workflow
Morning triage → active launches and approvals → periodic metric review → end-of-day queue setup. Operator reviews escalations, graph repairs, merge candidates, and security-sensitive outputs. Does not review every packet after Wave 2.

## Recommended Packet Activation Model
Three activation classes: auto-activatable (low-risk, approved waves), operator-launched (interface, integration, first-of-workstream), gated (security, schema, graph-repair). Default in Wave 1-2 is operator-launched. Progressive auto-activation as confidence builds.

## Recommended First Executable Packet Set
Five M0a contract packets (domain types → cross-subsystem interfaces → events → action classes → evidence schema). Serial execution, human-reviewed. Success demonstrates pipeline works end-to-end and foundational contracts are stable.

## Recommended Review-Load Policy
One operator at 2-3 hours/day. Human reviews decrease from 100% (Wave 1) to ~5% (Wave 5). Priority queue: escalations > graph repairs > security > integration > merge candidates > routine. Trust the evidence and validators for low-risk packets.

## Recommended Graph-Repair Policy
Detection via repair-loop analysis, cross-task failures, and operator observation. Five repair actions: revise interface, insert integration packet, split packet, insert dependency, schema migration. All repairs require operator approval. Graph is versioned.

## Recommended Throughput Progression
1 → 2-3 → 3-4 → 5-7 → 6-8 across waves. Expansion gated on: packet success rate, repair convergence, oscillation rate, graph repair rate, evidence completeness, review queue depth, benchmark pass rate.

## Top Questions for Phase 6
Prompt template finalization, packet instantiation format, M0a authorship decision, blessed-stack harness template authoring, benchmark repo creation, policy rule authoring, operator tooling for early waves, cost baseline estimation.
