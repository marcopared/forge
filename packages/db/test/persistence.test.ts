import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { loadForgeConfig } from "@forge/config";
import {
  createForgeDatabase,
  dropSchema,
  ForgePersistenceRepository,
  runMigrations
} from "../src/index.js";

const repoRoot = "/Users/marcoparedes/dev/forge";

test("persistence repository records a full Wave 0 lifecycle", async () => {
  const config = loadForgeConfig({ rootDir: repoRoot });
  const schema = `forge_test_${randomUUID().replace(/-/g, "")}`;
  const database = createForgeDatabase(config, { schema });

  try {
    await runMigrations(database);

    const repository = new ForgePersistenceRepository(database);

    const waveRun = await repository.createWaveRun({
      wave_id: "wave-0-live",
      packet_id: "WAVE0-SYNTHETIC",
      benchmark_id: "wave0-live-smoke",
      environment: "local",
      launch_mode: "operator-launched",
      review_mode: "human-required",
      concurrency_cap: 1,
      phase_branch: "forge/phase-0-wave0-synthetic",
      launch_window_id: "wave0-live-window-001",
      commit_sha: "abc123def456",
      status: "ready",
      decision_status: "pending",
      metadata: {
        decisionRecordRef: "files/ops/wave0-decision-record.md"
      }
    });

    const taskRun = await repository.createTaskRun({
      wave_run_id: waveRun.wave_run_id,
      task_id: "task-wave0-synthetic",
      packet_id: "WAVE0-SYNTHETIC",
      task_type: "packet",
      assigned_agent_role: "implementer",
      coding_packet_ref: "packets/manifests/WAVE0-SYNTHETIC.yaml",
      worktree_ref: "/tmp/forge/task-wave0-synthetic",
      base_branch: "forge/phase-0-wave0-synthetic",
      task_branch: "forge/task-wave0-synthetic",
      dependencies: [],
      status: "drafted"
    });

    await repository.transitionTaskRunState({
      task_run_id: taskRun.task_run_id,
      to_status: "queued",
      actor_type: "orchestrator",
      transition_reason: "graph approved"
    });
    await repository.transitionTaskRunState({
      task_run_id: taskRun.task_run_id,
      to_status: "scheduled",
      actor_type: "orchestrator",
      transition_reason: "dependencies met"
    });
    await repository.transitionTaskRunState({
      task_run_id: taskRun.task_run_id,
      to_status: "provisioning",
      actor_type: "runtime-manager",
      transition_reason: "worktree requested"
    });
    await repository.transitionTaskRunState({
      task_run_id: taskRun.task_run_id,
      to_status: "running",
      actor_type: "runtime-manager",
      transition_reason: "worktree ready"
    });
    await repository.transitionTaskRunState({
      task_run_id: taskRun.task_run_id,
      to_status: "awaiting_validation",
      actor_type: "agent-runner",
      transition_reason: "agent complete"
    });
    await repository.transitionTaskRunState({
      task_run_id: taskRun.task_run_id,
      to_status: "validating",
      actor_type: "validator-runner",
      transition_reason: "validator start"
    });

    await repository.upsertValidatorResult({
      task_run_id: taskRun.task_run_id,
      validator_id: "compilation",
      validator_layer: "layer_1_correctness",
      validator_tool: "run_typecheck",
      blocking: true,
      status: "pass",
      message: "tsc --noEmit passed"
    });
    await repository.upsertValidatorResult({
      task_run_id: taskRun.task_run_id,
      validator_id: "lint",
      validator_layer: "layer_1_correctness",
      validator_tool: "run_lint",
      blocking: true,
      status: "pass",
      message: "eslint passed"
    });
    await repository.upsertValidatorResult({
      task_run_id: taskRun.task_run_id,
      validator_id: "evidence_completeness",
      validator_layer: "layer_4_evidence",
      validator_tool: "evidence_check",
      blocking: true,
      status: "pass",
      message: "required evidence present"
    });

    await repository.createPolicyDecision({
      wave_run_id: waveRun.wave_run_id,
      task_run_id: taskRun.task_run_id,
      agent_role: "implementer",
      action_class: "shell.exec",
      tool_name: "pnpm",
      target_path: "packages/shared/src/synthetic/hello.ts",
      decision: "allow",
      reason: "within synthetic scope"
    });

    await repository.createAuditEvent({
      wave_run_id: waveRun.wave_run_id,
      task_run_id: taskRun.task_run_id,
      source_component: "orchestrator",
      event_type: "task.state_changed",
      sequence_number: 1,
      message: "Task entered validating"
    });
    await repository.createAuditEvent({
      wave_run_id: waveRun.wave_run_id,
      task_run_id: taskRun.task_run_id,
      source_component: "validator-runner",
      event_type: "validation.completed",
      sequence_number: 2,
      message: "Blocking validators passed"
    });

    await repository.createOperatorEvent({
      wave_run_id: waveRun.wave_run_id,
      event_kind: "decision_record_opened",
      actor_name: "Operator",
      authority_role: "primary-launch-authority",
      decision: "pending",
      outcome: "record-opened"
    });
    await repository.createOperatorEvent({
      wave_run_id: waveRun.wave_run_id,
      task_run_id: taskRun.task_run_id,
      event_kind: "go_entered",
      actor_name: "Operator",
      authority_role: "primary-launch-authority",
      decision: "go",
      outcome: "launch-authorized",
      decision_latency_ms: 120000
    });

    const evidenceBundle = await repository.upsertEvidenceBundle({
      wave_run_id: waveRun.wave_run_id,
      task_run_id: taskRun.task_run_id,
      packet_id: "WAVE0-SYNTHETIC",
      status: "complete",
      completeness_ratio: 1,
      mandatory_item_count: 6,
      present_item_count: 6,
      bundle_ref: "/Users/marcoparedes/dev/forge/var/evidence/wave0-live/bundle.json",
      summary: {
        diff: true,
        auditTrail: true,
        validatorOutputs: true
      },
      completed_at: new Date()
    });

    await repository.upsertEvidenceItem({
      evidence_bundle_id: evidenceBundle.evidence_bundle_id,
      task_run_id: taskRun.task_run_id,
      evidence_type: "audit_trail",
      source: "tool_broker",
      tier: 1,
      required: true,
      present: true
    });
    await repository.upsertEvidenceItem({
      evidence_bundle_id: evidenceBundle.evidence_bundle_id,
      task_run_id: taskRun.task_run_id,
      evidence_type: "worktree_identity",
      source: "runtime_manager",
      tier: 1,
      required: true,
      present: true
    });

    await repository.transitionTaskRunState({
      task_run_id: taskRun.task_run_id,
      to_status: "succeeded",
      actor_type: "validator-runner",
      transition_reason: "validators passed and evidence complete"
    });
    await repository.transitionTaskRunState({
      task_run_id: taskRun.task_run_id,
      to_status: "merging",
      actor_type: "orchestrator",
      transition_reason: "merge-back start"
    });
    await repository.transitionTaskRunState({
      task_run_id: taskRun.task_run_id,
      to_status: "merged",
      actor_type: "orchestrator",
      transition_reason: "synthetic diff merged",
      completed_at: new Date()
    });

    await repository.updateWaveRunStatus({
      wave_run_id: waveRun.wave_run_id,
      status: "completed",
      decision_status: "go"
    });
    await repository.createOperatorEvent({
      wave_run_id: waveRun.wave_run_id,
      event_kind: "closeout",
      actor_name: "Operator",
      authority_role: "primary-launch-authority",
      decision: "advance_to_wave1_planning",
      outcome: "closeout-recorded",
      escalation_clearance_ms: 0
    });
    await repository.updateWaveRunStatus({
      wave_run_id: waveRun.wave_run_id,
      status: "closed",
      decision_status: "closed",
      final_disposition: "advance_to_wave1_planning",
      rollback_performed: false,
      completed_at: new Date()
    });

    const lifecycle = await repository.getWaveRunLifecycle(waveRun.wave_run_id);

    assert.equal(lifecycle.waveRun.wave_id, "wave-0-live");
    assert.equal(lifecycle.waveRun.final_disposition, "advance_to_wave1_planning");
    assert.equal(lifecycle.taskRuns.length, 1);
    assert.equal(lifecycle.taskRuns[0]?.status, "merged");
    assert.equal(lifecycle.taskTransitions.length, 9);
    assert.equal(lifecycle.validatorResults.length, 3);
    assert.equal(lifecycle.evidenceBundles.length, 1);
    assert.equal(lifecycle.evidenceItems.length, 2);
    assert.equal(lifecycle.policyDecisions.length, 1);
    assert.equal(lifecycle.auditEvents.length, 2);
    assert.equal(lifecycle.operatorEvents.length, 3);
    assert.equal(lifecycle.summary.blockingValidatorFailures, 0);
    assert.equal(lifecycle.summary.policyDecisionCounts.allow, 1);
    assert.equal(lifecycle.summary.policyDecisionCounts.deny, 0);
    assert.equal(lifecycle.summary.policyDecisionCounts.escalate, 0);
    assert.equal(lifecycle.summary.evidenceCompleteness, 1);
  } finally {
    await dropSchema(database);
    await database.close();
  }
});
