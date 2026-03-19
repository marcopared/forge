import type {
  TaskRunStatus,
  WaveDecisionStatus,
  WaveRunStatus
} from "@forge/db";

export const wave0WaveLifecycle: readonly WaveRunStatus[] = [
  "drafted",
  "ready",
  "active",
  "paused",
  "frozen",
  "aborted",
  "rolled_back",
  "completed",
  "closed"
] as const;

export const wave0TaskLifecycle: readonly TaskRunStatus[] = [
  "drafted",
  "queued",
  "scheduled",
  "provisioning",
  "running",
  "awaiting_validation",
  "validating",
  "awaiting_review",
  "changes_requested",
  "repairing",
  "succeeded",
  "merging",
  "merged",
  "conflict_resolution",
  "requeued",
  "blocked",
  "escalated",
  "canceled",
  "failed"
] as const;

export type Wave0OperatorAction = "pause" | "freeze" | "abort";

const allowedWaveTransitions: Readonly<Record<WaveRunStatus, readonly WaveRunStatus[]>> = {
  drafted: ["ready", "aborted"],
  ready: ["active", "paused", "frozen", "aborted"],
  active: ["paused", "frozen", "aborted", "rolled_back", "completed"],
  paused: ["active", "frozen", "aborted", "closed"],
  frozen: ["active", "aborted", "closed"],
  aborted: ["closed"],
  rolled_back: ["closed"],
  completed: ["closed"],
  closed: []
};

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

export function assertWaveStatusTransition(
  fromStatus: WaveRunStatus,
  toStatus: WaveRunStatus
): void {
  if (!allowedWaveTransitions[fromStatus].includes(toStatus)) {
    throw new Error(`Illegal wave transition: ${fromStatus} -> ${toStatus}`);
  }
}

export function assertTaskStatusTransition(
  fromStatus: TaskRunStatus,
  toStatus: TaskRunStatus
): void {
  if (!allowedTaskTransitions[fromStatus].includes(toStatus)) {
    throw new Error(`Illegal task transition: ${fromStatus} -> ${toStatus}`);
  }
}

export function applyWaveOperatorAction(
  currentStatus: WaveRunStatus,
  action: Wave0OperatorAction
): {
  nextStatus: WaveRunStatus;
  decisionStatus: WaveDecisionStatus;
} {
  switch (action) {
    case "pause":
      assertWaveStatusTransition(currentStatus, "paused");
      return {
        nextStatus: "paused",
        decisionStatus: "paused"
      };
    case "freeze":
      assertWaveStatusTransition(currentStatus, "frozen");
      return {
        nextStatus: "frozen",
        decisionStatus: "frozen"
      };
    case "abort":
      assertWaveStatusTransition(currentStatus, "aborted");
      return {
        nextStatus: "aborted",
        decisionStatus: "aborted"
      };
  }
}
