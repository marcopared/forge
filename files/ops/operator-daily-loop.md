# Operator Daily Loop

## Purpose

Define the disciplined operator loop for readiness review, live supervision, escalation handling, and closeout.
The operator governs the system. The operator does not manually execute packet work by hand.

## Daily Start

1. Review the active wave and packet state.
2. Review open escalations, pauses, freezes, and unresolved anomalies.
3. Confirm the control path is healthy: CLI fallback, metrics visibility, validator visibility, evidence visibility.
4. Confirm no invalidating artifact drift occurred since the last approved readiness point.
5. Confirm who holds authority today and whether a handoff note is required.

## If No Wave Is Live

1. Work the readiness set: manifests, runbooks, checklists, policy smoke checks, rehearsal notes.
2. Verify required artifacts for the next launch window are present and canonical.
3. Rehearse or review at least one failure path if readiness confidence is weak.
4. Update the launch decision record shell if a launch is approaching.

## If Wave 0 Is Live

1. Monitor only `WAVE0-SYNTHETIC`.
2. Watch state transitions, validator status, evidence completeness, policy decisions, audit growth, runtime health, token usage, and merge-back state.
3. Treat any unexplained divergence from rehearsal as pause-or-freeze worthy.
4. Inspect the final evidence bundle manually before declaring success.
5. Close the day with an explicit outcome: successful, repeat-required, or failed/return-to-preparation.

## If Wave 1 Is Live

1. Confirm only one Wave 1 packet is active at a time.
2. Before each launch, re-run the per-packet readiness view.
3. During execution, monitor validators, policy decisions, evidence completeness, repair-loop count, and token use.
4. After deterministic validators pass, perform or coordinate human review using the Wave 1 review checklist.
5. Record per-packet launch time, completion time, review verdict, repair loops, evidence completeness, and merge outcome.
6. Do not launch the next packet until the current packet is merged or formally rejected.

## Escalation Loop

When an escalation appears:
1. Classify the trigger.
2. Consult the escalation matrix.
3. Apply pause, freeze, abort, or deny/allow as documented.
4. Record the rationale and required resume evidence.
5. Do not resume until the evidence exists and authority is explicit.

## Review Loop

For any completed packet:
1. Inspect the evidence summary and full evidence bundle.
2. Verify validator outcomes, audit trail, policy decisions, diff, context pack manifest, and worktree identity.
3. For Wave 1, ensure human review is completed before merge approval.
4. Record approval, rejection, or revision decision with rationale.

## End-Of-Day Closeout

1. Freeze new launches if the day is ending mid-issue or mid-review.
2. Update launch record or operator log with the day’s state.
3. Record open escalations, paused packets, authority handoffs, and next required action.
4. Confirm another operator could understand the system state from the record without reconstructing context manually.

## Success Standard

A good operator day ends with:
- system state explainable from the records
- no unresolved ambiguity about authority
- no silent artifact drift
- no packet advanced without required evidence and review
