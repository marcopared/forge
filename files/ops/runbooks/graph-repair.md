# Graph Repair Runbook

## Purpose

Handle structural defects in packet decomposition, prerequisites, or scope.
Graph repair changes the execution plan. It is not an ordinary retry loop.

## When Graph Repair Is Appropriate

Use graph repair only when the problem is structural rather than packet-local.
Typical triggers:
- hidden dependency or missing prerequisite packet
- packet scope cannot satisfy the approved completion contract
- packet must be split, inserted, reclassified, or revised to match the approved design
- repeated packet failures reveal a graph defect rather than an implementation defect
- architecture ambiguity makes the packet impossible to complete safely under the current manifest

## When Graph Repair Is Not Appropriate

Do not use graph repair for:
- ordinary lint, compile, or test failures that fit the current packet scope
- prompt wording issues that can be corrected without changing manifests
- operator impatience with a slow but coherent packet
- Wave 0 live execution

Live Wave 0 graph repair is not allowed. Discovery of a graph defect during live Wave 0 means freeze and return to preparation.

## Allowed Repair Actions

The repair taxonomy in the design stack allows these action types:
- split
- insert
- reclassify
- revise

## Immediate Actions

1. Pause the affected packet.
2. Stop launching downstream dependent packets.
3. Preserve failure evidence, manifest version, and dependency context.
4. Record the suspected graph defect and affected packet IDs.
5. Determine whether the issue invalidates the current wave plan.

## Decision Flow

### Step 1: Confirm it is structural
Confirm at least one of the following is true:
- the packet cannot satisfy its completion contract within declared scope
- prerequisites are incomplete or wrong for the real dependency chain
- packet boundaries do not match the approved architecture
- downstream packet viability depends on changing this packet structure

### Step 2: Determine blast radius
Identify:
- affected packet IDs
- downstream packets that would be invalidated
- whether current evidence bundles remain usable
- whether wave readiness must be rechecked after the repair

### Step 3: Choose the repair action
- `split`: one packet is too large or mixes concerns
- `insert`: a missing dependency packet is required before the failing packet can succeed
- `reclassify`: packet class or review/activation posture is wrong
- `revise`: scope, completion contract, or prerequisites need controlled revision

### Step 4: Freeze or continue
- Freeze the wave when trust in the current wave plan is compromised.
- Continue only if the repair is narrow, approved, and does not invalidate current readiness assumptions.
- For Wave 1, graph repair is abnormal and should trigger pause and investigation before any additional launches.

## Required Proposal Contents

Any graph-repair proposal should capture:
- defect description
- proposed action type
- affected packets
- downstream impact
- reason the current graph is insufficient
- why ordinary packet repair is not enough
- operator decision and approval status

## Wave-Specific Handling

### Wave 0
- Do not perform live graph repair.
- Freeze the wave and return to preparation.
- Treat the discovery as a launch failure or readiness failure.

### Wave 1
- Pause the active packet immediately.
- Do not continue serial launches until the defect is resolved.
- If multiple packets reveal the same ambiguity, resolve it at the spec level before continuing.
- Recommended default: zero graph repairs in Wave 1.

## Readiness Impact

Graph repair can invalidate previously verified readiness if it changes any of the following:
- packet manifests
- validator/evidence/review references
- wave manifest content
- policy assumptions tied to scope or packet class
- dependency integrity for the instantiated set

If any of those changed, re-run readiness checks before resuming the wave.

## Exit Conditions

Exit this runbook only when one of the following is true:
- repair proposal is approved and manifests/checks are updated
- the wave is frozen pending architecture or spec resolution
- the packet is rejected and removed from the active launch path
