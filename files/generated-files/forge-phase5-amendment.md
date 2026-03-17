# Forge Phase 5 Amendment: Six Operational Corrections

**Version:** 5.0.1  
**Date:** March 13, 2026  
**Status:** Design Phase — Focused Amendment  
**Baseline:** forge-phase5-operationalization.md

---

# Amendment 1: Dependency-Class-Aware Activation Gating

## The Problem

The base document says a packet is eligible for activation only when "all prerequisite packets are MERGED." This is correct for interface-critical and policy-sensitive packets where merged-state stability is a correctness requirement. But as a universal rule, it collapses DAG parallelism into serialized merge cadence.

Consider: packet B depends on packet A, both are local implementation packets in the same workstream touching non-overlapping files. If A has passed all validators and is SUCCEEDED but is waiting for merge-back (which involves cross-task validation, possible conflict resolution, and merge queue ordering), B is artificially blocked from starting even though A's output is stable and the dependency is satisfied in substance.

## The Correction

Replace the single universal rule with dependency-class-aware activation gating:

| Dependency Class | Activation Gate | Rationale |
|---|---|---|
| **Type/interface dependency** (B imports types defined by A) | A must be **MERGED** | B compiles against A's exports. The exports must be on the phase branch so B's worktree picks them up at checkout. |
| **Data/schema dependency** (B reads from a table A defines) | A must be **MERGED** | Schema must be migrated on the phase branch before B can use it. |
| **Sequential implementation dependency** (B extends code A wrote, same subsystem) | A must be **SUCCEEDED** + **merge-back initiated** | B needs A's code in the worktree. If A is SUCCEEDED and merge-back is in progress (not yet confirmed clean), B can start speculatively on the assumption the merge will succeed. If merge-back fails (conflict), B is frozen. |
| **Loose ordering dependency** (B should run after A for logical sequencing, but B doesn't import A's output) | A must be **SUCCEEDED** | B doesn't need A's artifacts. The dependency is only ordering. A's validation pass is sufficient to unblock B. |
| **Validator dependency** (B's validator needs a tool that A implements) | A must be **MERGED** | The validator tool must be available on the phase branch for B's validation to run. |

### Default by Packet Class

| Packet Class | Default Dependency Gate |
|---|---|
| Foundation contracts (M0a) | MERGED (these define contracts everything imports) |
| Interface packets | MERGED (consumers compile against these) |
| Schema/event change packets | MERGED (schema must be migrated) |
| Integration packets | MERGED (both sides must be stable) |
| Local implementation packets | SUCCEEDED + merge-back initiated (speculative start allowed) |
| Documentation packets | SUCCEEDED (loose ordering) |
| Test/validator packets | MERGED for tool dependencies, SUCCEEDED for ordering |

### Speculative Start Rules

When a packet starts speculatively (on SUCCEEDED rather than MERGED):
- It branches its worktree from the current phase branch head (which may not include the prerequisite's code yet).
- If the prerequisite's merge-back completes cleanly before the speculative packet completes, no action needed — the speculative packet's merge-back will pick up the prerequisite's code.
- If the prerequisite's merge-back fails (conflict), the speculative packet is **frozen** until the conflict is resolved.
- If the speculative packet completes before the prerequisite merges, the speculative packet waits in SUCCEEDED until the prerequisite is MERGED before its own merge-back begins.

This preserves safety while recovering parallelism that the universal MERGED rule was suppressing.

---

# Amendment 2: Timeline Labeling

## The Correction

All wave duration estimates in the base document should be read as **optimistic design estimates, not rollout commitments.** Specifically:

| Wave | Base Estimate | Realistic Range | Notes |
|---|---|---|---|
| Wave 0 (dry run) | 1-2 days | 1-3 days | Low variance — this is pipeline testing, not agent work |
| Wave 1 (M0a contracts) | 3-5 days | 3-7 days | Revision cycles on foundational types are likely |
| Wave 2 (M0b + first M1) | 1-2 weeks | 1-3 weeks | Prisma schema and infra may need iteration |
| Wave 3 (M1 critical path) | 2-3 weeks | 3-5 weeks | **Most likely to absorb iteration.** Policy engine and state machine are architecture-bearing. Expect at least one interface revision cycle. |
| Wave 4 (M1 + M2) | 3-4 weeks | 4-6 weeks | **Second most likely to absorb iteration.** Agent runner prompt quality and validator pipeline correctness will require tuning. Integration packets surface real boundary issues. |
| Wave 5 (M3 + M4) | 3-4 weeks | 3-5 weeks | Lower risk if M1/M2 are stable. UI work is parallelizable. |

**Total realistic range: 14-22 weeks**, not 8-10. This aligns with the Phase 4 amendment's 12-14 week realistic estimate for the task graph, plus operational overhead for rollout staging, review cycles, and graph repair.

The operator should plan around the realistic range and treat the optimistic range as a bonus if it materializes.

---

# Amendment 3: M0b Activation Refinement

## The Problem

The base document makes all M0b scaffolding auto-activatable after M0a. Some M0b packets are genuinely low-risk (repo skeleton, Docker image, Redis connection). Others define durable shared infrastructure that downstream packets depend on (Prisma schema, BullMQ queue definitions). Treating both the same is slightly too aggressive.

## The Correction

Split M0b activation into two tiers:

| Tier | Packets | Activation |
|---|---|---|
| **M0b-auto** (low-risk scaffolding) | F-M0-001 (repo skeleton), F-M0-008 (infra connections), F-M0-009 (Docker image) | Auto-activatable. These are standard scaffolding with minimal downstream coupling. |
| **M0b-gated** (schema/infrastructure-defining) | F-M0-002 (Prisma schema), F-M0-010 (BullMQ setup) | Operator-launched for the first execution. If the first Prisma schema packet succeeds cleanly, subsequent schema amendments can be auto-activatable. |

The logic: Prisma schema defines the data model that every backend workstream depends on. BullMQ queue definitions establish the job dispatch model the orchestrator depends on. Getting these wrong silently cascades. The cost of operator launch (a few minutes of review) is negligible compared to the cost of a bad schema propagating.

After the first successful execution of each M0b-gated packet, the operator can reclassify future amendments to that category as auto-activatable.

---

# Amendment 4: Review Queue Weighting (Design Note)

## The Note

The base document uses review queue depth as an expansion gate (reduce concurrency if depth > 10). This is a reasonable Alpha heuristic but does not distinguish between a queue of 8 routine documentation packets and a queue of 3 critical-path escalations.

**For Alpha, raw queue depth is sufficient.** The operator is one person reviewing the queue directly and can prioritize by inspection. The priority ordering in Section 9 (escalations > graph repairs > security > integration > merge candidates > routine) handles triage.

**For post-Alpha, the queue depth metric should be replaced with weighted review load:**

```
weighted_load = sum(packet_risk_weight * blocking_impact * severity_multiplier)
```

Where:
- `packet_risk_weight`: 1 (low), 2 (medium), 4 (high), 8 (critical)
- `blocking_impact`: 1 (no downstream blocked), 2 (1-2 downstream), 4 (3+ downstream or critical path)
- `severity_multiplier`: 1 (routine), 2 (escalation), 4 (security/policy)

This is deferred from Alpha implementation but recorded as a known refinement.

---

# Amendment 5: CLI Fallback for Early Waves

## The Correction

The base document's Section 18 lists control-plane operational requirements. Section 20 (open questions) asks whether a temporary CLI/dashboard is needed for early waves. This should be promoted from an open question to a design decision:

**Early waves (0-2) should assume a CLI-based operator interface, not the control-plane frontend.**

Rationale: The control-plane frontend (WS-14) is built during M3 (Wave 5). Waves 0-3 execute before the frontend exists. The operator needs visibility and control during these waves.

### Minimum CLI Operator Surface (Waves 0-3)

| Capability | CLI Command (Conceptual) |
|---|---|
| List eligible packets | `forge packets --eligible` |
| Launch a packet | `forge launch F-WS3-001` |
| View packet status | `forge status F-WS3-001` |
| View validation results | `forge evidence F-WS3-001 --validators` |
| View escalation queue | `forge escalations` |
| Approve escalation | `forge approve --escalation {id}` |
| Pause workstream | `forge pause --workstream WS-3` |
| Resume workstream | `forge resume --workstream WS-3` |
| Adjust concurrency | `forge config --concurrency 3` |
| View metrics | `forge metrics` |
| View graph version | `forge graph --version` |
| Trigger graph repair | `forge repair --packet F-WS5-001 --action split` |

This CLI surface is a thin wrapper over the Control Plane API (WS-13). It does not require the frontend. It can be built as part of M1 (a few packets in WS-13 producing CLI commands alongside the REST endpoints).

When the frontend ships in Wave 5, the CLI remains available as a fallback and power-user interface.

---

# Amendment 6: Token Budget Guardrail as Default Operating Rule

## The Problem

The base document mentions cost explosion under fallback/pause scenarios but does not establish a default operating rule for token budget enforcement during normal execution. Cost overrun should not require operator diagnosis to trigger a response — it should be a standing rule.

## The Correction

Add the following as a default Alpha operating rule:

### Per-Packet Token Budget Guardrail

Every packet has a token budget computed as:

```
packet_budget = base_budget * risk_multiplier * repair_multiplier
```

Where:
- `base_budget`: 50,000 tokens (initial execution) — configurable per packet class
- `risk_multiplier`: 1.0 (low), 1.5 (medium), 2.0 (high), 3.0 (critical)
- `repair_multiplier`: each repair attempt gets 0.75x the remaining budget (diminishing)

| Packet Class | Base Budget | With 3 Repairs Max |
|---|---|---|
| Foundation | 50K | ~130K total |
| Local implementation | 50K | ~130K total |
| Interface | 75K | ~195K total |
| Integration | 75K | ~195K total |
| Security/policy | 100K | ~260K total |

### Enforcement Behavior

| Condition | Action |
|---|---|
| Packet execution reaches 80% of budget | Warning logged, visible in operator metrics |
| Packet execution reaches 100% of budget | Agent run terminated, partial results saved, packet enters BLOCKED with budget-exceeded classification |
| Cumulative repair cost for a single packet exceeds budget | Repair loop halted, packet BLOCKED, escalated to operator |
| Phase-level token spend exceeds 150% of sum of packet budgets | Phase-level warning to operator, no automatic pause |

### Why This Matters Now

Without a standing budget rule, a repair loop that oscillates (producing different but equally wrong output each time) can consume unbounded tokens before the oscillation detector fires. The budget guardrail provides a hard ceiling that catches cost explosions even when the semantic loop detector hasn't classified the behavior as oscillation yet.

The budget numbers above are initial estimates. Phase 6 should calibrate them against actual packet execution costs from Wave 0-1.

---

# Summary of Amendments

| # | Amendment | Type | Impact |
|---|---|---|---|
| 1 | Dependency-class-aware activation | Structural correction | Recovers DAG parallelism by allowing speculative starts for non-interface dependencies. Five dependency classes with different gating rules. |
| 2 | Timeline labeling | Calibration | All wave durations marked as optimistic estimates. Realistic total: 14-22 weeks. Waves 3-4 flagged as most likely to absorb iteration. |
| 3 | M0b activation split | Risk calibration | Low-risk scaffolding auto-activatable. Schema/infrastructure-defining packets operator-launched for first execution. |
| 4 | Review queue weighting | Design note (deferred) | Raw depth sufficient for Alpha. Weighted review load formula recorded for post-Alpha refinement. |
| 5 | CLI fallback for early waves | Operational decision | CLI-based operator surface for Waves 0-3. Twelve core commands. Thin wrapper over Control Plane API. Frontend is Wave 5. |
| 6 | Token budget guardrail | Operating rule | Per-packet token budget with base × risk × repair formula. Hard ceiling at 100% budget. Warning at 80%. Phase-level warning at 150%. |
