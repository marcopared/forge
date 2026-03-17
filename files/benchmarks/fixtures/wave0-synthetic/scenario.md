# Scenario

## Summary

Wave 0 runs one low-risk synthetic foundation packet, `WAVE0-SYNTHETIC`, in
serial operator-launched mode with human-required review and speculative
execution disabled.

## Intended Workflow

1. Load the synthetic packet manifest.
2. Provision a dedicated worktree.
3. Assemble the context pack using the approved foundation profile.
4. Invoke the agent on the trivial synthetic task.
5. Run validators for compilation, lint, tests, and scope/architecture checks.
6. Assemble the evidence bundle and audit trail.
7. Merge back the synthetic diff.

## Capabilities Exercised

- manifest parsing and packet activation
- worktree provisioning
- context-pack assembly
- agent execution with allowed tools
- policy evaluation and logging
- validator execution
- evidence bundle completeness
- audit and cost recording
- merge-back behavior

## Explicit Non-Goals

- authoring real product contracts or implementation code
- testing concurrency or speculative-start behavior
- exercising graph repair during live execution
- proving broad agent coding quality
