import type {
  AgentRole,
  PolicyDecision,
  PolicyDecisionRecord,
  ToolActionClass,
  ToolPolicyContext,
  Wave0ToolName
} from "@forge/policy-engine";
import type { ToolCatalogEntry } from "@forge/shared";

export interface ToolBrokerContext extends ToolPolicyContext {}

export interface ToolAuditRecord {
  audit_event_id: string;
  wave_run_id: string;
  task_run_id: string;
  source_component: "tool-broker";
  event_type: string;
  event_level: "info" | "warn" | "error";
  sequence_number: number;
  message: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface PersistedToolArtifacts {
  auditLogPath: string;
  policyLogPath: string;
  evidenceAuditLogPath: string;
  evidencePolicyLogPath: string;
}

export interface ToolInvocationResult<TData> {
  ok: boolean;
  toolName: Wave0ToolName;
  actionClass: ToolActionClass;
  policyDecision: PolicyDecision;
  message: string;
  data: TData | null;
  policyRecord: PolicyDecisionRecord;
  auditRecord: ToolAuditRecord;
  artifactPaths: PersistedToolArtifacts;
}

export interface FileReadRequest {
  path: string;
}

export interface FileReadResult {
  path: string;
  content: string;
  contentSha256: string;
  bytes: number;
}

export interface FileWriteRequest {
  path: string;
  content: string;
}

export interface FileWriteResult {
  path: string;
  contentSha256: string;
  bytesWritten: number;
}

export interface DirectoryListRequest {
  path?: string;
}

export interface DirectoryListResult {
  path: string;
  entries: Array<{
    name: string;
    kind: "file" | "directory" | "other";
  }>;
}

export interface RepoInspectResult {
  rootEntries: DirectoryListResult["entries"];
  gitStatus: string;
}

export interface CommandExecutionSummary {
  command: readonly string[];
  cwd: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  stdoutSha256: string;
  stderrSha256: string;
  durationMs: number;
}

export interface GitAddRequest {
  paths?: string[];
}

export interface GitAddResult {
  stagedPaths: string[];
}

export interface GitCommitRequest {
  message: string;
  allowEmpty?: boolean;
}

export interface GitCommitResult {
  commitSha: string;
  message: string;
}

export interface ToolRequest {
  toolName: Wave0ToolName;
  target?: string;
  parameters: Record<string, unknown>;
}

export interface ToolResponse {
  toolName: Wave0ToolName;
  policyDecision: PolicyDecision;
  message: string;
}

export interface Wave0ToolBrokerLike {
  readonly agentRole: AgentRole | undefined;
}

export const wave0ToolCatalog: readonly ToolCatalogEntry[] = [
  {
    name: "file.read",
    purpose: "Read UTF-8 files from the provisioned worktree."
  },
  {
    name: "file.write",
    purpose: "Write scoped UTF-8 files inside the task worktree."
  },
  {
    name: "dir.list",
    purpose: "List a directory inside the task worktree."
  },
  {
    name: "repo.inspect",
    purpose: "Inspect the local repo root and current git status."
  },
  {
    name: "run.typecheck",
    purpose: "Run the allowlisted Wave 0 typecheck command."
  },
  {
    name: "run.lint",
    purpose: "Run the allowlisted Wave 0 lint command."
  },
  {
    name: "run.tests",
    purpose: "Run the allowlisted Wave 0 unit-test command."
  },
  {
    name: "git.status",
    purpose: "Inspect task worktree git status."
  },
  {
    name: "git.diff",
    purpose: "Inspect task worktree git diff."
  },
  {
    name: "git.add",
    purpose: "Stage scoped changes in the task worktree."
  },
  {
    name: "git.commit",
    purpose: "Create a gated commit on the task branch."
  }
] as const;
