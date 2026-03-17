# Phase 7 Go / No-Go Checklist

## Purpose

Use this checklist to decide whether Forge may transition from Phase 7 preparation into Phase 8 / Wave 0 live launch.

A GO is allowed only when every blocking criterion is satisfied. Advisory criteria do not block GO by themselves, but unresolved advisory gaps must be understood and recorded in the signoff.

## Blocking Readiness Criteria

### Packet manifests

- [ ] `packets/manifests/WAVE0-SYNTHETIC.yaml` exists, is the approved version, and passes manifest validation
- [ ] `packets/manifests/F-M0-003.yaml` through `F-M0-007.yaml` exist, are the approved versions, and pass manifest validation
- [ ] Packet registry entries for the Wave 0 and Wave 1 packet set are present and internally consistent
- [ ] No duplicate packet identity or version ambiguity exists in the instantiated set

### Manifest validation tooling

- [ ] Schema completeness checks are operational
- [ ] Dependency reference integrity and cycle detection checks are operational
- [ ] Reference-integrity checks for validator, evidence, review, context-pack, and template refs are operational
- [ ] Wave membership checks are operational
- [ ] Scope and protected-path checks are operational
- [ ] Validation results were re-run after the last blocking artifact change

### Validator manifests

- [ ] `packets/validator-manifests/foundation.yaml` exists, is approved, and references valid tools
- [ ] Any validator manifest referenced by the Wave 0 or Wave 1 packet set exists, is approved, and references valid tools
- [ ] Validator behavior is understood: blocking validators gate promotion, advisory review remains non-blocking unless the review manifest requires human review

### Evidence manifests

- [ ] `packets/evidence-manifests/standard.yaml` exists and lists the required evidence fields for Wave 0 and Wave 1
- [ ] Evidence completeness checks block promotion when required evidence is missing
- [ ] Evidence expectations for diff, validator outputs, audit trail, cost summary, context-pack manifest, and worktree identity are understood by the operator

### Review manifests

- [ ] `packets/review-manifests/human-required.yaml` exists and is attached where required
- [ ] `packets/review-manifests/agent-review.yaml` exists if advisory review is enabled
- [ ] Review decision records are defined and usable by the operator

### Wave manifests

- [ ] `packets/waves/wave0-dry-run.yaml` exists, is approved, and remains the rehearsal-only control artifact
- [ ] `packets/waves/wave0-live.yaml` exists, is approved, is clearly distinct from `packets/waves/wave0-dry-run.yaml`, and keeps Wave 0 live limited to one packet, `concurrency_cap: 1`, `launch_mode: operator-launched`, `default_review: human-required`, and `speculative_execution: false`
- [ ] `packets/waves/wave1-m0a-contracts.yaml` exists, is approved, and remains serial, operator-launched, and non-speculative
- [ ] Freeze, rollback, and expansion criteria are present and understood

### Operator runbooks

- [ ] `ops/runbooks/wave0-smoke.md` has been used during rehearsal and remains usable as the Wave 0 operational reference
- [ ] `ops/runbooks/wave1-launch.md` is present for the immediate post-Wave 0 path
- [ ] `ops/runbooks/validator-failure.md` is present for controlled failure handling
- [ ] `ops/runbooks/cli-fallback.md` is present and matches the available CLI behavior

### CLI fallback

- [ ] CLI fallback commands used for launch, status, evidence, escalations, pause, and metrics are operational
- [ ] The operator successfully used CLI fallback during rehearsal, not just nominal UI-driven flow
- [ ] At least one escalation was processed through the CLI path

### Benchmark fixtures

- [ ] `benchmarks/fixtures/wave0-synthetic/` is present and matches the expected rehearsal fixture
- [ ] `benchmarks/manifests/wave0-smoke.yaml` is present and the expected outcomes were used during rehearsal review

### Synthetic dry-run rehearsal results

- [ ] The synthetic packet completed successfully at least once in rehearsal
- [ ] Rehearsal evidence was complete for the successful synthetic run
- [ ] Rehearsal notes are recorded in `ops/rehearsal-notes.md`
- [ ] No unresolved blocking rehearsal gap remains

### Security controls

- [ ] Blessed-stack policy files are authored, loaded, and unchanged since last readiness verification
- [ ] Protected-path enforcement is active
- [ ] Secret scanning and dependency scanning behavior are available where expected
- [ ] Rehearsal did not reveal any ability to bypass declared policy or protection boundaries

### Policy engine behavior

- [ ] Happy-path rehearsal produced the expected ALLOW-only policy pattern
- [ ] A controlled escalation scenario was exercised and the outcome was recorded
- [ ] Unexpected DENY or ESCALATE behavior has been resolved or is explicitly blocking GO
- [ ] Speculative-start marker behavior is understood and remains false for Wave 0 and Wave 1 readiness

### Escalation coverage

- [ ] Escalation paths for protected-path writes, validator failure, and operator pause/freeze decisions are documented
- [ ] At least one escalation path was rehearsed successfully end-to-end
- [ ] The operator can identify who decides approve, deny, re-scope, pause, or return-to-preparation actions

### Review coverage

- [ ] Human review coverage is ready for Wave 0 and Wave 1 packets
- [ ] The operator can inspect diff, validator results, evidence summary, and reviewer verdict without ambiguity
- [ ] Review expectations remain aligned with approved architecture docs rather than output plausibility alone

### Metrics visibility

- [ ] `forge metrics` produces visibility into packet state, validator results, evidence completeness, policy outcomes, audit trail, escalations, and cost signals
- [ ] The operator can explain current packet state from the observed signals during rehearsal
- [ ] Metric gaps that would hide packet or policy state are resolved before GO

## Advisory Readiness Criteria

- [ ] Debugger, reviewer, graph-repair proposer, and security-reviewer templates exist in draft form even if their calibration is not yet blocking for Wave 0
- [ ] Runbooks contain operator notes from rehearsal where this improves clarity
- [ ] Token budgets were reviewed against rehearsal observations
- [ ] Wave 1 observation cadence is pre-decided and noted by the operator
- [ ] M0a authorship mode for Wave 1 is decided before Wave 0 live launch
- [ ] First-failure response protocol for Wave 1 is pre-decided before live launch

## Mutation And Readiness Invalidation Rules

### Changes that invalidate readiness

Any of the following changes after the last completed readiness verification require re-verification before GO:

- Any packet manifest in the Wave 0 or Wave 1 set
- Any validator manifest referenced by those packets
- Any policy file
- `packets/waves/wave0-dry-run.yaml`
- `packets/waves/wave0-live.yaml`
- `packets/waves/wave1-m0a-contracts.yaml`
- Manifest validation tooling rules

Apply the stricter interpretation when in doubt: if a change can alter packet behavior, validation outcomes, policy decisions, or wave control, readiness is invalidated.

### Changes that do not invalidate readiness

The following changes do not invalidate readiness by themselves:

- Runbook wording or sequencing improvements
- Prompt template wording changes
- Operator note additions
- Rehearsal debrief note additions that do not alter the underlying artifacts under test

These non-invalidating changes may still justify a targeted rehearsal spot-check if they materially affect operator comprehension.

## Signoff

- Decision: `GO` / `NO-GO`
- Decision date:
- Decision time:
- Environment verified:
- Launch authority:
- Secondary reviewer or witness:
- Blocking items incomplete, if any:
- Advisory gaps accepted for launch, if any:
- Re-verification required before next decision? `yes` / `no`
- Notes:
