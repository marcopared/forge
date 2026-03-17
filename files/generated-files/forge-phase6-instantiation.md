# Forge Phase 6: Packet Instantiation and Operational Artifacts

**Version:** 6.0  
**Date:** March 13, 2026  
**Status:** Design Phase — Instantiation Layer  
**Prerequisites:** Phase 1-5 stack (all approved, all amendments applied)

---

# 1. Phase 6 Objective

Phase 6 answers: "What concrete artifacts must exist in the repo before the first agent touches the first packet?"

The design stack (Phases 1-5) defines what Forge is, how it validates, how it's built, how the work is decomposed, and how it rolls out. But none of those phases produce the actual files an agent reads when it starts working. Phase 6 bridges the gap between approved design and executable reality.

| Concept | What It Produces |
|---|---|
| Task graph design (Phase 4) | Packet IDs, dependencies, milestones |
| Execution planning (Phase 5) | Waves, activation rules, operator workflow |
| **Packet instantiation (this phase)** | **Manifest files, prompt templates, validator configs, runbooks, wave definitions, benchmark fixtures** |
| Packet execution (Phase 7) | Agents consuming manifests and producing code |

Without Phase 6, the operator would have a plan but no operational artifacts to execute against. Agents would have packet IDs but no context packs, no validator expectations, no evidence requirements, no prompt templates. The pipeline would exist but have nothing to feed into it.

---

# 2. Instantiation Philosophy

**Packets must become concrete artifacts, not abstract graph nodes.** A packet in the Phase 4 graph is a design concept. A packet in the repo is a manifest file with machine-readable fields that the orchestrator can consume, the operator can inspect, and agents can be given as context.

**Manifests must be both machine-readable and human-readable.** YAML is the format. Every manifest is parseable by the orchestrator and readable by the operator in a text editor. No binary formats, no proprietary schemas.

**Prompt templates are standardized but not rigid.** Templates define structure (role instructions, packet contract, policy boundaries, output format). They do not over-prescribe agent reasoning. The goal is consistent framing, not scripted behavior.

**Validator manifests are separate from prompts.** What the agent is told to do (prompt) and what the system checks afterward (validators) are independent. The agent does not need to know every validator, and the validator does not need to parse the prompt. Separation prevents gaming.

**Runbooks exist because agent-heavy systems still need human procedures.** When the pipeline breaks, when a policy escalation fires, when a graph repair is needed — the operator needs a step-by-step procedure, not a design document. Runbooks are operational, not architectural.

**Wave 0 starts only after artifact readiness.** Architecture approval is necessary but not sufficient. The pipeline needs manifests loaded, validators configured, evidence capture wired, and at least one dry-run packet ready. Artifact readiness is the gate, not design approval.

---

# 3. Canonical Packet Manifest

Every instantiated packet is a YAML file with the following structure:

```yaml
# packets/manifests/F-M0-003.yaml

packet_id: F-M0-003
title: "Shared TypeScript interfaces: domain objects"
version: 1  # incremented on graph repair

# Classification
milestone: M0a
workstream: WS-1
packet_class: foundation
risk_class: medium
activation_class: operator-launched

# Dependencies
dependency_class_profile: interface  # requires prereqs MERGED
prerequisite_packets: [F-M0-001]
prerequisite_artifacts:
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
protected_paths:
  - "harness/"
  - ".github/"
target_paths:
  - "packages/shared/src/types/domain.ts"
  - "packages/shared/src/types/index.ts"

# Inputs and Outputs
required_inputs:
  - "architecture/subsystems.md (domain model section)"
  - "architecture/task-state-machine.md"
  - "Phase 3 domain object definitions"
expected_outputs:
  - "packages/shared/src/types/domain.ts"
  - "packages/shared/src/types/index.ts"
  - "unit tests for type guards if applicable"

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
  - "type definitions incompatible with Phase 3 domain model"
  - "types exceed 500 lines"
completion_contract:
  - "all exported types compile under strict mode"
  - "types match Phase 3 domain object definitions"
  - "index.ts re-exports all types"
graph_repair_hooks:
  - "if downstream packets fail type errors, this packet may need revision"
operator_notes: "This is the first real packet. Review carefully."
```

### Field Categories

| Category | Fields | Authored vs Generated |
|---|---|---|
| **Identity** | packet_id, title, version | Generated from Phase 4 graph, version incremented on repair |
| **Classification** | milestone, workstream, packet_class, risk_class, activation_class | Authored from Phase 4 taxonomy |
| **Dependencies** | dependency_class_profile, prerequisites, speculative_start | Authored from Phase 4 graph + Phase 5 activation rules |
| **Scope** | scope, out_of_scope, protected_paths, target_paths | Authored from Phase 3 subsystem boundaries |
| **I/O** | required_inputs, expected_outputs | Authored from Phase 4 packet descriptions |
| **Validation/Evidence/Review** | manifest refs | Referenced, not inlined. Manifests are separate files. |
| **Operational** | benchmark_tags, policy_sensitivities, escalation_conditions, completion_contract, graph_repair_hooks, operator_notes | Authored per packet |

### Immutability Rules

| Field | Mutable During Run? | Mutable Via Graph Repair? |
|---|---|---|
| packet_id | No | No (new packet gets new ID) |
| scope, target_paths | No | Yes (version increment) |
| prerequisite_packets | No | Yes (version increment) |
| validator_manifest_ref | No | Yes (version increment) |
| completion_contract | No | Yes (version increment) |
| operator_notes | Yes (append only) | Yes |

---

# 4. Repo Artifact Layout

```
forge/
├── packets/
│   ├── schema.md                    # Canonical manifest schema docs
│   ├── manifests/
│   │   ├── F-M0-001.yaml           # One file per packet
│   │   ├── F-M0-002.yaml
│   │   ├── F-M0-003.yaml
│   │   └── ...
│   ├── validator-manifests/
│   │   ├── foundation.yaml          # Shared by packet class
│   │   ├── implementation.yaml
│   │   ├── interface.yaml
│   │   ├── integration.yaml
│   │   ├── security-sensitive.yaml
│   │   └── documentation.yaml
│   ├── evidence-manifests/
│   │   ├── standard.yaml            # Default evidence requirements
│   │   ├── security-enhanced.yaml
│   │   └── documentation.yaml
│   ├── review-manifests/
│   │   ├── human-required.yaml
│   │   ├── agent-review.yaml
│   │   ├── agent-plus-human.yaml
│   │   └── validator-only.yaml
│   ├── context-profiles/
│   │   ├── foundation-contracts.yaml
│   │   ├── local-implementation.yaml
│   │   ├── interface-sensitive.yaml
│   │   ├── integration.yaml
│   │   ├── security-sensitive.yaml
│   │   └── documentation.yaml
│   ├── templates/
│   │   ├── implementer-foundation.yaml
│   │   ├── implementer-local.yaml
│   │   ├── implementer-interface.yaml
│   │   ├── implementer-integration.yaml
│   │   ├── debugger.yaml
│   │   ├── reviewer.yaml
│   │   └── doc-updater.yaml
│   └── waves/
│       ├── wave0-dry-run.yaml
│       ├── wave1-m0a-contracts.yaml
│       ├── wave2-m0b-scaffolding.yaml
│       └── ...
├── ops/
│   ├── runbooks/
│   │   ├── wave0-smoke.md
│   │   ├── wave1-launch.md
│   │   ├── packet-activation.md
│   │   ├── validator-failure.md
│   │   ├── graph-repair.md
│   │   ├── speculative-freeze.md
│   │   ├── policy-escalation.md
│   │   ├── rollback.md
│   │   ├── review-overload.md
│   │   ├── runtime-instability.md
│   │   ├── benchmark-failure.md
│   │   └── cli-fallback.md
│   ├── checklists/
│   │   ├── packet-readiness.md
│   │   ├── wave-readiness.md
│   │   ├── pre-launch.md
│   │   └── post-wave-review.md
│   ├── escalation-matrix.md
│   └── operator-daily-loop.md
├── benchmarks/
│   ├── fixtures/
│   │   ├── crud-app/               # Benchmark repo fixture
│   │   └── wave0-synthetic/        # Dry-run synthetic packet
│   └── manifests/
│       ├── crud-app.yaml
│       └── wave0-smoke.yaml
└── harness/
    └── policies/
        ├── blessed-stack.yaml       # ESLint, tsconfig, architecture rules
        ├── shell-allowlist.yaml
        ├── network-allowlist.yaml
        ├── protected-paths.yaml
        └── token-budgets.yaml
```

### What Lives Where

| Directory | Durability | Authorship | Purpose |
|---|---|---|---|
| `packets/manifests/` | Durable, versioned | Generated from Phase 4, manually reviewed | One manifest per packet |
| `packets/validator-manifests/` | Durable | Authored per class | Shared validator configs by packet class |
| `packets/evidence-manifests/` | Durable | Authored per class | Evidence requirements by packet class |
| `packets/review-manifests/` | Durable | Authored per review mode | Review mode definitions |
| `packets/context-profiles/` | Durable | Authored per class | Context-pack assembly rules |
| `packets/templates/` | Durable | Authored per role × class | Prompt/input structure templates |
| `packets/waves/` | Durable, versioned | Authored per rollout wave | Wave definitions |
| `ops/runbooks/` | Durable | Manually authored | Operator procedures |
| `ops/checklists/` | Durable | Manually authored | Pre-launch and readiness checks |
| `benchmarks/` | Durable | Manually authored | Eval fixtures and manifests |
| `harness/policies/` | Durable | Authored, human-approved | Policy-as-code configs |

---

# 5. Packet-Class Manifest Variants

| Class | Extra Fields | Default Validators | Mandatory Evidence | Default Review | Speculative Start | Human Launch |
|---|---|---|---|---|---|---|
| **Foundation** | `contract_consumers` (who depends on this) | Compilation, lint, type-check | Diff, compilation, type-check | Human required | No | Yes |
| **Interface** | `consuming_subsystems`, `providing_subsystem` | Compilation, lint, type-check, consumer-import check | Diff, compilation, consumer compat | Agent + human (early), agent (later) | No | Yes (early) |
| **Implementation** | (standard) | Full 4-layer pipeline | Full standard evidence | Agent review | Yes (for loose deps) | No (auto after Wave 2) |
| **Integration** | `connected_subsystems`, `integration_test_ref` | Full pipeline + integration tests | Full + integration test results | Agent + human | No | Yes |
| **Validation** | `target_validator`, `validator_layer` | Compilation, lint, validator self-test | Diff, validator test results | Agent review | No | No |
| **Documentation** | `target_docs`, `freshness_check_scope` | Compilation (if code refs), link check, freshness | Diff, freshness check | Agent review | Yes | No |
| **Policy-sensitive** | `affected_policies`, `security_review_required` | Full pipeline + security validators + policy unit tests | Full + security scan + policy test results | Human required | No | Yes (gated) |
| **Graph-repair** | `repair_action`, `affected_packets`, `justification` | Depends on repaired packet's class | Full + repair justification | Human required | No | Yes (gated) |

---

# 6. Prompt/Input Template Architecture

Templates are structured as layered YAML that the Context Packager assembles into the final agent input. Each layer is a distinct concern:

```yaml
# Template structure (conceptual, not final wording)

layers:
  role_instructions:
    # Who you are, what you can do, what you cannot do
    # Shared across all packets for a given role
    # Varies by role (implementer vs reviewer vs debugger)

  packet_contract:
    # What this specific packet requires
    # Injected from the packet manifest
    # Includes: objective, scope, out-of-scope, completion criteria

  subsystem_constraints:
    # Architecture rules for the relevant subsystem
    # Injected from architecture docs
    # Includes: layer model, dependency directions, naming conventions

  policy_boundaries:
    # What the policy engine will enforce
    # Injected from harness/policies/
    # Includes: protected paths, shell restrictions, network restrictions

  validator_expectations:
    # What validators will check after you finish
    # Injected from validator manifest
    # Does NOT include all validators (agent shouldn't game them)
    # Includes: compilation, lint, type-check, test requirements

  evidence_requirements:
    # What must exist in your evidence bundle
    # Injected from evidence manifest

  output_structure:
    # How to format your final output
    # Structured: files to create/modify, commit message format

  retry_context:
    # Only present on repair attempts
    # Prior diff, failure report, failure classification
    # "Focus on the specific failure, not a full rewrite"

  trust_labels:
    # Applied to all context sections
    # SYSTEM (orchestrator instructions) vs HARNESS (repo docs)
    # vs CODE (source files) vs EXTERNAL (web content)
```

### What Is Shared vs. Role-Specific vs. Class-Specific

| Layer | Shared Across Roles? | Varies by Class? | Varies by Retry? |
|---|---|---|---|
| Role instructions | No (per role) | No | No |
| Packet contract | Yes | Yes (from manifest) | No |
| Subsystem constraints | Yes | Yes (different subsystems) | No |
| Policy boundaries | Yes | Partially (security-sensitive gets more) | No |
| Validator expectations | Yes | Yes (different validators per class) | No |
| Evidence requirements | Yes | Yes | No |
| Output structure | Partially (reviewers produce findings, not code) | Partially | No |
| Retry context | N/A on first attempt | No | Yes (only on repair) |
| Trust labels | Yes | No | No |

---

# 7. Role Template Families

### Implementer
- **Emphasize:** Packet contract, scope boundaries, completion criteria, output structure
- **Prohibit:** Modifying out-of-scope files, adding dependencies without escalation, modifying harness files
- **Manifest reference:** Reads packet manifest for scope and completion criteria
- **Context consumption:** Subsystem architecture doc, relevant source files, interface definitions
- **Structured output:** Files created/modified list, commit message, self-assessment of completion

### Debugger
- **Emphasize:** Failure report, prior diff, targeted minimal fix, specific error to resolve
- **Prohibit:** Full rewrites, scope expansion beyond the failing area, ignoring the failure classification
- **Manifest reference:** Same packet manifest as original, plus failure report
- **Context consumption:** Prior diff, failure report, relevant source around failure, test output
- **Structured output:** Fix diff (must be smaller than original diff), explanation of fix

### Reviewer
- **Emphasize:** Convention compliance, architecture boundary respect, test adequacy, scope drift detection
- **Prohibit:** Modifying any code (read-only role), approving without checking completion criteria
- **Manifest reference:** Packet manifest (scope, completion criteria), validator results
- **Context consumption:** Diff under review, architecture doc, coding conventions, test files
- **Structured output:** Findings list (severity, location, description), verdict (approve/request-changes)

### Doc Updater
- **Emphasize:** Accuracy against current code, freshness, no stale references
- **Prohibit:** Modifying source code, modifying harness policies
- **Context consumption:** Current code state, current docs, harness docs
- **Structured output:** Doc diff, freshness check self-assessment

---

# 8. Context-Pack Profiles

| Profile | Included | Excluded | Size Target | Trust Handling |
|---|---|---|---|---|
| **foundation-contracts** | Architecture docs (domain model, subsystem specs), Phase 3 type definitions, existing types if any | Implementation code, test code, external research | Small (< 30% context window) | SYSTEM + HARNESS only |
| **local-implementation** | Packet manifest, subsystem architecture doc, relevant source files (in scope), interface imports, coding conventions | Other subsystem code, research docs, benchmark docs | Medium (< 50%) | SYSTEM + HARNESS + CODE |
| **interface-sensitive** | Both subsystem architecture docs, existing interface definitions, consumer code samples | Internal implementation of either subsystem | Medium (< 50%) | SYSTEM + HARNESS + CODE |
| **integration** | Both subsystem docs, interface definitions, both sides' implementation, integration test examples | Unrelated subsystems | Large (< 60%) | SYSTEM + HARNESS + CODE |
| **security-sensitive** | Full policy set, security eval requirements, permission matrix, affected code | Unrelated subsystems | Medium (< 50%) | SYSTEM + HARNESS + CODE |
| **documentation** | Current code state, current docs, harness docs | Test code, benchmark code | Small (< 30%) | SYSTEM + HARNESS + CODE |

### Retry-Time Additions

On repair attempts, the profile adds:
- Prior diff (the attempt that failed)
- Failure report (structured validator output)
- Repair attempt number
- If attempt > 1: prior repair diffs

These replace "general context" — the agent should focus on the failure, not re-read everything.

---

# 9. Validator Manifest Design

```yaml
# packets/validator-manifests/implementation.yaml

validator_set:
  layer_1_correctness:
    - id: compilation
      tool: run_typecheck
      blocking: true
      order: 1
    - id: lint
      tool: run_lint
      blocking: true
      order: 2
    - id: unit_tests
      tool: run_tests
      scope: affected
      blocking: true
      order: 3
    - id: architecture_check
      tool: run_lint  # architecture rules are ESLint rules
      scope: full
      blocking: true
      order: 4
    - id: file_structure
      tool: custom_validator
      blocking: true
      order: 5
    - id: boot_check
      tool: boot_app
      blocking: true
      condition: "code_changed"
      order: 6

  layer_2_security:
    - id: secret_scan
      tool: scan_secrets
      blocking: true
      order: 7
    - id: dependency_scan
      tool: scan_dependencies
      blocking: true
      condition: "deps_changed"
      order: 8

  layer_3_policy:
    - id: scope_drift
      tool: custom_validator
      blocking: true
      order: 9
    - id: protected_paths
      tool: custom_validator
      blocking: true
      order: 10
    - id: harness_integrity
      tool: custom_validator
      blocking: true
      order: 11
    - id: policy_compliance
      tool: audit_trail_scan
      blocking: true
      order: 12

  layer_4_evidence:
    - id: evidence_completeness
      tool: evidence_check
      blocking: true
      order: 13
    - id: confidence_scoring
      tool: confidence_compute
      blocking: false  # meta-signal, not a gate
      order: 14

  agentic_review:
    - id: agent_reviewer
      type: agentic
      review_manifest_ref: "packets/review-manifests/agent-review.yaml"
      order: 15  # runs after all deterministic validators pass

execution_mode: fail-forward-within-layer
# If compilation fails, still run lint (more feedback for repair)
# If any Layer 1 fails, skip Layers 2-4 (meaningless on broken code)
```

---

# 10. Evidence Manifest Design

```yaml
# packets/evidence-manifests/standard.yaml

required:
  - type: diff
    source: git_diff
    tier: 1
  - type: compilation_status
    source: validator.compilation
    tier: 1
  - type: lint_results
    source: validator.lint
    tier: 1
  - type: test_results
    source: validator.unit_tests
    tier: 1
  - type: architecture_check
    source: validator.architecture_check
    tier: 1
  - type: scope_drift_check
    source: validator.scope_drift
    tier: 1
  - type: policy_compliance
    source: validator.policy_compliance
    tier: 1
  - type: reviewer_verdict
    source: agentic_review
    tier: 1
  - type: confidence_score
    source: validator.confidence_scoring
    tier: 1
  - type: audit_trail
    source: tool_broker
    tier: 1
  - type: cost_summary
    source: agent_runner
    tier: 1
  - type: context_pack_manifest
    source: context_packager
    tier: 1
  - type: worktree_identity
    source: runtime_manager
    tier: 1

conditional:
  - type: secret_scan_results
    source: validator.secret_scan
    condition: always
    tier: 1
  - type: dependency_scan_results
    source: validator.dependency_scan
    condition: deps_changed
    tier: 1
  - type: boot_check_results
    source: validator.boot_check
    condition: code_changed
    tier: 1
  - type: repair_history
    source: orchestrator
    condition: repair_loop_ran
    tier: 1
  - type: speculative_start_marker
    source: orchestrator
    condition: speculative_start
    tier: 1
  - type: speculative_freeze_outcome
    source: orchestrator
    condition: speculative_freeze_occurred
    tier: 1

ephemeral_unless_pinned:
  - type: raw_agent_logs
    source: agent_runner
    tier: 2
    pin_on: failure
  - type: full_test_output
    source: validator.unit_tests
    tier: 2
    pin_on: failure
  - type: shell_stdout_stderr
    source: tool_broker
    tier: 2
    pin_on: failure
```

---

# 11. Review Manifest Design

```yaml
# packets/review-manifests/agent-review.yaml

review_mode: agent
reviewer_role: reviewer
trigger: all_deterministic_validators_pass

checklist:
  - category: scope_compliance
    question: "Did the agent modify only files within declared scope?"
  - category: convention_adherence
    question: "Does the code follow naming, import, and structure conventions?"
  - category: architecture_respect
    question: "Do imports respect declared layer boundaries?"
  - category: test_adequacy
    question: "Do tests test the specification, not just the implementation?"
  - category: completion_criteria
    question: "Are all completion criteria from the packet manifest satisfied?"

escalation_triggers:
  - "reviewer finds a scope violation validators missed"
  - "reviewer identifies tautological tests"
  - "reviewer and implementer disagree after 2 review-repair cycles"

output_format:
  findings: list  # [{severity, location, description}]
  verdict: enum   # approve | request_changes
  summary: text   # 2-3 sentence summary
```

```yaml
# packets/review-manifests/human-required.yaml

review_mode: human
trigger: agent_review_complete  # human reviews after agent review
mandatory_evidence:
  - diff
  - validator_results
  - agent_reviewer_findings
  - confidence_score
```

---

# 12. Runbook Architecture

| Runbook | Purpose | Trigger | Key Steps |
|---|---|---|---|
| **wave0-smoke.md** | Verify pipeline end-to-end with synthetic packet | Before any real execution | 1. Load synthetic packet manifest. 2. Launch via CLI. 3. Verify worktree created. 4. Verify stub agent produces output. 5. Verify validators run. 6. Verify evidence captured. 7. Verify merge-back. 8. Check all metrics report correctly. |
| **wave1-launch.md** | Execute first M0a contract packets | After Wave 0 passes | 1. Verify M0a manifests loaded. 2. Launch F-M0-003 (first packet). 3. Monitor execution. 4. Review output against Phase 3 domain model. 5. Approve or request revision. 6. Repeat for F-M0-004 through F-M0-007. |
| **packet-activation.md** | Activate any packet | Packet becomes eligible | 1. Check preconditions (prereqs, validators, wave permission). 2. Verify manifest completeness. 3. Launch (auto or operator). 4. Monitor. |
| **validator-failure.md** | Handle validator failure | Any validator fails | 1. Read failure classification. 2. Check if repair loop should run. 3. If repair: verify debugger has correct context. 4. If repair exhausted: escalate. 5. If pipeline issue: pause and investigate. |
| **graph-repair.md** | Fix graph structural issues | Repeated failures indicating graph defect | 1. Identify defect type (interface mismatch, hidden coupling, wrong scope). 2. Propose repair action (split, insert, reclassify). 3. Get operator approval. 4. Apply repair. 5. Invalidate affected downstream. 6. Version graph. |
| **speculative-freeze.md** | Handle frozen speculative packets | Prerequisite merge-back failed | 1. Identify frozen packets. 2. Wait for prerequisite conflict resolution. 3. If resolved: unfreeze. 4. If prereq reverted: cancel speculative packet, requeue. |
| **policy-escalation.md** | Handle policy engine ESCALATE decisions | Policy engine returns ESCALATE | 1. Read escalation reason. 2. Inspect the tool request that triggered it. 3. Approve (if legitimate), deny (if unsafe), or re-scope (if packet contract is wrong). |
| **rollback.md** | Revert a problematic merge-back | Cross-task validation fails on merged state | 1. Identify problematic commit. 2. `git revert` on phase branch. 3. Re-run cross-task validation. 4. Requeue reverted packet with failure context. |
| **review-overload.md** | Handle review queue backup | Queue depth exceeds threshold | 1. Reduce concurrency. 2. Batch low-risk reviews. 3. Reclassify routine packets to agent-review-only if appropriate. 4. Resume concurrency after queue drains. |
| **runtime-instability.md** | Handle pipeline-level failures | Container crash, validator crash, evidence capture failure | 1. Pause all active packets. 2. Diagnose root cause. 3. Fix. 4. Run Wave 0 smoke test. 5. Resume. |
| **benchmark-failure.md** | Handle benchmark regression | Benchmark suite fails after merge | 1. Identify which merge introduced regression. 2. Revert if identified. 3. Re-run benchmark. 4. If persistent: investigate validator gap. |
| **cli-fallback.md** | Operate via CLI when frontend unavailable | Frontend not yet built (Waves 0-3) or frontend down | CLI command reference for all operator actions (from Phase 5 Amendment 5). |

---

# 13. First-Wave Instantiation Set

### What Must Be Instantiated for Wave 0

| Artifact | Purpose |
|---|---|
| `packets/manifests/WAVE0-SYNTHETIC.yaml` | Synthetic dry-run packet manifest |
| `packets/validator-manifests/foundation.yaml` | Validator config for foundation class |
| `packets/evidence-manifests/standard.yaml` | Standard evidence requirements |
| `packets/review-manifests/human-required.yaml` | Human review manifest |
| `packets/templates/implementer-foundation.yaml` | Implementer template for foundation class |
| `packets/waves/wave0-dry-run.yaml` | Wave 0 definition |
| `benchmarks/fixtures/wave0-synthetic/` | Synthetic test repo |
| `ops/runbooks/wave0-smoke.md` | Wave 0 runbook |
| `ops/checklists/pre-launch.md` | Pre-launch checklist |
| `harness/policies/blessed-stack.yaml` | ESLint, tsconfig configs |
| `harness/policies/shell-allowlist.yaml` | Shell command allowlist |
| `harness/policies/protected-paths.yaml` | Protected path definitions |
| `harness/policies/token-budgets.yaml` | Per-class token budgets |

### What Must Be Instantiated for Wave 1

All of the above, plus:

| Artifact | Purpose |
|---|---|
| `packets/manifests/F-M0-003.yaml` through `F-M0-007.yaml` | M0a contract packet manifests |
| `packets/waves/wave1-m0a-contracts.yaml` | Wave 1 definition |
| `packets/context-profiles/foundation-contracts.yaml` | Context profile for foundation packets |
| `ops/runbooks/wave1-launch.md` | Wave 1 runbook |

### What Should NOT Be Instantiated Yet

- M1+ packet manifests (wait until M0a contracts are merged and stable)
- Integration packet manifests (wait until both sides exist)
- Benchmark repo fixtures beyond Wave 0 synthetic (CRUD benchmark can be created during Wave 2-3)

---

# 14. Wave Manifest Design

```yaml
# packets/waves/wave1-m0a-contracts.yaml

wave_id: wave-1
title: "M0a Core Contracts"
status: ready  # ready | active | completed | paused

packets:
  - F-M0-003
  - F-M0-004
  - F-M0-005
  - F-M0-006
  - F-M0-007

execution_policy:
  concurrency_cap: 1  # serial
  launch_mode: operator-launched  # every packet requires operator activation
  speculative_execution: false

review_policy:
  default_review: human-required
  review_queue_cap: 3

benchmark_gates:
  pre_wave: [wave0-smoke-pass]
  post_wave: []

expansion_criteria:
  all_packets_merged: true
  first_pass_success_rate: ">= 0.5"  # at least half succeed first try
  evidence_completeness: 1.0

freeze_criteria:
  pipeline_failure: true  # any pipeline error freezes the wave
  security_alert: true

rollback_criteria:
  cross_task_validation_failure: true

success_metrics:
  target_first_pass_rate: 0.6
  target_completion_rate: 1.0
  max_graph_repairs: 2

operator_notes: |
  This is the first real wave. Every output should be reviewed carefully.
  These contracts define what everything else depends on.
  Take the time to get them right.
```

**Why waves are first-class artifacts:** Because wave policies (concurrency, review mode, expansion gates) need to be inspectable, versionable, and auditable. An informal "we'll do serial first" degrades under pressure. A committed wave manifest is a standing policy.

---

# 15. Benchmark Fixture Preparation

### Required Before Wave 0

| Fixture | Contents | Purpose |
|---|---|---|
| `benchmarks/fixtures/wave0-synthetic/` | Minimal repo with one TypeScript file, one test, package.json, tsconfig | Proves the pipeline can: dispatch, provision, execute, validate, capture evidence, merge |
| `benchmarks/manifests/wave0-smoke.yaml` | Expected outcomes: compilation passes, lint passes, test passes, evidence bundle has all required fields | Defines success criteria for the dry run |

### Required Before Wave 5 (Can Be Built During Waves 2-4)

| Fixture | Contents | Purpose |
|---|---|---|
| `benchmarks/fixtures/crud-app/` | Next.js + Prisma CRUD app with known requirements and expected output | Tests full planner → build → merge pipeline |
| `benchmarks/manifests/crud-app.yaml` | Five-dimension scoring criteria, expected validator results, expected evidence | Full benchmark scorecard definition |

### Metrics That Must Be Capturable from Wave 0

- Packet success (pass/fail)
- Validator execution (which ran, which passed)
- Evidence completeness (all required fields present)
- Audit trail completeness (all tool invocations logged)
- Policy decision log (all decisions recorded)
- Speculative-start marker (if applicable)
- Token consumption

---

# 16. Operator Artifact Set

| Artifact | Contents |
|---|---|
| `ops/checklists/pre-launch.md` | Pre-Wave 0 readiness checks: manifests loaded, policies configured, validators operational, evidence capture wired, benchmark fixture ready, CLI operational |
| `ops/checklists/packet-readiness.md` | Per-packet readiness checklist (see Section 17) |
| `ops/checklists/wave-readiness.md` | Per-wave readiness: all packets instantiated, wave manifest committed, runbook reviewed, benchmark gates met |
| `ops/checklists/post-wave-review.md` | Post-wave analysis: success metrics, failures triaged, graph repairs logged, lessons captured |
| `ops/escalation-matrix.md` | Escalation triggers → response actions → responsible party |
| `ops/operator-daily-loop.md` | The daily operator workflow from Phase 5 Section 5 |

---

# 17. Packet Readiness Checklist

Before a packet can be activated:

- [ ] Manifest file exists in `packets/manifests/`
- [ ] All required fields populated (no empty/TBD fields)
- [ ] `prerequisite_packets` are all MERGED (or appropriate gate per dependency class)
- [ ] `prerequisite_artifacts` all exist in the repo
- [ ] `validator_manifest_ref` points to an existing, valid validator manifest
- [ ] `evidence_manifest_ref` points to an existing, valid evidence manifest
- [ ] `review_manifest_ref` points to an existing, valid review manifest
- [ ] `prompt_template_ref` points to an existing template
- [ ] `context_pack_profile` is assigned and exists
- [ ] `scope` and `target_paths` are non-empty and valid
- [ ] `protected_paths` are declared
- [ ] `risk_class` and `activation_class` are assigned
- [ ] `completion_contract` has at least one mechanical check
- [ ] `policy_sensitivities` are declared (even if empty)
- [ ] `speculative_start_allowed` is explicitly set
- [ ] `operator_notes` present if risk_class > low
- [ ] Wave manifest includes this packet
- [ ] Wave's expansion criteria met (if this is a later wave)
- [ ] Token budget is within `harness/policies/token-budgets.yaml` limits for this class

---

# 18. Control-Plane Operational Artifacts

Before live execution, the control plane (CLI in early waves, UI later) must support:

| Capability | Wave 0 (CLI) | Wave 5 (UI) |
|---|---|---|
| List eligible packets | `forge packets --eligible` | Packet queue view |
| Launch packet | `forge launch {id}` | Launch button |
| Packet status | `forge status {id}` | Status badges on DAG nodes |
| Validator results | `forge evidence {id} --validators` | Validator panel in inspector |
| Evidence summary | `forge evidence {id}` | Evidence inspector pane |
| Escalation inbox | `forge escalations` | Escalation inbox view |
| Wave status | `forge wave --current` | Wave progress bar |
| Graph repair | `forge repair --packet {id} --action split` | Graph repair controls |
| Pause/resume | `forge pause --workstream {ws}` | Pause/resume buttons |
| Metrics | `forge metrics` | Metrics dashboard |
| Speculative start markers | `forge status {id} --speculative` | Speculative badge on nodes |
| Operator notes | `forge note {id} "text"` | Notes field in inspector |

---

# 19. Mutation and Versioning Rules

| Artifact | Versioning | Mid-Wave Mutation | Requires Approval |
|---|---|---|---|
| **Packet manifest** | `version` field incremented | Only via graph repair | Yes (operator) |
| **Validator manifest** | Git history | No mid-wave changes (freeze during active wave) | Yes (operator) |
| **Evidence manifest** | Git history | No mid-wave changes | Yes |
| **Review manifest** | Git history | Operator can relax (agent→human) but not tighten mid-wave | Yes |
| **Wave manifest** | Git history | Concurrency can decrease. Packets can be removed. Packets cannot be added mid-wave. | Decrease: operator. Add packets: new wave. |
| **Runbooks** | Git history | Can be updated mid-wave (operational learning) | No (operational docs) |
| **Context profiles** | Git history | No mid-wave changes | Yes |
| **Prompt templates** | Git history | Can be updated between packets (not during active execution) | Recommended review |
| **Policy files** | Git history | No mid-wave changes to active policies | Yes (always) |
| **Token budgets** | Git history | Can increase mid-wave. Cannot decrease below current active spend. | Increase: operator. Decrease: new wave. |

### Auditability

Every mutation to an operational artifact is a git commit with a structured message:

```
ops(wave-1): increase token budget for foundation class

Reason: F-M0-004 exceeded 80% budget on first attempt
Action: increased foundation base_budget from 50K to 75K
Approved-by: operator
```

---

# 20. Alpha Minimum Viable Instantiation Set

### Must Exist Before Wave 0

| Category | Count | Items |
|---|---|---|
| Packet manifests | 1 | Wave 0 synthetic packet |
| Validator manifests | 1 | Foundation class |
| Evidence manifests | 1 | Standard |
| Review manifests | 2 | Human-required, agent-review |
| Context profiles | 1 | Foundation-contracts |
| Prompt templates | 1 | Implementer-foundation |
| Wave manifests | 1 | Wave 0 |
| Runbooks | 3 | Wave 0 smoke, validator failure, CLI fallback |
| Checklists | 2 | Pre-launch, packet readiness |
| Benchmark fixtures | 1 | Wave 0 synthetic repo |
| Policy files | 4 | Blessed-stack, shell-allowlist, protected-paths, token-budgets |
| CLI commands | 6 | launch, status, evidence, escalations, pause, metrics |

### Must Exist Before Wave 1 (Added to Above)

| Category | Count | Items |
|---|---|---|
| Packet manifests | +5 | F-M0-003 through F-M0-007 |
| Wave manifests | +1 | Wave 1 |
| Runbooks | +2 | Wave 1 launch, graph repair |
| Checklists | +1 | Wave readiness |

### Can Remain Manual or Lightly Templated

- M1+ packet manifests (generated as M0a stabilizes)
- CRUD benchmark fixture (built during Waves 2-3)
- Full runbook set (built incrementally)
- UI-based control plane (CLI is sufficient through Wave 3)

---

# 21. Repo Artifacts Produced by This Phase

| Artifact | Contents |
|---|---|
| `packets/schema.md` | Canonical manifest schema with field explanations |
| `packets/manifests/WAVE0-SYNTHETIC.yaml` | Dry-run synthetic packet |
| `packets/manifests/F-M0-003.yaml` through `F-M0-007.yaml` | First real packet manifests |
| `packets/validator-manifests/foundation.yaml` | Foundation-class validator config |
| `packets/validator-manifests/implementation.yaml` | Standard implementation validator config |
| `packets/evidence-manifests/standard.yaml` | Default evidence requirements |
| `packets/review-manifests/human-required.yaml` | Human review mode |
| `packets/review-manifests/agent-review.yaml` | Agent review mode |
| `packets/context-profiles/foundation-contracts.yaml` | Foundation context assembly rules |
| `packets/templates/implementer-foundation.yaml` | Foundation implementer template |
| `packets/templates/debugger.yaml` | Debugger template |
| `packets/templates/reviewer.yaml` | Reviewer template |
| `packets/waves/wave0-dry-run.yaml` | Wave 0 definition |
| `packets/waves/wave1-m0a-contracts.yaml` | Wave 1 definition |
| `ops/runbooks/*.md` | All runbooks listed in Section 12 |
| `ops/checklists/*.md` | All checklists listed in Section 16 |
| `ops/escalation-matrix.md` | Escalation triggers and responses |
| `ops/operator-daily-loop.md` | Daily operator workflow |
| `benchmarks/fixtures/wave0-synthetic/` | Synthetic test repo |
| `benchmarks/manifests/wave0-smoke.yaml` | Wave 0 expected outcomes |
| `harness/policies/blessed-stack.yaml` | ESLint + tsconfig for blessed stack |
| `harness/policies/shell-allowlist.yaml` | Allowed shell commands |
| `harness/policies/protected-paths.yaml` | Protected path list |
| `harness/policies/token-budgets.yaml` | Per-class token budgets |

---

# 22. Open Questions for Phase 7

1. **Wave 0 execution environment.** Is the dry-run pipeline running on the same infrastructure that will host real execution, or a staging replica? Using production infra proves more but risks contamination.

2. **M0a authorship decision.** Should the five M0a contract packets (domain types, interfaces, events, action classes, evidence schema) be human-authored for maximum precision, or agent-generated with mandatory human review? The design stack provides all the specification — the question is whether an agent can faithfully translate Phase 3 specs into correct TypeScript types on first pass.

3. **Prompt template calibration.** The templates in this phase define structure, not final wording. Phase 7 must calibrate the actual wording by running against the Wave 0 synthetic packet and observing agent behavior. How many calibration iterations are expected?

4. **Token budget calibration.** The budgets in this phase are design estimates. Phase 7 must calibrate them against actual Wave 0/1 execution costs. What is the adjustment policy — automatic based on observed costs, or manual operator decision?

5. **Manifest generation tooling.** M1+ packets need manifests. Should there be a manifest generator that reads Phase 4's packet descriptions and produces YAML manifests, or should each manifest be hand-authored? At ~100 packets, hand-authoring is expensive.

6. **Operator rehearsal.** Should the operator do a full rehearsal of the Wave 1 workflow (reading runbooks, practicing CLI commands, simulating escalation handling) before real execution? This is operationally valuable but adds time.

7. **Policy rule calibration.** The blessed-stack policies (shell allowlist, network allowlist, architecture rules) are authored in this phase. Phase 7 must validate them against real agent behavior — are the allowlists too permissive or too restrictive? The Wave 0 dry run is the first real test.

8. **Speculative-start metrics.** Per the Phase 5 carry item: the `speculative_start` marker and `speculative_freeze_rate` metric must be wired into the evidence and metrics pipelines before any speculative execution happens (Wave 3+).

---

# 23. Phase 6 Decision Summary

## Recommended Packet Instantiation Model
YAML manifests in `packets/manifests/`, one per packet, machine-readable and human-readable. Manifests reference separate validator, evidence, review, and context-profile manifests. Immutable during execution; mutable only via graph repair with version increment.

## Recommended Template Architecture
Layered YAML templates: role instructions → packet contract → subsystem constraints → policy boundaries → validator expectations → evidence requirements → output structure → retry context → trust labels. Shared layers across roles; role-specific and class-specific layers composed at assembly time.

## Recommended Manifest Set
Four manifest types: validator (per class), evidence (per class), review (per mode), context-profile (per class). Each is a standalone YAML file referenced by packet manifests. Frozen during active waves.

## Recommended Runbook Set
Twelve runbooks covering: Wave 0 smoke, Wave 1 launch, packet activation, validator failure, graph repair, speculative freeze, policy escalation, rollback, review overload, runtime instability, benchmark failure, CLI fallback. Four checklists: pre-launch, packet readiness, wave readiness, post-wave review.

## Recommended First Instantiated Wave
Wave 0: one synthetic packet + pipeline smoke test. Wave 1: five M0a contract packets (F-M0-003 through F-M0-007), serial, human-reviewed. Seventeen artifacts must exist before Wave 0 starts.

## Recommended Benchmark/Eval Preparation
Wave 0 synthetic fixture + smoke manifest. CRUD benchmark fixture built during Waves 2-3. Five-dimension scoring (correctness, reliability, security, evidence, trust) applied from first benchmark run.

## Recommended Operator Artifact Set
Escalation matrix, daily operator loop, pre-launch checklist, packet readiness checklist, wave readiness checklist, post-wave review checklist. CLI command reference for Waves 0-3.

## Top Questions for Phase 7
Wave 0 execution environment, M0a authorship decision, prompt calibration iterations, token budget calibration policy, manifest generation tooling, operator rehearsal, policy rule calibration, speculative-start metrics wiring.
