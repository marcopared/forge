# Escalation Matrix

## Purpose

Define trigger categories, owners, automatic control action, and evidence required before resume.
Use this for Wave 0 and Wave 1 unless a wave-specific runbook says the response must be stricter.

| Trigger category | Typical examples | Owner to notify | Automatic action | Resume evidence |
|---|---|---|---|---|
| Validator `ERROR` or validator disagreement | validator crash, contradictory results, missing validator completion | Operator, launch authority if live | Auto-pause | cause classification, successful rerun, evidence bundle still intact |
| Evidence incompleteness | missing required evidence fields, missing audit entries, incomplete context-pack record | Operator | Auto-pause | evidence completeness pass, explanation of missing fields, audit continuity confirmed |
| Policy engine anomaly | unexpected ALLOW / DENY / ESCALATE behavior, policy service inconsistency | Operator, launch authority | Immediate freeze | policy smoke pass, root-cause note, audit continuity confirmed |
| Unsafe action attempt | protected-path write attempt, unsafe tool action, contract breach | Operator, launch authority | Immediate pause; often abort | attempt classified, packet resumability decision, explicit approval if resume is allowed |
| Security alert | security-sensitive issue, policy-sensitive anomaly | Operator, launch authority | Immediate freeze | explicit close/waiver by authority, otherwise abort |
| Manifest inconsistency | loaded manifest hash differs from approved version, late manifest mismatch | Operator, launch authority | Immediate pause | approved hash match confirmed, or packet aborted |
| Graph inconsistency | hidden dependency, wrong packet boundary, structural contradiction | Operator, launch authority | Pause; Wave 0 freeze | graph-repair assessment, downstream impact review, readiness recheck if changed |
| Runtime instability | worktree corruption, runtime crash, infra degradation | Operator | Usually pause | runtime health restored, worktree integrity restored, no evidence corruption |
| Benchmark smoke regression | Wave 0 smoke expectations fail unexpectedly | Operator | Auto-pause | rerun or explained result with trusted evidence |
| Operator overload or loss of visibility | operator cannot explain current state, handoff required | Launch authority or acting authority | Auto-pause | handoff complete, visibility restored, authority acknowledged |
| Unexpected policy escalation in Wave 1 | contract packet triggers `ESCALATE` unexpectedly | Operator, launch authority as needed | Pause and assess; freeze if systemic | explanation of why escalation occurred, policy status trusted, packet remains in scope |

## Wave-Specific Rules

### Wave 0
- Any graph inconsistency means freeze and return to preparation.
- Any audit gap, evidence corruption, or policy anomaly is a trust failure, not a minor defect.
- Live execution should stay narrow enough that escalation handling remains simple and fully explainable.

### Wave 1
- Human review remains blocking even after the escalation is cleared.
- Repeated escalations across multiple packets suggest a systemic problem and should pause the wave.
- Graph repair is abnormal and should trigger pause and investigation before the next packet launch.

## Required Escalation Record

For every escalation, record:
- date/time
- wave
- packet ID
- trigger category
- severity
- automatic action taken
- owner notified
- operator decision
- resume evidence reviewed
- final disposition
