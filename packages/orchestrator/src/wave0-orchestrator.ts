import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import {
  executeWave0AgentRun,
  type AgentProvider,
  type Wave0AgentExecutionResult
} from "@forge/agent-runner";
import type {
  DbJson,
  ForgePersistenceRepository,
  TaskRunStatus,
  WaveDecisionStatus,
  WaveFinalDisposition,
  WaveRunStatus
} from "@forge/db";
import {
  Wave0AuditWriter,
  Wave0EvidenceBundleWriter,
  computeConfidenceScore,
  createManifestVersionRecords,
  createWave0CoreEvidenceRequirements,
  type OperatorInterventionRecord,
  type StateTransitionRecord
} from "@forge/evidence";
import { LocalPolicyEngine, type PolicyEngineLike } from "@forge/policy-engine";
import type {
  ForgeConfig,
  LoadedWavePacketPlan,
  WaveExecutionPlan
} from "@forge/shared";
import {
  LocalRuntimeManager,
  createWave0SyntheticMergeCommitMessage,
  createWorktreeDescriptor,
  executeGit,
  type TaskWorktreeDescriptor
} from "@forge/runtime-manager";
import { LocalFileStorage, type RunStorageScope } from "@forge/storage";
import {
  Wave0ToolBroker,
  type ToolBrokerContext,
  type ToolInvocationResult
} from "@forge/tool-broker";
import {
  runWave0Validators,
  type ValidationAuditEvent,
  type ValidationEvidenceInput,
  type ValidationPolicyDecision,
  type ValidatorCommandSpec,
  type Wave0ValidationRunInput,
  type Wave0ValidationRunResult
} from "@forge/validator-runner";
import { loadWaveExecutionPlan } from "./manifest-loader.js";
import {
  applyWaveOperatorAction,
  assertTaskStatusTransition,
  assertWaveStatusTransition,
  type Wave0OperatorAction
} from "./state-machine.js";

const require = createRequire(import.meta.url);
const tsxLoaderPath = require.resolve("tsx");
const tscCliPath = require.resolve("typescript/lib/tsc.js");
const nodeTypesRoot = path.dirname(
  path.dirname(require.resolve("@types/node/package.json"))
);

export interface WaveLifecycleTransition {
  fromStatus: WaveRunStatus | null;
  toStatus: WaveRunStatus;
  actorType: string;
  actorName?: string | null;
  transitionReason: string;
  decisionStatus?: WaveDecisionStatus;
  finalDisposition?: WaveFinalDisposition | null;
  rollbackPerformed?: boolean;
  metadata?: Record<string, unknown>;
  recordedAt: string;
}

export interface Wave0RunHandle {
  waveRunId: string;
  taskRunId: string;
  waveId: string;
  packetId: string;
  waveStatus: WaveRunStatus;
  taskStatus: TaskRunStatus;
}

export interface Wave0SerialRunOptions {
  taskId?: string;
  rollbackAfterMerge?: boolean;
  reviewerIdentity?: string;
  launchAuthorityName?: string;
  launchWindowId?: string;
  stepDelayMs?: number;
}

export interface Wave0SerialRunResult {
  waveRunId: string;
  taskRunId: string;
  waveId: string;
  packetId: string;
  bundlePath: string;
  summaryPath: string;
  auditLogPath: string;
  policyLogPath: string;
  validationStatus: "pass" | "fail" | "error";
  mergeCommitSha: string | null;
  rollbackCommitSha: string | null;
  failureMessage: string | null;
  waveStatus: WaveRunStatus;
  taskStatus: TaskRunStatus;
  waveTransitions: WaveLifecycleTransition[];
  taskTransitions: StateTransitionRecord[];
  operatorEvents: OperatorInterventionRecord[];
}

export interface Wave0OrchestratorServices {
  runtimeManager?: LocalRuntimeManager;
  repository?: ForgePersistenceRepository;
  policyEngine?: PolicyEngineLike;
  agentProvider?: AgentProvider;
  validatorRunner?: (
    input: Wave0ValidationRunInput
  ) => Promise<Wave0ValidationRunResult>;
  toolBrokerFactory?: (input: {
    policyEngine: PolicyEngineLike;
    auditWriter: Wave0AuditWriter;
  }) => Wave0ToolBroker;
}

interface ExecutionSession {
  executionPlan: WaveExecutionPlan;
  packetPlan: LoadedWavePacketPlan;
  runtimeManager: LocalRuntimeManager;
  repository?: ForgePersistenceRepository;
  waveRunId: string;
  taskRunId: string;
  taskId: string;
  reviewerIdentity: string;
  launchAuthorityName: string;
  storage: LocalFileStorage;
  scope: RunStorageScope;
  auditWriter: Wave0AuditWriter;
  evidenceWriter: Wave0EvidenceBundleWriter;
  broker: Wave0ToolBroker;
  currentWaveStatus: WaveRunStatus;
  currentTaskStatus: TaskRunStatus;
  waveTransitions: WaveLifecycleTransition[];
  taskTransitions: StateTransitionRecord[];
  operatorEvents: OperatorInterventionRecord[];
}

function createRunId(prefix: string): string {
  return `${prefix}-${new Date().toISOString().replace(/[:.]/gu, "-")}`;
}

function toDbJson(value: unknown): DbJson {
  return JSON.parse(JSON.stringify(value ?? {})) as DbJson;
}

function parseChangedFiles(nameStatus: string): string[] {
  return nameStatus
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(/\s+/u).at(-1) ?? "")
    .filter((line) => line.length > 0);
}

function createCommandOverrides(input: {
  workspacePath: string;
  targetPaths: readonly string[];
}): Partial<Record<string, ValidatorCommandSpec>> {
  const testFiles = input.targetPaths.filter((entry) =>
    /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry)
  );

  return {
    compilation: {
      command: process.execPath,
      args: [
        tscCliPath,
        "-p",
        path.join(input.workspacePath, "tsconfig.json"),
        "--noEmit",
        "--typeRoots",
        nodeTypesRoot,
        "--types",
        "node"
      ]
    },
    unit_tests: testFiles.length > 0
      ? {
          command: process.execPath,
          args: ["--import", tsxLoaderPath, "--test", ...testFiles]
        }
      : undefined
  };
}

function toValidationPolicyDecision(
  result: ToolInvocationResult<unknown>
): ValidationPolicyDecision {
  return {
    decision: result.policyDecision,
    toolName: result.toolName,
    reason: result.policyRecord.reason,
    targetPath: result.policyRecord.targetPaths[0] ?? null
  };
}

function toValidationAuditEvent(
  result: ToolInvocationResult<unknown>
): ValidationAuditEvent {
  return {
    eventType: result.auditRecord.event_type,
    sourceComponent: result.auditRecord.source_component,
    message: result.auditRecord.message
  };
}

async function registerValidationArtifacts(
  packetPlan: LoadedWavePacketPlan,
  validation: Wave0ValidationRunResult,
  evidenceWriter: Wave0EvidenceBundleWriter
): Promise<void> {
  evidenceWriter.registerArtifact({
    evidenceType: "validator_outputs",
    source: "validator_runner",
    storageRef: validation.validatorResultsPath
  });

  for (const requirement of [
    ...packetPlan.evidenceManifest.required,
    ...packetPlan.evidenceManifest.conditional
  ]) {
    if (!requirement.source.startsWith("validator.")) {
      continue;
    }

    const validatorId = requirement.source.replace("validator.", "");
    const artifact = validation.validatorArtifacts.find(
      (entry) => entry.validatorId === validatorId
    );
    const validatorResult = validation.results.find(
      (entry) => entry.validatorId === validatorId
    );

    if (!artifact && !validatorResult) {
      continue;
    }

    evidenceWriter.registerArtifact({
      evidenceType: requirement.type,
      source: requirement.source,
      tier: requirement.tier,
      condition: requirement.condition,
      present: Boolean(artifact),
      storageRef: artifact?.filePath,
      metadata: {
        validatorId,
        status: validatorResult?.status ?? "missing"
      }
    });
  }

  const confidenceResult = validation.results.find(
    (entry) => entry.validatorId === "confidence_scoring"
  );

  if (!confidenceResult) {
    return;
  }

  const details = confidenceResult.details as Record<string, unknown>;
  const record = computeConfidenceScore({
    blockingValidatorFailureCount:
      typeof details.blockingValidatorFailureCount === "number"
        ? details.blockingValidatorFailureCount
        : 0,
    blockingValidatorPassCount:
      typeof details.blockingValidatorPassCount === "number"
        ? details.blockingValidatorPassCount
        : 0,
    evidenceCompletenessRatio:
      typeof details.evidenceCompletenessRatio === "number"
        ? details.evidenceCompletenessRatio
        : validation.evidenceSummary.completenessRatio
  });

  await evidenceWriter.recordConfidenceScore(record);
}

async function buildManifestArtifacts(input: {
  executionPlan: WaveExecutionPlan;
  packetPlan: LoadedWavePacketPlan;
}) {
  const manifestSources = [
    {
      location: input.executionPlan.locations.schema,
      manifest: input.executionPlan.schemaSpec
    },
    {
      location: input.executionPlan.locations.registry,
      manifest: input.executionPlan.packetRegistry
    },
    {
      location: input.executionPlan.locations.wave,
      manifest: input.executionPlan.waveManifest
    },
    {
      location: input.executionPlan.locations.benchmark,
      manifest: input.executionPlan.benchmarkManifest
    },
    {
      location: input.packetPlan.locations.packet,
      manifest: input.packetPlan.packetManifest
    },
    {
      location: input.packetPlan.locations.validator,
      manifest: input.packetPlan.validatorManifest
    },
    {
      location: input.packetPlan.locations.evidence,
      manifest: input.packetPlan.evidenceManifest
    },
    {
      location: input.packetPlan.locations.review,
      manifest: input.packetPlan.reviewManifest
    }
  ];

  return {
    manifestVersions: await createManifestVersionRecords(manifestSources)
  };
}

function createWorktreeContext(input: {
  config: ForgeConfig;
  packetPlan: LoadedWavePacketPlan;
  worktreePath: string;
  taskId: string;
  taskRunId: string;
  waveRunId: string;
  worktreeName?: string;
}): ToolBrokerContext {
  return {
    config: input.config,
    packetManifest: input.packetPlan.packetManifest,
    packetManifestRef: input.packetPlan.locations.packet.ref,
    worktreePath: input.worktreePath,
    taskId: input.taskId,
    taskRunId: input.taskRunId,
    waveRunId: input.waveRunId,
    agentRole: "implementer",
    worktreeId: input.worktreeName
  };
}

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function gitObjectExists(
  config: ForgeConfig,
  objectRef: string
): Promise<boolean> {
  const result = await executeGit(config, ["cat-file", "-e", objectRef]);
  return result.exitCode === 0;
}

export class Wave0SerialOrchestrator {
  private readonly runtimeManager: LocalRuntimeManager;
  private readonly repository?: ForgePersistenceRepository;
  private readonly policyEngine: PolicyEngineLike;
  private readonly validatorRunner: (
    input: Wave0ValidationRunInput
  ) => Promise<Wave0ValidationRunResult>;
  private readonly toolBrokerFactory: (input: {
    policyEngine: PolicyEngineLike;
    auditWriter: Wave0AuditWriter;
  }) => Wave0ToolBroker;
  private readonly agentProvider?: AgentProvider;
  private readonly activeSessions = new Map<string, ExecutionSession>();

  constructor(
    private readonly config: ForgeConfig,
    services: Wave0OrchestratorServices = {}
  ) {
    this.runtimeManager =
      services.runtimeManager ?? new LocalRuntimeManager(config, {
        bootstrapCommand: []
      });
    this.repository = services.repository;
    this.policyEngine = services.policyEngine ?? new LocalPolicyEngine(config);
    this.validatorRunner = services.validatorRunner ?? runWave0Validators;
    this.toolBrokerFactory =
      services.toolBrokerFactory ??
      ((input) =>
        new Wave0ToolBroker(input.policyEngine, {
          auditWriter: input.auditWriter
        }));
    this.agentProvider = services.agentProvider;
  }

  async pauseRun(
    waveRunId: string,
    input: { actorName: string; notes: string }
  ): Promise<Wave0RunHandle> {
    return await this.applyOperatorAction(waveRunId, "pause", input);
  }

  async freezeRun(
    waveRunId: string,
    input: { actorName: string; notes: string }
  ): Promise<Wave0RunHandle> {
    return await this.applyOperatorAction(waveRunId, "freeze", input);
  }

  async abortRun(
    waveRunId: string,
    input: { actorName: string; notes: string }
  ): Promise<Wave0RunHandle> {
    return await this.applyOperatorAction(waveRunId, "abort", input);
  }

  private getSession(waveRunId: string): ExecutionSession {
    const session = this.activeSessions.get(waveRunId);

    if (!session) {
      throw new Error(`Wave run ${waveRunId} is not active in this orchestrator process.`);
    }

    return session;
  }

  private toHandle(session: ExecutionSession): Wave0RunHandle {
    return {
      waveRunId: session.waveRunId,
      taskRunId: session.taskRunId,
      waveId: session.executionPlan.waveManifest.wave_id,
      packetId: session.packetPlan.packetManifest.packet_id,
      waveStatus: session.currentWaveStatus,
      taskStatus: session.currentTaskStatus
    };
  }

  private async applyOperatorAction(
    waveRunId: string,
    action: Wave0OperatorAction,
    input: { actorName: string; notes: string }
  ): Promise<Wave0RunHandle> {
    const session = this.getSession(waveRunId);
    const { nextStatus, decisionStatus } = applyWaveOperatorAction(
      session.currentWaveStatus,
      action
    );

    await this.recordOperatorEvent(session, {
      actorName: input.actorName,
      authorityRole: "primary-launch-authority",
      decision: action,
      outcome: `${action}-requested`,
      notes: input.notes
    });
    await this.transitionWave(session, nextStatus, {
      actorType: "operator",
      actorName: input.actorName,
      transitionReason: input.notes,
      decisionStatus
    });

    return this.toHandle(session);
  }

  private async prepareSession(
    options: Wave0SerialRunOptions
  ): Promise<ExecutionSession> {
    const executionPlan = await loadWaveExecutionPlan(this.config);
    const packetPlan = executionPlan.packets.find(
      (entry) => entry.packetManifest.packet_id === this.config.defaultPacketId
    );

    if (!packetPlan) {
      throw new Error(
        `Packet ${this.config.defaultPacketId} is not available in the loaded wave plan.`
      );
    }

    const taskId = options.taskId ?? "task-wave0-synthetic";
    const waveRunId = createRunId("wave0");
    const taskRunId = createRunId(taskId);
    const storage = new LocalFileStorage(this.config);
    const scope = await storage.ensureRunScope(waveRunId, taskRunId);
    const auditWriter = new Wave0AuditWriter(storage, scope, this.repository);
    const evidenceWriter = new Wave0EvidenceBundleWriter(
      storage,
      scope,
      packetPlan.packetManifest.packet_id,
      this.repository
    );
    const broker = this.toolBrokerFactory({
      policyEngine: this.policyEngine,
      auditWriter
    });
    const worktreeDescriptor = createWorktreeDescriptor(
      this.config,
      taskId,
      "wave0-synthetic"
    );

    if (this.repository) {
      await this.repository.createWaveRun({
        wave_run_id: waveRunId,
        wave_id: executionPlan.waveManifest.wave_id,
        packet_id: packetPlan.packetManifest.packet_id,
        benchmark_id: executionPlan.benchmarkManifest.benchmark_id,
        environment: this.config.environment,
        launch_mode: this.config.launchMode,
        review_mode: this.config.reviewMode,
        concurrency_cap: this.config.concurrencyCap,
        phase_branch: this.config.phaseBranch,
        launch_window_id: options.launchWindowId ?? null,
        status: "drafted",
        decision_status: "pending",
        metadata: {
          waveManifestRef: this.config.manifestRefs.wave,
          benchmarkManifestRef: this.config.manifestRefs.benchmark
        }
      });
      await this.repository.createTaskRun({
        task_run_id: taskRunId,
        wave_run_id: waveRunId,
        task_id: taskId,
        packet_id: packetPlan.packetManifest.packet_id,
        task_type: "packet",
        assigned_agent_role: "implementer",
        coding_packet_ref: packetPlan.locations.packet.ref,
        worktree_ref: worktreeDescriptor.worktreePath,
        base_branch: this.config.phaseBranch,
        task_branch: worktreeDescriptor.branchName,
        dependencies: packetPlan.packetManifest.prerequisite_packets,
        status: "drafted",
        metadata: {
          promptTemplateRef: packetPlan.packetManifest.prompt_template_ref,
          contextPackProfile: packetPlan.packetManifest.context_pack_profile
        }
      });
    }

    const session: ExecutionSession = {
      executionPlan,
      packetPlan,
      runtimeManager: this.runtimeManager,
      repository: this.repository,
      waveRunId,
      taskRunId,
      taskId,
      reviewerIdentity: options.reviewerIdentity ?? "local-operator",
      launchAuthorityName: options.launchAuthorityName ?? "local-operator",
      storage,
      scope,
      auditWriter,
      evidenceWriter,
      broker,
      currentWaveStatus: "drafted",
      currentTaskStatus: "drafted",
      waveTransitions: [],
      taskTransitions: [],
      operatorEvents: []
    };

    this.activeSessions.set(session.waveRunId, session);
    return session;
  }

  private async transitionTask(
    session: ExecutionSession,
    toStatus: TaskRunStatus,
    input: {
      actorType: string;
      actorName?: string | null;
      transitionReason: string;
      classification?: string | null;
      failureMessage?: string | null;
      metadata?: Record<string, unknown>;
      completedAt?: Date;
    }
  ): Promise<void> {
    assertTaskStatusTransition(session.currentTaskStatus, toStatus);

    const transition: StateTransitionRecord = {
      fromStatus: session.currentTaskStatus,
      toStatus,
      actorType: input.actorType,
      actorName: input.actorName ?? null,
      transitionReason: input.transitionReason,
      classification: input.classification ?? null,
      metadata: input.metadata ?? {}
    };

    session.taskTransitions.push(transition);
    await session.auditWriter.recordStateTransition(transition);

    if (session.repository) {
      await session.repository.transitionTaskRunState({
        task_run_id: session.taskRunId,
        to_status: toStatus,
        actor_type: input.actorType,
        actor_name: input.actorName ?? null,
        transition_reason: input.transitionReason,
        classification: input.classification ?? null,
        failure_message: input.failureMessage ?? null,
        metadata: toDbJson(input.metadata),
        completed_at: input.completedAt ?? null
      });
    }

    session.currentTaskStatus = toStatus;
  }

  private async transitionWave(
    session: ExecutionSession,
    toStatus: WaveRunStatus,
    input: {
      actorType: string;
      actorName?: string | null;
      transitionReason: string;
      decisionStatus?: WaveDecisionStatus;
      finalDisposition?: WaveFinalDisposition | null;
      rollbackPerformed?: boolean;
      metadata?: Record<string, unknown>;
      completedAt?: Date;
    }
  ): Promise<void> {
    assertWaveStatusTransition(session.currentWaveStatus, toStatus);

    const transition: WaveLifecycleTransition = {
      fromStatus: session.currentWaveStatus,
      toStatus,
      actorType: input.actorType,
      actorName: input.actorName ?? null,
      transitionReason: input.transitionReason,
      decisionStatus: input.decisionStatus,
      finalDisposition: input.finalDisposition,
      rollbackPerformed: input.rollbackPerformed,
      metadata: input.metadata,
      recordedAt: new Date().toISOString()
    };

    session.waveTransitions.push(transition);
    await session.auditWriter.recordEvent({
      category: "lifecycle",
      sourceComponent: input.actorType,
      eventType: "wave.state_changed",
      message: `${session.currentWaveStatus} -> ${toStatus}`,
      payload: {
        fromStatus: session.currentWaveStatus,
        toStatus,
        actorType: input.actorType,
        actorName: input.actorName ?? null,
        transitionReason: input.transitionReason,
        decisionStatus: input.decisionStatus ?? null,
        finalDisposition: input.finalDisposition ?? null,
        rollbackPerformed: input.rollbackPerformed ?? false,
        metadata: input.metadata ?? {}
      }
    });

    if (session.repository) {
      await session.repository.updateWaveRunStatus({
        wave_run_id: session.waveRunId,
        status: toStatus,
        decision_status: input.decisionStatus,
        final_disposition: input.finalDisposition ?? null,
        rollback_performed: input.rollbackPerformed,
        completed_at: input.completedAt ?? null,
        metadata: toDbJson(input.metadata)
      });
    }

    session.currentWaveStatus = toStatus;
  }

  private async recordOperatorEvent(
    session: ExecutionSession,
    event: OperatorInterventionRecord
  ): Promise<void> {
    session.operatorEvents.push(event);
    await session.auditWriter.recordOperatorIntervention(event);
  }

  private async ensurePhaseBranchPrerequisites(
    session: ExecutionSession
  ): Promise<void> {
    const missingPaths: string[] = [];

    for (const artifact of session.packetPlan.packetManifest.prerequisite_artifacts) {
      const exists = await gitObjectExists(
        this.config,
        `${this.config.phaseBranch}:${artifact.path}`
      );

      if (!exists) {
        missingPaths.push(artifact.path);
      }
    }

    if (missingPaths.length === 0) {
      return;
    }

    throw new Error(
      [
        `Phase branch ${this.config.phaseBranch} is missing prerequisite artifacts: ${missingPaths.join(", ")}.`,
        "Wave 0 worktrees are created from committed branch contents only.",
        "Commit the required files onto the phase branch, or point FORGE_PHASE_BRANCH at a branch that already contains them, before launch."
      ].join(" ")
    );
  }

  private async awaitOperatorControl(
    session: ExecutionSession,
    context: string
  ): Promise<void> {
    if (!session.repository) {
      return;
    }

    while (true) {
      const waveRun = await session.repository.getWaveRun(session.waveRunId);
      session.currentWaveStatus = waveRun.status;

      if (waveRun.status === "aborted" || waveRun.status === "closed") {
        throw new Error(
          `Wave 0 ${context} stopped because the operator marked the wave ${waveRun.status}.`
        );
      }

      if (waveRun.status === "paused" || waveRun.status === "frozen") {
        await sleep(250);
        continue;
      }

      return;
    }
  }

  private async waitForHumanReviewClearance(
    session: ExecutionSession,
    reviewRationale: string
  ): Promise<void> {
    if (!session.repository) {
      return;
    }

    await this.recordOperatorEvent(session, {
      actorName: session.reviewerIdentity,
      authorityRole: "primary-launch-authority",
      decision: "pause",
      outcome: "awaiting-human-review",
      notes:
        "Evidence bundle is ready for inspection. Review validators, evidence, policy, and audit outputs, then use wave0:resume to authorize merge-back."
    });
    await this.transitionWave(session, "paused", {
      actorType: "operator",
      actorName: session.reviewerIdentity,
      transitionReason: `Human review hold: ${reviewRationale}`,
      decisionStatus: "paused",
      metadata: {
        holdReason: "awaiting_human_review"
      }
    });

    await this.awaitOperatorControl(session, "human review checkpoint");
  }

  private async failTask(
    session: ExecutionSession,
    classification: string,
    failureMessage: string
  ): Promise<void> {
    if (session.currentTaskStatus === "failed" || session.currentTaskStatus === "canceled") {
      return;
    }

    if (session.currentTaskStatus === "awaiting_review") {
      await this.transitionTask(session, "changes_requested", {
        actorType: "orchestrator",
        transitionReason: failureMessage,
        classification,
        metadata: { failureMessage }
      });
      await this.transitionTask(session, "canceled", {
        actorType: "orchestrator",
        transitionReason: "Wave 0 repair loop intentionally deferred for the serial MVP.",
        metadata: { failureMessage }
      });
      return;
    }

    if (session.currentTaskStatus === "succeeded") {
      await this.transitionTask(session, "blocked", {
        actorType: "orchestrator",
        transitionReason: failureMessage,
        classification,
        metadata: { failureMessage }
      });
      return;
    }

    if (
      [
        "drafted",
        "queued",
        "requeued",
        "blocked",
        "escalated",
        "changes_requested"
      ].includes(session.currentTaskStatus)
    ) {
      await this.transitionTask(session, "canceled", {
        actorType: "orchestrator",
        transitionReason: failureMessage,
        metadata: { failureMessage }
      });
      return;
    }

    await this.transitionTask(session, "failed", {
      actorType: "orchestrator",
      transitionReason: failureMessage,
      classification,
      failureMessage,
      metadata: { failureMessage },
      completedAt: new Date()
    });
  }

  private async abortWave(
    session: ExecutionSession,
    notes: string
  ): Promise<void> {
    if (["aborted", "rolled_back", "completed", "closed"].includes(session.currentWaveStatus)) {
      return;
    }

    const { nextStatus, decisionStatus } = applyWaveOperatorAction(
      session.currentWaveStatus,
      "abort"
    );

    await this.recordOperatorEvent(session, {
      actorName: session.launchAuthorityName,
      authorityRole: "primary-launch-authority",
      decision: "abort",
      outcome: "run-aborted",
      notes
    });
    await this.transitionWave(session, nextStatus, {
      actorType: "operator",
      actorName: session.launchAuthorityName,
      transitionReason: notes,
      decisionStatus
    });
  }

  private async closeWave(
    session: ExecutionSession,
    finalDisposition: WaveFinalDisposition,
    rollbackPerformed: boolean
  ): Promise<void> {
    if (session.currentWaveStatus === "closed") {
      return;
    }

    await this.recordOperatorEvent(session, {
      actorName: session.launchAuthorityName,
      authorityRole: "primary-launch-authority",
      decision: finalDisposition,
      outcome: "closeout-recorded",
      notes: "Wave 0 serial closeout recorded."
    });
    await this.transitionWave(session, "closed", {
      actorType: "operator",
      actorName: session.launchAuthorityName,
      transitionReason: "Wave 0 closeout recorded.",
      decisionStatus: "closed",
      finalDisposition,
      rollbackPerformed,
      completedAt: new Date()
    });
  }

  async execute(
    options: Wave0SerialRunOptions = {}
  ): Promise<Wave0SerialRunResult> {
    const session = await this.prepareSession(options);
    const startedAt = Date.now();
    const timestamps: {
      agentCompletedAt?: string;
      validationCompletedAt?: string;
      mergedAt?: string;
      rollbackAt?: string;
    } = {};

    let validationResult: Wave0ValidationRunResult | null = null;
    let agentResult: Wave0AgentExecutionResult | null = null;
    let mergeCommitSha: string | null = null;
    let rollbackCommitSha: string | null = null;
    let failureMessage: string | null = null;
    let provisionedDescriptor: TaskWorktreeDescriptor | null = null;
    const maybeDelay = async (): Promise<void> => {
      if (typeof options.stepDelayMs === "number" && options.stepDelayMs > 0) {
        await sleep(options.stepDelayMs);
      }
    };

    try {
      await session.auditWriter.recordEvent({
        category: "lifecycle",
        sourceComponent: "orchestrator",
        eventType: "wave.run.started",
        message: "Wave 0 serial execution started.",
        payload: {
          waveId: session.executionPlan.waveManifest.wave_id,
          packetId: session.packetPlan.packetManifest.packet_id,
          packetCount: session.executionPlan.waveManifest.packets.length
        }
      });
      await this.recordOperatorEvent(session, {
        actorName: session.launchAuthorityName,
        authorityRole: "primary-launch-authority",
        decision: "pending",
        outcome: "decision-record-opened",
        notes: "Wave 0 decision record opened for local serial execution."
      });
      await this.transitionWave(session, "ready", {
        actorType: "orchestrator",
        transitionReason: "Wave manifest loaded and packet run record created."
      });
      await this.transitionTask(session, "queued", {
        actorType: "orchestrator",
        transitionReason: "Single Wave 0 packet queued for serial execution."
      });
      await this.transitionTask(session, "scheduled", {
        actorType: "orchestrator",
        transitionReason: "Serial scheduler activated the only ready packet."
      });
      await this.recordOperatorEvent(session, {
        actorName: session.launchAuthorityName,
        authorityRole: "primary-launch-authority",
        decision: "go",
        outcome: "launch-authorized",
        notes: "Wave 0 live GO recorded for the serial local control path."
      });
      await this.transitionWave(session, "active", {
        actorType: "operator",
        actorName: session.launchAuthorityName,
        transitionReason: "GO recorded and live packet execution authorized.",
        decisionStatus: "go"
      });
      await maybeDelay();
      await this.awaitOperatorControl(session, "launch activation");
      await this.ensurePhaseBranchPrerequisites(session);

      const { manifestVersions } = await buildManifestArtifacts({
        executionPlan: session.executionPlan,
        packetPlan: session.packetPlan
      });
      await session.evidenceWriter.recordManifestVersions(manifestVersions);
      await session.evidenceWriter.recordReviewerVerdict({
        packetId: session.packetPlan.packetManifest.packet_id,
        reviewMode: "human",
        reviewerIdentity: session.reviewerIdentity,
        decision: "pending",
        rationale: "Awaiting validator outcomes.",
        conditions: [],
        recordedAt: new Date().toISOString()
      });

      await this.transitionTask(session, "provisioning", {
        actorType: "runtime-manager",
        transitionReason: "Provisioning Wave 0 task worktree."
      });
      const provisioned = await session.runtimeManager.provisionTaskWorktree({
        taskId: session.taskId,
        slug: "wave0-synthetic",
        bootstrapCommand: []
      });
      provisionedDescriptor = provisioned.descriptor;

      await this.transitionTask(session, "running", {
        actorType: "runtime-manager",
        transitionReason: "Worktree provisioned and ready for the implementer agent.",
        metadata: {
          worktreePath: provisioned.descriptor.worktreePath,
          baseCommitSha: provisioned.baseCommitSha,
          branchName: provisioned.descriptor.branchName
        }
      });
      await session.evidenceWriter.recordWorktreeIdentity({
        worktreePath: provisioned.descriptor.worktreePath,
        worktreeName: provisioned.descriptor.worktreeName,
        taskBranch: provisioned.descriptor.branchName,
        phaseBranch: provisioned.descriptor.phaseBranch,
        baseCommitSha: provisioned.baseCommitSha
      });

      const context = createWorktreeContext({
        config: this.config,
        packetPlan: session.packetPlan,
        worktreePath: provisioned.descriptor.worktreePath,
        taskId: session.taskId,
        taskRunId: session.taskRunId,
        waveRunId: session.waveRunId,
        worktreeName: provisioned.descriptor.worktreeName
      });

      agentResult = await executeWave0AgentRun({
        config: this.config,
        packetPlan: session.packetPlan,
        worktreePath: provisioned.descriptor.worktreePath,
        toolBroker: session.broker,
        toolBrokerContext: context,
        provider: this.agentProvider
      });
      timestamps.agentCompletedAt = agentResult.completedAt;

      await session.evidenceWriter.recordContextPackManifest(
        agentResult.contextPack.manifest
      );
      await session.evidenceWriter.recordJsonEvidence({
        relativePath: "context/context-pack.json",
        evidenceType: "agent_context_pack",
        source: "agent_runner",
        value: agentResult.contextPack
      });
      await session.evidenceWriter.recordJsonEvidence({
        relativePath: "runtime/agent-result.json",
        evidenceType: "agent_result",
        source: "agent_runner",
        value: agentResult
      });
      await session.evidenceWriter.recordCostSummary({
        model: agentResult.provider.model,
        promptTokens: agentResult.metrics.promptTokens,
        completionTokens: agentResult.metrics.completionTokens,
        totalTokens: agentResult.metrics.totalTokens,
        toolCallCount: agentResult.metrics.toolCallCount,
        validatorCount: 0,
        durationMs: agentResult.metrics.durationMs
      });
      await session.auditWriter.recordEvent({
        category: "lifecycle",
        sourceComponent: "agent-runner",
        eventType: "agent.completed",
        eventLevel: agentResult.status === "completed" ? "info" : "error",
        message:
          agentResult.status === "completed"
            ? "Synthetic agent run completed."
            : agentResult.failureMessage ?? "Synthetic agent run failed.",
        payload: {
          providerId: agentResult.provider.providerId,
          toolCallCount: agentResult.metrics.toolCallCount,
          turnCount: agentResult.metrics.turnCount,
          filesCreatedOrModified: agentResult.output?.filesCreatedOrModified ?? []
        }
      });

      if (agentResult.status !== "completed") {
        throw new Error(agentResult.failureMessage ?? "Synthetic agent run failed.");
      }
      await maybeDelay();
      await this.awaitOperatorControl(session, "agent handoff");

      const diff = await session.runtimeManager.captureDiff(provisioned.descriptor);
      const changedFiles = parseChangedFiles(diff.nameStatus);

      await session.evidenceWriter.recordTextEvidence({
        relativePath: "git/diff.patch",
        evidenceType: "diff",
        source: "git_diff",
        content: diff.patch,
        metadata: {
          stat: diff.stat,
          nameStatus: diff.nameStatus,
          baseRef: diff.baseRef,
          headRef: diff.headRef
        }
      });
      await session.evidenceWriter.recordTextEvidence({
        relativePath: "git/diff.stat.txt",
        evidenceType: "diff_stat",
        source: "git_diff_stat",
        content: diff.stat
      });
      session.evidenceWriter.registerArtifact({
        evidenceType: "audit_trail",
        source: "tool_broker",
        storageRef: session.auditWriter.paths.consolidatedLogPath
      });
      session.evidenceWriter.registerArtifact({
        evidenceType: "policy_decisions",
        source: "policy_engine",
        storageRef: session.auditWriter.paths.policyDecisionsPath
      });

      await this.transitionTask(session, "awaiting_validation", {
        actorType: "agent-runner",
        transitionReason: "Synthetic outputs produced and awaiting validator handoff."
      });
      await this.transitionTask(session, "validating", {
        actorType: "validator-runner",
        transitionReason: "Blocking validator stack started."
      });

      const providedEvidence: ValidationEvidenceInput[] = [
        {
          evidenceType: "diff",
          source: "git_diff",
          present: true,
          storageRef: session.storage.resolvePath(
            session.scope,
            "evidence",
            "git/diff.patch"
          )
        },
        {
          evidenceType: "context_pack_manifest",
          source: "context_packager",
          present: true,
          storageRef: session.storage.resolvePath(
            session.scope,
            "evidence",
            "context/context-pack-manifest.json"
          )
        },
        {
          evidenceType: "worktree_identity",
          source: "runtime_manager",
          present: true,
          storageRef: session.storage.resolvePath(
            session.scope,
            "evidence",
            "runtime/worktree-identity.json"
          )
        },
        {
          evidenceType: "cost_summary",
          source: "agent_runner",
          present: true,
          storageRef: session.storage.resolvePath(
            session.scope,
            "evidence",
            "runtime/cost-summary.json"
          )
        },
        {
          evidenceType: "reviewer_verdict",
          source: "review_stage",
          present: true,
          storageRef: session.storage.resolvePath(
            session.scope,
            "evidence",
            "review/reviewer-verdict.json"
          )
        },
        {
          evidenceType: "audit_trail",
          source: "tool_broker",
          present: true,
          storageRef: session.auditWriter.paths.consolidatedLogPath
        }
      ];

      validationResult = await this.validatorRunner({
        config: this.config,
        packetManifest: session.packetPlan.packetManifest,
        validatorManifest: session.packetPlan.validatorManifest,
        evidenceManifest: session.packetPlan.evidenceManifest,
        waveId: session.executionPlan.waveManifest.wave_id,
        workspacePath: provisioned.descriptor.worktreePath,
        waveRunId: session.waveRunId,
        taskRunId: session.taskRunId,
        changedFiles,
        providedEvidence,
        commandOverrides: createCommandOverrides({
          workspacePath: provisioned.descriptor.worktreePath,
          targetPaths: session.packetPlan.packetManifest.target_paths
        }),
        policyDecisions: agentResult.toolResults.map((result) =>
          toValidationPolicyDecision(result)
        ),
        auditEvents: agentResult.toolResults.map((result) =>
          toValidationAuditEvent(result)
        ),
        repository: this.repository
      });
      timestamps.validationCompletedAt = validationResult.completedAt;
      await maybeDelay();
      await this.awaitOperatorControl(session, "validation checkpoint");

      await registerValidationArtifacts(
        session.packetPlan,
        validationResult,
        session.evidenceWriter
      );
      await session.auditWriter.recordEvent({
        category: "validator",
        sourceComponent: "validator-runner",
        eventType: "validation.completed",
        message: `Blocking validation status: ${validationResult.blockingStatus}`,
        payload: {
          blockingStatus: validationResult.blockingStatus,
          evidenceStatus: validationResult.evidenceSummary.status
        }
      });

      const reviewDecision =
        validationResult.blockingStatus === "pass" &&
        validationResult.evidenceSummary.status === "complete"
          ? "approve"
          : "reject";
      const reviewRationale =
        reviewDecision === "approve"
          ? "Blocking validators passed and evidence preconditions are complete."
          : "Validation or evidence completeness failed.";

      await session.evidenceWriter.recordReviewerVerdict({
        packetId: session.packetPlan.packetManifest.packet_id,
        reviewMode: "human",
        reviewerIdentity: session.reviewerIdentity,
        decision: reviewDecision,
        rationale: reviewRationale,
        conditions:
          reviewDecision === "approve"
            ? []
            : ["Inspect validator outputs before merge-back."],
        recordedAt: new Date().toISOString()
      });
      await this.recordOperatorEvent(session, {
        actorName: session.reviewerIdentity,
        authorityRole: "primary-launch-authority",
        decision: reviewDecision,
        outcome: reviewDecision === "approve" ? "merge-authorized" : "merge-blocked",
        notes: reviewRationale
      });

      if (reviewDecision !== "approve") {
        await this.failTask(
          session,
          "validator_failure",
          "Blocking validators or evidence completeness failed."
        );
        await this.abortWave(
          session,
          "Wave 0 halted because the synthetic packet did not satisfy validation gates."
        );
      } else {
        await this.transitionTask(session, "awaiting_review", {
          actorType: "validator-runner",
          transitionReason: "Blocking validators passed; awaiting required human review."
        });
        await this.waitForHumanReviewClearance(session, reviewRationale);
        await this.transitionTask(session, "succeeded", {
          actorType: "operator",
          actorName: session.reviewerIdentity,
          transitionReason: "Human-required review approved the synthetic packet."
        });
        await this.transitionTask(session, "merging", {
          actorType: "orchestrator",
          transitionReason: "Serial orchestrator started merge-back."
        });

        const mergeResult = await session.runtimeManager.mergeSuccessfulRun({
          descriptor: provisioned.descriptor,
          commitMessage: createWave0SyntheticMergeCommitMessage(session.taskId)
        });

        if (!mergeResult.merged || mergeResult.conflictDetected || !mergeResult.mergeCommitSha) {
          await this.transitionTask(session, "conflict_resolution", {
            actorType: "orchestrator",
            transitionReason: "Merge-back detected an unexpected conflict.",
            metadata: {
              conflictDetected: mergeResult.conflictDetected
            }
          });
          await this.failTask(
            session,
            "merge_conflict",
            "Wave 0 serial merge-back failed or produced a conflict."
          );
          await this.abortWave(
            session,
            "Wave 0 halted because merge-back did not complete cleanly."
          );
        } else {
          mergeCommitSha = mergeResult.mergeCommitSha;
          timestamps.mergedAt = new Date().toISOString();

          const mergeDiff = await executeGit(this.config, [
            "show",
            "--binary",
            "--stat",
            mergeCommitSha
          ]);
          await session.evidenceWriter.recordTextEvidence({
            relativePath: "git/merge-back.patch",
            evidenceType: "merge_back_diff",
            source: "git_merge_back",
            condition: "packet_merged",
            content: mergeDiff.stdout,
            metadata: {
              mergeCommitSha
            }
          });
        }
      }

      if (mergeCommitSha) {
        await this.transitionTask(session, "merged", {
          actorType: "orchestrator",
          transitionReason: "Synthetic diff merged to the phase branch.",
          metadata: {
            mergeCommitSha
          },
          completedAt: new Date()
        });

        if (options.rollbackAfterMerge) {
          const rollback = await session.runtimeManager.rollbackSyntheticMerge({
            descriptor: {
              taskId: session.taskId,
              slug: "wave0-synthetic",
              phaseBranch: this.config.phaseBranch
            },
            mergeCommitSha,
            reason: "operator-requested rollback validation"
          });
          rollbackCommitSha = rollback.rollbackCommitSha;
          timestamps.rollbackAt = new Date().toISOString();

          session.evidenceWriter.registerArtifact({
            evidenceType: "rollback_status",
            source: "orchestrator",
            storageRef: rollback.rollbackCommitSha,
            metadata: {
              ...rollback
            }
          });
          await this.recordOperatorEvent(session, {
            actorName: session.launchAuthorityName,
            authorityRole: "primary-launch-authority",
            trigger: "rollback flag set",
            decision: "rollback",
            outcome: "synthetic merge reverted",
            notes: rollback.reason
          });
          await this.transitionWave(session, "rolled_back", {
            actorType: "operator",
            actorName: session.launchAuthorityName,
            transitionReason: "Synthetic merge was intentionally rolled back.",
            decisionStatus: "rolled_back",
            rollbackPerformed: true
          });
        } else {
          await this.transitionWave(session, "completed", {
            actorType: "orchestrator",
            transitionReason: "Wave 0 serial packet completed and merged.",
            decisionStatus: "go"
          });
          await maybeDelay();
        }
      }

      await session.evidenceWriter.recordCostSummary({
        model: agentResult.provider.model,
        promptTokens: agentResult.metrics.promptTokens,
        completionTokens: agentResult.metrics.completionTokens,
        totalTokens: agentResult.metrics.totalTokens,
        toolCallCount: agentResult.metrics.toolCallCount,
        validatorCount: validationResult?.results.length ?? 0,
        durationMs: Date.now() - startedAt
      });
    } catch (error) {
      failureMessage = error instanceof Error ? error.message : String(error);
      await session.auditWriter.recordEvent({
        category: "lifecycle",
        sourceComponent: "orchestrator",
        eventType: "wave.run.failed",
        eventLevel: "error",
        message: failureMessage,
        payload: {
          stack: error instanceof Error ? error.stack ?? null : null
        }
      });
      await this.failTask(session, "orchestrator_failure", failureMessage).catch(
        () => undefined
      );
      await this.abortWave(
        session,
        `Wave 0 serial execution failed: ${failureMessage}`
      ).catch(() => undefined);
    } finally {
      if (provisionedDescriptor) {
        await session.runtimeManager.teardownWorktree({
          descriptor: provisionedDescriptor,
          deleteBranch: true
        }).catch(() => undefined);
      }
    }

    await session.evidenceWriter.recordRuntimeTimestamps({
      startedAt: new Date(startedAt).toISOString(),
      agentCompletedAt: timestamps.agentCompletedAt,
      validationCompletedAt: timestamps.validationCompletedAt,
      mergedAt: timestamps.mergedAt,
      rollbackAt: timestamps.rollbackAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt
    });
    session.evidenceWriter.registerArtifact({
      evidenceType: "speculative_start_marker",
      source: "orchestrator",
      metadata: {
        value: false
      }
    });

    const bundle = await session.evidenceWriter.writeBundle({
      evidenceManifest: session.packetPlan.evidenceManifest,
      conditions: {
        validatorRan: validationResult !== null,
        depsChanged: false,
        repairLoopRan: false,
        speculativeStart: false,
        speculativeFreezeOccurred: session.currentWaveStatus === "frozen",
        packetMerged: Boolean(mergeCommitSha),
        mergeConflictResolved: false
      },
      extraRequirements: createWave0CoreEvidenceRequirements(),
      summary: {
        agentStatus: agentResult?.status ?? null,
        agentProviderId: agentResult?.provider.providerId ?? null,
        failureMessage,
        mergeCommitSha,
        rollbackCommitSha,
        validatorBlockingStatus: validationResult?.blockingStatus ?? null,
        validatorEvidenceStatus: validationResult?.evidenceSummary.status ?? null,
        waveStatus: session.currentWaveStatus,
        taskStatus: session.currentTaskStatus
      }
    });

    if (session.currentWaveStatus === "completed") {
      await this.closeWave(session, "advance_to_wave1_planning", false);
    } else if (session.currentWaveStatus === "rolled_back") {
      await this.closeWave(session, "repeat_wave0_live", true);
    } else if (session.currentWaveStatus === "aborted") {
      await this.closeWave(session, "return_to_preparation", false);
    }

    this.activeSessions.delete(session.waveRunId);

    return {
      waveRunId: session.waveRunId,
      taskRunId: session.taskRunId,
      waveId: session.executionPlan.waveManifest.wave_id,
      packetId: session.packetPlan.packetManifest.packet_id,
      bundlePath: bundle.bundlePath,
      summaryPath: bundle.summaryPath,
      auditLogPath: session.auditWriter.paths.consolidatedLogPath,
      policyLogPath: session.auditWriter.paths.policyDecisionsPath,
      validationStatus: validationResult?.blockingStatus ?? "error",
      mergeCommitSha,
      rollbackCommitSha,
      failureMessage,
      waveStatus: session.currentWaveStatus,
      taskStatus: session.currentTaskStatus,
      waveTransitions: [...session.waveTransitions],
      taskTransitions: [...session.taskTransitions],
      operatorEvents: [...session.operatorEvents]
    };
  }
}

export async function executeWave0SerialRun(
  config: ForgeConfig,
  options: Wave0SerialRunOptions = {},
  services: Wave0OrchestratorServices = {}
): Promise<Wave0SerialRunResult> {
  const orchestrator = new Wave0SerialOrchestrator(config, services);
  return await orchestrator.execute(options);
}
