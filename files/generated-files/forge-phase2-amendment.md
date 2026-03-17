# Forge Phase 2 Amendment: Five Tightening Passes

**Version:** 2.0.1  
**Date:** March 11, 2026  
**Status:** Design Phase — Focused Tightening  
**Baseline:** forge-phase2-validation.md

This amendment makes five targeted corrections to Phase 2 based on review. No architectural changes. These are constraint-sharpening passes that prevent future misinterpretation.

---

# Amendment 1: Confidence Score Constraints

**Location:** Affects Sections 4, 6, 7, 13, and the Decision Summary.

## The Problem

Confidence scoring appears in the current design as both an escalation trigger and a task-completion threshold. This is acceptable in principle but dangerous if unconstrained: a future implementation could allow a high confidence score to excuse a hard validator failure ("the confidence was 0.95, so we skipped the failing lint check"). That must never happen.

## The Constraint

**Confidence is a meta-signal. It is never a substitute for correctness.**

Specifically:

1. **Confidence cannot override a hard validator pass/fail.** If any blocking validator fails, the task fails — regardless of confidence score. A confidence score of 1.0 does not excuse a failing test, a secret scan hit, or an architecture violation.

2. **Confidence can escalate.** If all hard validators pass but confidence is below threshold, the task is escalated to human review. This is the correct use: confidence flags "something feels off despite green validators."

3. **Confidence can inform promotion speed.** High-confidence tasks may be auto-promoted faster. Low-confidence tasks may be queued for agent review even if validators pass. But promotion speed is about ordering, not about skipping gates.

4. **Confidence is computed after validation, not instead of validation.** The confidence score is a post-validation summary of how much trust the validator results warrant — not an alternative evaluation pathway.

## Formal Rule

> **No confidence score, however high, may be used to bypass, skip, override, or downgrade the result of any blocking validator in the validation stack. Confidence operates strictly above the validator layer, never in place of it.**

This rule must be stated in `harness/definition-of-done.md` and enforced by the evidence completeness validator (which should verify that all blocking validators ran before confidence was computed).

---

# Amendment 2: Cross-Task Validation Scheduling Policy

**Location:** Affects Sections 3, 7, and feeds Section 19 (implementation questions).

## The Problem

The current design flags cross-task validation scheduling as an implementation question. That is correct for exact mechanics, but the design-level policy choice has architectural consequences: it determines whether the orchestrator must serialize merge-back or can proceed speculatively.

## The Design Preference

**Default to non-blocking cross-task validation with bounded speculative execution.**

Specifically:

1. **After a task merges back to the phase branch, cross-task validation begins immediately.** It does not block the scheduling of the next independent task.

2. **Speculative execution is bounded.** At most N tasks (Alpha default: 2) may be in speculative execution — meaning they started on a phase branch state that has not yet been cross-task-validated. If more than N tasks are waiting, they queue until a cross-task validation completes.

3. **Freeze on shared-interface failure.** If cross-task validation fails and the failure implicates a shared interface (e.g., a type definition used by multiple modules, a service boundary contract, a shared utility), all tasks that depend on that interface are frozen (paused, not cancelled) until the failure is resolved. Tasks on unrelated interfaces may continue.

4. **Rollback semantics on critical cross-task failure.** If cross-task validation reveals that a merged task broke a previously passing test, the orchestrator creates a repair task targeting the most recently merged commit. If repair fails, the merge is reverted and the task re-enters the repair queue with the cross-task failure as context.

## Why This Matters at Design Level

The alternative — blocking cross-task validation that serializes all merge-backs — would eliminate the throughput benefit of bounded concurrency. Three concurrent tasks that all serialize on merge-back behave like sequential execution with extra overhead. The speculative model preserves concurrency benefits while containing blast radius through the freeze-on-shared-interface rule.

## What Remains for Implementation

The exact mechanics of "implicates a shared interface" need definition. A reasonable Alpha heuristic: if cross-task validation fails on a test that exercises code modified by task A but a file also read by task B, freeze task B and its dependents. The implementation phase should refine this heuristic.

---

# Amendment 3: Benchmark Judgment Decomposition

**Location:** Affects Section 14 (Benchmark Suite Design).

## The Problem

The current benchmark section defines success per benchmark primarily in terms of "does the app work." This risks collapsing evaluation into a single correctness dimension when the eval harness needs to distinguish five independent quality dimensions.

## The Decomposition

Every benchmark run must be scored across five independent dimensions:

### Dimension 1: Project Correctness
Does the generated software actually do what the specification says? Tests pass, behavior matches acceptance criteria, edge cases handled.

### Dimension 2: Platform Reliability
Did Forge's machinery work correctly? Orchestrator scheduled tasks properly, validators ran in the right order, evidence was captured, no orchestrator bugs, no dropped tasks, no phantom completions.

### Dimension 3: Security Posture
Did the build maintain security invariants? No secrets leaked, no vulnerable dependencies introduced, no policy violations, no scope drift, no unauthorized actions.

### Dimension 4: Evidence Completeness
Is the full evidence trail intact? Every task has a complete evidence bundle, every tool invocation is in the audit trail, every validator result is recorded, confidence scores are computed, repair histories are present where applicable.

### Dimension 5: Operator Trust / Intervention Burden
How much human intervention was required? How many escalations fired? How many tasks were BLOCKED? How many repair loops ran? Could a user trust this build based on the evidence alone, or would they need to manually re-verify?

## Revised Benchmark Scoring Template

Each benchmark produces a scorecard:

```
Benchmark: Greenfield CRUD App
Run: 2026-03-11T14:00:00Z

1. Project Correctness:     PASS (all tests pass, acceptance criteria met)
2. Platform Reliability:    PASS (no orchestrator errors, no dropped tasks)
3. Security Posture:        PASS (no secrets, no vulns, no policy violations)
4. Evidence Completeness:   PASS (100% evidence bundles, full audit trail)
5. Operator Trust:          MODERATE (2 escalations, 1 BLOCKED task, 4 repair loops)

Overall: PASS with notes
Notes: Operator trust score indicates task decomposition could be tighter.
       Escalations were both dependency-related (expected for Alpha).
```

## Application to Each Benchmark

The current eight benchmark descriptions remain unchanged. Each benchmark now additionally specifies which dimensions it primarily stresses:

| Benchmark | Primary Dimensions |
|---|---|
| Greenfield CRUD | Correctness, Platform Reliability |
| Auth Dashboard | Correctness, Security |
| Bug-Fix (Existing Repo) | Correctness, Operator Trust |
| Repo Refactor | Platform Reliability, Evidence Completeness |
| Documentation Sync | Evidence Completeness, Platform Reliability |
| Security-Sensitive Patch | Security, Correctness |
| Dependency Upgrade | Security, Correctness |
| Architecture-Constrained Feature | Correctness, Platform Reliability |

All five dimensions are scored for every benchmark run. The primary dimensions indicate where failure is most informative.

---

# Amendment 4: Semantic Loop Detection in Repair Evaluation

**Location:** Affects Section 10 (Retry, Repair, and Escalation Evaluation).

## The Problem

The current design detects repair loops via: (a) same failure classification repeating, (b) high diff similarity between attempts, (c) identical error messages. This catches syntactic repetition but misses semantic oscillation — where the system bounces between superficially different failures while making no net progress.

## The Addition: Semantic Loop Detection

Add a fourth loop-detection mechanism:

**Semantic loop detection.** Beyond comparing failure classifications, diffs, and error messages, the system tracks a concept of **net repair progress** across attempts:

1. **Failure-set tracking.** After each repair attempt, record the set of all failing validators (not just the primary classification). If the union of failing validators across the last N attempts is not shrinking, the repair loop is not converging.

2. **Oscillation detection.** If the failure pattern alternates — attempt 1 fails on A, attempt 2 fails on B, attempt 3 fails on A again — that is oscillation, not progress, even though no single classification repeated more than twice.

3. **Aggregate regression check.** If the total number of validator failures increases after a repair attempt (the fix broke something else), that attempt is scored as negative progress. Two consecutive negative-progress attempts trigger escalation regardless of classification.

4. **Diff-scope inflation.** If each successive repair attempt produces a larger diff than the last, the debugger is expanding scope instead of targeting the failure. This is a signal of "rewrite creep" — the debugger is replacing the implementation instead of fixing it. If repair diff size exceeds 50% of the original implementation diff size, escalate.

## Revised Repair-Loop Escalation Rules

A repair loop triggers escalation when **any** of the following are true:

| Condition | Detection |
|---|---|
| Same failure classification repeats N times | Classification comparison |
| Diff similarity > 90% between consecutive attempts | Diff hash comparison |
| Identical error message repeats | String comparison |
| **Failure-set not shrinking over 3 attempts** | Validator failure-set tracking |
| **Oscillation detected** (A→B→A pattern) | Pattern detection on classification sequence |
| **Two consecutive negative-progress attempts** | Validator count increases after repair |
| **Repair diff exceeds 50% of original diff** | Diff size comparison |
| Total repair budget exceeded | Counter |

The first three are from the existing design. The last four are new. All should be active in Alpha.

---

# Amendment 5: Human Governance Invariant

**Location:** Affects Sections 2, 15, and the Decision Summary.

## The Problem

Phase 2 designs the evaluation harness — a system that validates the platform, the agents, and the generated software. A subtle risk: someone reading this document could infer that a sufficiently good evaluation harness eliminates the need for human governance checkpoints. It does not.

## The Invariant

> **The evaluation harness validates the platform. It does not remove, replace, or reduce the human governance checkpoints established in the Phase 1 architecture.**

Specifically:

- **Checkpoint A** (product/system design approval) remains human-required regardless of how good the planner becomes.
- **Checkpoint B** (validation strategy approval) remains human-required regardless of how good the test strategy agent becomes.
- **Checkpoint C** (task graph approval) remains human-required regardless of how well the task decomposer performs.
- **Checkpoint D** (merge to main) remains human-required regardless of how comprehensive the validator stack becomes.
- **Harness policy changes** remain human-required regardless of how accurate the harness-maintenance agent's proposals become.
- **New dependency approval** remains human-required regardless of dependency scan quality.

These checkpoints exist because they are strategic decisions where the human's judgment about intent, risk tolerance, and domain context cannot be replicated by validation — not because the validation is too weak to handle them. Improving validation does not change this.

The evaluation harness may, over time, demonstrate that certain auto-validated decisions (e.g., individual task completion) are reliably correct. That evidence can inform decisions to expand auto-validation scope. But the four named checkpoints (A, B, C, D) and the two policy gates (harness changes, new dependencies) are structural governance, not temporary scaffolding. They persist.

---

# Summary of Amendments

| # | Amendment | Type | Impact |
|---|---|---|---|
| 1 | Confidence score constraints | Constraint sharpening | Prevents confidence from overriding hard validators |
| 2 | Cross-task validation scheduling | Design preference | Non-blocking with bounded speculation and freeze-on-shared-interface |
| 3 | Benchmark judgment decomposition | Evaluation enrichment | Five-dimension scoring (correctness, reliability, security, evidence, trust) |
| 4 | Semantic loop detection | Mechanism addition | Four new escalation triggers for repair oscillation and scope inflation |
| 5 | Human governance invariant | Architectural constraint | Evaluation harness cannot remove established human checkpoints |

No other sections of Phase 2 are affected. The Decision Summary in the base document should be read with these amendments applied.
