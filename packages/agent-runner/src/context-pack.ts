import fs from "node:fs/promises";
import path from "node:path";
import { resolveForgeManifestRef } from "@forge/config";
import {
  createContextPackManifest,
  type ContextPackSourceInput
} from "@forge/evidence";
import type {
  ForgeConfig,
  LoadedWavePacketPlan
} from "@forge/shared";
import type {
  AgentContextEntry,
  AgentContextSection,
  AgentTrustLabel,
  Wave0AgentContextPack
} from "./types.js";

function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

function absoluteFileSource(
  ref: string,
  absolutePath: string
): ContextPackSourceInput {
  return {
    ref,
    absolutePath: path.resolve(absolutePath)
  };
}

async function readEntry(
  trustLabel: AgentTrustLabel,
  source: ContextPackSourceInput
): Promise<AgentContextEntry> {
  const content = await fs.readFile(source.absolutePath, "utf8");

  return {
    ref: source.ref,
    absolutePath: source.absolutePath,
    trustLabel,
    content,
    bytes: Buffer.byteLength(content),
    estimatedTokens: estimateTokens(content)
  };
}

async function readSection(
  trustLabel: AgentTrustLabel,
  title: string,
  sources: readonly ContextPackSourceInput[]
): Promise<AgentContextSection> {
  return {
    trustLabel,
    title,
    entries: await Promise.all(sources.map((source) => readEntry(trustLabel, source)))
  };
}

export async function assembleWave0SyntheticContextPack(input: {
  config: ForgeConfig;
  packetPlan: LoadedWavePacketPlan;
  worktreePath: string;
}): Promise<Wave0AgentContextPack> {
  const systemSources = [
    absoluteFileSource(
      input.packetPlan.locations.packet.ref,
      input.packetPlan.locations.packet.absolutePath
    ),
    absoluteFileSource(
      input.packetPlan.locations.validator.ref,
      input.packetPlan.locations.validator.absolutePath
    ),
    absoluteFileSource(
      input.packetPlan.locations.evidence.ref,
      input.packetPlan.locations.evidence.absolutePath
    ),
    absoluteFileSource(
      input.packetPlan.locations.review.ref,
      input.packetPlan.locations.review.absolutePath
    ),
    absoluteFileSource(
      input.packetPlan.packetManifest.prompt_template_ref,
      resolveForgeManifestRef(
        input.config,
        input.packetPlan.packetManifest.prompt_template_ref
      )
    )
  ] as const;

  const harnessSources = [
    absoluteFileSource(
      `packets/context-profiles/${input.packetPlan.packetManifest.context_pack_profile}.yaml`,
      resolveForgeManifestRef(
        input.config,
        `packets/context-profiles/${input.packetPlan.packetManifest.context_pack_profile}.yaml`
      )
    ),
    absoluteFileSource(
      "benchmarks/fixtures/wave0-synthetic/scenario.md",
      resolveForgeManifestRef(
        input.config,
        "benchmarks/fixtures/wave0-synthetic/scenario.md"
      )
    ),
    absoluteFileSource(
      "benchmarks/fixtures/wave0-synthetic/expected-outcomes.md",
      resolveForgeManifestRef(
        input.config,
        "benchmarks/fixtures/wave0-synthetic/expected-outcomes.md"
      )
    ),
    absoluteFileSource(
      "generated-files/forge-phase3-implementation.md",
      resolveForgeManifestRef(input.config, "generated-files/forge-phase3-implementation.md")
    ),
    absoluteFileSource(
      "generated-files/forge-design-v1.3-security.md",
      resolveForgeManifestRef(input.config, "generated-files/forge-design-v1.3-security.md")
    )
  ] as const;

  const codeSources = [
    absoluteFileSource(
      "packages/shared/tsconfig.json",
      path.join(input.worktreePath, "packages/shared/tsconfig.json")
    )
  ] as const;

  const sections = await Promise.all([
    readSection("SYSTEM", "System Contract", systemSources),
    readSection("HARNESS", "Harness References", harnessSources),
    readSection("CODE", "Scoped Repo Context", codeSources)
  ]);

  const manifest = await createContextPackManifest({
    config: input.config,
    profile: input.packetPlan.packetManifest.context_pack_profile,
    manifestSources: [
      {
        location: input.packetPlan.locations.packet,
        manifest: input.packetPlan.packetManifest
      },
      {
        location: input.packetPlan.locations.validator,
        manifest: input.packetPlan.validatorManifest
      },
      {
        location: input.packetPlan.locations.evidence,
        manifest: input.packetPlan.evidenceManifest
      },
      {
        location: input.packetPlan.locations.review,
        manifest: input.packetPlan.reviewManifest
      }
    ],
    extraSources: [...systemSources.slice(4), ...harnessSources, ...codeSources]
  });

  return {
    packetId: input.packetPlan.packetManifest.packet_id,
    profile: input.packetPlan.packetManifest.context_pack_profile,
    promptTemplateRef: input.packetPlan.packetManifest.prompt_template_ref,
    sections,
    manifest
  };
}
