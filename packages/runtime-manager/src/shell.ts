import { spawn } from "node:child_process";
import {
  type CommandExecutionRequest,
  type CommandExecutionResult
} from "./types.js";

export class CommandExecutionError extends Error {
  readonly result: CommandExecutionResult;

  constructor(message: string, result: CommandExecutionResult) {
    super(message);
    this.name = "CommandExecutionError";
    this.result = result;
  }
}

export async function executeCommand(
  request: CommandExecutionRequest
): Promise<CommandExecutionResult> {
  const { command, args = [], cwd, env, input } = request;
  const startedAt = Date.now();

  return await new Promise<CommandExecutionResult>((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd,
      env,
      stdio: "pipe"
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      resolve({
        command: [command, ...args],
        cwd,
        stdout,
        stderr,
        exitCode: code ?? -1,
        durationMs: Date.now() - startedAt
      });
    });

    if (input) {
      child.stdin.write(input);
    }

    child.stdin.end();
  });
}

export async function executeCommandOrThrow(
  request: CommandExecutionRequest,
  failureContext: string
): Promise<CommandExecutionResult> {
  const result = await executeCommand(request);

  if (result.exitCode !== 0) {
    throw new CommandExecutionError(
      `${failureContext} failed with exit code ${result.exitCode}.`,
      result
    );
  }

  return result;
}
