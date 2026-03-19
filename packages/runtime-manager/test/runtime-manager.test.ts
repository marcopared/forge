import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import test from "node:test";
import type { ForgeConfig } from "@forge/shared";
import {
  LocalRuntimeManager,
  createTaskBranchName,
  createWave0SyntheticMergeCommitMessage
} from "../src/index.js";

function runGit(cwd: string, args: readonly string[]): string {
  return execFileSync("git", [...args], {
    cwd,
    encoding: "utf8"
  }).trim();
}

function gitPathExists(cwd: string, branchName: string, filePath: string): boolean {
  const result = spawnSync("git", ["cat-file", "-e", `${branchName}:${filePath}`], {
    cwd,
    stdio: "ignore"
  });

  return result.status === 0;
}

async function createFixtureRepo(): Promise<{
  cleanup: () => Promise<void>;
  config: ForgeConfig;
}> {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "forge-runtime-manager-"));
  const repoRoot = path.join(tempRoot, "repo");
  const runtimeRoot = path.join(tempRoot, "runtime");
  const phaseBranch = "forge/phase-0-wave0-synthetic";

  await fs.mkdir(repoRoot, { recursive: true });
  runGit(repoRoot, ["init", "-b", "main"]);
  runGit(repoRoot, ["config", "user.email", "forge@example.com"]);
  runGit(repoRoot, ["config", "user.name", "Forge Test"]);

  await fs.mkdir(path.join(repoRoot, "packages", "shared", "src"), {
    recursive: true
  });
  await fs.writeFile(
    path.join(repoRoot, "package.json"),
    JSON.stringify({ name: "fixture", private: true }, null, 2),
    "utf8"
  );
  await fs.writeFile(path.join(repoRoot, "README.md"), "fixture\n", "utf8");

  runGit(repoRoot, ["add", "."]);
  runGit(repoRoot, ["commit", "-m", "Initial fixture"]);
  runGit(repoRoot, ["switch", "-c", phaseBranch]);

  const config: ForgeConfig = {
    environment: "test",
    defaultWaveId: "wave-0-live",
    defaultPacketId: "WAVE0-SYNTHETIC",
    defaultBenchmarkId: "wave0-live-smoke",
    phaseBranch,
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
      filesRoot: path.join(repoRoot, "files"),
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
    cleanup: async () => {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  };
}

test("provisions a real worktree, runs scoped commands, captures diff, and tears down", async () => {
  const fixture = await createFixtureRepo();

  try {
    const manager = new LocalRuntimeManager(fixture.config, {
      bootstrapCommand: ["/bin/sh", "-c", "printf ready > .bootstrap"]
    });

    const provisioned = await manager.provisionTaskWorktree({
      taskId: "001",
      slug: "wave0-synthetic"
    });

    assert.equal(
      provisioned.descriptor.branchName,
      createTaskBranchName("001", "wave0-synthetic")
    );
    assert.equal(provisioned.bootstrap?.exitCode, 0);
    await fs.access(path.join(provisioned.descriptor.worktreePath, ".bootstrap"));

    await manager.runScopedCommand({
      descriptor: provisioned.descriptor,
      command: "/bin/sh",
      args: [
        "-c",
        [
          "mkdir -p packages/shared/src/synthetic",
          "printf 'export function greet(name) { return `Hello, ${name}`; }\\n' > packages/shared/src/synthetic/hello.js"
        ].join(" && ")
      ]
    });

    const diff = await manager.captureDiff(provisioned.descriptor);
    assert.equal(diff.hasChanges, true);
    assert.match(diff.nameStatus, /packages\/shared\/src\/synthetic\/hello\.js/);

    const teardown = await manager.teardownWorktree({
      descriptor: provisioned.descriptor,
      deleteBranch: true
    });

    assert.equal(teardown.removed, true);
    assert.equal(teardown.branchDeleted, true);
  } finally {
    await fixture.cleanup();
  }
});

test("squash merges a synthetic task branch and reverts it through rollback", async () => {
  const fixture = await createFixtureRepo();

  try {
    const manager = new LocalRuntimeManager(fixture.config, {
      bootstrapCommand: ["/bin/sh", "-c", "printf ready > .bootstrap"]
    });

    const provisioned = await manager.provisionTaskWorktree({
      taskId: "task-001",
      slug: "wave0-synthetic"
    });

    await manager.runScopedCommand({
      descriptor: provisioned.descriptor,
      command: "/bin/sh",
      args: [
        "-c",
        [
          "mkdir -p packages/shared/src/synthetic",
          "printf 'export const greet = (name) => `Hello, ${name}`;\\n' > packages/shared/src/synthetic/hello.ts",
          "printf 'export const helloTest = true;\\n' > packages/shared/src/synthetic/hello.test.ts"
        ].join(" && ")
      ]
    });

    const mergeResult = await manager.mergeSuccessfulRun({
      descriptor: provisioned.descriptor,
      commitMessage: createWave0SyntheticMergeCommitMessage("task-001"),
      taskCommitMessage: "chore(task-001): capture synthetic worktree output"
    });

    assert.equal(mergeResult.merged, true);
    assert.equal(mergeResult.conflictDetected, false);
    assert.ok(mergeResult.mergeCommitSha);

    const mergedSource = runGit(fixture.config.paths.root, [
      "show",
      `${fixture.config.phaseBranch}:packages/shared/src/synthetic/hello.ts`
    ]);
    assert.match(mergedSource, /Hello/);

    const rollbackResult = await manager.rollbackSyntheticMerge({
      descriptor: {
        taskId: "task-001",
        slug: "wave0-synthetic",
        phaseBranch: fixture.config.phaseBranch
      },
      mergeCommitSha: mergeResult.mergeCommitSha ?? "",
      reason: "synthetic merge deemed untrustworthy"
    });

    assert.equal(rollbackResult.rolledBack, true);

    assert.equal(
      gitPathExists(
        fixture.config.paths.root,
        fixture.config.phaseBranch,
        "packages/shared/src/synthetic/hello.ts"
      ),
      false
    );

    const teardown = await manager.teardownWorktree({
      descriptor: provisioned.descriptor,
      deleteBranch: true
    });

    assert.equal(teardown.removed, true);
    assert.equal(teardown.branchDeleted, true);
  } finally {
    await fixture.cleanup();
  }
});
