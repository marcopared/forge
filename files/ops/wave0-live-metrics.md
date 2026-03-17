# Wave 0 Live Metrics

## Purpose

Define the narrow live metric set and launch gates for the Wave 0 synthetic-only
launch. These metrics govern continuation, pause, abort, and closeout decisions.

## Metric Definitions and Targets

| Metric | Definition | Target or threshold | Gate relevance |
|---|---|---|---|
| Packet outcome | Terminal state for `WAVE0-SYNTHETIC` | Success required for GO-to-close success path | Continuation, closeout |
| Validator status | PASS / FAIL / ERROR for expected validators | No `ERROR`; blocking validators must PASS | Pause, abort |
| Evidence completeness | Required live evidence fields present and complete | `1.0` / 100% before success declaration | Pause, closeout |
| Policy decisions | Observed ALLOW / DENY / ESCALATE pattern | Happy path should remain ALLOW-only | Pause, freeze, abort |
| Runtime health | Health of runtime, worktree, tool broker, policy engine | No critical runtime fault in flight | Continuation, pause |
| Operator decision latency | Time from blocking decision need to recorded operator or authority action | Target: <= 5 minutes; warn at > 3 minutes | Pause, post-run review |
| Escalation-clearance time | Time from escalation opening to explicit disposition or safe resume | Target: <= 15 minutes; freeze review at > 15 minutes | Pause, freeze, post-run review |
| Audit trail growth | Continuous logging for every tool action and stateful decision | No gaps; audit count should increase monotonically during execution | Abort, closeout |
| Operator intervention burden | Count and severity of manual interventions | Low and explainable; 0 preferred, 1 tolerable if narrow | Repeat-Wave-0, return-to-preparation |
| Benchmark smoke visibility | Ability to observe `wave0-live-smoke` expectations live | Must remain visible throughout execution | GO, pause |
| Repair-loop count | Number of live repair attempts on the packet | 0 preferred; 1 narrowly scoped maximum; 2 is failure | Abort, disposition |
| Speculative marker | Whether any speculative execution signal appears | Must remain `false` | Freeze, abort |
| Security alerts | Security or policy-sensitive anomaly count | 0 tolerated in success path | Freeze, abort |
| Metrics anomalies | Missing, contradictory, or delayed live metrics | 0 blocking anomalies in success path | Pause, post-run review |

## Continuation Thresholds

Wave 0 may continue while in flight only if all are true:

- No critical runtime fault exists
- No policy anomaly exists
- No security alert exists
- Evidence path remains intact
- Speculative marker remains `false`
- Token usage remains below the hard ceiling
- Packet state transitions remain legal and ordered
- Benchmark smoke visibility remains available

## Pause Thresholds

Pause or freeze immediately if any of the following occurs:

- Validator `ERROR`
- Evidence completeness failure or missing required evidence field
- Unexpected DENY or ESCALATE not explained by a rehearsed scenario
- Runtime reprovisioning is required
- Operator loses visibility into packet state
- Operator decision latency exceeds 5 minutes for a blocking decision
- Escalation-clearance time exceeds 15 minutes
- Benchmark smoke visibility is lost
- Metrics become contradictory or materially stale

## Abort Thresholds

Abort the packet or wave if any of the following occurs:

- Token hard ceiling reached
- Manifest mismatch detected
- Policy bypass is suspected
- Audit gap detected
- Unsafe action on a protected path occurs
- Second major repair need appears on the synthetic packet
- Rollback is required after merge-back
- Evidence corruption cannot be repaired in place

## Closeout Review Metrics

The closeout decision must explicitly review:

- Evidence completeness result
- Validator success result
- Policy decision pattern
- Runtime health incidents
- Operator intervention burden
- Audit trail continuity
- Benchmark smoke result
- Operator decision latency
- Escalation-clearance time
- Repair-loop count
- Any metrics anomalies

## Success Interpretation

Wave 0 live metrics support success only when:

- Evidence completeness is 100%
- All blocking validators PASS without `ERROR`
- Policy decisions remain trustworthy
- Runtime remains stable enough to avoid freeze or abort
- Operator intervention burden remains low and explainable
- Audit trail remains complete
- Smoke visibility remains intact
- Decision latency and escalation-clearance targets are met or any breach is clearly minor and documented without affecting trust
