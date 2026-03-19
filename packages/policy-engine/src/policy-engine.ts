import path from "node:path";
import { defineForgePackage } from "@forge/shared";
import {
  loadWave0PolicySet
} from "./loader.js";
import type {
  AgentRole,
  LoadedPolicySet,
  PermissionLevel,
  PolicyDecision,
  PolicyEngineLike,
  PolicyEvaluationResult,
  ToolPolicyContext,
  ToolPolicyRequest,
  Wave0ToolName
} from "./types.js";

export const policyEnginePackage = defineForgePackage({
  name: "@forge/policy-engine",
  purpose: "Loads Wave 0 policy files and evaluates every typed tool invocation.",
  dependsOn: ["@forge/shared"],
  status: "skeleton"
});

const rolePermissions: Record<AgentRole, Record<Wave0ToolName, PermissionLevel>> = {
  planner: {
    "file.read": "READ",
    "file.write": "NONE",
    "dir.list": "READ",
    "repo.inspect": "READ",
    "run.typecheck": "NONE",
    "run.lint": "NONE",
    "run.tests": "NONE",
    "git.status": "READ",
    "git.diff": "READ",
    "git.add": "NONE",
    "git.commit": "NONE"
  },
  implementer: {
    "file.read": "READ",
    "file.write": "SCOPED",
    "dir.list": "READ",
    "repo.inspect": "READ",
    "run.typecheck": "FULL",
    "run.lint": "FULL",
    "run.tests": "FULL",
    "git.status": "READ",
    "git.diff": "READ",
    "git.add": "GATED",
    "git.commit": "GATED"
  },
  validator: {
    "file.read": "READ",
    "file.write": "NONE",
    "dir.list": "READ",
    "repo.inspect": "READ",
    "run.typecheck": "FULL",
    "run.lint": "FULL",
    "run.tests": "FULL",
    "git.status": "READ",
    "git.diff": "READ",
    "git.add": "NONE",
    "git.commit": "NONE"
  },
  debugger: {
    "file.read": "READ",
    "file.write": "SCOPED",
    "dir.list": "READ",
    "repo.inspect": "READ",
    "run.typecheck": "FULL",
    "run.lint": "FULL",
    "run.tests": "FULL",
    "git.status": "READ",
    "git.diff": "READ",
    "git.add": "GATED",
    "git.commit": "GATED"
  },
  reviewer: {
    "file.read": "READ",
    "file.write": "NONE",
    "dir.list": "READ",
    "repo.inspect": "READ",
    "run.typecheck": "NONE",
    "run.lint": "NONE",
    "run.tests": "NONE",
    "git.status": "READ",
    "git.diff": "READ",
    "git.add": "NONE",
    "git.commit": "NONE"
  },
  doc_updater: {
    "file.read": "READ",
    "file.write": "NONE",
    "dir.list": "READ",
    "repo.inspect": "READ",
    "run.typecheck": "NONE",
    "run.lint": "NONE",
    "run.tests": "NONE",
    "git.status": "READ",
    "git.diff": "READ",
    "git.add": "NONE",
    "git.commit": "GATED"
  },
  harness_maintainer: {
    "file.read": "READ",
    "file.write": "ESCALATE",
    "dir.list": "READ",
    "repo.inspect": "READ",
    "run.typecheck": "NONE",
    "run.lint": "NONE",
    "run.tests": "NONE",
    "git.status": "READ",
    "git.diff": "READ",
    "git.add": "ESCALATE",
    "git.commit": "ESCALATE"
  }
};

function matchesProtectedPath(relativePath: string, protectedPath: string): boolean {
  const normalizedTarget = relativePath.replace(/\\/gu, "/");
  const normalizedProtected = protectedPath.replace(/\\/gu, "/");

  if (normalizedProtected.endsWith("*")) {
    const prefix = normalizedProtected.slice(0, -1);
    return normalizedTarget.startsWith(prefix);
  }

  if (normalizedProtected.endsWith("/")) {
    return normalizedTarget.startsWith(normalizedProtected);
  }

  return normalizedTarget === normalizedProtected;
}

function normalizeTargetPath(worktreePath: string, targetPath: string): string {
  const absoluteTarget = path.isAbsolute(targetPath)
    ? targetPath
    : path.resolve(worktreePath, targetPath);
  const relativePath = path.relative(worktreePath, absoluteTarget);

  return relativePath.replace(/\\/gu, "/");
}

function isWithinScope(relativePath: string, scopeRoots: readonly string[]): boolean {
  return scopeRoots.some((scopeRoot) => {
    const normalizedScope = scopeRoot.replace(/\\/gu, "/");
    return (
      relativePath === normalizedScope.replace(/\/$/u, "") ||
      relativePath.startsWith(normalizedScope)
    );
  });
}

function buildProtectedPaths(
  policies: LoadedPolicySet,
  context: ToolPolicyContext
): string[] {
  return Array.from(
    new Set([...policies.protectedPaths, ...context.packetManifest.protected_paths])
  );
}

function normalizeCommand(command: readonly string[]): string {
  return command.join(" ").trim();
}

function isAllowlistedCommand(
  policies: LoadedPolicySet,
  context: ToolPolicyContext,
  command: readonly string[]
): boolean {
  const commandText = normalizeCommand(command);
  const roleRule = policies.shell.byRole[context.agentRole];
  return Boolean(
    roleRule &&
      roleRule.permission === "gated" &&
      roleRule.allowlist.some((prefix) => commandText === prefix)
  );
}

function deniedByShellPattern(
  policies: LoadedPolicySet,
  command: readonly string[]
): string | null {
  const commandText = normalizeCommand(command);
  const matchedPattern = policies.shell.alwaysDeniedPatterns.find((pattern) =>
    commandText.includes(pattern)
  );
  return matchedPattern ?? null;
}

function createDecision(
  context: ToolPolicyContext,
  request: ToolPolicyRequest,
  decision: PolicyDecision,
  reason: string,
  targetPaths: string[],
  scopeStatus: "in_scope" | "out_of_scope" | "protected_path" | "not_applicable"
): PolicyEvaluationResult {
  return {
    decision,
    record: {
      decision,
      reason,
      toolName: request.toolName,
      actionClass: request.actionClass,
      agentRole: context.agentRole,
      targetPaths,
      scopeStatus,
      evaluatedAt: new Date().toISOString(),
      packetId: context.packetManifest.packet_id
    }
  };
}

export class LocalPolicyEngine implements PolicyEngineLike {
  private readonly policyLoadPromise: Promise<LoadedPolicySet>;

  constructor(private readonly config: ToolPolicyContext["config"]) {
    this.policyLoadPromise = loadWave0PolicySet(config);
  }

  async getPolicySet(): Promise<LoadedPolicySet> {
    return await this.policyLoadPromise;
  }

  async evaluate(
    context: ToolPolicyContext,
    request: ToolPolicyRequest
  ): Promise<PolicyEvaluationResult> {
    try {
      const policies = await this.getPolicySet();
      const permission = rolePermissions[context.agentRole][request.toolName];

      if (permission === "NONE") {
        return createDecision(
          context,
          request,
          "DENY",
          `${context.agentRole} cannot use ${request.toolName}.`,
          [],
          "not_applicable"
        );
      }

      if (permission === "ESCALATE") {
        return createDecision(
          context,
          request,
          "ESCALATE",
          `${context.agentRole} requires operator approval for ${request.toolName}.`,
          [],
          "not_applicable"
        );
      }

      const normalizedTargets = (request.targetPaths ?? []).map((targetPath) =>
        normalizeTargetPath(context.worktreePath, targetPath)
      );
      const protectedPaths = buildProtectedPaths(policies, context);

      if (
        normalizedTargets.some((targetPath) =>
          targetPath.startsWith("..") || path.isAbsolute(targetPath)
        )
      ) {
        return createDecision(
          context,
          request,
          "DENY",
          "Target path escapes the task worktree.",
          normalizedTargets,
          "out_of_scope"
        );
      }

      if (
        normalizedTargets.some((targetPath) =>
          protectedPaths.some((protectedPath) =>
            matchesProtectedPath(targetPath, protectedPath)
          )
        )
      ) {
        return createDecision(
          context,
          request,
          "ESCALATE",
          "Target path is protected and requires operator approval.",
          normalizedTargets,
          "protected_path"
        );
      }

      if (
        permission === "SCOPED" &&
        normalizedTargets.some(
          (targetPath) => !isWithinScope(targetPath, context.packetManifest.scope)
        )
      ) {
        return createDecision(
          context,
          request,
          "DENY",
          "Target path is outside the packet scope.",
          normalizedTargets,
          "out_of_scope"
        );
      }

      if (request.command && request.command.length > 0) {
        const deniedPattern = deniedByShellPattern(policies, request.command);

        if (deniedPattern) {
          return createDecision(
            context,
            request,
            "DENY",
            `Command matches denied shell pattern: ${deniedPattern}.`,
            normalizedTargets,
            normalizedTargets.length > 0 ? "in_scope" : "not_applicable"
          );
        }

        if (!isAllowlistedCommand(policies, context, request.command)) {
          return createDecision(
            context,
            request,
            "ESCALATE",
            "Command is not in the role allowlist.",
            normalizedTargets,
            normalizedTargets.length > 0 ? "in_scope" : "not_applicable"
          );
        }
      }

      const tokenBudget =
        policies.tokenBudgets.byPacketClass[context.packetManifest.packet_class] ??
        0;
      const estimatedTokens = request.estimatedTokens ?? 0;
      const tokensConsumed = context.tokensConsumed ?? 0;

      if (tokenBudget > 0 && tokensConsumed + estimatedTokens > tokenBudget) {
        return createDecision(
          context,
          request,
          "ESCALATE",
          "Token budget would be exceeded by this action.",
          normalizedTargets,
          normalizedTargets.length > 0 ? "in_scope" : "not_applicable"
        );
      }

      return createDecision(
        context,
        request,
        permission === "GATED" ? "ALLOW" : "ALLOW",
        "Allowed by Wave 0 policy.",
        normalizedTargets,
        normalizedTargets.length > 0 ? "in_scope" : "not_applicable"
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_policy_error";
      return createDecision(
        context,
        request,
        "DENY",
        `Policy evaluation failed closed: ${message}`,
        request.targetPaths ?? [],
        "not_applicable"
      );
    }
  }
}

export const defaultProtectedPaths = [
  ".github/",
  ".env",
  ".env*",
  "package.json",
  "AGENTS.md",
  "prisma/migrations/"
] as const;
