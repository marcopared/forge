import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import {
  defineForgePackage,
  type ForgeConfig,
  type ForgeEnvironment
} from "@forge/shared";

export const configPackage = defineForgePackage({
  name: "@forge/config",
  purpose: "Loads and normalizes local-first Forge configuration for Wave 0.",
  dependsOn: ["@forge/shared"],
  status: "skeleton"
});

export interface LoadForgeConfigOptions {
  rootDir?: string;
  envFile?: string;
}

function loadEnvFile(rootDir: string, envFile = ".env"): void {
  const envPath = path.resolve(rootDir, envFile);

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

function getString(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : fallback;
}

function getNumber(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function resolveFromRoot(rootDir: string, targetPath: string): string {
  return path.isAbsolute(targetPath)
    ? targetPath
    : path.resolve(rootDir, targetPath);
}

export function loadForgeConfig(
  options: LoadForgeConfigOptions = {}
): ForgeConfig {
  const rootDir = path.resolve(options.rootDir ?? process.cwd());
  loadEnvFile(rootDir, options.envFile);

  const environment = getString(
    "FORGE_NODE_ENV",
    "development"
  ) as ForgeEnvironment;
  const postgresHost = getString("FORGE_POSTGRES_HOST", "127.0.0.1");
  const postgresPort = getNumber("FORGE_POSTGRES_PORT", 5432);
  const postgresDb = getString("FORGE_POSTGRES_DB", "forge");
  const postgresUser = getString("FORGE_POSTGRES_USER", "forge");
  const postgresPassword = getString("FORGE_POSTGRES_PASSWORD", "forge");
  const postgresSchema = getString("FORGE_DB_SCHEMA", "forge_local");
  const redisHost = getString("FORGE_REDIS_HOST", "127.0.0.1");
  const redisPort = getNumber("FORGE_REDIS_PORT", 6379);

  const databaseUrl = getString(
    "FORGE_DATABASE_URL",
    `postgresql://${postgresUser}:${postgresPassword}@${postgresHost}:${postgresPort}/${postgresDb}`
  );
  const redisUrl = getString(
    "FORGE_REDIS_URL",
    `redis://${redisHost}:${redisPort}`
  );

  return {
    environment,
    defaultWaveId: getString("FORGE_DEFAULT_WAVE_ID", "wave-0-live"),
    defaultPacketId: getString(
      "FORGE_DEFAULT_PACKET_ID",
      "WAVE0-SYNTHETIC"
    ),
    defaultBenchmarkId: getString(
      "FORGE_DEFAULT_BENCHMARK_ID",
      "wave0-live-smoke"
    ),
    phaseBranch: getString(
      "FORGE_PHASE_BRANCH",
      "forge/phase-0-wave0-synthetic"
    ),
    launchMode: "operator-launched",
    reviewMode: "human-required",
    concurrencyCap: getNumber("FORGE_WAVE_CONCURRENCY", 1),
    manifestRefs: {
      packetRegistry: getString(
        "FORGE_PACKET_REGISTRY_REF",
        "packets/validation/packet-registry.yaml"
      ),
      wave: getString("FORGE_WAVE_MANIFEST_REF", "packets/waves/wave0-live.yaml"),
      benchmark: getString(
        "FORGE_BENCHMARK_MANIFEST_REF",
        "benchmarks/manifests/wave0-live-smoke.yaml"
      )
    },
    postgres: {
      host: postgresHost,
      port: postgresPort,
      database: postgresDb,
      user: postgresUser,
      password: postgresPassword,
      schema: postgresSchema,
      url: databaseUrl
    },
    redis: {
      host: redisHost,
      port: redisPort,
      url: redisUrl
    },
    paths: {
      root: rootDir,
      filesRoot: resolveFromRoot(rootDir, getString("FORGE_FILES_ROOT", "./files")),
      storageRoot: resolveFromRoot(
        rootDir,
        getString("FORGE_STORAGE_ROOT", "./var")
      ),
      blobRoot: resolveFromRoot(rootDir, getString("FORGE_BLOB_ROOT", "./var/blob")),
      evidenceRoot: resolveFromRoot(
        rootDir,
        getString("FORGE_EVIDENCE_ROOT", "./var/evidence")
      ),
      auditRoot: resolveFromRoot(
        rootDir,
        getString("FORGE_AUDIT_ROOT", "./var/audit")
      ),
      logRoot: resolveFromRoot(rootDir, getString("FORGE_LOG_ROOT", "./var/logs")),
      worktreeRoot: resolveFromRoot(
        rootDir,
        getString("FORGE_WORKTREE_ROOT", "./var/worktrees")
      )
    }
  };
}

export function resolveForgeFilePath(
  config: ForgeConfig,
  relativePath: string
): string {
  return resolveFromRoot(config.paths.filesRoot, relativePath);
}

export function resolveForgeManifestRef(
  config: ForgeConfig,
  manifestRef: string
): string {
  const trimmedRef = manifestRef.replace(/^\/+/, "");
  return resolveFromRoot(config.paths.filesRoot, trimmedRef);
}
