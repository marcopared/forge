import { randomUUID } from "node:crypto";
import type {
  CreateAuditEventInput,
  CreateOperatorEventInput,
  CreatePolicyDecisionInput,
  DbJson,
  ForgePersistenceRepository
} from "@forge/db";
import type { PolicyDecisionRecord } from "@forge/policy-engine";
import {
  LocalFileStorage,
  type RunStorageScope
} from "@forge/storage";
import type {
  AuditTrailEvent,
  AuditTrailEventInput,
  OperatorInterventionRecord,
  StateTransitionRecord
} from "./types.js";

function toDbPolicyDecision(decision: string): CreatePolicyDecisionInput["decision"] {
  const normalized = decision.toLowerCase();

  if (normalized === "allow") {
    return "allow";
  }

  if (normalized === "escalate") {
    return "escalate";
  }

  return "deny";
}

function toDbJson(value: unknown): DbJson {
  return JSON.parse(JSON.stringify(value ?? {})) as DbJson;
}

function toDbAuditEvent(input: AuditTrailEvent): CreateAuditEventInput {
  return {
    audit_event_id: input.auditEventId,
    wave_run_id: input.waveRunId,
    task_run_id: input.taskRunId,
    source_component: input.sourceComponent,
    event_type: input.eventType,
    event_level: input.eventLevel,
    sequence_number: input.sequenceNumber,
    message: input.message,
    payload: toDbJson(input.payload)
  };
}

export interface Wave0AuditWriterPaths {
  consolidatedLogPath: string;
  toolCallsPath: string;
  stateTransitionsPath: string;
  operatorEventsPath: string;
  policyDecisionsPath: string;
}

export interface ToolAuditLike {
  source_component: string;
  event_type: string;
  event_level: "info" | "warn" | "error";
  sequence_number: number;
  message: string;
  payload: Record<string, unknown>;
}

export class Wave0AuditWriter {
  private sequenceNumber = 0;
  readonly paths: Wave0AuditWriterPaths;

  constructor(
    private readonly storage: LocalFileStorage,
    readonly scope: RunStorageScope,
    private readonly repository?: ForgePersistenceRepository
  ) {
    this.paths = {
      consolidatedLogPath: this.storage.resolvePath(
        scope,
        "audit",
        "events.jsonl"
      ),
      toolCallsPath: this.storage.resolvePath(
        scope,
        "audit",
        "tool-calls.jsonl"
      ),
      stateTransitionsPath: this.storage.resolvePath(
        scope,
        "audit",
        "state-transitions.jsonl"
      ),
      operatorEventsPath: this.storage.resolvePath(
        scope,
        "audit",
        "operator-interventions.jsonl"
      ),
      policyDecisionsPath: this.storage.resolvePath(
        scope,
        "audit",
        "policy-decisions.jsonl"
      )
    };
  }

  private nextSequenceNumber(): number {
    this.sequenceNumber += 1;
    return this.sequenceNumber;
  }

  async recordEvent(input: AuditTrailEventInput): Promise<AuditTrailEvent> {
    const event: AuditTrailEvent = {
      auditEventId: randomUUID(),
      waveRunId: this.scope.waveRunId,
      taskRunId: this.scope.taskRunId,
      sequenceNumber: this.nextSequenceNumber(),
      category: input.category,
      sourceComponent: input.sourceComponent,
      eventType: input.eventType,
      eventLevel: input.eventLevel ?? "info",
      message: input.message,
      payload: input.payload ?? {},
      createdAt: new Date().toISOString()
    };

    await this.storage.appendJsonLine({
      scope: this.scope,
      area: "audit",
      relativePath: "events.jsonl",
      value: event
    });

    if (this.repository) {
      await this.repository.createAuditEvent(toDbAuditEvent(event));
    }

    return event;
  }

  async recordToolAudit(record: ToolAuditLike): Promise<AuditTrailEvent> {
    await this.storage.appendJsonLine({
      scope: this.scope,
      area: "audit",
      relativePath: "tool-calls.jsonl",
      value: record
    });

    return await this.recordEvent({
      category: "tool_call",
      sourceComponent: record.source_component,
      eventType: record.event_type,
      eventLevel: record.event_level,
      message: record.message,
      payload: {
        upstreamSequenceNumber: record.sequence_number,
        ...record.payload
      }
    });
  }

  async recordPolicyDecision(record: PolicyDecisionRecord): Promise<AuditTrailEvent> {
    await this.storage.appendJsonLine({
      scope: this.scope,
      area: "audit",
      relativePath: "policy-decisions.jsonl",
      value: record
    });

    if (this.repository) {
      await this.repository.createPolicyDecision({
        wave_run_id: this.scope.waveRunId,
        task_run_id: this.scope.taskRunId,
        agent_role: record.agentRole,
        action_class: record.actionClass,
        tool_name: record.toolName,
        target_path: record.targetPaths[0] ?? null,
        decision: toDbPolicyDecision(record.decision),
        reason: record.reason,
        scope_status: record.scopeStatus,
        request_payload: {
          targetPaths: record.targetPaths
        },
        result_payload: {
          evaluatedAt: record.evaluatedAt,
          packetId: record.packetId
        }
      });
    }

    return await this.recordEvent({
      category: "policy_decision",
      sourceComponent: "policy-engine",
      eventType: "policy.decision",
      eventLevel: record.decision === "ALLOW" ? "info" : "warn",
      message: `${record.toolName} -> ${record.decision}`,
      payload: {
        toolName: record.toolName,
        decision: record.decision,
        reason: record.reason,
        targetPaths: record.targetPaths,
        scopeStatus: record.scopeStatus,
        agentRole: record.agentRole
      }
    });
  }

  async recordStateTransition(
    transition: StateTransitionRecord
  ): Promise<AuditTrailEvent> {
    await this.storage.appendJsonLine({
      scope: this.scope,
      area: "audit",
      relativePath: "state-transitions.jsonl",
      value: transition
    });

    return await this.recordEvent({
      category: "state_transition",
      sourceComponent: transition.actorType,
      eventType: "task.state_changed",
      message: `${transition.fromStatus ?? "null"} -> ${transition.toStatus}`,
      payload: {
        fromStatus: transition.fromStatus,
        toStatus: transition.toStatus,
        actorType: transition.actorType,
        actorName: transition.actorName ?? null,
        transitionReason: transition.transitionReason ?? null,
        classification: transition.classification ?? null,
        metadata: transition.metadata ?? {}
      }
    });
  }

  async recordOperatorIntervention(
    intervention: OperatorInterventionRecord
  ): Promise<AuditTrailEvent> {
    await this.storage.appendJsonLine({
      scope: this.scope,
      area: "audit",
      relativePath: "operator-interventions.jsonl",
      value: intervention
    });

    if (this.repository) {
      const payload: CreateOperatorEventInput = {
        wave_run_id: this.scope.waveRunId,
        task_run_id: this.scope.taskRunId,
        event_kind: "operator_intervention",
        actor_name: intervention.actorName,
        authority_role: intervention.authorityRole ?? null,
        trigger: intervention.trigger ?? null,
        decision: intervention.decision ?? null,
        outcome: intervention.outcome ?? null,
        notes: intervention.notes ?? null,
        decision_latency_ms: intervention.decisionLatencyMs ?? null,
        escalation_clearance_ms: intervention.escalationClearanceMs ?? null,
        metadata: toDbJson(intervention.metadata ?? {})
      };
      await this.repository.createOperatorEvent(payload);
    }

    return await this.recordEvent({
      category: "operator_intervention",
      sourceComponent: "operator-surface",
      eventType: "operator.intervention",
      message: intervention.outcome ?? intervention.decision ?? "operator intervention",
      payload: {
        actorName: intervention.actorName,
        authorityRole: intervention.authorityRole ?? null,
        trigger: intervention.trigger ?? null,
        decision: intervention.decision ?? null,
        outcome: intervention.outcome ?? null,
        notes: intervention.notes ?? null,
        decisionLatencyMs: intervention.decisionLatencyMs ?? null,
        escalationClearanceMs: intervention.escalationClearanceMs ?? null,
        metadata: intervention.metadata ?? {}
      }
    });
  }
}
