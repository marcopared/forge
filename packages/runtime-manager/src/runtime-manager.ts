import fs from "node:fs/promises";
import path from "node:path";
import {
  defineForgePackage,
  type ForgeConfig
} from "@forge/shared";
import { appendRuntimeLog } from "./logger.js";
import {
  executeGit,
  executeGitOrThrow,
  gitRefExists,
  readGitValue
} from "./git.js";
import { executeCommandOrThrow } from "./shell.js";
import {
  type CommandExecutionResult,
  type MergeBackRequest,
  type MergeBackResult,
  type RollbackRequest,
  type RollbackResult,
  type RuntimeLayout,
  type RuntimeManagerOptions,
  type ScopedWorkspaceExecutionRequest,
  type TaskCommitRequest,
  type TaskCommitResult,
  type TaskIdentityInput,
  type TaskWorktreeDescriptor,
  type WorktreeDiffCapture,
  type WorktreeProvisionRequest,
  type WorktreeProvisionResult,
  type WorktreeTeardownRequest,
  type WorktreeTeardownResult
} from "./types.js";

export const runtimeManagerPackage = defineForgePackage({
  name: "@forge/runtime-manager",
  purpose: "Manages real local git worktrees, merge-back, and rollback for Wave 0.",
  dependsOn: ["@forge/shared"],
  status: "skeleton"
});

function sanitizeSegment(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  return normalized.length > 0 ? normalized : "task";
}

function createTaskToken(taskId: string): string {
  const safeTaskId = sanitizeSegment(taskId);
  return safeTaskId.startsWith("task-") ? safeTaskId : `task-${safeTaskId}`;
}

function branchRef(branchName: string): string {
  return `refs/heads/${branchName}`;
}

function ensurePathWithin(parentPath: string, childPath: string): void {
  const normalizedParent = path.resolve(parentPath);
  const normalizedChild = path.resolve(childPath);

  if (
    normalizedChild !== normalizedParent &&
    !normalizedChild.startsWith(`${normalizedParent}${path.sep}`)
  ) {
    throw new Error(
      `Scoped execution path ${normalizedChild} escapes worktree ${normalizedParent}.`
    );
  }
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function createControlBranchName(taskId: string, action: "merge" | "rollback"): string {
  return `forge/control-${action}-${sanitizeSegment(taskId)}-${Date.now()}`;
}

function createControlWorktreePath(
  layout: RuntimeLayout,
  taskId: string,
  action: "merge" | "rollback"
): string {
  return path.join(
    layout.controlWorktreeRoot,
    `${action}-${sanitizeSegment(taskId)}-${Date.now()}`
  );
}

export function createRuntimeLayout(config: ForgeConfig): RuntimeLayout {
  return {
    containerPrefix: "forge-build",
    worktreeRoot: config.paths.worktreeRoot,
    controlWorktreeRoot: path.join(config.paths.worktreeRoot, ".control"),
    logRoot: config.paths.logRoot,
    runtimeLogRoot: path.join(config.paths.logRoot, "runtime-manager")
  };
}

export function createTaskBranchName(taskId: string, slug = "wave0-synthetic"): string {
  return `forge/${createTaskToken(taskId)}-${sanitizeSegment(slug)}`;
}

export function createTaskSlug(task: TaskIdentityInput): string {
  return sanitizeSegment(task.slug ?? "wave0-synthetic");
}

export function createWorktreeDescriptor(
  config: ForgeConfig,
  taskId: string,
  slug = "wave0-synthetic",
  phaseBranch = config.phaseBranch
): TaskWorktreeDescriptor {
  const taskToken = createTaskToken(taskId);
  const safeSlug = sanitizeSegment(slug);
  const worktreeName = `${taskToken}-${safeSlug}`;

  return {
    taskId,
    slug: safeSlug,
    phaseBranch,
    worktreeName,
    branchName: createTaskBranchName(taskId, slug),
    worktreePath: path.join(config.paths.worktreeRoot, worktreeName),
    logFilePath: path.join(
      createRuntimeLayout(config).runtimeLogRoot,
      `${worktreeName}.jsonl`
    )
  };
}

export function createWave0SyntheticMergeCommitMessage(taskId: string): string {
  return [
    `feat(${sanitizeSegment(taskId)}): merge Wave 0 synthetic task`,
    "",
    "Packet: WAVE0-SYNTHETIC",
    "Wave: wave-0-live",
    "Execution: local runtime-manager squash merge"
  ].join("\n");
}

export class LocalRuntimeManager {
  readonly config: ForgeConfig;
  readonly layout: RuntimeLayout;
  readonly defaultBootstrapCommand: readonly string[];

  constructor(config: ForgeConfig, options: RuntimeManagerOptions = {}) {
    this.config = config;
    this.layout = createRuntimeLayout(config);
    this.defaultBootstrapCommand =
      options.bootstrapCommand ?? ["pnpm", "install", "--frozen-lockfile"];
  }

  private async log(
    descriptor: Pick<
      TaskWorktreeDescriptor,
      "logFilePath" | "taskId" | "branchName" | "phaseBranch" | "worktreePath"
    >,
    event: string,
    details?: Record<string, string | number | boolean | null>
  ): Promise<void> {
    await appendRuntimeLog(descriptor.logFilePath, {
      event,
      taskId: descriptor.taskId,
      branchName: descriptor.branchName,
      phaseBranch: descriptor.phaseBranch,
      worktreePath: descriptor.worktreePath,
      details
    });
  }

  async ensureRuntimeRoots(): Promise<void> {
    await Promise.all(
      [
        this.layout.worktreeRoot,
        this.layout.controlWorktreeRoot,
        this.layout.logRoot,
        this.layout.runtimeLogRoot
      ].map((directoryPath) => fs.mkdir(directoryPath, { recursive: true }))
    );
  }

  async provisionTaskWorktree(
    request: WorktreeProvisionRequest
  ): Promise<WorktreeProvisionResult> {
    const descriptor = createWorktreeDescriptor(
      this.config,
      request.taskId,
      request.slug,
      request.phaseBranch ?? this.config.phaseBranch
    );

    await this.ensureRuntimeRoots();

    await this.log(descriptor, "provision.start");

    const phaseRef = branchRef(descriptor.phaseBranch);
    const taskRef = branchRef(descriptor.branchName);

    if (!(await gitRefExists(this.config, phaseRef))) {
      throw new Error(`Phase branch ${descriptor.phaseBranch} does not exist.`);
    }

    if (await gitRefExists(this.config, taskRef)) {
      throw new Error(`Task branch ${descriptor.branchName} already exists.`);
    }

    if (await pathExists(descriptor.worktreePath)) {
      throw new Error(`Worktree path ${descriptor.worktreePath} already exists.`);
    }

    const baseCommitSha = await readGitValue(
      this.config,
      ["rev-parse", descriptor.phaseBranch],
      `Resolve ${descriptor.phaseBranch}`
    );

    await executeGitOrThrow(
      this.config,
      ["worktree", "add", "-b", descriptor.branchName, descriptor.worktreePath, descriptor.phaseBranch],
      `Create worktree for ${descriptor.taskId}`
    );

    await this.log(descriptor, "provision.created", {
      baseCommitSha
    });

    const bootstrapCommand =
      request.bootstrapCommand ?? this.defaultBootstrapCommand;
    let bootstrap: CommandExecutionResult | null = null;

    if (bootstrapCommand.length > 0) {
      bootstrap = await this.runScopedCommand({
        descriptor,
        command: bootstrapCommand[0] ?? "",
        args: bootstrapCommand.slice(1)
      });

      if (bootstrap.exitCode !== 0) {
        await this.log(descriptor, "bootstrap.failed", {
          exitCode: bootstrap.exitCode
        });
        throw new Error(
          `Bootstrap failed for ${descriptor.taskId} with exit code ${bootstrap.exitCode}.`
        );
      }

      await this.log(descriptor, "bootstrap.completed", {
        exitCode: bootstrap.exitCode,
        durationMs: bootstrap.durationMs
      });
    }

    return {
      descriptor,
      baseCommitSha,
      bootstrap
    };
  }

  async runScopedCommand(
    request: ScopedWorkspaceExecutionRequest
  ): Promise<CommandExecutionResult> {
    const scopedCwd = request.relativeCwd
      ? path.resolve(request.descriptor.worktreePath, request.relativeCwd)
      : request.descriptor.worktreePath;

    ensurePathWithin(request.descriptor.worktreePath, scopedCwd);

    await this.log(request.descriptor, "command.start", {
      command: [request.command, ...(request.args ?? [])].join(" "),
      cwd: scopedCwd
    });

    const result = await executeCommandOrThrow(
      {
        command: request.command,
        args: request.args,
        cwd: scopedCwd,
        env: request.env,
        input: request.input
      },
      `Run ${request.command}`
    ).catch(async (error: unknown) => {
      if (error instanceof Error && "result" in error) {
        const commandError = error as Error & {
          result?: CommandExecutionResult;
        };

        if (commandError.result) {
          await this.log(request.descriptor, "command.failed", {
            command: commandError.result.command.join(" "),
            exitCode: commandError.result.exitCode
          });
          return commandError.result;
        }
      }

      throw error;
    });

    await this.log(request.descriptor, "command.completed", {
      command: result.command.join(" "),
      exitCode: result.exitCode,
      durationMs: result.durationMs
    });

    return result;
  }

  async captureDiff(descriptor: TaskWorktreeDescriptor): Promise<WorktreeDiffCapture> {
    const [patch, stat, nameStatus, untrackedFiles] = await Promise.all([
      executeGitOrThrow(
        this.config,
        ["-C", descriptor.worktreePath, "diff", "--binary", descriptor.phaseBranch],
        `Capture patch diff for ${descriptor.taskId}`
      ),
      executeGitOrThrow(
        this.config,
        ["-C", descriptor.worktreePath, "diff", "--stat", descriptor.phaseBranch],
        `Capture diff stat for ${descriptor.taskId}`
      ),
      executeGitOrThrow(
        this.config,
        ["-C", descriptor.worktreePath, "diff", "--name-status", descriptor.phaseBranch],
        `Capture diff names for ${descriptor.taskId}`
      ),
      executeGitOrThrow(
        this.config,
        ["-C", descriptor.worktreePath, "ls-files", "--others", "--exclude-standard"],
        `Capture untracked files for ${descriptor.taskId}`
      )
    ]);

    const untrackedPaths = untrackedFiles.stdout
      .split("\n")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    let untrackedPatch = "";
    let untrackedStat = "";
    let untrackedNameStatus = "";

    for (const relativePath of untrackedPaths) {
      const absolutePath = path.join(descriptor.worktreePath, relativePath);
      const patchResult = await executeGit(
        this.config,
        ["-C", descriptor.worktreePath, "diff", "--binary", "--no-index", "--", "/dev/null", absolutePath]
      );
      const statResult = await executeGit(
        this.config,
        ["-C", descriptor.worktreePath, "diff", "--stat", "--no-index", "--", "/dev/null", absolutePath]
      );

      if (patchResult.stdout.length > 0) {
        untrackedPatch += patchResult.stdout;
      }

      if (statResult.stdout.length > 0) {
        untrackedStat += statResult.stdout;
      }

      untrackedNameStatus += `A\t${relativePath}\n`;
    }

    const diff: WorktreeDiffCapture = {
      descriptor,
      baseRef: descriptor.phaseBranch,
      headRef: descriptor.branchName,
      patch: `${patch.stdout}${untrackedPatch}`,
      stat: `${stat.stdout}${untrackedStat}`,
      nameStatus: `${nameStatus.stdout}${untrackedNameStatus}`,
      hasChanges:
        patch.stdout.trim().length > 0 ||
        untrackedPaths.length > 0 ||
        nameStatus.stdout.trim().length > 0
    };

    await this.log(descriptor, "diff.captured", {
      hasChanges: diff.hasChanges
    });

    return diff;
  }

  async commitTaskWorktree(request: TaskCommitRequest): Promise<TaskCommitResult> {
    const statusResult = await executeGitOrThrow(
      this.config,
      ["-C", request.descriptor.worktreePath, "status", "--short"],
      `Read git status for ${request.descriptor.taskId}`
    );
    const statusBeforeCommit = statusResult.stdout;

    const hasChanges = statusBeforeCommit.trim().length > 0;

    if (!hasChanges && !request.allowEmpty) {
      await this.log(request.descriptor, "commit.skipped");
      return {
        descriptor: request.descriptor,
        createdCommit: false,
        commitSha: null,
        statusBeforeCommit
      };
    }

    await executeGitOrThrow(
      this.config,
      ["-C", request.descriptor.worktreePath, "add", "--all"],
      `Stage worktree changes for ${request.descriptor.taskId}`
    );

    await executeGitOrThrow(
      this.config,
      [
        "-C",
        request.descriptor.worktreePath,
        "commit",
        ...(request.allowEmpty ? ["--allow-empty"] : []),
        "-m",
        request.message
      ],
      `Commit task branch for ${request.descriptor.taskId}`
    );

    const commitSha = await readGitValue(
      this.config,
      ["-C", request.descriptor.worktreePath, "rev-parse", "HEAD"],
      `Read task commit for ${request.descriptor.taskId}`
    );

    await this.log(request.descriptor, "commit.created", {
      commitSha
    });

    return {
      descriptor: request.descriptor,
      createdCommit: true,
      commitSha,
      statusBeforeCommit
    };
  }

  private async createControlWorktree(
    descriptor: TaskWorktreeDescriptor,
    action: "merge" | "rollback"
  ): Promise<{ controlPath: string; controlBranch: string }> {
    const controlPath = createControlWorktreePath(this.layout, descriptor.taskId, action);
    const controlBranch = createControlBranchName(descriptor.taskId, action);

    await fs.mkdir(path.dirname(controlPath), { recursive: true });
    await executeGitOrThrow(
      this.config,
      ["worktree", "add", "--detach", controlPath, descriptor.phaseBranch],
      `Create ${action} control worktree for ${descriptor.taskId}`
    );

    await executeGitOrThrow(
      this.config,
      ["-C", controlPath, "switch", "-c", controlBranch],
      `Create ${action} control branch for ${descriptor.taskId}`
    );

    return { controlPath, controlBranch };
  }

  private async cleanupControlWorktree(
    controlPath: string,
    controlBranch: string
  ): Promise<void> {
    const worktreeExists = await pathExists(controlPath);

    if (worktreeExists) {
      await executeGit(
        this.config,
        ["worktree", "remove", "--force", controlPath]
      );
    }

    await executeGit(this.config, ["branch", "-D", controlBranch]);
  }

  async mergeSuccessfulRun(request: MergeBackRequest): Promise<MergeBackResult> {
    const descriptor = request.descriptor;

    await this.log(descriptor, "merge.start");

    const phaseHeadBeforeMerge = await readGitValue(
      this.config,
      ["rev-parse", descriptor.phaseBranch],
      `Read phase head for ${descriptor.taskId}`
    );

    const taskCommit = await this.commitTaskWorktree({
      descriptor,
      message:
        request.taskCommitMessage ??
        `chore(${sanitizeSegment(descriptor.taskId)}): prepare synthetic task branch`,
      allowEmpty: request.allowEmptyCommit ?? false
    });

    if (!taskCommit.commitSha) {
      throw new Error(`Task branch ${descriptor.branchName} has no committed changes to merge.`);
    }

    const { controlPath, controlBranch } = await this.createControlWorktree(
      descriptor,
      "merge"
    );

    let merged = false;
    let conflictDetected = false;
    let mergeCommitSha: string | null = null;

    try {
      const squashResult = await executeGit(
        this.config,
        ["-C", controlPath, "merge", "--squash", descriptor.branchName]
      );

      if (squashResult.exitCode !== 0) {
        conflictDetected = true;
        await executeGit(this.config, ["-C", controlPath, "merge", "--abort"]);
      } else {
        await executeGitOrThrow(
          this.config,
          ["-C", controlPath, "commit", "-m", request.commitMessage],
          `Create squash merge commit for ${descriptor.taskId}`
        );

        mergeCommitSha = await readGitValue(
          this.config,
          ["-C", controlPath, "rev-parse", "HEAD"],
          `Read merge commit for ${descriptor.taskId}`
        );

        await executeGitOrThrow(
          this.config,
          [
            "update-ref",
            branchRef(descriptor.phaseBranch),
            mergeCommitSha,
            phaseHeadBeforeMerge
          ],
          `Advance phase branch for ${descriptor.taskId}`
        );

        merged = true;
      }
    } finally {
      await this.cleanupControlWorktree(controlPath, controlBranch);
    }

    await this.log(descriptor, merged ? "merge.completed" : "merge.failed", {
      phaseHeadBeforeMerge,
      taskCommitSha: taskCommit.commitSha,
      mergeCommitSha,
      conflictDetected
    });

    return {
      descriptor,
      merged,
      strategy: "squash",
      phaseHeadBeforeMerge,
      taskCommitSha: taskCommit.commitSha,
      mergeCommitSha,
      conflictDetected,
      commitMessage: request.commitMessage
    };
  }

  async rollbackSyntheticMerge(request: RollbackRequest): Promise<RollbackResult> {
    const descriptor = createWorktreeDescriptor(
      this.config,
      request.descriptor.taskId,
      request.descriptor.slug,
      request.descriptor.phaseBranch ?? this.config.phaseBranch
    );

    await this.log(descriptor, "rollback.start", {
      mergeCommitSha: request.mergeCommitSha
    });

    const currentPhaseHead = await readGitValue(
      this.config,
      ["rev-parse", descriptor.phaseBranch],
      `Read phase head before rollback for ${descriptor.taskId}`
    );

    if (currentPhaseHead !== request.mergeCommitSha) {
      throw new Error(
        `Rollback expects ${request.mergeCommitSha} to be HEAD of ${descriptor.phaseBranch}, found ${currentPhaseHead}.`
      );
    }

    const { controlPath, controlBranch } = await this.createControlWorktree(
      descriptor,
      "rollback"
    );

    let rollbackCommitSha = "";

    try {
      await executeGitOrThrow(
        this.config,
        ["-C", controlPath, "revert", "--no-edit", request.mergeCommitSha],
        `Revert synthetic merge for ${descriptor.taskId}`
      );

      rollbackCommitSha = await readGitValue(
        this.config,
        ["-C", controlPath, "rev-parse", "HEAD"],
        `Read rollback commit for ${descriptor.taskId}`
      );

      await executeGitOrThrow(
        this.config,
        [
          "update-ref",
          branchRef(descriptor.phaseBranch),
          rollbackCommitSha,
          currentPhaseHead
        ],
        `Advance phase branch with rollback for ${descriptor.taskId}`
      );
    } finally {
      await this.cleanupControlWorktree(controlPath, controlBranch);
    }

    await this.log(descriptor, "rollback.completed", {
      mergeCommitSha: request.mergeCommitSha,
      rollbackCommitSha
    });

    return {
      phaseBranch: descriptor.phaseBranch,
      mergeCommitSha: request.mergeCommitSha,
      rollbackCommitSha,
      rolledBack: true,
      reason: request.reason
    };
  }

  async teardownWorktree(
    request: WorktreeTeardownRequest
  ): Promise<WorktreeTeardownResult> {
    await this.log(request.descriptor, "teardown.start", {
      deleteBranch: request.deleteBranch ?? false
    });

    const worktreeExists = await pathExists(request.descriptor.worktreePath);

    if (worktreeExists) {
      await executeGitOrThrow(
        this.config,
        ["worktree", "remove", "--force", request.descriptor.worktreePath],
        `Remove worktree for ${request.descriptor.taskId}`
      );
    }

    let branchDeleted = false;

    if (request.deleteBranch) {
      const taskRef = branchRef(request.descriptor.branchName);

      if (await gitRefExists(this.config, taskRef)) {
        await executeGitOrThrow(
          this.config,
          ["branch", "-D", request.descriptor.branchName],
          `Delete task branch for ${request.descriptor.taskId}`
        );
        branchDeleted = true;
      }
    }

    await this.log(request.descriptor, "teardown.completed", {
      removed: worktreeExists,
      branchDeleted
    });

    return {
      descriptor: request.descriptor,
      removed: worktreeExists,
      branchDeleted
    };
  }
}
