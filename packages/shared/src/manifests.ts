export type PacketClass =
  | "foundation"
  | "interface"
  | "implementation"
  | "integration"
  | "validation"
  | "documentation"
  | "policy-sensitive"
  | "graph-repair";

export type RiskClass = "low" | "medium" | "high";

export type ActivationClass = "operator-launched" | "auto" | "gated-auto";

export type PacketRegistryStatus =
  | "abstract"
  | "instantiated"
  | "ready"
  | "active"
  | "merged"
  | "completed"
  | "paused";

export type WaveStatus =
  | "ready"
  | "active"
  | "completed"
  | "paused"
  | "frozen"
  | "aborted";

export interface PacketPrerequisiteArtifact {
  path: string;
  description: string;
}

export interface PacketManifest {
  packet_id: string;
  title: string;
  version: number;
  milestone: string;
  workstream: string;
  packet_class: PacketClass;
  risk_class: RiskClass;
  activation_class: ActivationClass;
  dependency_class_profile: string;
  prerequisite_packets: string[];
  prerequisite_artifacts: PacketPrerequisiteArtifact[];
  speculative_start_allowed: boolean;
  scope: string[];
  out_of_scope: string[];
  protected_paths: string[];
  target_paths: string[];
  required_inputs: string[];
  expected_outputs: string[];
  required_docs_updates: string[];
  validator_manifest_ref: string;
  evidence_manifest_ref: string;
  review_manifest_ref: string;
  prompt_template_ref: string;
  context_pack_profile: string;
  benchmark_tags: string[];
  policy_sensitivities: string[];
  escalation_conditions: string[];
  completion_contract: string[];
  graph_repair_hooks: string[];
  operator_notes: string;
}

export interface PacketRegistryIdentityRules {
  registry_is_authoritative: boolean;
  duplicate_packet_ids_illegal: boolean;
  graph_repair_reuses_packet_id_with_version_increment: boolean;
  structurally_distinct_repair_requires_new_packet_id: boolean;
  reconciliation_source: string;
}

export interface PacketRegistryMembershipModel {
  single_wave_field: string;
  multi_wave_field: string;
  rules: string[];
}

export interface PacketRegistryStatusModel {
  allowed_statuses: PacketRegistryStatus[];
}

export interface PacketRegistryEntry {
  packet_id: string;
  manifest_ref: string;
  wave_id?: string;
  wave_memberships?: string[];
  milestone: string;
  packet_class: PacketClass;
  status: PacketRegistryStatus;
  notes: string;
}

export interface PacketRegistryManifest {
  spec_kind: "packet-registry";
  spec_name: string;
  version: number;
  status: string;
  summary: string;
  identity_rules: PacketRegistryIdentityRules;
  membership_model: PacketRegistryMembershipModel;
  status_model: PacketRegistryStatusModel;
  packets: PacketRegistryEntry[];
}

export interface PacketSchemaFieldRule {
  type?: string;
  values?: string[];
}

export interface PacketSchemaCategory {
  required: Record<string, string | PacketSchemaFieldRule>;
}

export interface PacketSchemaSpec {
  spec_kind: "packet-schema";
  spec_name: string;
  version: number;
  status: string;
  summary: string;
  packet_identity_rules: Record<string, boolean>;
  field_categories: Record<string, PacketSchemaCategory>;
  field_constraints: {
    packet_id_pattern: string;
    title_min_length: number;
    version_minimum: number;
    prerequisite_artifact_fields: string[];
    non_empty_required_strings: boolean;
    no_tbd_placeholders_in_required_fields: boolean;
  };
  class_rules: Record<string, Record<string, string | boolean>>;
}

export interface WaveExecutionPolicy {
  concurrency_cap: number;
  launch_mode: string;
  operator_control: string;
  speculative_execution: boolean;
  dependency_class_interpretation: string;
  artifact_control: string;
}

export interface WaveReviewPolicy {
  default_review: string;
  agent_review: string;
  review_queue_cap: number;
  posture: string;
  success_requirement: string;
}

export interface WaveBenchmarkGates {
  pre_wave: string[];
  post_wave: string[];
}

export interface WaveLaunchGates {
  go_requirements: string[];
  continuation_requirements: string[];
}

export interface WaveManifest {
  wave_id: string;
  title: string;
  status: WaveStatus;
  purpose: string;
  packets: string[];
  excluded_packets: string[];
  execution_policy: WaveExecutionPolicy;
  review_policy: WaveReviewPolicy;
  benchmark_gates: WaveBenchmarkGates;
  launch_gates: WaveLaunchGates;
  pause_gates: Record<string, boolean>;
  freeze_gates: Record<string, boolean>;
  abort_gates: Record<string, boolean>;
  rollback_gates: Record<string, boolean>;
  success_metrics: Record<string, number | string>;
  progression_constraints: Record<string, string>;
  operator_notes: string;
}

export interface BenchmarkOutcome {
  status: string;
  expectation: string;
}

export interface BenchmarkFailureInterpretation {
  blocking_conditions: string[];
  operator_policy: string[];
}

export interface BenchmarkManifest {
  benchmark_id: string;
  title: string;
  status: string;
  fixture: string;
  wave_ref: string;
  packet_ref: string;
  purpose: string;
  scope_exercised: string[];
  explicitly_not_exercised: string[];
  expected_outcomes: Record<string, BenchmarkOutcome>;
  failure_interpretation: BenchmarkFailureInterpretation;
}

export interface EvidenceRequirement {
  type: string;
  source: string;
  tier: number;
  condition?: string;
  pin_on?: string;
}

export interface EvidenceManifest {
  manifest_kind: "evidence-manifest";
  manifest_name: string;
  version: number;
  status: string;
  summary: string;
  required: EvidenceRequirement[];
  conditional: EvidenceRequirement[];
  ephemeral_unless_pinned: EvidenceRequirement[];
  notes: string[];
}

export interface ReviewDecisionRecordRequirement {
  fields: string[];
  decision_values: string[];
}

export interface ReviewManifest {
  manifest_kind: "review-manifest";
  manifest_name: string;
  version: number;
  status: string;
  review_mode: string;
  trigger: string;
  summary: string;
  mandatory_evidence: string[];
  advisory_inputs_if_present: string[];
  required_decision_record: ReviewDecisionRecordRequirement;
  review_focus: string[];
}

export interface ToolValidatorRule {
  id: string;
  tool: string;
  blocking: boolean;
  order: number;
  scope?: string;
  condition?: string;
  required_for_waves?: string[];
}

export interface AgenticValidatorRule {
  id: string;
  type: "agentic";
  review_manifest_ref: string;
  blocking: boolean;
  order: number;
  condition?: string;
}

export type ValidatorRule = ToolValidatorRule | AgenticValidatorRule;

export interface ValidatorManifest {
  manifest_kind: "validator-manifest";
  manifest_name: string;
  version: number;
  status: string;
  applies_to_packet_classes: PacketClass[];
  execution_mode: string;
  summary: string;
  validator_set: {
    layer_1_correctness: ToolValidatorRule[];
    layer_2_security: ToolValidatorRule[];
    layer_3_policy: ToolValidatorRule[];
    layer_4_evidence: ToolValidatorRule[];
    agentic_review: ValidatorRule[];
  };
  notes: string[];
}

export interface ManifestStructuralIssue {
  path: string;
  message: string;
}

export interface ManifestLocation {
  ref: string;
  absolutePath: string;
}

export interface LoadedWavePacketPlan {
  registryEntry: PacketRegistryEntry;
  packetManifest: PacketManifest;
  validatorManifest: ValidatorManifest;
  evidenceManifest: EvidenceManifest;
  reviewManifest: ReviewManifest;
  locations: {
    packet: ManifestLocation;
    validator: ManifestLocation;
    evidence: ManifestLocation;
    review: ManifestLocation;
  };
}

export interface WaveExecutionPlan {
  schemaSpec: PacketSchemaSpec;
  packetRegistry: PacketRegistryManifest;
  waveManifest: WaveManifest;
  benchmarkManifest: BenchmarkManifest;
  packets: LoadedWavePacketPlan[];
  locations: {
    schema: ManifestLocation;
    registry: ManifestLocation;
    wave: ManifestLocation;
    benchmark: ManifestLocation;
  };
}
