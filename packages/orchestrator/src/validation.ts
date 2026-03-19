import {
  type BenchmarkFailureInterpretation,
  type BenchmarkManifest,
  type BenchmarkOutcome,
  type EvidenceManifest,
  type EvidenceRequirement,
  type ManifestStructuralIssue,
  type PacketManifest,
  type PacketPrerequisiteArtifact,
  type PacketRegistryEntry,
  type PacketRegistryManifest,
  type PacketSchemaCategory,
  type PacketSchemaFieldRule,
  type PacketSchemaSpec,
  type ReviewDecisionRecordRequirement,
  type ReviewManifest,
  type ToolValidatorRule,
  type ValidatorManifest,
  type ValidatorRule,
  type WaveBenchmarkGates,
  type WaveExecutionPolicy,
  type WaveLaunchGates,
  type WaveManifest,
  type WaveReviewPolicy
} from "@forge/shared";

type UnknownRecord = Record<string, unknown>;

export class ManifestValidationError extends Error {
  readonly issues: readonly ManifestStructuralIssue[];

  constructor(message: string, issues: readonly ManifestStructuralIssue[]) {
    super(message);
    this.name = "ManifestValidationError";
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pushTypeIssue(
  issues: ManifestStructuralIssue[],
  path: string,
  expected: string
): void {
  issues.push({ path, message: `Expected ${expected}.` });
}

function readRecord(
  value: unknown,
  path: string,
  issues: ManifestStructuralIssue[]
): UnknownRecord | undefined {
  if (!isRecord(value)) {
    pushTypeIssue(issues, path, "an object");
    return undefined;
  }

  return value;
}

function readString(
  record: UnknownRecord,
  key: string,
  path: string,
  issues: ManifestStructuralIssue[]
): string {
  const value = record[key];

  if (typeof value !== "string") {
    pushTypeIssue(issues, `${path}.${key}`, "a string");
    return "";
  }

  if (value.trim().length === 0) {
    issues.push({ path: `${path}.${key}`, message: "String must be non-empty." });
  }

  if (/\btbd\b/i.test(value)) {
    issues.push({
      path: `${path}.${key}`,
      message: "Required string must not contain placeholder text like TBD."
    });
  }

  return value;
}

function readBoolean(
  record: UnknownRecord,
  key: string,
  path: string,
  issues: ManifestStructuralIssue[]
): boolean {
  const value = record[key];

  if (typeof value !== "boolean") {
    pushTypeIssue(issues, `${path}.${key}`, "a boolean");
    return false;
  }

  return value;
}

function readInteger(
  record: UnknownRecord,
  key: string,
  path: string,
  issues: ManifestStructuralIssue[]
): number {
  const value = record[key];

  if (!Number.isInteger(value)) {
    pushTypeIssue(issues, `${path}.${key}`, "an integer");
    return 0;
  }

  return value as number;
}

function readStringArray(
  record: UnknownRecord,
  key: string,
  path: string,
  issues: ManifestStructuralIssue[]
): string[] {
  const value = record[key];

  if (!Array.isArray(value)) {
    pushTypeIssue(issues, `${path}.${key}`, "a string array");
    return [];
  }

  const strings = value.filter((entry) => typeof entry === "string");

  if (strings.length !== value.length) {
    pushTypeIssue(issues, `${path}.${key}`, "only string entries");
  }

  strings.forEach((entry, index) => {
    if (entry.trim().length === 0) {
      issues.push({
        path: `${path}.${key}[${index}]`,
        message: "String entries must be non-empty."
      });
    }
  });

  return strings;
}

function readObjectArray(
  record: UnknownRecord,
  key: string,
  path: string,
  issues: ManifestStructuralIssue[]
): UnknownRecord[] {
  const value = record[key];

  if (!Array.isArray(value)) {
    pushTypeIssue(issues, `${path}.${key}`, "an object array");
    return [];
  }

  const objects = value.filter((entry) => isRecord(entry));

  if (objects.length !== value.length) {
    pushTypeIssue(issues, `${path}.${key}`, "only object entries");
  }

  return objects;
}

function readBooleanRecord(
  record: UnknownRecord,
  key: string,
  path: string,
  issues: ManifestStructuralIssue[]
): Record<string, boolean> {
  const value = readRecord(record[key], `${path}.${key}`, issues);

  if (!value) {
    return {};
  }

  const result: Record<string, boolean> = {};

  for (const [entryKey, entryValue] of Object.entries(value)) {
    if (typeof entryValue !== "boolean") {
      pushTypeIssue(issues, `${path}.${key}.${entryKey}`, "a boolean");
      continue;
    }

    result[entryKey] = entryValue;
  }

  return result;
}

function readStringRecord(
  record: UnknownRecord,
  key: string,
  path: string,
  issues: ManifestStructuralIssue[]
): Record<string, string> {
  const value = readRecord(record[key], `${path}.${key}`, issues);

  if (!value) {
    return {};
  }

  const result: Record<string, string> = {};

  for (const [entryKey, entryValue] of Object.entries(value)) {
    if (typeof entryValue !== "string" || entryValue.trim().length === 0) {
      pushTypeIssue(issues, `${path}.${key}.${entryKey}`, "a non-empty string");
      continue;
    }

    result[entryKey] = entryValue;
  }

  return result;
}

function finalizeValidation<T>(
  manifestType: string,
  issues: ManifestStructuralIssue[],
  value: T
): T {
  if (issues.length > 0) {
    throw new ManifestValidationError(
      `${manifestType} validation failed with ${issues.length} issue(s).`,
      issues
    );
  }

  return value;
}

function looksLikePath(value: string): boolean {
  return value.includes("/") || value.startsWith(".");
}

function pathContains(parentPath: string, childPath: string): boolean {
  if (parentPath === childPath) {
    return true;
  }

  if (!looksLikePath(parentPath) || !looksLikePath(childPath)) {
    return false;
  }

  return childPath.startsWith(parentPath);
}

export function validatePacketSchemaSpec(value: unknown): PacketSchemaSpec {
  const issues: ManifestStructuralIssue[] = [];
  const record = readRecord(value, "schema", issues);

  if (!record) {
    throw new ManifestValidationError("Packet schema spec is not an object.", issues);
  }

  const fieldCategoriesValue = readRecord(
    record.field_categories,
    "schema.field_categories",
    issues
  );

  const fieldCategories: Record<string, PacketSchemaCategory> = {};

  if (fieldCategoriesValue) {
    for (const [categoryName, categoryValue] of Object.entries(fieldCategoriesValue)) {
      const categoryRecord = readRecord(
        categoryValue,
        `schema.field_categories.${categoryName}`,
        issues
      );

      if (!categoryRecord) {
        continue;
      }

      const requiredRecord = readRecord(
        categoryRecord.required,
        `schema.field_categories.${categoryName}.required`,
        issues
      );

      if (!requiredRecord) {
        continue;
      }

      const required: Record<string, string | PacketSchemaFieldRule> = {};

      for (const [fieldName, fieldValue] of Object.entries(requiredRecord)) {
        if (typeof fieldValue === "string") {
          required[fieldName] = fieldValue;
          continue;
        }

        const ruleRecord = readRecord(
          fieldValue,
          `schema.field_categories.${categoryName}.required.${fieldName}`,
          issues
        );

        if (!ruleRecord) {
          continue;
        }

        const rule: PacketSchemaFieldRule = {};

        if ("type" in ruleRecord && typeof ruleRecord.type === "string") {
          rule.type = ruleRecord.type;
        }

        if ("values" in ruleRecord) {
          const values = Array.isArray(ruleRecord.values)
            ? ruleRecord.values.filter((entry) => typeof entry === "string")
            : [];

          if (
            !Array.isArray(ruleRecord.values) ||
            values.length !== ruleRecord.values.length
          ) {
            pushTypeIssue(
              issues,
              `schema.field_categories.${categoryName}.required.${fieldName}.values`,
              "a string array"
            );
          }

          rule.values = values;
        }

        required[fieldName] = rule;
      }

      fieldCategories[categoryName] = { required };
    }
  }

  const constraintsRecord = readRecord(
    record.field_constraints,
    "schema.field_constraints",
    issues
  );
  const classRulesValue = readRecord(record.class_rules, "schema.class_rules", issues);
  const classRules: Record<string, Record<string, string | boolean>> = {};

  if (classRulesValue) {
    for (const [className, ruleValue] of Object.entries(classRulesValue)) {
      const ruleRecord = readRecord(
        ruleValue,
        `schema.class_rules.${className}`,
        issues
      );

      if (!ruleRecord) {
        continue;
      }

      const normalized: Record<string, string | boolean> = {};

      for (const [ruleName, ruleEntry] of Object.entries(ruleRecord)) {
        if (typeof ruleEntry === "string" || typeof ruleEntry === "boolean") {
          normalized[ruleName] = ruleEntry;
        } else {
          pushTypeIssue(
            issues,
            `schema.class_rules.${className}.${ruleName}`,
            "a string or boolean"
          );
        }
      }

      classRules[className] = normalized;
    }
  }

  return finalizeValidation("Packet schema spec", issues, {
    spec_kind: readString(record, "spec_kind", "schema", issues) as "packet-schema",
    spec_name: readString(record, "spec_name", "schema", issues),
    version: readInteger(record, "version", "schema", issues),
    status: readString(record, "status", "schema", issues),
    summary: readString(record, "summary", "schema", issues),
    packet_identity_rules: {
      registry_is_authoritative: readBoolean(
        readRecord(
          record.packet_identity_rules,
          "schema.packet_identity_rules",
          issues
        ) ?? {},
        "registry_is_authoritative",
        "schema.packet_identity_rules",
        issues
      ),
      duplicate_packet_ids_illegal: readBoolean(
        readRecord(
          record.packet_identity_rules,
          "schema.packet_identity_rules",
          issues
        ) ?? {},
        "duplicate_packet_ids_illegal",
        "schema.packet_identity_rules",
        issues
      ),
      version_increment_required_on_graph_repair: readBoolean(
        readRecord(
          record.packet_identity_rules,
          "schema.packet_identity_rules",
          issues
        ) ?? {},
        "version_increment_required_on_graph_repair",
        "schema.packet_identity_rules",
        issues
      ),
      structurally_different_repairs_require_new_packet_id: readBoolean(
        readRecord(
          record.packet_identity_rules,
          "schema.packet_identity_rules",
          issues
        ) ?? {},
        "structurally_different_repairs_require_new_packet_id",
        "schema.packet_identity_rules",
        issues
      )
    },
    field_categories: fieldCategories,
    field_constraints: constraintsRecord
      ? {
          packet_id_pattern: readString(
            constraintsRecord,
            "packet_id_pattern",
            "schema.field_constraints",
            issues
          ),
          title_min_length: readInteger(
            constraintsRecord,
            "title_min_length",
            "schema.field_constraints",
            issues
          ),
          version_minimum: readInteger(
            constraintsRecord,
            "version_minimum",
            "schema.field_constraints",
            issues
          ),
          prerequisite_artifact_fields: readStringArray(
            constraintsRecord,
            "prerequisite_artifact_fields",
            "schema.field_constraints",
            issues
          ),
          non_empty_required_strings: readBoolean(
            constraintsRecord,
            "non_empty_required_strings",
            "schema.field_constraints",
            issues
          ),
          no_tbd_placeholders_in_required_fields: readBoolean(
            constraintsRecord,
            "no_tbd_placeholders_in_required_fields",
            "schema.field_constraints",
            issues
          )
        }
      : {
          packet_id_pattern: "",
          title_min_length: 0,
          version_minimum: 0,
          prerequisite_artifact_fields: [],
          non_empty_required_strings: false,
          no_tbd_placeholders_in_required_fields: false
        },
    class_rules: classRules
  });
}

export function validatePacketManifest(value: unknown): PacketManifest {
  const issues: ManifestStructuralIssue[] = [];
  const record = readRecord(value, "packet", issues);

  if (!record) {
    throw new ManifestValidationError("Packet manifest is not an object.", issues);
  }

  const prerequisiteArtifacts = readObjectArray(
    record,
    "prerequisite_artifacts",
    "packet",
    issues
  ).map((artifactValue, index) => {
    const artifactRecord = readRecord(
      artifactValue,
      `packet.prerequisite_artifacts[${index}]`,
      issues
    );

    if (!artifactRecord) {
      return { path: "", description: "" };
    }

    return {
      path: readString(
        artifactRecord,
        "path",
        `packet.prerequisite_artifacts[${index}]`,
        issues
      ),
      description: readString(
        artifactRecord,
        "description",
        `packet.prerequisite_artifacts[${index}]`,
        issues
      )
    } satisfies PacketPrerequisiteArtifact;
  });

  const packet = {
    packet_id: readString(record, "packet_id", "packet", issues),
    title: readString(record, "title", "packet", issues),
    version: readInteger(record, "version", "packet", issues),
    milestone: readString(record, "milestone", "packet", issues),
    workstream: readString(record, "workstream", "packet", issues),
    packet_class: readString(record, "packet_class", "packet", issues),
    risk_class: readString(record, "risk_class", "packet", issues),
    activation_class: readString(record, "activation_class", "packet", issues),
    dependency_class_profile: readString(
      record,
      "dependency_class_profile",
      "packet",
      issues
    ),
    prerequisite_packets: readStringArray(
      record,
      "prerequisite_packets",
      "packet",
      issues
    ),
    prerequisite_artifacts: prerequisiteArtifacts,
    speculative_start_allowed: readBoolean(
      record,
      "speculative_start_allowed",
      "packet",
      issues
    ),
    scope: readStringArray(record, "scope", "packet", issues),
    out_of_scope: readStringArray(record, "out_of_scope", "packet", issues),
    protected_paths: readStringArray(record, "protected_paths", "packet", issues),
    target_paths: readStringArray(record, "target_paths", "packet", issues),
    required_inputs: readStringArray(record, "required_inputs", "packet", issues),
    expected_outputs: readStringArray(record, "expected_outputs", "packet", issues),
    required_docs_updates: readStringArray(
      record,
      "required_docs_updates",
      "packet",
      issues
    ),
    validator_manifest_ref: readString(
      record,
      "validator_manifest_ref",
      "packet",
      issues
    ),
    evidence_manifest_ref: readString(
      record,
      "evidence_manifest_ref",
      "packet",
      issues
    ),
    review_manifest_ref: readString(
      record,
      "review_manifest_ref",
      "packet",
      issues
    ),
    prompt_template_ref: readString(record, "prompt_template_ref", "packet", issues),
    context_pack_profile: readString(
      record,
      "context_pack_profile",
      "packet",
      issues
    ),
    benchmark_tags: readStringArray(record, "benchmark_tags", "packet", issues),
    policy_sensitivities: readStringArray(
      record,
      "policy_sensitivities",
      "packet",
      issues
    ),
    escalation_conditions: readStringArray(
      record,
      "escalation_conditions",
      "packet",
      issues
    ),
    completion_contract: readStringArray(
      record,
      "completion_contract",
      "packet",
      issues
    ),
    graph_repair_hooks: readStringArray(
      record,
      "graph_repair_hooks",
      "packet",
      issues
    ),
    operator_notes: readString(record, "operator_notes", "packet", issues)
  } as PacketManifest;

  if (!/^[A-Z0-9-]+$/.test(packet.packet_id)) {
    issues.push({
      path: "packet.packet_id",
      message: "Packet ID must match ^[A-Z0-9-]+$."
    });
  }

  if (packet.title.trim().length < 3) {
    issues.push({
      path: "packet.title",
      message: "Packet title must be at least 3 characters long."
    });
  }

  if (packet.version < 1) {
    issues.push({
      path: "packet.version",
      message: "Packet version must be at least 1."
    });
  }

  const allowedPacketClasses = new Set([
    "foundation",
    "interface",
    "implementation",
    "integration",
    "validation",
    "documentation",
    "policy-sensitive",
    "graph-repair"
  ]);

  if (!allowedPacketClasses.has(packet.packet_class)) {
    issues.push({
      path: "packet.packet_class",
      message: `Unsupported packet class: ${packet.packet_class}.`
    });
  }

  if (!["low", "medium", "high"].includes(packet.risk_class)) {
    issues.push({
      path: "packet.risk_class",
      message: `Unsupported risk class: ${packet.risk_class}.`
    });
  }

  if (!["operator-launched", "auto", "gated-auto"].includes(packet.activation_class)) {
    issues.push({
      path: "packet.activation_class",
      message: `Unsupported activation class: ${packet.activation_class}.`
    });
  }

  if (packet.packet_class === "foundation" && packet.speculative_start_allowed) {
    issues.push({
      path: "packet.speculative_start_allowed",
      message: "Foundation packets must set speculative_start_allowed to false."
    });
  }

  packet.target_paths.forEach((targetPath: string, index: number) => {
    const withinScope = packet.scope.some((scopePath: string) =>
      pathContains(scopePath, targetPath)
    );

    if (!withinScope) {
      issues.push({
        path: `packet.target_paths[${index}]`,
        message: "Target path must remain within declared scope."
      });
    }
  });

  for (const scopePath of packet.scope) {
    for (const excludedPath of packet.out_of_scope) {
      if (pathContains(scopePath, excludedPath) || pathContains(excludedPath, scopePath)) {
        issues.push({
          path: "packet.scope",
          message: `Scope and out_of_scope overlap: ${scopePath} vs ${excludedPath}.`
        });
      }
    }
  }

  [
    ["validator_manifest_ref", packet.validator_manifest_ref],
    ["evidence_manifest_ref", packet.evidence_manifest_ref],
    ["review_manifest_ref", packet.review_manifest_ref],
    ["prompt_template_ref", packet.prompt_template_ref]
  ].forEach(([fieldName, refValue]) => {
    if (typeof refValue === "string" && !refValue.startsWith("packets/")) {
      issues.push({
        path: `packet.${fieldName}`,
        message: "Manifest refs must stay under packets/."
      });
    }
  });

  return finalizeValidation("Packet manifest", issues, packet);
}

export function validatePacketRegistryManifest(value: unknown): PacketRegistryManifest {
  const issues: ManifestStructuralIssue[] = [];
  const record = readRecord(value, "registry", issues);

  if (!record) {
    throw new ManifestValidationError("Packet registry is not an object.", issues);
  }

  const identityRulesRecord = readRecord(
    record.identity_rules,
    "registry.identity_rules",
    issues
  );
  const membershipModelRecord = readRecord(
    record.membership_model,
    "registry.membership_model",
    issues
  );
  const statusModelRecord = readRecord(
    record.status_model,
    "registry.status_model",
    issues
  );

  const packetsValue = record.packets;
  const packetsArray = Array.isArray(packetsValue) ? packetsValue : [];

  if (!Array.isArray(packetsValue)) {
    pushTypeIssue(issues, "registry.packets", "an array");
  }

  const packets = packetsArray
    .filter((entry) => isRecord(entry))
    .map((entry, index) => {
      const packetRecord = readRecord(entry, `registry.packets[${index}]`, issues);

      if (!packetRecord) {
        return null;
      }

      const waveId = packetRecord.wave_id;
      const waveMemberships = packetRecord.wave_memberships;

      const normalized: PacketRegistryEntry = {
        packet_id: readString(packetRecord, "packet_id", `registry.packets[${index}]`, issues),
        manifest_ref: readString(
          packetRecord,
          "manifest_ref",
          `registry.packets[${index}]`,
          issues
        ),
        milestone: readString(packetRecord, "milestone", `registry.packets[${index}]`, issues),
        packet_class: readString(
          packetRecord,
          "packet_class",
          `registry.packets[${index}]`,
          issues
        ) as PacketRegistryEntry["packet_class"],
        status: readString(packetRecord, "status", `registry.packets[${index}]`, issues) as PacketRegistryEntry["status"],
        notes: readString(packetRecord, "notes", `registry.packets[${index}]`, issues)
      };

      if (typeof waveId === "string") {
        normalized.wave_id = waveId;
      }

      if (Array.isArray(waveMemberships)) {
        normalized.wave_memberships = waveMemberships.filter(
          (membership) => typeof membership === "string"
        );
      }

      if (!normalized.wave_id && !normalized.wave_memberships?.length) {
        issues.push({
          path: `registry.packets[${index}]`,
          message: "Each registry entry must declare wave_id or wave_memberships."
        });
      }

      if (normalized.wave_id && normalized.wave_memberships?.length) {
        issues.push({
          path: `registry.packets[${index}]`,
          message: "Registry entry must use either wave_id or wave_memberships, not both."
        });
      }

      return normalized;
    })
    .filter((entry): entry is PacketRegistryEntry => entry !== null);

  const packetIds = new Set<string>();

  packets.forEach((entry, index) => {
    if (packetIds.has(entry.packet_id)) {
      issues.push({
        path: `registry.packets[${index}].packet_id`,
        message: `Duplicate packet_id detected: ${entry.packet_id}.`
      });
    }

    packetIds.add(entry.packet_id);
  });

  return finalizeValidation("Packet registry", issues, {
    spec_kind: readString(record, "spec_kind", "registry", issues) as "packet-registry",
    spec_name: readString(record, "spec_name", "registry", issues),
    version: readInteger(record, "version", "registry", issues),
    status: readString(record, "status", "registry", issues),
    summary: readString(record, "summary", "registry", issues),
    identity_rules: identityRulesRecord
      ? {
          registry_is_authoritative: readBoolean(
            identityRulesRecord,
            "registry_is_authoritative",
            "registry.identity_rules",
            issues
          ),
          duplicate_packet_ids_illegal: readBoolean(
            identityRulesRecord,
            "duplicate_packet_ids_illegal",
            "registry.identity_rules",
            issues
          ),
          graph_repair_reuses_packet_id_with_version_increment: readBoolean(
            identityRulesRecord,
            "graph_repair_reuses_packet_id_with_version_increment",
            "registry.identity_rules",
            issues
          ),
          structurally_distinct_repair_requires_new_packet_id: readBoolean(
            identityRulesRecord,
            "structurally_distinct_repair_requires_new_packet_id",
            "registry.identity_rules",
            issues
          ),
          reconciliation_source: readString(
            identityRulesRecord,
            "reconciliation_source",
            "registry.identity_rules",
            issues
          )
        }
      : {
          registry_is_authoritative: false,
          duplicate_packet_ids_illegal: false,
          graph_repair_reuses_packet_id_with_version_increment: false,
          structurally_distinct_repair_requires_new_packet_id: false,
          reconciliation_source: ""
        },
    membership_model: membershipModelRecord
      ? {
          single_wave_field: readString(
            membershipModelRecord,
            "single_wave_field",
            "registry.membership_model",
            issues
          ),
          multi_wave_field: readString(
            membershipModelRecord,
            "multi_wave_field",
            "registry.membership_model",
            issues
          ),
          rules: readStringArray(
            membershipModelRecord,
            "rules",
            "registry.membership_model",
            issues
          )
        }
      : {
          single_wave_field: "",
          multi_wave_field: "",
          rules: []
        },
    status_model: statusModelRecord
      ? {
          allowed_statuses: readStringArray(
            statusModelRecord,
            "allowed_statuses",
            "registry.status_model",
            issues
          ) as PacketRegistryManifest["status_model"]["allowed_statuses"]
        }
      : {
          allowed_statuses: []
        },
    packets
  });
}

export function validateWaveManifest(value: unknown): WaveManifest {
  const issues: ManifestStructuralIssue[] = [];
  const record = readRecord(value, "wave", issues);

  if (!record) {
    throw new ManifestValidationError("Wave manifest is not an object.", issues);
  }

  const executionPolicyRecord = readRecord(
    record.execution_policy,
    "wave.execution_policy",
    issues
  );
  const reviewPolicyRecord = readRecord(
    record.review_policy,
    "wave.review_policy",
    issues
  );
  const benchmarkGatesRecord = readRecord(
    record.benchmark_gates,
    "wave.benchmark_gates",
    issues
  );
  const launchGatesRecord = readRecord(
    record.launch_gates,
    "wave.launch_gates",
    issues
  );

  const wave = {
    wave_id: readString(record, "wave_id", "wave", issues),
    title: readString(record, "title", "wave", issues),
    status: readString(record, "status", "wave", issues) as WaveManifest["status"],
    purpose: readString(record, "purpose", "wave", issues),
    packets: readStringArray(record, "packets", "wave", issues),
    excluded_packets: readStringArray(record, "excluded_packets", "wave", issues),
    execution_policy: executionPolicyRecord
      ? ({
          concurrency_cap: readInteger(
            executionPolicyRecord,
            "concurrency_cap",
            "wave.execution_policy",
            issues
          ),
          launch_mode: readString(
            executionPolicyRecord,
            "launch_mode",
            "wave.execution_policy",
            issues
          ),
          operator_control: readString(
            executionPolicyRecord,
            "operator_control",
            "wave.execution_policy",
            issues
          ),
          speculative_execution: readBoolean(
            executionPolicyRecord,
            "speculative_execution",
            "wave.execution_policy",
            issues
          ),
          dependency_class_interpretation: readString(
            executionPolicyRecord,
            "dependency_class_interpretation",
            "wave.execution_policy",
            issues
          ),
          artifact_control: readString(
            executionPolicyRecord,
            "artifact_control",
            "wave.execution_policy",
            issues
          )
        } satisfies WaveExecutionPolicy)
      : {
          concurrency_cap: 0,
          launch_mode: "",
          operator_control: "",
          speculative_execution: false,
          dependency_class_interpretation: "",
          artifact_control: ""
        },
    review_policy: reviewPolicyRecord
      ? ({
          default_review: readString(
            reviewPolicyRecord,
            "default_review",
            "wave.review_policy",
            issues
          ),
          agent_review: readString(
            reviewPolicyRecord,
            "agent_review",
            "wave.review_policy",
            issues
          ),
          review_queue_cap: readInteger(
            reviewPolicyRecord,
            "review_queue_cap",
            "wave.review_policy",
            issues
          ),
          posture: readString(reviewPolicyRecord, "posture", "wave.review_policy", issues),
          success_requirement: readString(
            reviewPolicyRecord,
            "success_requirement",
            "wave.review_policy",
            issues
          )
        } satisfies WaveReviewPolicy)
      : {
          default_review: "",
          agent_review: "",
          review_queue_cap: 0,
          posture: "",
          success_requirement: ""
        },
    benchmark_gates: benchmarkGatesRecord
      ? ({
          pre_wave: readStringArray(
            benchmarkGatesRecord,
            "pre_wave",
            "wave.benchmark_gates",
            issues
          ),
          post_wave: readStringArray(
            benchmarkGatesRecord,
            "post_wave",
            "wave.benchmark_gates",
            issues
          )
        } satisfies WaveBenchmarkGates)
      : { pre_wave: [], post_wave: [] },
    launch_gates: launchGatesRecord
      ? ({
          go_requirements: readStringArray(
            launchGatesRecord,
            "go_requirements",
            "wave.launch_gates",
            issues
          ),
          continuation_requirements: readStringArray(
            launchGatesRecord,
            "continuation_requirements",
            "wave.launch_gates",
            issues
          )
        } satisfies WaveLaunchGates)
      : { go_requirements: [], continuation_requirements: [] },
    pause_gates: readBooleanRecord(record, "pause_gates", "wave", issues),
    freeze_gates: readBooleanRecord(record, "freeze_gates", "wave", issues),
    abort_gates: readBooleanRecord(record, "abort_gates", "wave", issues),
    rollback_gates: readBooleanRecord(record, "rollback_gates", "wave", issues),
    success_metrics: readRecord(record.success_metrics, "wave.success_metrics", issues)
      ? Object.fromEntries(
          Object.entries(record.success_metrics as UnknownRecord).filter(
            ([, entryValue]) =>
              typeof entryValue === "string" || typeof entryValue === "number"
          )
        )
      : {},
    progression_constraints: readStringRecord(
      record,
      "progression_constraints",
      "wave",
      issues
    ),
    operator_notes: readString(record, "operator_notes", "wave", issues)
  } as WaveManifest;

  if (wave.execution_policy.concurrency_cap < 1) {
    issues.push({
      path: "wave.execution_policy.concurrency_cap",
      message: "Wave concurrency_cap must be at least 1."
    });
  }

  if (wave.packets.length === 0) {
    issues.push({ path: "wave.packets", message: "Wave must declare at least one packet." });
  }

  return finalizeValidation("Wave manifest", issues, wave);
}

export function validateBenchmarkManifest(value: unknown): BenchmarkManifest {
  const issues: ManifestStructuralIssue[] = [];
  const record = readRecord(value, "benchmark", issues);

  if (!record) {
    throw new ManifestValidationError("Benchmark manifest is not an object.", issues);
  }

  const expectedOutcomesRecord = readRecord(
    record.expected_outcomes,
    "benchmark.expected_outcomes",
    issues
  );
  const failureInterpretationRecord = readRecord(
    record.failure_interpretation,
    "benchmark.failure_interpretation",
    issues
  );

  const expectedOutcomes: Record<string, BenchmarkOutcome> = {};

  if (expectedOutcomesRecord) {
    for (const [outcomeName, outcomeValue] of Object.entries(expectedOutcomesRecord)) {
      const outcomeRecord = readRecord(
        outcomeValue,
        `benchmark.expected_outcomes.${outcomeName}`,
        issues
      );

      if (!outcomeRecord) {
        continue;
      }

      expectedOutcomes[outcomeName] = {
        status: readString(
          outcomeRecord,
          "status",
          `benchmark.expected_outcomes.${outcomeName}`,
          issues
        ),
        expectation: readString(
          outcomeRecord,
          "expectation",
          `benchmark.expected_outcomes.${outcomeName}`,
          issues
        )
      };
    }
  }

  return finalizeValidation("Benchmark manifest", issues, {
    benchmark_id: readString(record, "benchmark_id", "benchmark", issues),
    title: readString(record, "title", "benchmark", issues),
    status: readString(record, "status", "benchmark", issues),
    fixture: readString(record, "fixture", "benchmark", issues),
    wave_ref: readString(record, "wave_ref", "benchmark", issues),
    packet_ref: readString(record, "packet_ref", "benchmark", issues),
    purpose: readString(record, "purpose", "benchmark", issues),
    scope_exercised: readStringArray(record, "scope_exercised", "benchmark", issues),
    explicitly_not_exercised: readStringArray(
      record,
      "explicitly_not_exercised",
      "benchmark",
      issues
    ),
    expected_outcomes: expectedOutcomes,
    failure_interpretation: failureInterpretationRecord
      ? ({
          blocking_conditions: readStringArray(
            failureInterpretationRecord,
            "blocking_conditions",
            "benchmark.failure_interpretation",
            issues
          ),
          operator_policy: readStringArray(
            failureInterpretationRecord,
            "operator_policy",
            "benchmark.failure_interpretation",
            issues
          )
        } satisfies BenchmarkFailureInterpretation)
      : {
          blocking_conditions: [],
          operator_policy: []
        }
  });
}

function validateEvidenceRequirements(
  requirements: UnknownRecord[],
  path: string,
  issues: ManifestStructuralIssue[]
): EvidenceRequirement[] {
  return requirements.map((requirementValue, index) => {
    const requirementRecord = readRecord(
      requirementValue,
      `${path}[${index}]`,
      issues
    );

    if (!requirementRecord) {
      return { type: "", source: "", tier: 0 };
    }

    const requirement: EvidenceRequirement = {
      type: readString(requirementRecord, "type", `${path}[${index}]`, issues),
      source: readString(requirementRecord, "source", `${path}[${index}]`, issues),
      tier: readInteger(requirementRecord, "tier", `${path}[${index}]`, issues)
    };

    if ("condition" in requirementRecord) {
      requirement.condition = readString(
        requirementRecord,
        "condition",
        `${path}[${index}]`,
        issues
      );
    }

    if ("pin_on" in requirementRecord) {
      requirement.pin_on = readString(
        requirementRecord,
        "pin_on",
        `${path}[${index}]`,
        issues
      );
    }

    return requirement;
  });
}

export function validateEvidenceManifest(value: unknown): EvidenceManifest {
  const issues: ManifestStructuralIssue[] = [];
  const record = readRecord(value, "evidence", issues);

  if (!record) {
    throw new ManifestValidationError("Evidence manifest is not an object.", issues);
  }

  return finalizeValidation("Evidence manifest", issues, {
    manifest_kind: readString(record, "manifest_kind", "evidence", issues) as "evidence-manifest",
    manifest_name: readString(record, "manifest_name", "evidence", issues),
    version: readInteger(record, "version", "evidence", issues),
    status: readString(record, "status", "evidence", issues),
    summary: readString(record, "summary", "evidence", issues),
    required: validateEvidenceRequirements(
      readObjectArray(record, "required", "evidence", issues),
      "evidence.required",
      issues
    ),
    conditional: validateEvidenceRequirements(
      readObjectArray(record, "conditional", "evidence", issues),
      "evidence.conditional",
      issues
    ),
    ephemeral_unless_pinned: validateEvidenceRequirements(
      readObjectArray(record, "ephemeral_unless_pinned", "evidence", issues),
      "evidence.ephemeral_unless_pinned",
      issues
    ),
    notes: readStringArray(record, "notes", "evidence", issues)
  });
}

export function validateReviewManifest(value: unknown): ReviewManifest {
  const issues: ManifestStructuralIssue[] = [];
  const record = readRecord(value, "review", issues);

  if (!record) {
    throw new ManifestValidationError("Review manifest is not an object.", issues);
  }

  const decisionRecordRecord = readRecord(
    record.required_decision_record,
    "review.required_decision_record",
    issues
  );

  return finalizeValidation("Review manifest", issues, {
    manifest_kind: readString(record, "manifest_kind", "review", issues) as "review-manifest",
    manifest_name: readString(record, "manifest_name", "review", issues),
    version: readInteger(record, "version", "review", issues),
    status: readString(record, "status", "review", issues),
    review_mode: readString(record, "review_mode", "review", issues),
    trigger: readString(record, "trigger", "review", issues),
    summary: readString(record, "summary", "review", issues),
    mandatory_evidence: readStringArray(record, "mandatory_evidence", "review", issues),
    advisory_inputs_if_present: readStringArray(
      record,
      "advisory_inputs_if_present",
      "review",
      issues
    ),
    required_decision_record: decisionRecordRecord
      ? ({
          fields: readStringArray(
            decisionRecordRecord,
            "fields",
            "review.required_decision_record",
            issues
          ),
          decision_values: readStringArray(
            decisionRecordRecord,
            "decision_values",
            "review.required_decision_record",
            issues
          )
        } satisfies ReviewDecisionRecordRequirement)
      : {
          fields: [],
          decision_values: []
        },
    review_focus: readStringArray(record, "review_focus", "review", issues)
  });
}

function validateValidatorRules(
  rules: UnknownRecord[],
  path: string,
  issues: ManifestStructuralIssue[]
): ValidatorRule[] {
  return rules.map((ruleValue, index) => {
    const ruleRecord = readRecord(ruleValue, `${path}[${index}]`, issues);

    if (!ruleRecord) {
      return {
        id: "",
        tool: "",
        blocking: false,
        order: 0
      };
    }

    const id = readString(ruleRecord, "id", `${path}[${index}]`, issues);
    const blocking = readBoolean(ruleRecord, "blocking", `${path}[${index}]`, issues);
    const order = readInteger(ruleRecord, "order", `${path}[${index}]`, issues);

    if (ruleRecord.type === "agentic") {
      return {
        id,
        type: "agentic",
        review_manifest_ref: readString(
          ruleRecord,
          "review_manifest_ref",
          `${path}[${index}]`,
          issues
        ),
        blocking,
        order,
        condition:
          "condition" in ruleRecord
            ? readString(ruleRecord, "condition", `${path}[${index}]`, issues)
            : undefined
      };
    }

    const rule: ToolValidatorRule = {
      id,
      tool: readString(ruleRecord, "tool", `${path}[${index}]`, issues),
      blocking,
      order
    };

    if ("scope" in ruleRecord) {
      rule.scope = readString(ruleRecord, "scope", `${path}[${index}]`, issues);
    }

    if ("condition" in ruleRecord) {
      rule.condition = readString(ruleRecord, "condition", `${path}[${index}]`, issues);
    }

    if ("required_for_waves" in ruleRecord) {
      rule.required_for_waves = readStringArray(
        ruleRecord,
        "required_for_waves",
        `${path}[${index}]`,
        issues
      );
    }

    return rule;
  });
}

export function validateValidatorManifest(value: unknown): ValidatorManifest {
  const issues: ManifestStructuralIssue[] = [];
  const record = readRecord(value, "validator", issues);

  if (!record) {
    throw new ManifestValidationError("Validator manifest is not an object.", issues);
  }

  const validatorSetRecord = readRecord(
    record.validator_set,
    "validator.validator_set",
    issues
  );

  return finalizeValidation("Validator manifest", issues, {
    manifest_kind: readString(record, "manifest_kind", "validator", issues) as "validator-manifest",
    manifest_name: readString(record, "manifest_name", "validator", issues),
    version: readInteger(record, "version", "validator", issues),
    status: readString(record, "status", "validator", issues),
    applies_to_packet_classes: readStringArray(
      record,
      "applies_to_packet_classes",
      "validator",
      issues
    ) as ValidatorManifest["applies_to_packet_classes"],
    execution_mode: readString(record, "execution_mode", "validator", issues),
    summary: readString(record, "summary", "validator", issues),
    validator_set: validatorSetRecord
      ? {
          layer_1_correctness: validateValidatorRules(
            readObjectArray(
              validatorSetRecord,
              "layer_1_correctness",
              "validator.validator_set",
              issues
            ),
            "validator.validator_set.layer_1_correctness",
            issues
          ) as ToolValidatorRule[],
          layer_2_security: validateValidatorRules(
            readObjectArray(
              validatorSetRecord,
              "layer_2_security",
              "validator.validator_set",
              issues
            ),
            "validator.validator_set.layer_2_security",
            issues
          ) as ToolValidatorRule[],
          layer_3_policy: validateValidatorRules(
            readObjectArray(
              validatorSetRecord,
              "layer_3_policy",
              "validator.validator_set",
              issues
            ),
            "validator.validator_set.layer_3_policy",
            issues
          ) as ToolValidatorRule[],
          layer_4_evidence: validateValidatorRules(
            readObjectArray(
              validatorSetRecord,
              "layer_4_evidence",
              "validator.validator_set",
              issues
            ),
            "validator.validator_set.layer_4_evidence",
            issues
          ) as ToolValidatorRule[],
          agentic_review: validateValidatorRules(
            readObjectArray(
              validatorSetRecord,
              "agentic_review",
              "validator.validator_set",
              issues
            ),
            "validator.validator_set.agentic_review",
            issues
          )
        }
      : {
          layer_1_correctness: [],
          layer_2_security: [],
          layer_3_policy: [],
          layer_4_evidence: [],
          agentic_review: []
        },
    notes: readStringArray(record, "notes", "validator", issues)
  });
}

export function getPacketRegistryEntry(
  registry: PacketRegistryManifest,
  packetId: string
): PacketRegistryEntry | undefined {
  return registry.packets.find(
    (entry: PacketRegistryEntry) => entry.packet_id === packetId
  );
}

export function listRegistryWaves(entry: PacketRegistryEntry): string[] {
  return entry.wave_memberships?.length ? entry.wave_memberships : entry.wave_id ? [entry.wave_id] : [];
}

export function requirePacketRegistryEntry(
  registry: PacketRegistryManifest,
  packetId: string,
  waveId: string
): PacketRegistryEntry {
  const entry = getPacketRegistryEntry(registry, packetId);

  if (!entry) {
    throw new ManifestValidationError(`Packet ${packetId} is missing from the registry.`, [
      { path: "registry.packets", message: `Missing packet_id ${packetId}.` }
    ]);
  }

  if (!listRegistryWaves(entry).includes(waveId)) {
    throw new ManifestValidationError(
      `Packet ${packetId} is not registered for wave ${waveId}.`,
      [
        {
          path: "registry.packets",
          message: `Packet ${packetId} does not declare wave membership for ${waveId}.`
        }
      ]
    );
  }

  return entry;
}
