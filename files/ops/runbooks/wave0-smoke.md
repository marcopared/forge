# Wave 0 Smoke Runbook

## Purpose

Run the synthetic Wave 0 dry run end-to-end and verify that Forge can dispatch,
provision, execute, validate, capture evidence, and merge back under operator
supervision.

This runbook is for pipeline trust, not product delivery. Keep Wave 0 separate
from live product-building work.

## Preconditions

Before starting the smoke run:

- [ ] `packets/waves/wave0-dry-run.yaml` is committed and reviewed
- [ ] `packets/manifests/WAVE0-SYNTHETIC.yaml` is committed and reviewed
- [ ] Referenced validator, evidence, review, and template artifacts are present
- [ ] Foundation context profile is available for context-pack assembly
- [ ] Benchmark fixture docs under `benchmarks/fixtures/wave0-synthetic/` are present
- [ ] Benchmark manifest `benchmarks/manifests/wave0-smoke.yaml` is present
- [ ] Manifest validation tooling passes for the Wave 0 packet and wave manifest
- [ ] Policy files are loaded and smoke-tested for expected ALLOW and DENY behavior
- [ ] CLI fallback commands are operational
- [ ] Operator understands Wave 0 is serial, human-reviewed, and non-speculative

## Smoke Procedure

1. Load the Wave 0 synthetic packet manifest and confirm only `WAVE0-SYNTHETIC` is active.
2. Launch the packet through the CLI control path.
3. Verify a dedicated worktree is provisioned for the synthetic packet.
4. Confirm the assembled context pack matches the expected Wave 0 profile and stays within budget.
5. Observe the agent run and verify tool routing remains within the declared synthetic scope.
6. Confirm policy decisions are recorded and remain ALLOW-only for the happy path.
7. Verify validators execute for compilation, lint, tests, and architecture/scope checks.
8. Inspect the produced diff and confirm it only creates the synthetic module and synthetic test.
9. Verify the evidence bundle is assembled and marked complete.
10. Verify the audit trail includes every tool invocation with target and result.
11. Verify merge-back completes cleanly.
12. Record cost summary, context-pack manifest details, worktree identity, and confidence score.
13. Mark the smoke benchmark result as pass or fail in the operator log.

## What The Operator Must Inspect

During and after the run, inspect these items explicitly:

- State transitions match the expected packet lifecycle
- Diff is trivial and stays inside `packages/shared/src/synthetic/`
- Validator outcomes are PASS for `tsc --noEmit`, `eslint`, and `vitest`
- Evidence completeness is PASS and no required field is missing
- Audit trail is complete and all policy decisions are ALLOW
- Speculative-start marker is `false`
- Confidence score is reasonable for a trivial packet

## Pass Criteria

Wave 0 smoke passes only if all of the following are true:

- [ ] Synthetic packet completed end-to-end
- [ ] Compilation passed
- [ ] Lint passed
- [ ] At least one test passed
- [ ] No scope drift or architecture boundary violation occurred
- [ ] All tool invocations were policy-allowed
- [ ] Evidence bundle is complete
- [ ] Audit trail is complete
- [ ] Merge-back succeeded
- [ ] Speculative-start marker remained false

## Pause Conditions

Pause the run if any of the following occur:

- Unexpected policy ESCALATE or DENY on the happy path
- Writes outside the synthetic scope
- Validator crash or evidence capture gap
- Operator can no longer explain current packet state from the observed signals
- Artifact drift is discovered mid-run

## Freeze And Return To Preparation

Freeze Wave 0 and return to preparation if:

- The synthetic packet needs graph repair or scope expansion
- Protected paths are touched or policy protections appear inactive
- Evidence completeness is unreliable or non-blocking in practice
- Merge-back cannot be trusted
- Live and rehearsal artifacts are not cleanly distinguishable

## Recorded Outputs

At closeout, record:

- Smoke result: pass or fail
- Launch and completion timestamps
- Operator on duty
- Diff summary
- Validator results
- Evidence completeness result
- Audit trail completeness result
- Cost summary
- Context-pack manifest summary
- Worktree identity
- Any anomaly, pause, or freeze decision
