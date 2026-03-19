import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  applyWaveOperatorAction,
  assertTaskStatusTransition,
  executeWave0SerialRun
} from "../src/index.js";
import type { ForgeConfig } from "@forge/shared";

const workspaceFilesRoot = path.join(process.cwd(), "files");

function runGit(cwd: string, args: readonly string[]): string {
  return execFileSync("git", [...args], {
    cwd,
    encoding: "utf8"
  }).trim();
}

async function createFixtureRepo(): Promise<{
  cleanup: () => Promise<void>;
  config: ForgeConfig;
}> {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "forge-orchestrator-wave0-"));
  const repoRoot = path.join(tempRoot, "repo");
  const runtimeRoot = path.join(tempRoot, "runtime");
  const phaseBranch = "forge/phase-0-wave0-synthetic";

  await fs.mkdir(path.join(repoRoot, "packages", "shared", "src"), {
    recursive: true
  });
  await fs.writeFile(
    path.join(repoRoot, "package.json"),
    JSON.stringify({ name: "fixture", private: true, type: "module" }, null, 2),
    "utf8"
  );
  await fs.writeFile(
    path.join(repoRoot, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          lib: ["ES2022"],
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          types: ["node"]
        },
        include: ["packages/**/*.ts"]
      },
      null,
      2
    ),
    "utf8"
  );
  await fs.writeFile(
    path.join(repoRoot, "packages", "shared", "tsconfig.json"),
    JSON.stringify(
      {
        extends: "../../tsconfig.json",
        include: ["src/**/*.ts"]
      },
      null,
      2
    ),
    "utf8"
  );

  runGit(repoRoot, ["init", "-b", "main"]);
  runGit(repoRoot, ["config", "user.email", "forge@example.com"]);
  runGit(repoRoot, ["config", "user.name", "Forge Test"]);
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
      schema: "forge_test",
      url: "postgresql://forge:forge@127.0.0.1:5432/forge"
    },
    redis: {
      host: "127.0.0.1",
      port: 6379,
      url: "redis://127.0.0.1:6379"
    },
    paths: {
      root: repoRoot,
      filesRoot: workspaceFilesRoot,
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

async function createFixtureRepoWithoutSharedTsconfig(): Promise<{
  cleanup: () => Promise<void>;
  config: ForgeConfig;
}> {
  const fixture = await createFixtureRepo();

  await fs.rm(
    path.join(fixture.config.paths.root, "packages", "shared", "tsconfig.json")
  );
  runGit(fixture.config.paths.root, ["add", "-A"]);
  runGit(
    fixture.config.paths.root,
    ["commit", "-m", "Remove shared tsconfig from phase branch"]
  );

  return fixture;
}

test("Wave 0 state helpers enforce the intended serial control path", () => {
  const paused = applyWaveOperatorAction("active", "pause");
  assert.deepEqual(paused, {
    nextStatus: "paused",
    decisionStatus: "paused"
  });

  assertTaskStatusTransition("scheduled", "provisioning");
  assert.throws(() => assertTaskStatusTransition("merged", "running"));
});

test("executeWave0SerialRun drives the synthetic packet through merge-back", async () => {
  const fixture = await createFixtureRepo();

  try {
    const result = await executeWave0SerialRun(fixture.config, {
      taskId: "task-wave0-test"
    });

    assert.equal(result.validationStatus, "pass");
    assert.equal(result.waveStatus, "closed");
    assert.equal(result.taskStatus, "merged");
    assert.equal(
      JSON.parse(await fs.readFile(String(result.summaryPath), "utf8")).status,
      "complete"
    );
    assert.equal(typeof result.mergeCommitSha, "string");
    assert.deepEqual(
      result.waveTransitions.map((entry) => entry.toStatus),
      ["ready", "active", "completed", "closed"]
    );
    assert.deepEqual(
      result.taskTransitions.map((entry) => entry.toStatus),
      [
        "queued",
        "scheduled",
        "provisioning",
        "running",
        "awaiting_validation",
        "validating",
        "awaiting_review",
        "succeeded",
        "merging",
        "merged"
      ]
    );

    const agentResultPath = path.join(
      path.dirname(String(result.summaryPath)),
      "runtime",
      "agent-result.json"
    );
    const agentResult = JSON.parse(await fs.readFile(agentResultPath, "utf8")) as {
      status: string;
      output?: {
        filesCreatedOrModified?: string[];
      };
    };
    assert.equal(agentResult.status, "completed");
    assert.deepEqual(
      [...(agentResult.output?.filesCreatedOrModified ?? [])].sort(),
      [
        "packages/shared/src/synthetic/hello.test.ts",
        "packages/shared/src/synthetic/hello.ts"
      ].sort()
    );

    const mergedHelloSource = runGit(fixture.config.paths.root, [
      "show",
      `${String(result.mergeCommitSha)}:packages/shared/src/synthetic/hello.ts`
    ]);
    const mergedHelloTest = runGit(fixture.config.paths.root, [
      "show",
      `${String(result.mergeCommitSha)}:packages/shared/src/synthetic/hello.test.ts`
    ]);
    assert.match(mergedHelloSource, /export function greet/);
    assert.match(mergedHelloTest, /test\("greet returns a synthetic hello"/);
  } finally {
    await fixture.cleanup();
  }
});

test("executeWave0SerialRun fails early when phase branch is missing packet prerequisites", async () => {
  const fixture = await createFixtureRepoWithoutSharedTsconfig();

  try {
    const result = await executeWave0SerialRun(fixture.config, {
      taskId: "task-wave0-missing-prereq"
    });

    assert.equal(result.mergeCommitSha, null);
    assert.equal(result.taskStatus, "failed");
    assert.equal(result.waveStatus, "closed");
    assert.match(
      String(result.failureMessage),
      /missing prerequisite artifacts: packages\/shared\/tsconfig\.json/
    );
  } finally {
    await fixture.cleanup();
  }
});
