import fs from "node:fs/promises";
import { parse } from "yaml";

export async function loadYamlDocument(filePath: string): Promise<unknown> {
  const raw = await fs.readFile(filePath, "utf8");
  return parse(raw);
}
