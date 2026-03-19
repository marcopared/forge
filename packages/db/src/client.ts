import { Pool, type PoolClient, type PoolConfig, type QueryResultRow } from "pg";
import { randomUUID } from "node:crypto";
import type {
  ForgeConfig,
  ForgePackageDescriptor
} from "@forge/shared";
import {
  defineForgePackage
} from "@forge/shared";
import type {
  DatabaseTargets,
  ForgeDatabaseConnectionOptions
} from "./types.js";

export const dbPackage: ForgePackageDescriptor = defineForgePackage({
  name: "@forge/db",
  purpose: "Postgres-backed persistence for local Wave 0 runs and closeout records.",
  dependsOn: ["@forge/shared", "@forge/config"],
  status: "skeleton"
});

export class ForgeDatabase {
  readonly pool: Pool;
  readonly schema: string;

  constructor(options: ForgeDatabaseConnectionOptions) {
    this.schema = options.schema;

    const poolConfig: PoolConfig = {
      connectionString: options.connectionString,
      application_name: "forge-local-wave0"
    };

    this.pool = new Pool(poolConfig);
  }

  async query<TResult extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = []
  ) {
    return this.pool.query<TResult>(text, params);
  }

  async withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }

  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    return this.withClient(async (client) => {
      await client.query("BEGIN");

      try {
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    });
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export function createDatabaseTargets(config: ForgeConfig): DatabaseTargets {
  return {
    postgresUrl: config.postgres.url,
    postgresDatabase: config.postgres.database,
    postgresSchema: config.postgres.schema,
    redisUrl: config.redis.url
  };
}

export function createDatabaseConnectionOptions(
  config: ForgeConfig,
  overrides: Partial<ForgeDatabaseConnectionOptions> = {}
): ForgeDatabaseConnectionOptions {
  return {
    connectionString: overrides.connectionString ?? config.postgres.url,
    schema: overrides.schema ?? config.postgres.schema
  };
}

export function createForgeDatabase(
  config: ForgeConfig,
  overrides: Partial<ForgeDatabaseConnectionOptions> = {}
): ForgeDatabase {
  return new ForgeDatabase(createDatabaseConnectionOptions(config, overrides));
}

export function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }

  return `"${identifier.replace(/"/g, "\"\"")}"`;
}

export function qualifyTable(schema: string, tableName: string): string {
  return `${quoteIdentifier(schema)}.${quoteIdentifier(tableName)}`;
}

export function createRecordId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}
