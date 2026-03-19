import path from "node:path";
import type {
  AgentProvider,
  AgentProviderTurnRequest,
  AgentProviderTurnResponse,
  StructuredAgentOutput
} from "./types.js";

function toRelativeImport(fromPath: string, targetPath: string): string {
  const fromDirectory = path.dirname(fromPath);
  const relativePath = path.relative(fromDirectory, targetPath).replace(/\\/gu, "/");
  const withPrefix = relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  return withPrefix.replace(/\.ts$/u, ".js");
}

function createSyntheticHelloSource(): string {
  return [
    "export function greet(name: string): string {",
    "  return `Hello, ${name}`;",
    "}",
    ""
  ].join("\n");
}

function createSyntheticHelloTest(targetImportPath: string): string {
  return [
    'import assert from "node:assert/strict";',
    'import test from "node:test";',
    `import { greet } from "${targetImportPath}";`,
    "",
    'test("greet returns a synthetic hello", () => {',
    '  assert.equal(greet("Forge"), "Hello, Forge");',
    "});",
    ""
  ].join("\n");
}

function createStructuredOutput(
  request: AgentProviderTurnRequest
): StructuredAgentOutput {
  const helloPath = request.packetPlan.packetManifest.target_paths[0] ?? "packages/shared/src/synthetic/hello.ts";
  const helloTestPath =
    request.packetPlan.packetManifest.target_paths[1] ??
    "packages/shared/src/synthetic/hello.test.ts";

  return {
    summary:
      "Synthetic hello module and test were created inside the declared packet scope through typed tool calls.",
    filesCreatedOrModified: [helloPath, helloTestPath],
    completionContractCheck: request.packetPlan.packetManifest.completion_contract.map(
      (requirement) => {
        if (requirement.includes("hello.ts exports")) {
          return {
            requirement,
            status: "satisfied" as const,
            note: `${helloPath} was written with greet(name: string): string.`
          };
        }

        if (requirement.includes("hello.test.ts contains")) {
          return {
            requirement,
            status: "satisfied" as const,
            note: `${helloTestPath} was written with a passing node:test case.`
          };
        }

        return {
          requirement,
          status: "deferred" as const,
          note: "This requirement is verified by the downstream validator/evidence stages."
        };
      }
    ),
    validatorRiskNotes: [
      "Compilation, lint, unit tests, scope drift, protected paths, and evidence completeness still gate success after the agent step.",
      "The provider is a deterministic local stub so real-model behavior remains intentionally deferred."
    ],
    confidenceScore: 0.82
  };
}

export class SyntheticWave0AgentProvider implements AgentProvider {
  readonly metadata = {
    providerId: "local-synthetic-provider",
    model: null,
    mode: "local-stub"
  } as const;

  async invokeTurn(
    request: AgentProviderTurnRequest
  ): Promise<AgentProviderTurnResponse> {
    const helloPath = request.packetPlan.packetManifest.target_paths[0] ?? "packages/shared/src/synthetic/hello.ts";
    const helloTestPath =
      request.packetPlan.packetManifest.target_paths[1] ??
      "packages/shared/src/synthetic/hello.test.ts";

    switch (request.turns.length) {
      case 0:
        return {
          assistantMessage:
            "Inspecting the scoped repo surfaces before writing the synthetic outputs.",
          toolCalls: [
            {
              toolName: "repo.inspect",
              input: {},
              rationale: "Confirm repo layout and git state inside the provisioned worktree."
            },
            {
              toolName: "file.read",
              input: { path: "packages/shared/tsconfig.json" },
              rationale: "Read the scoped TypeScript config named in the packet prerequisites."
            }
          ],
          usage: {
            promptTokens: request.contextPack.manifest.estimatedTokenCount,
            completionTokens: 96
          }
        };
      case 1:
        return {
          assistantMessage:
            "Writing the synthetic module and its single passing test inside the allowed target paths.",
          toolCalls: [
            {
              toolName: "file.write",
              input: {
                path: helloPath,
                content: createSyntheticHelloSource()
              },
              rationale: "Create the required hello module."
            },
            {
              toolName: "file.write",
              input: {
                path: helloTestPath,
                content: createSyntheticHelloTest(
                  toRelativeImport(helloTestPath, helloPath)
                )
              },
              rationale: "Create the required synthetic test."
            }
          ],
          usage: {
            promptTokens: 64,
            completionTokens: 180
          }
        };
      case 2:
        return {
          assistantMessage:
            "Inspecting the resulting worktree diff before handing off to validators and merge-back.",
          toolCalls: [
            {
              toolName: "git.status",
              input: {},
              rationale: "Capture staged and unstaged synthetic scope changes."
            },
            {
              toolName: "git.diff",
              input: {},
              rationale: "Capture the patch that validators and evidence will inspect next."
            }
          ],
          usage: {
            promptTokens: 48,
            completionTokens: 72
          }
        };
      default:
        return {
          assistantMessage:
            "Returning the structured implementer report for the synthetic packet.",
          output: createStructuredOutput(request),
          usage: {
            promptTokens: 24,
            completionTokens: 128
          }
        };
    }
  }
}
