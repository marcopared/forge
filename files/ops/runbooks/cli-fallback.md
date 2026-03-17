# CLI Fallback Runbook

## Purpose

Use CLI control when the richer control surface is unavailable, degraded, or insufficiently trustworthy.
For early waves, CLI is the required control path, not merely a backup convenience.

## When To Use CLI Fallback

Use CLI fallback when any of the following is true:
- the primary UI/control plane is degraded or unavailable
- the operator needs an authoritative packet status or evidence view
- an escalation must be handled through the documented control path
- pause, freeze, resume, or rollback actions must be taken immediately
- readiness review requires confirming command-level behavior

If CLI itself is unavailable, pause or freeze operations because the required control surface is gone.

## Core Command Categories

The design stack requires operational coverage for these command categories:
- launch a packet
- inspect packet status
- inspect evidence
- inspect escalation queue
- pause a packet or wave
- resume after an authorized pause
- freeze the wave when governance intervention is required
- inspect metrics
- record launch/operator notes
- inspect validator output
- inspect policy decisions or audit trail
- trigger rollback or abort actions when authorized

## Operator Procedure

1. Confirm you are operating on the correct wave, packet ID, branch, and environment.
2. Verify no invalidating artifact drift occurred since the last approved readiness check.
3. Use CLI to inspect current packet state before issuing control actions.
4. If handling an escalation, consult the escalation matrix before approving resume.
5. After each control action, immediately re-check packet status, evidence status, and escalation state.
6. Record the command category used, decision made, and resulting state transition in the operator log.

## Canonical CLI Workflow By Situation

### Launch a packet
1. Confirm prerequisites and readiness checklist items are complete.
2. Launch only the approved packet for the active wave.
3. Confirm the packet enters the expected first active state.
4. Start monitoring validator status, audit growth, policy decisions, and evidence completeness.

### Inspect a running packet
1. Check packet state transitions.
2. Check validator start/finish state.
3. Check runtime health and token usage.
4. Check escalation queue.
5. Check merge-back state if the packet is nearing completion.

### Inspect evidence
1. Pull the evidence summary and full evidence bundle.
2. Verify diff, validator outputs, completeness status, audit trail, context pack manifest, worktree identity, and cost summary.
3. For Wave 0, verify speculative-start marker is `false`.
4. For Wave 1, verify the packet is ready for human review only after deterministic validators pass.

### Handle an escalation
1. Pull the escalation details.
2. Classify the trigger category.
3. Apply the escalation matrix.
4. Decide pause, freeze, abort, or deny/allow as documented.
5. Do not resume until the required re-entry evidence exists.

### Pause or freeze
1. Confirm the reason meets the documented threshold.
2. Apply pause when recovery may be possible.
3. Apply freeze when governance intervention is required or platform trust is in doubt.
4. Record the exact trigger, authority, and conditions to resume.

### Resume
1. Confirm the issue was classified.
2. Confirm corrective action is recorded.
3. Confirm affected services, validators, or policy paths were revalidated.
4. Confirm no invalidating artifact drift occurred.
5. Record explicit authorization by the operator or launch authority.

## Wave-Specific Notes

### Wave 0
- Activate `WAVE0-SYNTHETIC` only.
- No graph repair during live execution.
- Any policy anomaly, evidence anomaly, or audit gap is grounds for pause or freeze.
- CLI evidence inspection is part of the success condition.

### Wave 1
- Launch packets serially, one at a time.
- Human review remains the blocking gate after deterministic validators pass.
- Use CLI to capture per-packet launch time, completion time, repair loop count, evidence completeness, and merge decision.
- Any unexpected `ESCALATE` is a red flag and may require wave pause.

## CLI Fallback Readiness Check

The fallback path is considered operational only if the operator can use CLI to:
- launch the approved packet
- inspect packet status
- inspect validator results
- inspect evidence completeness
- inspect policy decisions and audit trail
- inspect escalation queue
- pause or freeze execution
- resume after explicit authorization
- inspect metrics
- record the resulting operator decision

## Exit Conditions

Exit CLI fallback mode when either:
- the required operation is complete and system control remains trustworthy, or
- control path trust is insufficient and the packet or wave has been paused, frozen, aborted, or rolled back
