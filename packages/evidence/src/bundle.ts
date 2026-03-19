import type {
  DbJson,
  ForgePersistenceRepository,
  UpsertEvidenceItemInput
} from "@forge/db";
import {
  defineForgePackage,
  type EvidenceManifest,
  type EvidenceRequirement,
  type ForgeConfig
} from "@forge/shared";
import {
  LocalFileStorage,
  type RunStorageScope
} from "@forge/storage";
import type {
  CostSummaryRecord,
  ConfidenceScoreRecord,
  ContextPackManifestRecord,
  EvidenceBundleDocument,
  EvidenceBundleWriteResult,
  EvidenceCompletenessInput,
  EvidenceCompletenessResult,
  EvidenceConditions,
  EvidenceItemRegistration,
  EvidenceLayout,
  ManifestVersionRecord,
  RegisteredEvidenceItem,
  ReviewerVerdictRecord,
  RuntimeTimestampsRecord,
  WorktreeIdentityRecord
} from "./types.js";

export const evidencePackage = defineForgePackage({
  name: "@forge/evidence",
  purpose: "Defines the evidence and audit bundle layout for Wave 0 runs.",
  dependsOn: ["@forge/shared", "@forge/storage", "@forge/db"],
  status: "skeleton"
});

const defaultConditions: EvidenceConditions = {
  validatorRan: false,
  depsChanged: false,
  repairLoopRan: false,
  speculativeStart: false,
  speculativeFreezeOccurred: false,
  packetMerged: false,
  mergeConflictResolved: false
};

function toDbJson(value: unknown): DbJson {
  return JSON.parse(JSON.stringify(value ?? {})) as DbJson;
}

function uniqueRequirementKey(requirement: Pick<EvidenceRequirement, "type" | "source">): string {
  return `${requirement.type}:${requirement.source}`;
}

function uniqueItemKey(item: Pick<RegisteredEvidenceItem, "evidenceType" | "source">): string {
  return `${item.evidenceType}:${item.source}`;
}

function evaluateCondition(
  condition: string | undefined,
  conditions: EvidenceConditions
): boolean {
  switch (condition) {
    case undefined:
      return true;
    case "validator_ran":
      return conditions.validatorRan;
    case "deps_changed":
      return conditions.depsChanged;
    case "repair_loop_ran":
      return conditions.repairLoopRan;
    case "speculative_start":
      return conditions.speculativeStart;
    case "speculative_freeze_occurred":
      return conditions.speculativeFreezeOccurred;
    case "packet_merged":
      return conditions.packetMerged;
    case "merge_conflict_resolved":
      return conditions.mergeConflictResolved;
    default:
      return false;
  }
}

function toRegisteredItem(
  registration: EvidenceItemRegistration
): RegisteredEvidenceItem {
  return {
    evidenceType: registration.evidenceType,
    source: registration.source,
    tier: registration.tier ?? 1,
    required: registration.required ?? false,
    present: registration.present ?? true,
    condition: registration.condition,
    storageRef: registration.storageRef,
    metadata: registration.metadata ?? {},
    recordedAt: new Date().toISOString()
  };
}

function mergeRegistration(
  current: RegisteredEvidenceItem | undefined,
  registration: EvidenceItemRegistration
): RegisteredEvidenceItem {
  const next = toRegisteredItem(registration);

  if (!current) {
    return next;
  }

  return {
    ...current,
    ...next,
    required: current.required || next.required,
    present: current.present && next.present ? true : next.present,
    metadata: {
      ...current.metadata,
      ...next.metadata
    },
    recordedAt: next.recordedAt
  };
}

function buildRequiredItems(input: EvidenceCompletenessInput): RegisteredEvidenceItem[] {
  const itemByKey = new Map(
    input.items.map((item) => [uniqueItemKey(item), item])
  );
  const requirements = [
    ...input.evidenceManifest.required,
    ...(input.extraRequirements ?? []),
    ...input.evidenceManifest.conditional
  ];
  const dedupedRequirements = new Map<string, EvidenceRequirement>();

  for (const requirement of requirements) {
    const active = evaluateCondition(requirement.condition, input.conditions);

    if (
      active &&
      !(
        requirement.source.startsWith("validator.") &&
        !itemByKey.has(uniqueRequirementKey(requirement))
      )
    ) {
      dedupedRequirements.set(uniqueRequirementKey(requirement), requirement);
    }
  }

  return Array.from(dedupedRequirements.values()).map((requirement) => {
    const current = itemByKey.get(uniqueRequirementKey(requirement));

    return current
      ? {
          ...current,
          required: true,
          tier: requirement.tier,
          condition: requirement.condition
        }
      : {
          evidenceType: requirement.type,
          source: requirement.source,
          tier: requirement.tier,
          required: true,
          present: false,
          condition: requirement.condition,
          storageRef: undefined,
          metadata: {},
          recordedAt: new Date().toISOString()
        };
  });
}

export function createEvidenceLayout(config: ForgeConfig): EvidenceLayout {
  return {
    evidenceRoot: config.paths.evidenceRoot,
    auditRoot: config.paths.auditRoot,
    logRoot: config.paths.logRoot,
    artifactKinds: [
      "manifests",
      "context-pack",
      "validators",
      "policy",
      "audit",
      "git",
      "runtime",
      "review"
    ] as const
  };
}

export function createWave0CoreEvidenceRequirements(): EvidenceRequirement[] {
  return [
    { type: "manifest_versions", source: "manifest_loader", tier: 1 },
    { type: "validator_outputs", source: "validator_runner", tier: 1 },
    { type: "policy_decisions", source: "policy_engine", tier: 1 },
    { type: "runtime_timestamps", source: "orchestrator", tier: 1 }
  ];
}

export function computeConfidenceScore(input: {
  blockingValidatorFailureCount: number;
  blockingValidatorPassCount: number;
  evidenceCompletenessRatio: number;
}): ConfidenceScoreRecord {
  const validatorWeight =
    input.blockingValidatorPassCount === 0 && input.blockingValidatorFailureCount === 0
      ? 0.4
      : input.blockingValidatorFailureCount > 0
        ? 0.2
        : 0.8;
  const score = Number.parseFloat(
    Math.max(
      0,
      Math.min(
        1,
        validatorWeight * 0.65 + input.evidenceCompletenessRatio * 0.35
      )
    ).toFixed(4)
  );

  return {
    score,
    blockingValidatorFailureCount: input.blockingValidatorFailureCount,
    blockingValidatorPassCount: input.blockingValidatorPassCount,
    evidenceCompletenessRatio: input.evidenceCompletenessRatio
  };
}

export function checkEvidenceCompleteness(
  input: EvidenceCompletenessInput
): EvidenceCompletenessResult {
  const requiredItems = buildRequiredItems(input);
  const optionalItems = input.items.filter((item) => {
    const key = uniqueItemKey(item);
    return !requiredItems.some((requiredItem) => uniqueItemKey(requiredItem) === key);
  });
  const missingItems = requiredItems.filter((item) => !item.present);
  const presentItemCount = requiredItems.filter((item) => item.present).length;
  const mandatoryItemCount = requiredItems.length;
  const completenessRatio =
    mandatoryItemCount === 0 ? 1 : presentItemCount / mandatoryItemCount;

  return {
    status: completenessRatio === 1 ? "complete" : "incomplete",
    completenessRatio,
    mandatoryItemCount,
    presentItemCount,
    requiredItems,
    optionalItems,
    missingItems
  };
}

export class Wave0EvidenceBundleWriter {
  private readonly items = new Map<string, RegisteredEvidenceItem>();

  constructor(
    readonly storage: LocalFileStorage,
    readonly scope: RunStorageScope,
    readonly packetId: string,
    private readonly repository?: ForgePersistenceRepository
  ) {}

  register(registration: EvidenceItemRegistration): RegisteredEvidenceItem {
    const key = `${registration.evidenceType}:${registration.source}`;
    const merged = mergeRegistration(this.items.get(key), registration);
    this.items.set(key, merged);
    return merged;
  }

  listItems(): RegisteredEvidenceItem[] {
    return Array.from(this.items.values()).sort((left, right) =>
      uniqueItemKey(left).localeCompare(uniqueItemKey(right))
    );
  }

  async recordJsonEvidence(input: {
    relativePath: string;
    evidenceType: string;
    source: string;
    value: unknown;
    tier?: number;
    required?: boolean;
    condition?: string;
    metadata?: Record<string, unknown>;
  }): Promise<RegisteredEvidenceItem> {
    const artifact = await this.storage.writeJson({
      scope: this.scope,
      area: "evidence",
      relativePath: input.relativePath,
      value: input.value
    });

    return this.register({
      evidenceType: input.evidenceType,
      source: input.source,
      tier: input.tier,
      required: input.required,
      condition: input.condition,
      storageRef: artifact.storageRef,
      metadata: {
        bytes: artifact.bytes,
        sha256: artifact.sha256,
        ...(input.metadata ?? {})
      }
    });
  }

  async recordTextEvidence(input: {
    relativePath: string;
    evidenceType: string;
    source: string;
    content: string;
    tier?: number;
    required?: boolean;
    condition?: string;
    metadata?: Record<string, unknown>;
  }): Promise<RegisteredEvidenceItem> {
    const artifact = await this.storage.writeText({
      scope: this.scope,
      area: "evidence",
      relativePath: input.relativePath,
      content: input.content
    });

    return this.register({
      evidenceType: input.evidenceType,
      source: input.source,
      tier: input.tier,
      required: input.required,
      condition: input.condition,
      storageRef: artifact.storageRef,
      metadata: {
        bytes: artifact.bytes,
        sha256: artifact.sha256,
        ...(input.metadata ?? {})
      }
    });
  }

  registerArtifact(input: {
    evidenceType: string;
    source: string;
    storageRef?: string;
    tier?: number;
    required?: boolean;
    condition?: string;
    present?: boolean;
    metadata?: Record<string, unknown>;
  }): RegisteredEvidenceItem {
    return this.register({
      evidenceType: input.evidenceType,
      source: input.source,
      storageRef: input.storageRef,
      tier: input.tier,
      required: input.required,
      condition: input.condition,
      present: input.present,
      metadata: input.metadata
    });
  }

  async recordManifestVersions(
    records: readonly ManifestVersionRecord[]
  ): Promise<RegisteredEvidenceItem> {
    return await this.recordJsonEvidence({
      relativePath: "manifests/manifest-versions.json",
      evidenceType: "manifest_versions",
      source: "manifest_loader",
      value: records
    });
  }

  async recordContextPackManifest(
    record: ContextPackManifestRecord
  ): Promise<RegisteredEvidenceItem> {
    return await this.recordJsonEvidence({
      relativePath: "context/context-pack-manifest.json",
      evidenceType: "context_pack_manifest",
      source: "context_packager",
      value: record
    });
  }

  async recordWorktreeIdentity(
    record: WorktreeIdentityRecord
  ): Promise<RegisteredEvidenceItem> {
    return await this.recordJsonEvidence({
      relativePath: "runtime/worktree-identity.json",
      evidenceType: "worktree_identity",
      source: "runtime_manager",
      value: record
    });
  }

  async recordCostSummary(record: CostSummaryRecord): Promise<RegisteredEvidenceItem> {
    return await this.recordJsonEvidence({
      relativePath: "runtime/cost-summary.json",
      evidenceType: "cost_summary",
      source: "agent_runner",
      value: record
    });
  }

  async recordRuntimeTimestamps(
    record: RuntimeTimestampsRecord
  ): Promise<RegisteredEvidenceItem> {
    return await this.recordJsonEvidence({
      relativePath: "runtime/timestamps.json",
      evidenceType: "runtime_timestamps",
      source: "orchestrator",
      value: record
    });
  }

  async recordReviewerVerdict(
    record: ReviewerVerdictRecord
  ): Promise<RegisteredEvidenceItem> {
    return await this.recordJsonEvidence({
      relativePath: "review/reviewer-verdict.json",
      evidenceType: "reviewer_verdict",
      source: "review_stage",
      value: record
    });
  }

  async recordConfidenceScore(
    record: ConfidenceScoreRecord
  ): Promise<RegisteredEvidenceItem> {
    return await this.recordJsonEvidence({
      relativePath: "validators/confidence-score.json",
      evidenceType: "confidence_score",
      source: "validator.confidence_scoring",
      value: record
    });
  }

  finalizeConditions(
    conditions: Partial<EvidenceConditions> = {}
  ): EvidenceConditions {
    return {
      ...defaultConditions,
      ...conditions
    };
  }

  async writeBundle(input: {
    evidenceManifest: EvidenceManifest;
    conditions?: Partial<EvidenceConditions>;
    extraRequirements?: readonly EvidenceRequirement[];
    summary?: Record<string, unknown>;
  }): Promise<EvidenceBundleWriteResult> {
    const conditions = this.finalizeConditions(input.conditions);
    const items = this.listItems();
    const completeness = checkEvidenceCompleteness({
      evidenceManifest: input.evidenceManifest,
      items,
      conditions,
      extraRequirements: input.extraRequirements
    });
    const bundleDocument: EvidenceBundleDocument = {
      waveRunId: this.scope.waveRunId,
      taskRunId: this.scope.taskRunId,
      packetId: this.packetId,
      manifestName: input.evidenceManifest.manifest_name,
      generatedAt: new Date().toISOString(),
      status: completeness.status,
      completenessRatio: completeness.completenessRatio,
      mandatoryItemCount: completeness.mandatoryItemCount,
      presentItemCount: completeness.presentItemCount,
      conditions,
      requiredItems: completeness.requiredItems,
      optionalItems: completeness.optionalItems,
      missingItems: completeness.missingItems,
      summary: input.summary ?? {}
    };

    const bundleArtifact = await this.storage.writeJson({
      scope: this.scope,
      area: "evidence",
      relativePath: "bundle.json",
      value: bundleDocument
    });
    const itemsArtifact = await this.storage.writeJson({
      scope: this.scope,
      area: "evidence",
      relativePath: "evidence-items.json",
      value: items
    });
    const summaryArtifact = await this.storage.writeJson({
      scope: this.scope,
      area: "evidence",
      relativePath: "bundle-summary.json",
      value: {
        status: completeness.status,
        completenessRatio: completeness.completenessRatio,
        mandatoryItemCount: completeness.mandatoryItemCount,
        presentItemCount: completeness.presentItemCount,
        missingItems: completeness.missingItems.map((item) => ({
          evidenceType: item.evidenceType,
          source: item.source
        })),
        summary: input.summary ?? {}
      }
    });

    if (this.repository) {
      const bundle = await this.repository.upsertEvidenceBundle({
        wave_run_id: this.scope.waveRunId,
        task_run_id: this.scope.taskRunId,
        packet_id: this.packetId,
        status: completeness.status,
        completeness_ratio: completeness.completenessRatio,
        mandatory_item_count: completeness.mandatoryItemCount,
        present_item_count: completeness.presentItemCount,
        bundle_ref: bundleArtifact.storageRef,
        summary: toDbJson(bundleDocument.summary),
        completed_at: new Date()
      });

      const requiredKeySet = new Set(
        completeness.requiredItems.map((item) => uniqueItemKey(item))
      );

      for (const item of items) {
        const payload: UpsertEvidenceItemInput = {
          evidence_bundle_id: bundle.evidence_bundle_id,
          task_run_id: this.scope.taskRunId,
          evidence_type: item.evidenceType,
          source: item.source,
          tier: item.tier,
          required: requiredKeySet.has(uniqueItemKey(item)),
          present: item.present,
          condition: item.condition,
          storage_ref: item.storageRef,
          metadata: toDbJson(item.metadata)
        };
        await this.repository.upsertEvidenceItem(payload);
      }
    }

    return {
      bundlePath: bundleArtifact.storageRef,
      summaryPath: summaryArtifact.storageRef,
      itemsPath: itemsArtifact.storageRef,
      completeness
    };
  }
}
