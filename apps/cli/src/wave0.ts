import fs from "node:fs/promises";
import path from "node:path";
import type {
  ForgePersistenceRepository,
  WaveFinalDisposition,
  WaveRunLifecycle,
  WaveRunStatus
} from "@forge/db";
import {
  assertWaveStatusTransition,
  executeWave0SerialRun,
  loadWaveExecutionPlan
} from "@forge/orchestrator";
import {
  executeGit,
  LocalRuntimeManager,
  type RollbackResult
} from "@forge/runtime-manager";
import type { ForgeConfig } from "@forge/shared";
import {
  LocalFileStorage,
  listStoredRunScopes,
  type RunStorageScope
} from "@forge/storage";

interface Wave0RunOptions {
  taskId?: string;
  rollbackAfterMerge?: boolean;
  repository?: ForgePersistenceRepository;
  stepDelayMs?: number;
}

interface Wave0RunSelection {
  waveRunId: string;
  taskRunId: string;
}

interface Wave0RunFiles {
  scope: RunStorageScope;
  bundlePath: string;
  summaryPath: string;
  auditLogPath: string;
  policyLogPath: string;
  validatorResultsPath: string;
}

interface StoredValidatorResult {
  validatorId: string;
  layer: string;
  blocking: boolean;
  status: string;
  message?: string;
}

interface StoredPolicyDecision {
  decision: string;
  toolName: string;
  reason: string;
  targetPaths?: string[];
}

interface StoredAuditEvent {
  eventType: string;
  sourceComponent: string;
  eventLevel: string;
  message: string;
}

export interface Wave0RunInspection {
  waveRunId: string;
  taskRunId: string;
  files: Wave0RunFiles;
  lifecycle: WaveRunLifecycle | null;
  summary: Record<string, unknown> | null;
  bundle: Record<string, unknown> | null;
  auditLines: string[];
  policyLines: string[];
  validatorResults: StoredValidatorResult[];
  policyRecords: StoredPolicyDecision[];
  auditRecords: StoredAuditEvent[];
}

export interface Wave0ControlResult {
  waveRunId: string;
  status: WaveRunStatus;
  decisionStatus: string;
  finalDisposition: WaveFinalDisposition | null;
  rollbackPerformed: boolean;
}

export interface Wave0RollbackSummary extends Wave0ControlResult {
  rollbackCommitSha: string;
  mergeCommitSha: string;
}

type Wave0BenchmarkRequirement = "pass" | "record";
type Wave0BenchmarkResult = "pass" | "fail";

interface Wave0SmokeCheck {
  id: string;
  requirement: Wave0BenchmarkRequirement;
  expectation: string;
  result: Wave0BenchmarkResult;
  observed: string;
}

interface Wave0MergeVerification {
  status: Wave0BenchmarkResult;
  mergeCommitSha: string | null;
  phaseHeadSha: string | null;
  changedFiles: string[];
  missingTargetPaths: string[];
  unexpectedPaths: string[];
}

export interface Wave0SmokeVerification {
  waveRunId: string;
  taskRunId: string;
  benchmarkId: string;
  overallStatus: Wave0BenchmarkResult;
  checks: Wave0SmokeCheck[];
  mergeVerification: Wave0MergeVerification;
  reportPath: string;
}

export interface Wave0RollbackVerification {
  waveRunId: string;
  taskRunId: string;
  status: Wave0BenchmarkResult;
  phaseBranch: string;
  mergeCommitSha: string;
  rollbackCommitSha: string;
  parentCommitSha: string | null;
  phaseHeadSha: string | null;
  driftFiles: string[];
  reportPath: string;
}

export interface Wave0MetricsReport {
  waveRunId: string;
  taskRunId: string;
  packetOutcome: string;
  validatorStatus: string;
  evidenceCompleteness: string;
  policyDecisionSummary: string;
  runtimeHealth: string;
  operatorDecisionLatency: string;
  escalationClearanceTime: string;
  auditTrailGrowth: string;
  operatorInterventionBurden: string;
  benchmarkSmokeVisibility: string;
  repairLoopCount: string;
  speculativeMarker: string;
  securityAlerts: string;
  metricsAnomalies: string;
}

function formatRatio(value: number | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "n/a";
  }

  return `${(value * 100).toFixed(0)}%`;
}

function formatTimestamp(value: unknown): string {
  return typeof value === "string" && value.length > 0 ? value : "n/a";
}

function formatList(items: readonly string[], fallback = "none"): string {
  return items.length > 0 ? items.join(", ") : fallback;
}

function toJsonRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizePath(value: string): string {
  return value.replace(/\\/gu, "/").replace(/^\.\//u, "");
}

function uniqueSorted(items: readonly string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter((item) => item.length > 0))].sort();
}

function getRollbackCommitSha(inspection: Wave0RunInspection): string | null {
  const summary = toJsonRecord(inspection.summary?.summary);
  const rollbackCommitSha = summary?.rollbackCommitSha;
  return typeof rollbackCommitSha === "string" && rollbackCommitSha.length > 0
    ? rollbackCommitSha
    : null;
}

function getDecisionCounts(inspection: Wave0RunInspection): Record<string, number> {
  const decisions =
    inspection.lifecycle?.policyDecisions.map((decision) => decision.decision) ??
    inspection.policyRecords.map((decision) => decision.decision.toLowerCase());

  return decisions.reduce<Record<string, number>>((accumulator, decision) => {
    accumulator[decision] = (accumulator[decision] ?? 0) + 1;
    return accumulator;
  }, {});
}

function getValidatorResults(inspection: Wave0RunInspection): StoredValidatorResult[] {
  if (inspection.lifecycle?.validatorResults.length) {
    return inspection.lifecycle.validatorResults.map((result) => ({
      validatorId: result.validator_id,
      layer: result.validator_layer,
      blocking: result.blocking,
      status: result.status,
      message: result.message ?? undefined
    }));
  }

  return inspection.validatorResults;
}

function getValidatorStatus(
  inspection: Wave0RunInspection,
  validatorId: string
): string | null {
  const result = getValidatorResults(inspection).find(
    (entry) => entry.validatorId === validatorId
  );
  return result ? result.status : null;
}

function hasAuditEvent(
  inspection: Wave0RunInspection,
  eventType: string
): boolean {
  const records =
    inspection.lifecycle?.auditEvents.map((event) => ({
      eventType: event.event_type,
      sourceComponent: event.source_component
    })) ??
    inspection.auditRecords;

  return records.some((record) => record.eventType === eventType);
}

async function readJsonIfPresent<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

async function readLinesIfPresent(filePath: string): Promise<string[]> {
  try {
    const rawValue = await fs.readFile(filePath, "utf8");
    return rawValue
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch {
    return [];
  }
}

async function readJsonLinesIfPresent<T>(filePath: string): Promise<T[]> {
  try {
    const lines = await readLinesIfPresent(filePath);
    return lines.map((line) => JSON.parse(line) as T);
  } catch {
    return [];
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function gitLines(
  config: ForgeConfig,
  args: readonly string[]
): Promise<string[]> {
  const result = await executeGit(config, args);

  if (result.exitCode !== 0) {
    return [];
  }

  return result.stdout
    .split("\n")
    .map((line) => normalizePath(line.trim()))
    .filter((line) => line.length > 0);
}

async function gitValue(
  config: ForgeConfig,
  args: readonly string[]
): Promise<string | null> {
  const result = await executeGit(config, args);
  return result.exitCode === 0 ? result.stdout.trim() || null : null;
}

async function pickLatestStoredRun(
  config: ForgeConfig
): Promise<Wave0RunSelection | null> {
  const scopes = await listStoredRunScopes(config);

  if (scopes.length === 0) {
    return null;
  }

  const entries = await Promise.all(
    scopes.map(async (scope) => {
      const summaryPath = path.join(scope.evidenceRoot, "bundle-summary.json");
      const auditPath = path.join(scope.auditRoot, "events.jsonl");
      const [summaryStats, auditStats] = await Promise.all([
        fs.stat(summaryPath).catch(() => null),
        fs.stat(auditPath).catch(() => null)
      ]);
      return {
        waveRunId: scope.waveRunId,
        taskRunId: scope.taskRunId,
        mtimeMs: Math.max(summaryStats?.mtimeMs ?? 0, auditStats?.mtimeMs ?? 0)
      };
    })
  );

  entries.sort((left, right) => right.mtimeMs - left.mtimeMs);
  const selected = entries[0];
  return selected
    ? {
        waveRunId: selected.waveRunId,
        taskRunId: selected.taskRunId
      }
    : null;
}

async function pickLatestRun(
  config: ForgeConfig,
  repository?: ForgePersistenceRepository
): Promise<Wave0RunSelection | null> {
  if (repository) {
    const waveRuns = await repository.listWaveRuns({
      limit: 1,
      wave_id: config.defaultWaveId,
      packet_id: config.defaultPacketId
    });
    const latest = waveRuns[0];

    if (latest) {
      const lifecycle = await repository.getWaveRunLifecycle(latest.wave_run_id);
      const taskRunId = lifecycle.taskRuns[0]?.task_run_id;

      if (taskRunId) {
        return {
          waveRunId: latest.wave_run_id,
          taskRunId
        };
      }
    }
  }

  return await pickLatestStoredRun(config);
}

async function resolveRunSelection(
  config: ForgeConfig,
  repository: ForgePersistenceRepository | undefined,
  waveRunId?: string,
  taskRunId?: string
): Promise<Wave0RunSelection> {
  if (waveRunId && taskRunId) {
    return { waveRunId, taskRunId };
  }

  if (waveRunId && repository) {
    const lifecycle = await repository.getWaveRunLifecycle(waveRunId);
    const resolvedTaskRunId = lifecycle.taskRuns[0]?.task_run_id;

    if (!resolvedTaskRunId) {
      throw new Error(`Wave run ${waveRunId} does not contain a task run.`);
    }

    return {
      waveRunId,
      taskRunId: resolvedTaskRunId
    };
  }

  const selectedRun = await pickLatestRun(config, repository);

  if (!selectedRun) {
    throw new Error("No stored Wave 0 runs were found.");
  }

  return selectedRun;
}

async function loadRunFiles(
  config: ForgeConfig,
  selection: Wave0RunSelection
): Promise<Wave0RunFiles> {
  const storage = new LocalFileStorage(config);
  const scope = storage.createRunScope(selection.waveRunId, selection.taskRunId);

  return {
    scope,
    bundlePath: path.join(scope.evidenceRoot, "bundle.json"),
    summaryPath: path.join(scope.evidenceRoot, "bundle-summary.json"),
    auditLogPath: path.join(scope.auditRoot, "events.jsonl"),
    policyLogPath: path.join(scope.auditRoot, "policy-decisions.jsonl"),
    validatorResultsPath: path.join(scope.evidenceRoot, "validators", "validator-results.json")
  };
}

function getMergeCommitSha(inspection: Wave0RunInspection): string | null {
  const summary = inspection.summary;
  const nestedSummary = toJsonRecord(summary?.summary);
  const mergeCommitSha = nestedSummary?.mergeCommitSha;
  return typeof mergeCommitSha === "string" && mergeCommitSha.length > 0
    ? mergeCommitSha
    : null;
}

export async function executeWave0SyntheticRun(
  config: ForgeConfig,
  options: Wave0RunOptions = {}
) {
  return await executeWave0SerialRun(
    config,
    {
      taskId: options.taskId,
      rollbackAfterMerge: options.rollbackAfterMerge,
      stepDelayMs: options.stepDelayMs
    },
    {
      repository: options.repository
    }
  );
}

export async function inspectWave0SyntheticRun(
  config: ForgeConfig,
  options: {
    repository?: ForgePersistenceRepository;
    waveRunId?: string;
    taskRunId?: string;
  } = {}
): Promise<Wave0RunInspection> {
  const selection = await resolveRunSelection(
    config,
    options.repository,
    options.waveRunId,
    options.taskRunId
  );
  const files = await loadRunFiles(config, selection);
  const [summary, bundle, auditLines, policyLines, validatorResults, policyRecords, auditRecords, lifecycle] = await Promise.all([
    readJsonIfPresent<Record<string, unknown>>(files.summaryPath),
    readJsonIfPresent<Record<string, unknown>>(files.bundlePath),
    readLinesIfPresent(files.auditLogPath),
    readLinesIfPresent(files.policyLogPath),
    readJsonIfPresent<StoredValidatorResult[]>(files.validatorResultsPath).then(
      (results) => results ?? []
    ),
    readJsonLinesIfPresent<StoredPolicyDecision>(files.policyLogPath),
    readJsonLinesIfPresent<StoredAuditEvent>(files.auditLogPath),
    options.repository
      ? options.repository.getWaveRunLifecycle(selection.waveRunId)
      : Promise.resolve(null)
  ]);

  return {
    waveRunId: selection.waveRunId,
    taskRunId: selection.taskRunId,
    files,
    lifecycle,
    summary,
    bundle,
    auditLines,
    policyLines,
    validatorResults,
    policyRecords,
    auditRecords
  };
}

async function loadLifecycleOrThrow(
  repository: ForgePersistenceRepository,
  waveRunId: string
): Promise<WaveRunLifecycle> {
  return await repository.getWaveRunLifecycle(waveRunId);
}

function summarizeControlResult(lifecycle: WaveRunLifecycle): Wave0ControlResult {
  return {
    waveRunId: lifecycle.waveRun.wave_run_id,
    status: lifecycle.waveRun.status,
    decisionStatus: lifecycle.waveRun.decision_status,
    finalDisposition: lifecycle.waveRun.final_disposition,
    rollbackPerformed: lifecycle.waveRun.rollback_performed
  };
}

export async function pauseWave0Run(
  repository: ForgePersistenceRepository,
  waveRunId: string,
  input: { actorName: string; notes: string }
): Promise<Wave0ControlResult> {
  const lifecycle = await loadLifecycleOrThrow(repository, waveRunId);
  const { nextStatus, decisionStatus } =
    lifecycle.waveRun.status === "paused"
      ? { nextStatus: "paused" as const, decisionStatus: "paused" as const }
      : (() => {
          assertWaveStatusTransition(lifecycle.waveRun.status, "paused");
          return {
            nextStatus: "paused" as const,
            decisionStatus: "paused" as const
          };
        })();

  await repository.createOperatorEvent({
    wave_run_id: waveRunId,
    task_run_id: lifecycle.taskRuns[0]?.task_run_id ?? null,
    event_kind: "pause_requested",
    actor_name: input.actorName,
    authority_role: "primary-launch-authority",
    decision: "pause",
    outcome: "run-paused",
    notes: input.notes
  });
  await repository.updateWaveRunStatus({
    wave_run_id: waveRunId,
    status: nextStatus,
    decision_status: decisionStatus,
    metadata: {
      lastOperatorAction: "pause",
      lastOperatorNotes: input.notes
    }
  });

  return summarizeControlResult(await repository.getWaveRunLifecycle(waveRunId));
}

export async function abortWave0Run(
  repository: ForgePersistenceRepository,
  waveRunId: string,
  input: { actorName: string; notes: string }
): Promise<Wave0ControlResult> {
  const lifecycle = await loadLifecycleOrThrow(repository, waveRunId);
  const { nextStatus, decisionStatus } =
    lifecycle.waveRun.status === "aborted"
      ? { nextStatus: "aborted" as const, decisionStatus: "aborted" as const }
      : (() => {
          assertWaveStatusTransition(lifecycle.waveRun.status, "aborted");
          return {
            nextStatus: "aborted" as const,
            decisionStatus: "aborted" as const
          };
        })();

  await repository.createOperatorEvent({
    wave_run_id: waveRunId,
    task_run_id: lifecycle.taskRuns[0]?.task_run_id ?? null,
    event_kind: "abort_requested",
    actor_name: input.actorName,
    authority_role: "primary-launch-authority",
    decision: "abort",
    outcome: "run-aborted",
    notes: input.notes
  });
  await repository.updateWaveRunStatus({
    wave_run_id: waveRunId,
    status: nextStatus,
    decision_status: decisionStatus,
    metadata: {
      lastOperatorAction: "abort",
      lastOperatorNotes: input.notes
    }
  });

  return summarizeControlResult(await repository.getWaveRunLifecycle(waveRunId));
}

export async function freezeWave0Run(
  repository: ForgePersistenceRepository,
  waveRunId: string,
  input: { actorName: string; notes: string }
): Promise<Wave0ControlResult> {
  const lifecycle = await loadLifecycleOrThrow(repository, waveRunId);
  const { nextStatus, decisionStatus } =
    lifecycle.waveRun.status === "frozen"
      ? { nextStatus: "frozen" as const, decisionStatus: "frozen" as const }
      : (() => {
          assertWaveStatusTransition(lifecycle.waveRun.status, "frozen");
          return {
            nextStatus: "frozen" as const,
            decisionStatus: "frozen" as const
          };
        })();

  await repository.createOperatorEvent({
    wave_run_id: waveRunId,
    task_run_id: lifecycle.taskRuns[0]?.task_run_id ?? null,
    event_kind: "freeze_requested",
    actor_name: input.actorName,
    authority_role: "primary-launch-authority",
    decision: "freeze",
    outcome: "wave-frozen",
    notes: input.notes
  });
  await repository.updateWaveRunStatus({
    wave_run_id: waveRunId,
    status: nextStatus,
    decision_status: decisionStatus,
    metadata: {
      lastOperatorAction: "freeze",
      lastOperatorNotes: input.notes
    }
  });

  return summarizeControlResult(await repository.getWaveRunLifecycle(waveRunId));
}

export async function resumeWave0Run(
  repository: ForgePersistenceRepository,
  waveRunId: string,
  input: { actorName: string; notes: string }
): Promise<Wave0ControlResult> {
  const lifecycle = await loadLifecycleOrThrow(repository, waveRunId);

  if (lifecycle.waveRun.status !== "paused" && lifecycle.waveRun.status !== "frozen") {
    throw new Error(
      `Wave run ${waveRunId} is ${lifecycle.waveRun.status}; only paused or frozen runs can resume.`
    );
  }

  assertWaveStatusTransition(lifecycle.waveRun.status, "active");
  await repository.createOperatorEvent({
    wave_run_id: waveRunId,
    task_run_id: lifecycle.taskRuns[0]?.task_run_id ?? null,
    event_kind: "resume_requested",
    actor_name: input.actorName,
    authority_role: "primary-launch-authority",
    decision: "resume",
    outcome: "run-resumed",
    notes: input.notes
  });
  await repository.updateWaveRunStatus({
    wave_run_id: waveRunId,
    status: "active",
    decision_status: "go",
    metadata: {
      lastOperatorAction: "resume",
      lastOperatorNotes: input.notes
    }
  });

  return summarizeControlResult(await repository.getWaveRunLifecycle(waveRunId));
}

export async function rollbackWave0Run(
  config: ForgeConfig,
  repository: ForgePersistenceRepository,
  waveRunId: string,
  input: { actorName: string; reason: string }
): Promise<Wave0RollbackSummary> {
  const inspection = await inspectWave0SyntheticRun(config, {
    repository,
    waveRunId
  });
  const mergeCommitSha = getMergeCommitSha(inspection);

  if (!mergeCommitSha) {
    throw new Error(
      `Wave run ${waveRunId} does not expose a merge commit SHA in its evidence bundle summary.`
    );
  }

  const runtimeManager = new LocalRuntimeManager(config);
  const lifecycle = inspection.lifecycle;

  if (!lifecycle) {
    throw new Error(`Wave run ${waveRunId} does not have persisted lifecycle data.`);
  }

  const rollback = await runtimeManager.rollbackSyntheticMerge({
    descriptor: {
      taskId: lifecycle.taskRuns[0]?.task_id ?? "task-wave0-synthetic",
      slug: "wave0-synthetic",
      phaseBranch: config.phaseBranch
    },
    mergeCommitSha,
    reason: input.reason
  });

  await repository.createOperatorEvent({
    wave_run_id: waveRunId,
    task_run_id: lifecycle.taskRuns[0]?.task_run_id ?? null,
    event_kind: "rollback_requested",
    actor_name: input.actorName,
    authority_role: "primary-launch-authority",
    decision: "rollback",
    outcome: "synthetic-merge-reverted",
    notes: input.reason,
    metadata: {
      rollbackCommitSha: rollback.rollbackCommitSha,
      mergeCommitSha
    }
  });

  if (lifecycle.waveRun.status === "closed") {
    await repository.updateWaveRunStatus({
      wave_run_id: waveRunId,
      status: "closed",
      decision_status: "closed",
      rollback_performed: true,
      metadata: {
        rollbackCommitSha: rollback.rollbackCommitSha,
        mergeCommitSha,
        rollbackReason: input.reason
      }
    });
  } else if (lifecycle.waveRun.status !== "rolled_back") {
    assertWaveStatusTransition(lifecycle.waveRun.status, "rolled_back");
    await repository.updateWaveRunStatus({
      wave_run_id: waveRunId,
      status: "rolled_back",
      decision_status: "rolled_back",
      rollback_performed: true,
      metadata: {
        rollbackCommitSha: rollback.rollbackCommitSha,
        mergeCommitSha,
        rollbackReason: input.reason
      }
    });
  }

  const updatedLifecycle = await repository.getWaveRunLifecycle(waveRunId);
  return {
    ...summarizeControlResult(updatedLifecycle),
    rollbackCommitSha: rollback.rollbackCommitSha,
    mergeCommitSha
  };
}

export async function closeoutWave0Run(
  repository: ForgePersistenceRepository,
  waveRunId: string,
  input: {
    actorName: string;
    finalDisposition: WaveFinalDisposition;
    notes: string;
    wave1PlanningPermitted: boolean;
  }
): Promise<Wave0ControlResult> {
  const lifecycle = await loadLifecycleOrThrow(repository, waveRunId);

  if (lifecycle.waveRun.status !== "closed") {
    assertWaveStatusTransition(lifecycle.waveRun.status, "closed");
  }

  await repository.createOperatorEvent({
    wave_run_id: waveRunId,
    task_run_id: lifecycle.taskRuns[0]?.task_run_id ?? null,
    event_kind: "closeout_recorded",
    actor_name: input.actorName,
    authority_role: "primary-launch-authority",
    decision: input.finalDisposition,
    outcome: "closeout-recorded",
    notes: input.notes,
    metadata: {
      wave1PlanningPermitted: input.wave1PlanningPermitted
    }
  });
  await repository.updateWaveRunStatus({
    wave_run_id: waveRunId,
    status: "closed",
    decision_status: "closed",
    final_disposition: input.finalDisposition,
    rollback_performed: lifecycle.waveRun.rollback_performed,
    completed_at: new Date(),
    metadata: {
      wave1PlanningPermitted: input.wave1PlanningPermitted,
      closeoutNotes: input.notes
    }
  });

  return summarizeControlResult(await repository.getWaveRunLifecycle(waveRunId));
}

function createSmokeCheck(input: {
  id: string;
  requirement: Wave0BenchmarkRequirement;
  expectation: string;
  passed: boolean;
  observed: string;
}): Wave0SmokeCheck {
  return {
    id: input.id,
    requirement: input.requirement,
    expectation: input.expectation,
    result: input.passed ? "pass" : "fail",
    observed: input.observed
  };
}

function getExpectation(
  expectedOutcomes: Record<string, { expectation: string }>,
  key: string,
  fallback: string
): string {
  return expectedOutcomes[key]?.expectation ?? fallback;
}

function getPhaseBranch(
  inspection: Wave0RunInspection,
  config: ForgeConfig
): string {
  return inspection.lifecycle?.waveRun.phase_branch ?? config.phaseBranch;
}

async function verifyMergeBack(
  config: ForgeConfig,
  inspection: Wave0RunInspection,
  targetPaths: readonly string[]
): Promise<Wave0MergeVerification> {
  const mergeCommitSha = getMergeCommitSha(inspection);

  if (!mergeCommitSha) {
    return {
      status: "fail",
      mergeCommitSha: null,
      phaseHeadSha: await gitValue(config, ["rev-parse", getPhaseBranch(inspection, config)]),
      changedFiles: [],
      missingTargetPaths: uniqueSorted(targetPaths),
      unexpectedPaths: []
    };
  }

  const [changedFiles, phaseHeadSha] = await Promise.all([
    gitLines(config, ["diff-tree", "--no-commit-id", "--name-only", "-r", mergeCommitSha]),
    gitValue(config, ["rev-parse", getPhaseBranch(inspection, config)])
  ]);
  const normalizedTargets = uniqueSorted(targetPaths.map((targetPath) => normalizePath(targetPath)));
  const missingTargetPaths = normalizedTargets.filter(
    (targetPath) => !changedFiles.includes(targetPath)
  );
  const unexpectedPaths = changedFiles.filter(
    (changedPath) => !normalizedTargets.includes(changedPath)
  );
  const status =
    phaseHeadSha === mergeCommitSha &&
    missingTargetPaths.length === 0 &&
    unexpectedPaths.length === 0
      ? "pass"
      : "fail";

  return {
    status,
    mergeCommitSha,
    phaseHeadSha,
    changedFiles,
    missingTargetPaths,
    unexpectedPaths
  };
}

async function persistRunReport<T>(
  config: ForgeConfig,
  inspection: Wave0RunInspection,
  relativePath: string,
  value: T
): Promise<string> {
  const storage = new LocalFileStorage(config);
  const artifact = await storage.writeJson({
    scope: inspection.files.scope,
    area: "evidence",
    relativePath,
    value
  });
  return artifact.storageRef;
}

export async function verifyWave0LiveSmoke(
  config: ForgeConfig,
  options: {
    repository?: ForgePersistenceRepository;
    waveRunId?: string;
    taskRunId?: string;
  } = {}
): Promise<Wave0SmokeVerification> {
  const [inspection, executionPlan] = await Promise.all([
    inspectWave0SyntheticRun(config, options),
    loadWaveExecutionPlan(config)
  ]);
  const summary = toJsonRecord(inspection.summary?.summary);
  const bundle = inspection.bundle;
  const conditions = toJsonRecord(bundle?.conditions);
  const benchmark = executionPlan.benchmarkManifest;
  const targetPaths = executionPlan.packets.find(
    (entry) => entry.packetManifest.packet_id === config.defaultPacketId
  )?.packetManifest.target_paths ?? [];
  const mergeVerification = await verifyMergeBack(config, inspection, targetPaths);
  const validatorResults = getValidatorResults(inspection);
  const decisionCounts = getDecisionCounts(inspection);
  const essentialAuditEventsPassed =
    hasAuditEvent(inspection, "wave.run.started") &&
    hasAuditEvent(inspection, "agent.completed") &&
    hasAuditEvent(inspection, "validation.completed") &&
    hasAuditEvent(inspection, "wave.state_changed") &&
    hasAuditEvent(inspection, "task.state_changed") &&
    hasAuditEvent(inspection, "policy.decision");
  const confidenceScorePath = path.join(
    inspection.files.scope.evidenceRoot,
    "validators",
    "confidence-score.json"
  );
  const costSummaryPath = path.join(
    inspection.files.scope.evidenceRoot,
    "runtime",
    "cost-summary.json"
  );
  const contextPackManifestPath = path.join(
    inspection.files.scope.evidenceRoot,
    "context",
    "context-pack-manifest.json"
  );
  const worktreeIdentityPath = path.join(
    inspection.files.scope.evidenceRoot,
    "runtime",
    "worktree-identity.json"
  );

  const [hasValidatorResults, hasCostSummary, hasContextPackManifest, hasWorktreeIdentity, hasConfidenceScore] =
    await Promise.all([
      pathExists(inspection.files.validatorResultsPath),
      pathExists(costSummaryPath),
      pathExists(contextPackManifestPath),
      pathExists(worktreeIdentityPath),
      pathExists(confidenceScorePath)
    ]);

  const checks: Wave0SmokeCheck[] = [
    createSmokeCheck({
      id: "packet_completion",
      requirement: "pass",
      expectation: getExpectation(
        benchmark.expected_outcomes,
        "packet_completion",
        "Wave 0 reaches terminal success through the approved local control path."
      ),
      passed:
        summary?.failureMessage == null &&
        (summary?.waveStatus === "completed" || summary?.waveStatus === "closed") &&
        summary?.taskStatus === "merged",
      observed: `wave=${String(summary?.waveStatus ?? "unknown")}, task=${String(summary?.taskStatus ?? "unknown")}, failure=${String(summary?.failureMessage ?? "none")}`
    }),
    createSmokeCheck({
      id: "validator_pass_set",
      requirement: "pass",
      expectation: getExpectation(
        benchmark.expected_outcomes,
        "validator_pass_set",
        "All blocking validators PASS."
      ),
      passed:
        validatorResults.length > 0 &&
        ["compilation", "lint", "unit_tests", "architecture_check", "scope_drift", "protected_paths"].every(
          (validatorId) => getValidatorStatus(inspection, validatorId) === "pass"
        ),
      observed: validatorResults
        .map((result) => `${result.validatorId}=${result.status}`)
        .join(", ") || "no validator results found"
    }),
    createSmokeCheck({
      id: "evidence_completeness",
      requirement: "pass",
      expectation: getExpectation(
        benchmark.expected_outcomes,
        "evidence_completeness",
        "Evidence bundle is complete."
      ),
      passed: bundle?.status === "complete" && inspection.summary?.status === "complete",
      observed: `bundle=${String(bundle?.status ?? "unknown")}, summary=${String(inspection.summary?.status ?? "unknown")}`
    }),
    createSmokeCheck({
      id: "policy_behavior",
      requirement: "pass",
      expectation: getExpectation(
        benchmark.expected_outcomes,
        "policy_behavior",
        "Policy decisions remain ALLOW-only on the happy path."
      ),
      passed: (decisionCounts.deny ?? 0) === 0 && (decisionCounts.escalate ?? 0) === 0 && (decisionCounts.allow ?? 0) > 0,
      observed: `allow=${decisionCounts.allow ?? 0}, deny=${decisionCounts.deny ?? 0}, escalate=${decisionCounts.escalate ?? 0}`
    }),
    createSmokeCheck({
      id: "merge_back_correctness",
      requirement: "pass",
      expectation: getExpectation(
        benchmark.expected_outcomes,
        "merge_back_correctness",
        "Merge-back applies only the approved synthetic diff."
      ),
      passed: mergeVerification.status === "pass",
      observed:
        mergeVerification.status === "pass"
          ? `${mergeVerification.mergeCommitSha} touches ${mergeVerification.changedFiles.join(", ")}`
          : `merge=${mergeVerification.mergeCommitSha ?? "n/a"}, missing=${formatList(mergeVerification.missingTargetPaths)}, unexpected=${formatList(mergeVerification.unexpectedPaths)}`
    }),
    createSmokeCheck({
      id: "audit_trail_completeness",
      requirement: "pass",
      expectation: getExpectation(
        benchmark.expected_outcomes,
        "audit_trail_completeness",
        "Audit trail records all live actions without gaps."
      ),
      passed: inspection.auditRecords.length > 0 && essentialAuditEventsPassed,
      observed: `${inspection.auditRecords.length} audit events captured`
    }),
    createSmokeCheck({
      id: "speculative_start_marker",
      requirement: "pass",
      expectation: getExpectation(
        benchmark.expected_outcomes,
        "speculative_start_marker",
        "Speculative marker remains false."
      ),
      passed: conditions?.speculativeStart === false,
      observed: `speculativeStart=${String(conditions?.speculativeStart ?? "missing")}`
    }),
    createSmokeCheck({
      id: "operator_failure_interpretation",
      requirement: "pass",
      expectation: getExpectation(
        benchmark.expected_outcomes,
        "operator_failure_interpretation",
        "Failures are treated as live control events, not rehearsal noise."
      ),
      passed: summary?.failureMessage == null,
      observed:
        summary?.failureMessage == null
          ? "No live failure was raised during the happy-path run."
          : `failure observed: ${String(summary.failureMessage)}`
    }),
    createSmokeCheck({
      id: "validator_results",
      requirement: "record",
      expectation: "Validator results are recorded.",
      passed: hasValidatorResults,
      observed: hasValidatorResults ? inspection.files.validatorResultsPath : "missing validator-results.json"
    }),
    createSmokeCheck({
      id: "policy_decision_log",
      requirement: "record",
      expectation: "Policy decision log is recorded.",
      passed: inspection.policyRecords.length > 0,
      observed:
        inspection.policyRecords.length > 0
          ? inspection.files.policyLogPath
          : "missing policy decision records"
    }),
    createSmokeCheck({
      id: "cost_summary",
      requirement: "record",
      expectation: getExpectation(
        benchmark.expected_outcomes,
        "cost_summary",
        "Token count, duration, and model are recorded."
      ),
      passed: hasCostSummary,
      observed: hasCostSummary ? costSummaryPath : "missing cost-summary.json"
    }),
    createSmokeCheck({
      id: "context_pack_manifest",
      requirement: "record",
      expectation: getExpectation(
        benchmark.expected_outcomes,
        "context_pack_manifest",
        "Context pack manifest is recorded."
      ),
      passed: hasContextPackManifest,
      observed: hasContextPackManifest ? contextPackManifestPath : "missing context-pack-manifest.json"
    }),
    createSmokeCheck({
      id: "worktree_identity",
      requirement: "record",
      expectation: getExpectation(
        benchmark.expected_outcomes,
        "worktree_identity",
        "Worktree identity is recorded."
      ),
      passed: hasWorktreeIdentity,
      observed: hasWorktreeIdentity ? worktreeIdentityPath : "missing worktree-identity.json"
    }),
    createSmokeCheck({
      id: "confidence_score",
      requirement: "record",
      expectation: "Confidence score is recorded.",
      passed: hasConfidenceScore,
      observed: hasConfidenceScore ? confidenceScorePath : "missing confidence-score.json"
    })
  ];

  const report: Omit<Wave0SmokeVerification, "reportPath"> = {
    waveRunId: inspection.waveRunId,
    taskRunId: inspection.taskRunId,
    benchmarkId: benchmark.benchmark_id,
    overallStatus: checks.every((check) => check.result === "pass") ? "pass" : "fail",
    checks,
    mergeVerification
  };
  const reportPath = await persistRunReport(
    config,
    inspection,
    "smoke/live-smoke-report.json",
    report
  );

  return {
    ...report,
    reportPath
  };
}

export async function verifyWave0Rollback(
  config: ForgeConfig,
  options: {
    repository?: ForgePersistenceRepository;
    waveRunId?: string;
    taskRunId?: string;
    mergeCommitSha?: string;
    rollbackCommitSha?: string;
  } = {}
): Promise<Wave0RollbackVerification> {
  const inspection = await inspectWave0SyntheticRun(config, options);
  const mergeCommitSha = options.mergeCommitSha ?? getMergeCommitSha(inspection);
  const rollbackCommitSha =
    options.rollbackCommitSha ?? getRollbackCommitSha(inspection);

  if (!mergeCommitSha || !rollbackCommitSha) {
    const missing = !mergeCommitSha ? "merge commit" : "rollback commit";
    const report: Omit<Wave0RollbackVerification, "reportPath"> = {
      waveRunId: inspection.waveRunId,
      taskRunId: inspection.taskRunId,
      status: "fail",
      phaseBranch: getPhaseBranch(inspection, config),
      mergeCommitSha: mergeCommitSha ?? "missing",
      rollbackCommitSha: rollbackCommitSha ?? "missing",
      parentCommitSha: null,
      phaseHeadSha: await gitValue(config, ["rev-parse", getPhaseBranch(inspection, config)]),
      driftFiles: [missing]
    };
    const reportPath = await persistRunReport(
      config,
      inspection,
      "smoke/rollback-verification.json",
      report
    );

    return {
      ...report,
      reportPath
    };
  }

  const phaseBranch = getPhaseBranch(inspection, config);
  const [parentCommitSha, phaseHeadSha] = await Promise.all([
    gitValue(config, ["rev-parse", `${mergeCommitSha}^`]),
    gitValue(config, ["rev-parse", phaseBranch])
  ]);
  const driftFiles = parentCommitSha
    ? await gitLines(config, ["diff", "--name-only", parentCommitSha, phaseBranch])
    : ["missing merge parent"];
  const status =
    parentCommitSha !== null &&
    phaseHeadSha === rollbackCommitSha &&
    driftFiles.length === 0
      ? "pass"
      : "fail";
  const report: Omit<Wave0RollbackVerification, "reportPath"> = {
    waveRunId: inspection.waveRunId,
    taskRunId: inspection.taskRunId,
    status,
    phaseBranch,
    mergeCommitSha,
    rollbackCommitSha,
    parentCommitSha,
    phaseHeadSha,
    driftFiles
  };
  const reportPath = await persistRunReport(
    config,
    inspection,
    "smoke/rollback-verification.json",
    report
  );

  return {
    ...report,
    reportPath
  };
}

function formatDurationMs(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return "n/a";
  }

  if (value < 1000) {
    return `${value}ms`;
  }

  return `${(value / 1000).toFixed(1)}s`;
}

export function createWave0MetricsReport(
  inspection: Wave0RunInspection
): Wave0MetricsReport {
  const lifecycle = inspection.lifecycle;
  const summary = toJsonRecord(inspection.summary?.summary);
  const bundle = inspection.bundle;
  const conditions = toJsonRecord(bundle?.conditions);
  const decisionCounts = lifecycle?.summary.policyDecisionCounts ?? getDecisionCounts(inspection);
  const validatorResults = getValidatorResults(inspection);
  const operatorEvents = lifecycle?.operatorEvents ?? [];
  const blockingFailures = validatorResults.filter(
    (result) => result.blocking && (result.status === "fail" || result.status === "error")
  ).length;
  const decisionLatencyMs = operatorEvents
    .map((event) => event.decision_latency_ms)
    .find((value) => typeof value === "number" && value >= 0);
  const escalationClearanceMs = operatorEvents
    .map((event) => event.escalation_clearance_ms)
    .find((value) => typeof value === "number" && value >= 0);
  const metricsAnomalies: string[] = [];

  if (!bundle) {
    metricsAnomalies.push("missing evidence bundle");
  }

  if (validatorResults.length === 0) {
    metricsAnomalies.push("missing validator results");
  }

  if ((decisionCounts.allow ?? 0) === 0) {
    metricsAnomalies.push("missing ALLOW policy decisions");
  }

  if (inspection.auditRecords.length === 0) {
    metricsAnomalies.push("missing audit events");
  }

  return {
    waveRunId: inspection.waveRunId,
    taskRunId: inspection.taskRunId,
    packetOutcome: String(summary?.taskStatus ?? lifecycle?.taskRuns[0]?.status ?? "unknown"),
    validatorStatus:
      validatorResults.length === 0
        ? "n/a"
        : blockingFailures === 0
          ? "PASS"
          : `${blockingFailures} blocking failure(s)`,
    evidenceCompleteness:
      bundle && typeof bundle.completenessRatio === "number"
        ? `${bundle.status} (${formatRatio(bundle.completenessRatio)})`
        : "n/a",
    policyDecisionSummary: `allow=${decisionCounts.allow ?? 0}, deny=${decisionCounts.deny ?? 0}, escalate=${decisionCounts.escalate ?? 0}`,
    runtimeHealth:
      summary?.failureMessage == null
        ? "no runtime failure recorded"
        : `failure recorded: ${String(summary.failureMessage)}`,
    operatorDecisionLatency: formatDurationMs(decisionLatencyMs),
    escalationClearanceTime: formatDurationMs(escalationClearanceMs),
    auditTrailGrowth:
      inspection.auditRecords.length > 0
        ? `${inspection.auditRecords.length} event(s) captured`
        : "no audit events captured",
    operatorInterventionBurden: `${operatorEvents.length} intervention(s)`,
    benchmarkSmokeVisibility:
      summary?.failureMessage == null ? "available" : "review required",
    repairLoopCount: "0",
    speculativeMarker:
      typeof conditions?.speculativeStart === "boolean"
        ? String(conditions.speculativeStart)
        : "n/a",
    securityAlerts:
      (decisionCounts.deny ?? 0) === 0 && (decisionCounts.escalate ?? 0) === 0
        ? "none recorded"
        : "policy anomalies recorded",
    metricsAnomalies:
      metricsAnomalies.length > 0 ? metricsAnomalies.join(", ") : "none recorded"
  };
}

export function formatWave0LaunchResult(
  result: Awaited<ReturnType<typeof executeWave0SyntheticRun>>
): string {
  return [
    "Wave 0 live launch finished.",
    `Wave run: ${result.waveRunId}`,
    `Task run: ${result.taskRunId}`,
    `Wave status: ${result.waveStatus}`,
    `Task status: ${result.taskStatus}`,
    `Validation: ${result.validationStatus}`,
    `Merge commit: ${result.mergeCommitSha ?? "n/a"}`,
    `Rollback commit: ${result.rollbackCommitSha ?? "n/a"}`,
    `Evidence summary: ${result.summaryPath}`,
    `Audit log: ${result.auditLogPath}`,
    `Policy log: ${result.policyLogPath}`,
    `Failure: ${result.failureMessage ?? "none"}`
  ].join("\n");
}

export function formatWave0StatusReport(inspection: Wave0RunInspection): string {
  const lifecycle = inspection.lifecycle;
  const summary = inspection.summary;
  const nestedSummary = toJsonRecord(summary?.summary);
  const policyCounts = lifecycle?.summary.policyDecisionCounts ?? getDecisionCounts(inspection);
  const operatorCount =
    lifecycle?.summary.operatorInterventionCount ?? lifecycle?.operatorEvents.length ?? 0;

  return [
    "Wave 0 status",
    `Wave run: ${inspection.waveRunId}`,
    `Task run: ${inspection.taskRunId}`,
    `Wave status: ${lifecycle?.waveRun.status ?? String(nestedSummary?.waveStatus ?? "unknown")}`,
    `Decision: ${lifecycle?.waveRun.decision_status ?? "n/a"}`,
    `Disposition: ${lifecycle?.waveRun.final_disposition ?? "n/a"}`,
    `Task status: ${lifecycle?.taskRuns[0]?.status ?? String(nestedSummary?.taskStatus ?? "unknown")}`,
    `Evidence completeness: ${formatRatio(
      typeof summary?.completenessRatio === "number"
        ? summary.completenessRatio
        : lifecycle?.summary.evidenceCompleteness
    )}`,
    `Policy decisions: allow=${policyCounts?.allow ?? 0}, deny=${policyCounts?.deny ?? 0}, escalate=${policyCounts?.escalate ?? 0}`,
    `Audit events: ${lifecycle?.summary.auditEventCount ?? inspection.auditLines.length}`,
    `Operator interventions: ${operatorCount}`,
    `Merge commit: ${getMergeCommitSha(inspection) ?? "n/a"}`,
    `Rollback performed: ${lifecycle?.waveRun.rollback_performed ? "yes" : "no"}`
  ].join("\n");
}

export function formatWave0TaskReport(inspection: Wave0RunInspection): string {
  const lifecycle = inspection.lifecycle;
  const taskRun = lifecycle?.taskRuns[0];
  const transitions = lifecycle?.taskTransitions ?? [];

  return [
    "Wave 0 packet/task status",
    `Packet: ${taskRun?.packet_id ?? "WAVE0-SYNTHETIC"}`,
    `Task id: ${taskRun?.task_id ?? "n/a"}`,
    `Task run: ${inspection.taskRunId}`,
    `Status: ${taskRun?.status ?? "unknown"}`,
    `Assigned role: ${taskRun?.assigned_agent_role ?? "implementer"}`,
    `Base branch: ${taskRun?.base_branch ?? "n/a"}`,
    `Task branch: ${taskRun?.task_branch ?? "n/a"}`,
    `Worktree: ${taskRun?.worktree_ref ?? "n/a"}`,
    `Started: ${formatTimestamp(taskRun?.started_at?.toISOString())}`,
    `Completed: ${formatTimestamp(taskRun?.completed_at?.toISOString())}`,
    `Transitions: ${transitions.map((entry) => entry.to_status).join(" -> ") || "n/a"}`
  ].join("\n");
}

export function formatWave0ValidatorReport(inspection: Wave0RunInspection): string {
  const results = getValidatorResults(inspection);

  if (results.length === 0) {
    return [
      "Wave 0 validator results",
      "No persisted validator results were found for this run."
    ].join("\n");
  }

  const lines = results.map(
    (result) =>
      `- ${result.validatorId}: ${result.status} (${result.layer}${result.blocking ? ", blocking" : ""})${result.message ? ` - ${result.message}` : ""}`
  );

  return ["Wave 0 validator results", ...lines].join("\n");
}

export function formatWave0EvidenceReport(inspection: Wave0RunInspection): string {
  const summary = inspection.summary;
  const bundle = inspection.bundle;
  const missingItems = Array.isArray(summary?.missingItems)
    ? summary.missingItems
        .map((item) => toJsonRecord(item))
        .filter((item): item is Record<string, unknown> => item !== null)
        .map((item) => `${String(item.evidenceType)}:${String(item.source)}`)
    : [];
  const conditions = toJsonRecord(bundle?.conditions);

  return [
    "Wave 0 evidence bundle",
    `Summary path: ${inspection.files.summaryPath}`,
    `Bundle path: ${inspection.files.bundlePath}`,
    `Completeness: ${formatRatio(
      typeof summary?.completenessRatio === "number" ? summary.completenessRatio : undefined
    )}`,
    `Mandatory items: ${String(summary?.mandatoryItemCount ?? "n/a")}`,
    `Present items: ${String(summary?.presentItemCount ?? "n/a")}`,
    `Missing items: ${formatList(missingItems)}`,
    `Speculative marker: ${
      typeof conditions?.speculativeStart === "boolean"
        ? String(conditions.speculativeStart)
        : "n/a"
    }`,
    `Bundle status: ${String(bundle?.status ?? "n/a")}`
  ].join("\n");
}

export function formatWave0PolicyReport(inspection: Wave0RunInspection): string {
  const decisions =
    inspection.lifecycle?.policyDecisions.map((decision) => ({
      decision: decision.decision,
      toolName: decision.tool_name,
      targetPath: decision.target_path ?? "(no target)",
      reason: decision.reason
    })) ??
    inspection.policyRecords.map((decision) => ({
      decision: decision.decision.toLowerCase(),
      toolName: decision.toolName,
      targetPath: decision.targetPaths?.[0] ?? "(no target)",
      reason: decision.reason
    }));

  if (decisions.length === 0) {
    return [
      "Wave 0 policy log",
      `Policy log path: ${inspection.files.policyLogPath}`,
      "No persisted policy decisions were found."
    ].join("\n");
  }

  const counts = decisions.reduce<Record<string, number>>((accumulator, decision) => {
    accumulator[decision.decision] = (accumulator[decision.decision] ?? 0) + 1;
    return accumulator;
  }, {});

  return [
    "Wave 0 policy log",
    `Policy log path: ${inspection.files.policyLogPath}`,
    `Decision counts: allow=${counts.allow ?? 0}, deny=${counts.deny ?? 0}, escalate=${counts.escalate ?? 0}`,
    ...decisions.map(
      (decision) =>
        `- ${decision.decision.toUpperCase()} ${decision.toolName} ${decision.targetPath} - ${decision.reason}`
    )
  ].join("\n");
}

export function formatWave0AuditReport(inspection: Wave0RunInspection): string {
  const lifecycle = inspection.lifecycle;
  const recentEvents =
    lifecycle?.auditEvents.slice(-5).map((event) => ({
      eventType: event.event_type,
      sourceComponent: event.source_component
    })) ??
    inspection.auditRecords.slice(-5);
  const recentOperatorEvents = lifecycle?.operatorEvents.slice(-3) ?? [];

  return [
    "Wave 0 audit summary",
    `Audit log path: ${inspection.files.auditLogPath}`,
    `Audit event count: ${lifecycle?.summary.auditEventCount ?? inspection.auditRecords.length}`,
    `Operator intervention count: ${lifecycle?.summary.operatorInterventionCount ?? 0}`,
    `Recent audit events: ${
      recentEvents.length > 0
        ? recentEvents
            .map((event) => `${event.eventType}@${event.sourceComponent}`)
            .join(", ")
        : "none"
    }`,
    `Recent operator events: ${
      recentOperatorEvents.length > 0
        ? recentOperatorEvents
            .map((event) => `${event.decision ?? event.event_kind}:${event.outcome ?? "n/a"}`)
            .join(", ")
        : "none"
    }`
  ].join("\n");
}

export function formatWave0ControlReport(
  label: string,
  result: Wave0ControlResult | Wave0RollbackSummary
): string {
  const lines = [
    label,
    `Wave run: ${result.waveRunId}`,
    `Status: ${result.status}`,
    `Decision: ${result.decisionStatus}`,
    `Disposition: ${result.finalDisposition ?? "n/a"}`,
    `Rollback performed: ${result.rollbackPerformed ? "yes" : "no"}`
  ];

  if ("rollbackCommitSha" in result) {
    lines.push(`Merge commit: ${result.mergeCommitSha}`);
    lines.push(`Rollback commit: ${result.rollbackCommitSha}`);
  }

  return lines.join("\n");
}

export function formatWave0SmokeReport(report: Wave0SmokeVerification): string {
  return [
    "Wave 0 live smoke verification",
    `Benchmark: ${report.benchmarkId}`,
    `Wave run: ${report.waveRunId}`,
    `Task run: ${report.taskRunId}`,
    `Overall status: ${report.overallStatus.toUpperCase()}`,
    `Merge verification: ${report.mergeVerification.status.toUpperCase()} (${report.mergeVerification.mergeCommitSha ?? "no merge commit"})`,
    `Smoke report: ${report.reportPath}`,
    ...report.checks.map(
      (check) =>
        `- ${check.id}: ${check.result.toUpperCase()} [${check.requirement}] - ${check.observed}`
    )
  ].join("\n");
}

export function formatWave0RollbackVerificationReport(
  report: Wave0RollbackVerification
): string {
  return [
    "Wave 0 rollback verification",
    `Wave run: ${report.waveRunId}`,
    `Task run: ${report.taskRunId}`,
    `Status: ${report.status.toUpperCase()}`,
    `Phase branch: ${report.phaseBranch}`,
    `Merge commit: ${report.mergeCommitSha}`,
    `Rollback commit: ${report.rollbackCommitSha}`,
    `Parent commit: ${report.parentCommitSha ?? "n/a"}`,
    `Phase head: ${report.phaseHeadSha ?? "n/a"}`,
    `Tree drift: ${formatList(report.driftFiles)}`,
    `Rollback report: ${report.reportPath}`
  ].join("\n");
}

export function formatWave0CloseoutReport(inspection: Wave0RunInspection): string {
  const lifecycle = inspection.lifecycle;
  const bundleSummary = toJsonRecord(inspection.summary?.summary);

  return [
    "Wave 0 closeout summary",
    `Wave run: ${inspection.waveRunId}`,
    `Final status: ${lifecycle?.waveRun.status ?? "unknown"}`,
    `Decision: ${lifecycle?.waveRun.decision_status ?? "n/a"}`,
    `Disposition: ${lifecycle?.waveRun.final_disposition ?? "n/a"}`,
    `Rollback performed: ${lifecycle?.waveRun.rollback_performed ? "yes" : "no"}`,
    `Validator blocking status: ${String(bundleSummary?.validatorBlockingStatus ?? "n/a")}`,
    `Validator evidence status: ${String(bundleSummary?.validatorEvidenceStatus ?? "n/a")}`,
    `Evidence completeness: ${formatRatio(
      typeof inspection.summary?.completenessRatio === "number"
        ? inspection.summary.completenessRatio
        : lifecycle?.summary.evidenceCompleteness
    )}`,
    `Policy pattern: allow=${lifecycle?.summary.policyDecisionCounts.allow ?? 0}, deny=${lifecycle?.summary.policyDecisionCounts.deny ?? 0}, escalate=${lifecycle?.summary.policyDecisionCounts.escalate ?? 0}`,
    `Audit continuity events: ${lifecycle?.summary.auditEventCount ?? inspection.auditLines.length}`,
    `Operator interventions: ${lifecycle?.summary.operatorInterventionCount ?? 0}`,
    `Merge commit: ${getMergeCommitSha(inspection) ?? "n/a"}`,
    `Evidence summary: ${inspection.files.summaryPath}`
  ].join("\n");
}

export function formatWave0MetricsReport(report: Wave0MetricsReport): string {
  return [
    "Wave 0 live metrics",
    `Wave run: ${report.waveRunId}`,
    `Task run: ${report.taskRunId}`,
    `Packet outcome: ${report.packetOutcome}`,
    `Validator status: ${report.validatorStatus}`,
    `Evidence completeness: ${report.evidenceCompleteness}`,
    `Policy decisions: ${report.policyDecisionSummary}`,
    `Runtime health: ${report.runtimeHealth}`,
    `Operator decision latency: ${report.operatorDecisionLatency}`,
    `Escalation clearance: ${report.escalationClearanceTime}`,
    `Audit trail growth: ${report.auditTrailGrowth}`,
    `Operator intervention burden: ${report.operatorInterventionBurden}`,
    `Benchmark smoke visibility: ${report.benchmarkSmokeVisibility}`,
    `Repair-loop count: ${report.repairLoopCount}`,
    `Speculative marker: ${report.speculativeMarker}`,
    `Security alerts: ${report.securityAlerts}`,
    `Metrics anomalies: ${report.metricsAnomalies}`
  ].join("\n");
}

export type { RollbackResult };
