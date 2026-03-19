import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { ForgeConfig, PacketManifest } from "@forge/shared";
import { LocalPolicyEngine } from "@forge/policy-engine";
import { Wave0ToolBroker } from "../src/index.js";

function runGit(cwd: string, args: readonly string[]): string {
  return execFileSync("git", [...args], {
    cwd,
    encoding: "utf8"
  }).trim();
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

async function createFixture(): Promise<{
  cleanup: () => Promise<void>;
  config: ForgeConfig;
  context: {
    config: ForgeConfig;
    packetManifest: PacketManifest;
    worktreePath: string;
    taskId: string;
    taskRunId: string;
    waveRunId: string;
    agentRole: "implementer" | "reviewer";
  };
}> {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "forge-tool-broker-"));
  const repoRoot = path.join(tempRoot, "repo");
  const runtimeRoot = path.join(tempRoot, "runtime");

  await fs.mkdir(path.join(repoRoot, "packages", "shared", "src", "synthetic"), {
    recursive: true
  });
  await fs.writeFile(
    path.join(repoRoot, "package.json"),
    JSON.stringify({ name: "fixture", private: true }, null, 2),
    "utf8"
  );

  runGit(tempRoot, ["init", "-b", "main", repoRoot]);
  runGit(repoRoot, ["config", "user.email", "forge@example.com"]);
  runGit(repoRoot, ["config", "user.name", "Forge Test"]);
  runGit(repoRoot, ["add", "."]);
  runGit(repoRoot, ["commit", "-m", "Initial fixture"]);

  const workspaceRoot = process.cwd();
  const config: ForgeConfig = {
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
      root: repoRoot,
      filesRoot: path.join(workspaceRoot, "files"),
      storageRoot: runtimeRoot,
      blobRoot: path.join(runtimeRoot, "blob"),
      evidenceRoot: path.join(runtimeRoot, "evidence"),
      auditRoot: path.join(runtimeRoot, "audit"),
      logRoot: path.join(runtimeRoot, "logs"),
      worktreeRoot: path.join(runtimeRoot, "worktrees")
    }
  };

  return {
    config,
    context: {
      config,
      packetManifest: createPacketManifest(),
      worktreePath: repoRoot,
      taskId: "task-001",
      taskRunId: "task-run-001",
      waveRunId: "wave-run-001",
      agentRole: "implementer"
    },
    cleanup: async () => {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  };
}

test("tool broker writes scoped files and persists audit plus policy records", async () => {
  const fixture = await createFixture();

  try {
    const broker = new Wave0ToolBroker(new LocalPolicyEngine(fixture.config));
    const result = await broker.writeFile(fixture.context, {
      path: "packages/shared/src/synthetic/hello.ts",
      content: "export const greet = (name: string) => `Hello, ${name}`;\n"
    });

    assert.equal(result.ok, true);
    assert.equal(result.policyDecision, "ALLOW");
    await fs.access(
      path.join(fixture.context.worktreePath, "packages/shared/src/synthetic/hello.ts")
    );

    const auditLog = await fs.readFile(result.artifactPaths.auditLogPath, "utf8");
    const policyLog = await fs.readFile(result.artifactPaths.policyLogPath, "utf8");

    assert.match(auditLog, /file\.write/);
    assert.match(policyLog, /ALLOW/);
  } finally {
    await fixture.cleanup();
  }
});

test("tool broker denies out-of-scope writes and keeps the file absent", async () => {
  const fixture = await createFixture();

  try {
    const broker = new Wave0ToolBroker(new LocalPolicyEngine(fixture.config));
    const result = await broker.writeFile(fixture.context, {
      path: "apps/cli/src/index.ts",
      content: "console.log('blocked');\n"
    });

    assert.equal(result.ok, false);
    assert.equal(result.policyDecision, "DENY");

    await assert.rejects(() =>
      fs.access(path.join(fixture.context.worktreePath, "apps/cli/src/index.ts"))
    );
  } finally {
    await fixture.cleanup();
  }
});

test("tool broker blocks symlinked writes that would escape the worktree", async () => {
  const fixture = await createFixture();

  try {
    const broker = new Wave0ToolBroker(new LocalPolicyEngine(fixture.config));
    const outsideRoot = await fs.mkdtemp(path.join(os.tmpdir(), "forge-tool-broker-outside-"));
    const linkPath = path.join(fixture.context.worktreePath, "packages", "shared", "src", "synthetic", "linked");

    await fs.symlink(outsideRoot, linkPath, "dir");

    await assert.rejects(() =>
      broker.writeFile(fixture.context, {
        path: "packages/shared/src/synthetic/linked/escape.ts",
        content: "export const blocked = true;\n"
      })
    );

    await assert.rejects(() => fs.access(path.join(outsideRoot, "escape.ts")));
    await fs.rm(outsideRoot, { recursive: true, force: true });
  } finally {
    await fixture.cleanup();
  }
});

test("tool broker records denied execute attempts without running them", async () => {
  const fixture = await createFixture();

  try {
    const broker = new Wave0ToolBroker(new LocalPolicyEngine(fixture.config));
    const reviewerContext = {
      ...fixture.context,
      agentRole: "reviewer" as const
    };

    const result = await broker.runTypecheck(reviewerContext);

    assert.equal(result.ok, false);
    assert.equal(result.policyDecision, "DENY");
    assert.equal(result.data, null);
    const policyLog = await fs.readFile(result.artifactPaths.policyLogPath, "utf8");
    assert.match(policyLog, /cannot use run\.typecheck/);
  } finally {
    await fixture.cleanup();
  }
});
