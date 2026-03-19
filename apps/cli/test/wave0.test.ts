import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { ForgeConfig } from "@forge/shared";
import {
  createWave0MetricsReport,
  executeWave0SyntheticRun,
  formatWave0AuditReport,
  formatWave0CloseoutReport,
  formatWave0EvidenceReport,
  formatWave0LaunchResult,
  formatWave0MetricsReport,
  formatWave0PolicyReport,
  formatWave0RollbackVerificationReport,
  formatWave0SmokeReport,
  formatWave0StatusReport,
  formatWave0TaskReport,
  formatWave0ValidatorReport,
  inspectWave0SyntheticRun,
  verifyWave0LiveSmoke,
  verifyWave0Rollback
} from "../src/wave0.js";

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
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "forge-cli-wave0-"));
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

test("executeWave0SyntheticRun produces a complete evidence bundle", async () => {
  const fixture = await createFixtureRepo();

  try {
    const result = await executeWave0SyntheticRun(fixture.config, {
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

test("CLI inspection helpers render operator-facing Wave 0 summaries", async () => {
  const fixture = await createFixtureRepo();

  try {
    const result = await executeWave0SyntheticRun(fixture.config, {
      taskId: "task-wave0-cli-inspect"
    });
    const inspection = await inspectWave0SyntheticRun(fixture.config, {
      waveRunId: result.waveRunId,
      taskRunId: result.taskRunId
    });

    assert.match(formatWave0LaunchResult(result), /Wave 0 live launch finished/);
    assert.match(formatWave0StatusReport(inspection), new RegExp(result.waveRunId));
    assert.match(formatWave0TaskReport(inspection), /WAVE0-SYNTHETIC/);
    assert.match(formatWave0ValidatorReport(inspection), /compilation: pass/);
    assert.match(formatWave0EvidenceReport(inspection), /Wave 0 evidence bundle/);
    assert.match(
      formatWave0MetricsReport(createWave0MetricsReport(inspection)),
      /Wave 0 live metrics/
    );
    assert.match(formatWave0PolicyReport(inspection), /ALLOW file\.read/);
    assert.match(formatWave0AuditReport(inspection), /wave\.state_changed/);
    assert.match(formatWave0CloseoutReport(inspection), /Wave 0 closeout summary/);
  } finally {
    await fixture.cleanup();
  }
});

test("Wave 0 smoke verification records a passing live-smoke report", async () => {
  const fixture = await createFixtureRepo();

  try {
    const result = await executeWave0SyntheticRun(fixture.config, {
      taskId: "task-wave0-smoke"
    });
    const report = await verifyWave0LiveSmoke(fixture.config, {
      waveRunId: result.waveRunId,
      taskRunId: result.taskRunId
    });

    assert.equal(report.overallStatus, "pass");
    assert.equal(report.mergeVerification.status, "pass");
    assert.equal(
      report.checks.find((check) => check.id === "speculative_start_marker")?.result,
      "pass"
    );
    assert.match(report.reportPath, /live-smoke-report\.json$/);
    assert.match(formatWave0SmokeReport(report), /Overall status: PASS/);
  } finally {
    await fixture.cleanup();
  }
});

test("Wave 0 rollback verification proves the phase branch is restored", async () => {
  const fixture = await createFixtureRepo();

  try {
    const result = await executeWave0SyntheticRun(fixture.config, {
      taskId: "task-wave0-rollback",
      rollbackAfterMerge: true
    });
    const report = await verifyWave0Rollback(fixture.config, {
      waveRunId: result.waveRunId,
      taskRunId: result.taskRunId,
      mergeCommitSha: result.mergeCommitSha ?? undefined,
      rollbackCommitSha: result.rollbackCommitSha ?? undefined
    });

    assert.equal(result.waveStatus, "closed");
    assert.equal(report.status, "pass");
    assert.equal(report.phaseHeadSha, report.rollbackCommitSha);
    assert.deepEqual(report.driftFiles, []);
    assert.match(formatWave0RollbackVerificationReport(report), /Status: PASS/);
  } finally {
    await fixture.cleanup();
  }
});
