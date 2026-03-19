import fs from "node:fs/promises";
import path from "node:path";
import type { RuntimeLogEvent } from "./types.js";

export async function appendRuntimeLog(
  logFilePath: string,
  event: Omit<RuntimeLogEvent, "timestamp">
): Promise<void> {
  await fs.mkdir(path.dirname(logFilePath), { recursive: true });
  const payload: RuntimeLogEvent = {
    timestamp: new Date().toISOString(),
    ...event
  };
  await fs.appendFile(logFilePath, `${JSON.stringify(payload)}\n`, "utf8");
}
