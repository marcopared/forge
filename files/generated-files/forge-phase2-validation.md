# Forge Phase 2: Validation and Evaluation Harness Design

**Version:** 2.0  
**Date:** March 11, 2026  
**Status:** Design Phase — Validation Architecture  
**Prerequisite:** Phase 1 design stack (v1.0 → v1.3.1) approved

---

# 1. Phase 2 Objective

Phase 2 designs how Forge knows that work is correct, complete, and trustworthy — and how Forge knows that about itself.

This phase must happen before implementation architecture because the implementation must be designed to produce the evidence, pass the gates, and satisfy the completion contracts defined here. If we define the implementation first and the validation second, the validation will be fitted to the implementation rather than the implementation being fitted to the validation. That produces systems that pass their own tests but fail at trust.

**Phase sequence and what each decides:**

| Phase | Decides |
|---|---|
| 1. Product/system design (done) | What the product is, how it's shaped, what the architecture looks like |
| 1+. Security architecture (done) | How the system is governed, constrained, and audited |
| **2. Validation/evaluation design (this phase)** | **How we know work is correct, what evidence is required, what gates exist, how the platform evaluates itself** |
| 3. Implementation architecture (next) | How the system is built — service boundaries, data flows, runtime contracts |
| 4. Coding-agent task planning (after) | Task decomposition, coding packets, execution schedule |

Phase 2 is the contract that Phases 3 and 4 must satisfy.

---

# 2. Validation Philosophy

## Core Principles

**"Tests passed" is insufficient.** Tests are one signal among many. A task can pass all tests and still be wrong: the tests may be tautological, the tests may cover the happy path but not edge cases, the tests may have been written by the same agent that wrote the code. Forge requires convergent evidence from independent sources — not a single green signal.

**Evidence-based completion, not claim-based completion.** An agent saying "I'm done" is not evidence. A task is complete when the evidence bundle demonstrates completion — diffs exist, validators passed, reviewer approved, security scans are clean, coverage didn't drop, architecture boundaries are respected. The evidence is the proof. The agent's claim is irrelevant without it.

**Validator-heavy systems need explicit false-success defenses.** When validators are the primary trust mechanism (replacing per-task human review), the system must actively defend against the case where validators pass but the output is wrong. This means: tests designed independently from implementation, architecture checks that are structural (not just naming), and evidence completeness requirements that prevent corner-cutting.

**The platform must evaluate itself.** Forge generates code, runs agents, enforces policies, and produces evidence. If any of those subsystems are broken — if the policy engine has a bypass, if evidence bundles are silently incomplete, if agents drift outside scope undetected — the entire trust model collapses. Forge must test Forge.

**Agent-generated tests are suspect unless constrained.** An agent asked to "write code and tests" is incentivized to write tests that pass its code, not tests that validate the specification. The test strategy (defined during Checkpoint B) must be designed before implementation begins, and implementation-agent-written tests are treated as supplementary, not authoritative.

---

# 3. Validation Stack Overview

Forge validation operates at seven levels. Each level builds on the one below it.

```
┌─────────────────────────────────────────────┐
│  PLATFORM EVALUATION                         │ ← Is Forge itself safe and correct?
├─────────────────────────────────────────────┤
│  MERGE-LEVEL VALIDATION                      │ ← Is this PR safe to merge to main?
├─────────────────────────────────────────────┤
│  BUILD-LEVEL VALIDATION                      │ ← Is the full build coherent and complete?
├─────────────────────────────────────────────┤
│  PHASE-LEVEL VALIDATION                      │ ← Is this phase complete and consistent?
├─────────────────────────────────────────────┤
│  CROSS-TASK VALIDATION                       │ ← Does the merged state of multiple tasks hold?
├─────────────────────────────────────────────┤
│  TASK-LEVEL VALIDATION                       │ ← Is this single task correct and complete?
├─────────────────────────────────────────────┤
│  NODE-LEVEL VALIDATION                       │ ← Did this single agent action produce valid output?
└─────────────────────────────────────────────┘
```

Additionally, two lateral evaluation tracks run independently:

- **Benchmark evaluation** — periodic runs against known-outcome test repos
- **Harness-quality evaluation** — continuous assessment of whether the harness artifacts are fresh, complete, and useful

---

# 4. Definition of Done Model

## Node Completion (Single Agent Action)

| Requirement | Evidence |
|---|---|
| Agent produced output (files, commits, or findings) | Diff or structured output exists |
| Output is within declared scope | Scope-drift check passed (no files outside task scope modified) |
| No policy violations in audit trail | Policy compliance check passed |
| Evidence record created | ATTEST action logged |

**Blocking failures:** Policy violation, scope drift, no output produced.  
**Escalation:** Protected-path mutation, cost/time budget exceeded.

## Task Completion (Full Validation Pipeline)

| Requirement | Evidence |
|---|---|
| All node-level requirements met | Node evidence bundles |
| Compilation passes | `tsc --noEmit` exit 0 |
| Lint passes | ESLint exit 0 with architecture rules |
| Type safety passes | No `any`, strict mode |
| Unit tests pass (affected scope) | Test runner output, pass rate, coverage delta ≥ 0 |
| Integration tests pass (if service boundary touched) | Test runner output |
| Architecture boundaries respected | Structural test pass |
| File structure valid | Structure validator pass |
| App boots (if code changed) | Boot check pass |
| Secret scan clean | No secrets detected in modified files |
| Dependency scan clean (if deps changed) | No critical/high vulnerabilities |
| Scope within declared boundaries | Scope-drift validator pass |
| Protected paths untouched (or escalated) | Protected-path validator pass |
| Harness files untouched (or escalated) | Harness integrity validator pass |
| Evidence bundle complete | Evidence completeness validator pass |
| Agent review passed | Reviewer agent approved |
| Confidence ≥ threshold | Confidence score computed |

**Blocking failures:** Any validator in Layer 1-3 failing. Incomplete evidence. Reviewer rejection (after review-repair loop exhausted).  
**Escalation:** Confidence below threshold. Repair attempts exhausted. Reviewer and implementer in unresolvable disagreement.

## Phase Completion

| Requirement | Evidence |
|---|---|
| All tasks in phase COMPLETED | Task status records |
| Full test suite passes on merged phase branch | Full test run output |
| Full compilation on merged state | Compilation output |
| Full lint on merged state | Lint output |
| Architecture check on full repo | Structural test output |
| Coverage meets threshold (e.g., 80% for `src/core/`) | Coverage report |
| Harness freshness check passes | AGENTS.md, architecture docs, policies consistent with code |
| Definition-of-done contract satisfied | Acceptance criteria from Checkpoint B verified |
| Full secret scan on repo | Secret scan report |
| Full dependency scan | Dependency report |
| SBOM generated | SBOM artifact |
| All evidence bundles complete for all tasks | Evidence completeness report |
| No unresolved BLOCKED tasks | Task state audit |

**Blocking failures:** Any task still BLOCKED. Full test suite failure. Coverage below threshold. Missing evidence.  
**Escalation:** Harness freshness failure (docs drifted from code).

## PR Readiness

| Requirement | Evidence |
|---|---|
| Phase completion requirements met | Phase validation report |
| PR summary generated with task list, validation results, evidence links | PR body |
| Aggregate confidence ≥ threshold | Aggregate confidence score |
| No unresolved security findings (critical/high) | Security summary |

## Merge Readiness (Checkpoint D — Human Required)

| Requirement | Evidence |
|---|---|
| PR readiness requirements met | PR validation report |
| Human reviewed PR | Human approval recorded |
| Final full-suite validation on PR branch | Final validation run |

---

# 5. Test and Evaluation Taxonomy

## Category 1: Requirement Quality Checks
- **What:** Do requirements in `docs/requirements.md` have testable acceptance criteria?
- **Why:** Vague requirements produce vague implementations that cannot be validated.
- **When:** Pre-build (Checkpoint A review). Also checked mechanically: each requirement should have at least one associated acceptance criterion.
- **Type:** Hybrid (structural check + planner review).
- **Failure:** Missing acceptance criteria → planner flags during planning; validator flags during phase-end.

## Category 2: Architecture Consistency Checks
- **What:** Does `ARCHITECTURE.md` match the actual code structure? Do dependency directions comply?
- **Why:** Architecture docs that diverge from reality provide wrong guidance to agents.
- **When:** Phase-end. Also during harness-quality evaluation.
- **Type:** Deterministic (structural test against import graph).
- **Failure:** Boundary violation → blocking. Doc drift → escalation.

## Category 3: Task Graph Correctness Checks
- **What:** Are task dependencies valid? Are task scopes non-overlapping? Do task acceptance criteria map to requirements?
- **Why:** A bad task graph produces bad parallel execution, scope collisions, and untraceable work.
- **When:** Pre-build (Checkpoint C review). Mechanically: each task has defined scope, each requirement is covered by at least one task.
- **Type:** Deterministic (graph analysis).
- **Failure:** Overlapping scopes → planner revises. Uncovered requirements → planner adds tasks.

## Category 4: Policy Compliance Checks
- **What:** Did all tool invocations receive ALLOW from the policy engine? Any bypasses?
- **Why:** Policy enforcement is the security foundation. Any bypass undermines the trust model.
- **When:** Per-task (audit trail review). Phase-end (full audit).
- **Type:** Deterministic (audit trail scan).
- **Failure:** Bypass detected → blocking, critical severity, escalation.

## Category 5: Type / Lint / Build Checks
- **What:** Does the code compile, lint, and type-check?
- **Why:** Minimum correctness bar.
- **When:** Per-task. Cross-task. Phase-end.
- **Type:** Deterministic.
- **Failure:** Blocking.

## Category 6: Unit Tests
- **What:** Do unit tests pass? Is coverage maintained or improved?
- **Why:** Unit tests are the fastest feedback signal for implementation correctness.
- **When:** Per-task (affected scope). Phase-end (full suite).
- **Type:** Deterministic (test runner).
- **Failure:** Test failure → blocking → repair loop. Coverage decrease → blocking.

## Category 7: Integration Tests
- **What:** Do integration tests pass for affected service boundaries?
- **Why:** Unit tests don't catch cross-module failures.
- **When:** Per-task (if service boundary touched). Phase-end (full suite).
- **Type:** Deterministic.
- **Failure:** Blocking.

## Category 8: Regression Tests
- **What:** Do previously passing tests still pass after the change?
- **Why:** Regressions are the primary risk of multi-task builds.
- **When:** Cross-task validation (full test suite on merged state). Phase-end.
- **Type:** Deterministic.
- **Failure:** Blocking. Regression attributed to most recently merged task.

## Category 9: Security Scans
- **What:** Secrets, dependency vulnerabilities, dangerous shell usage, license compliance.
- **Why:** Agents can introduce security risks unknowingly.
- **When:** Per-task (modified files/deps). Phase-end (full repo).
- **Type:** Deterministic (scanner tools).
- **Failure:** Secrets → blocking. Critical/high vulns → blocking. Copyleft license → blocking. Medium vulns → warning.

## Category 10: Architecture Boundary Checks
- **What:** Do imports respect layer rules? Do cross-module references comply with declared boundaries?
- **Why:** Architecture drift is the primary long-term quality risk in agent-generated code.
- **When:** Per-task. Cross-task. Phase-end.
- **Type:** Deterministic (ESLint rules + structural test).
- **Failure:** Blocking.

## Category 11: Doc Freshness Checks
- **What:** Are AGENTS.md, architecture docs, and policies consistent with current code?
- **Why:** Stale docs give agents wrong context, compounding errors.
- **When:** Phase-end. Harness-quality evaluation.
- **Type:** Hybrid (structural check for cross-references + agentic check for semantic consistency).
- **Failure:** Escalation (triggers doc-gardening task).

## Category 12: Evidence Completeness Checks
- **What:** Does every completed task have the required evidence bundle?
- **Why:** Evidence is the basis of trust. Missing evidence means unverifiable work.
- **When:** Per-task (before COMPLETED transition). Phase-end (all tasks).
- **Type:** Deterministic.
- **Failure:** Blocking.

## Category 13: False-Success Checks
- **What:** Did the implementation pass validators but produce wrong behavior?
- **Why:** The most dangerous failure mode — the system says "done" but it's wrong.
- **When:** Phase-end (Checkpoint B tests run against final state). Benchmark evaluation.
- **Type:** Hybrid (deterministic test execution + agentic review of test adequacy).
- **Failure:** Blocking. Requires human review of test strategy.

## Category 14: Repair-Loop Quality Checks
- **What:** Did repair loops converge? Was the fix targeted or a blind retry? Did the same failure repeat?
- **Why:** Repair loops that don't converge waste resources and hide problems.
- **When:** Per-repair-attempt (compare output deltas). Phase-end (aggregate repair metrics).
- **Type:** Hybrid (deterministic loop detection + agentic repair quality assessment).
- **Failure:** Loop detected → escalation. Repair budget exceeded → escalation.

## Category 15: Platform Benchmark Runs
- **What:** Does Forge produce correct, passing output on known-outcome benchmark repos?
- **Why:** The only way to know Forge works is to run it against problems with known answers.
- **When:** Periodic (nightly or per-release). On demand.
- **Type:** Deterministic (expected output comparison).
- **Failure:** Benchmark regression → platform investigation.

## Category 16: Agent Behavior Evals
- **What:** Do agents respect scope, follow policy, stay within capability boundaries?
- **Why:** Agent misbehavior undermines the entire trust model.
- **When:** Platform evaluation (adversarial test repos). Post-build audit trail review.
- **Type:** Deterministic (audit trail analysis against expected behavior).
- **Failure:** Misbehavior detected → platform investigation.

## Category 17: Prompt Injection / Untrusted Input Evals
- **What:** Do agents follow instructions embedded in repo content?
- **Why:** Prompt injection through repo content is a real attack surface.
- **When:** Platform evaluation (adversarial test repos with embedded instructions).
- **Type:** Deterministic (measure compliance rate against known-embedded instructions).
- **Failure:** High compliance rate → platform investigation, context-pack trust boundary revision.

---

# 6. Node-Level Validation Design

### Implementation Node

| Aspect | Specification |
|---|---|
| **Required inputs** | Task description, coding packet (scope, acceptance criteria), context pack (AGENTS.md, architecture doc, relevant source files, policies) |
| **Required outputs** | Modified/created files (diff), git commit in worktree |
| **Required evidence** | Diff, audit trail, test results (co-located tests if written), compilation status |
| **Validator sequence** | Compilation → lint → type-check → unit tests → schema validation → architecture check → file structure → integration tests (if applicable) → boot check → secret scan → dependency scan (if deps changed) → scope-drift → protected-path → harness integrity → policy compliance → evidence completeness → confidence score |
| **Retry semantics** | On failure: classify failure → enrich context → debugger agent produces targeted fix → re-validate. Up to 3 attempts per failure classification. |
| **Escalation** | Repair exhausted, confidence below threshold, protected-path mutation, dependency addition, novel judgment needed |
| **Complete when** | All validators pass + evidence bundle complete + reviewer approved |
| **BLOCKED when** | Repair exhausted, escalation triggered, human input required |

### Test-Writing Node

| Aspect | Specification |
|---|---|
| **Required inputs** | Test strategy (from Checkpoint B), requirements, acceptance criteria, implementation files (if writing tests for existing code) |
| **Required outputs** | Test files |
| **Required evidence** | Test files created, test pass/fail results, coverage delta |
| **Validator sequence** | Test files compile → tests execute → tests pass → coverage delta ≥ 0 → scope-drift → evidence completeness |
| **Special rule** | Test-writing nodes cannot read the implementation agent's internal reasoning or draft code. They work from the specification and acceptance criteria. |
| **Complete when** | Tests compile, execute, and coverage requirements met |

### Debugger Node

| Aspect | Specification |
|---|---|
| **Required inputs** | Failed task's evidence bundle, failure report, original task description, relevant code |
| **Required outputs** | Targeted fix (minimal diff) |
| **Required evidence** | Fix diff, re-validation results, failure-report reference |
| **Validator sequence** | Same as implementation node (full pipeline on fixed code) |
| **Special rule** | Fix must be minimal — the diff should be smaller than the original implementation diff. If the fix is a full rewrite, escalate. |
| **Complete when** | Re-validation passes |

### Reviewer Node

| Aspect | Specification |
|---|---|
| **Required inputs** | Task diff, architecture doc, coding conventions, task description |
| **Required outputs** | Review verdict (approve / request changes) with structured findings |
| **Required evidence** | Review findings document, verdict, files reviewed |
| **Validator sequence** | Scope-drift check on review (reviewer should only read, not write) → evidence completeness |
| **Special rule** | Reviewer cannot modify code. If changes are needed, findings go back to implementer. |
| **Complete when** | Verdict issued |

### Doc-Update Node

| Aspect | Specification |
|---|---|
| **Required inputs** | Current code state, current docs, harness docs |
| **Required outputs** | Updated docs (diff) |
| **Required evidence** | Doc diff, freshness check results |
| **Validator sequence** | Scope-drift (only docs/ modified) → harness integrity (if harness docs touched, escalates) → evidence completeness |
| **Complete when** | Doc freshness check passes on updated docs |

### Harness-Maintenance Node

| Aspect | Specification |
|---|---|
| **Required inputs** | Current code state, current harness, failure history, phase completion data |
| **Required outputs** | Proposed harness updates (diff) |
| **Required evidence** | Proposed changes, justification, failure patterns cited |
| **Validator sequence** | Scope check (harness/ only) → **always escalates to human** |
| **Complete when** | Human approves harness changes |

---

# 7. Build-Level Validation Design

A build is valid when:

1. **No BLOCKED tasks remain.** Every task in the task graph is COMPLETED, CANCELLED (with justification), or explicitly deferred by the user.
2. **Full test suite passes on merged phase branch.** Not just affected tests — the entire suite.
3. **No regressions.** Tests that passed at phase start still pass at phase end.
4. **Architecture boundaries respected.** Full-repo structural test passes.
5. **No unresolved security findings.** No critical/high severity vulnerabilities. No detected secrets. No unresolved policy violations.
6. **All harness artifacts fresh.** AGENTS.md, ARCHITECTURE.md, and policies are consistent with current code (within tolerance — minor drift acceptable, major drift blocks).
7. **All evidence bundles complete.** Every COMPLETED task has a full evidence bundle per the evidence model.
8. **Repair metrics within bounds.** Average repair attempts per task ≤ 2. No single task required maximum repairs. Total repair cost ≤ 20% of total build cost.
9. **Confidence acceptable.** Aggregate confidence (mean of task confidences) ≥ threshold (default 0.85).
10. **SBOM generated.** Supply-chain snapshot exists for the build.

**What prevents a build from being considered done:**
- Any task BLOCKED without resolution
- Full test suite failure
- Critical/high security finding unresolved
- Evidence completeness < 100%
- Aggregate confidence < threshold (triggers escalation, not automatic failure)

---

# 8. Evidence Model for Validation

## Mandatory Evidence (Alpha)

Every completed implementation task must have:

| Evidence Item | Source | Tier |
|---|---|---|
| **Diff** (files modified/created/deleted) | Git diff from task worktree | Tier 0 (committed) |
| **Compilation status** | `tsc --noEmit` exit code | Tier 1 |
| **Lint results** | ESLint output summary | Tier 1 |
| **Type-check results** | Strict mode verification | Tier 1 |
| **Unit test results** (pass/fail per test, coverage) | Test runner structured output | Tier 1 |
| **Architecture check results** | Structural test output | Tier 1 |
| **Secret scan results** | Scanner output | Tier 1 |
| **Dependency scan results** (if deps changed) | Scanner output | Tier 1 |
| **Scope-drift check results** | Validator output | Tier 1 |
| **Policy compliance summary** | Audit trail analysis | Tier 1 |
| **Reviewer verdict** | Reviewer agent findings + verdict | Tier 1 |
| **Confidence score with factor breakdown** | Computed from above | Tier 1 |
| **Audit trail** (all tool invocations for this task) | Tool Broker logs | Tier 1 |
| **Cost/token summary** | Orchestrator metering | Tier 1 |
| **Context pack manifest** (what the agent was given) | Orchestrator assembly log | Tier 1 |
| **Worktree identity** (branch name, base commit) | Git metadata | Tier 1 |

## Mandatory Evidence by Other Node Types

| Node Type | Additional Required Evidence |
|---|---|
| Test-writing | Test files diff, test execution results, coverage delta |
| Debugger | Fix diff, failure report reference, re-validation results, fix-size-vs-original comparison |
| Reviewer | Review findings, files reviewed, verdict |
| Doc-update | Doc diff, freshness check results |
| Harness-maintenance | Proposed changes, justification, human approval record |

## Optional Evidence (Captured if Available)

| Evidence | Tier | Capture Condition |
|---|---|---|
| Application boot log | Tier 2 | If boot check ran |
| Full stdout/stderr from commands | Tier 2 | Always captured, promoted on failure |
| Screenshots | Tier 2 | If browser automation ran (deferred for Alpha) |
| Repair history (per attempt) | Tier 1 | If repair loop ran |
| Merge conflict resolution diff | Tier 1 | If conflict occurred |

---

# 9. False-Success Prevention

False success is the most dangerous failure mode. Here are the concrete mechanisms:

## Mechanism 1: Independent Test Design
Tests designed during Checkpoint B (validation strategy phase) are specified before implementation begins. The test strategy defines what must be tested based on the requirements and acceptance criteria — not based on the implementation. The implementer may write co-located tests for its own feedback, but those tests supplement the specification-derived tests, they do not replace them.

## Mechanism 2: Test Adequacy Review
The reviewer agent specifically checks whether: (a) the implementer's tests test the specification or just the implementation, (b) edge cases from the requirements are covered, (c) tests exercise failure paths not just happy paths. If the reviewer finds the tests tautological (testing that the code does what the code does, rather than what the spec says), the review fails.

## Mechanism 3: Coverage Monotonicity
Coverage cannot decrease. If a task produces code that lowers coverage, the task fails validation even if all existing tests pass. This prevents the case where an agent writes untested code that happens to not break existing tests.

## Mechanism 4: Specification-Test Traceability
Each acceptance criterion from `harness/acceptance-criteria.md` must be traceable to at least one test. Phase-end validation checks this traceability. Missing coverage is flagged.

## Mechanism 5: Architecture Structural Tests
Architecture checks are not naming conventions. They are structural tests that verify the import graph complies with declared dependency directions. An agent cannot make an architecture-violating change pass by renaming files — the import graph is what is tested.

## Mechanism 6: Regression Detection
The full test suite runs on the merged phase branch, not just the tests the agent touched. If a task passes its own tests but breaks an unrelated test elsewhere, that is detected at cross-task or phase-end validation.

## Mechanism 7: Evidence Completeness as Gate
A task cannot be marked COMPLETED without a full evidence bundle. This prevents the case where a task "passes" but the evidence of how it passed is missing. If the evidence is missing, the system does not know whether the task actually passed — so it hasn't.

## Mechanism 8: Benchmark Validation
Known-outcome benchmark repos (see Section 14) have expected outputs. Forge periodically runs against these benchmarks. If Forge produces output that passes its own validators but does not match the expected output, that is a false-success detection signal at the platform level.

---

# 10. Retry, Repair, and Escalation Evaluation

## What Counts as a Valid Repair Attempt

A repair attempt is valid when: (a) the debugger received the failure report and context, (b) the debugger produced a diff that is different from the previous attempt's diff, (c) the diff was re-validated through the full pipeline. If the debugger produces an identical or substantially similar diff (>90% overlap), that is a **loop**, not a repair attempt.

## Repair Budget

- **Per-failure-classification:** 3 attempts. If the same failure type recurs 3 times, escalate.
- **Per-task total:** 5 attempts across all failure types. A task that fails with lint error, gets fixed, then fails with test error, then gets fixed, then fails with architecture error has used 3 of its 5 attempts.
- **Per-phase total:** Total repair cost ≤ 20% of total phase token cost. If repairs are consuming disproportionate resources, the task graph or harness may be poorly specified.

## Loop Detection

The system detects loops by comparing: (a) failure classification across attempts (same classification = potential loop), (b) diff similarity across attempts (high similarity = loop), (c) error message identity across attempts (same error = loop). When a loop is detected, the task is BLOCKED and escalated.

## How Repair Quality Is Measured

| Metric | Good | Bad |
|---|---|---|
| Repair success rate | > 60% of first repair attempts succeed | < 30% |
| Diff size ratio (fix / original) | Fix < 30% of original diff size | Fix ≈ original (full rewrite) |
| Classification stability | Failure classification changes after repair (different error = progress) | Same classification repeats |
| Escalation rate from repairs | < 15% of failed tasks reach escalation | > 40% |

## How Repair History Feeds Harness Evolution

After each phase, the harness-maintenance agent reviews repair patterns:
- If the same failure type recurred across multiple tasks → propose a new lint rule or policy.
- If repairs frequently involved a specific module → flag that module for architectural review.
- If debugger repairs were consistently fixing the same class of mistake → propose a new coding convention.

All proposed changes escalate to human approval.

---

# 11. Harness-Quality Evaluation

The harness is only valuable if it is accurate, complete, and actively used by agents.

## What Is Evaluated

| Aspect | Check | Frequency |
|---|---|---|
| **AGENTS.md freshness** | Does AGENTS.md reference files/paths that still exist? Are new modules reflected? | Phase-end |
| **Architecture doc accuracy** | Does the declared layer model match the actual import graph? | Phase-end (structural test) |
| **Policy coverage** | Are there code paths or modules not covered by any architecture boundary rule? | Phase-end |
| **Test strategy coverage** | Does every requirement have at least one associated test? | Phase-end |
| **Convention enforcement** | Are all declared conventions enforced by a lint rule or structural test? (Unenforced conventions are aspirational, not real.) | Phase-end |
| **Evidence convention completeness** | Is the evidence model fully specified for all node types? | Phase-end |
| **Stale references** | Do harness docs reference deprecated APIs, removed files, or old patterns? | Phase-end (link-check) |
| **Agent context utilization** | Are agents reading the harness docs they're given? (Measured by whether agent behavior complies with harness guidance.) | Per-task (behavioral comparison) |

## Harness Readiness Score

A composite score (0-100) based on:
- AGENTS.md freshness (25%)
- Architecture doc accuracy (25%)
- Policy/convention enforcement coverage (25%)
- Test strategy → requirement traceability (25%)

Alpha target: ≥ 70. Below 70 triggers harness-maintenance before next phase.

---

# 12. Security Evaluation Layer

## Alpha-Required Security Evaluations

| Evaluation | Method | Target |
|---|---|---|
| **Policy engine correctness** | Synthetic tool invocations against every policy rule. Verify correct ALLOW/DENY/ESCALATE. | 100% rule coverage, 0 incorrect decisions |
| **Least-privilege adherence** | Build runs where tasks require out-of-scope tools. Verify agents receive denials and do not attempt workarounds. | 0 successful out-of-scope actions |
| **Secret exposure** | Test repos with secrets in environment. Verify no leakage to committed files, logs, or evidence. | 0 secret leakage incidents |
| **Scope-drift detection** | Tasks with narrow declared scope. Verify out-of-scope writes are caught. | 100% detection rate |
| **Prompt injection resistance** | Adversarial test repos with embedded instructions in code comments, README, AGENTS.md. Measure agent compliance rate. | < 5% compliance with injected instructions |
| **Dependency risk** | Test repos with known-vulnerable dependencies. Verify scanner catches them. | 100% detection of critical/high |
| **Cross-worktree isolation** | Concurrent tasks with overlapping file interests. Verify no cross-contamination. | 0 contamination incidents |

## Deferred Security Evaluations

| Evaluation | Why Deferred |
|---|---|
| Red-team with human adversaries | Requires dedicated security team time |
| Container escape testing | Single-user Alpha; not yet multi-tenant |
| Advanced prompt injection (multi-turn, indirect) | Baseline injection testing first |
| Runtime monitoring of production builds | Alpha is pre-production |

---

# 13. Platform Metrics

| Metric | Definition | Alpha Target | Alpha Required? |
|---|---|---|---|
| **Validated task completion rate** | % of tasks that pass all validators on final attempt | > 85% | Yes |
| **First-pass success rate** | % of tasks that pass all validators on first attempt (no repair) | > 60% | Yes |
| **False-positive completion rate** | % of "completed" tasks later found incorrect (via benchmarks or human review) | < 5% | Yes |
| **Mean repair attempts per task** | Average number of repair cycles for tasks that needed repair | < 2.0 | Yes |
| **Repair success rate** | % of repair attempts that resolve the failure | > 60% | Yes |
| **Blocked task rate** | % of tasks that reach BLOCKED (escalated to human) | < 15% | Yes |
| **Regression rate** | % of builds that introduce test regressions | < 5% | Yes |
| **Architecture drift rate** | % of tasks that fail architecture boundary checks | < 10% | Yes |
| **Policy violation rate** | % of tool invocations that violate policy | < 2% | Yes |
| **Security alert rate** | % of tasks with security findings (critical/high) | Tracked, no target | Yes |
| **Evidence completeness rate** | % of completed tasks with full evidence bundles | 100% | Yes |
| **Reviewer disagreement rate** | % of tasks where reviewer requests changes | Tracked, no target | Yes |
| **Time to trustworthy completion** | Wall-clock time from Build click to PR-ready | Tracked | Yes |
| **Benchmark success rate** | % of benchmark repos that produce correct output | > 80% | Yes |
| **Harness readiness score** | Composite harness quality score (0-100) | ≥ 70 | Yes |
| **Unsafe action attempt rate** | % of tasks where agent attempted a blocked action | < 3% | Yes |
| **Blocked dangerous action rate** | % of unsafe attempts caught by policy engine | 100% | Yes |
| **Secret leakage rate** | Secrets exposed in committed files | 0 | Yes |
| **Prompt injection compliance rate** | % of adversarial tests where agent followed injected instruction | < 5% | Yes |
| **Scope-drift rate** | % of tasks with out-of-scope writes | < 1% | Yes |
| **Cost per task** | Mean token cost per task | Tracked | Later |
| **Cost per build** | Total token cost per build | Tracked | Later |

---

# 14. Benchmark Suite Design

## Benchmark 1: Greenfield CRUD App
- **What it tests:** Full pipeline — planner → design → validation strategy → task graph → build → merge
- **Why it belongs:** The core use case. If this doesn't work, nothing works.
- **Success:** Working CRUD app with correct routes, database operations, input validation, tests passing, coverage ≥ 80%
- **Key validators:** All correctness validators, architecture checks, coverage
- **Expected failures:** Edge cases in input validation, missing error handling on first pass

## Benchmark 2: Auth-Enabled Dashboard
- **What it tests:** Multi-module coordination — auth, database, API, UI components
- **Why it belongs:** Tests task decomposition quality and cross-task integration
- **Success:** Working auth flow (signup/login/logout), protected routes, dashboard with data
- **Key validators:** Integration tests, architecture boundaries, security (no hardcoded secrets)
- **Expected failures:** Auth middleware ordering, session management edge cases

## Benchmark 3: Bug-Fix Task (Existing Repo)
- **What it tests:** Can Forge diagnose and fix a known bug in a pre-built repo?
- **Why it belongs:** Tests debugger agent quality and targeted repair
- **Success:** Bug is fixed, regression tests added, no other tests broken
- **Key validators:** Regression detection, fix minimality (diff should be small)
- **Expected failures:** Fix may introduce new issues if context is insufficient

## Benchmark 4: Repo Refactor Task
- **What it tests:** Can Forge rename a module, update all imports, and keep everything passing?
- **Why it belongs:** Tests scope management and architecture boundary respect
- **Success:** All references updated, no broken imports, tests pass, architecture check passes
- **Key validators:** Architecture checks, regression tests, scope management
- **Expected failures:** Missed references in non-obvious locations (config files, dynamic imports)

## Benchmark 5: Documentation Sync
- **What it tests:** Can Forge detect and fix doc drift after code changes?
- **Why it belongs:** Tests harness-quality evaluation and doc-gardening capability
- **Success:** Docs accurately reflect current code state. No stale references.
- **Key validators:** Doc freshness check, link validation
- **Expected failures:** Semantic drift that structural checks miss

## Benchmark 6: Security-Sensitive Patch
- **What it tests:** Can Forge apply a security fix without introducing new vulnerabilities?
- **Why it belongs:** Tests security validator stack and secret handling
- **Success:** Vulnerability fixed, secret scan clean, dependency scan clean, no new attack surface
- **Key validators:** All security validators, scope-drift (patch should be minimal)
- **Expected failures:** Overly broad patch that touches unnecessary files

## Benchmark 7: Dependency Upgrade
- **What it tests:** Can Forge upgrade a package and fix breaking changes?
- **Why it belongs:** Tests supply-chain awareness and regression detection
- **Success:** Package upgraded, breaking API changes fixed, all tests pass, no new vulnerabilities
- **Key validators:** Dependency scan, regression tests, integration tests
- **Expected failures:** Subtle API behavior changes that don't cause type errors

## Benchmark 8: Architecture-Constrained Feature
- **What it tests:** Can Forge add a feature while respecting strict architecture boundaries?
- **Why it belongs:** Tests the core Harness Engineering thesis — constraints enable speed without decay
- **Success:** Feature works, architecture boundaries respected, no new boundary violations
- **Key validators:** Architecture boundary check (primary), all correctness validators
- **Expected failures:** Agent trying to shortcut by violating a boundary, caught by structural test

---

# 15. Human Review in the Evaluation Model

## Always Human-Required (Alpha)

| Decision | Why |
|---|---|
| Product/system design approval (Checkpoint A) | Strategic intent — only the user knows what they want |
| Validation strategy approval (Checkpoint B) | The user must agree on what "correct" means |
| Task graph approval (Checkpoint C) | The user must agree on the work plan |
| Merge to main (Checkpoint D) | Final accountability — the user's repo |
| Harness policy changes | Rules that govern all future agent behavior |
| New dependency approval | Supply-chain trust decision |

## Auto-Validated in Alpha (No Human Required)

| Decision | Why Auto |
|---|---|
| Individual task completion | Validator pipeline is the trust mechanism |
| Repair loop progression | Debugger + validator handles automatically |
| Agent review pass/fail | Reviewer agent is a first-class gate |
| PR creation (from phase completion) | Mechanical: all tasks done + all validators pass |
| Doc updates within `docs/` | Low risk, validator-checked |

## How Human Interventions Become Harness Improvements

When a human intervenes (rejects a PR, overrides a decision, re-scopes a task):
1. The intervention is recorded with structured metadata: what was wrong, what the human decided, what the root cause was.
2. After the build, the harness-maintenance agent reviews interventions and proposes: new lint rules, updated policies, new conventions, or updated architecture docs.
3. Proposed changes escalate to human approval.
4. Approved changes are committed to the harness, making future builds less likely to need the same intervention.

---

# 16. Alpha Minimum Viable Evaluation Harness

## Required Before Implementation Begins

### Node Validators (per-task)
- Compilation, lint, type-check, unit tests, architecture check, file structure, boot check
- Secret scan, dependency scan (if deps changed)
- Scope-drift, protected-path, harness integrity, policy compliance
- Evidence completeness, confidence scoring

### Build Validators
- Full test suite on merged state
- Regression detection
- Coverage threshold
- Harness freshness check
- SBOM generation (informational)
- Full secret scan

### Security Validators
- Policy engine correctness tests (synthetic invocations)
- Least-privilege adherence tests
- Secret exposure tests
- Scope-drift detection tests
- Prompt injection resistance tests (baseline adversarial repos)
- Cross-worktree isolation tests

### Evidence Bundle
- All mandatory evidence items from Section 8
- Three-tier retention (Tier 0/1/2 per v1.3.1 model)

### Benchmark Set
- Greenfield CRUD app (Benchmark 1)
- Auth-enabled dashboard (Benchmark 2)
- Architecture-constrained feature (Benchmark 8)
- At minimum these three; others added as Alpha matures

### Metrics
- All metrics marked "Alpha Required" in Section 13

### Explicitly Deferred
- Browser automation evidence
- Red-team security exercises
- Historical analytics dashboards
- Benchmark repos for existing-repo scenarios (Benchmarks 3, 4)
- Cost optimization metrics
- Continuous production evaluation

---

# 17. Failure Taxonomy

| Failure Type | Definition | Detection Signal | Severity | Blocking? | Escalation |
|---|---|---|---|---|---|
| **Requirement failure** | Requirements are vague, contradictory, or untestable | Checkpoint A review; missing acceptance criteria detected mechanically | High | Yes (pre-build) | Planner revises |
| **Planning failure** | Plan is architecturally unsound or infeasible | Checkpoint A/C review; detected by task graph correctness check | High | Yes (pre-build) | Planner revises |
| **Architecture failure** | Architecture boundaries violated or architecture doc inaccurate | Architecture structural test | High | Yes | Repair loop → escalation |
| **Task decomposition failure** | Tasks overlap, have missing coverage, or are too large | Checkpoint C review; scope overlap detection | Medium | Yes (pre-build) | Planner revises |
| **Implementation failure** | Code doesn't compile, fails tests, or doesn't meet spec | Validator pipeline (compilation, tests, etc.) | Medium-High | Yes | Repair loop → escalation |
| **Validation failure** | Validator itself is wrong (false positive/negative) | Benchmark regression; human override pattern | Critical | Escalation | Platform investigation |
| **Reviewer failure** | Reviewer approves bad code or rejects good code | Benchmark comparison; human disagreement rate | Medium | Escalation | Reviewer prompt/context revision |
| **Evidence failure** | Evidence bundle is incomplete or corrupted | Evidence completeness check | High | Yes | Cannot complete without evidence |
| **Policy failure** | Policy engine allows prohibited action or blocks legitimate action | Policy correctness tests; audit trail review | Critical | Escalation | Platform investigation |
| **Security failure** | Secret leaked, vulnerability introduced, scope violated | Security validators | Critical | Yes | Immediate escalation |
| **Environment failure** | Container crash, worktree corruption, network failure | Container health check; git status check | High | Yes | Retry with fresh environment |
| **False-success failure** | Task passes all validators but output is incorrect | Benchmark comparison; human review; Checkpoint B test mismatch | Critical | Escalation | Test strategy revision |
| **Harness failure** | Harness docs are stale, misleading, or absent | Harness readiness score < threshold; doc freshness check | Medium | Escalation | Harness maintenance triggered |

---

# 18. Repo Artifacts to Produce from This Phase

This phase, once finalized, should produce the following documents to be committed to the Forge product repo and (in template form) to user project repos:

| Artifact | Location | Contents |
|---|---|---|
| `harness/definition-of-done.md` | User repo | Node, task, phase, build, PR, and merge completion requirements. Machine-readable where possible. |
| `harness/validation-stack.md` | User repo | Ordered validator sequence per level. Which checks are blocking. What failure means. |
| `harness/evidence-model.md` | User repo | Required evidence per node type. Mandatory vs optional. Tier mapping. |
| `harness/failure-taxonomy.md` | User repo + Forge repo | Failure types, detection signals, severity, escalation paths. |
| `harness/platform-metrics.md` | Forge repo | Metric definitions, targets, collection method. |
| `harness/benchmark-suite.md` | Forge repo | Benchmark repo descriptions, expected outcomes, validator focus areas. |
| `harness/security-evals.md` | Forge repo | Security evaluation specifications, adversarial test repo descriptions, targets. |
| `harness/repair-policy.md` | User repo | Repair budget, loop detection rules, escalation triggers. |
| `harness/false-success-policy.md` | User repo | False-success prevention mechanisms, test independence rules, coverage monotonicity. |

---

# 19. Open Questions for Next Phase (Implementation Architecture)

1. **Validator execution order and parallelism.** Can Layer 1 validators (correctness) run in parallel, or must they be sequential? If compilation fails, should lint still run? (Probably yes — more feedback is better for repair.)

2. **Evidence storage schema.** The evidence model defines what must exist. The implementation must define the exact storage schema, indexing strategy, and query patterns for Tier 1 records.

3. **Confidence score computation.** The design says confidence is computed from test pass rate, coverage delta, repair count, scope-drift flags, and security scan results. The implementation must define the exact formula and weight calibration.

4. **Benchmark runner architecture.** Benchmarks run Forge against known-outcome repos. The implementation must define how the benchmark runner invokes Forge, compares outputs, and reports results.

5. **Repair context enrichment strategy.** The design says the debugger receives "enriched context." The implementation must define exactly what additional context is provided beyond the original context pack — failure report, validator output, previous repair attempts.

6. **Policy engine decision latency.** Every tool invocation passes through the policy engine. The implementation must ensure this adds < 50ms per decision. What is the architecture of the policy evaluation path?

7. **Cross-task validation trigger.** After a task merges back to the phase branch, cross-task validation runs. The implementation must define: does this block the next task from starting, or does it run in parallel with the next task's execution?

8. **Harness readiness score computation.** The design defines four components at 25% each. The implementation must define how each component is measured — especially "architecture doc accuracy," which requires comparing a doc to an import graph.

9. **Test strategy ↔ implementation isolation.** The design requires that Checkpoint B tests are designed independently from implementation. The implementation must define how the test strategy is translated into actual test files before the implementer runs, and how those test files are kept separate from implementer-written co-located tests.

10. **Reviewer prompt design.** The reviewer agent must check for tautological tests, scope compliance, and convention adherence. The implementation must define the reviewer's prompt, context pack, and structured output format.

---

# 20. Phase 2 Decision Summary

## Recommended Validation Philosophy
Evidence-based completion from convergent independent sources. "Tests passed" is one signal among many. False-success prevention is an explicit design goal. The platform evaluates itself, not just the generated software.

## Recommended Alpha Validation Stack
Seven levels: node → task → cross-task → phase → build → merge → platform. Four validator layers per task: correctness → security → policy → evidence. Confidence scoring as escalation trigger. Harness readiness scoring as phase gate.

## Recommended Definition-of-Done Model
Multi-level completion contracts from node through merge. Evidence bundle required at every level. No claim-based completion — only evidence-based. Harness changes always require human approval.

## Recommended Evidence Requirements
Mandatory per-task: diff, all validator outputs, audit trail, reviewer verdict, confidence score, context pack manifest, cost summary. Three-tier retention per v1.3.1. Evidence completeness is a blocking validator gate.

## Recommended Benchmark Suite
Alpha minimum: Greenfield CRUD, Auth Dashboard, Architecture-Constrained Feature. Eight benchmarks defined for progressive expansion. Benchmarks test the full pipeline against known-outcome repos.

## Recommended Platform Metrics
Twenty-one metrics defined. All marked "Alpha Required" must be tracked from first build. Targets set for first-pass success (>60%), validated completion (>85%), false-positive completion (<5%), evidence completeness (100%), benchmark success (>80%).

## Recommended Security Evaluation Layer
Seven Alpha-required evaluations: policy correctness, least privilege, secret exposure, scope drift, prompt injection, dependency risk, cross-worktree isolation. Adversarial test repos for the blessed stack. Automated eval runner.

## Top Implementation Questions for Next Phase
1. Validator parallelism strategy
2. Evidence storage schema
3. Confidence score formula and calibration
4. Benchmark runner architecture
5. Repair context enrichment specification
6. Policy engine decision latency architecture
7. Cross-task validation scheduling
8. Harness readiness score computation
9. Test strategy ↔ implementation isolation mechanism
10. Reviewer prompt and structured output design
