import fs from "node:fs/promises";
import path from "node:path";
import type { Wave0AuditWriter } from "@forge/evidence";
import {
  type PolicyDecisionRecord,
  type PolicyEngineLike,
  type PolicyEvaluationResult,
  type ToolActionClass
} from "@forge/policy-engine";
import { defineForgePackage } from "@forge/shared";
import {
  executeCommand,
  executeGit,
  executeGitOrThrow,
  readGitValue
} from "@forge/runtime-manager";
import {
  appendAuditArtifacts,
  appendPolicyDecisionArtifacts,
  createArtifactPaths,
  createToolAuditRecord,
  ensureArtifactPaths,
  sha256
} from "./audit.js";
import type {
  CommandExecutionSummary,
  DirectoryListRequest,
  DirectoryListResult,
  FileReadRequest,
  FileReadResult,
  FileWriteRequest,
  FileWriteResult,
  GitAddRequest,
  GitAddResult,
  GitCommitRequest,
  GitCommitResult,
  PersistedToolArtifacts,
  RepoInspectResult,
  ToolAuditRecord,
  ToolBrokerContext,
  ToolInvocationResult
} from "./types.js";

export const toolBrokerPackage = defineForgePackage({
  name: "@forge/tool-broker",
  purpose: "Executes the narrow Wave 0 tool surface through a policy-gated broker.",
  dependsOn: ["@forge/shared", "@forge/policy-engine", "@forge/evidence"],
  status: "skeleton"
});

export interface Wave0ToolBrokerOptions {
  auditWriter?: Wave0AuditWriter;
}

function relativeWorktreePath(worktreePath: string, targetPath: string): string {
  const absolutePath = path.isAbsolute(targetPath)
    ? targetPath
    : path.resolve(worktreePath, targetPath);
  return path.relative(worktreePath, absolutePath).replace(/\\/gu, "/");
}

function ensureInsideWorktree(worktreePath: string, targetPath: string): string {
  const relativePath = relativeWorktreePath(worktreePath, targetPath);

  if (relativePath.startsWith("..")) {
    throw new Error(`Path ${targetPath} escapes worktree ${worktreePath}.`);
  }

  return relativePath;
}

function isInsideResolvedRoot(rootPath: string, candidatePath: string): boolean {
  return candidatePath === rootPath || candidatePath.startsWith(`${rootPath}${path.sep}`);
}

async function resolveExistingAncestor(targetPath: string): Promise<string> {
  let currentPath = path.resolve(targetPath);

  while (true) {
    try {
      await fs.access(currentPath);
      return await fs.realpath(currentPath);
    } catch (error) {
      const parentPath = path.dirname(currentPath);

      if (parentPath === currentPath) {
        throw error;
      }

      currentPath = parentPath;
    }
  }
}

async function resolveSafeWorktreePath(input: {
  worktreePath: string;
  targetPath: string;
  forWrite?: boolean;
}): Promise<{ relativePath: string; absolutePath: string }> {
  const relativePath = ensureInsideWorktree(input.worktreePath, input.targetPath);
  const absolutePath = path.join(input.worktreePath, relativePath);
  const [resolvedWorktreePath, resolvedExistingPath] = await Promise.all([
    fs.realpath(input.worktreePath),
    resolveExistingAncestor(input.forWrite ? path.dirname(absolutePath) : absolutePath)
  ]);

  if (!isInsideResolvedRoot(resolvedWorktreePath, resolvedExistingPath)) {
    throw new Error(
      `Path ${relativePath} resolves outside the worktree via an existing symlink.`
    );
  }

  return {
    relativePath,
    absolutePath
  };
}

function secretLikeContent(content: string): boolean {
  return /(api[_-]?key|secret|token|password)\s*[:=]/iu.test(content);
}

function classifyDirent(entry: string, stats: Awaited<ReturnType<typeof fs.lstat>>): DirectoryListResult["entries"][number]["kind"] {
  if (stats.isDirectory()) {
    return "directory";
  }

  if (stats.isFile()) {
    return "file";
  }

  return "other";
}

export class Wave0ToolBroker {
  private sequenceNumber = 0;
  private readonly auditWriter?: Wave0AuditWriter;

  constructor(
    private readonly policyEngine: PolicyEngineLike,
    options: Wave0ToolBrokerOptions = {}
  ) {
    this.auditWriter = options.auditWriter;
  }

  private nextSequence(): number {
    this.sequenceNumber += 1;
    return this.sequenceNumber;
  }

  private async persistDecisionAndAudit(
    context: ToolBrokerContext,
    policyRecord: PolicyDecisionRecord,
    auditRecord: ToolAuditRecord
  ): Promise<PersistedToolArtifacts> {
    const artifactPaths = createArtifactPaths(context);
    await ensureArtifactPaths(artifactPaths);
    await appendPolicyDecisionArtifacts(artifactPaths, policyRecord);
    await appendAuditArtifacts(artifactPaths, auditRecord);
    if (this.auditWriter) {
      await this.auditWriter.recordPolicyDecision(policyRecord);
      await this.auditWriter.recordToolAudit(auditRecord);
    }
    return artifactPaths;
  }

  private async finalizeResult<TData>(
    context: ToolBrokerContext,
    evaluation: PolicyEvaluationResult,
    actionClass: ToolActionClass,
    message: string,
    data: TData | null,
    eventLevel: ToolAuditRecord["event_level"],
    payload: Record<string, unknown>
  ): Promise<ToolInvocationResult<TData>> {
    const auditRecord = createToolAuditRecord({
      waveRunId: context.waveRunId,
      taskRunId: context.taskRunId,
      sequenceNumber: this.nextSequence(),
      eventType: `${evaluation.record.toolName}.${eventLevel}`,
      eventLevel,
      message,
      payload
    });
    const artifactPaths = await this.persistDecisionAndAudit(
      context,
      evaluation.record,
      auditRecord
    );

    return {
      ok: evaluation.decision === "ALLOW" && eventLevel !== "error",
      toolName: evaluation.record.toolName,
      actionClass,
      policyDecision: evaluation.decision,
      message,
      data,
      policyRecord: evaluation.record,
      auditRecord,
      artifactPaths
    };
  }

  private async denyByPolicy<TData>(
    context: ToolBrokerContext,
    evaluation: PolicyEvaluationResult
  ): Promise<ToolInvocationResult<TData>> {
    const level = evaluation.decision === "ESCALATE" ? "warn" : "error";
    return await this.finalizeResult<TData>(
      context,
      evaluation,
      evaluation.record.actionClass,
      evaluation.record.reason,
      null,
      level,
      {
        decision: evaluation.decision,
        targetPaths: evaluation.record.targetPaths
      }
    );
  }

  private async evaluate(
    context: ToolBrokerContext,
    request: Parameters<PolicyEngineLike["evaluate"]>[1]
  ): Promise<PolicyEvaluationResult> {
    return await this.policyEngine.evaluate(context, request);
  }

  async readFile(
    context: ToolBrokerContext,
    request: FileReadRequest
  ): Promise<ToolInvocationResult<FileReadResult>> {
    const evaluation = await this.evaluate(context, {
      toolName: "file.read",
      actionClass: "READ",
      targetPaths: [request.path]
    });

    if (evaluation.decision !== "ALLOW") {
      return await this.denyByPolicy(context, evaluation);
    }

    const { relativePath, absolutePath } = await resolveSafeWorktreePath({
      worktreePath: context.worktreePath,
      targetPath: request.path
    });
    const content = await fs.readFile(absolutePath, "utf8");

    return await this.finalizeResult(context, evaluation, "READ", "File read succeeded.", {
      path: relativePath,
      content,
      contentSha256: sha256(content),
      bytes: Buffer.byteLength(content)
    }, "info", {
      targetPath: relativePath,
      bytes: Buffer.byteLength(content)
    });
  }

  async writeFile(
    context: ToolBrokerContext,
    request: FileWriteRequest
  ): Promise<ToolInvocationResult<FileWriteResult>> {
    const evaluation = await this.evaluate(context, {
      toolName: "file.write",
      actionClass: "MUTATE",
      targetPaths: [request.path]
    });

    if (evaluation.decision !== "ALLOW") {
      return await this.denyByPolicy(context, evaluation);
    }

    if (secretLikeContent(request.content)) {
      return await this.finalizeResult<FileWriteResult>(context, evaluation, "MUTATE", "Write blocked by secret-pattern guard.", null, "error", {
        targetPath: request.path
      });
    }

    const { relativePath, absolutePath } = await resolveSafeWorktreePath({
      worktreePath: context.worktreePath,
      targetPath: request.path,
      forWrite: true
    });

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, request.content, "utf8");

    return await this.finalizeResult(context, evaluation, "MUTATE", "File write succeeded.", {
      path: relativePath,
      contentSha256: sha256(request.content),
      bytesWritten: Buffer.byteLength(request.content)
    }, "info", {
      targetPath: relativePath,
      bytesWritten: Buffer.byteLength(request.content)
    });
  }

  async listDirectory(
    context: ToolBrokerContext,
    request: DirectoryListRequest = {}
  ): Promise<ToolInvocationResult<DirectoryListResult>> {
    const targetPath = request.path ?? ".";
    const evaluation = await this.evaluate(context, {
      toolName: "dir.list",
      actionClass: "READ",
      targetPaths: [targetPath]
    });

    if (evaluation.decision !== "ALLOW") {
      return await this.denyByPolicy(context, evaluation);
    }

    const { relativePath, absolutePath } = await resolveSafeWorktreePath({
      worktreePath: context.worktreePath,
      targetPath
    });
    const entryNames = await fs.readdir(absolutePath);
    const entries = await Promise.all(
      entryNames.map(async (entryName) => {
        const absoluteEntryPath = path.join(absolutePath, entryName);
        const stats = await fs.lstat(absoluteEntryPath);
        return {
          name: entryName,
          kind: classifyDirent(entryName, stats)
        };
      })
    );

    return await this.finalizeResult(context, evaluation, "READ", "Directory listing succeeded.", {
      path: relativePath,
      entries
    }, "info", {
      targetPath: relativePath,
      entryCount: entries.length
    });
  }

  async inspectRepo(
    context: ToolBrokerContext
  ): Promise<ToolInvocationResult<RepoInspectResult>> {
    const evaluation = await this.evaluate(context, {
      toolName: "repo.inspect",
      actionClass: "READ",
      targetPaths: ["."]
    });

    if (evaluation.decision !== "ALLOW") {
      return await this.denyByPolicy(context, evaluation);
    }

    const rootEntries = await this.listDirectory(context, { path: "." });

    if (!rootEntries.ok || !rootEntries.data) {
      return await this.finalizeResult<RepoInspectResult>(context, evaluation, "READ", "Repo inspection failed while reading root directory.", null, "error", {
        reason: rootEntries.message
      });
    }

    const gitStatusResult = await executeGit(
      context.config,
      ["-C", context.worktreePath, "status", "--short", "--branch"],
      context.config.paths.root
    );

    return await this.finalizeResult(context, evaluation, "READ", "Repo inspection succeeded.", {
      rootEntries: rootEntries.data.entries,
      gitStatus: gitStatusResult.stdout
    }, "info", {
      gitStatusExitCode: gitStatusResult.exitCode
    });
  }

  private async runAllowlistedCommand(
    context: ToolBrokerContext,
    toolName: "run.typecheck" | "run.lint" | "run.tests",
    command: readonly string[]
  ): Promise<ToolInvocationResult<CommandExecutionSummary>> {
    const evaluation = await this.evaluate(context, {
      toolName,
      actionClass: "EXECUTE",
      command
    });

    if (evaluation.decision !== "ALLOW") {
      return await this.denyByPolicy(context, evaluation);
    }

    const executionResult = await executeCommand({
      command: command[0] ?? "",
      args: command.slice(1),
      cwd: context.worktreePath
    });

    const summary: CommandExecutionSummary = {
      command,
      cwd: context.worktreePath,
      exitCode: executionResult.exitCode,
      stdout: executionResult.stdout,
      stderr: executionResult.stderr,
      stdoutSha256: sha256(executionResult.stdout),
      stderrSha256: sha256(executionResult.stderr),
      durationMs: executionResult.durationMs
    };

    return await this.finalizeResult(
      context,
      evaluation,
      "EXECUTE",
      executionResult.exitCode === 0
        ? `${toolName} succeeded.`
        : `${toolName} failed with exit code ${executionResult.exitCode}.`,
      summary,
      executionResult.exitCode === 0 ? "info" : "error",
      {
        command: [...command],
        exitCode: executionResult.exitCode,
        durationMs: executionResult.durationMs
      }
    );
  }

  async runTypecheck(
    context: ToolBrokerContext
  ): Promise<ToolInvocationResult<CommandExecutionSummary>> {
    return await this.runAllowlistedCommand(context, "run.typecheck", [
      "pnpm",
      "exec",
      "tsc",
      "--noEmit"
    ]);
  }

  async runLint(
    context: ToolBrokerContext
  ): Promise<ToolInvocationResult<CommandExecutionSummary>> {
    return await this.runAllowlistedCommand(context, "run.lint", ["pnpm", "lint"]);
  }

  async runTests(
    context: ToolBrokerContext
  ): Promise<ToolInvocationResult<CommandExecutionSummary>> {
    return await this.runAllowlistedCommand(context, "run.tests", [
      "pnpm",
      "vitest",
      "run"
    ]);
  }

  async gitStatus(
    context: ToolBrokerContext
  ): Promise<ToolInvocationResult<CommandExecutionSummary>> {
    const evaluation = await this.evaluate(context, {
      toolName: "git.status",
      actionClass: "READ"
    });

    if (evaluation.decision !== "ALLOW") {
      return await this.denyByPolicy(context, evaluation);
    }

    const result = await executeGit(
      context.config,
      ["-C", context.worktreePath, "status", "--short", "--branch"],
      context.config.paths.root
    );

    return await this.finalizeResult(context, evaluation, "READ", "git status executed.", {
      command: ["git", "-C", context.worktreePath, "status", "--short", "--branch"],
      cwd: context.worktreePath,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      stdoutSha256: sha256(result.stdout),
      stderrSha256: sha256(result.stderr),
      durationMs: result.durationMs
    }, result.exitCode === 0 ? "info" : "error", {
      exitCode: result.exitCode
    });
  }

  async gitDiff(
    context: ToolBrokerContext
  ): Promise<ToolInvocationResult<CommandExecutionSummary>> {
    const evaluation = await this.evaluate(context, {
      toolName: "git.diff",
      actionClass: "READ"
    });

    if (evaluation.decision !== "ALLOW") {
      return await this.denyByPolicy(context, evaluation);
    }

    const result = await executeGit(
      context.config,
      ["-C", context.worktreePath, "diff", "--binary"],
      context.config.paths.root
    );

    return await this.finalizeResult(context, evaluation, "READ", "git diff executed.", {
      command: ["git", "-C", context.worktreePath, "diff", "--binary"],
      cwd: context.worktreePath,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      stdoutSha256: sha256(result.stdout),
      stderrSha256: sha256(result.stderr),
      durationMs: result.durationMs
    }, result.exitCode === 0 ? "info" : "error", {
      exitCode: result.exitCode
    });
  }

  private async discoverChangedPaths(worktreePath: string, config: ToolBrokerContext["config"]): Promise<string[]> {
    const statusResult = await executeGit(
      config,
      ["-C", worktreePath, "status", "--short"],
      config.paths.root
    );

    return statusResult.stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.slice(3));
  }

  async gitAdd(
    context: ToolBrokerContext,
    request: GitAddRequest = {}
  ): Promise<ToolInvocationResult<GitAddResult>> {
    const stagedPaths = request.paths ?? (await this.discoverChangedPaths(context.worktreePath, context.config));
    const evaluation = await this.evaluate(context, {
      toolName: "git.add",
      actionClass: "MUTATE",
      targetPaths: stagedPaths
    });

    if (evaluation.decision !== "ALLOW") {
      return await this.denyByPolicy(context, evaluation);
    }

    const normalizedPaths = stagedPaths.map((entry) =>
      ensureInsideWorktree(context.worktreePath, entry)
    );

    if (normalizedPaths.length > 0) {
      await executeGitOrThrow(
        context.config,
        ["-C", context.worktreePath, "add", "--", ...normalizedPaths],
        "Stage scoped changes",
        context.config.paths.root
      );
    }

    return await this.finalizeResult(context, evaluation, "MUTATE", "git add executed.", {
      stagedPaths: normalizedPaths
    }, "info", {
      stagedCount: normalizedPaths.length
    });
  }

  async gitCommit(
    context: ToolBrokerContext,
    request: GitCommitRequest
  ): Promise<ToolInvocationResult<GitCommitResult>> {
    const evaluation = await this.evaluate(context, {
      toolName: "git.commit",
      actionClass: "MUTATE"
    });

    if (evaluation.decision !== "ALLOW") {
      return await this.denyByPolicy(context, evaluation);
    }

    await executeGitOrThrow(
      context.config,
      [
        "-C",
        context.worktreePath,
        "commit",
        ...(request.allowEmpty ? ["--allow-empty"] : []),
        "-m",
        request.message
      ],
      "Create scoped commit",
      context.config.paths.root
    );

    const commitSha = await readGitValue(
      context.config,
      ["-C", context.worktreePath, "rev-parse", "HEAD"],
      "Read commit sha",
      context.config.paths.root
    );

    return await this.finalizeResult(context, evaluation, "MUTATE", "git commit executed.", {
      commitSha,
      message: request.message
    }, "info", {
      commitSha
    });
  }
}
