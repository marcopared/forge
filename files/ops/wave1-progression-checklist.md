# Wave 1 Progression Checklist

## Pre-Launch Checks

- [ ] Wave 0 completed successfully across packet, wave, launch-process, and platform-trust success levels
- [ ] Wave 0 post-launch review is documented in the closed `ops/wave0-decision-record.md`
- [ ] Wave 0 final disposition is `Advance to Wave 1 planning`
- [ ] `Wave 1 planning permitted: yes` is recorded in the closed Wave 0 decision record
- [ ] If Wave 0 marked `Postmortem required: yes`, the postmortem is completed before Wave 1 launch
- [ ] No unresolved Wave 0 escalation, security alert, evidence-integrity doubt, policy-trust doubt, or audit-continuity doubt remains
- [ ] Token budgets reviewed against Wave 0 data
- [ ] Wave 1 manifest committed and validated
- [ ] All five packet manifests committed and pass validation
- [ ] Context profile validated
- [ ] Packet registry updated
- [ ] Live infrastructure healthy
- [ ] CLI fallback operational
- [ ] No artifact drift since Wave 0

## Per-Packet Checks (repeat for each of F-M0-003 through F-M0-007)

### F-M0-003
- [ ] Prerequisites verified (tsconfig and package manifest exist)
- [ ] Packet launched by operator
- [ ] Execution completed without pipeline error
- [ ] All deterministic validators passed
- [ ] If agent review ran, findings are noted
- [ ] Human review completed — verdict: APPROVED / REJECTED
- [ ] If rejected: repair or re-scope completed, re-validated, re-reviewed
- [ ] Evidence bundle complete
- [ ] Merge-back successful
- [ ] Cross-task validation passed (if applicable)
- [ ] Token consumption recorded and within budget
- [ ] Operator notes recorded

### F-M0-004
- [ ] Prerequisites verified (F-M0-003 MERGED)
- [ ] (same checks as above)

### F-M0-005
- [ ] Prerequisites verified (F-M0-003 MERGED, tsconfig exists)
- [ ] (same checks as above)

### F-M0-006
- [ ] Prerequisites verified (F-M0-003 MERGED)
- [ ] (same checks as above)

### F-M0-007
- [ ] Prerequisites verified (F-M0-003 MERGED)
- [ ] (same checks as above)

## Wave-Completion Checks

- [ ] All five packets MERGED on phase branch
- [ ] Evidence completeness = 100%
- [ ] No unresolved escalations
- [ ] No unresolved security alerts
- [ ] All validator manifests functioned correctly
- [ ] All evidence manifests captured all required items
- [ ] First-pass success rate recorded: ___
- [ ] Total repair loops recorded: ___
- [ ] Graph repairs recorded: ___

## Escalation Checks

- [ ] Were any escalations triggered? If yes, each escalation is classified, resolved, and documented in the launch record.
- [ ] No escalation indicates a systemic issue requiring wave pause.

## Evidence Checks

- [ ] Every packet has a complete evidence bundle
- [ ] Audit trails are complete for all five packets
- [ ] Context pack manifests recorded for all five packets
- [ ] Confidence scores computed for all five packets
- [ ] Cost summaries recorded for all five packets

## Validator Checks

- [ ] Every expected validator ran for every packet
- [ ] No validator ERROR (distinct from FAIL)
- [ ] Validator results are consistent (no validator produced contradictory results across packets)

## Documentation and Harness Freshness

- [ ] Packet registry updated (all five packets marked `merged` or `completed` consistently)
- [ ] Token budgets still appropriate based on observed consumption
- [ ] Policy files unchanged during Wave 1 execution
- [ ] Validator manifests unchanged during Wave 1 execution

## Criteria for Post-Wave-1 Progression

All of the following must be true to authorize post-Wave-1 planning:

- [ ] All wave-completion checks above are true
- [ ] Operator writes a Wave 1 completion assessment answering:
- [ ] Are the M0a contracts stable enough that M0b and first M1 packets can safely depend on them?
- [ ] Were there any type shape issues that might require revision when real implementation starts?
- [ ] Did the agent produce types that faithfully represent the approved architecture, or did the human reviewer have to make significant corrections?
- [ ] Is the pipeline reliable enough for increased concurrency?
- [ ] Are the evidence and validator signals trustworthy?
- [ ] Operator explicitly records: AUTHORIZE POST-WAVE-1 PLANNING / REPEAT WAVE 1 / RETURN TO PREPARATION
