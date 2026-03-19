export type DbJson =
  | null
  | boolean
  | number
  | string
  | DbJson[]
  | { [key: string]: DbJson };

export type WaveRunStatus =
  | "drafted"
  | "ready"
  | "active"
  | "paused"
  | "frozen"
  | "aborted"
  | "rolled_back"
  | "completed"
  | "closed";

export type WaveDecisionStatus =
  | "pending"
  | "go"
  | "no_go"
  | "paused"
  | "frozen"
  | "aborted"
  | "rolled_back"
  | "closed";

export type WaveFinalDisposition =
  | "advance_to_wave1_planning"
  | "repeat_wave0_live"
  | "return_to_preparation"
  | "closed";

export type TaskRunStatus =
  | "drafted"
  | "queued"
  | "scheduled"
  | "provisioning"
  | "running"
  | "awaiting_validation"
  | "validating"
  | "awaiting_review"
  | "changes_requested"
  | "repairing"
  | "succeeded"
  | "merging"
  | "merged"
  | "conflict_resolution"
  | "requeued"
  | "blocked"
  | "escalated"
  | "canceled"
  | "failed";

export type ValidatorResultStatus = "pass" | "fail" | "error" | "skip" | "record";

export type EvidenceBundleStatus = "pending" | "complete" | "incomplete";

export type PolicyDecisionKind = "allow" | "deny" | "escalate";

export type AuditEventLevel = "debug" | "info" | "warn" | "error";

export interface DatabaseTargets {
  postgresUrl: string;
  postgresDatabase: string;
  postgresSchema: string;
  redisUrl: string;
}

export interface ForgeDatabaseConnectionOptions {
  connectionString: string;
  schema: string;
}

export interface MigrationRecord {
  migration_name: string;
  applied_at: Date;
}

export interface WaveRunRecord {
  wave_run_id: string;
  wave_id: string;
  packet_id: string;
  benchmark_id: string | null;
  environment: string;
  launch_mode: string;
  review_mode: string;
  concurrency_cap: number;
  phase_branch: string;
  launch_window_id: string | null;
  commit_sha: string | null;
  status: WaveRunStatus;
  decision_status: WaveDecisionStatus;
  final_disposition: WaveFinalDisposition | null;
  rollback_performed: boolean;
  metadata: DbJson;
  started_at: Date;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface TaskRunRecord {
  task_run_id: string;
  wave_run_id: string;
  task_id: string;
  packet_id: string;
  task_type: string;
  status: TaskRunStatus;
  assigned_agent_role: string;
  coding_packet_ref: string | null;
  worktree_ref: string | null;
  evidence_bundle_ref: string | null;
  base_branch: string | null;
  task_branch: string | null;
  base_commit_sha: string | null;
  merge_commit_sha: string | null;
  dependencies: DbJson;
  failure_classification: string | null;
  failure_message: string | null;
  metadata: DbJson;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface TaskStateTransitionRecord {
  task_state_transition_id: number;
  task_run_id: string;
  from_status: TaskRunStatus | null;
  to_status: TaskRunStatus;
  transition_reason: string | null;
  actor_type: string;
  actor_name: string | null;
  classification: string | null;
  metadata: DbJson;
  created_at: Date;
}

export interface ValidatorResultRecord {
  validator_result_id: string;
  task_run_id: string;
  validator_id: string;
  validator_layer: string;
  validator_tool: string;
  blocking: boolean;
  status: ValidatorResultStatus;
  scope: string | null;
  condition: string | null;
  message: string | null;
  details: DbJson;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface EvidenceBundleRecord {
  evidence_bundle_id: string;
  wave_run_id: string;
  task_run_id: string;
  packet_id: string;
  status: EvidenceBundleStatus;
  completeness_ratio: string;
  mandatory_item_count: number;
  present_item_count: number;
  bundle_ref: string | null;
  summary: DbJson;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

export interface EvidenceItemRecord {
  evidence_item_id: string;
  evidence_bundle_id: string;
  task_run_id: string;
  evidence_type: string;
  source: string;
  tier: number;
  required: boolean;
  present: boolean;
  condition: string | null;
  storage_ref: string | null;
  metadata: DbJson;
  created_at: Date;
  updated_at: Date;
}

export interface PolicyDecisionRecord {
  policy_decision_id: string;
  wave_run_id: string;
  task_run_id: string | null;
  agent_role: string;
  action_class: string;
  tool_name: string;
  target_path: string | null;
  decision: PolicyDecisionKind;
  reason: string;
  scope_status: string | null;
  request_payload: DbJson;
  result_payload: DbJson;
  created_at: Date;
}

export interface AuditEventRecord {
  audit_event_id: string;
  wave_run_id: string;
  task_run_id: string | null;
  source_component: string;
  event_type: string;
  event_level: AuditEventLevel;
  sequence_number: string;
  message: string;
  payload: DbJson;
  created_at: Date;
}

export interface OperatorEventRecord {
  operator_event_id: string;
  wave_run_id: string;
  task_run_id: string | null;
  event_kind: string;
  actor_name: string;
  authority_role: string | null;
  trigger: string | null;
  decision: string | null;
  outcome: string | null;
  notes: string | null;
  decision_latency_ms: number | null;
  escalation_clearance_ms: number | null;
  metadata: DbJson;
  created_at: Date;
}

export interface CreateWaveRunInput {
  wave_run_id?: string;
  wave_id: string;
  packet_id: string;
  benchmark_id?: string | null;
  environment: string;
  launch_mode: string;
  review_mode: string;
  concurrency_cap: number;
  phase_branch: string;
  launch_window_id?: string | null;
  commit_sha?: string | null;
  status?: WaveRunStatus;
  decision_status?: WaveDecisionStatus;
  metadata?: DbJson;
  started_at?: Date;
}

export interface UpdateWaveRunStatusInput {
  wave_run_id: string;
  status: WaveRunStatus;
  decision_status?: WaveDecisionStatus;
  final_disposition?: WaveFinalDisposition | null;
  rollback_performed?: boolean;
  completed_at?: Date | null;
  metadata?: DbJson;
}

export interface CreateTaskRunInput {
  task_run_id?: string;
  wave_run_id: string;
  task_id: string;
  packet_id: string;
  task_type: string;
  assigned_agent_role: string;
  coding_packet_ref?: string | null;
  worktree_ref?: string | null;
  evidence_bundle_ref?: string | null;
  base_branch?: string | null;
  task_branch?: string | null;
  base_commit_sha?: string | null;
  merge_commit_sha?: string | null;
  dependencies?: DbJson;
  metadata?: DbJson;
  status?: TaskRunStatus;
  started_at?: Date | null;
}

export interface TransitionTaskRunStateInput {
  task_run_id: string;
  to_status: TaskRunStatus;
  actor_type: string;
  actor_name?: string | null;
  transition_reason?: string | null;
  classification?: string | null;
  metadata?: DbJson;
  failure_message?: string | null;
  completed_at?: Date | null;
}

export interface UpsertValidatorResultInput {
  validator_result_id?: string;
  task_run_id: string;
  validator_id: string;
  validator_layer: string;
  validator_tool: string;
  blocking: boolean;
  status: ValidatorResultStatus;
  scope?: string | null;
  condition?: string | null;
  message?: string | null;
  details?: DbJson;
  started_at?: Date | null;
  completed_at?: Date | null;
}

export interface UpsertEvidenceBundleInput {
  evidence_bundle_id?: string;
  wave_run_id: string;
  task_run_id: string;
  packet_id: string;
  status: EvidenceBundleStatus;
  completeness_ratio: number;
  mandatory_item_count: number;
  present_item_count: number;
  bundle_ref?: string | null;
  summary?: DbJson;
  completed_at?: Date | null;
}

export interface UpsertEvidenceItemInput {
  evidence_item_id?: string;
  evidence_bundle_id: string;
  task_run_id: string;
  evidence_type: string;
  source: string;
  tier: number;
  required: boolean;
  present: boolean;
  condition?: string | null;
  storage_ref?: string | null;
  metadata?: DbJson;
}

export interface CreatePolicyDecisionInput {
  policy_decision_id?: string;
  wave_run_id: string;
  task_run_id?: string | null;
  agent_role: string;
  action_class: string;
  tool_name: string;
  target_path?: string | null;
  decision: PolicyDecisionKind;
  reason: string;
  scope_status?: string | null;
  request_payload?: DbJson;
  result_payload?: DbJson;
}

export interface CreateAuditEventInput {
  audit_event_id?: string;
  wave_run_id: string;
  task_run_id?: string | null;
  source_component: string;
  event_type: string;
  event_level?: AuditEventLevel;
  sequence_number: bigint | number;
  message: string;
  payload?: DbJson;
}

export interface CreateOperatorEventInput {
  operator_event_id?: string;
  wave_run_id: string;
  task_run_id?: string | null;
  event_kind: string;
  actor_name: string;
  authority_role?: string | null;
  trigger?: string | null;
  decision?: string | null;
  outcome?: string | null;
  notes?: string | null;
  decision_latency_ms?: number | null;
  escalation_clearance_ms?: number | null;
  metadata?: DbJson;
}

export interface ListWaveRunsInput {
  limit?: number;
  wave_id?: string;
  packet_id?: string;
  status?: WaveRunStatus;
}

export interface WaveRunLifecycle {
  waveRun: WaveRunRecord;
  taskRuns: TaskRunRecord[];
  taskTransitions: TaskStateTransitionRecord[];
  validatorResults: ValidatorResultRecord[];
  evidenceBundles: EvidenceBundleRecord[];
  evidenceItems: EvidenceItemRecord[];
  policyDecisions: PolicyDecisionRecord[];
  auditEvents: AuditEventRecord[];
  operatorEvents: OperatorEventRecord[];
  summary: {
    taskCount: number;
    blockingValidatorFailures: number;
    evidenceCompleteness: number;
    policyDecisionCounts: Record<PolicyDecisionKind, number>;
    auditEventCount: number;
    operatorInterventionCount: number;
  };
}
