# Forge Wave 1 Artifact Pack

**Version:** 1.2  
**Date:** March 16, 2026  
**Status:** Wave 1 Preparation — Ready for Post-Wave-0 Launch Authorization  
**Prerequisites:** Locked Forge design stack (all phases and amendments approved), Wave 0 successful

---

## 1. Purpose of Wave 1

Wave 1 is the first real product-building wave. It follows Wave 0 (synthetic pipeline validation) and produces the five M0a core contract packets that define the shared type system everything else in Forge depends on.

**What Wave 1 is:** Serial execution of five foundation-contract packets (F-M0-003 through F-M0-007), each producing TypeScript type definitions and interface contracts under maximum human scrutiny.

**Why it exists:** The M0a contracts are the highest-leverage code in the system. Domain object types, cross-subsystem contracts, event taxonomy, action class taxonomy, and evidence schema are imported by every subsequent workstream. Getting them wrong cascades into weeks of rework. Getting them right unlocks safe parallelism for M0b and M1.

**What it should prove:**
- Agents can faithfully translate the approved architecture design into correct, compilable TypeScript type definitions.
- The pipeline (manifest loading, worktree provisioning, context assembly, agent execution, validation, evidence capture, merge-back) works reliably on real packets, not just synthetic ones.
- Human review of foundation contracts is operationally sustainable.
- The evidence and validator machinery produces trustworthy signals on real code.

**What it should not attempt:**
- No implementation logic (only type definitions and interfaces).
- No concurrent execution (serial only).
- No speculative starts.
- No agent-only review (every packet gets mandatory human review).
- No scope drift into M0b scaffolding or M1 implementation.
- No architecture invention — contracts must faithfully reflect the approved architecture design.

**Why it follows Wave 0:** Wave 0 proved the pipeline works end-to-end on a synthetic packet. Wave 1 proves the pipeline works on real foundation contracts where correctness matters. The separation keeps the signal clean: Wave 0 failures are pipeline failures; Wave 1 failures are contract-authoring failures.

---

## 2. Wave 1 Scope

### Allowed Packet Classes
- **Foundation contracts only** (M0a). Pure type definitions, no implementation logic.

### Disallowed Packet Classes
- Implementation, interface (cross-subsystem wiring), integration, policy-sensitive, graph-repair, documentation, validation, configuration, scaffolding (M0b).

### Allowed Dependency Classes
- `interface` (all five packets define contracts — prereqs must be MERGED before activation, per the dependency-class-aware activation rules in the design stack).

### Concurrency Expectations
- **Concurrency cap: 1** (serial execution).
- Packets launch one at a time, operator-initiated.
- No speculative execution.

### Review Mode
- **Human-required for every packet.**
- Human review is the blocking gate. Agent review may run as an advisory pre-screen if available, but is not required and is never blocking.
- Human reviews against the approved architecture design, not just compilation correctness.

### Validator Strictness
- All deterministic validators are blocking.
- Compilation, lint, type-check, architecture boundary check, scope-drift check, protected-path check, evidence completeness — all must pass.
- Confidence score is computed but does not gate promotion (confidence operates above the validator layer, never in place of it).

### Policy Sensitivity Expectations
- None of the five packets should trigger policy sensitivities.
- No protected-path writes (all target `packages/shared/src/types/`).
- No dependency additions.
- No harness file mutations.
- Any unexpected ESCALATE is a red flag requiring investigation before continuing.

### Success Criteria (Wave Level)
- All five packets reach MERGED on the phase branch.
- Evidence completeness = 100% (every packet has a complete evidence bundle).
- No unresolved escalations.
- Graph repair is abnormal for Wave 1 and should trigger pause and investigation if needed.

**Operator policy thresholds** (recommended defaults, adjustable by operator):
- First-pass success rate target: ≥ 50% (at least 3 of 5 succeed without repair loops).
- Recommended maximum total repair loops: 2 across all five packets.

---

## 3. Wave 1 Artifact Inventory

### New Artifacts Created for Wave 1

| Artifact | Path |
|---|---|
| Wave 1 manifest | `packets/waves/wave1-m0a-contracts.yaml` |
| F-M0-003 manifest | `packets/manifests/F-M0-003.yaml` |
| F-M0-004 manifest | `packets/manifests/F-M0-004.yaml` |
| F-M0-005 manifest | `packets/manifests/F-M0-005.yaml` |
| F-M0-006 manifest | `packets/manifests/F-M0-006.yaml` |
| F-M0-007 manifest | `packets/manifests/F-M0-007.yaml` |
| Foundation contracts context profile | `packets/context-profiles/foundation-contracts.yaml` |
| Wave 1 launch runbook | `ops/runbooks/wave1-launch.md` |
| Wave 1 progression checklist | `ops/wave1-progression-checklist.md` |

### Shared Artifacts Reused from Wave 0 / Phase 6 / Phase 7

| Artifact | Path | Reused As-Is or Modified |
|---|---|---|
| Foundation validator manifest | `packets/validator-manifests/foundation.yaml` | As-is |
| Standard evidence manifest | `packets/evidence-manifests/standard.yaml` | As-is |
| Human-required review manifest | `packets/review-manifests/human-required.yaml` | As-is |
| Agent review manifest | `packets/review-manifests/agent-review.yaml` | As-is (used only if agent review is exercised) |
| Implementer-foundation prompt template | `packets/templates/implementer-foundation.yaml` | As-is (calibrated during Wave 0 preparation) |
| Debugger prompt template | `packets/templates/debugger.yaml` | As-is |
| Reviewer prompt template | `packets/templates/reviewer.yaml` | As-is |
| Packet registry | `packets/validation/packet-registry.yaml` | Updated (add F-M0-003–007 as instantiated) |
| Blessed-stack policy | `harness/policies/blessed-stack.yaml` | As-is |
| Shell allowlist | `harness/policies/shell-allowlist.yaml` | As-is |
| Protected paths | `harness/policies/protected-paths.yaml` | As-is |
| Token budgets | `harness/policies/token-budgets.yaml` | May be updated from Wave 0 calibration data |
| CLI fallback runbook | `ops/runbooks/cli-fallback.md` | As-is |
| Validator failure runbook | `ops/runbooks/validator-failure.md` | As-is |
| Graph repair runbook | `ops/runbooks/graph-repair.md` | As-is |
| Packet readiness checklist | `ops/checklists/packet-readiness.md` | As-is |
| Wave readiness checklist | `ops/checklists/wave-readiness.md` | As-is |
| Pre-launch checklist | `ops/checklists/pre-launch.md` | As-is |
| Escalation matrix | `ops/escalation-matrix.md` | As-is |
| Operator daily loop | `ops/operator-daily-loop.md` | As-is |
| Manifest validation tooling | `packets/validation/*.yaml` | As-is |

---

## 4. Canonical Wave 1 Wave Manifest

**File:** `packets/waves/wave1-m0a-contracts.yaml`

```yaml
wave_id: wave-1
title: "M0a Core Contracts"
status: ready  # ready | active | completed | paused

purpose: |
  Execute the five M0a foundation-contract packets that define the shared
  type system for the entire Forge codebase. These are pure TypeScript
  type definitions and interface contracts — no implementation logic.
  Every subsequent workstream imports from these contracts.

packets:
  - F-M0-003  # Shared domain object types
  - F-M0-004  # Cross-subsystem contract interfaces
  - F-M0-005  # Event taxonomy types
  - F-M0-006  # Action class taxonomy + tool I/O types
  - F-M0-007  # Evidence schema + retention tier model

excluded_packets:
  - "All M0b scaffolding (F-M0-001, F-M0-002, F-M0-008, F-M0-009, F-M0-010)"
  - "All M1+ packets"
  - "All integration packets"
  - "All graph-repair packets"

execution_policy:
  concurrency_cap: 1  # serial execution
  launch_mode: operator-launched  # every packet requires operator activation
  speculative_execution: false
  dependency_class_interpretation: |
    All five packets use dependency_class_profile: interface.
    Prereqs must be MERGED before activation.
    No speculative starts allowed.

review_policy:
  default_review: human-required  # human review is mandatory and blocking
  agent_review: optional-advisory  # may run as pre-screen, never blocking

benchmark_gates:
  pre_wave:
    - wave0-smoke-pass  # Wave 0 must have completed successfully
  post_wave: []  # No benchmark run after Wave 1

expansion_criteria:
  all_packets_merged: true
  evidence_completeness: 1.0
  # The following are operator policy thresholds, not design guarantees.
  # Operator should adjust based on Wave 0 observations.
  operator_policy:
    first_pass_success_rate_target: ">= 0.5"
    recommended_max_graph_repairs: 0  # graph repair is abnormal for Wave 1
    recommended_max_total_repair_loops: 2

freeze_criteria:
  pipeline_failure: true    # any pipeline error freezes the wave
  security_alert: true      # any security alert freezes the wave
  policy_anomaly: true      # any unexpected ESCALATE freezes the wave
  evidence_gap: true        # any evidence incompleteness freezes the wave

rollback_criteria:
  cross_task_validation_failure: true

operator_notes: |
  This is the first real wave. Every output defines contracts that
  everything else depends on. Review each packet against the approved
  architecture design, not just compilation correctness.

  Serial execution only. No rushing. Take the time to get these right.

  If any packet requires a graph repair, pause and investigate before
  continuing. Graph repairs on foundation contracts indicate a design
  gap that should be resolved at the specification level, not patched
  at the packet level.

  Token budgets should be reviewed against Wave 0 data before launch.
```

---

## 5. The Five Wave 1 Packet Manifests

### 5.1 F-M0-003 — Shared TypeScript Interfaces: Domain Objects

**File:** `packets/manifests/F-M0-003.yaml`

```yaml
packet_id: F-M0-003
title: "Shared TypeScript interfaces: domain objects"
version: 1

# Classification
milestone: M0a
workstream: WS-1
packet_class: foundation
risk_class: medium
activation_class: operator-launched

# Dependencies
dependency_class_profile: interface
prerequisite_packets:
  []
prerequisite_artifacts:
  - path: "packages/shared/tsconfig.json"
    description: "TypeScript config must exist for compilation"
  - path: "packages/shared/package.json"
    description: "Package manifest must exist"
speculative_start_allowed: false

# Scope
scope:
  - "packages/shared/src/types/"
out_of_scope:
  - "apps/"
  - "harness/"
  - "prisma/"
  - "packages/shared/src/utils/"
protected_paths:
  - "harness/"
  - ".github/"
  - "AGENTS.md"
  - ".env"
target_paths:
  - "packages/shared/src/types/domain.ts"
  - "packages/shared/src/types/index.ts"

# Inputs and Outputs
required_inputs:
  - "Approved architecture design — domain model and subsystem breakdown"
  - "Approved architecture design — task state machine definition"
expected_outputs:
  - "TypeScript type definitions for all core domain objects"
  - "Re-export index file"
required_docs_updates: []  # M0a does not require doc updates yet

# Validation / Evidence / Review
validator_manifest_ref: "packets/validator-manifests/foundation.yaml"
evidence_manifest_ref: "packets/evidence-manifests/standard.yaml"
review_manifest_ref: "packets/review-manifests/human-required.yaml"
prompt_template_ref: "packets/templates/implementer-foundation.yaml"
context_pack_profile: "foundation-contracts"

# Operational
benchmark_tags: []
policy_sensitivities: []
escalation_conditions:
  - "Type definitions incompatible with the approved architecture design"
  - "Output size triggers packet sizing concerns per the structural sizing rules"
  - "Agent attempts to import implementation code"
  - "Agent attempts to write outside scope"
completion_contract:
  - "All exported types compile under strict mode"
  - "Types cover the domain objects defined in the approved architecture design"
  - "Re-export index exposes all domain types"
  - "No implementation logic — only type definitions, interfaces, enums, and type guards"
  - "Lint passes"
graph_repair_hooks:
  - "If downstream packets fail type errors against these definitions, this packet may need revision"
operator_notes: |
  This is the first real packet. It defines the core domain types that
  every subsystem imports. Review carefully against the approved
  architecture design. Verify completeness: are all domain objects from
  the architecture represented? Verify correctness: do the type shapes
  match the architecture spec?
```

### 5.2 F-M0-004 — Cross-Subsystem Contract Interfaces

**File:** `packets/manifests/F-M0-004.yaml`

```yaml
packet_id: F-M0-004
title: "Cross-subsystem contract interfaces"
version: 1

# Classification
milestone: M0a
workstream: WS-1
packet_class: foundation
risk_class: high  # most coupling-sensitive definitions in the system
activation_class: operator-launched

# Dependencies
dependency_class_profile: interface
prerequisite_packets:
  - F-M0-003  # Domain types must be merged first
prerequisite_artifacts:
  - path: "packages/shared/src/types/domain.ts"
    description: "Domain types must exist (produced by F-M0-003)"
  - path: "packages/shared/tsconfig.json"
    description: "TypeScript config must exist"
speculative_start_allowed: false

# Scope
scope:
  - "packages/shared/src/types/"
out_of_scope:
  - "apps/"
  - "harness/"
  - "prisma/"
  - "packages/shared/src/utils/"
protected_paths:
  - "harness/"
  - ".github/"
  - "AGENTS.md"
  - ".env"
target_paths:
  - "packages/shared/src/types/contracts.ts"
  - "packages/shared/src/types/index.ts"

# Inputs and Outputs
required_inputs:
  - "Approved architecture design — all cross-subsystem interfaces (orchestrator, policy engine, tool broker, agent runner, validator runner, evidence collector)"
  - "Domain types from F-M0-003"
expected_outputs:
  - "TypeScript interfaces for all cross-subsystem contracts"
  - "Updated re-export index"
required_docs_updates: []

# Validation / Evidence / Review
validator_manifest_ref: "packets/validator-manifests/foundation.yaml"
evidence_manifest_ref: "packets/evidence-manifests/standard.yaml"
review_manifest_ref: "packets/review-manifests/human-required.yaml"
prompt_template_ref: "packets/templates/implementer-foundation.yaml"
context_pack_profile: "foundation-contracts"

# Operational
benchmark_tags: []
policy_sensitivities: []
escalation_conditions:
  - "Contract interface incompatible with any subsystem spec in the approved architecture design"
  - "Output size triggers packet sizing concerns per the structural sizing rules"
  - "Agent introduces implementation beyond type signatures"
  - "Contract references types not defined in the domain types from F-M0-003"
completion_contract:
  - "All exported contract interfaces compile under strict mode"
  - "Cross-subsystem request/response and result interfaces defined for each subsystem boundary in the architecture"
  - "Contracts reference only domain types from F-M0-003"
  - "No implementation logic — only interfaces, type aliases, and type guards"
  - "Re-export index updated"
  - "Lint passes"
graph_repair_hooks:
  - "If consuming workstream packets fail against these contracts, this packet may need revision"
  - "Cross-subsystem contract changes carry the highest cascade risk"
speculative_start_allowed: false
operator_notes: |
  This is the most coupling-sensitive packet in Wave 1. Cross-subsystem
  contracts are imported by nearly every workstream. Review against ALL
  subsystem interface specs in the approved architecture design, not
  just one. Verify that every cross-subsystem boundary has a
  corresponding contract interface.
```

### 5.3 F-M0-005 — Event Taxonomy Types

**File:** `packets/manifests/F-M0-005.yaml`

```yaml
packet_id: F-M0-005
title: "Event taxonomy types"
version: 1

# Classification
milestone: M0a
workstream: WS-1
packet_class: foundation
risk_class: medium
activation_class: operator-launched

# Dependencies
dependency_class_profile: interface
prerequisite_packets:
  - F-M0-003  # Domain types must be merged (events reference domain objects)
prerequisite_artifacts:
  - path: "packages/shared/src/types/domain.ts"
    description: "Domain types must exist"
  - path: "packages/shared/tsconfig.json"
    description: "TypeScript config must exist"
speculative_start_allowed: false

# Scope
scope:
  - "packages/shared/src/types/"
out_of_scope:
  - "apps/"
  - "harness/"
  - "prisma/"
  - "packages/shared/src/utils/"
protected_paths:
  - "harness/"
  - ".github/"
  - "AGENTS.md"
  - ".env"
target_paths:
  - "packages/shared/src/types/events.ts"
  - "packages/shared/src/types/index.ts"

# Inputs and Outputs
required_inputs:
  - "Approved architecture design — orchestrator event model"
  - "Approved architecture design — audit/observability event ingestion"
  - "Approved architecture design — real-time event streaming model"
  - "Domain types from F-M0-003"
expected_outputs:
  - "TypeScript event type definitions covering all system event categories"
  - "Updated re-export index"
required_docs_updates: []

# Validation / Evidence / Review
validator_manifest_ref: "packets/validator-manifests/foundation.yaml"
evidence_manifest_ref: "packets/evidence-manifests/standard.yaml"
review_manifest_ref: "packets/review-manifests/human-required.yaml"
prompt_template_ref: "packets/templates/implementer-foundation.yaml"
context_pack_profile: "foundation-contracts"

# Operational
benchmark_tags: []
policy_sensitivities: []
escalation_conditions:
  - "Event types incompatible with the approved architecture event model"
  - "Output size triggers packet sizing concerns per the structural sizing rules"
  - "Agent defines events that don't correspond to architecture-defined state transitions or subsystem interactions"
completion_contract:
  - "All event types compile under strict mode"
  - "Event types cover the event categories defined in the approved architecture (state transitions, policy decisions, tool invocations, validation results, audit events)"
  - "Events reference domain types from F-M0-003"
  - "No implementation logic — only event type definitions and discriminated unions"
  - "Re-export index updated"
  - "Lint passes"
graph_repair_hooks:
  - "If orchestrator, audit, or control plane packets fail on event type mismatches, this packet may need revision"
speculative_start_allowed: false
operator_notes: |
  Event taxonomy defines the shape of all events flowing through the
  event bus and consumed by the orchestrator, audit pipeline, and UI.
  Verify completeness against the approved architecture: are all event
  categories represented? Verify that event types form clean
  discriminated unions.
```

### 5.4 F-M0-006 — Action Class Taxonomy + Tool I/O Types

**File:** `packets/manifests/F-M0-006.yaml`

```yaml
packet_id: F-M0-006
title: "Action class taxonomy + tool I/O types"
version: 1

# Classification
milestone: M0a
workstream: WS-1
packet_class: foundation
risk_class: high  # policy engine and tool broker both depend on these
activation_class: operator-launched

# Dependencies
dependency_class_profile: interface
prerequisite_packets:
  - F-M0-003  # Domain types must be merged
prerequisite_artifacts:
  - path: "packages/shared/src/types/domain.ts"
    description: "Domain types must exist"
  - path: "packages/shared/tsconfig.json"
    description: "TypeScript config must exist"
speculative_start_allowed: false

# Scope
scope:
  - "packages/shared/src/types/"
out_of_scope:
  - "apps/"
  - "harness/"
  - "prisma/"
  - "packages/shared/src/utils/"
protected_paths:
  - "harness/"
  - ".github/"
  - "AGENTS.md"
  - ".env"
target_paths:
  - "packages/shared/src/types/actions.ts"
  - "packages/shared/src/types/index.ts"

# Inputs and Outputs
required_inputs:
  - "Approved architecture design — policy engine action class evaluation"
  - "Approved architecture design — tool broker typed ACI and six action classes"
  - "Approved security design — action class taxonomy (READ, MUTATE, EXECUTE, ANALYZE, NETWORK, ATTEST)"
  - "Domain types from F-M0-003"
expected_outputs:
  - "TypeScript action class type definitions and per-class tool I/O types"
  - "Updated re-export index"
required_docs_updates: []

# Validation / Evidence / Review
validator_manifest_ref: "packets/validator-manifests/foundation.yaml"
evidence_manifest_ref: "packets/evidence-manifests/standard.yaml"
review_manifest_ref: "packets/review-manifests/human-required.yaml"
prompt_template_ref: "packets/templates/implementer-foundation.yaml"
context_pack_profile: "foundation-contracts"

# Operational
benchmark_tags: []
policy_sensitivities: []
escalation_conditions:
  - "Action class types incompatible with the approved architecture and security design"
  - "Output size triggers packet sizing concerns per the structural sizing rules"
  - "Agent invents action classes not in the approved six-class taxonomy"
  - "Tool I/O types are not structured enough for policy engine evaluation"
completion_contract:
  - "All action class types compile under strict mode"
  - "The six approved action classes are defined: READ, MUTATE, EXECUTE, ANALYZE, NETWORK, ATTEST"
  - "Per-class tool I/O types defined (input parameters and result shapes)"
  - "Types reference domain types from F-M0-003"
  - "No implementation logic"
  - "Re-export index updated"
  - "Lint passes"
graph_repair_hooks:
  - "If policy engine or tool broker packets fail against these types, this packet may need revision"
speculative_start_allowed: false
operator_notes: |
  These types define what the policy engine evaluates and what the tool
  broker routes. The six action classes (READ, MUTATE, EXECUTE, ANALYZE,
  NETWORK, ATTEST) must match the approved security design exactly.
  Per-tool I/O types should be specific enough that the policy engine
  can make meaningful ALLOW/DENY/ESCALATE decisions based on the type
  alone. Review against the approved security design and architecture.
```

### 5.5 F-M0-007 — Evidence Schema + Retention Tier Model

**File:** `packets/manifests/F-M0-007.yaml`

```yaml
packet_id: F-M0-007
title: "Evidence schema + retention tier model"
version: 1

# Classification
milestone: M0a
workstream: WS-1
packet_class: foundation
risk_class: medium
activation_class: operator-launched

# Dependencies
dependency_class_profile: interface
prerequisite_packets:
  - F-M0-003  # Domain types must be merged
prerequisite_artifacts:
  - path: "packages/shared/src/types/domain.ts"
    description: "Domain types must exist"
  - path: "packages/shared/tsconfig.json"
    description: "TypeScript config must exist"
speculative_start_allowed: false

# Scope
scope:
  - "packages/shared/src/types/"
out_of_scope:
  - "apps/"
  - "harness/"
  - "prisma/"
  - "packages/shared/src/utils/"
protected_paths:
  - "harness/"
  - ".github/"
  - "AGENTS.md"
  - ".env"
target_paths:
  - "packages/shared/src/types/evidence.ts"
  - "packages/shared/src/types/index.ts"

# Inputs and Outputs
required_inputs:
  - "Approved evaluation design — evidence requirements and completeness model"
  - "Approved architecture design — evidence collector, bundle assembly, retention tiers"
  - "Approved architecture design — evidence tier clarifications (pre/post merge)"
  - "Evidence manifest design from the instantiation layer"
  - "Domain types from F-M0-003"
expected_outputs:
  - "TypeScript evidence type definitions (bundle, item, tier, confidence)"
  - "Updated re-export index"
required_docs_updates: []

# Validation / Evidence / Review
validator_manifest_ref: "packets/validator-manifests/foundation.yaml"
evidence_manifest_ref: "packets/evidence-manifests/standard.yaml"
review_manifest_ref: "packets/review-manifests/human-required.yaml"
prompt_template_ref: "packets/templates/implementer-foundation.yaml"
context_pack_profile: "foundation-contracts"

# Operational
benchmark_tags: []
policy_sensitivities: []
escalation_conditions:
  - "Evidence schema incompatible with the approved evaluation design or evidence manifest"
  - "Output size triggers packet sizing concerns per the structural sizing rules"
  - "Retention tier model doesn't match the approved architecture tier design"
completion_contract:
  - "All evidence types compile under strict mode"
  - "Evidence bundle, evidence item, retention tier, and confidence score types defined"
  - "Tier model matches the approved architecture (repo, structured DB, blob storage, search index)"
  - "Evidence types reference domain types from F-M0-003"
  - "No implementation logic"
  - "Re-export index updated"
  - "Lint passes"
graph_repair_hooks:
  - "If validator runner or evidence pipeline packets fail against these types, this packet may need revision"
speculative_start_allowed: false
operator_notes: |
  Evidence schema defines the evidence bundle structure used by the
  validator runner, evidence pipeline, and UI inspector. Retention tiers
  must match the approved architecture design. Verify against the
  standard evidence manifest: do the types here support every required,
  conditional, and ephemeral evidence item listed?
```

---

## 6. Foundation Contracts Context Profile

**File:** `packets/context-profiles/foundation-contracts.yaml`

```yaml
profile_id: foundation-contracts
title: "Context profile for M0a foundation contract packets"
description: |
  Assembles context for agents producing TypeScript type definitions
  from the approved architecture design. Keeps context small and focused
  on specification documents, not implementation code.

included:
  architecture_docs:
    # The exact repo paths for architecture docs depend on the repo
    # skeleton structure available before Wave 1 launch. The context packager
    # should include whichever architecture docs exist that cover:
    - description: "Subsystem breakdown and domain model"
      trust_label: HARNESS
    - description: "Task state machine definition"
      trust_label: HARNESS
    - description: "Evidence model and retention tiers"
      trust_label: HARNESS
    - description: "Security model — action classes, policy model"
      trust_label: HARNESS

  policy_docs:
    - path: "harness/policies/blessed-stack.yaml"
      trust_label: HARNESS
    - path: "AGENTS.md"
      sections: "coding conventions, type definition rules"
      trust_label: HARNESS

  validation_docs:
    - path: "packets/validator-manifests/foundation.yaml"
      trust_label: SYSTEM
    - path: "packets/evidence-manifests/standard.yaml"
      trust_label: SYSTEM

  repo_files:
    - path: "packages/shared/tsconfig.json"
      trust_label: CODE
    - path: "packages/shared/src/types/**"
      description: "Existing type files (from prior packets in the wave)"
      trust_label: CODE

excluded:
  - "apps/**"
  - "prisma/**"
  - "benchmarks/**"
  - "ops/**"
  - "All implementation source code"
  - "All test code"
  - "External research or web content"

trust_labels:
  SYSTEM: "Orchestrator instructions, packet contract, role constraints, tool permissions"
  HARNESS: "Architecture docs, coding conventions, policy docs from repo"
  CODE: "Source files within scope"
  EXTERNAL: "Not used for foundation contracts"

size_target: "< 30% of model context window"
size_rationale: |
  Foundation contracts need specification documents and existing type
  files, not implementation code. Context should be small enough that
  the agent focuses on translating specs into types, not navigating
  a large codebase.

retry_time_additions:
  - "Prior diff (the attempt that failed)"
  - "Failure report (structured validator output)"
  - "Repair attempt number"
  - "If attempt > 1: prior repair diffs"
  - "On retry, reduce general context to stay within token budget — agent should focus on the failure"
```

---

## 7. Wave 1 Review Model

### Review Mode
All five Wave 1 packets use `human-required` review. This means:
1. Deterministic validators run first (compilation, lint, type-check, scope-drift, protected-path, architecture boundary, evidence completeness).
2. If all deterministic validators pass, agent review **may** run as an optional advisory pre-screen. Agent review is never blocking.
3. Human review is the blocking gate. No packet advances to MERGED without explicit human approval.

### Human Review Checklist for M0a Contract Packets

For each of the five packets, the human reviewer must answer:

**Specification Fidelity**
- Do the produced types match the approved architecture design?
- Are all relevant domain objects / interfaces / events / action classes / evidence types represented?
- Are there any types that the agent invented that are not in the design?
- Are there any types from the design that are missing?

**Type Correctness**
- Do the type shapes make sense? Are field types appropriate (string vs. enum, optional vs. required)?
- Are discriminated unions used where the architecture describes polymorphic behavior?
- Are type guards present where needed?
- Do types compose correctly (e.g., bundle types reference item types, not raw objects)?

**Contract Composability**
- Can these types be imported by downstream workstreams without modification?
- Are exports clean (no internal helpers exported, no circular references)?
- Does the re-export index expose everything correctly?

**Scope Compliance**
- Did the agent write only within `packages/shared/src/types/`?
- Did the agent avoid implementation logic (no functions beyond type guards, no classes, no side effects)?
- Did the agent avoid importing from outside the shared types package?

**Convention Adherence**
- Does naming follow project conventions?
- Are comments/JSDoc present where types are non-obvious?
- Does the code pass lint and type-check?

### Evidence That Must Be Inspected Before Approval
- Full diff
- Compilation result
- Lint result
- Scope-drift check result
- Agent reviewer findings (if agent review ran)
- Confidence score
- Audit trail (verify no unexpected tool invocations)
- Context pack manifest (verify agent had the right specification documents)

### Issues That Force Packet Rejection
- Any type that contradicts the approved architecture design
- Missing types for a major domain concept
- Implementation logic in a type-definition-only packet
- Out-of-scope file modifications
- Circular type dependencies
- Types that would force downstream workaround patterns

### Issues That Force Graph Repair
- Packet scope is wrong (types need to be split across multiple files in ways the manifest doesn't allow)
- Hidden coupling between this packet and another Wave 1 packet that wasn't captured in prerequisites
- Architecture specification is ambiguous in a way that the packet cannot resolve without an architecture decision

---

## 8. Wave 1 Validator and Evidence Expectations

### General Validator Expectations (All Five Packets)

All five packets reference `packets/validator-manifests/foundation.yaml` and `packets/evidence-manifests/standard.yaml`. This section does not redefine those manifests — it identifies which validators and evidence items are most operationally significant for M0a contracts.

| Validator | Importance for M0a | Likely Failure Patterns |
|---|---|---|
| **Compilation** | Critical — types must compile under strict mode | Missing imports, incorrect generic constraints, incompatible type assignments |
| **Lint** | Important — conventions must be followed from the start | Naming convention violations, unused exports |
| **Architecture boundary check** | Important — types must not import from forbidden paths | Agent importing from apps/ or prisma/ instead of staying in shared/ |
| **Scope-drift check** | Critical — agent must stay within declared scope | Writing to files outside packages/shared/src/types/ |
| **Protected-path check** | Critical — harness and config files must not be modified | Should never fire for these packets; if it does, investigate immediately |
| **Evidence completeness** | Critical — every evidence item must be captured | Missing audit trail entries, missing context pack manifest |
| **Confidence scoring** | Informational — not blocking | Low confidence on a type-definition packet warrants investigation |

### Per-Packet Evidence Notes

Evidence requirements are defined by the standard evidence manifest. The notes below identify packet-specific review focus areas, not additional evidence requirements.

**F-M0-003 (Domain Types)**
- Review focus: Verify the diff includes all core domain types from the approved architecture. Evidence should show that the re-export index exposes everything.
- Most likely failure: Incomplete domain model coverage — agent produces some types but misses others.

**F-M0-004 (Cross-Subsystem Contracts)**
- Review focus: Verify contracts reference only types from F-M0-003. Verify all subsystem boundary interfaces from the approved architecture are represented.
- Most likely failure: Contract that doesn't match one subsystem's expectations — visible when the human reviewer cross-checks against multiple architecture sections.
- What should block promotion: Any contract interface that would require a workaround in a consuming workstream.

**F-M0-005 (Event Taxonomy)**
- Review focus: Verify events form clean discriminated unions. Verify coverage of the event categories defined in the approved architecture.
- Most likely failure: Incomplete event coverage — agent covers some event categories but misses others.

**F-M0-006 (Action Class Taxonomy)**
- Review focus: Verify exactly six action classes matching the approved security design. Verify per-tool I/O types are specific enough for policy evaluation.
- Most likely failure: Tool I/O types that are too generic instead of structured per-tool types.

**F-M0-007 (Evidence Schema)**
- Review focus: Verify retention tier model matches the approved architecture. Verify evidence bundle structure supports all items in the standard evidence manifest.
- Most likely failure: Tier model that doesn't account for the promotion-on-failure behavior described in the approved architecture.

---

## 9. Wave 1 Launch Runbook

**File:** `ops/runbooks/wave1-launch.md`

```markdown
# Wave 1 Launch Runbook

## Launch Prerequisites

Before launching any Wave 1 packet:

- [ ] Wave 0 completed successfully (all success criteria met)
- [ ] Wave 0 post-launch review completed and documented
- [ ] Token budgets reviewed against Wave 0 data (update harness/policies/token-budgets.yaml if needed)
- [ ] Wave 1 manifest (wave1-m0a-contracts.yaml) committed and validated
- [ ] All five packet manifests (F-M0-003 through F-M0-007) committed and pass schema validation
- [ ] Manifest validation tooling passes all checks (schema, dependencies, references, scope)
- [ ] Foundation-contracts context profile (foundation-contracts.yaml) validated
- [ ] Packet registry updated with F-M0-003 through F-M0-007 as "instantiated"
- [ ] Architecture specification docs are accessible for context pack assembly
- [ ] CLI fallback operational (all commands defined in the design stack)
- [ ] Live infrastructure healthy (containers, Redis, PostgreSQL, model API)
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
5. Review agent output against the approved architecture domain model
6. Apply human review checklist (Section 7 of the Wave 1 artifact pack)
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
- Verify retention tier model matches the approved architecture
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
```

---

## 10. Wave 1 Progression Checklist

**File:** `ops/wave1-progression-checklist.md`

```markdown
# Wave 1 Progression Checklist

## Pre-Launch Checks

- [ ] Wave 0 completed successfully (all success criteria met)
- [ ] Wave 0 post-launch review documented
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
- [ ] Agent review ran (if applicable) — findings noted
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

- [ ] Were any escalations triggered? If yes:
  - [ ] Each escalation classified and resolved
  - [ ] Resolution documented in launch record
  - [ ] No escalation indicates a systemic issue requiring wave pause

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

- [ ] Packet registry updated (all five packets marked "merged" or "completed" consistently)
- [ ] Token budgets still appropriate based on observed consumption
- [ ] Policy files unchanged during Wave 1 execution
- [ ] Validator manifests unchanged during Wave 1 execution

## Criteria for Post-Wave-1 Progression

All of the following must be true to authorize post-Wave-1 planning:

- [ ] All wave-completion checks above are true
- [ ] Operator writes a Wave 1 completion assessment answering:
  - Are the M0a contracts stable enough that M0b and first M1 packets can safely depend on them?
  - Were there any type shape issues that might require revision when real implementation starts?
  - Did the agent produce types that faithfully represent the approved architecture, or did the human reviewer have to make significant corrections?
  - Is the pipeline reliable enough for increased concurrency?
  - Are the evidence and validator signals trustworthy?
- [ ] Operator explicitly records: AUTHORIZE POST-WAVE-1 PLANNING / REPEAT WAVE 1 / RETURN TO PREPARATION
```

---

## 11. Wave 1 Risks

### Risk 1: Contract Ambiguity in Architecture Specs

**Why it matters:** The approved architecture defines subsystem interfaces in natural language. Translating natural language specs into TypeScript types requires interpretation. Two reasonable readings of the same spec can produce incompatible types.

**How Wave 1 should detect it:** Human review against the architecture specs. If the reviewer finds themselves unsure whether the agent's interpretation is correct, that is ambiguity. If two of the five packets produce types that don't compose cleanly, that is latent ambiguity.

**What the operator should do:** Document the ambiguity. Make a design decision (choose one interpretation). Record the decision as a clarification to the architecture spec. Do not leave it for downstream packets to discover.

### Risk 2: Hidden Coupling Between Packets

**Why it matters:** F-M0-004 (contracts) imports from F-M0-003 (domain types). F-M0-005, F-M0-006, F-M0-007 also import from F-M0-003. If F-M0-004 defines a contract that implicitly requires a type shape that F-M0-003 didn't provide, the coupling surfaces as a compilation error in F-M0-004 but the fix belongs in F-M0-003.

**How Wave 1 should detect it:** Compilation failures in later packets that trace back to earlier packet type shapes. Human review that notices a contract would be cleaner with a different domain type shape.

**What the operator should do:** If minor (adding a field to an existing type), update F-M0-003 via a graph-repair revision packet. If major (restructuring the domain model), pause and resolve at the spec level before continuing.

### Risk 3: Scope Drift

**Why it matters:** Foundation contract packets should produce only type definitions. An agent that adds utility functions, validation logic, or runtime code is drifting. This code would need to be moved or deleted later.

**How Wave 1 should detect it:** Scope-drift validator flags files outside target_paths. Human review catches implementation logic masquerading as type definitions.

**What the operator should do:** Reject the packet. Instruct the repair to remove non-type code. If the agent consistently drifts, adjust the prompt template to emphasize "type definitions only, no implementation."

### Risk 4: Invalid Target Path Declarations

**Why it matters:** If a manifest declares exact target_paths but the agent writes to a slightly different path structure, the scope-drift check may not catch it if the path is within scope but outside target_paths.

**How Wave 1 should detect it:** Exact-path target checking for foundation packets. Diff review showing files that don't match target_paths.

**What the operator should do:** Reject the packet. Either update the manifest's target_paths to match the correct file structure, or instruct the agent to write to the declared paths.

### Risk 5: Evidence Schema Incompleteness (F-M0-007)

**Why it matters:** F-M0-007 defines the evidence bundle types that the evidence pipeline and validators consume. If the schema doesn't support all evidence items from the standard evidence manifest, the evidence completeness validator will fail on future packets.

**How Wave 1 should detect it:** Human review cross-referencing F-M0-007 output against `packets/evidence-manifests/standard.yaml`.

**What the operator should do:** If gaps found, reject and repair. This is the last packet in Wave 1, so there is time to get it right without blocking anything.

### Risk 6: Review Bottleneck

**Why it matters:** Five packets with mandatory human review, serially. If review takes longer than expected due to spec cross-referencing, Wave 1 duration stretches.

**How Wave 1 should detect it:** Operator self-monitoring review time per packet.

**What the operator should do:** Accept the time cost. Wave 1 is about getting contracts right, not speed. If review consistently takes too long, consider creating a more structured review template that reduces cognitive load.

### Risk 7: Packet Sizing Problems

**Why it matters:** If any packet produces output that violates the structural sizing rules (one subsystem concern, one validator story, one evidence story, one clear completion contract), the packet may need splitting.

**How Wave 1 should detect it:** Diff size in evidence bundle. Human review assessing whether the output is a single coherent concern.

**What the operator should do:** If manageable (slightly over heuristic thresholds), accept with a note. If the output clearly violates structural rules, split the packet via graph repair.

---

## 12. What Wave 1 Unlocks

### Immediate Unlocks

**M0b scaffolding becomes safe to execute.** With M0a contracts merged and stable, the Prisma schema packet can be authored with confidence that the domain types it implements are correct. The other M0b packets can proceed as well.

**M1 workstream parallelism becomes possible.** Once contracts are merged, the core runtime workstreams (orchestrator, policy engine, runtime manager, tool broker, GitHub integration) can begin in parallel because they all import from the same stable shared types. This is the primary parallelism unlock for the entire Alpha build.

**Concurrency can increase.** Wave 1 at concurrency 1 establishes a baseline. If the pipeline was reliable and review was sustainable, the operator can increase concurrency for subsequent waves.

### Confidence Unlocks

**Validator signals become more trustworthy.** Five real packets through the validator pipeline (not just synthetic) provide evidence about validator reliability: false positive rate, failure classification accuracy, evidence completeness fidelity.

**Token budget calibration improves.** Five real foundation packets provide actual token consumption data for the foundation packet class, enabling more accurate budget settings for subsequent waves.

**Prompt template quality is validated.** The implementer-foundation template has now been tested on real contracts, not just synthetic code. Adjustments can be made before subsequent waves introduce new packet classes.

**Agent review reliability is assessed.** If agent review ran during Wave 1, its findings can be compared against human review verdicts to assess whether it would have caught the same issues. This informs the decision about when to shift review burden in later waves.

### Downstream Safety

**Later workstream packets have stable imports.** Every M1 implementation packet that imports from the shared types depends on Wave 1 output. Stable contracts mean fewer type-error-driven repair loops in M1.

**Integration packets have contract baselines.** The explicit integration packets test cross-subsystem boundaries against these contracts. Stable contracts mean integration test failures are real boundary issues, not upstream type instability.

**Graph repair scope is bounded.** If an M1 packet discovers a contract gap, the repair is a targeted amendment to one of the M0a type files — not a re-architecture of the domain model.

---

## 13. File Split Guide

This section maps each section of this document to its target repo file(s).

| Section | Target File(s) | Type |
|---|---|---|
| **Section 1 (Purpose)** | Explanatory only — does not become a standalone file. May be excerpted into `ops/runbooks/wave1-launch.md` preamble. | Explanatory |
| **Section 2 (Scope)** | Incorporated into `packets/waves/wave1-m0a-contracts.yaml` fields and `ops/wave1-progression-checklist.md` criteria. | Incorporated |
| **Section 3 (Artifact Inventory)** | Reference table — does not become a standalone file. Used by operator for artifact verification. | Reference |
| **Section 4 (Wave Manifest)** | `packets/waves/wave1-m0a-contracts.yaml` — extract the YAML block as the complete file. | YAML file |
| **Section 5.1** | `packets/manifests/F-M0-003.yaml` — extract the YAML block. | YAML file |
| **Section 5.2** | `packets/manifests/F-M0-004.yaml` — extract the YAML block. | YAML file |
| **Section 5.3** | `packets/manifests/F-M0-005.yaml` — extract the YAML block. | YAML file |
| **Section 5.4** | `packets/manifests/F-M0-006.yaml` — extract the YAML block. | YAML file |
| **Section 5.5** | `packets/manifests/F-M0-007.yaml` — extract the YAML block. | YAML file |
| **Section 6 (Context Profile)** | `packets/context-profiles/foundation-contracts.yaml` — extract the YAML block. | YAML file |
| **Section 7 (Review Model)** | Incorporated into `ops/runbooks/wave1-launch.md` review sections. The human review checklist can also be extracted as `ops/checklists/wave1-human-review.md` if the operator prefers a standalone review checklist. | Markdown file (optional) |
| **Section 8 (Validator/Evidence)** | Reference material — does not become a standalone file. Operator consults during review. May be appended to `ops/runbooks/wave1-launch.md` as an appendix. | Reference |
| **Section 9 (Launch Runbook)** | `ops/runbooks/wave1-launch.md` — extract the Markdown block as the complete file. | Markdown file |
| **Section 10 (Progression Checklist)** | `ops/wave1-progression-checklist.md` — extract the Markdown block as the complete file. | Markdown file |
| **Section 11 (Risks)** | Explanatory — does not become a standalone file. Operator reads before launch. May be appended to runbook or kept in this artifact pack as reference. | Explanatory |
| **Section 12 (Unlocks)** | Explanatory — does not become a standalone file. Informs post-Wave-1 planning without creating new wave artifacts here. | Explanatory |
| **Section 13 (This section)** | Explanatory — does not become a standalone file. | Explanatory |

### Concrete File Creation Sequence

1. Extract Section 4 YAML → `packets/waves/wave1-m0a-contracts.yaml`
2. Extract Section 5.1–5.5 YAML → `packets/manifests/F-M0-003.yaml` through `F-M0-007.yaml`
3. Extract Section 6 YAML → `packets/context-profiles/foundation-contracts.yaml`
4. Extract Section 9 Markdown → `ops/runbooks/wave1-launch.md`
5. Extract Section 10 Markdown → `ops/wave1-progression-checklist.md`
6. Update `packets/validation/packet-registry.yaml` to add F-M0-003 through F-M0-007 with status `instantiated`
7. Optionally extract Section 7 review checklist → `ops/checklists/wave1-human-review.md`
8. Keep this full artifact pack document as `plans/wave1-artifact-pack.md` for reference
