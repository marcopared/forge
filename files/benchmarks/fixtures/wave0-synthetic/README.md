# Wave 0 Synthetic Fixture

This fixture documents the minimal synthetic benchmark used for Wave 0 smoke
verification.

## Purpose

Wave 0 uses a synthetic packet so the operator can verify the execution pipeline
without mixing in real product-building work. The fixture exists to support
pre-launch readiness and Phase 8 launch decisions.

## What It Represents

The synthetic packet creates a trivial TypeScript module and one passing test.
That small output is intentional. The value is exercising manifest loading,
worktree provisioning, context assembly, tool routing, policy checks,
validation, evidence capture, audit logging, and merge-back.

## What It Does Not Represent

This fixture does not represent real M0a contract work, broad implementation
capability, integration behavior, concurrency, or speculative execution.

## Related Artifacts

- `benchmarks/manifests/wave0-smoke.yaml`
- `packets/manifests/WAVE0-SYNTHETIC.yaml`
- `packets/waves/wave0-dry-run.yaml`
- `ops/runbooks/wave0-smoke.md`
