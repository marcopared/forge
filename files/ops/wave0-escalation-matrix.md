# Wave 0 Escalation Matrix

## Purpose

Define Wave 0 live escalation categories, owners, auto-pause or freeze behavior,
resume evidence requirements, logging requirements, and authority handling.
Wave 0 uses the stricter live interpretation of the general escalation posture.

## Authority Handling

- Primary Launch Authority owns final pause, resume, abort, freeze, and rollback decisions.
- Acting Launch Authority may assume control only after explicit acceptance is recorded.
- If authority transfer is required mid-run, auto-pause applies until handoff is documented.
- No silent substitution is allowed.

## Matrix

| Category | Typical triggers | Owner(s) | Automatic action | Resume evidence requirements | Logging requirements |
|---|---|---|---|---|---|
| Validator disagreement or `ERROR` | Missing validator completion, contradictory outcomes, validator crash | Operator, Primary Launch Authority | Auto-pause | Cause classification, successful rerun or authoritative disposition, proof evidence bundle remains intact | Record validator name, packet state, time detected, decision, rerun result |
| Evidence incompleteness | Missing required fields, missing audit entries, incomplete context-pack record | Operator | Auto-pause | Evidence completeness passes, missing fields explained, audit continuity confirmed | Record missing field set, completeness status, correction path, authority if resume approved |
| Policy engine anomaly | Unexpected ALLOW, DENY, or ESCALATE; inconsistent policy service behavior | Operator, Primary Launch Authority | Immediate freeze | Live policy smoke passes, root-cause note, audit continuity confirmed | Record policy event, expected vs actual behavior, freeze timestamp, authority decision |
| Unsafe action attempt | Protected-path write attempt, out-of-scope write, unsafe tool use | Operator, Primary Launch Authority | Immediate pause; often abort | Attempt classified, packet resumability explicitly decided, approval if resume is allowed | Record attempted action, target path or tool, policy outcome, disposition |
| Security alert | Security-sensitive anomaly or policy-sensitive issue | Operator, Primary Launch Authority | Immediate freeze | Issue explicitly closed or waived by authority; otherwise abort | Record alert source, severity, investigation status, final disposition |
| Graph inconsistency | Hidden dependency, structural contradiction, wrong packet boundary | Operator, Primary Launch Authority | Freeze and return-to-preparation unless disproven immediately | For Wave 0, expected disposition is no resume; if disproven, record evidence and authority approval | Record contradiction, source artifact, downstream risk assessment, disposition |
| Manifest inconsistency | Loaded manifest differs from approved version or hash | Operator, Primary Launch Authority | Immediate abort unless hash match is restored before execution proceeds | Approved hash or version match confirmed; otherwise no resume | Record expected hash, observed hash, detection time, abort or freeze decision |
| Runtime instability | Worktree corruption, runtime crash, infra degradation | Operator | Auto-pause | Runtime health restored, worktree integrity restored, no evidence corruption | Record failing component, duration, recovery steps, authority if resume approved |
| Benchmark smoke regression | Smoke expectation fails or becomes ambiguous | Operator | Auto-pause | Smoke result rerun or explained with trusted evidence | Record failed expectation, validator context, rerun outcome, final judgment |
| Operator overload or loss of visibility | Operator cannot explain current state, handoff required, monitoring blind spot | Primary or Acting Launch Authority | Auto-pause | Handoff complete, visibility restored, authority accepted in launch log | Record visibility gap, handoff trigger, acceptance time, resume decision |
| CLI fallback unavailable | Required CLI control path degraded or unavailable | Operator, Primary Launch Authority | Pause or freeze depending on duration and blast radius | CLI control path restored and tested successfully | Record degraded commands, duration, interim controls, restoration evidence |

## Resume Rules

Resume is allowed only when all of the following are true:

- Issue classification is complete
- Corrective action is recorded
- Required evidence above exists
- No invalidating artifact drift occurred
- Launch decision record is updated
- Primary or Acting Launch Authority explicitly authorizes resume

## Post-Escalation Logging Minimum

For every escalation, record:

- Date and time
- Wave and packet ID
- Category and severity
- Trigger description
- Automatic action taken
- Owner notified
- Authority decision
- Resume evidence reviewed
- Final disposition

## Wave 0 Strictness Rules

- Any graph inconsistency is presumed launch-failing until proven otherwise.
- Any audit gap, evidence corruption, or policy anomaly is a platform-trust issue, not a minor defect.
- Any authority handoff must be explicit and logged before resume.
