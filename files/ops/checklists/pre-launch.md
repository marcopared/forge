# Pre-Launch Checklist

## Purpose

Use this checklist before live Wave 0 launch and again before Wave 1 launch.
Blocking items must be true before GO.

## Common Blocking Checks

- [ ] Primary operator or launch authority is identified
- [ ] Acting authority or handoff path is identified
- [ ] Launch decision record is opened
- [ ] Approved manifests are the versions loaded for execution
- [ ] No invalidating artifact drift occurred since readiness verification
- [ ] Manifest validation tooling is operational
- [ ] Required validator, evidence, and review manifests exist and are approved
- [ ] Policy files are loaded and active
- [ ] Policy smoke checks for expected ALLOW / DENY / ESCALATE behavior pass
- [ ] CLI fallback is operational
- [ ] Live infrastructure health is verified
- [ ] Metrics visibility is available for packet state, validators, evidence, policy, audit trail, and escalations
- [ ] Rollback or abort procedure is available
- [ ] Rehearsal evidence and notes are available for reference

## Wave 0 Blocking Checks

- [ ] `WAVE0-SYNTHETIC` manifest is approved
- [ ] `packets/waves/wave0-live.yaml` is approved as the live-only Wave 0 control artifact
- [ ] Rehearsal and live namespaces are cleanly separated
- [ ] Latest successful rehearsal evidence was reviewed
- [ ] At least one escalation path was rehearsed successfully
- [ ] `benchmarks/manifests/wave0-live-smoke.yaml` is present and understood as the live watchlist
- [ ] Operator understands Wave 0 is synthetic-only, serial, human-reviewed, and non-speculative

## Wave 1 Blocking Checks

- [ ] Wave 0 decision record is closed
- [ ] Wave 0 final disposition is `Advance to Wave 1 planning`
- [ ] `Wave 1 planning permitted: yes` is recorded in the Wave 0 decision record
- [ ] If Wave 0 required a postmortem, it is completed
- [ ] Wave 1 manifest is approved and validated
- [ ] F-M0-003 through F-M0-007 manifests are approved and validated
- [ ] Packet registry is updated for the Wave 1 packet set
- [ ] Token budgets were reviewed against Wave 0 observations
- [ ] Operator reviewed all five packet manifests against the approved architecture design
- [ ] Wave 1 progression checklist is opened
- [ ] Human-review path is ready for every packet

## GO / NO-GO Gate

A GO is allowed only if every relevant blocking item above is true.
If any blocking item is false, the decision is NO-GO.
