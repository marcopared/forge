import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import type { ForgeConfig, PacketManifest } from "@forge/shared";
import { LocalPolicyEngine } from "../src/index.js";

function createConfig(): ForgeConfig {
  const root = process.cwd();

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
      schema: "forge_local",
      url: "postgresql://forge:forge@127.0.0.1:5432/forge"
    },
    redis: {
      host: "127.0.0.1",
      port: 6379,
      url: "redis://127.0.0.1:6379"
    },
    paths: {
      root,
      filesRoot: path.join(root, "files"),
      storageRoot: path.join(root, "var"),
      blobRoot: path.join(root, "var", "blob"),
      evidenceRoot: path.join(root, "var", "evidence"),
      auditRoot: path.join(root, "var", "audit"),
      logRoot: path.join(root, "var", "logs"),
      worktreeRoot: path.join(root, "var", "worktrees")
    }
  };
}

function createPacketManifest(): PacketManifest {
  return {
    packet_id: "WAVE0-SYNTHETIC",
    title: "Synthetic hello-world smoke packet",
    version: 1,
    milestone: "M0-synthetic",
    workstream: "WS-0-synthetic",
    packet_class: "foundation",
    risk_class: "low",
    activation_class: "operator-launched",
    dependency_class_profile: "none",
    prerequisite_packets: [],
    prerequisite_artifacts: [],
    speculative_start_allowed: false,
    scope: ["packages/shared/src/synthetic/"],
    out_of_scope: ["apps/"],
    protected_paths: ["package.json", ".github/", ".env", ".env*"],
    target_paths: [
      "packages/shared/src/synthetic/hello.ts",
      "packages/shared/src/synthetic/hello.test.ts"
    ],
    required_inputs: [],
    expected_outputs: [],
    required_docs_updates: [],
    validator_manifest_ref: "packets/validator-manifests/foundation.yaml",
    evidence_manifest_ref: "packets/evidence-manifests/standard.yaml",
    review_manifest_ref: "packets/review-manifests/human-required.yaml",
    prompt_template_ref: "packets/templates/implementer-foundation.yaml",
    context_pack_profile: "foundation-contracts",
    benchmark_tags: ["wave0-live-smoke", "synthetic"],
    policy_sensitivities: [],
    escalation_conditions: [],
    completion_contract: [],
    graph_repair_hooks: [],
    operator_notes: "synthetic"
  };
}

test("policy engine allows scoped implementer writes", async () => {
  const config = createConfig();
  const engine = new LocalPolicyEngine(config);

  const result = await engine.evaluate(
    {
      config,
      packetManifest: createPacketManifest(),
      worktreePath: "/tmp/forge-policy-worktree",
      taskId: "task-001",
      taskRunId: "task-run-001",
      waveRunId: "wave-run-001",
      agentRole: "implementer"
    },
    {
      toolName: "file.write",
      actionClass: "MUTATE",
      targetPaths: ["packages/shared/src/synthetic/hello.ts"]
    }
  );

  assert.equal(result.decision, "ALLOW");
  assert.equal(result.record.scopeStatus, "in_scope");
});

test("policy engine denies out-of-scope writes and escalates protected paths", async () => {
  const config = createConfig();
  const engine = new LocalPolicyEngine(config);
  const context = {
    config,
    packetManifest: createPacketManifest(),
    worktreePath: "/tmp/forge-policy-worktree",
    taskId: "task-001",
    taskRunId: "task-run-001",
    waveRunId: "wave-run-001",
    agentRole: "implementer" as const
  };

  const outOfScope = await engine.evaluate(context, {
    toolName: "file.write",
    actionClass: "MUTATE",
    targetPaths: ["apps/cli/src/index.ts"]
  });
  assert.equal(outOfScope.decision, "DENY");

  const protectedPath = await engine.evaluate(context, {
    toolName: "file.write",
    actionClass: "MUTATE",
    targetPaths: ["package.json"]
  });
  assert.equal(protectedPath.decision, "ESCALATE");
});

test("policy engine gates execute commands through the shell allowlist", async () => {
  const config = createConfig();
  const engine = new LocalPolicyEngine(config);
  const context = {
    config,
    packetManifest: createPacketManifest(),
    worktreePath: "/tmp/forge-policy-worktree",
    taskId: "task-001",
    taskRunId: "task-run-001",
    waveRunId: "wave-run-001",
    agentRole: "implementer" as const
  };

  const allowed = await engine.evaluate(context, {
    toolName: "run.typecheck",
    actionClass: "EXECUTE",
    command: ["pnpm", "exec", "tsc", "--noEmit"]
  });
  assert.equal(allowed.decision, "ALLOW");

  const denied = await engine.evaluate(context, {
    toolName: "run.typecheck",
    actionClass: "EXECUTE",
    command: ["curl", "https://example.com"]
  });
  assert.equal(denied.decision, "DENY");
});
