# Forge Phase 7: Wave 0 Dry-Run Preparation

**Version:** 7.0  
**Date:** March 13, 2026  
**Status:** Design Phase — Pre-Launch Preparation  
**Prerequisites:** Phase 1-6 stack (all approved, all amendments and carry items applied)

---

# 1. Phase 7 Objective

Phase 7 is the final preparation phase before live execution. It turns the instantiation design (Phase 6) into concrete, validated, rehearsed artifacts. After Phase 7, a deliberate go/no-go decision determines whether Forge transitions to Phase 8 (Wave 0 launch).

| Concept | What It Produces |
|---|---|
| Packet instantiation design (Phase 6) | Schemas, artifact layout, manifest formats, template architecture |
| **First real packet generation (this phase)** | **Actual YAML manifest files for Wave 0 + Wave 1 packets** |
| **Manifest validation tooling design** | **Linter rules, dependency checker, reference integrity checker** |
| **Prompt calibration** | **Tested template wording that produces good agent behavior on synthetic inputs** |
| **Operator rehearsal** | **Practiced workflows, exercised runbooks, confirmed CLI operations** |
| **Wave 0 dry-run preparation** | **Synthetic packet, scenarios, evidence expectations, rehearsal results** |
| Wave 0 launch (Phase 8) | First live agent execution against the real pipeline |

Wave 0 launch remains outside this phase because launching is a mode change from design to operations. Phase 7 produces the readiness evidence; Phase 8 makes the go/no-go decision and executes. Mixing preparation with execution removes the clean checkpoint where the operator can say "we are ready" or "we are not ready."

---

# 2. Preparation Philosophy

**Manifest correctness is a harder blocker than prompt polish.** A bad manifest (wrong dependencies, missing validator reference, invalid scope) prevents a packet from activating at all. A mediocre prompt produces a fixable bad output. Manifest validation tooling must exist and pass before prompt calibration begins.

**Prompt calibration is empirical, not theoretical.** Templates were designed in Phase 6. Calibration means running them against synthetic inputs and observing whether agents produce outputs that match expectations. Calibration happens before live launch because the first real packets (M0a contracts) are high-leverage — getting them wrong cascades.

**Operator rehearsal catches procedural gaps that design documents miss.** The runbooks exist. The CLI commands are specified. But until the operator walks through the escalation workflow, the graph-repair procedure, and the evidence inspection flow with realistic inputs, procedural gaps remain hidden. Rehearsal surfaces them before they matter.

**Synthetic dry runs prove the pipeline, not the agents.** Wave 0's synthetic packet is not testing whether agents can write good code. It is testing whether the pipeline can: dispatch, provision, execute, validate, capture evidence, and merge. If the pipeline works, agents can be improved. If the pipeline doesn't work, agent quality is irrelevant.

---

# 3. First Real Packet Generation

## What Gets Instantiated Now

### Wave 0: Synthetic Packet (1 manifest)

`WAVE0-SYNTHETIC.yaml` — a purpose-built dry-run packet that exercises the pipeline without requiring real architectural decisions. See Section 14 for its full design.

### Wave 1: M0a Contracts (5 manifests)

| Manifest | Source | Authorship |
|---|---|---|
| `F-M0-003.yaml` (domain object types) | Phase 4 packet description + Phase 3 domain model | Generated from Phase 4 graph, manually reviewed against Phase 3 |
| `F-M0-004.yaml` (cross-subsystem contracts) | Phase 4 + Phase 3 subsystem interfaces | Generated, manually reviewed |
| `F-M0-005.yaml` (event taxonomy types) | Phase 4 + Phase 3 event model | Generated, manually reviewed |
| `F-M0-006.yaml` (action class types) | Phase 4 + Phase 3 action class taxonomy | Generated, manually reviewed |
| `F-M0-007.yaml` (evidence schema types) | Phase 4 + Phase 3 evidence pipeline | Generated, manually reviewed |

### What Remains Abstract

All M0b, M1, M2, M3, M4 packets remain as Phase 4 graph entries. They are not instantiated as manifest files until M0a contracts are merged and stable. Premature instantiation of downstream packets creates manifests that will need revision when contracts change.

## Generation Process

1. For each packet in the first set: read the Phase 4 packet description, Phase 3 subsystem spec, and Phase 6 manifest schema.
2. Generate a YAML manifest file following the canonical schema.
3. Populate all classification fields from Phase 4 taxonomy.
4. Set `dependency_class_profile` from Phase 5 activation rules.
5. Set `validator_manifest_ref`, `evidence_manifest_ref`, `review_manifest_ref` from Phase 6 class defaults.
6. Write `completion_contract` from Phase 4 acceptance criteria.
7. Run manifest validation (Section 4) against the generated manifest.
8. Operator reviews the manifest for correctness against source design docs.

---

# 4. Manifest Validation Tooling Design

## Validation Checks

| Check | What It Validates | Why It Matters | On Failure | Blocking? | When |
|---|---|---|---|---|---|
| **Schema completeness** | All required fields present, no empty/TBD values | Incomplete manifests cause runtime errors | Reject manifest | Yes | Creation + pre-activation |
| **Field type correctness** | Fields match expected types (string, list, enum) | Type errors break orchestrator parsing | Reject manifest | Yes | Creation |
| **Dependency reference integrity** | All `prerequisite_packets` IDs exist in the packet registry | Dangling references break scheduling | Reject manifest | Yes | Creation + continuous |
| **Cycle detection** | No circular dependencies in the instantiated packet set | Cycles deadlock the scheduler | Reject manifest set | Yes | On any manifest addition |
| **Validator manifest reference** | `validator_manifest_ref` points to an existing file | Missing validators mean no validation runs | Reject manifest | Yes | Creation |
| **Evidence manifest reference** | `evidence_manifest_ref` points to an existing file | Missing evidence spec means no completeness check | Reject manifest | Yes | Creation |
| **Review manifest reference** | `review_manifest_ref` points to an existing file | Missing review spec means no review mode | Reject manifest | Yes | Creation |
| **Context-pack profile validity** | `context_pack_profile` references an existing profile | Missing profile means context assembly fails | Reject manifest | Yes | Creation |
| **Wave membership consistency** | Packet is listed in exactly one active wave manifest | Orphan packets never activate; duplicate listings cause confusion | Warning | Advisory | Continuous |
| **Scope / out-of-scope consistency** | `scope` and `out_of_scope` do not overlap; `target_paths` are within `scope` | Contradictory scope breaks policy enforcement | Reject manifest | Yes | Creation |
| **Protected path declarations** | `protected_paths` is non-empty | Empty protected paths means no protection enforcement | Warning (some packets legitimately have none) | Advisory | Creation |
| **Target path validity** | `target_paths` conform to packet class rules (exact vs pattern) | Invalid paths break scope-drift detection | Reject manifest | Yes | Creation |
| **Speculative-start legality** | `speculative_start_allowed` matches packet class rules | Foundation/interface/integration should not allow speculative start | Reject manifest | Yes | Creation |
| **Policy sensitivity consistency** | `policy_sensitivities` matches packet class expectations | Security-sensitive packets must declare sensitivities | Warning | Advisory | Creation |
| **Graph repair hook validity** | `graph_repair_hooks` reference plausible repair actions | Invalid hooks provide no value | Warning | Advisory | Creation |
| **Token budget compliance** | Packet class has a defined budget in `harness/policies/token-budgets.yaml` | Missing budget means no cost guardrail | Reject manifest | Yes | Pre-activation |
| **Benchmark tag validity** | `benchmark_tags` reference existing benchmark manifests | Invalid tags break benchmark correlation | Warning | Advisory | Creation |
| **Prompt template reference** | `prompt_template_ref` points to an existing template | Missing template means no agent input | Reject manifest | Yes | Creation |

## Validation Timing

- **At creation:** All checks run when a manifest is generated or modified.
- **Pre-activation:** Blocking checks re-run before the orchestrator activates a packet.
- **Continuous:** Dependency integrity and wave membership are re-checked when any manifest in the set changes (catches cascading invalidation from graph repair).

---

# 5. Manifest Validation Artifact Set

| Artifact | Contents |
|---|---|
| `packets/validation/schema-spec.yaml` | Machine-readable schema definition: required fields, types, enums, constraints |
| `packets/validation/linter-rules.yaml` | Per-field validation rules: completeness, type, enum membership, cross-field consistency |
| `packets/validation/dependency-checker.yaml` | Rules for cycle detection, reference integrity, dependency class validation |
| `packets/validation/reference-integrity.yaml` | Rules for validator/evidence/review/context/template reference checking |
| `packets/validation/wave-checker.yaml` | Rules for wave membership, packet-wave consistency, expansion criteria validation |
| `packets/validation/scope-checker.yaml` | Rules for scope/out-of-scope/target-path/protected-path consistency |
| `packets/validation/packet-registry.yaml` | Master list of all instantiated packet IDs with status (abstract/instantiated/active/completed) |

---

# 6. Target Path and Scope Rules

### By Packet Class

| Class | target_paths Format | Example | Rationale |
|---|---|---|---|
| **Foundation** | Exact file paths | `["packages/shared/src/types/domain.ts"]` | Known, stable targets |
| **Interface** | Exact file paths | `["packages/shared/src/types/contracts.ts"]` | Single interface file |
| **Implementation** | Exact paths or single-directory pattern | `["src/orchestrator/scheduler.ts"]` or `["src/orchestrator/*.ts"]` | Usually known files, but subsystem internal structure may vary |
| **Integration** | Pattern-based within scope | `["src/orchestrator/**", "src/tool-broker/**"]` | Integration touches both sides; exact files depend on implementation |
| **Documentation** | Exact paths | `["docs/architecture/orchestrator.md"]` | Known doc files |
| **Policy-sensitive** | Exact paths | `["harness/policies/shell-allowlist.yaml"]` | Policy changes must be precisely scoped |
| **Graph-repair** | Inherited from repaired packet + pattern for new files | Varies | Repair scope depends on the defect; patterns allow flexibility within scope boundary |

### Enforcement Rules

1. `target_paths` must be a subset of `scope`. The policy engine enforces this at activation time.
2. `scope` is the outer boundary. `target_paths` is the expected inner boundary. An agent may write to any path within `scope` but scope-drift detection flags writes outside `target_paths` as warnings (not blocking for pattern-based classes, blocking for exact-path classes).
3. `protected_paths` are never writable regardless of scope or target declarations.

---

# 7. Prompt Calibration Strategy

### What Calibration Means

Calibration is the process of testing template-generated prompts against synthetic inputs and verifying that agents produce outputs matching expected characteristics. It is not prompt-engineering from scratch — the template structure is defined in Phase 6. Calibration adjusts wording, emphasis, and constraint phrasing within that structure.

### Calibration Process

1. **Generate synthetic prompt.** Assemble a complete prompt from template + manifest + context-pack profile for the Wave 0 synthetic packet.
2. **Execute against model.** Send the prompt to the model (same model that will be used in production).
3. **Evaluate output.** Check: Did the agent produce files in the expected format? Did it stay within scope? Did it produce structured output? Did it attempt forbidden actions?
4. **Adjust template.** If output deviated: adjust role instructions, constraint phrasing, output format instructions. Do not change the template architecture — only the wording within layers.
5. **Repeat.** 3-5 calibration iterations per role template family. Convergence means: agent behavior matches expectations on 3 consecutive runs.
6. **Document.** Record the calibration results: what was adjusted, why, what the final wording achieves.

### Calibration by Role

| Role | Calibration Focus | Key Question |
|---|---|---|
| **Implementer** | Does the agent produce files within scope, with correct structure, matching the completion contract? | "Did it write the right files in the right place with the right content shape?" |
| **Debugger** | Does the agent produce minimal targeted fixes, not full rewrites? | "Is the fix diff smaller than the original diff?" |
| **Reviewer** | Does the agent produce structured findings and a clear verdict? | "Are findings actionable, or vague 'looks good' approvals?" |
| **Doc updater** | Does the agent update docs accurately against current code? | "Are updates accurate, or are they plausible-sounding but wrong?" |
| **Graph-repair proposer** | Does the agent propose valid repair actions with correct justification? | "Is the proposed repair structurally valid and well-scoped?" |
| **Agentic security reviewer** | Does the agent correctly identify policy violations and unsafe patterns? | "Does it catch real issues, or produce false positives?" |

### Invariants (Do Not Calibrate Away)

- Trust-label separation (SYSTEM/HARNESS/CODE/EXTERNAL) — structure, not wording
- Scope constraint declarations — always present
- Tool permission declarations — always present
- Output structure requirements — always present
- Retry context format — always present on repair attempts

---

# 8. Template Family Completion

### Graph-Repair Proposer

| Property | Definition |
|---|---|
| **Objective** | Analyze a failed or structurally defective packet and propose a repair action |
| **Inputs** | Failed packet manifest, failure evidence, dependency graph excerpt, repair action taxonomy |
| **Outputs** | Structured repair proposal: action type (split/insert/reclassify/revise), affected packets, new manifests (draft), justification |
| **Must never** | Execute repairs directly, modify existing manifests, bypass operator approval |
| **Trust labels** | SYSTEM (repair instructions) + HARNESS (architecture docs) + CODE (failed packet evidence) |
| **Validator hooks** | Repair proposal must reference valid packet IDs, proposed action must be in the repair taxonomy, affected downstream list must be complete |
| **Eligible packet classes** | Graph-repair packets only |

### Agentic Security Reviewer

| Property | Definition |
|---|---|
| **Objective** | Review code changes for security issues beyond what deterministic scanners catch |
| **Inputs** | Diff, architecture doc, policy set, security eval criteria |
| **Outputs** | Structured security findings: severity, location, description, recommendation. Verdict: pass/flag/escalate |
| **Must never** | Modify code, approve in place of human for security-sensitive packets, override deterministic security validators |
| **Trust labels** | SYSTEM (review instructions) + HARNESS (policies, security criteria) + CODE (diff under review) |
| **Validator hooks** | Findings must have severity classification, flagged items must reference specific code locations |
| **Eligible packet classes** | Security-sensitive, policy-sensitive, integration (when touching security-relevant code) |

---

# 9. Context-Pack Calibration

### Per-Profile Verification

For each context-pack profile, verify before Wave 0:

| Check | Method |
|---|---|
| **Includes right artifacts** | Generate a context pack for the Wave 0 synthetic packet. Verify AGENTS.md, architecture doc, and relevant source files are present. |
| **Excludes unsafe artifacts** | Verify no files from `protected_paths` appear in the CODE section without explicit permission. Verify no cross-worktree files leak in. |
| **Trust separation correct** | Verify SYSTEM section contains only orchestrator instructions. Verify HARNESS, CODE, EXTERNAL sections are correctly labeled. No repo content appears in SYSTEM. |
| **No context bloat** | Measure token count. Verify < 60% of model context window. If over, check for unnecessary files. |
| **No critical omission** | For the synthetic packet: verify the interface definitions it needs are present. For M0a packets: verify Phase 3 spec excerpts are included. |
| **Retry context differs** | Generate a retry context pack (with synthetic failure report). Verify it includes failure report and prior diff but reduces general context to stay within budget. |

---

# 10. Evidence Preparation for Wave 0

### What Wave 0 Must Produce

| Evidence Item | Expected Value | Verification |
|---|---|---|
| Diff | Synthetic file created in worktree | Git diff shows exactly one new file |
| Compilation status | PASS | `tsc --noEmit` exit 0 |
| Lint results | PASS | ESLint exit 0 |
| Test results | PASS (1 test) | Vitest passes |
| Architecture check | PASS | No boundary violations |
| Scope-drift check | PASS | No out-of-scope writes |
| Policy compliance | PASS | All tool invocations ALLOW in audit trail |
| Evidence completeness | PASS | All required fields present in bundle |
| Confidence score | > 0.9 | High confidence on a trivial packet |
| Audit trail | Complete | Every tool invocation logged with action class, target, result |
| Cost summary | Recorded | Token count, duration, model used |
| Context pack manifest | Recorded | Files included, token count, trust labels |
| Worktree identity | Recorded | Branch name, base commit hash |
| Speculative start marker | false | Wave 0 is not speculative |

### What the Operator Should Inspect

During rehearsal, the operator walks through the evidence bundle and verifies:
1. Every required item is present (evidence completeness validator would have caught gaps, but the operator should see it firsthand).
2. The audit trail shows the expected tool invocation sequence.
3. The diff matches what the synthetic packet was supposed to produce.
4. The policy decisions are all ALLOW (no unexpected denials or escalations).
5. The confidence score formula produced a reasonable number.

---

# 11. Review Preparation Artifacts

| Artifact | Contents | Used During |
|---|---|---|
| **Review checklist (human, foundation)** | Scope compliance, contract fidelity to Phase 3, type correctness, naming conventions, re-export completeness | Wave 1 human review |
| **Review checklist (agent, implementation)** | Convention adherence, architecture respect, test adequacy, completion criteria satisfaction | Wave 2+ agent review |
| **Evidence summary template** | One-page format: packet ID, validator results (pass/fail), confidence, diff size, files touched, key findings | All reviews |
| **Escalation note format** | Structured: trigger, affected packet, severity, recommended action, operator decision | Policy escalations |
| **Graph-repair proposal format** | Structured: defect description, proposed action, affected packets, justification, downstream impact | Graph repair reviews |
| **Operator approval note format** | Structured: packet ID, decision (approve/reject/revise), rationale, conditions (if conditional approval) | All human approvals |

---

# 12. Dry-Run Scenario Design

| Scenario | What It Tests | Artifacts Needed | Operator Action | Good Behavior |
|---|---|---|---|---|
| **Happy-path synthetic run** | Full pipeline end-to-end | Synthetic packet, all manifests, pipeline | Launch, observe, verify evidence | Packet completes, evidence complete, merge-back succeeds |
| **Validator failure** | Repair loop trigger and handling | Synthetic packet modified to fail lint | Observe repair loop, verify debugger is invoked | Repair loop runs, failure classified, fix applied, re-validation passes |
| **Evidence incompleteness** | Evidence completeness validator blocks | Synthetic packet with evidence capture intentionally degraded | Observe blocking, verify packet cannot advance | Packet stuck in AWAITING_VALIDATION, evidence completeness check fails |
| **Policy escalation** | Escalation workflow | Synthetic packet that triggers a protected-path write | Receive escalation, approve or deny via CLI | Escalation appears in queue, operator decision recorded, packet proceeds or blocks |
| **Manifest invalidation** | Manifest linter catches bad manifest | Malformed manifest (missing required field) | Attempt to activate, verify rejection | Activation rejected with specific error message |
| **CLI fallback** | All operator actions via CLI | All CLI commands | Execute every CLI command at least once | All commands produce expected output |
| **Operator shift handoff** | Handoff note creation | Handoff note template | Write a handoff note, verify it captures state | Another operator (or same operator next day) can understand system state from the note |

### Scenarios Deferred to Post-Wave-0

- Speculative freeze (requires concurrent execution, which Wave 0 doesn't have)
- Graph repair insertion (requires a real graph defect, not synthetically useful in Wave 0)
- Benchmark alert (requires benchmark suite, which runs in Wave 5)

---

# 13. Operator Rehearsal Design

### Participants
The operator (Marco). If another person is available, they act as "observer" and note procedural gaps.

### Rehearsal Stages

| Stage | Duration | What Gets Practiced |
|---|---|---|
| **1. Pre-launch walkthrough** | 30 min | Walk through pre-launch checklist. Verify all artifacts exist. Verify CLI commands work. |
| **2. Happy-path dry run** | 1 hour | Launch synthetic packet. Observe execution. Inspect evidence. Verify merge-back. |
| **3. Failure scenario runs** | 1-2 hours | Run each dry-run scenario from Section 12. Practice each runbook at least once. |
| **4. Review workflow practice** | 30 min | Practice reviewing a completed packet: read evidence summary, inspect diff, check validator results, write approval note. |
| **5. Debrief and gap recording** | 30 min | Document: what worked, what was confusing, what runbooks need revision, what CLI commands were missing or unclear. |

### Rehearsal Success Criteria

- [ ] All CLI commands executed successfully
- [ ] Synthetic packet completed end-to-end
- [ ] Evidence bundle was manually inspected and verified complete
- [ ] At least one failure scenario was handled following the runbook
- [ ] At least one escalation was processed through the CLI
- [ ] Operator can describe the system state at any point during rehearsal
- [ ] No runbook gaps that would block live operations were found (or all found gaps were fixed)
- [ ] Debrief notes are recorded in `ops/rehearsal-notes.md`

---

# 14. Synthetic Wave 0 Packet

```yaml
packet_id: WAVE0-SYNTHETIC
title: "Synthetic dry-run: create a hello-world TypeScript module"
version: 1

milestone: M0-synthetic
workstream: WS-0-synthetic
packet_class: foundation
risk_class: low
activation_class: operator-launched

dependency_class_profile: none
prerequisite_packets: []
prerequisite_artifacts:
  - path: "packages/shared/tsconfig.json"
speculative_start_allowed: false

scope:
  - "packages/shared/src/synthetic/"
out_of_scope:
  - "everything else"
protected_paths:
  - "harness/"
  - ".github/"
target_paths:
  - "packages/shared/src/synthetic/hello.ts"
  - "packages/shared/src/synthetic/hello.test.ts"

required_inputs:
  - "tsconfig.json"
expected_outputs:
  - "packages/shared/src/synthetic/hello.ts (exports a greet function)"
  - "packages/shared/src/synthetic/hello.test.ts (one passing test)"

validator_manifest_ref: "packets/validator-manifests/foundation.yaml"
evidence_manifest_ref: "packets/evidence-manifests/standard.yaml"
review_manifest_ref: "packets/review-manifests/human-required.yaml"
prompt_template_ref: "packets/templates/implementer-foundation.yaml"
context_pack_profile: "foundation-contracts"

completion_contract:
  - "hello.ts exports a greet(name: string): string function"
  - "hello.test.ts contains at least one passing test"
  - "tsc --noEmit passes"
  - "eslint passes"
  - "vitest passes"

operator_notes: |
  This is a pipeline test, not a code quality test.
  The output should be trivial. The value is proving the pipeline works.
```

### What It Exercises

- Manifest loading and parsing
- Worktree provisioning
- Context-pack assembly
- Agent invocation (model call, tool calls)
- Tool broker routing (file_write, git_commit, run_tests, run_typecheck, run_lint)
- Policy engine evaluation (all tool calls should ALLOW)
- Validator pipeline (all four layers)
- Evidence bundle assembly and completeness check
- Merge-back to phase branch
- Audit trail completeness

### What It Intentionally Does Not Exercise

- Complex architectural decisions
- Cross-subsystem interfaces
- Concurrent execution
- Speculative starts
- Repair loops (unless the agent fails, which is informative but not the goal)
- Security scanning (no dependencies involved)

---

# 15. First Real Packet Preparation Set

After the synthetic packet, prepare these for Wave 1:

| Packet | Why First | Safe Because | Unlocks | Wave |
|---|---|---|---|---|
| **F-M0-003** (domain types) | Everything imports these | Pure type definitions, no logic, small scope | All workstreams | Wave 1 |
| **F-M0-004** (cross-subsystem contracts) | Policy, tool, validator interfaces | Pure type definitions, references Phase 3 specs | WS-2, WS-3, WS-5, WS-6, WS-8 | Wave 1 |
| **F-M0-005** (event taxonomy) | Event types for orchestrator, audit, UI | Pure type definitions | WS-2, WS-11, WS-13 | Wave 1 |
| **F-M0-006** (action class types) | Policy engine and tool broker depend on these | Pure type definitions | WS-3, WS-5 | Wave 1 |
| **F-M0-007** (evidence schema) | Validator and evidence pipeline depend on these | Pure type definitions | WS-8, WS-9 | Wave 1 |

### Before These Can Move from "Prepared" to "Launchable"

- [ ] Wave 0 synthetic run completed successfully
- [ ] Manifest validation passes for all five manifests
- [ ] Wave 1 manifest is authored and validated
- [ ] Operator rehearsal is complete
- [ ] Go/no-go criteria are satisfied (Section 17)

---

# 16. Wave Manifest Authoring Rules

### Wave 0 vs Wave 1

| Field | Wave 0 | Wave 1 |
|---|---|---|
| packets | `[WAVE0-SYNTHETIC]` | `[F-M0-003, F-M0-004, F-M0-005, F-M0-006, F-M0-007]` |
| concurrency_cap | 1 | 1 (serial) |
| launch_mode | operator-launched | operator-launched |
| review_mode | human-required | human-required |
| speculative_execution | false | false |
| benchmark_gates.pre_wave | `[]` (first wave) | `[wave0-smoke-pass]` |
| expansion_criteria | Synthetic packet completes with full evidence | All 5 packets merged, first-pass success ≥ 50%, evidence completeness = 100% |
| freeze_criteria | Any pipeline failure | Any pipeline failure, any security alert |
| rollback_criteria | N/A (synthetic, nothing to roll back) | Cross-task validation failure |

### Dependency-Class-Aware Activation in Wave Manifests

Wave 1 uses `dependency_class_profile: interface` for all packets (they define contracts — prereqs must be MERGED). Wave 2+ manifests should declare per-packet dependency class profiles, allowing speculative starts for loose-dependency packets.

---

# 17. Go / No-Go Readiness Model

### Blocking Criteria (Must Pass)

| Category | Criterion |
|---|---|
| **Packet manifests** | Wave 0 synthetic + all 5 Wave 1 manifests pass schema validation |
| **Manifest validation tooling** | Schema checker, dependency checker, and reference integrity checker all operational |
| **Validator manifests** | Foundation and standard implementation validator manifests exist and reference valid tools |
| **Evidence manifests** | Standard evidence manifest exists and lists all required fields |
| **Review manifests** | Human-required and agent-review manifests exist |
| **Wave manifests** | Wave 0 and Wave 1 manifests exist and pass wave-checker validation |
| **Prompt templates** | Implementer-foundation template exists and has been calibrated (≥ 3 synthetic runs with acceptable output) |
| **CLI fallback** | All 12 CLI commands from Phase 5 Amendment 5 are operational |
| **Benchmark fixtures** | Wave 0 synthetic repo exists with expected outcomes defined |
| **Security controls** | Policy engine loads blessed-stack policies. Shell allowlist, protected paths, and token budgets are configured. |
| **Policy engine** | Responds correctly to synthetic ALLOW/DENY/ESCALATE test cases |
| **Operator rehearsal** | Rehearsal completed. All scenarios from Section 12 exercised. No unresolved blocking gaps. |
| **Synthetic dry-run** | Wave 0 synthetic packet has been executed at least once in rehearsal with full evidence captured |
| **Escalation coverage** | At least one escalation scenario tested during rehearsal |
| **Metrics visibility** | `forge metrics` CLI command produces output for all Phase 5 operational metrics |

### Advisory Criteria (Should Pass, Not Blocking)

| Category | Criterion |
|---|---|
| **Debugger template** | Calibrated, but less critical for Wave 1 (M0a contracts are unlikely to need repair loops) |
| **Reviewer template** | Calibrated, but Wave 1 uses human review, not agent review |
| **Graph-repair template** | Drafted, but graph repair is unlikely in Wave 1 |
| **CRUD benchmark fixture** | Not needed until Wave 5 |
| **Full runbook set** | Wave 0 smoke, Wave 1 launch, validator failure, and CLI fallback runbooks must exist. Others can be drafted. |

---

# 18. Phase 7 Operational Artifact Set

| Artifact | Contents |
|---|---|
| `packets/manifests/WAVE0-SYNTHETIC.yaml` | Synthetic dry-run packet manifest |
| `packets/manifests/F-M0-003.yaml` through `F-M0-007.yaml` | First 5 real packet manifests |
| `packets/validation/schema-spec.yaml` | Machine-readable manifest schema |
| `packets/validation/linter-rules.yaml` | Per-field validation rules |
| `packets/validation/dependency-checker.yaml` | Cycle detection and reference integrity rules |
| `packets/validation/reference-integrity.yaml` | Validator/evidence/review/context ref checks |
| `packets/validation/wave-checker.yaml` | Wave membership and consistency rules |
| `packets/validation/scope-checker.yaml` | Scope/target-path/protected-path rules |
| `packets/validation/packet-registry.yaml` | Master list of packet IDs with status |
| `packets/waves/wave0-dry-run.yaml` | Wave 0 manifest |
| `packets/waves/wave1-m0a-contracts.yaml` | Wave 1 manifest |
| `packets/templates/implementer-foundation.yaml` | Calibrated foundation implementer template |
| `packets/templates/debugger.yaml` | Debugger template (drafted, calibrated if time) |
| `packets/templates/reviewer.yaml` | Reviewer template (drafted, calibrated for Wave 2+) |
| `packets/templates/graph-repair-proposer.yaml` | Graph-repair proposer template (drafted) |
| `packets/templates/security-reviewer.yaml` | Security reviewer template (drafted) |
| `packets/context-profiles/foundation-contracts.yaml` | Calibrated context profile for M0a |
| `benchmarks/fixtures/wave0-synthetic/` | Synthetic test repo |
| `benchmarks/manifests/wave0-smoke.yaml` | Wave 0 expected outcomes |
| `ops/runbooks/wave0-smoke.md` | Wave 0 dry-run runbook |
| `ops/runbooks/wave1-launch.md` | Wave 1 launch runbook |
| `ops/runbooks/validator-failure.md` | Validator failure handling |
| `ops/runbooks/cli-fallback.md` | CLI command reference |
| `ops/checklists/pre-launch.md` | Pre-Wave-0 readiness checklist |
| `ops/checklists/go-no-go.md` | Go/no-go criteria checklist |
| `ops/rehearsal-notes.md` | Operator rehearsal debrief |
| `harness/policies/blessed-stack.yaml` | ESLint + tsconfig + architecture rules |
| `harness/policies/shell-allowlist.yaml` | Allowed shell commands |
| `harness/policies/protected-paths.yaml` | Protected path list |
| `harness/policies/token-budgets.yaml` | Per-class token budgets |

---

# 19. Repo Layout for Phase 7 Outputs

All Phase 7 outputs live within the existing layout from Phase 6, with additions:

```
packets/
  validation/          # NEW: manifest validation tooling specs
    schema-spec.yaml
    linter-rules.yaml
    dependency-checker.yaml
    reference-integrity.yaml
    wave-checker.yaml
    scope-checker.yaml
    packet-registry.yaml

ops/
  checklists/
    go-no-go.md        # NEW: go/no-go criteria
  rehearsal-notes.md    # NEW: rehearsal debrief
```

All other outputs fit into the layout defined in Phase 6 Section 4.

---

# 20. Mutation/Versioning Rules for Prepared Artifacts

| Artifact | May Change Before Wave 0? | May Change Between Wave 0 and Wave 1? | Requires Re-Validation? | Requires Rehearsal Reset? |
|---|---|---|---|---|
| **Packet manifests** | Yes (calibration adjustments) | Minor edits (operator notes, completion criteria tuning) | Yes | No (unless scope or deps change) |
| **Validator manifests** | Yes (calibration) | Frozen during active wave | Yes | No |
| **Evidence manifests** | Yes | Frozen | Yes | No |
| **Prompt templates** | Yes (this is what calibration produces) | May adjust between waves based on Wave 0 observations | No (templates are input, not structural) | No |
| **Wave manifests** | Yes (authoring) | May reduce concurrency or remove packets. May not add packets. | Yes for structural changes | Yes if freeze/rollback criteria change |
| **Runbooks** | Yes (operational learning) | Yes (operational learning from Wave 0) | No | No |
| **Policy files** | Yes (calibration) | Frozen during active wave | Yes | Yes (policy changes affect all behavior) |
| **Benchmark fixtures** | Yes | No (fixtures are immutable once used) | N/A | N/A |

### What Invalidates Go/No-Go Readiness

If any of the following change after go/no-go criteria were last verified, readiness must be re-verified:
- Any packet manifest in the Wave 0/1 set
- Any validator manifest referenced by those packets
- Any policy file
- Wave 0 or Wave 1 manifest
- Manifest validation tooling rules

Changes to runbooks, prompt templates, or operator notes do not invalidate readiness.

---

# 21. Minimal Viable Phase 7 Completion Set

**Forge is ready for a go/no-go decision when:**

- [ ] Synthetic packet manifest exists and passes validation
- [ ] 5 Wave 1 packet manifests exist and pass validation
- [ ] Manifest validation tooling (schema checker + dependency checker + reference integrity) is operational
- [ ] Foundation validator manifest exists and tools are operational
- [ ] Standard evidence manifest exists
- [ ] Human-required and agent-review manifests exist
- [ ] Wave 0 and Wave 1 manifests exist and pass wave checker
- [ ] Implementer-foundation template is calibrated (3+ acceptable synthetic runs)
- [ ] Foundation-contracts context-pack profile is calibrated
- [ ] Wave 0 synthetic repo fixture exists
- [ ] All blessed-stack policy files are authored and loaded
- [ ] CLI fallback is operational (all 12 commands)
- [ ] Operator rehearsal is complete with no unresolved blocking gaps
- [ ] Synthetic dry-run has been executed successfully at least once
- [ ] Go/no-go checklist passes all blocking criteria

---

# 22. Open Questions for Phase 8

1. **Live infrastructure readiness.** Is the production pipeline (containers, Redis, PostgreSQL, S3, model API keys) provisioned and healthy? Wave 0 rehearsal may have used staging — production must be verified.

2. **M0a authorship mode.** The go/no-go decision includes launching Wave 1 with real M0a packets. The operator must decide: are agents generating these types from Phase 3 specs, or is the operator hand-authoring them and using agents only for validation? This decision should be made before launch, not during.

3. **First-failure response protocol.** When the first real packet fails (and it will), the operator needs a pre-decided response: how long to investigate before retrying, when to pause the wave, when to declare the failure a graph defect vs. a prompt issue vs. a pipeline issue. This should be written into the Wave 1 runbook.

4. **Token budget calibration from Wave 0 data.** Wave 0 will produce actual token consumption data. The operator should review it and adjust `harness/policies/token-budgets.yaml` before Wave 1 if the synthetic packet's consumption was significantly above or below the configured budget.

5. **Observation cadence.** During Wave 1, how often does the operator check status? Every packet completion? Twice daily? The rehearsal should have surfaced a natural cadence, but it should be explicitly decided.

6. **Wave 1 → Wave 2 transition criteria.** Phase 5 defines expansion criteria. But the specific decision — "M0a is stable enough to start M0b and first M1 packets" — requires the operator to assess contract quality, not just metric thresholds. What does that assessment look like?

7. **Speculative-start metrics wiring.** The `speculative_start` marker and `speculative_freeze_rate` metric (Phase 5 carry) must be wired into evidence and metrics before Wave 3 (first wave with concurrency). Confirm this is ready.

---

# 23. Phase 7 Decision Summary

## Recommended First Packet Generation Set
One synthetic packet (WAVE0-SYNTHETIC) + five M0a contract packets (F-M0-003 through F-M0-007). Generated from Phase 4 graph, validated against manifest schema, manually reviewed against Phase 3 specs.

## Recommended Manifest Validation Approach
Seven validation artifact files covering: schema completeness, field types, dependency integrity, cycle detection, reference integrity, wave consistency, and scope/path rules. Validation runs at creation, pre-activation, and continuously on graph changes.

## Recommended Prompt Calibration Approach
3-5 synthetic runs per role template. Adjust wording within the Phase 6 template architecture, not the architecture itself. Convergence = acceptable output on 3 consecutive runs. Implementer-foundation template is the priority; debugger and reviewer are drafted, calibrated if time permits.

## Recommended Operator Rehearsal Model
Four-stage rehearsal (~3-4 hours): pre-launch walkthrough, happy-path dry run, failure scenarios, review workflow practice. Debrief notes recorded. Success criteria: all CLI commands work, synthetic packet completes, at least one failure scenario handled, no unresolved blocking gaps.

## Recommended Wave 0 Synthetic Packet
Creates a hello-world TypeScript module. Exercises: manifest loading, worktree provisioning, agent invocation, tool broker routing, policy engine evaluation, four-layer validation, evidence bundle assembly, merge-back, audit trail. Intentionally trivial code; value is proving the pipeline.

## Recommended Go/No-Go Readiness Model
Fifteen blocking criteria across: manifests, validation tooling, templates, CLI, benchmarks, security controls, rehearsal, and synthetic dry-run. Five advisory criteria for less critical templates and runbooks. Go/no-go readiness is invalidated by changes to manifests, validators, policies, or wave definitions after last verification.

## Required Artifacts for Transition to Phase 8
Thirty-one artifacts across packets/, ops/, benchmarks/, and harness/. See Section 18 for the complete list.

## Top Open Questions for Live Launch
Live infrastructure readiness, M0a authorship mode, first-failure response protocol, token budget calibration from Wave 0 data, observation cadence, Wave 1 → Wave 2 transition assessment, speculative-start metrics wiring.
