import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type {
  EvidenceManifest,
  ForgeConfig,
  PacketManifest,
  ValidatorManifest
} from "@forge/shared";
import { normalizeCommandResult, runWave0Validators } from "../src/index.js";

function createTestConfig(rootDir: string): ForgeConfig {
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
    protected_paths: ["package.json", ".env*"],
    target_paths: [
      "packages/shared/src/synthetic/hello.ts",
      "packages/shared/src/synthetic/hello.test.ts"
    ],
    required_inputs: [],
    expected_outputs: [
      "packages/shared/src/synthetic/hello.ts (exports a greet(name: string): string function)",
      "packages/shared/src/synthetic/hello.test.ts (contains one passing test)"
    ],
    required_docs_updates: [],
    validator_manifest_ref: "packets/validator-manifests/foundation.yaml",
    evidence_manifest_ref: "packets/evidence-manifests/standard.yaml",
    review_manifest_ref: "packets/review-manifests/human-required.yaml",
    prompt_template_ref: "packets/templates/implementer-foundation.yaml",
    context_pack_profile: "foundation-contracts",
    benchmark_tags: ["wave0-live-smoke"],
    policy_sensitivities: [],
    escalation_conditions: [],
    completion_contract: [],
    graph_repair_hooks: [],
    operator_notes: "test"
  };
}

function createValidatorManifest(): ValidatorManifest {
  return {
    manifest_kind: "validator-manifest",
    manifest_name: "foundation",
    version: 1,
    status: "ready",
    applies_to_packet_classes: ["foundation"],
    execution_mode: "fail-forward-within-layer",
    summary: "test",
    validator_set: {
      layer_1_correctness: [
        { id: "compilation", tool: "run_typecheck", blocking: true, order: 1, required_for_waves: ["wave-0"] },
        { id: "lint", tool: "run_lint", blocking: true, order: 2, required_for_waves: ["wave-0"] },
        { id: "unit_tests", tool: "run_tests", blocking: true, order: 3, condition: "packet_declares_tests_or_fixture_tests_exist", required_for_waves: ["wave-0"] },
        { id: "architecture_check", tool: "run_lint", blocking: true, order: 4, required_for_waves: ["wave-0"] },
        { id: "file_structure", tool: "custom_validator", blocking: true, order: 5, required_for_waves: ["wave-0"] }
      ],
      layer_2_security: [
        { id: "secret_scan", tool: "scan_secrets", blocking: true, order: 6, condition: "always", required_for_waves: ["wave-0"] }
      ],
      layer_3_policy: [
        { id: "scope_drift", tool: "custom_validator", blocking: true, order: 7 },
        { id: "protected_paths", tool: "custom_validator", blocking: true, order: 8 },
        { id: "harness_integrity", tool: "custom_validator", blocking: true, order: 9 },
        { id: "policy_compliance", tool: "audit_trail_scan", blocking: true, order: 10 }
      ],
      layer_4_evidence: [
        { id: "evidence_completeness", tool: "evidence_check", blocking: true, order: 11 }
      ],
      agentic_review: []
    },
    notes: []
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
      { type: "compilation_status", source: "validator.compilation", tier: 1 },
      { type: "lint_results", source: "validator.lint", tier: 1 },
      { type: "test_results", source: "validator.unit_tests", tier: 1, condition: "validator_ran" },
      { type: "audit_trail", source: "tool_broker", tier: 1 },
      { type: "worktree_identity", source: "runtime_manager", tier: 1 }
    ],
    conditional: [],
    ephemeral_unless_pinned: [],
    notes: []
  };
}

test("normalizeCommandResult distinguishes pass, fail, and error", () => {
  const startedAt = new Date("2026-03-18T10:00:00.000Z");
  const completedAt = new Date("2026-03-18T10:00:01.000Z");

  assert.equal(
    normalizeCommandResult({
      validatorId: "compilation",
      layer: "layer_1_correctness",
      tool: "run_typecheck",
      blocking: true,
      startedAt,
      completedAt,
      command: { command: "pnpm", args: ["run", "typecheck"] },
      result: {
        command: ["pnpm", "run", "typecheck"],
        cwd: "/tmp",
        stdout: "",
        stderr: "",
        exitCode: 0,
        durationMs: 1000
      }
    }).status,
    "pass"
  );

  assert.equal(
    normalizeCommandResult({
      validatorId: "lint",
      layer: "layer_1_correctness",
      tool: "run_lint",
      blocking: true,
      startedAt,
      completedAt,
      command: { command: "pnpm", args: ["run", "lint"] },
      result: {
        command: ["pnpm", "run", "lint"],
        cwd: "/tmp",
        stdout: "",
        stderr: "oops",
        exitCode: 1,
        durationMs: 1000
      }
    }).status,
    "fail"
  );

  assert.equal(
    normalizeCommandResult({
      validatorId: "unit_tests",
      layer: "layer_1_correctness",
      tool: "run_tests",
      blocking: true,
      startedAt,
      completedAt,
      command: { command: "node", args: ["--test"] },
      error: {
        message: "spawn node ENOENT",
        code: "ENOENT"
      }
    }).status,
    "error"
  );
});

test("runWave0Validators records artifacts and fails protected path mutations", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "forge-validator-runner-"));

  try {
    const config = createTestConfig(tempRoot);
    const workspacePath = path.join(tempRoot, "workspace");
    await fs.mkdir(path.join(workspacePath, "packages", "shared", "src", "synthetic"), {
      recursive: true
    });

    await fs.writeFile(
      path.join(workspacePath, "packages", "shared", "src", "synthetic", "hello.ts"),
      'export function greet(name: string): string { return `Hello, ${name}`; }\n',
      "utf8"
    );
    await fs.writeFile(
      path.join(workspacePath, "packages", "shared", "src", "synthetic", "hello.test.ts"),
      'import test from "node:test";\nimport assert from "node:assert/strict";\n\ntest("greet", () => { assert.equal(1, 1); });\n',
      "utf8"
    );

    const result = await runWave0Validators({
      config,
      packetManifest: createPacketManifest(),
      validatorManifest: createValidatorManifest(),
      evidenceManifest: createEvidenceManifest(),
      waveId: "wave-0-live",
      workspacePath,
      waveRunId: "wave-run-1",
      taskRunId: "task-run-1",
      changedFiles: [
        "packages/shared/src/synthetic/hello.ts",
        "packages/shared/src/synthetic/hello.test.ts",
        "package.json"
      ],
      providedEvidence: [
        {
          evidenceType: "audit_trail",
          source: "tool_broker",
          present: true,
          storageRef: "/tmp/tool-broker.json"
        },
        {
          evidenceType: "worktree_identity",
          source: "runtime_manager",
          present: true,
          storageRef: "/tmp/worktree.json"
        }
      ],
      policyDecisions: [{ decision: "allow", toolName: "write_file" }],
      auditEvents: [{ eventType: "tool.exec", sourceComponent: "tool-broker" }],
      commandExecutor: async ({ validatorId, cwd }) => ({
        command: ["mock", validatorId],
        cwd,
        stdout: "ok",
        stderr: "",
        exitCode: 0,
        durationMs: 5
      })
    });

    assert.equal(result.blockingStatus, "fail");
    assert.equal(
      result.results.find((entry) => entry.validatorId === "protected_paths")?.status,
      "fail"
    );
    assert.equal(
      result.results.find((entry) => entry.validatorId === "evidence_completeness")?.status,
      "pass"
    );
    assert.ok(result.validatorArtifacts.length > 0);
    assert.equal(
      Array.isArray(JSON.parse(await fs.readFile(result.validatorResultsPath, "utf8"))),
      true
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
