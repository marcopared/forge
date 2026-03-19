import type { ForgeConfig } from "@forge/shared";
export {
  checkEvidenceCompleteness,
  computeConfidenceScore,
  createEvidenceLayout,
  createWave0CoreEvidenceRequirements,
  evidencePackage,
  Wave0EvidenceBundleWriter
} from "./bundle.js";
export {
  createContextPackManifest,
  createManifestVersionRecord,
  createManifestVersionRecords
} from "./context-pack.js";
export { Wave0AuditWriter, type Wave0AuditWriterPaths } from "./audit.js";
export type {
  AuditTrailEvent,
  AuditTrailEventInput,
  ConfidenceScoreRecord,
  ContextPackEntry,
  ContextPackManifestRecord,
  ContextPackSourceInput,
  CostSummaryRecord,
  EvidenceBundleDocument,
  EvidenceBundleWriteResult,
  EvidenceCompletenessInput,
  EvidenceCompletenessResult,
  EvidenceConditions,
  EvidenceItemRegistration,
  EvidenceLayout,
  ManifestVersionRecord,
  ManifestVersionSource,
  OperatorInterventionRecord,
  RegisteredEvidenceItem,
  ReviewerVerdictRecord,
  RuntimeTimestampsRecord,
  StateTransitionRecord,
  WorktreeIdentityRecord
} from "./types.js";

export function buildEvidenceLayout(config: ForgeConfig) {
  return {
    evidenceRoot: config.paths.evidenceRoot,
    auditRoot: config.paths.auditRoot,
    logRoot: config.paths.logRoot
  };
}
