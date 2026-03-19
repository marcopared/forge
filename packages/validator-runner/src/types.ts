import type {
  EvidenceManifest,
  ForgeConfig,
  PacketManifest,
  ValidatorManifest
} from "@forge/shared";
import type { ForgePersistenceRepository } from "@forge/db";

export type Wave0ValidatorStatus = "pass" | "fail" | "error" | "skip" | "record";

export interface ValidatorCommandSpec {
  command: string;
  args?: readonly string[];
  env?: NodeJS.ProcessEnv;
}

export interface ValidatorCommandResult {
  command: readonly string[];
  cwd: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export interface ValidatorCommandError {
  message: string;
  code?: string;
  stack?: string;
}

export interface ValidatorOutputArtifact {
  validatorId: string;
  filePath: string;
}

export interface ValidationEvidenceInput {
  evidenceType: string;
  source: string;
  storageRef?: string;
  metadata?: Record<string, unknown>;
  condition?: string;
  present?: boolean;
}

export interface ValidationPolicyDecision {
  decision: string;
  toolName?: string;
  reason?: string;
  targetPath?: string | null;
}

export interface ValidationAuditEvent {
  eventType: string;
  sourceComponent?: string;
  message?: string;
}

export interface ValidatorResultRecordModel {
  validatorId: string;
  layer: string;
  tool: string;
  blocking: boolean;
  scope?: string;
  condition?: string;
  status: Wave0ValidatorStatus;
  message: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  command?: ValidatorCommandSpec;
  commandResult?: ValidatorCommandResult;
  error?: ValidatorCommandError;
  details: Record<string, unknown>;
  artifactPath?: string;
}

export interface EvidenceBundleSummary {
  status: "complete" | "incomplete";
  completenessRatio: number;
  mandatoryItemCount: number;
  presentItemCount: number;
  bundlePath: string;
}

export interface Wave0ValidationRunResult {
  packetId: string;
  waveId: string;
  workspacePath: string;
  blockingStatus: Extract<Wave0ValidatorStatus, "pass" | "fail" | "error">;
  startedAt: string;
  completedAt: string;
  changedFiles: string[];
  validatorArtifacts: ValidatorOutputArtifact[];
  validatorResultsPath: string;
  evidenceSummary: EvidenceBundleSummary;
  results: ValidatorResultRecordModel[];
}

export interface ValidationCommandExecutionRequest {
  validatorId: string;
  spec: ValidatorCommandSpec;
  cwd: string;
}

export type ValidationCommandExecutor = (
  request: ValidationCommandExecutionRequest
) => Promise<ValidatorCommandResult>;

export interface Wave0ValidationRunInput {
  config: ForgeConfig;
  packetManifest: PacketManifest;
  validatorManifest: ValidatorManifest;
  evidenceManifest: EvidenceManifest;
  waveId: string;
  workspacePath: string;
  waveRunId: string;
  taskRunId: string;
  changedFiles?: readonly string[];
  providedEvidence?: readonly ValidationEvidenceInput[];
  policyDecisions?: readonly ValidationPolicyDecision[];
  auditEvents?: readonly ValidationAuditEvent[];
  policyDecisionLogPath?: string;
  auditTrailPath?: string;
  repository?: ForgePersistenceRepository;
  commandOverrides?: Partial<Record<string, ValidatorCommandSpec>>;
  commandExecutor?: ValidationCommandExecutor;
  enforceUpstreamEvidence?: boolean;
}
