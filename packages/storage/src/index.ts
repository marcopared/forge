import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  defineForgePackage,
  type ForgeConfig
} from "@forge/shared";

export const storagePackage = defineForgePackage({
  name: "@forge/storage",
  purpose: "Owns local filesystem-backed blob, evidence, audit, and worktree roots.",
  dependsOn: ["@forge/shared", "@forge/config"],
  status: "skeleton"
});

export interface StorageLayout {
  storageRoot: string;
  blobRoot: string;
  evidenceRoot: string;
  auditRoot: string;
  logRoot: string;
  worktreeRoot: string;
}

export type StorageArea = "blob" | "evidence" | "audit" | "log";

export interface RunStorageScope {
  waveRunId: string;
  taskRunId: string;
  runRoot: string;
  blobRoot: string;
  evidenceRoot: string;
  auditRoot: string;
  logRoot: string;
}

export interface StoredArtifact {
  area: StorageArea;
  storageRef: string;
  absolutePath: string;
  bytes: number;
  sha256: string;
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function sanitizeSegment(value: string): string {
  const normalized = value
    .trim()
    .replace(/[^A-Za-z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  return normalized.length > 0 ? normalized : "run";
}

function resolveScopedRoot(scope: RunStorageScope, area: StorageArea): string {
  switch (area) {
    case "blob":
      return scope.blobRoot;
    case "evidence":
      return scope.evidenceRoot;
    case "audit":
      return scope.auditRoot;
    case "log":
      return scope.logRoot;
  }
}

function resolveScopedArtifactPath(
  scope: RunStorageScope,
  area: StorageArea,
  relativePath: string
): string {
  const root = resolveScopedRoot(scope, area);
  const normalizedRelativePath = relativePath.replace(/^\/+/u, "");
  const absolutePath = path.resolve(root, normalizedRelativePath);

  if (
    absolutePath !== root &&
    !absolutePath.startsWith(`${root}${path.sep}`)
  ) {
    throw new Error(`Scoped artifact path escapes ${area} root: ${relativePath}`);
  }

  return absolutePath;
}

async function ensureDirectory(directoryPath: string): Promise<void> {
  await fs.mkdir(directoryPath, { recursive: true });
}

export function getStorageLayout(config: ForgeConfig): StorageLayout {
  return {
    storageRoot: config.paths.storageRoot,
    blobRoot: config.paths.blobRoot,
    evidenceRoot: config.paths.evidenceRoot,
    auditRoot: config.paths.auditRoot,
    logRoot: config.paths.logRoot,
    worktreeRoot: config.paths.worktreeRoot
  };
}

export function createRunStorageScope(
  config: ForgeConfig,
  waveRunId: string,
  taskRunId: string
): RunStorageScope {
  const safeWaveRunId = sanitizeSegment(waveRunId);
  const safeTaskRunId = sanitizeSegment(taskRunId);
  const runRoot = path.join(config.paths.storageRoot, "runs", safeWaveRunId, safeTaskRunId);

  return {
    waveRunId: safeWaveRunId,
    taskRunId: safeTaskRunId,
    runRoot,
    blobRoot: path.join(config.paths.blobRoot, safeWaveRunId, safeTaskRunId),
    evidenceRoot: path.join(config.paths.evidenceRoot, safeWaveRunId, safeTaskRunId),
    auditRoot: path.join(config.paths.auditRoot, safeWaveRunId, safeTaskRunId),
    logRoot: path.join(config.paths.logRoot, safeWaveRunId, safeTaskRunId)
  };
}

export async function ensureStorageLayout(
  config: ForgeConfig
): Promise<StorageLayout> {
  const layout = getStorageLayout(config);

  await Promise.all(
    Object.values(layout).map((directoryPath) => ensureDirectory(directoryPath))
  );

  return layout;
}

export async function ensureRunStorageScope(
  config: ForgeConfig,
  waveRunId: string,
  taskRunId: string
): Promise<RunStorageScope> {
  await ensureStorageLayout(config);
  const scope = createRunStorageScope(config, waveRunId, taskRunId);

  await Promise.all(
    [
      scope.runRoot,
      scope.blobRoot,
      scope.evidenceRoot,
      scope.auditRoot,
      scope.logRoot
    ].map((directoryPath) => ensureDirectory(directoryPath))
  );

  return scope;
}

export async function listStoredRunScopes(
  config: ForgeConfig
): Promise<RunStorageScope[]> {
  await ensureStorageLayout(config);

  const listDirectoryNames = async (directoryPath: string): Promise<string[]> => {
    try {
      return (await fs.readdir(directoryPath, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
    } catch {
      return [];
    }
  };

  const waveRunIds = await listDirectoryNames(config.paths.evidenceRoot);
  const scopes: RunStorageScope[] = [];

  for (const waveRunId of waveRunIds) {
    const taskRunIds = await listDirectoryNames(
      path.join(config.paths.evidenceRoot, waveRunId)
    );

    for (const taskRunId of taskRunIds) {
      scopes.push(createRunStorageScope(config, waveRunId, taskRunId));
    }
  }

  return scopes;
}

export class LocalFileStorage {
  constructor(readonly config: ForgeConfig) {}

  get layout(): StorageLayout {
    return getStorageLayout(this.config);
  }

  async ensureLayout(): Promise<StorageLayout> {
    return await ensureStorageLayout(this.config);
  }

  createRunScope(waveRunId: string, taskRunId: string): RunStorageScope {
    return createRunStorageScope(this.config, waveRunId, taskRunId);
  }

  async ensureRunScope(
    waveRunId: string,
    taskRunId: string
  ): Promise<RunStorageScope> {
    return await ensureRunStorageScope(this.config, waveRunId, taskRunId);
  }

  resolvePath(
    scope: RunStorageScope,
    area: StorageArea,
    relativePath: string
  ): string {
    return resolveScopedArtifactPath(scope, area, relativePath);
  }

  async writeText(input: {
    scope: RunStorageScope;
    area: StorageArea;
    relativePath: string;
    content: string;
  }): Promise<StoredArtifact> {
    const absolutePath = this.resolvePath(
      input.scope,
      input.area,
      input.relativePath
    );
    await ensureDirectory(path.dirname(absolutePath));
    await fs.writeFile(absolutePath, input.content, "utf8");

    return {
      area: input.area,
      storageRef: absolutePath,
      absolutePath,
      bytes: Buffer.byteLength(input.content),
      sha256: sha256(input.content)
    };
  }

  async writeJson(input: {
    scope: RunStorageScope;
    area: StorageArea;
    relativePath: string;
    value: unknown;
  }): Promise<StoredArtifact> {
    return await this.writeText({
      scope: input.scope,
      area: input.area,
      relativePath: input.relativePath,
      content: `${JSON.stringify(input.value, null, 2)}\n`
    });
  }

  async appendJsonLine(input: {
    scope: RunStorageScope;
    area: StorageArea;
    relativePath: string;
    value: unknown;
  }): Promise<string> {
    const absolutePath = this.resolvePath(
      input.scope,
      input.area,
      input.relativePath
    );
    await ensureDirectory(path.dirname(absolutePath));
    await fs.appendFile(absolutePath, `${JSON.stringify(input.value)}\n`, "utf8");
    return absolutePath;
  }

  async copyFile(input: {
    scope: RunStorageScope;
    area: StorageArea;
    relativePath: string;
    sourcePath: string;
  }): Promise<StoredArtifact> {
    const absolutePath = this.resolvePath(
      input.scope,
      input.area,
      input.relativePath
    );
    await ensureDirectory(path.dirname(absolutePath));
    await fs.copyFile(input.sourcePath, absolutePath);
    const content = await fs.readFile(absolutePath);

    return {
      area: input.area,
      storageRef: absolutePath,
      absolutePath,
      bytes: content.byteLength,
      sha256: sha256(content)
    };
  }

  async readJson<T>(absolutePath: string): Promise<T> {
    const rawValue = await fs.readFile(absolutePath, "utf8");
    return JSON.parse(rawValue) as T;
  }
}
