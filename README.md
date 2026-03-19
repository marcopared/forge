# Forge Local Wave 0 Bootstrap

This repo now has the local-first Wave 0 execution slice for `WAVE0-SYNTHETIC`, with the CLI acting as the primary operator control surface.

What is included:
- `apps/cli` commands to launch, supervise, inspect, rollback, and close out Wave 0 locally
- `packages/*` runtime boundaries for the Wave 0 execution path
- `docker-compose.yml` for local Postgres and Redis
- filesystem-backed local blob/evidence/audit/worktree roots under `./var`
- typed environment loading in `@forge/config`

What is intentionally not included yet:
- UI or control-plane web app
- Wave 1 execution
- broad concurrency, speculation, or repair-loop behavior
- richer live control-plane surfaces beyond the CLI

## Quick start

1. Start local dependencies:

```bash
docker compose up -d
```

2. Install workspace dependencies and bootstrap local runtime folders:

```bash
pnpm install
pnpm bootstrap:local
```

Optional:
- Copy `.env.example` to `.env` if you want to override the defaults.
- Run `pnpm inspect:local` to print the current local config and package scaffold.
- Run `pnpm config:print` to print only the normalized local config.
- Run `pnpm typecheck` to validate the TypeScript workspace.
- Make sure the live phase branch exists before launch:

```bash
git show-ref --verify --quiet refs/heads/forge/phase-0-wave0-synthetic || git switch -c forge/phase-0-wave0-synthetic
```

## Wave 0 CLI workflow

Launch the live synthetic Wave 0 run:

```bash
pnpm wave0:launch
```

Launch with a task id and a short delay between phases so you can supervise the run from another terminal:

```bash
pnpm wave0:launch task-wave0-demo --step-delay-ms 1500
```

Inspect the latest run:

```bash
pnpm wave0:status
pnpm wave0:packet-status
pnpm wave0:validators
pnpm wave0:evidence
pnpm wave0:metrics
pnpm wave0:policy-log
pnpm wave0:audit
pnpm wave0:closeout
```

Control a specific run:

```bash
pnpm wave0:pause <waveRunId> --notes "operator requested pause"
pnpm wave0:freeze <waveRunId> --notes "freeze on policy or trust uncertainty"
pnpm wave0:resume <waveRunId> --notes "resume authorized after review"
pnpm wave0:abort <waveRunId> --notes "abort on trust failure"
pnpm wave0:rollback <waveRunId> --reason "rollback synthetic merge after inspection"
pnpm wave0:closeout <waveRunId> --disposition advance --wave1 yes
```

For the DB-backed launch path, Forge pauses at the human review gate after validators and evidence are recorded. Inspect the run from another terminal, then resume to authorize merge-back:

```bash
pnpm wave0:status <waveRunId>
pnpm wave0:validators <waveRunId>
pnpm wave0:evidence <waveRunId>
pnpm wave0:policy-log <waveRunId>
pnpm wave0:audit <waveRunId>
pnpm wave0:resume <waveRunId> --notes "human review complete, merge authorized"
```

Machine-readable output is still available:

```bash
pnpm wave0:run
pnpm wave0:inspect
```

## Repo shape

```text
apps/
  cli/
packages/
  config/
  db/
  evidence/
  orchestrator/
  policy-engine/
  runtime-manager/
  shared/
  storage/
  tool-broker/
  validator-runner/
files/
  ... design/spec source material only
```

## Local storage model

Wave 0 uses host filesystem storage first instead of MinIO:
- blobs: `./var/blob`
- evidence: `./var/evidence`
- audit trail files: `./var/audit`
- logs: `./var/logs`
- worktrees: `./var/worktrees`

That keeps the local MVP simple while still matching the evidence/audit separation described in the docs.
