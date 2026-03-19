import fs from "node:fs/promises";
import path from "node:path";
import type { PoolClient, QueryResultRow } from "pg";
import { fileURLToPath } from "node:url";
import { ForgeDatabase, quoteIdentifier } from "./client.js";
import type { MigrationRecord } from "./types.js";

const migrationDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../migrations"
);

function renderMigrationSql(schema: string, sql: string): string {
  return sql.replaceAll("__SCHEMA__", quoteIdentifier(schema));
}

async function ensureMigrationTable(client: PoolClient, schema: string): Promise<void> {
  await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(schema)}`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${quoteIdentifier(schema)}.schema_migrations (
      migration_name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function listMigrationFiles(): Promise<string[]> {
  const entries = await fs.readdir(migrationDirectory);
  return entries.filter((entry) => entry.endsWith(".sql")).sort();
}

async function readAppliedMigrations(
  client: PoolClient,
  schema: string
): Promise<Set<string>> {
  const result = await client.query<MigrationRecord>(
    `SELECT migration_name, applied_at
     FROM ${quoteIdentifier(schema)}.schema_migrations`
  );

  return new Set(result.rows.map((row) => row.migration_name));
}

export async function runMigrations(
  database: ForgeDatabase
): Promise<MigrationRecord[]> {
  return database.transaction(async (client) => {
    await ensureMigrationTable(client, database.schema);

    const appliedMigrations = await readAppliedMigrations(client, database.schema);
    const migrationFiles = await listMigrationFiles();
    const appliedRecords: MigrationRecord[] = [];

    for (const migrationFile of migrationFiles) {
      if (appliedMigrations.has(migrationFile)) {
        continue;
      }

      const migrationPath = path.join(migrationDirectory, migrationFile);
      const sql = await fs.readFile(migrationPath, "utf8");
      await client.query(renderMigrationSql(database.schema, sql));

      const insertResult = await client.query<MigrationRecord>(
        `INSERT INTO ${quoteIdentifier(database.schema)}.schema_migrations (migration_name)
         VALUES ($1)
         RETURNING migration_name, applied_at`,
        [migrationFile]
      );

      appliedRecords.push(insertResult.rows[0]);
    }

    return appliedRecords;
  });
}

export async function listAppliedMigrations(
  database: ForgeDatabase
): Promise<MigrationRecord[]> {
  return database.withClient(async (client) => {
    await ensureMigrationTable(client, database.schema);
    const result = await client.query<MigrationRecord>(
      `SELECT migration_name, applied_at
       FROM ${quoteIdentifier(database.schema)}.schema_migrations
       ORDER BY applied_at ASC, migration_name ASC`
    );
    return result.rows;
  });
}

export async function dropSchema(database: ForgeDatabase): Promise<void> {
  await database.query(`DROP SCHEMA IF EXISTS ${quoteIdentifier(database.schema)} CASCADE`);
}

export async function schemaExists(database: ForgeDatabase): Promise<boolean> {
  const result = await database.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.schemata
       WHERE schema_name = $1
     ) AS exists`,
    [database.schema]
  );

  return result.rows[0]?.exists ?? false;
}
