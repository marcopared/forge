import type {
  ContextPackManifestRecord
} from "@forge/evidence";
import type {
  ForgeConfig,
  LoadedWavePacketPlan
} from "@forge/shared";
import type {
  Wave0ToolName
} from "@forge/policy-engine";
import type {
  ToolBrokerContext,
  Wave0ToolBroker,
  ToolInvocationResult
} from "@forge/tool-broker";

export type AgentTrustLabel = "SYSTEM" | "HARNESS" | "CODE" | "EXTERNAL";

export interface AgentContextEntry {
  ref: string;
  absolutePath: string;
  trustLabel: AgentTrustLabel;
  content: string;
  bytes: number;
  estimatedTokens: number;
}

export interface AgentContextSection {
  trustLabel: AgentTrustLabel;
  title: string;
  entries: AgentContextEntry[];
}

export interface Wave0AgentContextPack {
  packetId: string;
  profile: string;
  promptTemplateRef: string;
  sections: AgentContextSection[];
  manifest: ContextPackManifestRecord;
}

export interface AgentToolCall {
  toolName: Wave0ToolName;
  input: Record<string, unknown>;
  rationale?: string;
}

export interface AgentOutputCheck {
  requirement: string;
  status: "satisfied" | "deferred";
  note: string;
}

export interface StructuredAgentOutput {
  summary: string;
  filesCreatedOrModified: string[];
  completionContractCheck: AgentOutputCheck[];
  validatorRiskNotes: string[];
  confidenceScore: number;
}

export interface AgentToolResultSummary {
  toolName: Wave0ToolName;
  ok: boolean;
  policyDecision: ToolInvocationResult<unknown>["policyDecision"];
  message: string;
  data: unknown;
}

export interface AgentTurnRecord {
  turn: number;
  assistantMessage: string;
  toolCalls: AgentToolCall[];
  toolResults: AgentToolResultSummary[];
}

export interface AgentProviderMetadata {
  providerId: string;
  model: string | null;
  mode: "local-stub" | "model";
}

export interface AgentProviderTurnRequest {
  config: ForgeConfig;
  packetPlan: LoadedWavePacketPlan;
  contextPack: Wave0AgentContextPack;
  toolContext: ToolBrokerContext;
  turns: readonly AgentTurnRecord[];
  lastToolResults: readonly ToolInvocationResult<unknown>[];
}

export interface AgentProviderTurnResponse {
  assistantMessage: string;
  toolCalls?: AgentToolCall[];
  output?: StructuredAgentOutput;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface AgentProvider {
  readonly metadata: AgentProviderMetadata;
  invokeTurn(
    request: AgentProviderTurnRequest
  ): Promise<AgentProviderTurnResponse>;
}

export interface Wave0AgentRunInput {
  config: ForgeConfig;
  packetPlan: LoadedWavePacketPlan;
  worktreePath: string;
  toolBroker: Wave0ToolBroker;
  toolBrokerContext: ToolBrokerContext;
  maxTurns?: number;
  provider?: AgentProvider;
}

export interface Wave0AgentMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  toolCallCount: number;
  turnCount: number;
  durationMs: number;
}

export interface Wave0AgentExecutionResult {
  status: "completed" | "failed";
  provider: AgentProviderMetadata;
  contextPack: Wave0AgentContextPack;
  turns: AgentTurnRecord[];
  toolResults: ToolInvocationResult<unknown>[];
  output: StructuredAgentOutput | null;
  metrics: Wave0AgentMetrics;
  failureMessage?: string;
  completedAt: string;
}
