import type { ForgeConfig } from "@forge/shared";
import {
  executeCommand,
  executeCommandOrThrow
} from "./shell.js";
import type { CommandExecutionResult } from "./types.js";

function trimTrailingNewline(value: string): string {
  return value.replace(/\n+$/u, "");
}

export async function executeGit(
  config: ForgeConfig,
  args: readonly string[],
  cwd = config.paths.root
): Promise<CommandExecutionResult> {
  return await executeCommand({
    command: "git",
    args,
    cwd
  });
}

export async function executeGitOrThrow(
  config: ForgeConfig,
  args: readonly string[],
  failureContext: string,
  cwd = config.paths.root
): Promise<CommandExecutionResult> {
  return await executeCommandOrThrow(
    {
      command: "git",
      args,
      cwd
    },
    failureContext
  );
}

export async function readGitValue(
  config: ForgeConfig,
  args: readonly string[],
  failureContext: string,
  cwd = config.paths.root
): Promise<string> {
  const result = await executeGitOrThrow(config, args, failureContext, cwd);
  return trimTrailingNewline(result.stdout);
}

export async function gitRefExists(
  config: ForgeConfig,
  ref: string,
  cwd = config.paths.root
): Promise<boolean> {
  const result = await executeGit(config, ["show-ref", "--verify", "--quiet", ref], cwd);
  return result.exitCode === 0;
}
