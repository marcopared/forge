# Wave 0 Launch Protocol

## Purpose

Define the live launch procedure for Phase 8 Wave 0. This protocol governs real
execution. Rehearsal behavior remains governed by `ops/runbooks/wave0-smoke.md`
and `packets/waves/wave0-dry-run.yaml`.

## Rehearsal vs Live Boundary

### Rehearsal

- Uses rehearsal namespace and rehearsal evidence only
- Proves readiness and operator procedure
- Does not produce authoritative live operational evidence

### Live launch

- Uses `packets/waves/wave0-live.yaml`
- Produces authoritative live evidence, launch log entries, and GO / NO-GO history
- Requires named authority, frozen artifacts, and explicit closeout before any Wave 1 decision

## Pre-Launch Steps

1. Open `ops/wave0-decision-record.md` and record date, time, environment, operator, and named authorities.
2. Record approved versions or hashes for the live wave manifest, packet manifest, validator manifest, evidence manifest, review manifest, live benchmark manifest, and active policy files.
3. Confirm no invalidating artifact drift since readiness verification.
4. Verify live infrastructure health for runtime, worktree provisioning, policy engine responsiveness, storage, and model/API access.
5. Verify CLI fallback for launch, status, metrics, evidence inspection, escalation queue, pause/freeze, resume, and rollback actions.
6. Run live policy smoke checks and confirm expected ALLOW / DENY / ESCALATE behavior.
7. Confirm rehearsal and live namespaces are separate for branches, worktrees, audit logs, evidence bundles, and operator notes.
8. Confirm only `WAVE0-SYNTHETIC` is active and that unrelated packet execution is disabled.
9. Review the escalation matrix and rollback playbook with the operator on duty.
10. Complete the Wave 0 live GO / NO-GO checklist.

## Activation Steps

1. Primary Launch Authority records explicit `GO` in the decision record.
2. Timestamp GO and freeze launch artifacts for the execution window.
3. Activate `WAVE0-SYNTHETIC` only through the operator-approved control path.
4. Confirm a dedicated live worktree or branch is provisioned for the packet.
5. Confirm the live context pack reflects the approved profile and remains within budget.
6. Confirm the packet enters the expected initial state without skipped transitions.

## Monitoring Loop

During execution, inspect these signals continuously:

- Packet state transitions
- Validator start, finish, PASS, FAIL, and ERROR states
- Policy decisions and any DENY or ESCALATE
- Evidence completeness progression
- Runtime health and worktree integrity
- Token usage versus warning and hard ceilings
- Audit trail growth and completeness
- Escalation queue state
- Merge-back status
- Benchmark smoke visibility

Operator rule: if the current packet state cannot be explained from the observed
signals, pause or freeze according to the escalation matrix.

## Evidence Inspection Procedure

Do not declare success at completion-candidate state. Inspect the full live
evidence bundle first.

1. Verify the diff is limited to the approved synthetic scope.
2. Verify compilation, lint, tests, architecture, scope-drift, policy-compliance, and evidence-completeness outcomes.
3. Verify those outcomes against `benchmarks/manifests/wave0-live-smoke.yaml`, not the rehearsal manifest.
4. Verify the confidence score is recorded.
5. Verify the full audit trail is present and continuous.
6. Verify the cost summary, context-pack manifest, and worktree identity are present.
7. Verify the speculative-start marker remains `false`.
8. Verify merge-back completed cleanly and remains trustworthy.
9. Record any intervention, pause, resume, freeze, abort, or authority handoff in the decision record.

## Escalation Handling

1. Classify the issue using `ops/wave0-escalation-matrix.md`.
2. Apply the required auto-pause, freeze, abort, or rollback behavior.
3. Record the trigger, owner, decision, and required resume evidence in the decision record.
4. Resume only after the named authority explicitly authorizes resume and the required evidence exists.

## Closeout Flow

1. Freeze new launches once Wave 0 reaches terminal success, abort, or rollback.
2. Complete final evidence review.
3. Record metrics summary, anomalies, interventions, and authority handoffs.
4. Choose exactly one disposition:
   - Advance to Wave 1 planning
   - Repeat Wave 0 live
   - Return to preparation / no-go
5. Record whether Wave 1 planning is permitted in the closed decision record.
6. If the decision record marks `Postmortem required: yes`, complete a postmortem using `ops/wave0-postmortem-template.md` before any Wave 1 launch.

## Non-Negotiable Rules

- Do not treat rehearsal evidence as live evidence.
- Do not alter launch artifacts after GO without freezing the wave and re-authorizing.
- Do not add real M0a packets into the Wave 0 live window.
- Do not attempt live graph repair in Wave 0.
