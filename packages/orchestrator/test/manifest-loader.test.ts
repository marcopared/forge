import assert from "node:assert/strict";
import test from "node:test";
import { loadForgeConfig } from "@forge/config";
import {
  ManifestValidationError,
  loadWaveExecutionPlan,
  validatePacketManifest,
  validatePacketRegistryManifest
} from "../src/index.js";

const repoRoot = "/Users/marcoparedes/dev/forge";

test("loadWaveExecutionPlan loads the Wave 0 live synthetic plan", async () => {
  const config = loadForgeConfig({ rootDir: repoRoot });
  const plan = await loadWaveExecutionPlan(config);

  assert.equal(plan.waveManifest.wave_id, "wave-0-live");
  assert.equal(plan.benchmarkManifest.benchmark_id, "wave0-live-smoke");
  assert.equal(plan.packets.length, 1);

  const [packetPlan] = plan.packets;

  assert.equal(packetPlan.packetManifest.packet_id, "WAVE0-SYNTHETIC");
  assert.equal(packetPlan.registryEntry.manifest_ref, "packets/manifests/WAVE0-SYNTHETIC.yaml");
  assert.equal(packetPlan.validatorManifest.manifest_name, "foundation");
  assert.equal(packetPlan.evidenceManifest.manifest_name, "standard");
  assert.equal(packetPlan.reviewManifest.manifest_name, "human-required");
  assert.equal(packetPlan.locations.packet.ref, plan.benchmarkManifest.packet_ref);
});

test("validatePacketManifest rejects target paths outside scope", () => {
  assert.throws(
    () =>
      validatePacketManifest({
        packet_id: "WAVE0-SYNTHETIC",
        title: "Synthetic hello-world smoke packet",
        version: 1,
        milestone: "M0-synthetic",
        workstream: "WS-0-synthetic",
        packet_class: "foundation",
        risk_class: "low",
        activation_class: "operator-launched",
        dependency_class_profile: "none",
        prerequisite_packets: [],
        prerequisite_artifacts: [],
        speculative_start_allowed: false,
        scope: ["packages/shared/src/synthetic/"],
        out_of_scope: ["apps/"],
        protected_paths: ["package.json"],
        target_paths: ["packages/orchestrator/src/index.ts"],
        required_inputs: ["files/packets/schema.md"],
        expected_outputs: ["hello.ts"],
        required_docs_updates: [],
        validator_manifest_ref: "packets/validator-manifests/foundation.yaml",
        evidence_manifest_ref: "packets/evidence-manifests/standard.yaml",
        review_manifest_ref: "packets/review-manifests/human-required.yaml",
        prompt_template_ref: "packets/templates/implementer-foundation.yaml",
        context_pack_profile: "foundation-contracts",
        benchmark_tags: ["wave0-live-smoke"],
        policy_sensitivities: [],
        escalation_conditions: ["deny"],
        completion_contract: ["pass"],
        graph_repair_hooks: ["freeze"],
        operator_notes: "synthetic only"
      }),
    (error: unknown) => {
      if (!(error instanceof ManifestValidationError)) {
        return false;
      }

      return error.issues.some((issue) => issue.path === "packet.target_paths[0]");
    }
  );
});

test("validatePacketRegistryManifest rejects duplicate packet ids", () => {
  assert.throws(
    () =>
      validatePacketRegistryManifest({
        spec_kind: "packet-registry",
        spec_name: "instantiated-packets",
        version: 2,
        status: "ready",
        summary: "registry",
        identity_rules: {
          registry_is_authoritative: true,
          duplicate_packet_ids_illegal: true,
          graph_repair_reuses_packet_id_with_version_increment: true,
          structurally_distinct_repair_requires_new_packet_id: true,
          reconciliation_source: "registry_not_filesystem_scan"
        },
        membership_model: {
          single_wave_field: "wave_id",
          multi_wave_field: "wave_memberships",
          rules: ["Each instantiated packet must declare wave membership in the registry."]
        },
        status_model: {
          allowed_statuses: ["instantiated"]
        },
        packets: [
          {
            packet_id: "WAVE0-SYNTHETIC",
            manifest_ref: "packets/manifests/WAVE0-SYNTHETIC.yaml",
            wave_id: "wave-0-live",
            milestone: "M0-synthetic",
            packet_class: "foundation",
            status: "instantiated",
            notes: "first"
          },
          {
            packet_id: "WAVE0-SYNTHETIC",
            manifest_ref: "packets/manifests/WAVE0-SYNTHETIC.yaml",
            wave_id: "wave-0-live",
            milestone: "M0-synthetic",
            packet_class: "foundation",
            status: "instantiated",
            notes: "duplicate"
          }
        ]
      }),
    (error: unknown) => {
      if (!(error instanceof ManifestValidationError)) {
        return false;
      }

      return error.issues.some((issue) =>
        issue.message.includes("Duplicate packet_id")
      );
    }
  );
});
