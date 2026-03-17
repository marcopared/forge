# Wave 1 Launch Runbook

## Launch Prerequisites

Before launching any Wave 1 packet:

- [ ] Wave 0 completed successfully (all success criteria met)
- [ ] Wave 0 post-launch review completed and documented
- [ ] Token budgets reviewed against Wave 0 data, with any adjustments handled under operator policy
- [ ] Wave 1 manifest (wave1-m0a-contracts.yaml) committed and validated
- [ ] All five packet manifests (F-M0-003 through F-M0-007) committed and pass schema validation
- [ ] Manifest validation tooling passes all checks (schema, dependencies, references, scope)
- [ ] Foundation-contracts context profile (foundation-contracts.yaml) validated
- [ ] Packet registry updated with F-M0-003 through F-M0-007 as "instantiated"
- [ ] Architecture specification docs are accessible for context pack assembly
- [ ] CLI fallback operational (all commands defined in the design stack)
- [ ] Live infrastructure health verified for the components required by the approved architecture
- [ ] No invalidating artifact drift since Wave 0 completion
- [ ] Operator has reviewed all five packet manifests against the approved architecture design
- [ ] Wave 1 progression checklist opened

## Launch Order

Execute packets in this order. Each packet must be MERGED before the next starts.

### Packet 1: F-M0-003 (Shared Domain Object Types)

**Pre-launch checks:**
- [ ] packages/shared/tsconfig.json exists
- [ ] packages/shared/package.json exists
- [ ] Context profile includes architecture domain model sections

**Launch:**
1. `forge launch F-M0-003`
2. Monitor execution: `forge status F-M0-003`
3. Watch for: compilation errors, scope drift, unexpected tool calls
4. When execution completes, inspect evidence: `forge evidence F-M0-003`
5. Review the packet output against the approved architecture domain model
6. Apply human review checklist (`ops/checklists/wave1-human-review.md`)
7. If approved: allow merge-back
8. If rejected: document issues, allow repair or re-scope

**Between-packet checks:**
- [ ] F-M0-003 is MERGED
- [ ] Cross-task validation passed (if applicable)
- [ ] Evidence bundle is complete
- [ ] No unresolved escalations
- [ ] Token consumption within budget
- [ ] Operator confidence: "I understand what these types define and why they are correct"

### Packet 2: F-M0-004 (Cross-Subsystem Contract Interfaces)

**Pre-launch checks:**
- [ ] F-M0-003 is MERGED
- [ ] Domain types file exists and compiles
- [ ] Context profile includes domain types from F-M0-003

**Launch:** Same procedure as F-M0-003. Additionally:
- Cross-reference contracts against ALL subsystem interface specs in the approved architecture
- Verify contracts import only from the domain types

### Packet 3: F-M0-005 (Event Taxonomy Types)

**Pre-launch checks:**
- [ ] F-M0-003 is MERGED
- [ ] Domain types file exists

**Launch:** Same procedure. Additionally:
- Verify event types cover all event categories in the approved architecture
- Verify discriminated union structure

### Packet 4: F-M0-006 (Action Class Taxonomy + Tool I/O Types)

**Pre-launch checks:**
- [ ] F-M0-003 is MERGED
- [ ] Domain types file exists

**Launch:** Same procedure. Additionally:
- Verify exactly six action classes match the approved security design
- Verify per-tool I/O types are specific, not generic

### Packet 5: F-M0-007 (Evidence Schema + Retention Tier Model)

**Pre-launch checks:**
- [ ] F-M0-003 is MERGED
- [ ] Domain types file exists

**Launch:** Same procedure. Additionally:
- Verify retention tier model matches the approved architecture design
- Verify evidence bundle types support all items in standard evidence manifest

## When to Pause

Pause Wave 1 if any of the following occur:
- Pipeline failure (validator crashes, evidence capture failure, runtime instability)
- Security alert
- Unexpected policy ESCALATE
- Evidence incompleteness that the completeness validator did not catch
- Repeated repair loops on the same packet without convergence
- Agent produces output that suggests it does not understand the specification (not a fixable error — a fundamental misalignment)

## When to Abort

Abort Wave 1 and return to preparation if:
- Pipeline-level failure that Wave 0 did not surface (indicates inadequate Wave 0 coverage)
- Multiple packets require graph repair (indicates M0a decomposition is wrong)
- Architecture specification ambiguity discovered that requires architecture-level resolution

## When to Repair the Graph

Graph repair during Wave 1 is abnormal and should trigger pause and investigation. If needed:
- A single packet needs scope expansion → update manifest, re-validate, re-launch
- Two packets have hidden coupling → consider merging or inserting a dependency
- Architecture spec gap discovered → pause, resolve at spec level, then resume
- Always follow the graph repair runbook

## When Wave 1 Is Considered Complete

Wave 1 is complete when:
- [ ] All five packets are MERGED on the phase branch
- [ ] All evidence bundles are complete
- [ ] No unresolved escalations
- [ ] First-pass success rate recorded
- [ ] Total repair loop count recorded
- [ ] Operator has written a Wave 1 completion note documenting: what went well, what was surprising, and any constraints on post-Wave-1 progression
- [ ] Wave 1 progression checklist is fully completed

## What Gets Recorded in the Launch Record

- Launch date/time
- Operator on duty
- Per-packet: launch time, completion time, first-pass success (yes/no), repair loop count, evidence completeness, human review verdict, merge time
- Wave-level: total duration, first-pass success rate, total repair loops, graph repairs (if any), anomalies, operator notes
- Progression decision: authorize post-Wave-1 planning, repeat Wave 1, or return to preparation
