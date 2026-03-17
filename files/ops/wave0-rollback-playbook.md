# Wave 0 Rollback Playbook

## Purpose

Define exact Wave 0 live control actions for pause, freeze, abort, and rollback.
Wave 0 is synthetic-only, so rollback focuses on preserving forensics and
reverting untrustworthy synthetic merge-back rather than recovering product state.

## Definitions

### Pause

Temporary stop for a potentially recoverable issue. Packet state is preserved.
Use when additional inspection or short recovery work may allow safe resume.

### Freeze

Governance stop for the wave. No new launches, no merge approvals, and no resume
until named authority clears the freeze.

### Abort

Terminal stop for the active packet. Preserve evidence, do not auto-retry, and
mark the launch unsuccessful.

### Rollback

Revert already merged synthetic live output and quarantine live execution state
when merge-back or resulting state cannot be trusted.

## Exact Triggers

### Pause triggers

- Transient runtime instability
- Ambiguous validator `ERROR` under investigation
- Temporary evidence collection anomaly
- Operator needs inspection before the next state transition
- CLI fallback degraded but recoverable quickly

### Freeze triggers

- Policy engine anomaly
- Security alert
- Evidence pipeline anomaly
- Unexplained live vs rehearsal divergence
- Operator loss of situational awareness
- Authority handoff required
- Graph inconsistency discovered in live Wave 0

### Abort triggers

- Manifest mismatch at runtime
- Token hard ceiling reached
- Protected-path or unsafe action attempt indicating contract breach
- Audit trail gap
- Unrecoverable evidence corruption
- Repeated unsafe policy interaction
- Worktree corruption requiring fresh packet start
- Second major repair need on the synthetic packet

### Rollback triggers

- Synthetic merge-back is untrustworthy
- Merged state requires revert to restore trusted baseline
- Post-merge evidence reveals integrity failure that invalidates success
- Authority explicitly orders revert after abort or freeze review

## Revert Steps

Apply only if merge-back already occurred.

1. Freeze the wave and block all new launches.
2. Record rollback authorization in `ops/wave0-decision-record.md`.
3. Preserve and archive the live evidence bundle, audit trail, metrics snapshot, and intervention log.
4. Revert the synthetic merge from the phase branch using the approved operator path.
5. Verify the revert restores the pre-launch trusted baseline.
6. Quarantine or remove the live synthetic worktree or branch from active use.
7. Record exact revert reason, affected artifacts, and resulting branch state.
8. Mark Wave 0 unsuccessful and move to disposition.

## Post-Rollback Disposition Rules

Choose exactly one disposition after rollback review.

### Repeat Wave 0 live

Allowed only if all are true:

- Root cause is packet-local or operationally narrow
- Policy integrity remains trusted
- Evidence integrity remains trusted after forensic review
- Launch artifacts can remain unchanged or can be re-approved cleanly
- Authority records why repeating Wave 0 is safer than returning to preparation

### Return to preparation

Required if any are true:

- Policy integrity is in doubt
- Evidence completeness behaved as non-blocking in practice
- Audit continuity is in doubt
- Graph inconsistency or structural contradiction was discovered
- Artifact immutability or version control failed
- Authority cannot explain the merged-state failure confidently

## Re-Entry After Pause

Resume after pause only if:

- Issue is classified
- Corrective action is completed
- Affected service or path is revalidated
- No invalidating artifact drift occurred
- Decision record is updated
- Primary or Acting Launch Authority explicitly authorizes resume

## Rules Specific to Wave 0

- No live graph repair.
- No widening of scope to rescue the synthetic packet.
- No blending of rehearsal evidence into rollback justification.
- If rollback occurs, Wave 0 does not count as successful.
