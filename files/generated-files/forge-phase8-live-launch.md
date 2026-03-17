# Forge Phase 8 — Live Launch and Operational Transition

**Version:** 8.0  
**Date:** March 16, 2026  
**Status:** Design Phase — Live Operational Transition  
**Prerequisites:** Phase 1–7 stack (all approved, all amendments and carry items applied); all Phase 8 Wave 0 operational artifacts instantiated

---

## 1. Phase 8 Purpose

Phase 8 is the live operational transition layer for Forge. It takes the readiness evidence produced by Phase 7 and the design framework produced by the existing Phase 8 Wave 0 design document (`forge-phase8-wave0.md`) and converts them into a controlled, executed, supervised, and closed-out live launch.

Phase 8 exists because preparation and execution are fundamentally different operating modes. Phase 7 proved that the launch package exists, is validated, and has been rehearsed. Phase 8 proves that the live runtime behaves correctly under real operational control. The boundary between them is not cosmetic — it separates readiness evidence from operational evidence, rehearsal protocol from launch protocol, and artifact preparation from authority-gated execution.

Phase 8 proves four things:

1. The go/no-go decision process functions correctly and produces a defensible launch authorization.
2. The live execution pipeline (dispatch, validation, evidence capture, policy enforcement, audit logging, merge-back) behaves as designed under operator supervision.
3. The escalation, pause, freeze, abort, and rollback mechanisms work when needed.
4. The closeout and disposition process produces a clean, unambiguous record that can authorize or block Wave 1.

Phase 8 follows Phase 7 because Phase 7 explicitly states that launching is a mode change from design to operations, and that mixing preparation with execution removes the clean checkpoint where the operator can say "we are ready" or "we are not ready." Phase 7 produces the readiness evidence; Phase 8 makes the decision and executes.

Phase 8 must remain narrow. It governs Wave 0 synthetic live execution and the subsequent disposition decision. It does not redesign Wave 1, create new subsystems, or expand scope beyond what the existing artifact set already defines.

---

## 2. Phase 8 Scope

### What Phase 8 includes

- Final go/no-go decision using the existing checklist and decision record artifacts.
- Live Wave 0 synthetic launch using the `wave0-live.yaml` manifest and the `WAVE0-SYNTHETIC` packet only.
- Operator supervision of live execution using the existing launch protocol, escalation matrix, rollback playbook, and live metrics spec.
- Evidence inspection, closeout, and disposition recording.
- Wave 1 authorization boundary determination.

### What Phase 8 explicitly excludes

- Wave 1 execution. Wave 1 is governed by its own manifest (`wave1-m0a-contracts.yaml`) and progression checklist (`wave1-progression-checklist.md`). Phase 8 may authorize Wave 1 progression but does not execute it.
- Architecture redesign. No prior phase decisions are reopened.
- New subsystem design. No new harness, policy, or pipeline components are introduced.
- Backlog or ticket creation. Phase 8 is an operational phase, not a planning phase.
- Wave 2+ content. Nothing beyond the immediate Wave 0 → Wave 1 boundary is addressed.
- Implementation code. Phase 8 is a governance and execution phase, not a coding phase.

### What "strict operating sequence" means in practice

Forge phases are serial and non-overlapping in authority. Phase 8 may not begin until Phase 7 readiness criteria are satisfied. Wave 0 live may not launch until the go/no-go decision is recorded as GO. Wave 1 authorization may not proceed until Wave 0 closeout explicitly permits it. No phase may reach backward to reopen a settled decision from a prior phase without an explicit amendment.

### What counts as Phase 8 success

Phase 8 succeeds when all four success levels defined in the existing design are met: packet-level success, wave-level success, launch-process success, and platform-trust success. Success also requires a closed decision record with an unambiguous disposition and, if applicable, explicit Wave 1 authorization.

### What would invalidate Phase 8 readiness

Phase 8 readiness is invalidated by any change to packet manifests, validator manifests, evidence manifests, policy files, wave manifests, or manifest-validation tooling after the last completed readiness verification. It is also invalidated by loss of live infrastructure health, CLI fallback unavailability, or any unresolved Phase 7 blocking readiness gap.

---

## 3. Current-State Grounding

Phase 8 builds on a substantial existing artifact set. The following summarizes only what is operationally relevant to Phase 8.

### Wave 0 dry-run artifacts

- `packets/waves/wave0-dry-run.yaml` — rehearsal-only wave manifest. Governs dry-run behavior only; must not be used for live launch.
- `benchmarks/manifests/wave0-smoke.yaml` — rehearsal benchmark expectations. Not authoritative for live success determination.
- `benchmarks/fixtures/wave0-synthetic/` — scenario, expected outcomes, and README for the synthetic dry-run fixture.
- `ops/rehearsal-notes.md` — operator rehearsal debrief and lessons.
- `ops/runbooks/wave0-smoke.md` — rehearsal runbook for the Wave 0 synthetic scenario.

### Wave 0 live artifacts

- `packets/waves/wave0-live.yaml` — live wave manifest. Defines one packet (`WAVE0-SYNTHETIC`), concurrency 1, operator-launched, human-required review, speculative execution false, artifact immutability after GO, and explicit launch/continuation/freeze/abort/rollback gates.
- `packets/manifests/WAVE0-SYNTHETIC.yaml` — the synthetic packet manifest.
- `benchmarks/manifests/wave0-live-smoke.yaml` — live benchmark watchlist. Distinct from the rehearsal smoke manifest.
- `ops/wave0-go-no-go-checklist.md` — formal blocking and advisory criteria with authority, artifact version, and signoff fields.
- `ops/wave0-launch-protocol.md` — step-by-step pre-launch, activation, monitoring, evidence inspection, escalation, and closeout procedure.
- `ops/wave0-escalation-matrix.md` — eleven escalation categories with owners, automatic actions, resume evidence requirements, and logging rules.
- `ops/wave0-rollback-playbook.md` — definitions, triggers, revert steps, and post-rollback disposition rules for pause, freeze, abort, and rollback.
- `ops/wave0-live-metrics.md` — metric definitions, targets, continuation/pause/abort gates, and closeout review requirements.
- `ops/wave0-decision-record.md` — template for GO/NO-GO, authorities, artifact versions, timeline, interventions, metrics summary, final outcome, and Wave 1 authorization permission.
- `ops/wave0-postmortem-template.md` — incident classification, anomaly categories, timeline, impact assessment, root cause, lessons, and disposition recommendation.
- `ops/wave0-handoff-template.md` — authority transfer template with state, escalations, decisions, anomalies, and acceptance fields.

### Wave 1 authorization boundary

- `ops/wave1-progression-checklist.md` — pre-launch checks, per-packet checks for F-M0-003 through F-M0-007, wave-completion checks, escalation checks, evidence checks, validator checks, and post-Wave-1 progression criteria.
- `packets/waves/wave1-m0a-contracts.yaml` — Wave 1 manifest defining the five M0a contract packets, serial execution, human-required review, and the pre-wave gate `wave0-live-completion-approved`.

### Validator / evidence / review surfaces

- `packets/validator-manifests/foundation.yaml` — four-layer validator stack for foundation-class packets.
- `packets/evidence-manifests/standard.yaml` — required evidence fields and completeness rules.
- `packets/review-manifests/human-required.yaml` — human review as blocking.
- `packets/review-manifests/agent-review.yaml` — advisory agent review.

### Packet registry and wave manifests

- `packets/validation/packet-registry.yaml` — registry of instantiated packets.
- `packets/validation/wave-checker.yaml` — wave membership consistency rules.
- Seven manifest validation artifacts in `packets/validation/` covering schema, dependencies, references, scope, and linter rules.

### Harness policies

- `harness/policies/blessed-stack.yaml`
- `harness/policies/protected-paths.yaml`
- `harness/policies/shell-allowlist.yaml`
- `harness/policies/token-budgets.yaml`

### Operator runbooks and checklists

- `ops/checklists/go-no-go.md` — Phase 7 readiness checklist (input to Phase 8 go/no-go).
- `ops/checklists/pre-launch.md` — common and wave-specific pre-launch blocking checks.
- `ops/checklists/wave-readiness.md` — wave-level governance checklist.
- `ops/checklists/packet-readiness.md` — packet-level activation checklist.
- `ops/runbooks/cli-fallback.md` — CLI fallback procedures.
- `ops/runbooks/graph-repair.md` — graph repair procedures (not applicable for Wave 0 live).
- `ops/runbooks/validator-failure.md` — validator failure handling.
- `ops/runbooks/wave1-launch.md` — Wave 1 launch runbook.
- `ops/escalation-matrix.md` — general escalation matrix.
- `ops/operator-daily-loop.md` — daily operator supervision loop.

---

## 4. Phase 8 Operating Model

### Lifecycle

Phase 8 follows a strict linear lifecycle:

1. **Readiness confirmation** — Phase 7 go/no-go checklist (`ops/checklists/go-no-go.md`) is satisfied; all blocking criteria pass.
2. **Rehearsal-to-live boundary** — rehearsal state is archived, live namespace is clean, carry-forward artifacts are confirmed.
3. **Go/no-go decision** — Wave 0 live go/no-go checklist (`ops/wave0-go-no-go-checklist.md`) is completed; explicit GO or NO-GO is recorded in the decision record.
4. **Live launch** — `WAVE0-SYNTHETIC` is activated under operator supervision using the launch protocol (`ops/wave0-launch-protocol.md`).
5. **Monitoring and intervention** — operator watches live signals, handles escalations per the escalation matrix, applies pause/freeze/abort per the rollback playbook.
6. **Evidence inspection** — operator inspects the complete live evidence bundle before declaring success.
7. **Closeout** — decision record is completed with disposition, metrics, anomalies, and Wave 1 authorization permission.
8. **Wave 1 authorization boundary** — if all four success levels are met and closeout permits it, Wave 1 authorization may proceed.

### Decision authorities

- **Primary Launch Authority**: one named person accountable for the GO/NO-GO call and all pause/freeze/abort/resume/rollback decisions during the live run.
- **Acting Launch Authority**: a named fallback who may assume control only after explicit acceptance is recorded in the launch log. No implicit substitution.
- **Operator on duty**: executes the launch protocol, monitors live signals, classifies escalations, and records evidence. Does not hold authority to override governance decisions.

### What remains human-gated

- GO/NO-GO decision.
- Every pause resume.
- Every freeze clearance.
- Every abort decision.
- Every rollback authorization.
- Every authority handoff.
- Final evidence inspection before declaring success.
- Closeout disposition.
- Wave 1 authorization permission.

### What remains serial

- Wave 0 executes one packet at a time (concurrency cap 1).
- Closeout must complete before any Wave 1 decision.
- If Wave 0 is repeated, the new run follows the same full lifecycle.

### How speculation is handled

Speculative execution is disabled for Wave 0. The speculative-start marker must remain `false` throughout the run. Any speculative artifact or flag appearing during live Wave 0 is a launch anomaly triggering freeze.

### Packet and wave identity during live launch

During Phase 8, exactly one wave identity (`wave-0-live`) and one packet identity (`WAVE0-SYNTHETIC`) are active. The live wave manifest is `packets/waves/wave0-live.yaml`, not `wave0-dry-run.yaml`. Live evidence, audit trails, and decision records must reference the live wave and packet identities only. Rehearsal identities must not appear in live operational records.

---

## 5. Wave 0 Synthetic Live Launch Model

### Purpose

Wave 0 live exists to produce authoritative operational evidence for the real control path: launch governance, policy enforcement, validator execution, evidence capture, audit logging, and merge-back. It proves the operational spine is trustworthy under live conditions.

### Why it remains synthetic

Wave 0 uses a synthetic packet (`WAVE0-SYNTHETIC`) that creates trivial TypeScript files. The code output is intentionally worthless. The value is proving that manifest loading, worktree provisioning, context assembly, tool routing, policy evaluation, validator execution, evidence assembly, audit completeness, and merge-back all function correctly under live operator control. Keeping the packet synthetic isolates pipeline-trust signals from code-quality signals.

### What it exercises

Manifest loading and parsing, worktree provisioning, context-pack assembly, agent invocation (model call, tool calls), tool broker routing (`file_write`, `git_commit`, `run_tests`, `run_typecheck`, `run_lint`), policy engine evaluation, four-layer validator pipeline, evidence bundle assembly and completeness check, merge-back to phase branch, audit trail completeness, operator launch protocol, escalation handling readiness, and decision recording.

### What it does not exercise

Complex architectural decisions, cross-subsystem interfaces, concurrent execution, speculative starts, repair loops (unless the agent fails), security dependency scanning (no dependencies involved), multi-packet review queues, or real product-building work.

### Allowed packet set

Exactly one: `WAVE0-SYNTHETIC`. No real M0a, M0b, M1, or later packets. No policy-sensitive packets. No graph-repair packets.

### Launch mode

Operator-launched. Activation requires explicit GO from the Primary Launch Authority.

### Review mode

Human-required. The operator manually inspects the full live evidence bundle before declaring success. Agent review may run as optional advisory pre-screen but is never blocking.

### Concurrency cap

1. No parallel execution. No staging of follow-on packets. No queueing of Wave 1 within the same launch window.

### Benchmark/watchlist expectations

Live smoke expectations are governed by `benchmarks/manifests/wave0-live-smoke.yaml`, not the rehearsal artifact. Smoke expectations cover: packet completion, validator pass set, evidence completeness, policy behavior (ALLOW-only happy path), merge-back correctness, audit trail completeness, and speculative marker remaining false.

### Live evidence expectations

Before declaring success, the operator must verify the live evidence bundle contains: diff, compile/lint/test results, architecture check result, scope-drift result, policy compliance result, evidence completeness result, confidence score, full audit trail, cost summary, context-pack manifest, worktree identity, and speculative-start marker = false. Evidence completeness alone is insufficient; manual operator inspection is a success condition.

### Abort/freeze/rollback expectations

Defined in `ops/wave0-rollback-playbook.md`. No live graph repair in Wave 0. No scope widening to rescue the packet. No blending of rehearsal evidence into rollback justification. If rollback occurs, Wave 0 does not count as successful.

---

## 6. Go / No-Go Framework

### Blocking criteria

A GO is blocked if any of the following is true:

- Any Phase 7 blocking readiness criterion (from `ops/checklists/go-no-go.md`) is false.
- Live infrastructure health is unverified.
- CLI fallback is unavailable.
- Manifest hashes do not match approved versions.
- Live policy smoke checks fail.
- Evidence capture path is unverified in live mode.
- Launch-day rollback playbook is missing or unreviewed.
- No successful rehearsal with full evidence exists.
- No escalation rehearsal exists.
- Live and rehearsal artifact namespaces are not cleanly separated.
- Primary Launch Authority is not named.
- Acting Launch Authority is not named.
- Launch decision record is not opened.

### Advisory criteria

These should pass but do not block GO if documented:

- Debugger prompt family not fully tuned.
- Reviewer template calibration incomplete.
- Graph-repair proposer still draft quality.
- Non-Wave-0 runbooks incomplete.
- Broader benchmark fixture set deferred.
- Token budget recalibration noted as provisional.
- Wave 1 observation cadence pre-decided at least provisionally.

### Signoff expectations

The decision record requires three separate signoff lenses — runtime readiness, validation/evidence readiness, and security/policy readiness — even if one person signs all three. This prevents implicit feelings of readiness from replacing structured acknowledgment.

### Artifact immutability expectations

Readiness is invalidated by any change to packet manifests, validator manifests, evidence manifests, policy files, wave manifests, or manifest-validation tooling after the last readiness verification. If a change occurs, readiness must be re-verified. The go/no-go checklist (`ops/wave0-go-no-go-checklist.md`) records specific artifact versions or hashes.

### What changes invalidate prior readiness

Any change to the artifacts listed in the mutation/invalidation rules of `ops/checklists/go-no-go.md` Section "Mutation And Readiness Invalidation Rules." The stricter interpretation applies: if a change can alter packet behavior, validation outcomes, policy decisions, or wave control, readiness is invalidated.

### Fallback authority

If the Primary Launch Authority becomes unavailable mid-run, active execution is paused or frozen, the handoff template (`ops/wave0-handoff-template.md`) is completed, the Acting Launch Authority explicitly accepts control in the launch log, and only then may execution resume.

### What must be true before GO is allowed

Every item in `ops/wave0-go-no-go-checklist.md` must be marked true. If any blocking item is false, the decision is NO-GO.

---

## 7. Launch Protocol

The launch protocol is defined operationally in `ops/wave0-launch-protocol.md`. The following is the authoritative step-by-step sequence.

### Pre-launch checks

1. Open `ops/wave0-decision-record.md` and record date, time, environment, operator, and named authorities.
2. Record approved versions or hashes for: wave manifest, packet manifest, validator manifest, evidence manifest, review manifest, live benchmark manifest, and active policy files.
3. Confirm no invalidating artifact drift since readiness verification.
4. Verify live infrastructure health (runtime, worktree provisioning, policy engine, storage, model/API access).
5. Verify CLI fallback for: launch, status, metrics, evidence inspection, escalation queue, pause/freeze, resume, and rollback.
6. Run live policy smoke checks; confirm expected ALLOW/DENY/ESCALATE behavior.
7. Confirm rehearsal and live namespaces are separate (branches, worktrees, audit logs, evidence bundles, operator notes).
8. Confirm only `WAVE0-SYNTHETIC` is active; unrelated packet execution disabled.
9. Review the escalation matrix and rollback playbook with the operator on duty.
10. Complete the Wave 0 live go/no-go checklist.

### Launch activation

11. Primary Launch Authority reviews the completed checklist.
12. Primary Launch Authority records explicit GO in the decision record.
13. Timestamp GO and freeze launch artifacts for the execution window.
14. Activate `WAVE0-SYNTHETIC` through the operator-approved control path.
15. Confirm dedicated live worktree/branch is provisioned.
16. Confirm live context pack reflects the approved profile and budget.
17. Confirm the packet enters the expected initial state without skipped transitions.

### Monitoring loop

During execution, continuously inspect: packet state transitions, validator start/finish/PASS/FAIL/ERROR states, policy decisions (any DENY or ESCALATE), evidence completeness progression, runtime health and worktree integrity, token usage versus warning and hard ceilings, audit trail growth and completeness, escalation queue state, merge-back status, and benchmark smoke visibility. If the current packet state cannot be explained from observed signals, pause or freeze per the escalation matrix.

### Intervention loop

If any escalation occurs: classify the category using `ops/wave0-escalation-matrix.md`, apply the required auto-pause/freeze/abort behavior, record trigger/owner/decision/resume evidence in the decision record, and resume only after named authority explicitly authorizes resume and required evidence exists.

### Evidence inspection loop

When the packet reaches completion-candidate state: verify the diff is limited to approved synthetic scope, verify all validator outcomes against `benchmarks/manifests/wave0-live-smoke.yaml`, verify confidence score, verify full audit trail, verify cost summary and context-pack manifest, verify worktree identity, verify speculative-start marker = false, verify merge-back completed cleanly, and record any interventions in the decision record.

### Pause/freeze/abort handling

The operator may not improvise. All control actions follow `ops/wave0-rollback-playbook.md` exactly. Pause on recoverable ambiguity, freeze on governance/security uncertainty, abort on manifest/policy/evidence integrity failures, rollback if synthetic merge-back is untrustworthy.

### Closeout steps

1. Freeze new launches once Wave 0 reaches terminal success, abort, or rollback.
2. Complete final evidence review per the evidence inspection procedure.
3. Record metrics summary, anomalies, interventions, and authority handoffs.
4. Choose exactly one disposition: advance to Wave 1 planning, repeat Wave 0 live, or return to preparation / no-go.
5. Record whether Wave 1 authorization is permitted in the closed decision record (field: `Wave 1 planning permitted`).
6. If postmortem is required, complete `ops/wave0-postmortem-template.md` before any Wave 1 launch.

---

## 8. Escalation and Rollback Model

### Escalation classes

The existing escalation matrix (`ops/wave0-escalation-matrix.md`) defines eleven categories: validator disagreement or ERROR, evidence incompleteness, policy engine anomaly, unsafe action attempt, security alert, graph inconsistency, manifest inconsistency, runtime instability, benchmark smoke regression, operator overload / loss of visibility, and CLI fallback unavailability.

### Ownership

Each escalation class names specific owners (operator, Primary Launch Authority, or both). No escalation may be resolved by an unnamed or unauthorized actor.

### What forces pause

Transient runtime instability, ambiguous validator ERROR under investigation, temporary evidence collection anomaly, operator needing inspection before the next step, CLI fallback degraded but recoverable quickly. Pause preserves packet state and allows resume after corrective action.

### What forces freeze

Policy engine anomaly, security alert, evidence pipeline anomaly, unexplained live vs. rehearsal divergence, operator loss of situational awareness, authority handoff required, graph inconsistency discovered during live Wave 0. Freeze blocks all new launches and merge approvals; only Launch Authority or Acting Launch Authority can clear.

### What forces abort

Manifest mismatch at runtime, token hard ceiling reached, protected-path or unsafe action attempt, audit trail gap, unrecoverable evidence corruption, repeated unsafe policy interaction, worktree corruption requiring fresh start, second major repair need on the synthetic packet. Abort is terminal for the active packet; no auto-retry.

### What qualifies as rollback

Synthetic merge-back is untrustworthy, merged state requires revert, post-merge evidence reveals integrity failure, or authority explicitly orders revert after abort or freeze review. Rollback reverts the synthetic merge from the phase branch, archives evidence for forensics, and marks Wave 0 unsuccessful.

### Evidence required before resume

Resume after pause requires: issue classified, corrective action recorded, affected service/path revalidated, no invalidating artifact drift, decision record updated, and Primary or Acting Launch Authority explicitly authorizes resume.

### Distinction between retrying Wave 0 and returning to preparation

**Repeat Wave 0 live** is allowed only if: root cause is packet-local or operationally narrow, policy integrity remains trusted, evidence integrity remains trusted, launch artifacts can remain unchanged or be re-approved cleanly, and authority records why repeating is safer than returning to preparation.

**Return to preparation** is required if: policy integrity is in doubt, evidence completeness behaved as non-blocking in practice, audit continuity is in doubt, graph inconsistency or structural contradiction was discovered, artifact immutability or version control failed, or authority cannot explain the failure confidently.

---

## 9. Live Metrics and Thresholds

Phase 8 uses the metric set defined in `ops/wave0-live-metrics.md`. The following is a consolidated summary.

### Runtime health

Container, worktree, tool broker, and policy engine must remain healthy. No critical runtime fault during execution. Any instability triggers pause.

### Validator success

All expected validators must start and finish. Blocking validators must PASS. No validator ERROR. Any ERROR triggers auto-pause.

### Evidence completeness

All required live evidence fields must be present and complete (target: 100%). Evidence completeness failure triggers pause. Manual operator inspection is required before success declaration regardless of automated completeness checks.

### Policy decision clarity

Happy-path policy pattern should be ALLOW-only. Any unexpected DENY or ESCALATE triggers immediate investigation. Policy engine anomaly triggers freeze.

### Operator intervention burden

Target: zero interventions. One narrowly scoped intervention is tolerable if explained. Repeated or unexplained interventions indicate a Wave 0 failure or repeat-required disposition.

### Audit trail visibility

Continuous logging for every tool action and stateful decision. No gaps. Audit count must increase monotonically during execution. Any audit gap triggers abort.

### Benchmark/watchlist status

`wave0-live-smoke` expectations must remain visible and satisfied throughout execution. Lost smoke visibility triggers pause.

### Decision latency

Operator decision latency target: ≤ 5 minutes for blocking decisions; warn at > 3 minutes. Escalation-clearance time target: ≤ 15 minutes; freeze review at > 15 minutes.

### Thresholds

**Continue**: no critical runtime fault, no policy anomaly, no security alert, evidence path intact, speculative marker false, token usage below hard ceiling, state transitions legal, benchmark smoke visible.

**Pause**: validator ERROR, evidence completeness failure, unexpected DENY/ESCALATE, runtime reprovisioning needed, operator loses visibility, decision latency > 5 minutes, escalation-clearance > 15 minutes, benchmark smoke visibility lost, metrics contradictory or stale.

**Abort**: token ceiling reached, manifest mismatch, policy bypass suspected, audit gap, unsafe action on protected path, second major repair need, rollback required after merge-back, evidence corruption.

---

## 10. Phase 8 Decision Recording and Closeout

### What the decision record must capture

The decision record (`ops/wave0-decision-record.md`) captures: GO/NO-GO status, date/time, environment, launch window ID, wave and packet identity, named authorities (primary, acting, operator, witness), three signoff lenses (runtime, validation/evidence, security/policy), artifact versions/hashes for all live-launch artifacts, readiness confirmation fields, a full timeline of events, all interventions and escalations with type/trigger/decision/authority/outcome, a metrics summary covering all defined metrics, final disposition, rollback status, Wave 1 authorization permission (field: `Wave 1 planning permitted`), handoff references, and postmortem requirement.

### How final disposition is recorded

Exactly one disposition is chosen: advance to Wave 1 planning, repeat Wave 0 live, or return to preparation / no-go. The disposition is recorded in the decision record along with the rationale. Wave 1 authorization is granted only if `Wave 1 planning permitted: yes` is recorded with a rationale tied to all four success levels.

### How anomalies are classified

Anomalies are classified using the categories in the escalation matrix and postmortem template: operational anomaly, validation failure, policy anomaly, security incident, runtime instability, governance failure, or rollback event. Each anomaly receives a severity (low/medium/high/critical) and an impact assessment.

### Postmortem expectations

If the decision record marks `Postmortem required: yes`, a postmortem using `ops/wave0-postmortem-template.md` must be completed before any Wave 1 launch. The postmortem covers incident summary, classification, anomaly categories, timeline, what happened, impact assessment, root cause and contributing factors, lessons, and disposition recommendation.

### Handoff expectations

If authority transfer occurred during the run, the handoff template (`ops/wave0-handoff-template.md`) must be completed with current packet state, open escalations, required next decisions, metrics anomalies, and authority acceptance. Handoff records become part of the decision record archive.

### What must be preserved before Wave 1 authorization

The closed decision record, complete live evidence bundle, audit trail, metrics summary, all intervention logs, any postmortem records, and the operator debrief notes. These form the evidentiary basis for the Wave 1 authorization decision.

---

## 11. Wave 1 Authorization Boundary

### Required live evidence

Wave 1 may proceed only if the live evidence bundle from Wave 0 is complete and demonstrates:

- Packet reached terminal success state.
- All blocking validators passed without ERROR.
- Evidence completeness was 100%.
- Policy decisions were trustworthy (ALLOW-only happy path, no unexplained anomalies).
- Audit trail was complete and continuous.
- Speculative marker remained false.
- Merge-back completed cleanly.
- Runtime remained stable without freeze or abort.
- Operator intervention burden was low and explainable.

### Required closeout status

- Decision record is closed with `Final disposition: Advance to Wave 1 planning`.
- `Wave 1 planning permitted: yes` is explicitly recorded with rationale tied to all four success levels (packet, wave, launch-process, platform-trust).
- If postmortem was required, it is completed.
- Metrics review, anomaly review, and operator debrief are all completed.

### What unresolved issues block Wave 1

- Any Wave 0 success level not met.
- Any unresolved escalation.
- Any unresolved security alert.
- Any evidence integrity doubt.
- Any policy trust doubt.
- Any audit continuity doubt.
- Any rollback that occurred during Wave 0.
- Any governance ambiguity (e.g., unclear authority during an escalation).
- Any postmortem that concludes `Return to preparation`.

### How the Wave 1 progression checklist should be interpreted after Phase 8

`ops/wave1-progression-checklist.md` begins with the pre-launch checks that depend on Wave 0 completion. After Phase 8 closeout, the operator uses the closed Wave 0 decision record to satisfy the first set of checklist items (Wave 0 success, post-launch review documented, Wave 1 planning permitted, postmortem completed if required). The remaining items (token budget review, manifest validation, infrastructure health, etc.) are Wave 1 preparation items that must be satisfied independently. The checklist is not considered satisfied by Wave 0 success alone — it is a gate that depends on Wave 0 evidence but adds Wave-1-specific readiness requirements.

---

## 12. Risks Specific to Phase 8

### False readiness

**Why it matters**: proceeding to live launch when preparation artifacts are incomplete, inconsistent, or untested leads to avoidable failures that erode trust.

**Detection**: the go/no-go checklist is the primary defense. Any blocking item marked false prevents GO. The operator should not rationalize around blocking gaps.

**Operator action**: if false readiness is suspected after GO, freeze immediately, re-run the checklist, and re-authorize only if all blocking criteria pass.

### Artifact drift after readiness review

**Why it matters**: if manifests, policies, or validators change between the last readiness verification and live GO, the operator may be launching against an untested configuration.

**Detection**: the go/no-go checklist requires artifact version/hash recording. The decision record locks specific versions. Any mismatch between recorded and loaded versions is detectable.

**Operator action**: if drift is detected, freeze, re-verify readiness, and re-authorize.

### Unclear escalation ownership

**Why it matters**: if an escalation occurs and ownership is ambiguous, the operator may delay, improvise, or fail to escalate correctly.

**Detection**: the escalation matrix names owners for each category. The pre-launch review of the matrix with the operator surfaces ambiguity.

**Operator action**: if ownership is unclear during a live escalation, default to the Primary Launch Authority. If they are unavailable, activate the handoff protocol to the Acting Launch Authority.

### Benchmark/watchlist ambiguity

**Why it matters**: if the operator cannot tell whether live smoke expectations are met or not, the continue/pause distinction becomes subjective.

**Detection**: live smoke visibility is a continuation gate. Lost visibility triggers pause.

**Operator action**: pause, restore visibility, and only resume when smoke expectations can be evaluated.

### Evidence incompleteness

**Why it matters**: if the evidence bundle is incomplete, the operator cannot determine whether the pipeline actually functioned correctly.

**Detection**: evidence completeness is a blocking validator and a manual inspection requirement.

**Operator action**: do not declare success with incomplete evidence. Pause, investigate, and if evidence cannot be completed, the run is not successful.

### Rollback ambiguity

**Why it matters**: if the operator is unsure whether merged state is trustworthy, delayed rollback decisions may leave the repository in a bad state.

**Detection**: the rollback playbook defines exact triggers and revert steps.

**Operator action**: follow the playbook. When in doubt, rollback is conservative and safe because Wave 0 output is synthetic and has no product value.

### Operator overload

**Why it matters**: Wave 0 is designed to be low-burden, but if multiple anomalies occur simultaneously or the operator lacks visibility, supervision quality degrades.

**Detection**: operator overload / loss of visibility is an explicit escalation category with auto-pause.

**Operator action**: pause, request handoff to the Acting Launch Authority, and restore visibility before resuming.

### Synthetic success mistaken for product readiness

**Why it matters**: a successful Wave 0 proves the operational spine, not the product. Treating it as broader validation creates false confidence going into Wave 1.

**Detection**: the existing design is explicit that Wave 0 success is "controlled correctness, not usefulness." The Wave 1 progression checklist adds independent readiness requirements.

**Operator action**: do not skip Wave 1 preparation items because Wave 0 succeeded. Interpret Wave 0 success narrowly: the pipeline works, the governance model works, and trust is earned for the next step only.

---

## 13. Artifact Implications

### Existing files Phase 8 relies on

Phase 8 relies on the full operational artifact set already present in the repo:

- **Go/no-go**: `ops/checklists/go-no-go.md`, `ops/wave0-go-no-go-checklist.md`, `ops/checklists/pre-launch.md`, `ops/checklists/wave-readiness.md`.
- **Launch execution**: `ops/wave0-launch-protocol.md`, `packets/waves/wave0-live.yaml`, `packets/manifests/WAVE0-SYNTHETIC.yaml`.
- **Monitoring**: `ops/wave0-live-metrics.md`, `benchmarks/manifests/wave0-live-smoke.yaml`.
- **Escalation**: `ops/wave0-escalation-matrix.md`.
- **Rollback**: `ops/wave0-rollback-playbook.md`.
- **Decision recording**: `ops/wave0-decision-record.md`.
- **Closeout**: `ops/wave0-postmortem-template.md`, `ops/wave0-handoff-template.md`.
- **Wave 1 boundary**: `ops/wave1-progression-checklist.md`, `packets/waves/wave1-m0a-contracts.yaml`.
- **Validation/evidence/review**: `packets/validator-manifests/foundation.yaml`, `packets/evidence-manifests/standard.yaml`, `packets/review-manifests/human-required.yaml`.
- **Policies**: all four files in `harness/policies/`.
- **Runbooks**: `ops/runbooks/wave0-smoke.md`, `ops/runbooks/cli-fallback.md`, `ops/runbooks/validator-failure.md`.
- **Rehearsal**: `ops/rehearsal-notes.md`, `packets/waves/wave0-dry-run.yaml`, `benchmarks/manifests/wave0-smoke.yaml`.

### Which files become primary during Phase 8 operation

During active Phase 8 execution, the primary artifacts are:

- `ops/wave0-decision-record.md` — the live decision record being actively written.
- `ops/wave0-launch-protocol.md` — the step-by-step procedure being followed.
- `ops/wave0-escalation-matrix.md` — the reference for any escalation.
- `ops/wave0-rollback-playbook.md` — the reference for any control action.
- `ops/wave0-live-metrics.md` — the reference for threshold decisions.
- `packets/waves/wave0-live.yaml` — the governing manifest.
- `benchmarks/manifests/wave0-live-smoke.yaml` — the live smoke watchlist.

### Whether any missing Phase 8 artifacts remain

Based on the current repo state, the Phase 8 operational artifact set appears complete. The existing `forge-phase8-wave0.md` design document specified ten repo artifacts; all ten exist in the `ops/` and `packets/waves/` directories. No missing Phase 8 artifacts are identified.

One observation: the existing design document (`forge-phase8-wave0.md`) itself serves as the design rationale but is not an operational artifact. This consolidated Phase 8 document serves the same role. Neither is required for live execution — they are design references, not runtime artifacts.

### Whether current artifacts appear sufficient

The current artifacts appear sufficient for Phase 8 execution. The go/no-go checklist, launch protocol, escalation matrix, rollback playbook, live metrics spec, decision record, postmortem template, handoff template, live wave manifest, and Wave 1 progression checklist collectively cover the full Phase 8 lifecycle from readiness through closeout and Wave 1 authorization.

---

## 14. File Split / Usage Guide

### Operationally central for Phase 8

These files are actively used during Phase 8 execution. The operator works with them in real time.

| File | Phase 8 role |
|---|---|
| `ops/wave0-decision-record.md` | Primary live record; written throughout execution |
| `ops/wave0-launch-protocol.md` | Step-by-step procedure for the entire launch |
| `ops/wave0-escalation-matrix.md` | Real-time escalation reference |
| `ops/wave0-rollback-playbook.md` | Real-time control action reference |
| `ops/wave0-live-metrics.md` | Threshold and gate reference during monitoring |
| `packets/waves/wave0-live.yaml` | Governing manifest for execution |
| `benchmarks/manifests/wave0-live-smoke.yaml` | Live smoke watchlist |

### Reference artifacts

These files provide background context or are consulted only when specific situations arise.

| File | Phase 8 role |
|---|---|
| `ops/checklists/go-no-go.md` | Phase 7 readiness input; confirms prerequisites met |
| `ops/checklists/pre-launch.md` | Cross-wave pre-launch reference |
| `ops/checklists/wave-readiness.md` | Wave-level governance reference |
| `ops/checklists/packet-readiness.md` | Packet activation reference |
| `ops/runbooks/cli-fallback.md` | Consulted if CLI issues arise |
| `ops/runbooks/validator-failure.md` | Consulted if validator failures occur |
| `ops/runbooks/wave0-smoke.md` | Rehearsal reference; not the live procedure |
| `ops/escalation-matrix.md` | General escalation reference (Wave 0 matrix is the live one) |
| `ops/operator-daily-loop.md` | General supervision cadence reference |
| `ops/rehearsal-notes.md` | Rehearsal lessons; context for live decisions |
| `packets/manifests/WAVE0-SYNTHETIC.yaml` | Packet definition reference |
| `packets/validator-manifests/foundation.yaml` | Validator stack reference |
| `packets/evidence-manifests/standard.yaml` | Evidence requirements reference |
| `packets/review-manifests/human-required.yaml` | Review policy reference |
| `harness/policies/*.yaml` | Policy file set reference |
| `benchmarks/manifests/wave0-smoke.yaml` | Rehearsal-only; not used for live decisions |
| `packets/waves/wave0-dry-run.yaml` | Rehearsal-only; not used for live execution |

### Decision artifacts

These files capture Phase 8 decisions and outcomes.

| File | Phase 8 role |
|---|---|
| `ops/wave0-go-no-go-checklist.md` | Records the GO/NO-GO decision with artifact versions |
| `ops/wave0-decision-record.md` | Records the full launch lifecycle and final disposition |
| `ops/wave0-postmortem-template.md` | Records incident analysis if required |

### Closeout artifacts

These files are used during or after Phase 8 closeout to enable Wave 1 transition.

| File | Phase 8 role |
|---|---|
| `ops/wave0-decision-record.md` | Closed record authorizing or blocking Wave 1 |
| `ops/wave0-postmortem-template.md` | Completed postmortem if required before Wave 1 |
| `ops/wave0-handoff-template.md` | Authority transfer record if handoff occurred |
| `ops/wave1-progression-checklist.md` | Wave 1 gate; depends on Phase 8 closeout evidence |
| `packets/waves/wave1-m0a-contracts.yaml` | Wave 1 manifest; activated only after Phase 8 permits |
