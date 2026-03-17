# Validator Failure Runbook

## Purpose

Handle validator failures without widening scope or bypassing the evidence gate.
Use this for Wave 0 rehearsal/live validation failures and Wave 1 packet validation failures.

## Failure Classes

| Failure class | Meaning | Default operator action |
|---|---|---|
| Validator `FAIL` | The validator ran and found a packet defect | Pause packet, classify defect, decide repair or rejection |
| Validator `ERROR` | The validator stack itself malfunctioned or returned an ambiguous result | Auto-pause and investigate validator/runtime health first |
| Validator disagreement | Validators produce contradictory signals | Auto-pause and resolve inconsistency before continuing |
| Evidence incompleteness | Evidence completeness validator blocks advancement | Pause until bundle is complete and audit continuity is confirmed |

## Trigger Conditions

Enter this runbook when any of the following occurs:
- A blocking validator returns `FAIL`
- Any expected validator is missing from the run
- Any validator returns `ERROR`
- Validator outputs contradict each other
- Evidence completeness fails or becomes ambiguous

## Immediate Actions

1. Pause the packet. Do not allow new tool actions while classification is incomplete.
2. Record packet ID, wave, validator name, validator outcome, and timestamp in the operator log.
3. Preserve the current evidence bundle, audit trail, diff, and worktree identity.
4. Confirm whether the issue is packet-local or platform-level.
5. Check whether artifact drift occurred after readiness verification.

## Classification

### Packet defect
Use this classification when the validator failure is caused by the packet output itself.
Typical examples:
- compilation or lint failure on Wave 0 or Wave 1 output
- scope-drift violation
- architecture-boundary violation
- missing required export or type mismatch

Operator actions:
1. Confirm the manifest, context pack, and validator references are the approved ones.
2. Review the failure report and the diff.
3. Decide whether a repair loop is allowed.
4. If repair is allowed, re-run with failure-focused retry context only.
5. Re-run the failed validator set and evidence completeness before considering approval.

### Validator/runtime defect
Use this classification when the validator stack is unreliable.
Typical examples:
- validator process crash
- missing validator execution record
- contradictory pass/fail state
- evidence capture gap caused by the validator pipeline

Operator actions:
1. Treat this as a platform issue, not a packet issue.
2. Freeze the wave if reliability of the validator path is in doubt.
3. Verify runtime health, validator configuration, and audit continuity.
4. Do not approve, merge, or retry the packet until validator reliability is restored.

### Spec or graph defect
Use this when the validator failure reveals a deeper design contradiction.
Typical examples:
- contract cannot satisfy approved architecture as written
- packet scope is too narrow for the required output
- hidden prerequisite or hidden coupling appears

Operator actions:
1. Pause the packet.
2. Do not keep iterating blind repairs.
3. Move to the graph-repair runbook if the issue is structural.
4. For Wave 1, pause the wave and resolve spec ambiguity before continuing.

## Wave-Specific Handling

### Wave 0
- One narrowly scoped repair may be tolerated if it is packet-local and non-policy.
- Two repairs or oscillation patterns mean Wave 0 failed.
- Graph repair is not allowed during live Wave 0.
- Validator `ERROR`, audit gaps, or evidence corruption should be treated as freeze-or-abort conditions.

### Wave 1
- Deterministic validators are blocking for every packet.
- Human review does not override a failing deterministic validator.
- Repeated failures on the same packet require deciding between repair, rejection, or graph repair.
- If multiple Wave 1 packets reveal the same validator or spec problem, pause the wave.

## Decision Table

| Situation | Action |
|---|---|
| Blocking validator `FAIL`, defect is packet-local | Pause packet, allow targeted repair, re-validate |
| Validator `ERROR` | Auto-pause, investigate validator/runtime path |
| Evidence completeness failure | Pause packet until completeness is green and audit trail is intact |
| Contradictory validator results | Pause packet, resolve inconsistency before resuming |
| Repeated repair loop without convergence | Reject packet or escalate to graph repair |
| Structural contradiction to approved design | Pause and escalate to graph repair/spec resolution |

## Required Evidence Before Resume

Resume only when all are true:
- failure cause is classified
- corrective action is recorded
- affected validators were re-run successfully
- evidence completeness is `PASS`
- audit trail is continuous
- no invalidating artifact drift occurred
- operator or launch authority explicitly authorizes resume

## Required Record Fields

Record these fields in the operator log or launch record:
- packet ID
- wave
- validator name(s)
- `FAIL` / `ERROR` / disagreement classification
- cause classification: packet / validator-runtime / spec-graph
- operator decision: retry / reject / freeze / abort / graph-repair review
- retry attempt number
- resume authorization time
- final outcome

## Exit Conditions

Exit this runbook only when one of the following is true:
- packet passes all required validators and evidence completeness
- packet is rejected and returned for repair or re-scope
- wave is frozen pending platform or spec resolution
- packet is aborted
