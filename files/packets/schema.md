# Packet Manifest Schema

This document describes the canonical packet manifest structure used for Forge
Wave 0 and Wave 1 packet instantiation under `files/packets/`.

The source model comes from Phase 6 packet instantiation and Phase 7 readiness
preparation. The checked-in manifests under `files/packets/manifests/` are the
practical reference for this schema.

## Purpose

Packet manifests are YAML files that are both:

- machine-readable by the orchestrator and validation tooling
- human-readable by the operator during review and launch

A packet manifest defines a single packet's identity, dependencies, scope,
references to shared manifests, and operational completion rules.

## Canonical Structure

The canonical packet manifest is organized into these major field categories:

1. Identity
2. Classification
3. Dependencies
4. Scope
5. Inputs and outputs
6. Validation, evidence, review, and context references
7. Operational controls

A typical manifest shape is:

```yaml
packet_id: F-M0-003
title: "Shared TypeScript interfaces: domain objects"
version: 1

milestone: M0a
workstream: WS-1
packet_class: foundation
risk_class: medium
activation_class: operator-launched

dependency_class_profile: interface
prerequisite_packets:
  - F-M0-001
prerequisite_artifacts:
  - path: "packages/shared/tsconfig.json"
    description: "TypeScript config must exist"
speculative_start_allowed: false

scope:
  - "packages/shared/src/types/"
out_of_scope:
  - "apps/"
protected_paths:
  - "harness/"
target_paths:
  - "packages/shared/src/types/domain.ts"

required_inputs:
  - "Approved architecture design"
expected_outputs:
  - "TypeScript type definitions"
required_docs_updates: []

validator_manifest_ref: "packets/validator-manifests/foundation.yaml"
evidence_manifest_ref: "packets/evidence-manifests/standard.yaml"
review_manifest_ref: "packets/review-manifests/human-required.yaml"
prompt_template_ref: "packets/templates/implementer-foundation.yaml"
context_pack_profile: "foundation-contracts"

benchmark_tags: []
policy_sensitivities: []
escalation_conditions:
  - "Agent attempts to write outside scope"
completion_contract:
  - "All exported types compile under strict mode"
graph_repair_hooks:
  - "If downstream packets fail, this packet may need revision"
operator_notes: |
  Human review guidance.
```

## Field Categories

### 1. Identity

Required fields:

- `packet_id`: stable packet identifier from the Phase 4 graph
- `title`: operator-readable packet title
- `version`: integer manifest version; increment on graph-repair revision

Rules:

- `packet_id` must remain stable for the same packet lineage.
- Structurally different repairs should use a new packet ID, not mutate meaning in place.
- `version` starts at `1` and increments when graph repair changes the manifest.

### 2. Classification

Required fields:

- `milestone`
- `workstream`
- `packet_class`
- `risk_class`
- `activation_class`

Current canonical `packet_class` set from the design docs:

- `foundation`
- `interface`
- `implementation`
- `integration`
- `validation`
- `documentation`
- `policy-sensitive`
- `graph-repair`

Wave 0 and Wave 1 currently use `foundation` packets.

### 3. Dependencies

Required fields:

- `dependency_class_profile`
- `prerequisite_packets`
- `prerequisite_artifacts`
- `speculative_start_allowed`

Purpose:

- capture graph-level prerequisites
- capture non-packet prerequisites such as required files
- tell the operator and scheduler whether speculative execution is legal

Notes:

- `prerequisite_artifacts` is a list of objects with `path` and `description`.
- For foundation packets, `speculative_start_allowed` should be `false`.

### 4. Scope

Required fields:

- `scope`
- `out_of_scope`
- `protected_paths`
- `target_paths`

Purpose:

- `scope` sets the outer writable boundary for the packet
- `target_paths` define the expected inner change set
- `out_of_scope` records areas that must not be modified
- `protected_paths` identify escalation-only or otherwise protected surfaces

Rules:

- `target_paths` must be within `scope`.
- `scope` and `out_of_scope` should not overlap.
- `protected_paths` should be consistent with `files/harness/policies/protected-paths.yaml`.

### 5. Inputs And Outputs

Required fields:

- `required_inputs`
- `expected_outputs`

Current manifest set also uses:

- `required_docs_updates`: list of documentation files to update when applicable

Purpose:

- document what source material the packet depends on
- define the expected artifact shape before validation and review
- make documentation obligations explicit when a packet includes doc upkeep

For the current Wave 0/Wave 1 manifests, `required_docs_updates` is present and
usually empty.

### 6. Validation, Evidence, Review, And Context References

Required fields:

- `validator_manifest_ref`
- `evidence_manifest_ref`
- `review_manifest_ref`
- `prompt_template_ref`
- `context_pack_profile`

Purpose:

- keep packet manifests small by referencing shared packet-class assets
- separate execution instructions from validator expectations and evidence rules
- allow reference-integrity checks before activation

All references should point to committed files under `files/packets/`.

### 7. Operational Controls

Required fields:

- `benchmark_tags`
- `policy_sensitivities`
- `escalation_conditions`
- `completion_contract`
- `graph_repair_hooks`
- `operator_notes`

Purpose:

- describe readiness and review expectations
- declare when the run must pause for operator attention
- define what "done" means in a machine-readable way
- note likely repair cascades for downstream packets

## Canonical Reference Pattern

Each packet manifest should reference shared packet artifacts rather than inline
their full configuration:

- validator manifests: `packets/validator-manifests/`
- evidence manifests: `packets/evidence-manifests/`
- review manifests: `packets/review-manifests/`
- context profiles: `packets/context-profiles/`
- prompt templates: `packets/templates/`

This keeps the manifest focused on packet-specific contract data.

## Wave 0 / Wave 1 Practical Notes

- Wave 0 contains one synthetic packet: `WAVE0-SYNTHETIC`.
- Wave 1 contains the first five M0a contract packets: `F-M0-003` through `F-M0-007`.
- These manifests currently use foundation-class defaults, human-required review, and the `foundation-contracts` context profile.
- Token-budget presence is a pre-activation requirement and is defined in `files/harness/policies/token-budgets.yaml`.

## Immutability Guidance

During an active run, the manifest should be treated as frozen.

Allowed only through graph repair with version update:

- scope changes
- target path changes
- prerequisite changes
- shared manifest reference changes
- completion contract changes

Not mutable in place:

- `packet_id`

Operational notes may be appended when needed, but they should not silently
change the packet's contract.

## Canonicalization Notes For Current Repo State

The Wave 0/Wave 1 manifests in this repo are close to the Phase 6 canonical
shape, with two practical notes:

- `required_docs_updates` is part of the checked-in manifest shape and should be preserved.
- Some manifests repeat `speculative_start_allowed` in the operational section; treat the dependency-section value as canonical and keep future manifests single-sourced.
