import type {
  EvidenceManifest,
  EvidenceRequirement,
  ManifestLocation
} from "@forge/shared";

export interface EvidenceLayout {
  evidenceRoot: string;
  auditRoot: string;
  logRoot: string;
  artifactKinds: readonly string[];
}

export interface EvidenceConditions {
  validatorRan: boolean;
  depsChanged: boolean;
  repairLoopRan: boolean;
  speculativeStart: boolean;
  speculativeFreezeOccurred: boolean;
  packetMerged: boolean;
  mergeConflictResolved: boolean;
}

export interface EvidenceItemRegistration {
  evidenceType: string;
  source: string;
  tier?: number;
  required?: boolean;
  present?: boolean;
  condition?: string;
  storageRef?: string;
  metadata?: Record<string, unknown>;
}

export interface RegisteredEvidenceItem extends EvidenceItemRegistration {
  tier: number;
  required: boolean;
  present: boolean;
  metadata: Record<string, unknown>;
  recordedAt: string;
}

export interface EvidenceCompletenessResult {
  status: "complete" | "incomplete";
  completenessRatio: number;
  mandatoryItemCount: number;
  presentItemCount: number;
  requiredItems: RegisteredEvidenceItem[];
  optionalItems: RegisteredEvidenceItem[];
  missingItems: RegisteredEvidenceItem[];
}

export interface AuditTrailEvent {
  auditEventId: string;
  waveRunId: string;
  taskRunId: string;
  sequenceNumber: number;
  category:
    | "tool_call"
    | "policy_decision"
    | "state_transition"
    | "operator_intervention"
    | "validator"
    | "lifecycle";
  sourceComponent: string;
  eventType: string;
  eventLevel: "debug" | "info" | "warn" | "error";
  message: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AuditTrailEventInput {
  category: AuditTrailEvent["category"];
  sourceComponent: string;
  eventType: string;
  eventLevel?: AuditTrailEvent["eventLevel"];
  message: string;
  payload?: Record<string, unknown>;
}

export interface OperatorInterventionRecord {
  actorName: string;
  authorityRole?: string | null;
  trigger?: string | null;
  decision?: string | null;
  outcome?: string | null;
  notes?: string | null;
  decisionLatencyMs?: number | null;
  escalationClearanceMs?: number | null;
  metadata?: Record<string, unknown>;
}

export interface StateTransitionRecord {
  fromStatus: string | null;
  toStatus: string;
  actorType: string;
  actorName?: string | null;
  transitionReason?: string | null;
  classification?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ManifestVersionRecord {
  ref: string;
  absolutePath: string;
  sha256: string;
  bytes: number;
  manifestName?: string;
  manifestKind?: string;
  version?: string | number;
}

export interface ContextPackEntry {
  ref: string;
  absolutePath: string;
  trustLabel: string;
  bytes: number;
  sha256: string;
  estimatedTokens: number;
}

export interface ContextPackSourceInput {
  ref: string;
  absolutePath: string;
}

export interface ContextPackManifestRecord {
  profile: string;
  includedFiles: ContextPackEntry[];
  includedFileCount: number;
  estimatedTokenCount: number;
  trustLabels: string[];
}

export interface WorktreeIdentityRecord {
  worktreePath: string;
  worktreeName?: string;
  taskBranch: string;
  phaseBranch: string;
  baseCommitSha: string;
  mergeCommitSha?: string | null;
  rollbackCommitSha?: string | null;
}

export interface CostSummaryRecord {
  model: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  toolCallCount: number;
  validatorCount: number;
  durationMs: number;
}

export interface RuntimeTimestampsRecord {
  startedAt: string;
  agentCompletedAt?: string;
  validationCompletedAt?: string;
  reviewCompletedAt?: string;
  mergedAt?: string;
  rollbackAt?: string;
  completedAt: string;
  durationMs: number;
}

export interface ReviewerVerdictRecord {
  packetId: string;
  reviewMode: string;
  reviewerIdentity: string;
  decision: "approve" | "reject" | "revise" | "pending";
  rationale: string;
  conditions: string[];
  recordedAt: string;
}

export interface ConfidenceScoreRecord {
  score: number;
  blockingValidatorFailureCount: number;
  blockingValidatorPassCount: number;
  evidenceCompletenessRatio: number;
}

export interface ManifestVersionSource {
  location: ManifestLocation;
  manifest?: object;
}

export interface EvidenceBundleDocument {
  waveRunId: string;
  taskRunId: string;
  packetId: string;
  manifestName: string;
  generatedAt: string;
  status: EvidenceCompletenessResult["status"];
  completenessRatio: number;
  mandatoryItemCount: number;
  presentItemCount: number;
  conditions: EvidenceConditions;
  requiredItems: RegisteredEvidenceItem[];
  optionalItems: RegisteredEvidenceItem[];
  missingItems: RegisteredEvidenceItem[];
  summary: Record<string, unknown>;
}

export interface EvidenceBundleWriteResult {
  bundlePath: string;
  summaryPath: string;
  itemsPath: string;
  completeness: EvidenceCompletenessResult;
}

export interface EvidenceCompletenessInput {
  evidenceManifest: EvidenceManifest;
  items: readonly RegisteredEvidenceItem[];
  conditions: EvidenceConditions;
  extraRequirements?: readonly EvidenceRequirement[];
}
