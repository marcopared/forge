import type { ForgeConfig, PacketClass, PacketManifest } from "@forge/shared";

export type AgentRole =
  | "planner"
  | "implementer"
  | "validator"
  | "debugger"
  | "reviewer"
  | "doc_updater"
  | "harness_maintainer";

export type PolicyDecision = "ALLOW" | "DENY" | "ESCALATE";

export type ToolActionClass = "READ" | "MUTATE" | "EXECUTE" | "ANALYZE" | "ATTEST";

export type Wave0ToolName =
  | "file.read"
  | "file.write"
  | "dir.list"
  | "repo.inspect"
  | "run.typecheck"
  | "run.lint"
  | "run.tests"
  | "git.status"
  | "git.diff"
  | "git.add"
  | "git.commit";

export type PermissionLevel = "FULL" | "SCOPED" | "READ" | "NONE" | "GATED" | "ESCALATE";

export interface PolicyDecisionRecord {
  decision: PolicyDecision;
  reason: string;
  toolName: Wave0ToolName;
  actionClass: ToolActionClass;
  agentRole: AgentRole;
  targetPaths: string[];
  scopeStatus: "in_scope" | "out_of_scope" | "protected_path" | "not_applicable";
  evaluatedAt: string;
  packetId: string;
}

export interface ToolPolicyContext {
  config: ForgeConfig;
  packetManifest: PacketManifest;
  packetManifestRef?: string;
  worktreePath: string;
  taskId: string;
  taskRunId: string;
  waveRunId: string;
  agentRole: AgentRole;
  tokensConsumed?: number;
  worktreeId?: string;
}

export interface ToolPolicyRequest {
  toolName: Wave0ToolName;
  actionClass: ToolActionClass;
  targetPaths?: string[];
  command?: readonly string[];
  estimatedTokens?: number;
}

export interface ShellAllowlistPolicy {
  byRole: Partial<Record<AgentRole, { permission: "gated" | "none"; allowlist: string[] }>>;
  alwaysDeniedPatterns: string[];
}

export interface TokenBudgetPolicy {
  byPacketClass: Partial<Record<PacketClass, number>>;
}

export interface LoadedPolicySet {
  protectedPaths: string[];
  shell: ShellAllowlistPolicy;
  tokenBudgets: TokenBudgetPolicy;
  blessedStack: {
    packageManager: string;
    testing: string;
    language: string;
  };
}

export interface PolicyEvaluationResult {
  decision: PolicyDecision;
  record: PolicyDecisionRecord;
}

export interface PolicyEngineLike {
  evaluate(
    context: ToolPolicyContext,
    request: ToolPolicyRequest
  ): Promise<PolicyEvaluationResult>;
}
