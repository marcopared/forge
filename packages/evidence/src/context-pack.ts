import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import type { ForgeConfig } from "@forge/shared";
import type {
  ContextPackEntry,
  ContextPackManifestRecord,
  ContextPackSourceInput,
  ManifestVersionRecord,
  ManifestVersionSource
} from "./types.js";

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

function inferTrustLabel(ref: string): string {
  if (ref.startsWith("packets/waves/")) {
    return "wave-contract";
  }

  if (ref.startsWith("packets/manifests/")) {
    return "packet-contract";
  }

  if (ref.startsWith("packets/validator-manifests/")) {
    return "validator-contract";
  }

  if (ref.startsWith("packets/evidence-manifests/")) {
    return "evidence-contract";
  }

  if (ref.startsWith("packets/review-manifests/")) {
    return "review-contract";
  }

  if (ref.startsWith("benchmarks/")) {
    return "benchmark-watchlist";
  }

  return "supporting-context";
}

export async function createManifestVersionRecord(
  source: ManifestVersionSource
): Promise<ManifestVersionRecord> {
  const content = await fs.readFile(source.location.absolutePath);
  const manifest = (source.manifest ?? {}) as {
    manifest_name?: string;
    manifest_kind?: string;
    version?: string | number;
  };

  return {
    ref: source.location.ref,
    absolutePath: source.location.absolutePath,
    sha256: sha256(content),
    bytes: content.byteLength,
    manifestName:
      typeof manifest.manifest_name === "string"
        ? manifest.manifest_name
        : undefined,
    manifestKind:
      typeof manifest.manifest_kind === "string"
        ? manifest.manifest_kind
        : undefined,
    version:
      typeof manifest.version === "number" || typeof manifest.version === "string"
        ? manifest.version
        : undefined
  };
}

export async function createManifestVersionRecords(
  sources: readonly ManifestVersionSource[]
): Promise<ManifestVersionRecord[]> {
  return await Promise.all(sources.map((source) => createManifestVersionRecord(source)));
}

async function createContextPackEntry(
  input: ContextPackSourceInput
): Promise<ContextPackEntry> {
  const content = await fs.readFile(input.absolutePath, "utf8");

  return {
    ref: input.ref,
    absolutePath: input.absolutePath,
    trustLabel: inferTrustLabel(input.ref),
    bytes: Buffer.byteLength(content),
    sha256: sha256(content),
    estimatedTokens: estimateTokens(content)
  };
}

export async function createContextPackManifest(input: {
  config: ForgeConfig;
  profile: string;
  manifestSources: readonly ManifestVersionSource[];
  extraRefs?: readonly string[];
  extraSources?: readonly ContextPackSourceInput[];
}): Promise<ContextPackManifestRecord> {
  const sourceEntries = await Promise.all(
    input.manifestSources.map((source) =>
      createContextPackEntry({
        ref: source.location.ref,
        absolutePath: source.location.absolutePath
      })
    )
  );

  const extraEntries = await Promise.all(
    (input.extraRefs ?? []).map((relativeRef) =>
      createContextPackEntry({
        ref: relativeRef,
        absolutePath: `${input.config.paths.filesRoot}/${relativeRef}`.replace(/\/+/gu, "/")
      })
    )
  );

  const extraSourceEntries = await Promise.all(
    (input.extraSources ?? []).map((source) => createContextPackEntry(source))
  );

  const includedFiles = [...sourceEntries, ...extraEntries, ...extraSourceEntries];

  return {
    profile: input.profile,
    includedFiles,
    includedFileCount: includedFiles.length,
    estimatedTokenCount: includedFiles.reduce(
      (sum, entry) => sum + entry.estimatedTokens,
      0
    ),
    trustLabels: Array.from(
      new Set(includedFiles.map((entry) => entry.trustLabel))
    ).sort()
  };
}
