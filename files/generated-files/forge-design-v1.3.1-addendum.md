# Forge Design — Addendum 1.3.1

## Supply-Chain Scope, Formalized Permissions, Tool Action Classes, Memory Artifact Tiers

**Version:** 1.3.1  
**Date:** March 11, 2026  
**Status:** Design Phase — Focused Addendum  
**Baseline:** forge-design-v1.3-security.md

This addendum formalizes three areas that v1.3 addressed directionally but left underspecified: (1) supply-chain and provenance scope with an explicit Alpha-vs-later boundary, (2) a concrete role × permission matrix with no ambiguity, and (3) formalized tool action classes and memory artifact tiers as named, referenceable system concepts.

---

# 1. Supply-Chain and Provenance Scope

## The Problem

Agent-generated software introduces a novel supply-chain surface. Every dependency the agent selects, every package version it pins, every build script it writes, and every GitHub Action it configures is a trust decision made without human review unless the system explicitly gates it. The Harness Engineering article sidesteps this by having a small expert team reviewing outputs. Forge cannot assume that — the user may not have the security expertise to evaluate a dependency choice.

## Alpha Supply-Chain Scope

Alpha includes the supply-chain controls that are necessary to prevent agents from introducing known-bad dependencies or leaking secrets through build artifacts. These are minimum-viable trust controls, not comprehensive software supply-chain management.

### Alpha Must-Haves

| Control | What It Does | When It Runs | Blocking? |
|---|---|---|---|
| **Dependency vulnerability scan** | Scans `package.json` + `pnpm-lock.yaml` against known vulnerability databases (e.g., OSV, GitHub Advisory) | Per-task (if deps changed) + phase-end | Critical/high: blocking. Medium: warning in evidence. |
| **New dependency escalation** | Any addition to `package.json` triggers human approval | Per-task (policy engine) | Blocking (escalates) |
| **License scan** | Checks new dependency licenses against an allowlist (MIT, Apache-2.0, BSD, ISC by default) | Per-task (if deps changed) | Copyleft (GPL, AGPL): blocking. Unknown: warning. |
| **Secret scanning** | Scans committed files for API keys, tokens, passwords, connection strings | Per-task + phase-end | Blocking |
| **Lockfile integrity** | Verifies `pnpm-lock.yaml` is consistent with `package.json` (no phantom deps, no resolution drift) | Per-task (if deps changed) | Blocking |
| **SBOM generation** | Produces a CycloneDX or SPDX SBOM for the phase-end state | Phase-end | Informational (recorded in evidence, not blocking) |
| **GitHub Actions lockdown** | Any creation or modification of `.github/workflows/` escalates to human | Per-task (policy engine) | Blocking (escalates) |
| **Build script audit** | Any modification to `package.json` `scripts` field is logged and flagged for review | Per-task (policy engine) | Warning + included in agent review scope |

### Explicitly Deferred to Post-Alpha

| Control | Why Deferred |
|---|---|
| **Artifact signing / attestation** (SLSA provenance) | Requires build infrastructure integration (e.g., Sigstore, in-toto) that is platform-breadth work |
| **Reproducible builds** | Requires deterministic build tooling beyond blessed-stack defaults; high effort, limited Alpha value |
| **Container image provenance** | Alpha uses ephemeral containers internally; user project doesn't produce container images yet |
| **Transitive dependency deep audit** | OSV scan covers known vulns in transitive deps; deeper audit (typosquatting, maintainer reputation) is specialized tooling |
| **Runtime SCA** (scanning in production) | Alpha scope is build-time only; runtime monitoring is post-deployment platform work |
| **SBOM as blocking gate** | Alpha generates SBOM for visibility; making it blocking requires defined SBOM compliance policies that need user input |
| **VEX (Vulnerability Exploitability eXchange)** | Sophisticated vuln triage; Alpha surfaces raw findings, user triages |
| **Package pinning enforcement** | Lockfile integrity covers resolution consistency; strict pinning policies (e.g., no `^` ranges) are convention-level and can be added to harness policies later |

### Why This Boundary Is Correct

Alpha must prevent agents from introducing known-vulnerable dependencies, copyleft-licensed code, or leaked secrets. These are active harm prevention controls. Everything deferred is either attestation infrastructure (requires build pipeline integration), deep audit tooling (specialized vendor territory), or runtime monitoring (post-deployment scope). The Alpha controls are achievable with existing open-source scanners (e.g., `npm audit`, Trivy, Gitleaks, SPDX tools) running as validator steps.

---

# 2. Formalized Role × Permission Matrix

The v1.3 matrix was directionally correct but used prose qualifiers ("constrained," "escalates") that leave interpretation room. This section replaces it with an unambiguous matrix using defined permission levels.

## Permission Levels

| Level | Meaning |
|---|---|
| **FULL** | Unrestricted access within the stated scope |
| **SCOPED** | Access restricted to the task's declared file scope (paths listed in the coding packet) |
| **READ** | Read-only access |
| **NONE** | No access |
| **GATED** | Access requires runtime policy engine approval; denied if policy says no |
| **ESCALATE** | Action is always paused and escalated to human for approval |

## The Matrix

| Tool / Capability | Planner | Implementer | Validator | Debugger | Reviewer | Doc Updater | Harness Maint. |
|---|---|---|---|---|---|---|---|
| **file_read** | FULL | SCOPED + deps | SCOPED + tests | SCOPED (failed task) | SCOPED | `docs/` `harness/` | `harness/` `docs/` |
| **file_write** | `docs/` `plans/` `research/` only | SCOPED (`src/` `tests/`) | NONE | SCOPED (`src/` `tests/`) | NONE | `docs/` only | ESCALATE |
| **file_delete** | NONE | SCOPED | NONE | SCOPED | NONE | NONE | NONE |
| **file_search** | FULL | SCOPED + deps | SCOPED + tests | SCOPED | SCOPED | `docs/` `harness/` | `harness/` `docs/` |
| **git_status** | READ | READ | READ | READ | READ | READ | READ |
| **git_diff** | READ | READ | READ | READ | READ | READ | READ |
| **git_commit** | NONE | GATED (worktree only) | NONE | GATED (worktree only) | NONE | GATED (worktree only) | ESCALATE |
| **git_log** | READ | READ | READ | READ | READ | READ | READ |
| **git_branch / push / merge** | NONE | NONE | NONE | NONE | NONE | NONE | NONE |
| **run_tests** | NONE | FULL | FULL | FULL | NONE | NONE | NONE |
| **run_typecheck** | NONE | FULL | FULL | FULL | NONE | NONE | NONE |
| **run_lint** | NONE | FULL | FULL | FULL | NONE | NONE | NONE |
| **run_coverage** | NONE | FULL | FULL | FULL | NONE | NONE | NONE |
| **boot_app** | NONE | FULL | FULL | FULL | NONE | NONE | NONE |
| **scan_secrets** | NONE | NONE | FULL | NONE | FULL | NONE | NONE |
| **scan_dependencies** | NONE | NONE | FULL | NONE | FULL | NONE | NONE |
| **scan_code** | NONE | NONE | FULL | NONE | FULL | NONE | NONE |
| **generate_sbom** | NONE | NONE | FULL | NONE | NONE | NONE | NONE |
| **shell_exec** | NONE | GATED (allowlist) | GATED (test commands only) | GATED (allowlist) | NONE | NONE | NONE |
| **web_fetch** | FULL | NONE | NONE | NONE | NONE | NONE | NONE |
| **web_search** | FULL | NONE | NONE | NONE | NONE | NONE | NONE |
| **check_policy** | READ | READ | READ | READ | READ | READ | READ |
| **record_evidence** | FULL | FULL | FULL | FULL | FULL | FULL | FULL |
| **read_logs** | NONE | SCOPED (own worktree) | SCOPED (own worktree) | SCOPED (failed worktree) | SCOPED (reviewed worktree) | NONE | NONE |
| **Harness files** (`harness/`, `AGENTS.md`) | READ | READ | READ | READ | READ | READ | ESCALATE (write) |
| **Protected paths** (`.github/`, `.env*`, `prisma/migrations/`) | ESCALATE | ESCALATE | READ | ESCALATE | READ | ESCALATE | ESCALATE |
| **Add dependency** (`package.json`) | NONE | ESCALATE | NONE | ESCALATE | NONE | NONE | NONE |
| **Modify build scripts** (`package.json` `scripts`) | NONE | ESCALATE | NONE | ESCALATE | NONE | NONE | NONE |
| **Approve task** | NONE | NONE | NONE | NONE | GATED (agent approval) | NONE | NONE |
| **Merge / push** | NONE | NONE | NONE | NONE | NONE | NONE | NONE |

## Key Invariants

1. **No agent can push, merge, or create branches.** These are orchestrator-only operations. This is enforced at the Tool Broker level — the tools do not exist in the agent's interface.

2. **ESCALATE is always blocking.** When an action triggers ESCALATE, the task pauses and the human is notified. The agent cannot retry the action without human approval.

3. **GATED requires runtime policy check.** The policy engine evaluates the specific invocation. A GATED permission may resolve to ALLOW, DENY, or ESCALATE depending on context (e.g., `shell_exec` for `pnpm test` is ALLOW; `shell_exec` for `curl` is DENY).

4. **SCOPED is enforced against the task's declared file scope.** The coding packet for each task lists the files/directories the task is expected to modify. SCOPED permissions are checked against this list. Accessing files outside the scope is a scope-drift violation.

5. **All NONE permissions produce a structured denial** if the agent attempts the action. The denial is logged to the audit trail and included in the evidence bundle.

---

# 3. Formalized Tool Action Classes

v1.3 listed tool categories. This section formalizes them into named **action classes** — a taxonomy the policy engine, audit trail, evidence validators, and evaluation harness all reference.

## Action Class Taxonomy

Each tool invocation belongs to exactly one action class. The class determines what policy checks apply, what audit fields are recorded, and what evidence is required.

### Class 1: READ
Observe state without modification.

| Properties | |
|---|---|
| **Tools** | `file_read`, `file_search`, `dir_list`, `symbol_search`, `git_status`, `git_diff`, `git_log`, `read_logs`, `read_test_output`, `check_policy` |
| **Side effects** | None |
| **Policy check** | Filesystem scope enforcement. Cross-worktree access denied. |
| **Audit record** | `{ class: "READ", tool, target, agent_role, task_id, timestamp }` |
| **Evidence** | Not individually evidenced; included in context pack manifest. |
| **Risk level** | Low. Information disclosure possible if scope is too broad, but no mutation. |

### Class 2: MUTATE
Modify files, code, or project state within the worktree.

| Properties | |
|---|---|
| **Tools** | `file_write`, `file_patch`, `file_delete`, `file_rename`, `git_commit` |
| **Side effects** | Filesystem mutation within worktree. Git history mutation (commit). |
| **Policy check** | Filesystem scope enforcement. Protected-path check. Secret-pattern scan on write content. File size limit. |
| **Audit record** | `{ class: "MUTATE", tool, target_path, content_hash, before_hash, agent_role, task_id, timestamp }` |
| **Evidence** | Every MUTATE action is captured in the task diff. Diff is a required evidence artifact. |
| **Risk level** | Medium. Incorrect mutations are caught by validators. Protected-path mutations escalate. |

### Class 3: EXECUTE
Run a subprocess (test runner, compiler, linter, app boot, constrained shell).

| Properties | |
|---|---|
| **Tools** | `run_tests`, `run_typecheck`, `run_lint`, `run_coverage`, `boot_app`, `shell_exec` |
| **Side effects** | Subprocess execution within sandbox. May produce filesystem side effects (e.g., test output files, coverage reports). |
| **Policy check** | Role-based tool permission. Shell allowlist/blocklist. Time budget. |
| **Audit record** | `{ class: "EXECUTE", tool, command (if shell), exit_code, duration_ms, stdout_hash, stderr_hash, agent_role, task_id, timestamp }` |
| **Evidence** | Exit codes, output summaries, and duration are required evidence. Full stdout/stderr stored as Tier 3. |
| **Risk level** | Medium-high. Shell execution is the broadest attack surface. Constrained by allowlist and policy. |

### Class 4: ANALYZE
Run static analysis, security scanning, or policy evaluation (read-only analysis that produces findings).

| Properties | |
|---|---|
| **Tools** | `scan_secrets`, `scan_dependencies`, `scan_code`, `generate_sbom`, `check_policy`, `list_protected_paths` |
| **Side effects** | None (read-only analysis). May produce output files (SBOM). |
| **Policy check** | Role-based access. Output file location check. |
| **Audit record** | `{ class: "ANALYZE", tool, scope, findings_count, severity_summary, agent_role, task_id, timestamp }` |
| **Evidence** | Analysis results are required evidence for security and policy validators. |
| **Risk level** | Low. Analysis tools are read-only. Risk is in misinterpretation of findings, not in the tool itself. |

### Class 5: NETWORK
Access external resources (web fetch, web search, package registry).

| Properties | |
|---|---|
| **Tools** | `web_fetch`, `web_search`, package installation (via `shell_exec pnpm install`) |
| **Side effects** | Outbound network traffic. Downloaded content enters the worktree or context. |
| **Policy check** | Role-based permission. Egress domain allowlist. Downloaded content is tagged as EXTERNAL (untrusted) in the trust model. |
| **Audit record** | `{ class: "NETWORK", tool, url_or_query, response_size, domain, agent_role, task_id, timestamp }` |
| **Evidence** | All network actions recorded. Downloaded content hashes stored. |
| **Risk level** | High. Exfiltration risk (outbound), injection risk (inbound content). Strictly role-limited and domain-filtered. |

### Class 6: ATTEST
Record evidence, capture state, produce audit artifacts.

| Properties | |
|---|---|
| **Tools** | `record_evidence`, `capture_screenshot`, `capture_boot_status` |
| **Side effects** | Write to evidence storage (append-only). |
| **Policy check** | All roles allowed. Evidence records are append-only — no deletion or modification. |
| **Audit record** | `{ class: "ATTEST", tool, evidence_type, evidence_id, agent_role, task_id, timestamp }` |
| **Evidence** | Attestation actions are themselves evidence. Recursive by design. |
| **Risk level** | Very low. Append-only storage with no mutation capability. |

## How the Taxonomy Is Used

- **Policy Engine** evaluates permissions per action class. A blanket "NONE on NETWORK for implementer" is simpler than per-tool rules.
- **Audit trail** records the action class on every entry, enabling class-level queries ("show me all MUTATE actions for task-007").
- **Evidence validators** check completeness per class: every task must have MUTATE evidence (diffs), EXECUTE evidence (test results), and ANALYZE evidence (security scan results).
- **Evaluation harness** tests per class: "did any agent in the NETWORK class access a blocked domain?" "did any MUTATE action target a protected path without ESCALATE?"
- **Cost attribution** aggregates per class: EXECUTE actions dominate compute cost, NETWORK actions dominate latency.

---

# 4. Formalized Memory Artifact Tiers

v1.1 defined three retention tiers (Durable, Time-Bounded Durable, Ephemeral) and v1.3 added a trust hierarchy. This section merges both into a single formalized model with named tiers, trust levels, access patterns, and lifecycle rules.

## Tier Definitions

### Tier 0: Source of Truth (Repo-Native, Permanent, Versioned)

| Property | Value |
|---|---|
| **Storage** | GitHub repository (committed, versioned) |
| **Retention** | Permanent (persists as long as the repo exists) |
| **Trust level** | Authoritative |
| **Mutability** | Mutable only via approved commits (orchestrator commits post-validation; harness changes escalate) |
| **Access** | All agents (READ); scoped agents (MUTATE, per permission matrix) |
| **Examples** | Source code, tests, AGENTS.md, ARCHITECTURE.md, requirements, architecture docs, design decisions, plans (active + completed), research reports, harness policies, test strategy, acceptance criteria, definition-of-done contracts, coding conventions |
| **Eviction** | Never (user owns the repo) |
| **Authority rule** | If any other tier conflicts with Tier 0, Tier 0 wins |

### Tier 1: Operational Record (Database, 90-Day Default, Structured)

| Property | Value |
|---|---|
| **Storage** | PostgreSQL |
| **Retention** | 90 days default (configurable) |
| **Trust level** | Operational — records what happened, not what should be |
| **Mutability** | Write-once per event. Failure classifications may be reclassified. |
| **Access** | Orchestrator (write); all agents (read, via tools); UI (read) |
| **Examples** | Validation summaries (pass/fail per check per task), failure reports (classification, root cause, remediation), evidence bundle metadata (files read/written, commands, costs), repair histories (before/after per attempt), agent review comments, confidence scores (per-task with factor breakdown), task execution summaries (duration, model, tokens, cost, status), context pack manifests (what was included), audit trail entries (every tool invocation), supply-chain scan results (vuln findings, license findings, SBOM) |
| **Eviction** | Aged out after retention period. Promoted to permanent if user exports. |
| **Authority rule** | Operational records inform decisions but do not override Tier 0. A failure report may suggest updating a harness policy, but the policy (Tier 0) is authoritative until changed. |

### Tier 2: Ephemeral Artifacts (Blob Storage, 7-Day Default, Auto-Pin on Failure)

| Property | Value |
|---|---|
| **Storage** | S3-compatible blob storage |
| **Retention** | 7 days default. Auto-promoted to Tier 1 retention (90 days) on task failure, BLOCKED state, or escalation. User can manually pin. |
| **Trust level** | Operational — raw execution artifacts |
| **Mutability** | Write-once. No modification after creation. |
| **Access** | Producing agent (write); owning task's agents (read); UI (read, via evidence inspector) |
| **Examples** | Raw agent logs (full JSON-lines output), full execution traces (ordered operation log), screenshots and browser evidence, sandbox filesystem snapshots, intermediate diffs (pre-merge worktree state), full stdout/stderr from shell commands, raw test runner output |
| **Eviction** | Aged out after TTL unless pinned. |
| **Authority rule** | Ephemeral artifacts support forensic analysis. They do not inform agent decisions (agents work from Tier 0 repo artifacts + Tier 1 structured results, not raw logs). |

### Tier 3: Transient Runtime State (In-Memory / Container-Local, Session-Scoped)

| Property | Value |
|---|---|
| **Storage** | Container filesystem, Redis, in-memory |
| **Retention** | Exists only during execution. Destroyed when worktree is torn down or container is removed. |
| **Trust level** | Volatile — no durability guarantees |
| **Mutability** | Fully mutable during execution |
| **Access** | Current agent only (within worktree scope) |
| **Examples** | Worktree working directory state, in-progress file edits (pre-commit), running process state (app boot, test runner), WebSocket streaming data, agent reasoning scratchpad (if any), temporary build artifacts (.next/, node_modules/.cache/) |
| **Eviction** | Destroyed with worktree/container |
| **Authority rule** | Transient state is never authoritative. If the container crashes, transient state is lost. The system reconstructs from Tier 0 (repo) + Tier 1 (last known task state). |

### Tier R: Retrieval Index (Vector / Search Index, Assistive Only)

| Property | Value |
|---|---|
| **Storage** | Vector database or search index (MeiliSearch, pgvector, etc.) |
| **Retention** | Rebuilt on demand from Tier 0 source. Can be dropped and regenerated. |
| **Trust level** | Assistive — never authoritative |
| **Mutability** | Rebuilt from source; not directly mutable |
| **Access** | Orchestrator (for context pack assembly); agents (indirect, via search tools) |
| **Examples** | Semantic index over repo files, full-text search index over docs/code/plans, embedding-based similarity for file relevance scoring |
| **Eviction** | Dropped and rebuilt at any time. Stale indices are rebuilt at phase start. |
| **Authority rule** | If retrieval suggests file X is relevant but AGENTS.md says the relevant file is Y, AGENTS.md (Tier 0) wins. Retrieval is a search optimization, not a knowledge source. |

## Tier Interaction Rules

1. **Agents work primarily from Tier 0.** Context packs are assembled from repo-native artifacts. Tier R helps find the right files; Tier 1 provides structured execution history when needed (e.g., debugger reading failure reports).

2. **Evidence flows upward.** Tier 3 (transient) is extracted into Tier 2 (ephemeral artifacts) before worktree teardown. Tier 2 is summarized into Tier 1 (structured records) during validation. Tier 1 informs Tier 0 updates during harness maintenance (e.g., failure patterns → policy updates).

3. **Recovery uses Tier 0 + Tier 1.** If a container crashes mid-build, the system reconstructs from: Tier 0 (repo state at last commit), Tier 1 (last known task states), and re-queues any in-progress tasks. Tier 2 and Tier 3 for the lost tasks are gone, but the task can be re-run.

4. **No tier can override a higher tier.** Tier R cannot override Tier 0. Tier 1 cannot override Tier 0. Tier 2 cannot override Tier 1. Authority flows strictly downward from Tier 0.

---

# 5. Consolidated Impact on Alpha Scope

These formalizations do not expand Alpha scope. They sharpen existing commitments:

| v1.3 Item | This Addendum Sharpens |
|---|---|
| Dependency vulnerability scanning | Now explicitly scoped: OSV/advisory scan + license check in Alpha. Transitive deep audit, SLSA provenance, reproducible builds deferred. |
| SBOM generation | Now explicitly informational in Alpha. Blocking SBOM policies deferred. |
| Role-based least privilege | Now a concrete matrix with defined permission levels (FULL / SCOPED / READ / NONE / GATED / ESCALATE). No ambiguity. |
| Typed Tool Broker | Now organized into six action classes (READ, MUTATE, EXECUTE, ANALYZE, NETWORK, ATTEST) that the policy engine, audit trail, and evidence validators all reference. |
| Evidence retention | Now four tiers (Tier 0: repo, Tier 1: DB, Tier 2: blob, Tier 3: transient) plus Tier R (retrieval index), with explicit trust levels, mutability rules, and authority ordering. |
| Memory trust hierarchy | Now formalized with explicit authority rule: no lower tier can override a higher tier. |

No new features were added. The same capabilities are expressed with enough precision that implementation can proceed without interpretation.
