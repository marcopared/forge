import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type {
  EvidenceManifest,
  ForgeConfig
} from "@forge/shared";
import { LocalFileStorage } from "@forge/storage";
import {
  Wave0AuditWriter,
  Wave0EvidenceBundleWriter,
  checkEvidenceCompleteness,
  createContextPackManifest,
  createManifestVersionRecords,
  createWave0CoreEvidenceRequirements
} from "../src/index.js";

function createConfig(rootDir: string): ForgeConfig {
  const runtimeRoot = path.join(rootDir, "var");

  return {
    environment: "test",
    defaultWaveId: "wave-0-live",
    defaultPacketId: "WAVE0-SYNTHETIC",
    defaultBenchmarkId: "wave0-live-smoke",
    phaseBranch: "forge/phase-0-wave0-synthetic",
    launchMode: "operator-launched",
    reviewMode: "human-required",
    concurrencyCap: 1,
    manifestRefs: {
      packetRegistry: "packets/validation/packet-registry.yaml",
      wave: "packets/waves/wave0-live.yaml",
      benchmark: "benchmarks/manifests/wave0-live-smoke.yaml"
    },
    postgres: {
      host: "127.0.0.1",
      port: 5432,
      database: "forge",
      user: "forge",
      password: "forge",
      schema: "forge_test",
      url: "postgresql://forge:forge@127.0.0.1:5432/forge"
    },
    redis: {
      host: "127.0.0.1",
      port: 6379,
      url: "redis://127.0.0.1:6379"
    },
    paths: {
      root: rootDir,
      filesRoot: path.join(rootDir, "files"),
      storageRoot: runtimeRoot,
      blobRoot: path.join(runtimeRoot, "blob"),
      evidenceRoot: path.join(runtimeRoot, "evidence"),
      auditRoot: path.join(runtimeRoot, "audit"),
      logRoot: path.join(runtimeRoot, "logs"),
      worktreeRoot: path.join(runtimeRoot, "worktrees")
    }
  };
}

function createEvidenceManifest(): EvidenceManifest {
  return {
    manifest_kind: "evidence-manifest",
    manifest_name: "standard",
    version: 1,
    status: "ready",
    summary: "test",
    required: [
      { type: "diff", source: "git_diff", tier: 1 },
      { type: "audit_trail", source: "tool_broker", tier: 1 },
      { type: "context_pack_manifest", source: "context_packager", tier: 1 },
      { type: "worktree_identity", source: "runtime_manager", tier: 1 },
      { type: "cost_summary", source: "agent_runner", tier: 1 },
      { type: "reviewer_verdict", source: "review_stage", tier: 1 },
      { type: "confidence_score", source: "validator.confidence_scoring", tier: 1 }
    ],
    conditional: [
      { type: "merge_back_diff", source: "git_merge_back", tier: 1, condition: "packet_merged" }
    ],
    ephemeral_unless_pinned: [],
    notes: []
  };
}

test("evidence completeness enforces Wave 0 required core fields", () => {
  const completeness = checkEvidenceCompleteness({
    evidenceManifest: createEvidenceManifest(),
    items: [
      {
        evidenceType: "diff",
        source: "git_diff",
        tier: 1,
        required: false,
        present: true,
        metadata: {},
        recordedAt: new Date().toISOString()
      }
    ],
    conditions: {
      validatorRan: true,
      depsChanged: false,
      repairLoopRan: false,
      speculativeStart: false,
      speculativeFreezeOccurred: false,
      packetMerged: false,
      mergeConflictResolved: false
    },
    extraRequirements: createWave0CoreEvidenceRequirements()
  });

  assert.equal(completeness.status, "incomplete");
  assert.ok(
    completeness.missingItems.some(
      (item) => item.evidenceType === "manifest_versions"
    )
  );
});

test("bundle writer and audit writer persist an inspectable Wave 0 bundle", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "forge-evidence-"));

  try {
    const config = createConfig(tempRoot);
    const storage = new LocalFileStorage(config);
    const scope = await storage.ensureRunScope("wave-run-1", "task-run-1");

    await fs.mkdir(config.paths.filesRoot, { recursive: true });
    const packetPath = path.join(config.paths.filesRoot, "packets/manifests/WAVE0-SYNTHETIC.yaml");
    const evidencePath = path.join(config.paths.filesRoot, "packets/evidence-manifests/standard.yaml");
    await fs.mkdir(path.dirname(packetPath), { recursive: true });
    await fs.mkdir(path.dirname(evidencePath), { recursive: true });
    await fs.writeFile(packetPath, "packet_id: WAVE0-SYNTHETIC\nversion: 1\n", "utf8");
    await fs.writeFile(evidencePath, "manifest_kind: evidence-manifest\nmanifest_name: standard\nversion: 1\n", "utf8");

    const manifestVersions = await createManifestVersionRecords([
      {
        location: {
          ref: "packets/manifests/WAVE0-SYNTHETIC.yaml",
          absolutePath: packetPath
        },
        manifest: {
          version: 1
        }
      },
      {
        location: {
          ref: "packets/evidence-manifests/standard.yaml",
          absolutePath: evidencePath
        },
        manifest: {
          manifest_name: "standard",
          manifest_kind: "evidence-manifest",
          version: 1
        }
      }
    ]);

    const contextPack = await createContextPackManifest({
      config,
      profile: "foundation-contracts",
      manifestSources: [
        {
          location: {
            ref: "packets/manifests/WAVE0-SYNTHETIC.yaml",
            absolutePath: packetPath
          }
        }
      ]
    });

    const auditWriter = new Wave0AuditWriter(storage, scope);
    await auditWriter.recordEvent({
      category: "lifecycle",
      sourceComponent: "orchestrator",
      eventType: "wave.started",
      message: "Wave started"
    });

    const bundleWriter = new Wave0EvidenceBundleWriter(
      storage,
      scope,
      "WAVE0-SYNTHETIC"
    );
    await bundleWriter.recordManifestVersions(manifestVersions);
    await bundleWriter.recordContextPackManifest(contextPack);
    await bundleWriter.recordTextEvidence({
      relativePath: "git/diff.patch",
      evidenceType: "diff",
      source: "git_diff",
      content: "diff --git a/file b/file\n"
    });
    bundleWriter.registerArtifact({
      evidenceType: "audit_trail",
      source: "tool_broker",
      storageRef: auditWriter.paths.consolidatedLogPath
    });
    bundleWriter.registerArtifact({
      evidenceType: "validator_outputs",
      source: "validator_runner",
      storageRef: "/tmp/validator-results.json"
    });
    bundleWriter.registerArtifact({
      evidenceType: "policy_decisions",
      source: "policy_engine",
      storageRef: auditWriter.paths.policyDecisionsPath
    });
    await bundleWriter.recordWorktreeIdentity({
      worktreePath: "/tmp/worktree",
      taskBranch: "forge/task-wave0",
      phaseBranch: "forge/phase-0-wave0-synthetic",
      baseCommitSha: "abc123"
    });
    await bundleWriter.recordCostSummary({
      model: null,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      toolCallCount: 2,
      validatorCount: 3,
      durationMs: 1000
    });
    await bundleWriter.recordRuntimeTimestamps({
      startedAt: "2026-03-18T10:00:00.000Z",
      completedAt: "2026-03-18T10:00:05.000Z",
      durationMs: 5000
    });
    await bundleWriter.recordReviewerVerdict({
      packetId: "WAVE0-SYNTHETIC",
      reviewMode: "human",
      reviewerIdentity: "local-operator",
      decision: "approve",
      rationale: "Synthetic run passed",
      conditions: [],
      recordedAt: "2026-03-18T10:00:05.000Z"
    });
    await bundleWriter.recordConfidenceScore({
      score: 1,
      blockingValidatorFailureCount: 0,
      blockingValidatorPassCount: 4,
      evidenceCompletenessRatio: 1
    });
    await bundleWriter.recordTextEvidence({
      relativePath: "git/merge-back.patch",
      evidenceType: "merge_back_diff",
      source: "git_merge_back",
      condition: "packet_merged",
      content: "diff --git a/file b/file\n"
    });

    const written = await bundleWriter.writeBundle({
      evidenceManifest: createEvidenceManifest(),
      conditions: {
        validatorRan: true,
        packetMerged: true
      },
      extraRequirements: createWave0CoreEvidenceRequirements(),
      summary: {
        outcome: "success"
      }
    });

    assert.equal(written.completeness.status, "complete");
    assert.equal(
      (await storage.readJson<{ status: string }>(written.summaryPath)).status,
      "complete"
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
