import process from "node:process";
import path from "node:path";
import { loadForgeConfig } from "@forge/config";
import { createForgeDatabase } from "./client.js";
import { listAppliedMigrations, runMigrations } from "./migrations.js";

async function main(): Promise<void> {
  const command = process.argv[2] ?? "migrate";
  const workspaceRoot = process.env.INIT_CWD
    ? path.resolve(process.env.INIT_CWD)
    : process.cwd();
  const config = loadForgeConfig({ rootDir: workspaceRoot });
  const database = createForgeDatabase(config);

  try {
    if (command === "migrate") {
      const applied = await runMigrations(database);
      if (applied.length === 0) {
        console.log("No pending DB migrations.");
      } else {
        console.log(
          JSON.stringify(
            applied.map((record) => ({
              migration: record.migration_name,
              appliedAt: record.applied_at
            })),
            null,
            2
          )
        );
      }
      return;
    }

    if (command === "migrations") {
      const applied = await listAppliedMigrations(database);
      console.log(JSON.stringify(applied, null, 2));
      return;
    }

    throw new Error(`Unknown db command: ${command}`);
  } finally {
    await database.close();
  }
}

void main();
