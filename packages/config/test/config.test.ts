import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadForgeConfig, resolveForgeManifestRef } from "../src/index.js";

test("loadForgeConfig resolves files-rooted manifest refs", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "forge-config-"));
  const envPath = path.join(tempRoot, ".env.test");

  await fs.writeFile(
    envPath,
    [
      "FORGE_DEFAULT_WAVE_ID=wave-0-live",
      "FORGE_DEFAULT_PACKET_ID=WAVE0-SYNTHETIC",
      "FORGE_DEFAULT_BENCHMARK_ID=wave0-live-smoke",
      "FORGE_FILES_ROOT=./files"
    ].join("\n")
  );

  const config = loadForgeConfig({
    rootDir: "/Users/marcoparedes/dev/forge",
    envFile: envPath
  });

  assert.equal(config.defaultBenchmarkId, "wave0-live-smoke");
  assert.equal(
    config.paths.filesRoot,
    "/Users/marcoparedes/dev/forge/files"
  );
  assert.equal(
    resolveForgeManifestRef(config, config.manifestRefs.wave),
    "/Users/marcoparedes/dev/forge/files/packets/waves/wave0-live.yaml"
  );

  await fs.rm(tempRoot, { recursive: true, force: true });
});
