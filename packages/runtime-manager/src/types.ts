import type { ForgeConfig, WorktreeDescriptor } from "@forge/shared";

export interface RuntimeLayout {
  containerPrefix: string;
  worktreeRoot: string;
  controlWorktreeRoot: string;
  logRoot: string;
  runtimeLogRoot: string;
}

export interface TaskIdentityInput {
  taskId: string;
  slug?: string;
  phaseBranch?: string;
}

export interface TaskWorktreeDescriptor extends WorktreeDescriptor {
  phaseBranch: string;
  slug: string;
  worktreeName: string;
  logFilePath: string;
}

export interface CommandExecutionRequest {
  command: string;
  args?: readonly string[];
  cwd: string;
  env?: NodeJS.ProcessEnv;
  input?: string;
}

export interface CommandExecutionResult {
  command: readonly string[];
  cwd: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export interface ScopedWorkspaceExecutionRequest {
  descriptor: TaskWorktreeDescriptor;
  command: string;
  args?: readonly string[];
  relativeCwd?: string;
  env?: NodeJS.ProcessEnv;
  input?: string;
}

export interface WorktreeProvisionRequest extends TaskIdentityInput {
  bootstrapCommand?: readonly string[];
}

export interface WorktreeProvisionResult {
  descriptor: TaskWorktreeDescriptor;
  baseCommitSha: string;
  bootstrap: CommandExecutionResult | null;
}

export interface WorktreeDiffCapture {
  descriptor: TaskWorktreeDescriptor;
  baseRef: string;
  headRef: string;
  patch: string;
  stat: string;
  nameStatus: string;
  hasChanges: boolean;
}

export interface TaskCommitRequest {
  descriptor: TaskWorktreeDescriptor;
  message: string;
  allowEmpty?: boolean;
}

export interface TaskCommitResult {
  descriptor: TaskWorktreeDescriptor;
  createdCommit: boolean;
  commitSha: string | null;
  statusBeforeCommit: string;
}

export interface MergeBackRequest {
  descriptor: TaskWorktreeDescriptor;
  commitMessage: string;
  taskCommitMessage?: string;
  allowEmptyCommit?: boolean;
}

export interface MergeBackResult {
  descriptor: TaskWorktreeDescriptor;
  merged: boolean;
  strategy: "squash";
  phaseHeadBeforeMerge: string;
  taskCommitSha: string | null;
  mergeCommitSha: string | null;
  conflictDetected: boolean;
  commitMessage: string;
}

export interface RollbackRequest {
  descriptor: TaskIdentityInput;
  mergeCommitSha: string;
  reason: string;
}

export interface RollbackResult {
  phaseBranch: string;
  mergeCommitSha: string;
  rollbackCommitSha: string;
  rolledBack: boolean;
  reason: string;
}

export interface WorktreeTeardownRequest {
  descriptor: TaskWorktreeDescriptor;
  deleteBranch?: boolean;
}

export interface WorktreeTeardownResult {
  descriptor: TaskWorktreeDescriptor;
  removed: boolean;
  branchDeleted: boolean;
}

export interface RuntimeManagerOptions {
  bootstrapCommand?: readonly string[];
}

export interface RuntimeLogEvent {
  timestamp: string;
  event: string;
  taskId?: string;
  branchName?: string;
  phaseBranch?: string;
  worktreePath?: string;
  details?: Record<string, string | number | boolean | null>;
}

export interface RuntimeManagerLike {
  readonly config: ForgeConfig;
  readonly layout: RuntimeLayout;
}
