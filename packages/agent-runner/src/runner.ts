import { defineForgePackage } from "@forge/shared";
import {
  wave0ToolCatalog,
  type GitAddRequest,
  type GitCommitRequest,
  type ToolInvocationResult
} from "@forge/tool-broker";
import {
  assembleWave0SyntheticContextPack
} from "./context-pack.js";
import { SyntheticWave0AgentProvider } from "./provider.js";
import type {
  AgentOutputCheck,
  AgentProvider,
  AgentToolCall,
  AgentToolResultSummary,
  AgentTurnRecord,
  StructuredAgentOutput,
  Wave0AgentExecutionResult,
  Wave0AgentRunInput
} from "./types.js";

export const agentRunnerPackage = defineForgePackage({
  name: "@forge/agent-runner",
  purpose: "Runs the minimum Wave 0 agent loop through the typed tool broker.",
  dependsOn: ["@forge/shared", "@forge/tool-broker", "@forge/evidence", "@forge/config"],
  status: "skeleton"
});

function getString(input: Record<string, unknown>, field: string): string {
  const value = input[field];

  if (typeof value !== "string") {
    throw new Error(`Expected ${field} to be a string.`);
  }

  return value;
}

function getOptionalBoolean(
  input: Record<string, unknown>,
  field: string
): boolean | undefined {
  const value = input[field];
  return typeof value === "boolean" ? value : undefined;
}

function getOptionalStringArray(
  input: Record<string, unknown>,
  field: string
): string[] | undefined {
  const value = input[field];

  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function summarizeToolResult(
  result: ToolInvocationResult<unknown>
): AgentToolResultSummary {
  return {
    toolName: result.toolName,
    ok: result.ok,
    policyDecision: result.policyDecision,
    message: result.message,
    data: result.data
  };
}

function createFailureOutput(
  checks: readonly AgentOutputCheck[]
): StructuredAgentOutput {
  return {
    summary: "The synthetic agent run did not complete successfully.",
    filesCreatedOrModified: [],
    completionContractCheck: checks.map((check) => ({
      ...check,
      status: check.status === "satisfied" ? "satisfied" : "deferred"
    })),
    validatorRiskNotes: [
      "The agent loop failed before handing off a clean implementation payload."
    ],
    confidenceScore: 0.1
  };
}

async function dispatchToolCall(
  broker: Wave0AgentRunInput["toolBroker"],
  context: Wave0AgentRunInput["toolBrokerContext"],
  call: AgentToolCall
): Promise<ToolInvocationResult<unknown>> {
  switch (call.toolName) {
    case "file.read":
      return await broker.readFile(context, {
        path: getString(call.input, "path")
      });
    case "file.write":
      return await broker.writeFile(context, {
        path: getString(call.input, "path"),
        content: getString(call.input, "content")
      });
    case "dir.list":
      return await broker.listDirectory(context, {
        path:
          typeof call.input.path === "string"
            ? call.input.path
            : undefined
      });
    case "repo.inspect":
      return await broker.inspectRepo(context);
    case "run.typecheck":
      return await broker.runTypecheck(context);
    case "run.lint":
      return await broker.runLint(context);
    case "run.tests":
      return await broker.runTests(context);
    case "git.status":
      return await broker.gitStatus(context);
    case "git.diff":
      return await broker.gitDiff(context);
    case "git.add":
      return await broker.gitAdd(context, {
        paths: getOptionalStringArray(call.input, "paths")
      } satisfies GitAddRequest);
    case "git.commit":
      return await broker.gitCommit(context, {
        message: getString(call.input, "message"),
        allowEmpty: getOptionalBoolean(call.input, "allowEmpty")
      } satisfies GitCommitRequest);
    default: {
      const exhaustiveCheck: never = call.toolName;
      throw new Error(`Unsupported tool call: ${exhaustiveCheck}`);
    }
  }
}

export class Wave0AgentRunner {
  private readonly provider: AgentProvider;

  constructor(provider: AgentProvider = new SyntheticWave0AgentProvider()) {
    this.provider = provider;
  }

  async execute(input: Wave0AgentRunInput): Promise<Wave0AgentExecutionResult> {
    const startedAt = Date.now();
    const contextPack = await assembleWave0SyntheticContextPack({
      config: input.config,
      packetPlan: input.packetPlan,
      worktreePath: input.worktreePath
    });
    const turns: AgentTurnRecord[] = [];
    const toolResults: ToolInvocationResult<unknown>[] = [];
    const maxTurns = input.maxTurns ?? 8;
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      let lastToolResults: ToolInvocationResult<unknown>[] = [];

      for (let turnIndex = 0; turnIndex < maxTurns; turnIndex += 1) {
        const response = await this.provider.invokeTurn({
          config: input.config,
          packetPlan: input.packetPlan,
          contextPack,
          toolContext: input.toolBrokerContext,
          turns,
          lastToolResults
        });

        promptTokens += response.usage?.promptTokens ?? 0;
        completionTokens += response.usage?.completionTokens ?? 0;

        const executedResults: ToolInvocationResult<unknown>[] = [];
        const toolCalls = response.toolCalls ?? [];

        for (const call of toolCalls) {
          const result = await dispatchToolCall(
            input.toolBroker,
            input.toolBrokerContext,
            call
          );
          executedResults.push(result);
          toolResults.push(result);

          if (!result.ok) {
            throw new Error(`${result.toolName}: ${result.message}`);
          }
        }

        turns.push({
          turn: turnIndex + 1,
          assistantMessage: response.assistantMessage,
          toolCalls,
          toolResults: executedResults.map((result) => summarizeToolResult(result))
        });

        if (response.output) {
          return {
            status: "completed",
            provider: this.provider.metadata,
            contextPack,
            turns,
            toolResults,
            output: response.output,
            metrics: {
              promptTokens,
              completionTokens,
              totalTokens: promptTokens + completionTokens,
              toolCallCount: toolResults.length,
              turnCount: turns.length,
              durationMs: Date.now() - startedAt
            },
            completedAt: new Date().toISOString()
          };
        }

        if (toolCalls.length === 0) {
          throw new Error(
            `Agent provider ${this.provider.metadata.providerId} produced neither tool calls nor structured output.`
          );
        }

        lastToolResults = executedResults;
      }

      throw new Error(
        `Agent provider ${this.provider.metadata.providerId} exceeded the maximum turn budget of ${maxTurns}.`
      );
    } catch (error) {
      const failureMessage = error instanceof Error ? error.message : String(error);
      const completionContractCheck = input.packetPlan.packetManifest.completion_contract.map(
        (requirement) => ({
          requirement,
          status: "deferred" as const,
          note: "The agent run failed before this requirement could be fully attested."
        })
      );

      return {
        status: "failed",
        provider: this.provider.metadata,
        contextPack,
        turns,
        toolResults,
        output: createFailureOutput(completionContractCheck),
        metrics: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          toolCallCount: toolResults.length,
          turnCount: turns.length,
          durationMs: Date.now() - startedAt
        },
        failureMessage,
        completedAt: new Date().toISOString()
      };
    }
  }
}

export async function executeWave0AgentRun(
  input: Wave0AgentRunInput
): Promise<Wave0AgentExecutionResult> {
  const runner = new Wave0AgentRunner(input.provider);
  return await runner.execute(input);
}

export { wave0ToolCatalog };
