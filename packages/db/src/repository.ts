import type { QueryResultRow } from "pg";
import type { ForgeDatabase } from "./client.js";
import { createRecordId, qualifyTable } from "./client.js";
import type {
  AuditEventRecord,
  CreateAuditEventInput,
  CreateOperatorEventInput,
  CreatePolicyDecisionInput,
  CreateTaskRunInput,
  CreateWaveRunInput,
  DbJson,
  EvidenceBundleRecord,
  EvidenceItemRecord,
  ListWaveRunsInput,
  OperatorEventRecord,
  PolicyDecisionRecord,
  TaskRunRecord,
  TaskRunStatus,
  TaskStateTransitionRecord,
  TransitionTaskRunStateInput,
  UpdateWaveRunStatusInput,
  UpsertEvidenceBundleInput,
  UpsertEvidenceItemInput,
  UpsertValidatorResultInput,
  ValidatorResultRecord,
  WaveRunLifecycle,
  WaveRunRecord
} from "./types.js";

const allowedTaskTransitions: Readonly<Record<TaskRunStatus, readonly TaskRunStatus[]>> = {
  drafted: ["queued", "canceled"],
  queued: ["scheduled", "requeued", "canceled", "blocked"],
  scheduled: ["provisioning", "failed", "escalated"],
  provisioning: ["running", "failed", "escalated"],
  running: ["awaiting_validation", "failed", "escalated"],
  awaiting_validation: ["validating", "failed", "escalated"],
  validating: ["awaiting_review", "repairing", "succeeded", "escalated", "failed"],
  awaiting_review: ["succeeded", "changes_requested", "blocked", "escalated"],
  changes_requested: ["running", "canceled"],
  repairing: ["running", "blocked", "escalated", "failed"],
  succeeded: ["merging", "blocked"],
  merging: ["merged", "conflict_resolution", "blocked", "failed"],
  merged: [],
  conflict_resolution: ["merging", "blocked", "failed"],
  requeued: ["queued", "canceled"],
  blocked: ["escalated", "requeued", "canceled"],
  escalated: ["requeued", "canceled", "failed"],
  canceled: [],
  failed: []
};

function toJson(value: DbJson | undefined): DbJson {
  return value ?? {};
}

function assertTransitionAllowed(
  fromStatus: TaskRunStatus,
  toStatus: TaskRunStatus
): void {
  const allowed = allowedTaskTransitions[fromStatus];

  if (!allowed.includes(toStatus)) {
    throw new Error(`Illegal task transition: ${fromStatus} -> ${toStatus}`);
  }
}

async function one<TResult extends QueryResultRow>(
  database: ForgeDatabase,
  text: string,
  params: unknown[]
): Promise<TResult> {
  const result = await database.query<TResult>(text, params);

  if (result.rows.length !== 1) {
    throw new Error(`Expected exactly one row, received ${result.rows.length}.`);
  }

  return result.rows[0];
}

export class ForgePersistenceRepository {
  constructor(private readonly database: ForgeDatabase) {}

  async getWaveRun(waveRunId: string): Promise<WaveRunRecord> {
    const table = qualifyTable(this.database.schema, "wave_runs");
    return one<WaveRunRecord>(
      this.database,
      `SELECT * FROM ${table} WHERE wave_run_id = $1`,
      [waveRunId]
    );
  }

  async listWaveRuns(input: ListWaveRunsInput = {}): Promise<WaveRunRecord[]> {
    const table = qualifyTable(this.database.schema, "wave_runs");
    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (input.wave_id) {
      params.push(input.wave_id);
      whereClauses.push(`wave_id = $${params.length}`);
    }

    if (input.packet_id) {
      params.push(input.packet_id);
      whereClauses.push(`packet_id = $${params.length}`);
    }

    if (input.status) {
      params.push(input.status);
      whereClauses.push(`status = $${params.length}`);
    }

    const limit = Math.max(1, input.limit ?? 20);
    params.push(limit);

    const whereSql =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const result = await this.database.query<WaveRunRecord>(
      `SELECT * FROM ${table}
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params
    );

    return result.rows;
  }

  async createWaveRun(input: CreateWaveRunInput): Promise<WaveRunRecord> {
    const table = qualifyTable(this.database.schema, "wave_runs");
    const waveRunId = input.wave_run_id ?? createRecordId("wave");

    return one<WaveRunRecord>(
      this.database,
      `INSERT INTO ${table} (
         wave_run_id,
         wave_id,
         packet_id,
         benchmark_id,
         environment,
         launch_mode,
         review_mode,
         concurrency_cap,
         phase_branch,
         launch_window_id,
         commit_sha,
         status,
         decision_status,
         metadata,
         started_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
       )
       RETURNING *`,
      [
        waveRunId,
        input.wave_id,
        input.packet_id,
        input.benchmark_id ?? null,
        input.environment,
        input.launch_mode,
        input.review_mode,
        input.concurrency_cap,
        input.phase_branch,
        input.launch_window_id ?? null,
        input.commit_sha ?? null,
        input.status ?? "drafted",
        input.decision_status ?? "pending",
        JSON.stringify(toJson(input.metadata)),
        input.started_at ?? new Date()
      ]
    );
  }

  async updateWaveRunStatus(input: UpdateWaveRunStatusInput): Promise<WaveRunRecord> {
    const table = qualifyTable(this.database.schema, "wave_runs");

    return one<WaveRunRecord>(
      this.database,
      `UPDATE ${table}
       SET status = $2,
           decision_status = COALESCE($3, decision_status),
           final_disposition = COALESCE($4, final_disposition),
           rollback_performed = COALESCE($5, rollback_performed),
           completed_at = COALESCE($6, completed_at),
           metadata = CASE WHEN $7::jsonb = '{}'::jsonb THEN metadata ELSE $7::jsonb END,
           updated_at = NOW()
       WHERE wave_run_id = $1
       RETURNING *`,
      [
        input.wave_run_id,
        input.status,
        input.decision_status ?? null,
        input.final_disposition ?? null,
        input.rollback_performed ?? null,
        input.completed_at ?? null,
        JSON.stringify(toJson(input.metadata))
      ]
    );
  }

  async createTaskRun(input: CreateTaskRunInput): Promise<TaskRunRecord> {
    const table = qualifyTable(this.database.schema, "task_runs");
    const taskRunId = input.task_run_id ?? createRecordId("task");

    return one<TaskRunRecord>(
      this.database,
      `INSERT INTO ${table} (
         task_run_id,
         wave_run_id,
         task_id,
         packet_id,
         task_type,
         status,
         assigned_agent_role,
         coding_packet_ref,
         worktree_ref,
         evidence_bundle_ref,
         base_branch,
         task_branch,
         base_commit_sha,
         merge_commit_sha,
         dependencies,
         metadata,
         started_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16::jsonb,$17
       )
       RETURNING *`,
      [
        taskRunId,
        input.wave_run_id,
        input.task_id,
        input.packet_id,
        input.task_type,
        input.status ?? "drafted",
        input.assigned_agent_role,
        input.coding_packet_ref ?? null,
        input.worktree_ref ?? null,
        input.evidence_bundle_ref ?? null,
        input.base_branch ?? null,
        input.task_branch ?? null,
        input.base_commit_sha ?? null,
        input.merge_commit_sha ?? null,
        JSON.stringify(input.dependencies ?? []),
        JSON.stringify(toJson(input.metadata)),
        input.started_at ?? null
      ]
    );
  }

  async transitionTaskRunState(
    input: TransitionTaskRunStateInput
  ): Promise<{
    taskRun: TaskRunRecord;
    transition: TaskStateTransitionRecord;
  }> {
    const taskRunsTable = qualifyTable(this.database.schema, "task_runs");
    const transitionsTable = qualifyTable(this.database.schema, "task_state_transitions");

    return this.database.transaction(async (client) => {
      const currentResult = await client.query<TaskRunRecord>(
        `SELECT * FROM ${taskRunsTable} WHERE task_run_id = $1 FOR UPDATE`,
        [input.task_run_id]
      );

      if (currentResult.rows.length !== 1) {
        throw new Error(`Task run ${input.task_run_id} not found.`);
      }

      const currentTaskRun = currentResult.rows[0];
      assertTransitionAllowed(currentTaskRun.status, input.to_status);

      const updatedTaskRunResult = await client.query<TaskRunRecord>(
        `UPDATE ${taskRunsTable}
         SET status = $2,
             failure_classification = CASE
               WHEN $3::text IS NULL THEN failure_classification
               ELSE $3
             END,
             failure_message = CASE
               WHEN $4::text IS NULL THEN failure_message
               ELSE $4
             END,
             completed_at = COALESCE($5, completed_at),
             started_at = CASE
               WHEN $2 = 'running' AND started_at IS NULL THEN NOW()
               ELSE started_at
             END,
             updated_at = NOW()
         WHERE task_run_id = $1
         RETURNING *`,
        [
          input.task_run_id,
          input.to_status,
          input.classification ?? null,
          input.failure_message ?? null,
          input.completed_at ?? null
        ]
      );

      const transitionResult = await client.query<TaskStateTransitionRecord>(
        `INSERT INTO ${transitionsTable} (
           task_run_id,
           from_status,
           to_status,
           transition_reason,
           actor_type,
           actor_name,
           classification,
           metadata
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
         RETURNING *`,
        [
          input.task_run_id,
          currentTaskRun.status,
          input.to_status,
          input.transition_reason ?? null,
          input.actor_type,
          input.actor_name ?? null,
          input.classification ?? null,
          JSON.stringify(toJson(input.metadata))
        ]
      );

      return {
        taskRun: updatedTaskRunResult.rows[0],
        transition: transitionResult.rows[0]
      };
    });
  }

  async upsertValidatorResult(
    input: UpsertValidatorResultInput
  ): Promise<ValidatorResultRecord> {
    const table = qualifyTable(this.database.schema, "validator_results");
    const validatorResultId = input.validator_result_id ?? createRecordId("validator");

    return one<ValidatorResultRecord>(
      this.database,
      `INSERT INTO ${table} (
         validator_result_id,
         task_run_id,
         validator_id,
         validator_layer,
         validator_tool,
         blocking,
         status,
         scope,
         condition,
         message,
         details,
         started_at,
         completed_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13
       )
       ON CONFLICT (task_run_id, validator_id)
       DO UPDATE SET
         validator_layer = EXCLUDED.validator_layer,
         validator_tool = EXCLUDED.validator_tool,
         blocking = EXCLUDED.blocking,
         status = EXCLUDED.status,
         scope = EXCLUDED.scope,
         condition = EXCLUDED.condition,
         message = EXCLUDED.message,
         details = EXCLUDED.details,
         started_at = EXCLUDED.started_at,
         completed_at = EXCLUDED.completed_at,
         updated_at = NOW()
       RETURNING *`,
      [
        validatorResultId,
        input.task_run_id,
        input.validator_id,
        input.validator_layer,
        input.validator_tool,
        input.blocking,
        input.status,
        input.scope ?? null,
        input.condition ?? null,
        input.message ?? null,
        JSON.stringify(toJson(input.details)),
        input.started_at ?? null,
        input.completed_at ?? null
      ]
    );
  }

  async upsertEvidenceBundle(
    input: UpsertEvidenceBundleInput
  ): Promise<EvidenceBundleRecord> {
    const table = qualifyTable(this.database.schema, "evidence_bundles");
    const evidenceBundleId = input.evidence_bundle_id ?? createRecordId("bundle");

    return one<EvidenceBundleRecord>(
      this.database,
      `INSERT INTO ${table} (
         evidence_bundle_id,
         wave_run_id,
         task_run_id,
         packet_id,
         status,
         completeness_ratio,
         mandatory_item_count,
         present_item_count,
         bundle_ref,
         summary,
         completed_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11
       )
       ON CONFLICT (task_run_id)
       DO UPDATE SET
         status = EXCLUDED.status,
         completeness_ratio = EXCLUDED.completeness_ratio,
         mandatory_item_count = EXCLUDED.mandatory_item_count,
         present_item_count = EXCLUDED.present_item_count,
         bundle_ref = EXCLUDED.bundle_ref,
         summary = EXCLUDED.summary,
         completed_at = EXCLUDED.completed_at,
         updated_at = NOW()
       RETURNING *`,
      [
        evidenceBundleId,
        input.wave_run_id,
        input.task_run_id,
        input.packet_id,
        input.status,
        input.completeness_ratio.toFixed(4),
        input.mandatory_item_count,
        input.present_item_count,
        input.bundle_ref ?? null,
        JSON.stringify(toJson(input.summary)),
        input.completed_at ?? null
      ]
    );
  }

  async upsertEvidenceItem(input: UpsertEvidenceItemInput): Promise<EvidenceItemRecord> {
    const table = qualifyTable(this.database.schema, "evidence_items");
    const evidenceItemId = input.evidence_item_id ?? createRecordId("evidence");

    return one<EvidenceItemRecord>(
      this.database,
      `INSERT INTO ${table} (
         evidence_item_id,
         evidence_bundle_id,
         task_run_id,
         evidence_type,
         source,
         tier,
         required,
         present,
         condition,
         storage_ref,
         metadata
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb
       )
       ON CONFLICT (evidence_bundle_id, evidence_type, source)
       DO UPDATE SET
         tier = EXCLUDED.tier,
         required = EXCLUDED.required,
         present = EXCLUDED.present,
         condition = EXCLUDED.condition,
         storage_ref = EXCLUDED.storage_ref,
         metadata = EXCLUDED.metadata,
         updated_at = NOW()
       RETURNING *`,
      [
        evidenceItemId,
        input.evidence_bundle_id,
        input.task_run_id,
        input.evidence_type,
        input.source,
        input.tier,
        input.required,
        input.present,
        input.condition ?? null,
        input.storage_ref ?? null,
        JSON.stringify(toJson(input.metadata))
      ]
    );
  }

  async createPolicyDecision(
    input: CreatePolicyDecisionInput
  ): Promise<PolicyDecisionRecord> {
    const table = qualifyTable(this.database.schema, "policy_decisions");
    const policyDecisionId = input.policy_decision_id ?? createRecordId("policy");

    return one<PolicyDecisionRecord>(
      this.database,
      `INSERT INTO ${table} (
         policy_decision_id,
         wave_run_id,
         task_run_id,
         agent_role,
         action_class,
         tool_name,
         target_path,
         decision,
         reason,
         scope_status,
         request_payload,
         result_payload
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb
       )
       RETURNING *`,
      [
        policyDecisionId,
        input.wave_run_id,
        input.task_run_id ?? null,
        input.agent_role,
        input.action_class,
        input.tool_name,
        input.target_path ?? null,
        input.decision,
        input.reason,
        input.scope_status ?? null,
        JSON.stringify(toJson(input.request_payload)),
        JSON.stringify(toJson(input.result_payload))
      ]
    );
  }

  async createAuditEvent(input: CreateAuditEventInput): Promise<AuditEventRecord> {
    const table = qualifyTable(this.database.schema, "audit_events");
    const auditEventId = input.audit_event_id ?? createRecordId("audit");

    return one<AuditEventRecord>(
      this.database,
      `INSERT INTO ${table} (
         audit_event_id,
         wave_run_id,
         task_run_id,
         source_component,
         event_type,
         event_level,
         sequence_number,
         message,
         payload
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb
       )
       RETURNING *`,
      [
        auditEventId,
        input.wave_run_id,
        input.task_run_id ?? null,
        input.source_component,
        input.event_type,
        input.event_level ?? "info",
        String(input.sequence_number),
        input.message,
        JSON.stringify(toJson(input.payload))
      ]
    );
  }

  async createOperatorEvent(
    input: CreateOperatorEventInput
  ): Promise<OperatorEventRecord> {
    const table = qualifyTable(this.database.schema, "operator_events");
    const operatorEventId = input.operator_event_id ?? createRecordId("operator");

    return one<OperatorEventRecord>(
      this.database,
      `INSERT INTO ${table} (
         operator_event_id,
         wave_run_id,
         task_run_id,
         event_kind,
         actor_name,
         authority_role,
         trigger,
         decision,
         outcome,
         notes,
         decision_latency_ms,
         escalation_clearance_ms,
         metadata
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb
       )
       RETURNING *`,
      [
        operatorEventId,
        input.wave_run_id,
        input.task_run_id ?? null,
        input.event_kind,
        input.actor_name,
        input.authority_role ?? null,
        input.trigger ?? null,
        input.decision ?? null,
        input.outcome ?? null,
        input.notes ?? null,
        input.decision_latency_ms ?? null,
        input.escalation_clearance_ms ?? null,
        JSON.stringify(toJson(input.metadata))
      ]
    );
  }

  async getWaveRunLifecycle(waveRunId: string): Promise<WaveRunLifecycle> {
    const waveRunsTable = qualifyTable(this.database.schema, "wave_runs");
    const taskRunsTable = qualifyTable(this.database.schema, "task_runs");
    const taskTransitionsTable = qualifyTable(this.database.schema, "task_state_transitions");
    const validatorResultsTable = qualifyTable(this.database.schema, "validator_results");
    const evidenceBundlesTable = qualifyTable(this.database.schema, "evidence_bundles");
    const evidenceItemsTable = qualifyTable(this.database.schema, "evidence_items");
    const policyDecisionsTable = qualifyTable(this.database.schema, "policy_decisions");
    const auditEventsTable = qualifyTable(this.database.schema, "audit_events");
    const operatorEventsTable = qualifyTable(this.database.schema, "operator_events");

    const [
      waveRun,
      taskRuns,
      taskTransitions,
      validatorResults,
      evidenceBundles,
      evidenceItems,
      policyDecisions,
      auditEvents,
      operatorEvents
    ] = await Promise.all([
      one<WaveRunRecord>(
        this.database,
        `SELECT * FROM ${waveRunsTable} WHERE wave_run_id = $1`,
        [waveRunId]
      ),
      this.database
        .query<TaskRunRecord>(
          `SELECT * FROM ${taskRunsTable}
           WHERE wave_run_id = $1
           ORDER BY created_at ASC`,
          [waveRunId]
        )
        .then((result) => result.rows),
      this.database
        .query<TaskStateTransitionRecord>(
          `SELECT transitions.*
           FROM ${taskTransitionsTable} AS transitions
           INNER JOIN ${taskRunsTable} AS tasks
             ON tasks.task_run_id = transitions.task_run_id
           WHERE tasks.wave_run_id = $1
           ORDER BY transitions.created_at ASC, transitions.task_state_transition_id ASC`,
          [waveRunId]
        )
        .then((result) => result.rows),
      this.database
        .query<ValidatorResultRecord>(
          `SELECT validators.*
           FROM ${validatorResultsTable} AS validators
           INNER JOIN ${taskRunsTable} AS tasks
             ON tasks.task_run_id = validators.task_run_id
           WHERE tasks.wave_run_id = $1
           ORDER BY validators.created_at ASC`,
          [waveRunId]
        )
        .then((result) => result.rows),
      this.database
        .query<EvidenceBundleRecord>(
          `SELECT * FROM ${evidenceBundlesTable}
           WHERE wave_run_id = $1
           ORDER BY created_at ASC`,
          [waveRunId]
        )
        .then((result) => result.rows),
      this.database
        .query<EvidenceItemRecord>(
          `SELECT items.*
           FROM ${evidenceItemsTable} AS items
           INNER JOIN ${evidenceBundlesTable} AS bundles
             ON bundles.evidence_bundle_id = items.evidence_bundle_id
           WHERE bundles.wave_run_id = $1
           ORDER BY items.created_at ASC`,
          [waveRunId]
        )
        .then((result) => result.rows),
      this.database
        .query<PolicyDecisionRecord>(
          `SELECT * FROM ${policyDecisionsTable}
           WHERE wave_run_id = $1
           ORDER BY created_at ASC`,
          [waveRunId]
        )
        .then((result) => result.rows),
      this.database
        .query<AuditEventRecord>(
          `SELECT * FROM ${auditEventsTable}
           WHERE wave_run_id = $1
           ORDER BY sequence_number ASC`,
          [waveRunId]
        )
        .then((result) => result.rows),
      this.database
        .query<OperatorEventRecord>(
          `SELECT * FROM ${operatorEventsTable}
           WHERE wave_run_id = $1
           ORDER BY created_at ASC`,
          [waveRunId]
        )
        .then((result) => result.rows)
    ]);

    const blockingValidatorFailures = validatorResults.filter(
      (result) => result.blocking && (result.status === "fail" || result.status === "error")
    ).length;
    const evidenceCompleteness =
      evidenceBundles.length === 0
        ? 0
        : evidenceBundles.reduce(
            (sum, bundle) => sum + Number.parseFloat(bundle.completeness_ratio),
            0
          ) / evidenceBundles.length;
    const policyDecisionCounts = policyDecisions.reduce<
      Record<"allow" | "deny" | "escalate", number>
    >(
      (accumulator, decision) => {
        accumulator[decision.decision] += 1;
        return accumulator;
      },
      { allow: 0, deny: 0, escalate: 0 }
    );

    return {
      waveRun,
      taskRuns,
      taskTransitions,
      validatorResults,
      evidenceBundles,
      evidenceItems,
      policyDecisions,
      auditEvents,
      operatorEvents,
      summary: {
        taskCount: taskRuns.length,
        blockingValidatorFailures,
        evidenceCompleteness,
        policyDecisionCounts,
        auditEventCount: auditEvents.length,
        operatorInterventionCount: operatorEvents.length
      }
    };
  }
}
