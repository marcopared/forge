export type ForgeEnvironment = "development" | "test" | "production";

export type ForgePackageName =
  | "@forge/shared"
  | "@forge/orchestrator"
  | "@forge/agent-runner"
  | "@forge/runtime-manager"
  | "@forge/policy-engine"
  | "@forge/tool-broker"
  | "@forge/validator-runner"
  | "@forge/evidence"
  | "@forge/storage"
  | "@forge/config"
  | "@forge/db";

export interface ForgePackageDescriptor {
  name: ForgePackageName;
  purpose: string;
  dependsOn: readonly ForgePackageName[];
  status: "skeleton";
}

export interface ForgePaths {
  root: string;
  filesRoot: string;
  storageRoot: string;
  blobRoot: string;
  evidenceRoot: string;
  auditRoot: string;
  logRoot: string;
  worktreeRoot: string;
}

export interface ForgeConnectionTarget {
  host: string;
  port: number;
  url: string;
}

export interface ForgeManifestRefs {
  packetRegistry: string;
  wave: string;
  benchmark: string;
}

export interface ForgeConfig {
  environment: ForgeEnvironment;
  defaultWaveId: string;
  defaultPacketId: string;
  defaultBenchmarkId: string;
  phaseBranch: string;
  launchMode: "operator-launched";
  reviewMode: "human-required";
  concurrencyCap: number;
  manifestRefs: ForgeManifestRefs;
  postgres: ForgeConnectionTarget & {
    database: string;
    user: string;
    password: string;
    schema: string;
  };
  redis: ForgeConnectionTarget;
  paths: ForgePaths;
}

export interface WorktreeDescriptor {
  branchName: string;
  taskId: string;
  worktreePath: string;
}

export interface ToolCatalogEntry {
  name: string;
  purpose: string;
}

export function defineForgePackage(
  descriptor: ForgePackageDescriptor
): ForgePackageDescriptor {
  return descriptor;
}

export const sharedPackage = defineForgePackage({
  name: "@forge/shared",
  purpose: "Shared types and bootstrap metadata for the local Wave 0 runtime.",
  dependsOn: [],
  status: "skeleton"
});
