# Wave Readiness Checklist

## Purpose

Use this before declaring a wave ready for launch.
This checklist is broader than packet readiness and covers wave-level governance.

## Wave Definition

- [ ] Wave manifest exists and is approved
- [ ] Allowed packet set is explicit
- [ ] Excluded packet scope is explicit
- [ ] Concurrency cap is explicit
- [ ] Launch mode is explicit
- [ ] Review mode is explicit
- [ ] Freeze criteria are explicit
- [ ] Rollback criteria are explicit

## Artifact Set

- [ ] Every packet manifest in the wave exists and passes validation
- [ ] Validator manifests referenced by the wave packet set exist and are approved
- [ ] Evidence manifests referenced by the wave packet set exist and are approved
- [ ] Review manifests referenced by the wave packet set exist and are approved
- [ ] Context-pack profiles for the wave packet set are valid
- [ ] Packet registry is updated for the current wave packet set

## Operational Controls

- [ ] CLI fallback is operational for launch, status, evidence, escalations, pause/freeze, resume, and metrics
- [ ] Escalation matrix exists and matches current wave triggers
- [ ] Operator daily loop exists and is understood
- [ ] Required runbooks exist for expected failure modes
- [ ] Metrics visibility exists for packet state, validators, evidence, policy, audit, and escalations

## Readiness Evidence

- [ ] Readiness review date is recorded
- [ ] No invalidating artifact drift occurred since readiness review
- [ ] Rehearsal or prior-wave evidence required by this wave has been reviewed
- [ ] At least one escalation path has been tested before live launch
- [ ] Rollback or abort path has been reviewed

## Wave 0 Checks

- [ ] Wave contains only `WAVE0-SYNTHETIC`
- [ ] Concurrency cap is 1
- [ ] Review mode is human-required
- [ ] Speculative execution is disabled
- [ ] Live and rehearsal namespaces are separated

## Wave 1 Checks

- [ ] Wave contains only F-M0-003 through F-M0-007
- [ ] Execution is serial with concurrency cap 1
- [ ] Human review is blocking for every packet
- [ ] No speculative execution is allowed
- [ ] Graph repair is treated as abnormal and pause-worthy
- [ ] Wave 0 success is recorded as the pre-wave gate

## Launch Decision

- [ ] Wave is ready for GO
- [ ] Launch authority records GO or NO-GO explicitly
