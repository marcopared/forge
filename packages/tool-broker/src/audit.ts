import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type {
  PersistedToolArtifacts,
  ToolAuditRecord
} from "./types.js";
import type { ToolBrokerContext } from "./types.js";
import type { PolicyDecisionRecord } from "@forge/policy-engine";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createArtifactPaths(
  context: ToolBrokerContext
): PersistedToolArtifacts {
  const auditDir = path.join(
    context.config.paths.auditRoot,
    context.waveRunId,
    context.taskRunId
  );
  const evidenceDir = path.join(
    context.config.paths.evidenceRoot,
    context.waveRunId,
    context.taskRunId,
    "tool-broker"
  );

  return {
    auditLogPath: path.join(auditDir, "tool-actions.jsonl"),
    policyLogPath: path.join(auditDir, "policy-decisions.jsonl"),
    evidenceAuditLogPath: path.join(evidenceDir, "tool-actions.jsonl"),
    evidencePolicyLogPath: path.join(evidenceDir, "policy-decisions.jsonl")
  };
}

export async function ensureArtifactPaths(
  artifactPaths: PersistedToolArtifacts
): Promise<void> {
  await Promise.all(
    [
      path.dirname(artifactPaths.auditLogPath),
      path.dirname(artifactPaths.policyLogPath),
      path.dirname(artifactPaths.evidenceAuditLogPath),
      path.dirname(artifactPaths.evidencePolicyLogPath)
    ].map((directoryPath) => fs.mkdir(directoryPath, { recursive: true }))
  );
}

export function createToolAuditRecord(input: {
  waveRunId: string;
  taskRunId: string;
  sequenceNumber: number;
  eventType: string;
  eventLevel: ToolAuditRecord["event_level"];
  message: string;
  payload: Record<string, unknown>;
}): ToolAuditRecord {
  return {
    audit_event_id: randomUUID(),
    wave_run_id: input.waveRunId,
    task_run_id: input.taskRunId,
    source_component: "tool-broker",
    event_type: input.eventType,
    event_level: input.eventLevel,
    sequence_number: input.sequenceNumber,
    message: input.message,
    payload: input.payload,
    created_at: new Date().toISOString()
  };
}

export async function appendPolicyDecisionArtifacts(
  artifactPaths: PersistedToolArtifacts,
  record: PolicyDecisionRecord
): Promise<void> {
  const line = `${JSON.stringify(record)}\n`;
  await Promise.all([
    fs.appendFile(artifactPaths.policyLogPath, line, "utf8"),
    fs.appendFile(artifactPaths.evidencePolicyLogPath, line, "utf8")
  ]);
}

export async function appendAuditArtifacts(
  artifactPaths: PersistedToolArtifacts,
  record: ToolAuditRecord
): Promise<void> {
  const line = `${JSON.stringify(record)}\n`;
  await Promise.all([
    fs.appendFile(artifactPaths.auditLogPath, line, "utf8"),
    fs.appendFile(artifactPaths.evidenceAuditLogPath, line, "utf8")
  ]);
}
