CREATE SCHEMA IF NOT EXISTS __SCHEMA__;

CREATE TABLE IF NOT EXISTS __SCHEMA__.schema_migrations (
  migration_name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS __SCHEMA__.wave_runs (
  wave_run_id TEXT PRIMARY KEY,
  wave_id TEXT NOT NULL,
  packet_id TEXT NOT NULL,
  benchmark_id TEXT,
  environment TEXT NOT NULL,
  launch_mode TEXT NOT NULL,
  review_mode TEXT NOT NULL,
  concurrency_cap INTEGER NOT NULL,
  phase_branch TEXT NOT NULL,
  launch_window_id TEXT,
  commit_sha TEXT,
  status TEXT NOT NULL CHECK (
    status IN (
      'drafted',
      'ready',
      'active',
      'paused',
      'frozen',
      'aborted',
      'rolled_back',
      'completed',
      'closed'
    )
  ),
  decision_status TEXT NOT NULL CHECK (
    decision_status IN (
      'pending',
      'go',
      'no_go',
      'paused',
      'frozen',
      'aborted',
      'rolled_back',
      'closed'
    )
  ),
  final_disposition TEXT CHECK (
    final_disposition IN (
      'advance_to_wave1_planning',
      'repeat_wave0_live',
      'return_to_preparation',
      'closed'
    )
  ),
  rollback_performed BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS __SCHEMA__.task_runs (
  task_run_id TEXT PRIMARY KEY,
  wave_run_id TEXT NOT NULL REFERENCES __SCHEMA__.wave_runs(wave_run_id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  packet_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN (
      'drafted',
      'queued',
      'scheduled',
      'provisioning',
      'running',
      'awaiting_validation',
      'validating',
      'awaiting_review',
      'changes_requested',
      'repairing',
      'succeeded',
      'merging',
      'merged',
      'conflict_resolution',
      'requeued',
      'blocked',
      'escalated',
      'canceled',
      'failed'
    )
  ),
  assigned_agent_role TEXT NOT NULL,
  coding_packet_ref TEXT,
  worktree_ref TEXT,
  evidence_bundle_ref TEXT,
  base_branch TEXT,
  task_branch TEXT,
  base_commit_sha TEXT,
  merge_commit_sha TEXT,
  dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  failure_classification TEXT,
  failure_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wave_run_id, task_id)
);

CREATE TABLE IF NOT EXISTS __SCHEMA__.task_state_transitions (
  task_state_transition_id BIGSERIAL PRIMARY KEY,
  task_run_id TEXT NOT NULL REFERENCES __SCHEMA__.task_runs(task_run_id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  transition_reason TEXT,
  actor_type TEXT NOT NULL,
  actor_name TEXT,
  classification TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS __SCHEMA__.validator_results (
  validator_result_id TEXT PRIMARY KEY,
  task_run_id TEXT NOT NULL REFERENCES __SCHEMA__.task_runs(task_run_id) ON DELETE CASCADE,
  validator_id TEXT NOT NULL,
  validator_layer TEXT NOT NULL,
  validator_tool TEXT NOT NULL,
  blocking BOOLEAN NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('pass', 'fail', 'error', 'skip', 'record')
  ),
  scope TEXT,
  condition TEXT,
  message TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_run_id, validator_id)
);

CREATE TABLE IF NOT EXISTS __SCHEMA__.evidence_bundles (
  evidence_bundle_id TEXT PRIMARY KEY,
  wave_run_id TEXT NOT NULL REFERENCES __SCHEMA__.wave_runs(wave_run_id) ON DELETE CASCADE,
  task_run_id TEXT NOT NULL REFERENCES __SCHEMA__.task_runs(task_run_id) ON DELETE CASCADE,
  packet_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('pending', 'complete', 'incomplete')
  ),
  completeness_ratio NUMERIC(5,4) NOT NULL,
  mandatory_item_count INTEGER NOT NULL,
  present_item_count INTEGER NOT NULL,
  bundle_ref TEXT,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (task_run_id)
);

CREATE TABLE IF NOT EXISTS __SCHEMA__.evidence_items (
  evidence_item_id TEXT PRIMARY KEY,
  evidence_bundle_id TEXT NOT NULL REFERENCES __SCHEMA__.evidence_bundles(evidence_bundle_id) ON DELETE CASCADE,
  task_run_id TEXT NOT NULL REFERENCES __SCHEMA__.task_runs(task_run_id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  source TEXT NOT NULL,
  tier INTEGER NOT NULL,
  required BOOLEAN NOT NULL,
  present BOOLEAN NOT NULL,
  condition TEXT,
  storage_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (evidence_bundle_id, evidence_type, source)
);

CREATE TABLE IF NOT EXISTS __SCHEMA__.policy_decisions (
  policy_decision_id TEXT PRIMARY KEY,
  wave_run_id TEXT NOT NULL REFERENCES __SCHEMA__.wave_runs(wave_run_id) ON DELETE CASCADE,
  task_run_id TEXT REFERENCES __SCHEMA__.task_runs(task_run_id) ON DELETE CASCADE,
  agent_role TEXT NOT NULL,
  action_class TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  target_path TEXT,
  decision TEXT NOT NULL CHECK (
    decision IN ('allow', 'deny', 'escalate')
  ),
  reason TEXT NOT NULL,
  scope_status TEXT,
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS __SCHEMA__.audit_events (
  audit_event_id TEXT PRIMARY KEY,
  wave_run_id TEXT NOT NULL REFERENCES __SCHEMA__.wave_runs(wave_run_id) ON DELETE CASCADE,
  task_run_id TEXT REFERENCES __SCHEMA__.task_runs(task_run_id) ON DELETE CASCADE,
  source_component TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_level TEXT NOT NULL CHECK (
    event_level IN ('debug', 'info', 'warn', 'error')
  ),
  sequence_number BIGINT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wave_run_id, sequence_number)
);

CREATE TABLE IF NOT EXISTS __SCHEMA__.operator_events (
  operator_event_id TEXT PRIMARY KEY,
  wave_run_id TEXT NOT NULL REFERENCES __SCHEMA__.wave_runs(wave_run_id) ON DELETE CASCADE,
  task_run_id TEXT REFERENCES __SCHEMA__.task_runs(task_run_id) ON DELETE CASCADE,
  event_kind TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  authority_role TEXT,
  trigger TEXT,
  decision TEXT,
  outcome TEXT,
  notes TEXT,
  decision_latency_ms INTEGER,
  escalation_clearance_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wave_runs_wave_id
  ON __SCHEMA__.wave_runs (wave_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_runs_wave_run_id
  ON __SCHEMA__.task_runs (wave_run_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_state_transitions_task_run_id
  ON __SCHEMA__.task_state_transitions (task_run_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_validator_results_task_run_id
  ON __SCHEMA__.validator_results (task_run_id, validator_layer, status);

CREATE INDEX IF NOT EXISTS idx_evidence_bundles_wave_run_id
  ON __SCHEMA__.evidence_bundles (wave_run_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_policy_decisions_wave_run_id
  ON __SCHEMA__.policy_decisions (wave_run_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_wave_run_id
  ON __SCHEMA__.audit_events (wave_run_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_operator_events_wave_run_id
  ON __SCHEMA__.operator_events (wave_run_id, created_at ASC);
