import fs from "node:fs/promises";
import path from "node:path";
import {
  resolveForgeFilePath,
  resolveForgeManifestRef
} from "@forge/config";
import {
  type BenchmarkManifest,
  type EvidenceManifest,
  type ForgeConfig,
  type LoadedWavePacketPlan,
  type ManifestLocation,
  type PacketManifest,
  type PacketRegistryManifest,
  type PacketSchemaSpec,
  type ReviewManifest,
  type ValidatorManifest,
  type WaveExecutionPlan,
  type WaveManifest
} from "@forge/shared";
import { loadYamlDocument } from "./yaml.js";
import {
  requirePacketRegistryEntry,
  validateBenchmarkManifest,
  validateEvidenceManifest,
  validatePacketManifest,
  validatePacketRegistryManifest,
  validatePacketSchemaSpec,
  validateReviewManifest,
  validateValidatorManifest,
  validateWaveManifest
} from "./validation.js";

export const orchestratorPackage = {
  name: "@forge/orchestrator",
  purpose: "Owns Wave 0 scheduling state and merge-back flow boundaries.",
  dependsOn: ["@forge/shared"],
  status: "skeleton"
} as const;

export interface WaveExecutionSkeleton {
  waveId: string;
  packetId: string;
  phaseBranch: string;
  launchMode: "operator-launched";
  reviewMode: "human-required";
  concurrencyCap: number;
}

export function createWaveExecutionSkeleton(
  config: ForgeConfig
): WaveExecutionSkeleton {
  return {
    waveId: config.defaultWaveId,
    packetId: config.defaultPacketId,
    phaseBranch: config.phaseBranch,
    launchMode: config.launchMode,
    reviewMode: config.reviewMode,
    concurrencyCap: config.concurrencyCap
  };
}

async function ensureManifestExists(absolutePath: string): Promise<void> {
  await fs.access(absolutePath);
}

function assertManifestPathWithinFilesRoot(
  config: ForgeConfig,
  absolutePath: string
): void {
  const normalizedFilesRoot = path.resolve(config.paths.filesRoot);
  const normalizedManifestPath = path.resolve(absolutePath);

  if (
    normalizedManifestPath !== normalizedFilesRoot &&
    !normalizedManifestPath.startsWith(`${normalizedFilesRoot}${path.sep}`)
  ) {
    throw new Error(`Ref resolved outside files root: ${absolutePath}`);
  }
}

export function createManifestLocation(
  config: ForgeConfig,
  manifestRef: string
): ManifestLocation {
  const absolutePath = resolveForgeManifestRef(config, manifestRef);
  assertManifestPathWithinFilesRoot(config, absolutePath);
  return { ref: manifestRef, absolutePath };
}

async function loadManifest<T>(
  location: ManifestLocation,
  validate: (value: unknown) => T
): Promise<T> {
  await ensureManifestExists(location.absolutePath);
  const rawValue = await loadYamlDocument(location.absolutePath);
  return validate(rawValue);
}

export async function loadPacketSchemaSpec(
  config: ForgeConfig
): Promise<{ manifest: PacketSchemaSpec; location: ManifestLocation }> {
  const location = {
    ref: "packets/validation/schema-spec.yaml",
    absolutePath: resolveForgeFilePath(config, "packets/validation/schema-spec.yaml")
  };
  const manifest = await loadManifest(location, validatePacketSchemaSpec);
  return { manifest, location };
}

export async function loadPacketRegistry(
  config: ForgeConfig
): Promise<{ manifest: PacketRegistryManifest; location: ManifestLocation }> {
  const location = createManifestLocation(config, config.manifestRefs.packetRegistry);
  const manifest = await loadManifest(location, validatePacketRegistryManifest);
  return { manifest, location };
}

export async function loadWaveManifest(
  config: ForgeConfig
): Promise<{ manifest: WaveManifest; location: ManifestLocation }> {
  const location = createManifestLocation(config, config.manifestRefs.wave);
  const manifest = await loadManifest(location, validateWaveManifest);
  return { manifest, location };
}

export async function loadBenchmarkManifest(
  config: ForgeConfig
): Promise<{ manifest: BenchmarkManifest; location: ManifestLocation }> {
  const location = createManifestLocation(config, config.manifestRefs.benchmark);
  const manifest = await loadManifest(location, validateBenchmarkManifest);
  return { manifest, location };
}

export async function loadPacketManifestByRef(
  config: ForgeConfig,
  manifestRef: string
): Promise<{ manifest: PacketManifest; location: ManifestLocation }> {
  const location = createManifestLocation(config, manifestRef);
  const manifest = await loadManifest(location, validatePacketManifest);
  return { manifest, location };
}

export async function loadValidatorManifestByRef(
  config: ForgeConfig,
  manifestRef: string
): Promise<{ manifest: ValidatorManifest; location: ManifestLocation }> {
  const location = createManifestLocation(config, manifestRef);
  const manifest = await loadManifest(location, validateValidatorManifest);
  return { manifest, location };
}

export async function loadEvidenceManifestByRef(
  config: ForgeConfig,
  manifestRef: string
): Promise<{ manifest: EvidenceManifest; location: ManifestLocation }> {
  const location = createManifestLocation(config, manifestRef);
  const manifest = await loadManifest(location, validateEvidenceManifest);
  return { manifest, location };
}

export async function loadReviewManifestByRef(
  config: ForgeConfig,
  manifestRef: string
): Promise<{ manifest: ReviewManifest; location: ManifestLocation }> {
  const location = createManifestLocation(config, manifestRef);
  const manifest = await loadManifest(location, validateReviewManifest);
  return { manifest, location };
}

export async function loadWavePacketPlan(
  config: ForgeConfig,
  registry: PacketRegistryManifest,
  waveManifest: WaveManifest,
  packetId: string
): Promise<LoadedWavePacketPlan> {
  const registryEntry = requirePacketRegistryEntry(registry, packetId, waveManifest.wave_id);
  const packet = await loadPacketManifestByRef(config, registryEntry.manifest_ref);
  const validator = await loadValidatorManifestByRef(
    config,
    packet.manifest.validator_manifest_ref
  );
  const evidence = await loadEvidenceManifestByRef(
    config,
    packet.manifest.evidence_manifest_ref
  );
  const review = await loadReviewManifestByRef(config, packet.manifest.review_manifest_ref);

  return {
    registryEntry,
    packetManifest: packet.manifest,
    validatorManifest: validator.manifest,
    evidenceManifest: evidence.manifest,
    reviewManifest: review.manifest,
    locations: {
      packet: packet.location,
      validator: validator.location,
      evidence: evidence.location,
      review: review.location
    }
  };
}

export async function loadWaveExecutionPlan(
  config: ForgeConfig
): Promise<WaveExecutionPlan> {
  const [{ manifest: schemaSpec, location: schemaLocation }, { manifest: registry, location: registryLocation }, { manifest: waveManifest, location: waveLocation }, { manifest: benchmarkManifest, location: benchmarkLocation }] =
    await Promise.all([
      loadPacketSchemaSpec(config),
      loadPacketRegistry(config),
      loadWaveManifest(config),
      loadBenchmarkManifest(config)
    ]);

  if (waveManifest.wave_id !== config.defaultWaveId) {
    throw new Error(
      `Wave manifest ${waveManifest.wave_id} does not match configured wave ${config.defaultWaveId}.`
    );
  }

  if (benchmarkManifest.benchmark_id !== config.defaultBenchmarkId) {
    throw new Error(
      `Benchmark manifest ${benchmarkManifest.benchmark_id} does not match configured benchmark ${config.defaultBenchmarkId}.`
    );
  }

  if (benchmarkManifest.wave_ref !== waveLocation.ref) {
    throw new Error(
      `Benchmark wave_ref ${benchmarkManifest.wave_ref} does not match loaded wave ref ${waveLocation.ref}.`
    );
  }

  const packets = await Promise.all(
    waveManifest.packets.map((packetId: string) =>
      loadWavePacketPlan(config, registry, waveManifest, packetId)
    )
  );

  const packetById = new Map<string, LoadedWavePacketPlan>(
    packets.map((packetPlan: LoadedWavePacketPlan) => [
      packetPlan.packetManifest.packet_id,
      packetPlan
    ])
  );
  const benchmarkPacketRef = benchmarkManifest.packet_ref;

  const benchmarkPacketMatch = packets.some(
    (packetPlan: LoadedWavePacketPlan) =>
      packetPlan.locations.packet.ref === benchmarkPacketRef
  );

  if (!benchmarkPacketMatch) {
    throw new Error(
      `Benchmark packet_ref ${benchmarkPacketRef} does not correspond to a loaded wave packet manifest.`
    );
  }

  if (!packetById.has(config.defaultPacketId)) {
    throw new Error(
      `Configured default packet ${config.defaultPacketId} is not present in the loaded wave plan.`
    );
  }

  return {
    schemaSpec,
    packetRegistry: registry,
    waveManifest,
    benchmarkManifest,
    packets,
    locations: {
      schema: schemaLocation,
      registry: registryLocation,
      wave: waveLocation,
      benchmark: benchmarkLocation
    }
  };
}
