#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { agentRunnerPackage } from "@forge/agent-runner";
import { configPackage, loadForgeConfig } from "@forge/config";
import {
  createDatabaseTargets,
  createForgeDatabase,
  dbPackage,
  ForgePersistenceRepository,
  runMigrations
} from "@forge/db";
import { createEvidenceLayout, evidencePackage } from "@forge/evidence";
import {
  createWaveExecutionSkeleton,
  loadWaveExecutionPlan,
  orchestratorPackage
} from "@forge/orchestrator";
import {
  defaultProtectedPaths,
  policyEnginePackage
} from "@forge/policy-engine";
import {
  createRuntimeLayout,
  createWave0SyntheticMergeCommitMessage,
  createWorktreeDescriptor,
  LocalRuntimeManager,
  runtimeManagerPackage
} from "@forge/runtime-manager";
import { sharedPackage, type ForgeConfig } from "@forge/shared";
import {
  ensureStorageLayout,
  getStorageLayout,
  storagePackage
} from "@forge/storage";
import { toolBrokerPackage, wave0ToolCatalog } from "@forge/tool-broker";
import {
  runWave0Validators,
  validatorRunnerPackage,
  wave0ValidationPlan
} from "@forge/validator-runner";
import {
  abortWave0Run,
  closeoutWave0Run,
  createWave0MetricsReport,
  executeWave0SyntheticRun,
  formatWave0AuditReport,
  formatWave0CloseoutReport,
  formatWave0ControlReport,
  formatWave0EvidenceReport,
  formatWave0LaunchResult,
  formatWave0MetricsReport,
  formatWave0PolicyReport,
  formatWave0RollbackVerificationReport,
  formatWave0SmokeReport,
  formatWave0StatusReport,
  formatWave0TaskReport,
  formatWave0ValidatorReport,
  freezeWave0Run,
  inspectWave0SyntheticRun,
  pauseWave0Run,
  resumeWave0Run,
  rollbackWave0Run,
  verifyWave0LiveSmoke,
  verifyWave0Rollback
} from "./wave0.js";
import type { WaveFinalDisposition } from "@forge/db";

const knownPackages = [
  sharedPackage,
  configPackage,
  orchestratorPackage,
  agentRunnerPackage,
  runtimeManagerPackage,
  policyEnginePackage,
  toolBrokerPackage,
  validatorRunnerPackage,
  evidencePackage,
  storagePackage,
  dbPackage
] as const;

interface RepositorySession {
  database: ReturnType<typeof createForgeDatabase>;
  repository: ForgePersistenceRepository;
}

function getPositionalArgs(args: readonly string[]): string[] {
  return args.filter((entry) => !entry.startsWith("--"));
}

function hasFlag(args: readonly string[], name: string): boolean {
  return args.includes(name);
}

function getOption(args: readonly string[], name: string): string | undefined {
  const inline = args.find((entry) => entry.startsWith(`${name}=`));

  if (inline) {
    return inline.slice(name.length + 1);
  }

  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  const next = args[index + 1];
  return next && !next.startsWith("--") ? next : undefined;
}

function getActorName(args: readonly string[]): string {
  return getOption(args, "--actor") ?? "local-operator";
}

function getNotes(
  args: readonly string[],
  fallback: string
): string {
  return getOption(args, "--notes") ?? fallback;
}

function parseDisposition(
  value: string | undefined
): WaveFinalDisposition | undefined {
  switch (value) {
    case undefined:
      return undefined;
    case "advance":
    case "advance_to_wave1_planning":
      return "advance_to_wave1_planning";
    case "repeat":
    case "repeat_wave0_live":
      return "repeat_wave0_live";
    case "return":
    case "return_to_preparation":
      return "return_to_preparation";
    case "closed":
      return "closed";
    default:
      throw new Error(
        `Unsupported disposition "${value}". Use advance, repeat, or return.`
      );
  }
}

function parseBooleanOption(
  value: string | undefined,
  fallback: boolean
): boolean {
  if (value === undefined) {
    return fallback;
  }

  if (["yes", "true", "1"].includes(value)) {
    return true;
  }

  if (["no", "false", "0"].includes(value)) {
    return false;
  }

  throw new Error(`Unsupported boolean option value "${value}". Use yes or no.`);
}

function usage(): string {
  return [
    "Available commands:",
    "  bootstrap",
    "  doctor",
    "  print-config",
    "  runtime:provision <taskId> [slug]",
    "  runtime:diff <taskId> [slug]",
    "  runtime:merge <taskId> [slug]",
    "  runtime:rollback <taskId> <mergeCommitSha> [slug]",
    "  runtime:teardown <taskId> [slug]",
    "  validate:wave0 [workspacePath] [taskRunId] [waveRunId]",
    "  wave0:launch [taskId] [--rollback] [--step-delay-ms <ms>] [--no-db] [--json]",
    "  wave0:run [taskId] [--rollback] [--step-delay-ms <ms>] [--no-db]",
    "  wave0:smoke [waveRunId] [taskRunId]",
    "  wave0:status [waveRunId] [taskRunId]",
    "  wave0:packet-status [waveRunId] [taskRunId]",
    "  wave0:validators [waveRunId] [taskRunId]",
    "  wave0:evidence [waveRunId] [taskRunId]",
    "  wave0:policy-log [waveRunId] [taskRunId]",
    "  wave0:audit [waveRunId] [taskRunId]",
    "  wave0:metrics [waveRunId] [taskRunId]",
    "  wave0:pause <waveRunId> [--actor <name>] [--notes <text>]",
    "  wave0:freeze <waveRunId> [--actor <name>] [--notes <text>]",
    "  wave0:abort <waveRunId> [--actor <name>] [--notes <text>]",
    "  wave0:resume <waveRunId> [--actor <name>] [--notes <text>]",
    "  wave0:rollback <waveRunId> [--actor <name>] [--reason <text>]",
    "  wave0:closeout [waveRunId] [taskRunId] [--disposition advance|repeat|return] [--wave1 yes|no] [--actor <name>] [--notes <text>]",
    "  wave0:inspect [waveRunId] [taskRunId]"
  ].join("\n");
}

async function openRepository(
  forgeConfig: ForgeConfig,
  required: boolean
): Promise<RepositorySession | null> {
  try {
    const database = createForgeDatabase(forgeConfig);
    await runMigrations(database);
    return {
      database,
      repository: new ForgePersistenceRepository(database)
    };
  } catch (error) {
    if (!required) {
      return null;
    }

    throw error;
  }
}

async function withOptionalRepository<T>(
  forgeConfig: ForgeConfig,
  handler: (session: RepositorySession | null) => Promise<T>
): Promise<T> {
  const session = await openRepository(forgeConfig, false);

  try {
    return await handler(session);
  } finally {
    await session?.database.close();
  }
}

async function withRequiredRepository<T>(
  forgeConfig: ForgeConfig,
  handler: (session: RepositorySession) => Promise<T>
): Promise<T> {
  const session = await openRepository(forgeConfig, true);

  if (!session) {
    throw new Error("Forge persistence is required for this command.");
  }

  try {
    return await handler(session);
  } finally {
    await session.database.close();
  }
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? "doctor";
  const cliArgs = process.argv.slice(3);
  const workspaceRoot = process.env.INIT_CWD
    ? path.resolve(process.env.INIT_CWD)
    : process.cwd();
  const forgeConfig = loadForgeConfig({ rootDir: workspaceRoot });
  const runtimeManager = new LocalRuntimeManager(forgeConfig);

  switch (command) {
    case "bootstrap": {
      const storageLayout = await ensureStorageLayout(forgeConfig);
      console.log("Forge local runtime directories are ready.");
      console.log(JSON.stringify(storageLayout, null, 2));
      return;
    }
    case "print-config": {
      console.log(JSON.stringify(forgeConfig, null, 2));
      return;
    }
    case "doctor": {
      const summary = {
        config: forgeConfig,
        runtime: createRuntimeLayout(forgeConfig),
        orchestration: createWaveExecutionSkeleton(forgeConfig),
        databases: createDatabaseTargets(forgeConfig),
        storage: getStorageLayout(forgeConfig),
        evidence: createEvidenceLayout(forgeConfig),
        validators: wave0ValidationPlan,
        toolCatalog: wave0ToolCatalog,
        protectedPaths: defaultProtectedPaths,
        packages: knownPackages
      };

      console.log(JSON.stringify(summary, null, 2));
      return;
    }
    case "runtime:provision": {
      const positional = getPositionalArgs(cliArgs);
      const taskId = positional[0] ?? "task-001";
      const slug = positional[1] ?? "wave0-synthetic";
      const result = await runtimeManager.provisionTaskWorktree({
        taskId,
        slug
      });
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "runtime:diff": {
      const positional = getPositionalArgs(cliArgs);
      const taskId = positional[0] ?? "task-001";
      const slug = positional[1] ?? "wave0-synthetic";
      const descriptor = createWorktreeDescriptor(forgeConfig, taskId, slug);
      const result = await runtimeManager.captureDiff(descriptor);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "runtime:merge": {
      const positional = getPositionalArgs(cliArgs);
      const taskId = positional[0] ?? "task-001";
      const slug = positional[1] ?? "wave0-synthetic";
      const descriptor = createWorktreeDescriptor(forgeConfig, taskId, slug);
      const result = await runtimeManager.mergeSuccessfulRun({
        descriptor,
        commitMessage: createWave0SyntheticMergeCommitMessage(taskId)
      });
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "runtime:rollback": {
      const positional = getPositionalArgs(cliArgs);
      const taskId = positional[0] ?? "task-001";
      const mergeCommitSha = positional[1];
      const slug = positional[2] ?? "wave0-synthetic";

      if (!mergeCommitSha) {
        console.error("Usage: runtime:rollback <taskId> <mergeCommitSha> [slug]");
        process.exitCode = 1;
        return;
      }

      const result = await runtimeManager.rollbackSyntheticMerge({
        descriptor: {
          taskId,
          slug,
          phaseBranch: forgeConfig.phaseBranch
        },
        mergeCommitSha,
        reason: "operator-requested synthetic rollback"
      });
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "runtime:teardown": {
      const positional = getPositionalArgs(cliArgs);
      const taskId = positional[0] ?? "task-001";
      const slug = positional[1] ?? "wave0-synthetic";
      const descriptor = createWorktreeDescriptor(forgeConfig, taskId, slug);
      const result = await runtimeManager.teardownWorktree({
        descriptor,
        deleteBranch: true
      });
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "validate:wave0": {
      const positional = getPositionalArgs(cliArgs);
      const workspacePath = positional[0]
        ? path.resolve(workspaceRoot, positional[0])
        : workspaceRoot;
      const taskRunId = positional[1] ?? "task-wave0-synthetic";
      const waveRunId = positional[2] ?? "wave-wave0-synthetic";
      const executionPlan = await loadWaveExecutionPlan(forgeConfig);
      const packetPlan = executionPlan.packets.find(
        (entry) => entry.packetManifest.packet_id === forgeConfig.defaultPacketId
      );

      if (!packetPlan) {
        throw new Error(
          `Packet ${forgeConfig.defaultPacketId} is not present in the loaded execution plan.`
        );
      }

      const result = await runWave0Validators({
        config: forgeConfig,
        packetManifest: packetPlan.packetManifest,
        validatorManifest: packetPlan.validatorManifest,
        evidenceManifest: packetPlan.evidenceManifest,
        waveId: executionPlan.waveManifest.wave_id,
        workspacePath,
        waveRunId,
        taskRunId
      });

      console.log(JSON.stringify(result, null, 2));
      return;
    }
    case "wave0:launch":
    case "wave0:run": {
      const positional = getPositionalArgs(cliArgs);
      const taskId = positional[0];
      const rollbackAfterMerge = hasFlag(cliArgs, "--rollback");
      const disableDb = hasFlag(cliArgs, "--no-db");
      const jsonOutput = command === "wave0:run" || hasFlag(cliArgs, "--json");
      const rawDelay = getOption(cliArgs, "--step-delay-ms");
      const stepDelayMs = rawDelay ? Number.parseInt(rawDelay, 10) : undefined;

      if (rawDelay && Number.isNaN(stepDelayMs)) {
        throw new Error(`Invalid --step-delay-ms value "${rawDelay}".`);
      }

      if (disableDb) {
        const result = await executeWave0SyntheticRun(forgeConfig, {
          taskId,
          rollbackAfterMerge
        });
        if (jsonOutput) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(formatWave0LaunchResult(result));
          console.log("");
          if (rollbackAfterMerge) {
            console.log(
              formatWave0RollbackVerificationReport(
                await verifyWave0Rollback(forgeConfig, {
                  waveRunId: result.waveRunId,
                  taskRunId: result.taskRunId,
                  mergeCommitSha: result.mergeCommitSha ?? undefined,
                  rollbackCommitSha: result.rollbackCommitSha ?? undefined
                })
              )
            );
          } else {
            console.log(
              formatWave0SmokeReport(
                await verifyWave0LiveSmoke(forgeConfig, {
                  waveRunId: result.waveRunId,
                  taskRunId: result.taskRunId
                })
              )
            );
          }
        }
        return;
      }

      await withRequiredRepository(forgeConfig, async ({ repository }) => {
        const result = await executeWave0SyntheticRun(forgeConfig, {
          taskId,
          rollbackAfterMerge,
          repository,
          stepDelayMs
        });
        if (jsonOutput) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(formatWave0LaunchResult(result));
          console.log("");
          if (rollbackAfterMerge) {
            console.log(
              formatWave0RollbackVerificationReport(
                await verifyWave0Rollback(forgeConfig, {
                  repository,
                  waveRunId: result.waveRunId,
                  taskRunId: result.taskRunId,
                  mergeCommitSha: result.mergeCommitSha ?? undefined,
                  rollbackCommitSha: result.rollbackCommitSha ?? undefined
                })
              )
            );
          } else {
            console.log(
              formatWave0SmokeReport(
                await verifyWave0LiveSmoke(forgeConfig, {
                  repository,
                  waveRunId: result.waveRunId,
                  taskRunId: result.taskRunId
                })
              )
            );
          }
        }
      });
      return;
    }
    case "wave0:smoke": {
      const positional = getPositionalArgs(cliArgs);
      await withOptionalRepository(forgeConfig, async (session) => {
        const report = await verifyWave0LiveSmoke(forgeConfig, {
          repository: session?.repository,
          waveRunId: positional[0],
          taskRunId: positional[1]
        });
        console.log(formatWave0SmokeReport(report));
      });
      return;
    }
    case "wave0:status": {
      const positional = getPositionalArgs(cliArgs);
      await withOptionalRepository(forgeConfig, async (session) => {
        const inspection = await inspectWave0SyntheticRun(forgeConfig, {
          repository: session?.repository,
          waveRunId: positional[0],
          taskRunId: positional[1]
        });
        console.log(formatWave0StatusReport(inspection));
      });
      return;
    }
    case "wave0:packet-status": {
      const positional = getPositionalArgs(cliArgs);
      await withOptionalRepository(forgeConfig, async (session) => {
        const inspection = await inspectWave0SyntheticRun(forgeConfig, {
          repository: session?.repository,
          waveRunId: positional[0],
          taskRunId: positional[1]
        });
        console.log(formatWave0TaskReport(inspection));
      });
      return;
    }
    case "wave0:validators": {
      const positional = getPositionalArgs(cliArgs);
      await withOptionalRepository(forgeConfig, async (session) => {
        const inspection = await inspectWave0SyntheticRun(forgeConfig, {
          repository: session?.repository,
          waveRunId: positional[0],
          taskRunId: positional[1]
        });
        console.log(formatWave0ValidatorReport(inspection));
      });
      return;
    }
    case "wave0:evidence": {
      const positional = getPositionalArgs(cliArgs);
      await withOptionalRepository(forgeConfig, async (session) => {
        const inspection = await inspectWave0SyntheticRun(forgeConfig, {
          repository: session?.repository,
          waveRunId: positional[0],
          taskRunId: positional[1]
        });
        console.log(formatWave0EvidenceReport(inspection));
      });
      return;
    }
    case "wave0:policy-log": {
      const positional = getPositionalArgs(cliArgs);
      await withOptionalRepository(forgeConfig, async (session) => {
        const inspection = await inspectWave0SyntheticRun(forgeConfig, {
          repository: session?.repository,
          waveRunId: positional[0],
          taskRunId: positional[1]
        });
        console.log(formatWave0PolicyReport(inspection));
      });
      return;
    }
    case "wave0:audit": {
      const positional = getPositionalArgs(cliArgs);
      await withOptionalRepository(forgeConfig, async (session) => {
        const inspection = await inspectWave0SyntheticRun(forgeConfig, {
          repository: session?.repository,
          waveRunId: positional[0],
          taskRunId: positional[1]
        });
        console.log(formatWave0AuditReport(inspection));
      });
      return;
    }
    case "wave0:metrics": {
      const positional = getPositionalArgs(cliArgs);
      await withOptionalRepository(forgeConfig, async (session) => {
        const inspection = await inspectWave0SyntheticRun(forgeConfig, {
          repository: session?.repository,
          waveRunId: positional[0],
          taskRunId: positional[1]
        });
        console.log(formatWave0MetricsReport(createWave0MetricsReport(inspection)));
      });
      return;
    }
    case "wave0:pause": {
      const positional = getPositionalArgs(cliArgs);
      const waveRunId = positional[0];

      if (!waveRunId) {
        throw new Error("Usage: wave0:pause <waveRunId> [--actor <name>] [--notes <text>]");
      }

      await withRequiredRepository(forgeConfig, async ({ repository }) => {
        const result = await pauseWave0Run(repository, waveRunId, {
          actorName: getActorName(cliArgs),
          notes: getNotes(cliArgs, "Wave 0 pause requested from the CLI control surface.")
        });
        console.log(formatWave0ControlReport("Wave 0 pause recorded.", result));
      });
      return;
    }
    case "wave0:freeze": {
      const positional = getPositionalArgs(cliArgs);
      const waveRunId = positional[0];

      if (!waveRunId) {
        throw new Error("Usage: wave0:freeze <waveRunId> [--actor <name>] [--notes <text>]");
      }

      await withRequiredRepository(forgeConfig, async ({ repository }) => {
        const result = await freezeWave0Run(repository, waveRunId, {
          actorName: getActorName(cliArgs),
          notes: getNotes(cliArgs, "Wave 0 freeze requested from the CLI control surface.")
        });
        console.log(formatWave0ControlReport("Wave 0 freeze recorded.", result));
      });
      return;
    }
    case "wave0:abort": {
      const positional = getPositionalArgs(cliArgs);
      const waveRunId = positional[0];

      if (!waveRunId) {
        throw new Error("Usage: wave0:abort <waveRunId> [--actor <name>] [--notes <text>]");
      }

      await withRequiredRepository(forgeConfig, async ({ repository }) => {
        const result = await abortWave0Run(repository, waveRunId, {
          actorName: getActorName(cliArgs),
          notes: getNotes(cliArgs, "Wave 0 abort requested from the CLI control surface.")
        });
        console.log(formatWave0ControlReport("Wave 0 abort recorded.", result));
      });
      return;
    }
    case "wave0:resume": {
      const positional = getPositionalArgs(cliArgs);
      const waveRunId = positional[0];

      if (!waveRunId) {
        throw new Error("Usage: wave0:resume <waveRunId> [--actor <name>] [--notes <text>]");
      }

      await withRequiredRepository(forgeConfig, async ({ repository }) => {
        const result = await resumeWave0Run(repository, waveRunId, {
          actorName: getActorName(cliArgs),
          notes: getNotes(cliArgs, "Wave 0 resume authorized from the CLI control surface.")
        });
        console.log(formatWave0ControlReport("Wave 0 resume recorded.", result));
      });
      return;
    }
    case "wave0:rollback": {
      const positional = getPositionalArgs(cliArgs);
      const waveRunId = positional[0];

      if (!waveRunId) {
        throw new Error("Usage: wave0:rollback <waveRunId> [--actor <name>] [--reason <text>]");
      }

      await withRequiredRepository(forgeConfig, async ({ repository }) => {
        const result = await rollbackWave0Run(forgeConfig, repository, waveRunId, {
          actorName: getActorName(cliArgs),
          reason:
            getOption(cliArgs, "--reason") ??
            "Operator-requested rollback from the CLI control surface."
        });
        console.log(formatWave0ControlReport("Wave 0 rollback completed.", result));
        console.log("");
        console.log(
          formatWave0RollbackVerificationReport(
            await verifyWave0Rollback(forgeConfig, {
              repository,
              waveRunId,
              mergeCommitSha: result.mergeCommitSha,
              rollbackCommitSha: result.rollbackCommitSha
            })
          )
        );
      });
      return;
    }
    case "wave0:closeout": {
      const positional = getPositionalArgs(cliArgs);
      const waveRunId = positional[0];
      const taskRunId = positional[1];
      const disposition = parseDisposition(getOption(cliArgs, "--disposition"));

      if (!disposition) {
        await withOptionalRepository(forgeConfig, async (session) => {
          const inspection = await inspectWave0SyntheticRun(forgeConfig, {
            repository: session?.repository,
            waveRunId,
            taskRunId
          });
          console.log(formatWave0CloseoutReport(inspection));
        });
        return;
      }

      if (!waveRunId) {
        throw new Error(
          "Usage: wave0:closeout <waveRunId> [taskRunId] --disposition advance|repeat|return [--wave1 yes|no] [--actor <name>] [--notes <text>]"
        );
      }

      await withRequiredRepository(forgeConfig, async ({ repository }) => {
        const result = await closeoutWave0Run(repository, waveRunId, {
          actorName: getActorName(cliArgs),
          finalDisposition: disposition,
          notes: getNotes(cliArgs, "Wave 0 closeout recorded from the CLI control surface."),
          wave1PlanningPermitted: parseBooleanOption(
            getOption(cliArgs, "--wave1"),
            disposition === "advance_to_wave1_planning"
          )
        });
        const inspection = await inspectWave0SyntheticRun(forgeConfig, {
          repository,
          waveRunId,
          taskRunId
        });
        console.log(formatWave0ControlReport("Wave 0 closeout recorded.", result));
        console.log("");
        console.log(formatWave0CloseoutReport(inspection));
      });
      return;
    }
    case "wave0:inspect": {
      const positional = getPositionalArgs(cliArgs);
      await withOptionalRepository(forgeConfig, async (session) => {
        const result = await inspectWave0SyntheticRun(forgeConfig, {
          repository: session?.repository,
          waveRunId: positional[0],
          taskRunId: positional[1]
        });
        console.log(JSON.stringify(result, null, 2));
      });
      return;
    }
    default: {
      console.error(`Unknown command: ${command}`);
      console.error(usage());
      process.exitCode = 1;
    }
  }
}

void main();
