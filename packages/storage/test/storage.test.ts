import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { ForgeConfig } from "@forge/shared";
import {
  LocalFileStorage,
  ensureRunStorageScope,
  listStoredRunScopes
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

test("local file storage provisions per-run roots and persists artifacts", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "forge-storage-"));

  try {
    const config = createConfig(tempRoot);
    const storage = new LocalFileStorage(config);
    const scope = await ensureRunStorageScope(config, "wave-run-001", "task-run-001");

    const jsonArtifact = await storage.writeJson({
      scope,
      area: "evidence",
      relativePath: "bundle/summary.json",
      value: { ok: true }
    });
    const textArtifact = await storage.writeText({
      scope,
      area: "blob",
      relativePath: "patches/synthetic.diff",
      content: "diff --git a/file b/file\n"
    });
    const auditPath = await storage.appendJsonLine({
      scope,
      area: "audit",
      relativePath: "events.jsonl",
      value: { event: "wave.started" }
    });

    assert.match(jsonArtifact.absolutePath, /bundle\/summary\.json$/);
    assert.match(textArtifact.absolutePath, /patches\/synthetic\.diff$/);
    assert.match(auditPath, /events\.jsonl$/);

    const runs = await listStoredRunScopes(config);
    assert.equal(runs.length, 1);
    assert.equal(runs[0]?.waveRunId, "wave-run-001");
    assert.equal(runs[0]?.taskRunId, "task-run-001");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
