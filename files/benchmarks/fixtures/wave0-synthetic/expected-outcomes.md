# Expected Outcomes

## Required Positive Outcomes

- A trivial synthetic module is created at `packages/shared/src/synthetic/hello.ts`
- A trivial synthetic test is created at `packages/shared/src/synthetic/hello.test.ts`
- `tsc --noEmit` passes
- `eslint` passes
- `vitest` passes with at least one passing test
- No writes occur outside the declared synthetic scope
- The audit trail is complete
- The evidence bundle is complete
- Merge-back succeeds
- The speculative-start marker remains `false`

## Required Recorded Metadata

- validator results
- policy decision log
- cost summary
- context-pack manifest
- worktree identity
- confidence score

## Failure Meaning

A Wave 0 failure means the pipeline or operating procedure is not yet trusted
for live progression. It should be treated as a readiness blocker, not as a
signal to broaden the synthetic scope.
