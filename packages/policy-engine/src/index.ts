export {
  defaultProtectedPaths,
  LocalPolicyEngine,
  policyEnginePackage
} from "./policy-engine.js";

export { loadWave0PolicySet } from "./loader.js";

export type {
  AgentRole,
  LoadedPolicySet,
  PermissionLevel,
  PolicyDecision,
  PolicyDecisionRecord,
  PolicyEngineLike,
  PolicyEvaluationResult,
  ShellAllowlistPolicy,
  TokenBudgetPolicy,
  ToolActionClass,
  ToolPolicyContext,
  ToolPolicyRequest,
  Wave0ToolName
} from "./types.js";
