# Wave 0 Live GO / NO-GO Checklist

## Purpose

Use this checklist for the Phase 8 launch decision for live Wave 0 only.
A GO is allowed only when every blocking criterion is satisfied and recorded in
`ops/wave0-decision-record.md`.

## Authority

- Primary Launch Authority:
- Acting Launch Authority:
- Launch authority fallback rule:
- Fallback authority activation trigger:
- Runtime readiness signoff:
- Validation / evidence readiness signoff:
- Security / policy readiness signoff:
- Operator on duty:
- Witness or secondary reviewer:

## Artifact Version References

Record the approved version or hash for each live-launch artifact before GO.

- `packets/waves/wave0-live.yaml`:
- `packets/manifests/WAVE0-SYNTHETIC.yaml`:
- `packets/validator-manifests/foundation.yaml`:
- `packets/evidence-manifests/standard.yaml`:
- `packets/review-manifests/human-required.yaml`:
- `benchmarks/manifests/wave0-live-smoke.yaml`:
- `ops/wave0-launch-protocol.md`:
- `ops/wave0-escalation-matrix.md`:
- `ops/wave0-rollback-playbook.md`:
- Active policy files reviewed:
  - `harness/policies/blessed-stack.yaml`:
  - `harness/policies/protected-paths.yaml`:
  - `harness/policies/shell-allowlist.yaml`:
  - `harness/policies/token-budgets.yaml`:

## Blocking Criteria

### Authority and governance

- [ ] Primary Launch Authority named
- [ ] Acting Launch Authority named
- [ ] Launch authority fallback rule understood and accepted
- [ ] Launch decision record opened before any live activation
- [ ] Launch authority and fallback authority are both available for the launch window
- [ ] Authority agrees that Wave 0 live is synthetic-only and not product-building work

### Artifact integrity and immutability

- [ ] Approved live artifact versions or hashes are recorded above
- [ ] Artifact immutability since last verification is confirmed
- [ ] No invalidating artifact drift occurred since readiness verification
- [ ] Rehearsal and live namespaces are cleanly separated
- [ ] Live manifest is clearly distinct from `packets/waves/wave0-dry-run.yaml`

### Live readiness

- [ ] Live infrastructure health verified
- [ ] CLI fallback operational for launch, status, metrics, evidence inspection, pause or freeze, resume, and rollback
- [ ] Live policy smoke passes
- [ ] At least one escalation path was rehearsed successfully
- [ ] Metrics visibility available
- [ ] Evidence capture path verified in live mode
- [ ] Launch-day rollback playbook present and reviewed
- [ ] Escalation matrix reviewed with the operator on duty

### Packet and validation posture

- [ ] `WAVE0-SYNTHETIC` is the only live packet in scope
- [ ] Wave 0 live remains serial with `concurrency_cap: 1`
- [ ] Launch mode remains operator-launched
- [ ] Review mode is human-required
- [ ] Speculative execution remains false
- [ ] Manifest validation results were re-run after the last blocking artifact change
- [ ] Validator, evidence, and review manifests are present, approved, and match the loaded references
- [ ] Live smoke watchlist is reviewed and understood as the live success gate

### Readiness carry-forward

- [ ] Latest successful rehearsal evidence reviewed
- [ ] Rehearsal notes reviewed
- [ ] No unresolved Phase 7 blocking readiness gap remains
- [ ] Operator can explain pause, freeze, abort, and rollback actions without improvisation
- [ ] Operator can distinguish rehearsal evidence from live evidence during closeout

## Advisory Criteria

These do not block GO by themselves, but unresolved items must be recorded.

- [ ] Token budget recalibration for post-Wave-0 work is noted if still provisional
- [ ] Wave 1 observation cadence is pre-decided at least provisionally
- [ ] First-failure response posture for Wave 1 is noted
- [ ] Non-Wave-0 runbooks are sufficiently mature for immediate follow-up planning
- [ ] Template calibration gaps outside the Wave 0 live path are understood

## GO / NO-GO Signoff

- Decision: `GO` / `NO-GO`
- Decision date:
- Decision time:
- Environment verified:
- Blocking items incomplete, if any:
- Advisory gaps accepted, if any:
- Re-verification required before another decision? `yes` / `no`
- Primary Launch Authority signature:
- Acting Launch Authority acknowledgment:
- Operator acknowledgment:
- Notes:

## Rule

If any blocking item is false, the decision is NO-GO.
