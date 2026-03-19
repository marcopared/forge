import fs from "node:fs/promises";
import path from "node:path";
import type {
  EvidenceRequirement,
  ForgePackageDescriptor,
  ToolValidatorRule
} from "@forge/shared";
import { defineForgePackage } from "@forge/shared";
import type { DbJson, UpsertEvidenceItemInput } from "@forge/db";
import { computeConfidenceScore } from "@forge/evidence";
import { executeCommand } from "@forge/runtime-manager";
import type {
  ValidationAuditEvent,
  ValidatorCommandError,
  ValidationCommandExecutionRequest,
  ValidationCommandExecutor,
  ValidatorCommandResult,
  ValidationEvidenceInput,
  ValidationPolicyDecision,
  ValidatorCommandSpec,
  ValidatorOutputArtifact,
  ValidatorResultRecordModel,
  Wave0ValidationRunInput,
  Wave0ValidationRunResult,
  Wave0ValidatorStatus
} from "./types.js";

export const validatorRunnerPackage: ForgePackageDescriptor = defineForgePackage({
  name: "@forge/validator-runner",
  purpose: "Executes the blocking Wave 0 validator stack and records machine-readable results.",
  dependsOn: ["@forge/shared", "@forge/runtime-manager", "@forge/db"],
  status: "skeleton"
});

export const wave0ValidationPlan = [
  "compilation",
  "lint",
  "unit_tests",
  "architecture_check",
  "file_structure",
  "secret_scan",
  "scope_drift",
  "protected_paths",
  "harness_integrity",
  "policy_compliance",
  "evidence_completeness",
  "confidence_scoring"
] as const;

const supportedBlockingValidatorIds = new Set<string>(wave0ValidationPlan);
const exactTargetPathClasses = new Set([
  "foundation",
  "interface",
  "documentation",
  "policy-sensitive"
]);
const secretPatterns: ReadonlyArray<{ label: string; expression: RegExp }> = [
  {
    label: "AWS access key",
    expression: /\bAKIA[0-9A-Z]{16}\b/g
  },
  {
    label: "Generic secret assignment",
    expression: /\b(?:api[_-]?key|secret|token|password)\b\s*[:=]\s*["'][^"']{8,}["']/gi
  }
] as const;

function normalizePathForMatching(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function normalizeWorkspaceRelativePath(
  workspacePath: string,
  filePath: string
): string {
  if (!path.isAbsolute(filePath)) {
    return normalizePathForMatching(filePath);
  }

  return normalizePathForMatching(path.relative(workspacePath, filePath));
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function pathMatchesScope(candidatePath: string, scopePath: string): boolean {
  const normalizedCandidate = normalizePathForMatching(candidatePath);
  const normalizedScope = normalizePathForMatching(scopePath);

  if (normalizedCandidate === normalizedScope) {
    return true;
  }

  return normalizedCandidate.startsWith(ensureTrailingSlash(normalizedScope));
}

function pathMatchesProtectedPattern(candidatePath: string, protectedPath: string): boolean {
  const normalizedCandidate = normalizePathForMatching(candidatePath);
  const normalizedProtected = normalizePathForMatching(protectedPath);

  if (normalizedProtected.endsWith("*")) {
    return normalizedCandidate.startsWith(normalizedProtected.slice(0, -1));
  }

  return pathMatchesScope(normalizedCandidate, normalizedProtected);
}

function extractExpectedOutputPaths(expectedOutputs: readonly string[]): string[] {
  return expectedOutputs
    .map((entry) => {
      const matchedPath = entry.match(/^[^\s(]+/);
      return matchedPath ? matchedPath[0] : "";
    })
    .filter((entry) => entry.length > 0)
    .map(normalizePathForMatching);
}

function toValidatorCommandError(error: unknown): ValidatorCommandError {
  if (error instanceof Error) {
    const maybeCode = "code" in error ? String(error.code) : undefined;
    return {
      message: error.message,
      code: maybeCode,
      stack: error.stack
    };
  }

  return { message: String(error) };
}

function toDbJson(value: unknown): DbJson {
  return JSON.parse(JSON.stringify(value ?? {})) as DbJson;
}

export function normalizeCommandResult(input: {
  validatorId: string;
  layer: string;
  tool: string;
  blocking: boolean;
  scope?: string;
  condition?: string;
  startedAt: Date;
  completedAt: Date;
  command: ValidatorCommandSpec;
  result?: ValidatorCommandResult;
  error?: ValidatorCommandError;
  details?: Record<string, unknown>;
}): ValidatorResultRecordModel {
  let status: Wave0ValidatorStatus = "pass";
  let message = `${input.validatorId} passed.`;

  if (input.error) {
    status = "error";
    message = `${input.validatorId} could not be executed: ${input.error.message}`;
  } else if (input.result && input.result.exitCode !== 0) {
    status = "fail";
    message = `${input.validatorId} failed with exit code ${input.result.exitCode}.`;
  }

  return {
    validatorId: input.validatorId,
    layer: input.layer,
    tool: input.tool,
    blocking: input.blocking,
    scope: input.scope,
    condition: input.condition,
    status,
    message,
    startedAt: input.startedAt.toISOString(),
    completedAt: input.completedAt.toISOString(),
    durationMs: input.completedAt.getTime() - input.startedAt.getTime(),
    command: input.command,
    commandResult: input.result,
    error: input.error,
    details: input.details ?? {}
  };
}

function createStaticResult(input: {
  validatorId: string;
  layer: string;
  tool: string;
  blocking: boolean;
  scope?: string;
  condition?: string;
  status: Wave0ValidatorStatus;
  message: string;
  details?: Record<string, unknown>;
}): ValidatorResultRecordModel {
  const startedAt = new Date();
  const completedAt = new Date();

  return {
    validatorId: input.validatorId,
    layer: input.layer,
    tool: input.tool,
    blocking: input.blocking,
    scope: input.scope,
    condition: input.condition,
    status: input.status,
    message: input.message,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: completedAt.getTime() - startedAt.getTime(),
    details: input.details ?? {}
  };
}

function createConfidenceScoringResult(input: {
  validator: ToolValidatorRule;
  layer: string;
  results: readonly ValidatorResultRecordModel[];
}): ValidatorResultRecordModel {
  const blockingResults = input.results.filter(
    (result) => result.blocking && result.status !== "skip"
  );
  const blockingValidatorFailureCount = blockingResults.filter(
    (result) => result.status === "fail" || result.status === "error"
  ).length;
  const blockingValidatorPassCount = blockingResults.filter(
    (result) => result.status === "pass"
  ).length;
  const evidenceResult = input.results.find(
    (result) => result.validatorId === "evidence_completeness"
  );
  const evidenceCompletenessRatio =
    typeof evidenceResult?.details.presentItemCount === "number" &&
    typeof evidenceResult?.details.mandatoryItemCount === "number" &&
    evidenceResult.details.mandatoryItemCount > 0
      ? evidenceResult.details.presentItemCount /
        evidenceResult.details.mandatoryItemCount
      : evidenceResult?.status === "pass"
        ? 1
        : 0;
  const score = computeConfidenceScore({
    blockingValidatorFailureCount,
    blockingValidatorPassCount,
    evidenceCompletenessRatio
  });

  return createStaticResult({
    validatorId: input.validator.id,
    layer: input.layer,
    tool: input.validator.tool,
    blocking: input.validator.blocking,
    status: "record",
    message: `Confidence score recorded at ${score.score}.`,
    details: {
      ...score
    }
  });
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function pathIsFile(filePath: string): Promise<boolean> {
  try {
    return (await fs.stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function readPackageJsonScripts(
  workspacePath: string
): Promise<Record<string, string>> {
  const packageJsonPath = path.join(workspacePath, "package.json");

  if (!(await pathExists(packageJsonPath))) {
    return {};
  }

  const rawValue = await fs.readFile(packageJsonPath, "utf8");
  const parsed = JSON.parse(rawValue) as { scripts?: Record<string, string> };
  return parsed.scripts ?? {};
}

async function readOptionalJsonArray<T>(
  filePath: string | undefined
): Promise<readonly T[]> {
  if (!filePath || !(await pathExists(filePath))) {
    return [];
  }

  const rawValue = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(rawValue) as unknown;
  return Array.isArray(parsed) ? (parsed as readonly T[]) : [];
}

function createDefaultCommandSpec(
  validator: ToolValidatorRule,
  workspacePath: string,
  testFiles: readonly string[],
  packageScripts: Readonly<Record<string, string>>
): ValidatorCommandSpec | null {
  if (validator.id === "compilation") {
    return "typecheck" in packageScripts
      ? { command: "pnpm", args: ["run", "typecheck"] }
      : { command: "tsc", args: ["-p", path.join(workspacePath, "tsconfig.json"), "--noEmit"] };
  }

  if (validator.id === "unit_tests") {
    return testFiles.length > 0
      ? {
          command: "node",
          args: ["--import", "tsx", "--test", ...testFiles]
        }
      : null;
  }

  if (validator.id === "lint" || validator.id === "architecture_check") {
    return "lint" in packageScripts
      ? { command: "pnpm", args: ["run", "lint"] }
      : null;
  }

  if (validator.id === "dependency_scan") {
    return { command: "pnpm", args: ["audit", "--audit-level=high", "--json"] };
  }

  return null;
}

function isWaveRequired(requiredForWaves: readonly string[] | undefined, waveId: string): boolean {
  if (!requiredForWaves || requiredForWaves.length === 0) {
    return true;
  }

  return requiredForWaves.some((entry) => waveId.toLowerCase().startsWith(entry.toLowerCase()));
}

function shouldRunCondition(input: {
  condition: string | undefined;
  packetHasTests: boolean;
  dependencyFilesChanged: boolean;
}): boolean {
  switch (input.condition) {
    case undefined:
      return true;
    case "always":
      return true;
    case "packet_declares_tests_or_fixture_tests_exist":
      return input.packetHasTests;
    case "deps_changed":
      return input.dependencyFilesChanged;
    default:
      return false;
  }
}

function computeBlockingStatus(results: readonly ValidatorResultRecordModel[]): "pass" | "fail" | "error" {
  if (results.some((result) => result.blocking && result.status === "error")) {
    return "error";
  }

  if (results.some((result) => result.blocking && result.status === "fail")) {
    return "fail";
  }

  return "pass";
}

async function detectChangedFiles(workspacePath: string): Promise<string[]> {
  try {
    const result = await executeCommand({
      command: "git",
      args: ["status", "--short"],
      cwd: workspacePath
    });

    if (result.exitCode !== 0) {
      return [];
    }

    return result.stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.slice(3).trim())
      .map(normalizePathForMatching);
  } catch {
    return [];
  }
}

async function runExternalValidator(input: {
  validator: ToolValidatorRule;
  layer: string;
  workspacePath: string;
  commandSpec: ValidatorCommandSpec;
  commandExecutor: ValidationCommandExecutor;
}): Promise<ValidatorResultRecordModel> {
  const startedAt = new Date();

  try {
    const result = await input.commandExecutor({
      validatorId: input.validator.id,
      spec: input.commandSpec,
      cwd: input.workspacePath
    });

    return normalizeCommandResult({
      validatorId: input.validator.id,
      layer: input.layer,
      tool: input.validator.tool,
      blocking: input.validator.blocking,
      scope: input.validator.scope,
      condition: input.validator.condition,
      startedAt,
      completedAt: new Date(),
      command: input.commandSpec,
      result,
      details: {
        stdoutPreview: result.stdout.slice(0, 4000),
        stderrPreview: result.stderr.slice(0, 4000)
      }
    });
  } catch (error) {
    return normalizeCommandResult({
      validatorId: input.validator.id,
      layer: input.layer,
      tool: input.validator.tool,
      blocking: input.validator.blocking,
      scope: input.validator.scope,
      condition: input.validator.condition,
      startedAt,
      completedAt: new Date(),
      command: input.commandSpec,
      error: toValidatorCommandError(error)
    });
  }
}

async function runFileStructureValidator(input: {
  validator: ToolValidatorRule;
  layer: string;
  workspacePath: string;
  expectedOutputPaths: readonly string[];
  targetPaths: readonly string[];
}): Promise<ValidatorResultRecordModel> {
  const checks = [...new Set([...input.targetPaths, ...input.expectedOutputPaths])];
  const missingPaths: string[] = [];

  for (const relativePath of checks) {
    if (!(await pathExists(path.join(input.workspacePath, relativePath)))) {
      missingPaths.push(relativePath);
    }
  }

  if (missingPaths.length > 0) {
    return createStaticResult({
      validatorId: input.validator.id,
      layer: input.layer,
      tool: input.validator.tool,
      blocking: input.validator.blocking,
      status: "fail",
      message: `Missing expected output files: ${missingPaths.join(", ")}`,
      details: {
        missingPaths
      }
    });
  }

  const issues: string[] = [];
  const helloPath = input.targetPaths.find((entry) => entry.endsWith("/hello.ts"));
  const helloTestPath = input.targetPaths.find((entry) => entry.endsWith("/hello.test.ts"));

  if (helloPath) {
    const contents = await fs.readFile(path.join(input.workspacePath, helloPath), "utf8");

    if (!/export\s+(?:function|const)\s+greet\s*\(\s*name\s*:\s*string\s*\)\s*:\s*string/s.test(contents)) {
      issues.push("hello.ts must export greet(name: string): string");
    }
  }

  if (helloTestPath) {
    const contents = await fs.readFile(path.join(input.workspacePath, helloTestPath), "utf8");

    if (!/\b(?:test|it)\s*\(/.test(contents)) {
      issues.push("hello.test.ts must contain at least one test");
    }
  }

  if (issues.length > 0) {
    return createStaticResult({
      validatorId: input.validator.id,
      layer: input.layer,
      tool: input.validator.tool,
      blocking: input.validator.blocking,
      status: "fail",
      message: issues.join("; "),
      details: { issues }
    });
  }

  return createStaticResult({
    validatorId: input.validator.id,
    layer: input.layer,
    tool: input.validator.tool,
    blocking: input.validator.blocking,
    status: "pass",
    message: "Expected output files exist and match the Wave 0 synthetic contract.",
    details: {
      checkedPaths: checks
    }
  });
}

async function runFallbackLintValidator(input: {
  validator: ToolValidatorRule;
  layer: string;
  workspacePath: string;
  targetPaths: readonly string[];
}): Promise<ValidatorResultRecordModel> {
  const issues: string[] = [];

  for (const relativePath of input.targetPaths) {
    const absolutePath = path.join(input.workspacePath, relativePath);

    if (!(await pathIsFile(absolutePath))) {
      continue;
    }

    const contents = await fs.readFile(absolutePath, "utf8");
    const lines = contents.split("\n");

    lines.forEach((line, index) => {
      if (/\t/.test(line)) {
        issues.push(`${relativePath}:${index + 1} contains a tab character`);
      }

      if (/\s+$/.test(line) && line.trim().length > 0) {
        issues.push(`${relativePath}:${index + 1} contains trailing whitespace`);
      }
    });
  }

  return createStaticResult({
    validatorId: input.validator.id,
    layer: input.layer,
    tool: input.validator.tool,
    blocking: input.validator.blocking,
    status: issues.length > 0 ? "fail" : "pass",
    message:
      issues.length > 0
        ? issues[0] ?? "Fallback lint checks failed."
        : "Fallback lint checks passed.",
    details: {
      fallback: true,
      issues
    }
  });
}

async function runArchitectureValidator(input: {
  validator: ToolValidatorRule;
  layer: string;
  workspacePath: string;
  targetPaths: readonly string[];
  changedFiles: readonly string[];
}): Promise<ValidatorResultRecordModel> {
  const issues: string[] = [];

  for (const relativePath of input.targetPaths) {
    const absolutePath = path.join(input.workspacePath, relativePath);

    if (!(await pathIsFile(absolutePath))) {
      continue;
    }

    const contents = await fs.readFile(absolutePath, "utf8");

    if (/from\s+["']\.\.\/(?!synthetic\/)/.test(contents) || /from\s+["']@forge\//.test(contents)) {
      issues.push(`${relativePath} imports outside the synthetic boundary`);
    }
  }

  const changedOutsideTargets = input.changedFiles.filter(
    (filePath) => !input.targetPaths.includes(normalizePathForMatching(filePath))
  );

  if (changedOutsideTargets.length > 0) {
    issues.push(`Changed files extend beyond exact target paths: ${changedOutsideTargets.join(", ")}`);
  }

  return createStaticResult({
    validatorId: input.validator.id,
    layer: input.layer,
    tool: input.validator.tool,
    blocking: input.validator.blocking,
    status: issues.length > 0 ? "fail" : "pass",
    message:
      issues.length > 0
        ? issues[0] ?? "Architecture boundary validation failed."
        : "Synthetic files stayed within the expected architecture boundary.",
    details: { issues }
  });
}

function createScopeValidationResult(input: {
  validator: ToolValidatorRule;
  layer: string;
  changedFiles: readonly string[];
  scope: readonly string[];
  targetPaths: readonly string[];
  packetClass: string;
}): ValidatorResultRecordModel {
  const scopeViolations = input.changedFiles.filter(
    (filePath) => !input.scope.some((scopePath) => pathMatchesScope(filePath, scopePath))
  );

  if (scopeViolations.length > 0) {
    return createStaticResult({
      validatorId: input.validator.id,
      layer: input.layer,
      tool: input.validator.tool,
      blocking: input.validator.blocking,
      status: "fail",
      message: `Files changed outside declared scope: ${scopeViolations.join(", ")}`,
      details: {
        scopeViolations
      }
    });
  }

  if (exactTargetPathClasses.has(input.packetClass)) {
    const nonTargetWrites = input.changedFiles.filter(
      (filePath) => !input.targetPaths.includes(normalizePathForMatching(filePath))
    );

    if (nonTargetWrites.length > 0) {
      return createStaticResult({
        validatorId: input.validator.id,
        layer: input.layer,
        tool: input.validator.tool,
        blocking: input.validator.blocking,
        status: "fail",
        message: `Exact-path packet wrote outside target paths: ${nonTargetWrites.join(", ")}`,
        details: {
          nonTargetWrites
        }
      });
    }
  }

  return createStaticResult({
    validatorId: input.validator.id,
    layer: input.layer,
    tool: input.validator.tool,
    blocking: input.validator.blocking,
    status: "pass",
    message: "Changed files stayed within declared scope and exact target paths.",
    details: {
      changedFiles: input.changedFiles
    }
  });
}

function createProtectedPathsResult(input: {
  validator: ToolValidatorRule;
  layer: string;
  changedFiles: readonly string[];
  protectedPaths: readonly string[];
}): ValidatorResultRecordModel {
  const violations = input.changedFiles.filter((filePath) =>
    input.protectedPaths.some((protectedPath) =>
      pathMatchesProtectedPattern(filePath, protectedPath)
    )
  );

  return createStaticResult({
    validatorId: input.validator.id,
    layer: input.layer,
    tool: input.validator.tool,
    blocking: input.validator.blocking,
    status: violations.length > 0 ? "fail" : "pass",
    message:
      violations.length > 0
        ? `Protected paths were modified: ${violations.join(", ")}`
        : "No protected paths were modified.",
    details: {
      violations
    }
  });
}

function createHarnessIntegrityResult(input: {
  validator: ToolValidatorRule;
  layer: string;
  changedFiles: readonly string[];
}): ValidatorResultRecordModel {
  const harnessWrites = input.changedFiles.filter((filePath) =>
    pathMatchesScope(filePath, "files/harness/") || pathMatchesScope(filePath, "harness/")
  );

  return createStaticResult({
    validatorId: input.validator.id,
    layer: input.layer,
    tool: input.validator.tool,
    blocking: input.validator.blocking,
    status: harnessWrites.length > 0 ? "fail" : "pass",
    message:
      harnessWrites.length > 0
        ? `Harness surfaces were modified: ${harnessWrites.join(", ")}`
        : "Harness integrity preserved.",
    details: {
      harnessWrites
    }
  });
}

async function runSecretScanValidator(input: {
  validator: ToolValidatorRule;
  layer: string;
  workspacePath: string;
  targetPaths: readonly string[];
  changedFiles: readonly string[];
}): Promise<ValidatorResultRecordModel> {
  const findings: Array<{ filePath: string; label: string; match: string }> = [];
  const filesToInspect = [...new Set([...input.targetPaths, ...input.changedFiles])];

  for (const relativePath of filesToInspect) {
    const absolutePath = path.join(input.workspacePath, relativePath);

    if (!(await pathIsFile(absolutePath))) {
      continue;
    }

    const contents = await fs.readFile(absolutePath, "utf8");

    for (const pattern of secretPatterns) {
      const match = contents.match(pattern.expression);

      if (match) {
        findings.push({
          filePath: relativePath,
          label: pattern.label,
          match: match[0]
        });
      }
    }
  }

  return createStaticResult({
    validatorId: input.validator.id,
    layer: input.layer,
    tool: input.validator.tool,
    blocking: input.validator.blocking,
    status: findings.length > 0 ? "fail" : "pass",
    message:
      findings.length > 0
        ? `Potential secrets detected in ${findings[0]?.filePath ?? "workspace"}.`
        : "No secret patterns detected in synthetic outputs.",
    details: {
      findings
    }
  });
}

async function createPolicyComplianceResult(input: {
  validator: ToolValidatorRule;
  layer: string;
  policyDecisions: readonly ValidationPolicyDecision[];
  auditEvents: readonly ValidationAuditEvent[];
  policyDecisionLogPath?: string;
  auditTrailPath?: string;
}): Promise<ValidatorResultRecordModel> {
  const policyDecisions =
    input.policyDecisions.length > 0
      ? input.policyDecisions
      : await readOptionalJsonArray<ValidationPolicyDecision>(input.policyDecisionLogPath);
  const auditEvents =
    input.auditEvents.length > 0
      ? input.auditEvents
      : await readOptionalJsonArray<ValidationAuditEvent>(input.auditTrailPath);

  if (policyDecisions.length === 0) {
    return createStaticResult({
      validatorId: input.validator.id,
      layer: input.layer,
      tool: input.validator.tool,
      blocking: input.validator.blocking,
      status: "fail",
      message: "Policy compliance requires recorded policy decisions.",
      details: {}
    });
  }

  if (auditEvents.length === 0) {
    return createStaticResult({
      validatorId: input.validator.id,
      layer: input.layer,
      tool: input.validator.tool,
      blocking: input.validator.blocking,
      status: "fail",
      message: "Policy compliance requires recorded audit events.",
      details: {}
    });
  }

  const disallowedDecisions = policyDecisions.filter(
    (decision) => decision.decision.toLowerCase() !== "allow"
  );

  return createStaticResult({
    validatorId: input.validator.id,
    layer: input.layer,
    tool: input.validator.tool,
    blocking: input.validator.blocking,
    status: disallowedDecisions.length > 0 ? "fail" : "pass",
    message:
      disallowedDecisions.length > 0
        ? `Found non-ALLOW policy decisions: ${disallowedDecisions
            .map((decision) => decision.decision)
            .join(", ")}`
        : "Policy decisions are ALLOW-only and the audit trail is present.",
    details: {
      disallowedDecisions,
      auditEventCount: auditEvents.length
    }
  });
}

function buildValidatorEvidenceItems(input: {
  evidenceRequirements: readonly EvidenceRequirement[];
  results: readonly ValidatorResultRecordModel[];
  validatorArtifacts: readonly ValidatorOutputArtifact[];
  providedEvidence: readonly ValidationEvidenceInput[];
  enforceUpstreamEvidence: boolean;
}): {
  evidenceItems: UpsertEvidenceItemInput[];
  mandatoryItemCount: number;
  presentItemCount: number;
} {
  const artifactByValidator = new Map<string, ValidatorOutputArtifact>(
    input.validatorArtifacts.map((artifact) => [artifact.validatorId, artifact])
  );
  const providedBySource = new Map<string, ValidationEvidenceInput>(
    input.providedEvidence.map((entry) => [entry.source, entry])
  );
  const ranValidators = new Set(
    input.results
      .filter((result) => result.status !== "skip")
      .map((result) => result.validatorId)
  );

  const relevantRequirements = input.evidenceRequirements.filter((requirement) => {
    if (requirement.source.startsWith("validator.")) {
      return ranValidators.has(requirement.source.replace("validator.", ""));
    }

    return input.enforceUpstreamEvidence || providedBySource.has(requirement.source);
  });

  const evidenceItems = relevantRequirements.map((requirement) => {
    const validatorId = requirement.source.startsWith("validator.")
      ? requirement.source.replace("validator.", "")
      : null;
    const artifact = validatorId ? artifactByValidator.get(validatorId) : undefined;
    const provided = providedBySource.get(requirement.source);

    return {
      evidence_bundle_id: "",
      task_run_id: "",
      evidence_type: requirement.type,
      source: requirement.source,
      tier: requirement.tier,
      required: true,
      present: artifact !== undefined || provided?.present !== false,
      condition: requirement.condition,
      storage_ref: artifact?.filePath ?? provided?.storageRef,
      metadata: toDbJson(provided?.metadata ?? {})
    };
  });

  return {
    evidenceItems,
    mandatoryItemCount: relevantRequirements.length,
    presentItemCount: evidenceItems.filter((entry) => entry.present).length
  };
}

async function writeValidatorArtifacts(input: {
  config: Wave0ValidationRunInput["config"];
  waveRunId: string;
  taskRunId: string;
  results: readonly ValidatorResultRecordModel[];
}): Promise<{
  validatorResultsPath: string;
  validatorArtifacts: ValidatorOutputArtifact[];
}> {
  const validatorsDir = path.join(
    input.config.paths.evidenceRoot,
    input.waveRunId,
    input.taskRunId,
    "validators"
  );
  await fs.mkdir(validatorsDir, { recursive: true });

  const validatorArtifacts: ValidatorOutputArtifact[] = [];

  for (const result of input.results) {
    const artifactPath = path.join(validatorsDir, `${result.validatorId}.json`);
    await fs.writeFile(artifactPath, JSON.stringify(result, null, 2), "utf8");
    result.artifactPath = artifactPath;
    validatorArtifacts.push({
      validatorId: result.validatorId,
      filePath: artifactPath
    });
  }

  const validatorResultsPath = path.join(validatorsDir, "validator-results.json");
  await fs.writeFile(validatorResultsPath, JSON.stringify(input.results, null, 2), "utf8");

  return {
    validatorResultsPath,
    validatorArtifacts
  };
}

async function persistResults(input: {
  runInput: Wave0ValidationRunInput;
  results: readonly ValidatorResultRecordModel[];
  validatorResultsPath: string;
  validatorArtifacts: readonly ValidatorOutputArtifact[];
}): Promise<Wave0ValidationRunResult["evidenceSummary"]> {
  const evidenceState = buildValidatorEvidenceItems({
    evidenceRequirements: [
      ...input.runInput.evidenceManifest.required,
      ...input.runInput.evidenceManifest.conditional
    ],
    results: input.results,
    validatorArtifacts: input.validatorArtifacts,
    providedEvidence: input.runInput.providedEvidence ?? [],
    enforceUpstreamEvidence: input.runInput.enforceUpstreamEvidence ?? false
  });
  const completenessRatio =
    evidenceState.mandatoryItemCount === 0
      ? 1
      : evidenceState.presentItemCount / evidenceState.mandatoryItemCount;
  const summaryStatus = completenessRatio === 1 ? "complete" : "incomplete";
  const bundlePath = path.join(
    input.runInput.config.paths.evidenceRoot,
    input.runInput.waveRunId,
    input.runInput.taskRunId,
    "bundle-summary.json"
  );
  const summaryPayload = {
    validatorResultsPath: input.validatorResultsPath,
    blockingStatus: computeBlockingStatus(input.results),
    mandatoryItemCount: evidenceState.mandatoryItemCount,
    presentItemCount: evidenceState.presentItemCount,
    completenessRatio
  };

  await fs.mkdir(path.dirname(bundlePath), { recursive: true });
  await fs.writeFile(bundlePath, JSON.stringify(summaryPayload, null, 2), "utf8");

  if (input.runInput.repository) {
    const evidenceBundle = await input.runInput.repository.upsertEvidenceBundle({
      wave_run_id: input.runInput.waveRunId,
      task_run_id: input.runInput.taskRunId,
      packet_id: input.runInput.packetManifest.packet_id,
      status: summaryStatus,
      completeness_ratio: completenessRatio,
      mandatory_item_count: evidenceState.mandatoryItemCount,
      present_item_count: evidenceState.presentItemCount,
      bundle_ref: bundlePath,
      summary: summaryPayload,
      completed_at: new Date()
    });

    for (const evidenceItem of evidenceState.evidenceItems) {
      await input.runInput.repository.upsertEvidenceItem({
        ...evidenceItem,
        evidence_bundle_id: evidenceBundle.evidence_bundle_id,
        task_run_id: input.runInput.taskRunId
      });
    }

    for (const result of input.results) {
      await input.runInput.repository.upsertValidatorResult({
        task_run_id: input.runInput.taskRunId,
        validator_id: result.validatorId,
        validator_layer: result.layer,
        validator_tool: result.tool,
        blocking: result.blocking,
        status: result.status,
        scope: result.scope,
        condition: result.condition,
        message: result.message,
        details: toDbJson({
          ...result.details,
          artifactPath: result.artifactPath
        }),
        started_at: new Date(result.startedAt),
        completed_at: new Date(result.completedAt)
      });
    }
  }

  return {
    status: summaryStatus,
    completenessRatio,
    mandatoryItemCount: evidenceState.mandatoryItemCount,
    presentItemCount: evidenceState.presentItemCount,
    bundlePath
  };
}

const defaultCommandExecutor: ValidationCommandExecutor = async (
  request: ValidationCommandExecutionRequest
): Promise<ValidatorCommandResult> =>
  executeCommand({
    command: request.spec.command,
    args: request.spec.args,
    cwd: request.cwd,
    env: request.spec.env
  });

export async function runWave0Validators(
  input: Wave0ValidationRunInput
): Promise<Wave0ValidationRunResult> {
  const startedAt = new Date();
  const packageScripts = await readPackageJsonScripts(input.workspacePath);
  const changedFiles = (
    input.changedFiles
      ? [...input.changedFiles]
      : await detectChangedFiles(input.workspacePath)
  )
    .map((filePath) => normalizeWorkspaceRelativePath(input.workspacePath, filePath))
    .sort();
  const packetHasTests = input.packetManifest.target_paths.some((entry) =>
    /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry)
  );
  const dependencyFilesChanged = changedFiles.some((filePath) =>
    /(^|\/)(package\.json|pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/.test(filePath)
  );
  const testFiles = input.packetManifest.target_paths.filter((entry) =>
    /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry)
  );
  const expectedOutputPaths = extractExpectedOutputPaths(input.packetManifest.expected_outputs);
  const commandExecutor = input.commandExecutor ?? defaultCommandExecutor;
  const results: ValidatorResultRecordModel[] = [];

  const runnableValidators = Object.entries(input.validatorManifest.validator_set)
    .filter(([layerName]) => layerName !== "agentic_review")
    .flatMap(([layerName, validators]) =>
      (validators as ToolValidatorRule[])
        .filter((validator) => supportedBlockingValidatorIds.has(validator.id))
        .filter((validator) => isWaveRequired(validator.required_for_waves, input.waveId))
        .sort((left, right) => left.order - right.order)
        .map((validator) => ({ layerName, validator }))
    );

  for (const { layerName, validator } of runnableValidators) {
    if (
      !shouldRunCondition({
        condition: validator.condition,
        packetHasTests,
        dependencyFilesChanged
      })
    ) {
      results.push(
        createStaticResult({
          validatorId: validator.id,
          layer: layerName,
          tool: validator.tool,
          blocking: validator.blocking,
          scope: validator.scope,
          condition: validator.condition,
          status: "skip",
          message: `Skipped because condition ${validator.condition ?? "unknown"} was not met.`,
          details: {}
        })
      );
      continue;
    }

    const commandSpec =
      input.commandOverrides?.[validator.id] ??
      createDefaultCommandSpec(validator, input.workspacePath, testFiles, packageScripts);

    if (validator.id === "file_structure") {
      results.push(
        await runFileStructureValidator({
          validator,
          layer: layerName,
          workspacePath: input.workspacePath,
          expectedOutputPaths,
          targetPaths: input.packetManifest.target_paths
        })
      );
      continue;
    }

    if (validator.id === "scope_drift") {
      results.push(
        createScopeValidationResult({
          validator,
          layer: layerName,
          changedFiles,
          scope: input.packetManifest.scope,
          targetPaths: input.packetManifest.target_paths,
          packetClass: input.packetManifest.packet_class
        })
      );
      continue;
    }

    if (validator.id === "protected_paths") {
      results.push(
        createProtectedPathsResult({
          validator,
          layer: layerName,
          changedFiles,
          protectedPaths: input.packetManifest.protected_paths
        })
      );
      continue;
    }

    if (validator.id === "harness_integrity") {
      results.push(
        createHarnessIntegrityResult({
          validator,
          layer: layerName,
          changedFiles
        })
      );
      continue;
    }

    if (validator.id === "secret_scan") {
      results.push(
        await runSecretScanValidator({
          validator,
          layer: layerName,
          workspacePath: input.workspacePath,
          targetPaths: input.packetManifest.target_paths,
          changedFiles
        })
      );
      continue;
    }

    if (validator.id === "policy_compliance") {
      results.push(
        await createPolicyComplianceResult({
          validator,
          layer: layerName,
          policyDecisions: input.policyDecisions ?? [],
          auditEvents: input.auditEvents ?? [],
          policyDecisionLogPath: input.policyDecisionLogPath,
          auditTrailPath: input.auditTrailPath
        })
      );
      continue;
    }

    if (validator.id === "evidence_completeness") {
      const provisionalEvidenceState = buildValidatorEvidenceItems({
        evidenceRequirements: [
          ...input.evidenceManifest.required,
          ...input.evidenceManifest.conditional
        ],
        results,
        validatorArtifacts: results.map((result) => ({
          validatorId: result.validatorId,
          filePath: path.join(
            input.config.paths.evidenceRoot,
            input.waveRunId,
            input.taskRunId,
            "validators",
            `${result.validatorId}.json`
          )
        })),
        providedEvidence: input.providedEvidence ?? [],
        enforceUpstreamEvidence: input.enforceUpstreamEvidence ?? false
      });
      const missingItems = provisionalEvidenceState.evidenceItems.filter(
        (entry) =>
          !entry.present &&
          !(
            entry.source.startsWith("validator.") &&
            runnableValidators.some(
              ({ validator: candidate }) =>
                candidate.id === entry.source.replace("validator.", "")
            )
          )
      );

      results.push(
        createStaticResult({
          validatorId: validator.id,
          layer: layerName,
          tool: validator.tool,
          blocking: validator.blocking,
          status: missingItems.length > 0 ? "fail" : "pass",
          message:
            missingItems.length > 0
              ? `Evidence preconditions missing: ${missingItems
                  .map((entry) => entry.evidence_type)
                  .join(", ")}`
              : "Validator-produced evidence preconditions are satisfied.",
          details: {
            missingItems: missingItems.map((entry) => ({
              evidenceType: entry.evidence_type,
              source: entry.source
            })),
            mandatoryItemCount: provisionalEvidenceState.mandatoryItemCount,
            presentItemCount: provisionalEvidenceState.presentItemCount
          }
        })
      );
      continue;
    }

    if (validator.id === "confidence_scoring") {
      results.push(
        createConfidenceScoringResult({
          validator,
          layer: layerName,
          results
        })
      );
      continue;
    }

    if (validator.id === "lint" && !commandSpec) {
      results.push(
        await runFallbackLintValidator({
          validator,
          layer: layerName,
          workspacePath: input.workspacePath,
          targetPaths: input.packetManifest.target_paths
        })
      );
      continue;
    }

    if (validator.id === "architecture_check" && !commandSpec) {
      results.push(
        await runArchitectureValidator({
          validator,
          layer: layerName,
          workspacePath: input.workspacePath,
          targetPaths: input.packetManifest.target_paths,
          changedFiles
        })
      );
      continue;
    }

    if (!commandSpec) {
      results.push(
        createStaticResult({
          validatorId: validator.id,
          layer: layerName,
          tool: validator.tool,
          blocking: validator.blocking,
          status: "error",
          message: `No local command wrapper is defined for ${validator.id}.`,
          details: {}
        })
      );
      continue;
    }

    results.push(
      await runExternalValidator({
        validator,
        layer: layerName,
        workspacePath: input.workspacePath,
        commandSpec,
        commandExecutor
      })
    );
  }

  const { validatorResultsPath, validatorArtifacts } = await writeValidatorArtifacts({
    config: input.config,
    waveRunId: input.waveRunId,
    taskRunId: input.taskRunId,
    results
  });
  const evidenceSummary = await persistResults({
    runInput: input,
    results,
    validatorResultsPath,
    validatorArtifacts
  });

  return {
    packetId: input.packetManifest.packet_id,
    waveId: input.waveId,
    workspacePath: input.workspacePath,
    blockingStatus: computeBlockingStatus(results),
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    changedFiles,
    validatorArtifacts,
    validatorResultsPath,
    evidenceSummary,
    results
  };
}
