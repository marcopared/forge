import fs from "node:fs/promises";
import path from "node:path";
import type { ForgeConfig, PacketClass } from "@forge/shared";
import type {
  AgentRole,
  LoadedPolicySet,
  ShellAllowlistPolicy,
  TokenBudgetPolicy
} from "./types.js";

function getPolicyPath(config: ForgeConfig, policyFileName: string): string {
  return path.join(config.paths.filesRoot, "harness", "policies", policyFileName);
}

async function readPolicyLines(filePath: string): Promise<string[]> {
  const raw = await fs.readFile(filePath, "utf8");
  return raw.split(/\r?\n/u);
}

function trimListValue(line: string): string {
  return line.replace(/^\s*-\s*/u, "").trim();
}

async function loadProtectedPaths(config: ForgeConfig): Promise<string[]> {
  const lines = await readPolicyLines(getPolicyPath(config, "protected-paths.yaml"));
  const protectedPaths: string[] = [];
  let insidePaths = false;
  let currentIndent = 0;

  for (const line of lines) {
    const indent = line.match(/^ */u)?.[0].length ?? 0;
    const trimmed = line.trim();

    if (trimmed === "paths:") {
      insidePaths = true;
      currentIndent = indent;
      continue;
    }

    if (insidePaths && indent <= currentIndent && trimmed.length > 0 && !trimmed.startsWith("-")) {
      insidePaths = false;
    }

    if (insidePaths && trimmed.startsWith("- ")) {
      protectedPaths.push(trimListValue(line));
    }
  }

  return protectedPaths;
}

async function loadShellPolicy(config: ForgeConfig): Promise<ShellAllowlistPolicy> {
  const lines = await readPolicyLines(getPolicyPath(config, "shell-allowlist.yaml"));
  const byRole: ShellAllowlistPolicy["byRole"] = {};
  const alwaysDeniedPatterns: string[] = [];

  let currentSection: "role_rules" | "always_denied_patterns" | null = null;
  let currentRole: AgentRole | null = null;
  let currentRoleIndent = 0;
  let insideAllowlist = false;

  for (const line of lines) {
    const indent = line.match(/^ */u)?.[0].length ?? 0;
    const trimmed = line.trim();

    if (trimmed === "role_rules:") {
      currentSection = "role_rules";
      currentRole = null;
      insideAllowlist = false;
      continue;
    }

    if (trimmed === "always_denied_patterns:") {
      currentSection = "always_denied_patterns";
      currentRole = null;
      insideAllowlist = false;
      continue;
    }

    if (!currentSection || trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }

    if (currentSection === "always_denied_patterns") {
      if (trimmed.startsWith("- ")) {
        alwaysDeniedPatterns.push(trimListValue(line));
      }
      continue;
    }

    if (currentSection === "role_rules") {
      if (indent === 2 && trimmed.endsWith(":")) {
        currentRole = trimmed.slice(0, -1) as AgentRole;
        currentRoleIndent = indent;
        insideAllowlist = false;
        byRole[currentRole] = {
          permission: "none",
          allowlist: []
        };
        continue;
      }

      if (!currentRole) {
        continue;
      }

      if (indent <= currentRoleIndent) {
        currentRole = null;
        insideAllowlist = false;
        continue;
      }

      if (trimmed.startsWith("permission:")) {
        byRole[currentRole] = {
          permission: trimmed.includes("gated") ? "gated" : "none",
          allowlist: byRole[currentRole]?.allowlist ?? []
        };
        insideAllowlist = false;
        continue;
      }

      if (trimmed === "allowlist:") {
        insideAllowlist = true;
        continue;
      }

      if (insideAllowlist && trimmed.startsWith("- ")) {
        byRole[currentRole]?.allowlist.push(trimListValue(line));
        continue;
      }

      if (insideAllowlist && !trimmed.startsWith("- ")) {
        insideAllowlist = false;
      }
    }
  }

  return {
    byRole,
    alwaysDeniedPatterns
  };
}

async function loadTokenBudgetPolicy(config: ForgeConfig): Promise<TokenBudgetPolicy> {
  const lines = await readPolicyLines(getPolicyPath(config, "token-budgets.yaml"));
  const byPacketClass: Partial<Record<PacketClass, number>> = {};
  let insidePacketClass = false;
  let currentPacketClass: PacketClass | null = null;
  let currentIndent = 0;

  for (const line of lines) {
    const indent = line.match(/^ */u)?.[0].length ?? 0;
    const trimmed = line.trim();

    if (trimmed === "per_packet_class:") {
      insidePacketClass = true;
      continue;
    }

    if (!insidePacketClass || trimmed.length === 0) {
      continue;
    }

    if (indent === 2 && trimmed.endsWith(":")) {
      currentPacketClass = trimmed.slice(0, -1) as PacketClass;
      currentIndent = indent;
      continue;
    }

    if (currentPacketClass && indent > currentIndent && trimmed.startsWith("total_tokens:")) {
      const rawValue = trimmed.split(":")[1]?.trim() ?? "";
      const parsed = Number.parseInt(rawValue, 10);

      if (!Number.isNaN(parsed)) {
        byPacketClass[currentPacketClass] = parsed;
      }
    }
  }

  return { byPacketClass };
}

async function loadBlessedStack(
  config: ForgeConfig
): Promise<LoadedPolicySet["blessedStack"]> {
  const lines = await readPolicyLines(getPolicyPath(config, "blessed-stack.yaml"));
  let currentSection: "testing" | "package_manager" | "language" | null = null;
  let testing = "vitest";
  let packageManager = "pnpm";
  let language = "typescript";

  for (const line of lines) {
    const indent = line.match(/^ */u)?.[0].length ?? 0;
    const trimmed = line.trim();

    if (indent === 2 && trimmed.endsWith(":")) {
      const sectionName = trimmed.slice(0, -1);
      currentSection =
        sectionName === "testing" ||
        sectionName === "package_manager" ||
        sectionName === "language"
          ? sectionName
          : null;
      continue;
    }

    if (indent <= 2 && !trimmed.endsWith(":")) {
      currentSection = null;
    }

    if (currentSection === "testing" && trimmed.startsWith("unit:")) {
      testing = trimmed.split(":")[1]?.trim() ?? testing;
    }

    if (currentSection === "package_manager" && trimmed.startsWith("name:")) {
      packageManager = trimmed.split(":")[1]?.trim() ?? packageManager;
    }

    if (currentSection === "language" && trimmed.startsWith("name:")) {
      language = trimmed.split(":")[1]?.trim() ?? language;
    }
  }

  return { packageManager, testing, language };
}

export async function loadWave0PolicySet(
  config: ForgeConfig
): Promise<LoadedPolicySet> {
  const [protectedPaths, shell, tokenBudgets, blessedStack] = await Promise.all([
    loadProtectedPaths(config),
    loadShellPolicy(config),
    loadTokenBudgetPolicy(config),
    loadBlessedStack(config)
  ]);

  return {
    protectedPaths,
    shell,
    tokenBudgets,
    blessedStack
  };
}
