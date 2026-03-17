THIS FILE IS A CONVERSATION HISTORY WITH CLAUDE OPUS 4.6. THE SECTIONS ARE DIVIDED BY PHASES. THERE ARE 7 PHASES HERE:
Phase 1 — Product / system design
Define what Forge is, the repo-native control-plane thesis, the UX shape, the trust model, the Alpha scope, and the security/memory/supply-chain hardening layers. This is the long design stack you built through v1.0 → v1.3.1.

Phase 2 — Validation / evaluation harness
Define how Forge knows work is correct, complete, and trustworthy: validation layers, definition of done, false-success prevention, benchmark dimensions, confidence constraints, and the platform/harness eval model.

Phase 3 — Implementation architecture
Define the actual buildable system: subsystem boundaries, orchestrator/runtime, policy engine, tool broker, runtime manager, validator runner, evidence pipeline, memory/indexing, storage, event model, and failure domains.

Phase 4 — Task graph / coding packet decomposition
Turn the architecture into an executable DAG: workstreams, milestones, packet schema, dependency graph, critical path, validator assignment, packet risk classes, and graph-repair-aware decomposition.

Phase 5 — Operationalization / execution planning
Define how the graph is actually run safely: rollout waves, activation classes, operator workflow, fallback/pause/rollback, graph repair, dependency-class-aware activation, and throughput progression.

Phase 6 — Packet instantiation / operational artifacts
Define the concrete repo artifacts needed before execution: packet manifests, validator/evidence/review manifests, template architecture, runbooks, wave artifacts, benchmark fixtures, and readiness checklists.

Phase 7 — Final pre-launch preparation
Generate the first real packet artifacts, define manifest validation tooling, calibrate templates, rehearse operators, prepare Wave 0 dry-run scenarios, and produce the explicit go/no-go readiness model. This phase is still preparation, not live operations.


-------------------------------------------------------------------------------


# PHASE 1

# PROMPT: 
IMPORTANT: Stay entirely in design mode.

This response must remain at the level of product design, systems design, UX architecture, agent orchestration design, harness design, domain modeling, and reliability design.

Do not write implementation code.
Do not write framework boilerplate.
Do not write migration/schema code.
Do not write frontend components.
Do not write backend handlers.
Do not convert this into engineering tickets.
Do not produce a build spec yet.

Use only conceptual examples where necessary to clarify the design.

You are a principal-level product architect, staff engineer, and technical founder. I am giving you:

1. Harness Engineering documentation
2. Important conversation history / product ideation notes
3. Possibly some additional UX inspiration material

Your job is to synthesize all of this and design a repo-native web app for reliable agentic software development.

This is not a generic AI coding assistant.
This is not a canvas-based note app.
This is not a toy multi-agent demo.

This product should function as a technical cofounder + agentic engineering control plane that makes software development more reliable by applying the principles of Harness Engineering.

The core idea is:

- GitHub repository is the source of truth
- code and docs live in the repo
- agents operate on the repo
- the web app is the control plane for planning, research, orchestration, observability, validation, approvals, and intervention
- a visual center execution surface is useful, but it must represent live agent work and system state, not act as the permanent document store

You must design the product in a way that preserves and operationalizes the core Harness Engineering philosophy.

Do not start by asking me clarifying questions. Make strong assumptions, state them explicitly, and proceed.

## Critical product direction you must honor

These are not optional preferences. Treat them as central design intent.

### 1. Repo-native, not canvas-native
Do not design a system where docs, plans, or code primarily live in a proprietary visual canvas.

Instead:
- all code should live in a GitHub repository
- all durable docs should live in the repository
- harness artifacts should live in the repository
- generated plans/specs/research docs should preferably be committed into the repository in appropriate folders

The UI may visualize these artifacts, but it should not replace the repository as source of truth.

### 2. Control plane, not just chat
The web app should function as a control plane over agentic development.

That means the product must support:
- planning
- research
- execution orchestration
- validation
- observability
- human approvals
- intervention
- failure handling
- repo visibility
- test visibility
- traceability
- policy enforcement
- harness management

The web app is not just a prompt box with agent replies.

### 3. Hybrid UX: IDE + execution plane
The product should have a hybrid UX:

#### Left sidebar / left workspace area
This should feel closer to an IDE or repo navigator:
- repository tree
- docs tree
- plans
- research outputs
- harness files
- generated files
- open file tabs
- ability to inspect/edit files

This is where large files should be navigated, not by giant canvas blocks.

#### Center pane
This should show the live agent execution plane:
- agent graph
- task graph
- state transitions
- running / queued / blocked / failed / completed nodes
- handoffs between planner, implementer, validator, etc.
- timeline / swimlane / graph views if useful

This visual surface is for observability of work in motion.

#### Right pane / inspector
For whichever node, task, or file is selected:
- logs
- prompts/context packs
- files touched
- diffs
- screenshots
- traces
- validation output
- confidence / reliability info
- retry / stop / approve / escalate actions

### 4. Explicit planner / consultant mode before build
The system should include an “ultimate planner” / “technical cofounder” mode that:
- discusses the problem with the user
- clarifies requirements
- challenges ambiguity
- proposes architecture
- suggests plans
- may do feasibility or technical research
- iterates with the user until the user is satisfied

This mode can and should go back and forth with the user before building begins.

Then there should be a deliberate transition such as:
- “Ready to build?”
- user approves
- then execution begins

Do not collapse planning and building into a single uncontrolled loop.

### 5. Deep research as a first-class capability
The system should support a serious deep-research capability that can inform:
- product feasibility
- technical feasibility
- architecture decisions
- API / library / tooling research
- market / competitor / implementation landscape
- repo-specific investigation
- debugging research

This should not be treated as a gimmick. It should be part of the pre-build and mid-build workflow.

### 6. Harness Engineering principles must remain central
The product must faithfully embody Harness Engineering ideas such as:
- short repo-local guidance
- agent-readable docs
- architecture legibility
- explicit boundaries
- mechanical validation
- observability
- deterministic gates
- cheap feedback loops
- repair loops
- system-of-record docs
- codified standards
- structured context packaging
- reducing ambiguity through environment design

Translate those ideas into concrete product features and architecture.

### 7. Avoid giant card chaos
Do not design the center canvas as a cluttered infinite board of oversized blocks.

The central visual layer must remain usable even as projects become large and long-lived.

You should think seriously about:
- abstraction levels
- grouping
- collapsing
- filtering
- zooming
- swimlanes
- views by phase, agent, or task
- keeping file navigation in the left tree rather than the graph

## What I want you to produce

I want a rigorous, highly detailed design for this product.

Your response should include all of the following sections.

# 1. Product thesis

Define the thesis of this product precisely.

Explain:
- what the product is
- why it is different from current AI coding assistants
- why repo-native design matters
- why a control plane is the right mental model
- why Harness Engineering materially changes the design
- why the visual center execution plane is useful, but must not be the source of truth

Be decisive.

# 2. Product concept in one sentence, one paragraph, and one page

Provide:
- a one-sentence definition
- a one-paragraph product description
- a one-page product narrative

This should read like a serious company/product vision statement, not marketing fluff.

# 3. User journey and primary workflow

Design the end-to-end user journey.

At minimum, include:
1. user arrives with an idea/problem
2. planner/consultant discusses it
3. deep research may run
4. system drafts requirements/architecture/plan
5. user iterates with planner
6. user approves “ready to build”
7. repo is linked or created
8. harness artifacts are generated or updated
9. agents begin work
10. execution is visible in the control plane
11. tests/validation run continuously
12. user reviews evidence and diffs
13. user intervenes, re-plans, approves, or stops
14. outputs are committed to repo
15. harness learns from mistakes over time

Make this operationally detailed.

# 4. Product surfaces / UX architecture

Design the entire UX.

I want a detailed description of the main surfaces, including but not limited to:
- landing / workspace selection
- project dashboard
- planner / consultant chat/workspace
- deep research workspace
- repo browser / file explorer
- live execution graph / agent canvas
- timeline / swimlane view
- file editor / doc viewer
- diff review surface
- test and validation surface
- logs / traces surface
- harness configuration / AGENTS.md manager
- policy / rules manager
- run history
- failure analysis surface
- approvals / review queue

For each, explain:
- purpose
- major UI components
- interactions
- what data is emphasized
- how it contributes to trust and reliability

# 5. The center execution plane

This section is critical.

Design the center pane / “agent canvas” properly.

Explain:
- what objects appear there
- what should not appear there
- what the units of visualization are
- how the graph scales
- how the user changes abstraction level
- how concurrency is shown
- how dependencies are shown
- how failures are shown
- how retries / repair branches are shown
- how phases or swimlanes might work
- when graph view is better than timeline view
- when timeline view is better than graph view

Be explicit about how to avoid the clutter problem.

Also explain how the center plane relates to the repo tree and inspector.

# 6. Left sidebar / IDE-style workspace

Design the left side of the app like a serious repo-native environment.

Include:
- repository tree
- docs tree
- plans tree
- research tree
- harness files
- open tabs
- search
- file metadata
- changed files
- generated files
- branch / PR state if relevant

Explain how the user navigates large repositories without the visual execution plane becoming overloaded with document cards.

# 7. Right-side inspector / evidence panel

Design the right-side detail pane.

For any selected execution node, task, file, or failure, explain what should be shown.

Potential inspector content:
- status
- inputs
- context pack
- tools used
- commands run
- files read/written
- diff summary
- test results
- logs
- screenshots
- traces
- model used
- tokens / cost
- failure classification
- suggested next actions
- approval buttons

Explain how the inspector reinforces trust.

# 8. Planner / technical cofounder mode

Design the planner carefully.

This should be a first-class system role and UX mode.

Explain:
- how it talks to the user
- how it asks clarifying questions
- how it reasons about architecture
- how it generates requirements/specs/plans
- how it does feasibility analysis
- how it hands work to later agents
- how it knows when the user is satisfied
- how “Ready to build?” should work

Also explain:
- what artifacts it produces in the repo
- what belongs in `docs/`, `plans/`, `research/`, `harness/`
- what model characteristics this role should have
- what should remain deterministic and not delegated to this role

# 9. Deep research mode

Design deep research as a serious subsystem.

Explain:
- what it researches
- how it differs from planner mode
- when it runs
- how it produces artifacts
- how it cites and structures findings
- how it feeds planning and execution
- how it can be re-run mid-project

Potential areas:
- technical feasibility
- dependency/API research
- competitor/product research
- implementation pattern research
- debugging research
- architecture alternatives
- repo-specific discovery

Explain the UI for deep research outputs and how they enter the repo.

# 10. Build phase and live orchestration

Design what happens after the user clicks Build.

Explain:
- how execution begins
- what agents are spawned
- how tasks are decomposed
- how work is scheduled
- how tasks are grouped
- how validation is interleaved with implementation
- how partial results are shown
- how branches/worktrees/sandboxes are managed
- how evidence is captured continuously

Also define the state transitions after build begins.

# 11. Multi-agent architecture

Design the agent system.

Potential roles to consider:
- planner
- deep research agent
- repo mapper
- architect
- implementer
- test designer
- validator
- debugger
- reviewer
- doc updater
- harness maintainer
- release / PR preparer

For each:
- purpose
- inputs
- outputs
- tools
- failure modes
- when it should be invoked
- what should be deterministic instead

Do not assume every role needs to be an autonomous agent. Be critical.

# 12. Harness architecture

Define the harness in concrete terms for this product.

Include:
- `AGENTS.md`
- architecture docs
- system-of-record docs
- acceptance criteria
- validation policies
- coding conventions
- service boundaries
- task contracts
- definitions of done
- repair policies
- escalation rules
- test contracts
- observability contracts
- approval rules
- context packaging rules

Explain:
- where these live in the repo
- how the UI helps users create and edit them
- how agents consume them
- how they evolve from run history and failures

# 13. Reliability model

This section must be rigorous.

Define the mechanisms that make the product reliable.

At minimum discuss:
- task scoping
- bounded execution
- context packaging
- model routing
- structured outputs
- validation gates
- deterministic tests
- worktree/sandbox isolation
- approval points
- retry semantics
- repair loops
- anti-loop protections
- failure classification
- suspicious behavior detection
- architecture drift detection
- evidence requirements
- confidence scoring
- false-success prevention

For each:
- what problem it solves
- how it works
- where it appears in the system
- tradeoffs

# 14. Technical architecture

Design the web app’s technical architecture in detail.

Include:
- frontend
- backend
- orchestration engine
- job queue
- state store
- event stream
- database
- artifact storage
- search/indexing
- GitHub integration
- agent runtime integration
- sandbox/execution environment
- auth
- permissions
- observability stack

Provide:
- text diagrams
- control flow
- data flow
- event flow
- storage model

# 15. Execution environment model

Design how code actually gets run.

Discuss options like:
- hosted remote sandboxes
- ephemeral containers
- ephemeral VMs
- worktrees on connected runners
- hybrid local/remote execution
- browser automation runners
- background worker pools

Explain tradeoffs around:
- security
- reproducibility
- cost
- speed
- secrets
- network access
- repo access
- tool access

Then recommend:
- best MVP approach
- best long-term approach

# 16. GitHub-native lifecycle

Design how the product interacts with GitHub.

Include:
- create repo
- connect repo
- create branch/worktree
- commit docs/specs/plans
- open PRs
- PR review
- sync harness docs
- branch isolation for agents
- export/fork model if relevant

Explain how repo ownership should work and how to keep GitHub as source of truth.

# 17. Domain model / internal objects

Define the main objects this system needs.

Examples:
- Workspace
- Repository
- HarnessProfile
- Task
- Plan
- ResearchRun
- AgentRun
- ValidationRun
- EvidenceBundle
- FailureReport
- ReviewDecision
- Policy
- ContextPack
- ExecutionNode
- ExecutionEdge
- BranchContext
- RepoArtifact

For each:
- fields
- relationships
- lifecycle
- storage type

# 18. Task state machine

Design the task lifecycle rigorously.

Include states such as:
- drafted
- clarifying
- researching
- planning
- awaiting approval
- ready to build
- provisioning
- running
- validating
- blocked
- awaiting human input
- repairing
- failed
- completed
- merged
- archived

Show transitions, edge cases, and escalation behavior.

# 19. Failure modes and how the UI handles them

Enumerate failure modes such as:
- bad plan
- bad research
- incomplete context
- agent loops
- false success
- silent regression
- doc drift
- architecture drift
- flaky tests
- permission issues
- broken sandbox
- cost explosions
- execution dead ends
- UX overload from too many runs/nodes

For each:
- what happens
- how the system detects it
- what the user sees
- what the next action should be

# 20. Evaluation and metrics

Define how to measure whether this system is actually improving reliability.

Include:
- validated completion rate
- false positive completion rate
- time to trustworthy completion
- retry counts
- human intervention rate
- regression rate
- documentation freshness
- harness coverage
- evidence completeness
- task abandonment rate
- planner-to-build conversion
- plan revision rate
- PR acceptance rate

Explain how to benchmark progress.

# 21. MVP proposal

After designing broadly, propose a concrete MVP.

It should be ambitious but realistic.

Include:
- target user
- target use case
- must-have surfaces
- minimal orchestration model
- minimal harness support
- minimal GitHub integration
- minimal evidence model
- minimal research/planner flow
- what is deferred

Be opinionated.

# 22. Final recommendation

End with a strong recommendation for:
- product shape
- UI shape
- orchestration model
- harness strategy
- repo strategy
- agent specialization strategy
- evidence strategy
- MVP cut

Also include:
- what I should absolutely build first
- what I should avoid
- what design choice matters most

# Appendix requirements

After the main design, include these appendices.

### Appendix A — Proposed folder structure
Show a conceptual folder structure for the product itself.

### Appendix B — Suggested repo artifact structure for user projects
Example:
- `docs/`
- `plans/`
- `research/`
- `harness/`
- `tests/`
- `artifacts/`

Explain what belongs where.

### Appendix C — Sample `AGENTS.md`
Create a realistic conceptual sample.

### Appendix D — Sample reliability policy
YAML or JSON is fine, but keep it illustrative and design-level.

### Appendix E — Sample task execution trace
Show a plausible conceptual run from planner to build to validation.

### Appendix F — Sample UI state model
Show what the frontend needs to represent conceptually.

### Appendix G — Sample event taxonomy
Show the event model for orchestration and observability.

### Appendix H — Sample task state machine
Represent it explicitly.

### Appendix I — Sample “ready to build” handoff package
Show what gets passed from planner/research to builder.

### Appendix J — Sample definition-of-done contract
Show what an agent task must satisfy before it can be marked complete.

## Additional instructions

- Be highly concrete.
- Do not give shallow startup fluff.
- Do not treat the graph UI as a gimmick.
- Do not design a system where documents live primarily in the canvas.
- Treat GitHub and repo artifacts as primary.
- Treat the web app as the control plane over agentic development.
- Continuously ground the design in Harness Engineering principles.
- Make explicit tradeoffs.
- Distinguish carefully between:
  - source of truth
  - visualization layer
  - execution layer
  - policy layer
  - artifact layer
- Prefer explicit mechanisms over vague aspirations.

You should synthesize the attached documents and conversation history into one coherent product design.

At the end of the response, include a final section called:

## Phase 1 Decision Summary

This section must contain:
- the recommended product shape
- the recommended UX shape
- the recommended orchestration model
- the recommended harness strategy
- the recommended repo/source-of-truth strategy
- the recommended MVP cut
- the top unresolved questions to answer in Phase 2

Guardrail: remain at the design layer throughout the response. Do not produce code. Do not produce a detailed implementation plan. Do not decompose into engineering tickets. Stay focused on architecture, UX, control-plane design, agent/harness design, and system behavior.

Use the attached Harness Engineering documentation and attached ideation history as primary design inputs. Extract the strongest product and engineering principles from them, reconcile them into a coherent vision, and design the system as a faithful implementation of a repo-native, harness-first, agentic engineering control plane.

# RESPONSE: 
This is a serious undertaking, Marco. Let me read through all your uploaded materials carefully before producing this design document.Now I have a thorough understanding of all your materials. This is a massive design document — I'll synthesize everything from the Harness Engineering philosophy, your conversation history, the aicofounder UX patterns, and the screenshot into one coherent product design. Let me build this out.Here's your complete product design document — **13,500+ words across all 22 sections and 10 appendices**.

The document synthesizes everything: the Harness Engineering philosophy (repo-as-system-of-record, progressive disclosure, mechanical enforcement, agent legibility), your conversation history (control plane framing, three-pane UX, planner-before-build, deep research as first-class), the aicofounder UX patterns (ultraplan, parallel research agents, persistent workspace), and the screenshot reference (compact execution nodes, not giant document cards).

The key decisions in the design:

**Product name:** Forge — a repo-native agentic engineering control plane.

**Core UX:** Three-pane layout — IDE file tree (left), execution graph / planner (center), evidence inspector (right). The graph shows work in motion, not documents at rest.

**Critical gate:** The "Ready to Build?" transition between planning and execution. This is the most important UX decision — it prevents the collapse of intent and implementation into one uncontrolled loop.

**Harness as moat:** Models improve for everyone. The harness is project-specific and compounds over time. It's the real differentiator.

**MVP cut:** Planner + file sidebar + execution graph + inspector + sequential build + basic harness + GitHub integration. 6-8 weeks to validate the thesis.

This is purely design-layer — no implementation code, no tickets, no framework boilerplate. Ready for Phase 2 when you are.

# OUTPUT: Forge-product-design-v1.md

--------------------------------------------------------------------------------
# PHASE 1.1

# PROMPT:
IMPORTANT: Stay entirely in design mode.

This is a focused revision pass on an existing Phase 1 product/system design.
Do not write implementation code.
Do not write framework boilerplate.
Do not write migrations or schemas.
Do not write frontend components.
Do not write backend handlers.
Do not write engineering tickets.
Do not produce a build spec yet.

Your job is to revise the existing Forge Phase 1 design so it is more faithful to the attached deep-research findings on Harness Engineering, while preserving the strongest parts of the current design.

You must use:
1. the existing Forge Phase 1 design
2. the attached deep research on Harness Engineering principles
3. the attached Harness Engineering source material
4. the attached ideation / conversation context

Treat the current Forge Phase 1 design as broadly correct, but not yet fully locked.

## Core instruction

Revise the current Phase 1 design to better align with a harness-first, validator-heavy, repo-native operating model.

Do not restart the design from scratch unless a section is fundamentally broken.
Do not weaken the ambition.
Do not collapse back into a human-heavy workflow.
Do not turn the system into a canvas-native product.
Do not move durable artifacts out of the repository.

## What must remain intact

Preserve these approved foundations unless you have an extremely strong reason to change them:

- Forge is a repo-native agentic engineering control plane
- GitHub/repo is the source of truth
- durable artifacts live in the repo
- the web app is a governance / orchestration / observability layer
- the center graph is for execution observability, not document storage
- the left pane behaves like an IDE/repo tree
- the right pane is an evidence / inspection surface
- planning happens before build
- deterministic orchestration remains the backbone
- evidence bundles remain required for completion
- the planner / technical cofounder remains the first major user-facing mode

## Clarified design decisions you must incorporate

### 1. Keep the ambition high
Do not reduce the MVP into a toy.

The first meaningful Forge target can remain ambitious. However, the ambition should be bounded through standardization rather than through trivialization.

Revise the MVP so it remains a serious greenfield build target, but make it a standardized archetype with reduced variance, for example:
- one blessed stack
- one repo owner model
- one deployment/runtime model
- one database pattern
- one standard validation pipeline
- one standard GitHub workflow

Keep the ambition. Reduce the variance.

### 2. Lock the trust model
Forge should explicitly default to:

**validator-heavy execution with selective human review**

Human approval is required only at strategic pre-build checkpoints:
- consultation / problem framing
- product/system design approval
- validation / test strategy approval
- task graph / coding packet approval

After those checkpoints, implementation, validation, repair loops, agent review, and most PR progression should be primarily validator-driven and agent-driven unless:
- confidence drops
- policy is violated
- a novel / high-risk judgment is required
- the system explicitly escalates

Make this trust model explicit and central.

### 3. Make staged autonomy explicit
The design must clearly distinguish between:

**Pre-build human-governed phases**
- consultation
- product design
- architecture/system design
- validation/test strategy
- task graph approval

and

**Post-build validator-governed phases**
- implementation
- validation
- repair
- review
- PR progression
- routine iteration

Show this staged autonomy model clearly in the workflow, approval model, and control-plane behavior.

### 4. Clarify architecture staging
The current design describes a richer long-term architecture and a simpler MVP runtime.

Make the distinction explicit:

- **Target architecture:** deterministic DAG-based orchestration with richer execution structure, stronger concurrency, better isolation, and richer observability
- **MVP runtime:** a constrained sequential or semi-sequential validator-heavy subset of that architecture

Do not present this as contradiction. Present it as staged rollout.

### 5. Strengthen mechanical enforcement earlier
The deep research emphasizes that validators, structural checks, architecture rules, and encoded invariants are central, not optional polish.

Revise the design to move somewhat closer to that principle, even if the full long-term system is deferred.

You do not need to make the MVP fully mature, but you should revise it so that it is less dependent on weak conventions alone and more clearly oriented around mechanical enforcement.

Be explicit about what minimum mechanical enforcement should exist earlier than before.

### 6. Add an explicit evidence retention model
Define a tiered retention model for:
- repo artifacts
- plans
- research
- validation summaries
- logs
- traces
- screenshots / browser evidence if relevant
- repair histories
- intermediate runtime artifacts

Make clear what is:
- durable
- time-bounded durable
- ephemeral unless pinned

### 7. Tighten the planner vs validation-design boundary
The planner may produce test strategy intent during planning, but the formal validation / evaluation / test design remains its own distinct phase.

Revise the design so it is explicit that:
- Phase 1 = product/system design
- Phase 2 = validation / evaluation strategy
- later phases = implementation design and task decomposition

Do not let the planner collapse product design, validation design, and implementation planning into one blurred phase.

### 8. Add an approval policy matrix
Add a concise, explicit approval model showing which phases require:
- human approval
- validator-driven approval
- agent-driven progression
- escalation on risk/policy/confidence failure

At minimum include:
- consultation / requirements
- product/system design
- validation/test strategy
- task graph / coding packets
- implementation execution
- repair loops
- agent review
- PR progression
- merge behavior

## Harness alignment requirement

Before revising the design, explicitly verify that your revisions remain aligned with the spirit of Harness Engineering.

Your revised design must preserve and reinforce principles such as:
- humans steer, agents execute
- repository-local knowledge as system of record
- AGENTS.md as short map, not encyclopedia
- structured docs as durable knowledge base
- progressive disclosure of context
- agent legibility as a design goal
- observability designed for machine consumption
- validators and test gates as central
- explicit boundaries with local autonomy
- fast correction loops
- reduced human bottlenecks once the harness is strong

If any proposed revision weakens these principles, reject or reframe it.

## What I want you to produce

Your response must include these sections.

# 1. Harness Alignment Check
State whether the revised design remains aligned with Harness Engineering.
Explain why the validator-heavy, selective-human-review model is still faithful to the research.

# 2. Revision Summary
Summarize the major changes you are making and why.

# 3. Revised Sections
Rewrite only the sections that need revision.
Do not rewrite the entire document unless necessary.

At minimum revise the sections related to:
- product thesis, if needed
- user journey / workflow
- trust model / approval model
- planner/build boundary
- orchestration model
- reliability model
- evidence model
- MVP definition
- final recommendation
- Phase 1 decision summary

# 4. Approval Policy Matrix
Provide a clear approval model showing:
- human-required checkpoints
- validator-driven checkpoints
- agent-driven checkpoints
- escalation conditions

# 5. Evidence Retention Model
Define the retention tiers clearly and concretely.

# 6. Revised MVP Positioning
Clarify how the MVP stays ambitious while reducing variance through standardization.

# 7. Updated Phase 1 Decision Summary
End with a revised “Phase 1 Decision Summary” that includes:
- recommended product shape
- recommended UX shape
- recommended orchestration model
- recommended harness strategy
- recommended repo/source-of-truth strategy
- recommended trust/approval model
- recommended MVP cut
- top unresolved questions to answer in Phase 2

## Additional instructions

- Stay at the design layer
- Do not generate code
- Do not generate tickets
- Do not generate a build spec
- Keep GitHub/repo as source of truth
- Keep the graph as execution/observability, not storage
- Preserve ambition
- Reduce variance through standardization
- Make the validator-heavy model explicit
- Make staged autonomy explicit
- Move Forge somewhat closer to true harness-first mechanical enforcement
- Keep the output concrete, opinionated, and internally consistent

REPONSE:
Let me review the existing design document and the revision instructions carefully before producing the revision.Now I have a clear picture of what needs to change. Let me produce the revision document.Here's your v1.1 revision. The major changes in summary:

**Staged autonomy is now explicit.** Three human checkpoints before build (product design → validation strategy → task graph), then validator-governed execution during build, then human merge approval. No more AWAITING_APPROVAL after every implementation task.

**Blessed stack locks the MVP.** Next.js + PostgreSQL + Prisma + Tailwind + Vitest, with pre-built harness templates that provide real mechanical enforcement from day one. Ambition stays high; variance drops to near zero.

**Mechanical enforcement moved earlier.** Instead of deferring architecture boundary checks to "someday," the blessed stack ships with pre-built ESLint rules, TypeScript strict mode, file structure validation, and coverage thresholds that are real and enforced from the first task.

**Evidence retention is tiered.** Durable (repo), time-bounded durable (DB, 90 days), and ephemeral (7 days, auto-pinned on failure).

**The approval matrix is concrete.** One table shows exactly what requires human approval, what's validator-driven, what's agent-driven, and what triggers escalation.

The revision is designed to layer on top of v1.0 — only the sections that needed change were rewritten. The foundations (repo-native, three-pane UX, DAG orchestration, evidence bundles, harness-first philosophy) remain intact.

# OUTPUT: Forge-design-v1.1-revision.md

--------------------------------------------------------------------------------
# PHASE 1.2

# PROMPT: 
IMPORTANT: Stay entirely in design mode.

This is a focused scope-correction and revision pass on an existing Forge design.
Do not write implementation code.
Do not write framework boilerplate.
Do not write migrations or schemas.
Do not write frontend components.
Do not write backend handlers.
Do not write engineering tickets.
Do not produce a build spec yet.

Your job is to revise the current Forge design so that it no longer treats the core harness architecture as “long-term” or “post-MVP,” and instead scopes the full core harness into **Alpha** now.

You must use:
1. the current Forge design documents
2. the Forge revision document
3. the attached deep research on Harness Engineering
4. the attached Harness Engineering source material
5. the attached ideation / conversation context

## Core instruction

Revise Forge from a thesis-testing MVP framing into an **Alpha core harness** framing.

This means:
- stop reducing the runtime to a sequential toy if that amputates the core harness thesis
- move the full deterministic DAG model into Alpha
- move worktree isolation into Alpha
- move richer validator-heavy pipelines into Alpha
- move per-task observability / evidence into Alpha
- move agent-to-agent review into Alpha
- keep the repo-native harness-first control-plane thesis intact

At the same time:
- do NOT expand into every non-core platform feature
- do NOT broaden to many stacks
- do NOT broaden to multi-tenant platform complexity
- do NOT broaden to enterprise/compliance/platform-breadth features unless they are core to the harness thesis

The goal is:
**Build the full core harness now, not the full future company/platform surface area.**

## What must remain intact

Preserve these foundations unless there is a very strong reason to change them:
- Forge is a repo-native engineering control plane
- GitHub/repo is the source of truth
- durable artifacts live in the repo
- the center graph is execution observability, not document storage
- the left pane is repo/file/docs navigation
- the right pane is evidence / inspection
- planning happens before build
- validators and evidence determine whether work counts
- selective human review remains strategic, not constant
- the planner / technical cofounder remains the first major user-facing mode

## Scope correction you must apply

### 1. Rename the scope correctly
Stop calling the runtime cut “MVP” if the intent is to build the real core harness now.

Reframe the scope as something like:
- Alpha
- Foundational Alpha
- Alpha core harness

Use language that reflects:
this is the first serious implementation of the real system, not a reduced thesis probe.

### 2. Move core harness features into Alpha now
These should be treated as **Alpha must-haves**, not long-term goals:

- deterministic DAG orchestration
- bounded parallel task execution
- per-task or per-branch worktree isolation
- per-task or per-worktree observability
- richer validator-heavy pipeline
- evidence bundles as first-class required artifacts
- agent-to-agent review loop
- structured repair / retry / escalation logic
- worktree-aware GitHub lifecycle
- repo-native plans / docs / policies / harness artifacts
- policy-aware execution and escalation
- harness maintenance / doc updating as part of the operating model

These are core to the harness thesis.

### 3. Keep only non-core platform breadth deferred
These can remain deferred if they are not required to prove the full core harness thesis:

- multiple blessed stacks
- multi-tenant support
- enterprise-grade VM isolation if containers are enough for Alpha
- extensive analytics dashboards
- advanced pricing/cost optimization
- plugin ecosystems / marketplace concepts
- broad enterprise governance breadth
- generalized platform expansion unrelated to the core harness loop

Be disciplined about this distinction:
**core harness now, platform breadth later**

### 4. Preserve validator-heavy staged autonomy
Keep the validator-heavy / selective-human-review model.

Human review remains required at strategic pre-build checkpoints:
- consultation / problem framing
- design approval
- validation / test strategy approval
- task graph approval

After build begins, execution should be primarily validator-governed and agent-governed, with escalation only for:
- policy risk
- confidence failure
- repair exhaustion
- novel judgment
- explicitly flagged high-risk actions

### 5. Align more closely with Harness Engineering
The revision must more faithfully embody principles from the attached research, including:
- humans steer, agents execute
- repo as system of record
- AGENTS.md as short map
- structured docs as durable knowledge base
- validators and structural checks as central
- worktree/sandbox environments with observability
- evidence bundles
- reduced human bottlenecks
- background cleanup / harness evolution
- architecture rules enforced mechanically
- policy-as-code for risky actions

If the current design understates any of these because of MVP conservatism, revise accordingly.

## What I want you to produce

Your response must include the following sections.

# 1. Harness Alignment Check
Explain whether the new Alpha framing is more faithful to the deep research and Harness Engineering source material.
State explicitly why moving DAG/worktrees/validator-heavy runtime into Alpha is justified.

# 2. Revision Summary
Summarize the scope corrections you are making.

Be explicit about:
- what moves from “long-term” into Alpha
- what remains deferred
- why this is the correct boundary

# 3. Revised Product Scope Framing
Rewrite the relevant parts of the design so Forge is framed as an Alpha core harness, not a reduced MVP.

Clarify:
- what Alpha is trying to prove
- why Alpha includes the full core harness
- what is still intentionally not in scope

# 4. Revised Orchestration Model
Rewrite the orchestration section so that:
- deterministic DAG orchestration is the Alpha runtime
- bounded concurrency is in Alpha
- worktree isolation is in Alpha
- richer validation is in Alpha
- agent-to-agent review is in Alpha
- sequential execution exists only as fallback / degraded mode, not as the canonical runtime

# 5. Revised Reliability Model
Revise the reliability model to reflect the stronger Alpha scope, including:
- stronger mechanical enforcement
- richer validator stack
- evidence requirements
- repair / retry / escalation logic
- observability expectations
- policy-aware execution

# 6. Revised GitHub / Execution Environment Model
Revise the execution environment and GitHub lifecycle sections so they assume:
- worktree-aware execution
- branch/task isolation
- repo-native artifact generation
- Alpha-grade sandboxing / containers / observability
- evidence extraction and retention

Do not drift into unnecessary enterprise platform complexity unless justified.

# 7. Revised Alpha Cut
Replace the previous MVP cut with an Alpha cut.

This section must clearly separate:
- **Alpha must-haves (core harness thesis)**
- **Deferred platform breadth**

Be opinionated and concrete.

# 8. Revised Phase 1 Decision Summary
End with an updated decision summary that includes:
- recommended product shape
- recommended UX shape
- recommended orchestration model
- recommended harness strategy
- recommended repo/source-of-truth strategy
- recommended trust/approval model
- recommended Alpha cut
- what is explicitly deferred
- top unresolved questions for the next phase

## Additional instructions

- Stay at the design layer.
- Do not write code.
- Do not write tickets.
- Do not write a build spec.
- Keep GitHub/repo as source of truth.
- Keep the graph as execution observability, not storage.
- Do not shrink the runtime below the core harness thesis.
- Do not bloat scope with non-core platform expansion.
- Be concrete about the line between:
  - core harness architecture
  - future platform breadth
- Use the deep research and Harness Engineering materials as primary truth for what belongs in the core harness.


# RESPONSE:
Let me review the current state of the design documents to understand exactly what needs to move from "deferred" into Alpha.Now let me review the v1.0 orchestration and execution environment sections to understand what was originally deferred.Good. Now I have full context on what was deferred and what needs to move into Alpha. Let me produce the revision.Here's the v1.2 Alpha scope correction. The core argument is in Section 1, and it's the most important thing in the document:

**Worktree isolation is not an optimization — it's a correctness requirement.** A sequential, single-branch system where each task mutates shared state cannot produce meaningful evidence bundles, cannot attribute failures to specific tasks, and cannot detect coupling between tasks. The Harness Engineering article explicitly describes per-worktree isolation and per-worktree observability as central to how agents validate their own work. Stripping these out doesn't create a "reduced MVP" — it creates a fundamentally different system that lacks the properties the harness depends on.

The practical changes:

- **DAG orchestration** with bounded concurrency (default 3 parallel tasks) is now Alpha, not long-term
- **Per-task worktree isolation** is now Alpha — each task gets its own worktree, validates against its own clean state, merges back with conflict detection
- **Agent-to-agent review** is strengthened to primary quality gate, not a nice-to-have
- **Per-worktree observability** (structured logs, test output, boot checks) is Alpha
- **Structured repair with context enrichment** replaces "blind retry 3 times"
- **Post-phase harness maintenance** (doc gardening) is Alpha
- **Branch model** is now phase branch + task branches with merge-back

Everything that was deferred is genuinely platform breadth: second stacks, multi-tenant, VMs, browser automation, analytics dashboards, enterprise features. The line between "core harness" and "platform breadth" is clean.

You now have three documents that form a coherent design stack: v1.0 (full design), v1.1 (trust model + staging), v1.2 (Alpha scope correction). Ready for the next step whenever you are.

# OUTPUT: Forge-design-v1.2-alpha.md

--------------------------------------------------------------------------------
# PHASE 1.3

# PROMPT: 
IMPORTANT: Stay entirely in design mode.

This is a focused architecture revision pass on an existing Forge Alpha design.
Do not write implementation code.
Do not write framework boilerplate.
Do not write migrations or schemas.
Do not write frontend components.
Do not write backend handlers.
Do not write engineering tickets.
Do not produce a build spec yet.

Your job is to revise the current Forge v1.2 Alpha design so that it incorporates the strongest learnings from the latest security-explicit, validator-heavy, tool-safe research.

You must use:
1. the current Forge v1.2 Alpha design
2. the security-explicit / validator-heavy / tool-safe Forge research report
3. the earlier deep research and Harness Engineering material
4. the existing ideation/product context

Treat the current Forge v1.2 Alpha design as broadly correct.
Do not overturn the core architecture unless it is truly contradicted by the research.

## Core instruction

Revise Forge v1.2 Alpha to make its **security architecture, tool interface architecture, role-based permissions, and safety evaluation harness** first-class.

The latest research validates Forge’s overall direction:
- repo-native source of truth
- control-plane UI
- deterministic DAG orchestration
- bounded parallelism
- per-task worktree isolation
- validator-heavy execution
- evidence bundles
- agent-to-agent review
- selective human review

Do not weaken those foundations.

Instead, revise the design so Forge no longer reads as:
“a strong autonomous coding system with some security ideas”

and instead reads as:
“a security-explicit, policy-governed, typed-tool autonomous coding platform.”

## What must remain intact

Preserve these foundations unless you have an extremely strong reason to change them:

- Forge is a repo-native engineering control plane
- GitHub/repo is the source of truth
- durable artifacts live in the repo
- the graph is execution observability, not document storage
- the left pane is repo/file/docs navigation
- the right pane is evidence / inspection
- planning happens before build
- deterministic DAG orchestration is the Alpha runtime
- bounded concurrency is in Alpha
- worktree isolation is in Alpha
- validators and evidence determine whether work counts
- selective human review remains strategic, not constant
- the planner / technical cofounder remains the first major user-facing mode

## What the latest research says Forge should add

The latest research strongly validates the current core harness shape, but indicates that Forge still needs a harder security/control core.

The key learnings to incorporate are:

### 1. Forge needs a harder center
The architecture should explicitly center around:

Orchestrator
→ Policy Engine
→ Tool Broker / Typed ACI Layer
→ Sandbox Runtime
→ Validators
→ Evidence / Audit Pipeline

Do not treat policy as light config.
Do not treat tools as loosely wrapped shell commands.
Make these runtime control layers first-class in the design.

### 2. Policy engine must become first-class
The current design conceptually includes policies, but the revised design should make the policy engine an explicit runtime authority.

It should govern:
- tool invocation
- file reads/writes
- protected path mutation
- git operations
- network egress
- shell access
- secrets access
- dependency introduction
- GitHub actions/workflow changes
- harness file mutation
- dangerous external actions
- escalation triggers

The design should reflect policy-as-code / policy decision points, not just advisory policies.

### 3. Typed / curated tool interface layer must replace shell-first assumptions
The research strongly suggests that Forge should default to a typed, curated Agent-Computer Interface rather than raw shell.

Revise the design so that:
- most agent actions flow through typed tools
- tool contracts are structured
- outputs are normalized
- auditability and replay are first-class
- raw shell becomes exceptional, constrained, and policy-guarded
- raw git becomes exceptional, constrained, and policy-guarded

The design should explicitly explain:
- why typed tools are preferred
- what minimum tool categories Forge should expose
- where raw shell is still useful
- how shell/git are constrained when allowed

### 4. Add explicit trust labeling and untrusted-input handling
The research says Forge must treat external and repository-sourced text as potentially malicious or instruction-bearing.

Revise the design so it includes an explicit trusted vs untrusted input model for:
- repo docs / README / AGENTS content
- issues / PR text
- web content
- browser results
- tool outputs
- logs / traces
- generated code comments
- external package metadata

Add mechanisms such as:
- authority separation
- trust labels in context packs
- structured extraction from tool output
- prompt/data separation
- output sanitization
- protected-path handling for instruction-bearing repo artifacts

### 5. Formalize role-based least privilege
The current design has specialized agents, but permissions are still not explicit enough.

Revise Forge so that agent roles have formal capability boundaries.

At minimum cover:
- planner
- architect
- test strategist
- task planner
- implementer
- validator
- debugger
- reviewer
- doc updater
- harness maintainer
- cleanup agent

For each, define:
- allowed tools
- filesystem scope
- network scope
- code write ability
- harness mutation ability
- external action ability
- approval/merge/deploy rights
- mandatory escalation cases

### 6. Promote security validators into the main validator stack
Forge already has strong correctness validators.
The research indicates Alpha should also include explicit security validators such as:
- secret scanning
- dependency scanning / SCA
- SBOM generation
- static analysis / code scanning
- GitHub Actions/workflow hardening checks
- policy compliance validation
- network/egress violation detection
- dangerous shell usage detection
- provenance / artifact integrity checks where appropriate

These should be reflected as part of Alpha validation, not vague future hardening.

### 7. Add a dedicated security + reliability evaluation harness
The research strongly recommends an evaluation harness that tests Forge itself, not only the user project.

Revise the design so Forge includes a first-class evaluation harness for:
- prompt injection resistance
- least-privilege correctness
- unsafe tool usage
- dangerous shell attempts
- secret leakage
- policy violations
- dependency risk
- unsafe network egress
- false success
- incomplete evidence bundles
- dangerous harness mutation
- cross-task contamination
- drift outside assigned task scope

This eval harness should be treated as a subsystem, not a later analytics add-on.

### 8. Clarify memory hierarchy and retrieval trust
The research suggests repo-native artifacts should remain the authoritative memory layer and retrieval should remain assistive.

Revise Forge so the memory model is explicit:
- repo-native docs/plans/harness artifacts = durable source of truth
- episodic execution traces = operational memory
- summarized run history = durable control-plane memory
- vector retrieval / semantic search = assistive retrieval, never authoritative memory

### 9. Keep deferred what is truly non-core
Do not expand scope into non-core platform breadth unless it directly supports the core harness/security thesis.

Examples that can remain deferred unless justified:
- multi-tenant enterprise breadth
- broad plugin/marketplace ideas
- advanced analytics beyond core evaluation harness
- aggressive self-improving runtime mutation
- broad multi-stack support

Keep the design disciplined:
core harness + security/tool governance now,
platform breadth later.

## What I want you to produce

Your response must include the following sections.

# 1. Research Alignment Check
Explain how the revised Forge design remains aligned with:
- the original Harness Engineering research
- the broader autonomous coding agent research
- the latest security-explicit / validator-heavy / tool-safe research

Be explicit about what the new research validated and what it required to be strengthened.

# 2. Revision Summary
Summarize the major architecture changes you are making and why.

Specifically explain the reasoning for:
- elevating the policy engine
- adding the typed tool broker / ACI
- formalizing least privilege by role
- adding security validators
- adding the evaluation harness
- clarifying memory trust hierarchy

# 3. Revised Security and Tool Governance Architecture
Add a major new section to Forge describing its security-explicit architecture.

This section should define:
- policy engine / authorization layer
- typed tool broker / ACI layer
- trust labeling and untrusted input handling
- sandbox/worktree isolation model
- secrets and credential handling
- security validator stack
- observability + audit pipeline
- approval gates for high-risk actions
- protected-path mutation rules

Use plain-text diagrams where helpful.

# 4. Typed Tool Interface Blueprint
Add a dedicated section describing Forge’s ideal curated tool layer.

At minimum define tool categories such as:
- repo read/search
- file edit/write/patch
- git operations
- test/build runners
- policy evaluation
- static/security analysis
- evidence collection
- observability/log retrieval
- browser/web access
- deployment/release
- rollback/remediation

For each category, explain:
- why it exists
- what it should expose
- what it should hide
- what structured input/output shape it should use
- what permissions and policy checks wrap it

Also explain:
- why raw shell is risky
- where raw shell remains acceptable
- why raw git is risky
- where raw git remains acceptable

# 5. Role-Based Permission Matrix
Add an explicit role-based permission section or matrix for the major Forge agents.

For each role, define:
- tools allowed
- filesystem scope
- network scope
- code mutation ability
- harness mutation ability
- external action ability
- whether it can approve / merge / deploy
- escalation requirements

This should express a principled least-privilege model.

# 6. Revised Validator Stack
Revise the existing validator design so that it now clearly includes:
- correctness validators
- architecture/policy validators
- evidence validators
- security validators
- supply-chain validators
- workflow/CI validators
- scope-drift validators

Explain when they run and what they can block.

# 7. Evaluation Harness Architecture
Add a dedicated section for Forge’s internal safety + reliability evaluation harness.

This should define:
- what Forge itself is evaluated against
- what adversarial traces or red-team scenarios should exist
- what metrics should be tracked
- what Alpha must include
- what can come later

At minimum address:
- policy violation rate
- blocked dangerous action rate
- unsafe action attempt rate
- traceability of tool actions
- evidence completeness
- false-success rate
- cross-task contamination
- time to detect unsafe behavior

# 8. Revised Memory and Knowledge Architecture
Revise the memory/knowledge model to make the trust hierarchy explicit.

Clarify the roles of:
- repo-native artifacts
- plans
- research
- harness docs
- episodic traces
- control-plane run history
- semantic retrieval / vector search

Make it explicit that retrieval augments source-of-truth artifacts rather than replacing them.

# 9. Revised Alpha Scope
Update the Alpha scope so it now clearly includes:
- policy engine
- typed tool broker / ACI
- role-based least privilege
- security validators
- security evaluation harness
- memory trust hierarchy

At the same time, explicitly keep non-core platform expansion deferred.

# 10. Updated Phase / Alpha Decision Summary
End with an updated summary that includes:
- product shape
- orchestration shape
- security architecture shape
- tool interface shape
- validator stack shape
- memory architecture shape
- Alpha must-haves
- explicitly deferred items
- next unresolved design questions

## Additional instructions

- Stay at the design layer.
- Do not generate code.
- Do not generate tickets.
- Do not generate a build spec.
- Do not weaken the repo-native control-plane thesis.
- Do not weaken DAG/worktree execution.
- Do not re-open the “MVP vs alpha” argument.
- Keep the graph as execution observability, not storage.
- Be concrete, opinionated, and architecture-focused.
- Prefer mechanisms over vague warnings.
- Explicitly explain the reasoning for each important change.

# RESPONSE:
This is the security/tool governance/policy engine revision. Let me review the current v1.2 state and produce the revision.Good. I have full context. Now let me produce the security/tool governance revision.Here's v1.3. The core addition is what you called "the hard center" — the three runtime layers that sit between the orchestrator and agent execution:

**Policy Engine → Tool Broker → Sandbox**

Every agent action now flows through this stack. There is no bypass.

The major additions in detail:

**Policy Engine as runtime authority.** Not a config file the orchestrator reads at startup — a decision service that evaluates every tool invocation against the current policy set before it proceeds. Governs filesystem scope, git operations, network egress, shell access, secrets, dependencies, harness mutation, protected paths, cost/time budgets, and scope drift. Every decision logged to the audit trail.

**Typed Tool Broker.** Ten tool categories with structured I/O: repo read/search, file edit, git (commit + status only — no branch/push/merge), test runners, policy evaluation, security analysis, evidence collection, observability, web access, and constrained shell as explicit exception. Raw shell is logged, policy-gated, and allowlisted. Raw git is orchestrator-only.

**Role-based least privilege matrix.** Every agent role has explicit permissions: what tools it can use, what paths it can read/write, whether it has network access, whether it can mutate harness files. The implementer can write code in its task scope. The reviewer can only read. The harness maintainer can write to harness files but always escalates. No agent can push, merge, or manipulate branches — those are orchestrator-only.

**Security validators in the core pipeline.** Secret scanning, dependency vulnerability scanning, dangerous shell detection, scope-drift detection, protected-path checks, harness integrity checks, evidence completeness checks. These run as part of every task's validation, not as optional hardening.

**Evaluation harness for Forge itself.** Adversarial test repos, policy enforcement unit tests, evidence completeness assertions. Measures prompt injection resistance, least-privilege correctness, secret leakage, scope drift, false success rate, and cross-task contamination.

**Memory trust hierarchy.** Repo-native artifacts are authoritative. Execution traces are operational. Run summaries are durable control-plane state. Semantic retrieval is assistive only and never overrides the source of truth.

You now have four documents forming a complete design stack:
- **v1.0** — Full product design (foundations, UX, domain model, appendices)
- **v1.1** — Trust model, staged autonomy, blessed stack, approval matrix, evidence retention
- **v1.2** — Alpha scope correction (DAG, worktrees, concurrency, agent review)
- **v1.3** — Security hard center (policy engine, typed tools, least privilege, security validators, eval harness)

Ready for the build spec whenever you are.

# OUTPUT: Forge-design-v1.3-security.md

--------------------------------------------------------------------------------
# PHASE: 1.4

# PROMPT:
* add explicit supply-chain/provenance scope for Alpha vs later
* add a concrete role × permission matrix
* formalize tool action classes + memory artifact tiers

# RESPONSE:
Now let me also check the v1.1 evidence retention model since we need to formalize memory artifact tiers.Good. Now I have full context on what's already defined and what needs to be formalized. Let me produce a focused addendum.Three things formalized:

**Supply-chain scope with explicit Alpha/later boundary.** Alpha gets: dependency vuln scanning, new-dep escalation, license scan, secret scanning, lockfile integrity, SBOM generation (informational), GitHub Actions lockdown, build script audit. Deferred: SLSA provenance/signing, reproducible builds, container image provenance, transitive deep audit, runtime SCA, blocking SBOM policies, VEX. The line is clean — Alpha prevents known-bad deps and leaked secrets; post-Alpha handles attestation infrastructure and deep audit tooling.

**Concrete role × permission matrix.** Six defined permission levels (FULL, SCOPED, READ, NONE, GATED, ESCALATE) applied to every tool × role combination. No prose qualifiers — every cell has an unambiguous value. Key invariants called out: no agent can push/merge/branch; ESCALATE always blocks; GATED requires runtime policy check; SCOPED is enforced against the task's declared file scope; all NONE attempts produce structured denials logged to the audit trail.

**Tool action classes + memory artifact tiers as named system concepts.** Six action classes (READ, MUTATE, EXECUTE, ANALYZE, NETWORK, ATTEST) that the policy engine, audit trail, evidence validators, and evaluation harness all reference. Five memory tiers (Tier 0: repo/authoritative, Tier 1: DB/operational, Tier 2: blob/ephemeral, Tier 3: container/transient, Tier R: retrieval/assistive) with explicit trust levels, mutability rules, and the core authority rule: no lower tier can override a higher tier.

No new features added — just enough precision that implementation can proceed without interpretation. Your design stack is now: v1.0 → v1.1 → v1.2 → v1.3 → v1.3.1.

# OUTPUT: Forge-design-v1.3.1-addendum.md

--------------------------------------------------------------------------------
# PHASE 2

# PROMPT:
IMPORTANT: Stay entirely in design mode.

This response must remain at the level of validation strategy, evaluation design, reliability design, benchmark design, evidence requirements, quality gates, task completion standards, and control-plane trust mechanisms.

Do not write implementation code.
Do not write framework boilerplate.
Do not write test files.
Do not write engineering tickets.
Do not produce a build spec yet.

Use only conceptual examples where necessary to clarify the design.

You are continuing from an approved Forge architecture and security design.

Forge is now defined as an **Alpha-grade repo-native autonomous coding platform** with:
- deterministic DAG orchestration
- bounded parallel execution
- per-task worktree isolation
- validator-heavy execution
- evidence bundles
- agent-to-agent review
- policy engine
- typed / curated tool broker
- repo-native source of truth
- control-plane UI over GitHub-native artifacts
- artifact-first memory hierarchy
- selective human review only at strategic pre-build checkpoints

You should assume the following have already been decided and are not to be redesigned in this phase:
- product shape
- control-plane UX shape
- DAG/worktree architecture
- validator-heavy trust model
- policy engine + typed tool broker
- memory tiers
- supply-chain scope for alpha
- security-explicit architecture

## Phase objective

Your job is to design **Phase 2: Forge’s validation and evaluation harness**.

This phase should answer:

- How does Forge know work is actually correct?
- How does Forge know a task is complete?
- How does Forge detect false success?
- How does Forge know a validator stack is sufficient?
- How does Forge evaluate itself as a platform?
- What benchmark suites should exist?
- What evidence is required before a node, phase, build, PR, or merge candidate can advance?
- How are retries, repairs, regressions, and safety violations measured?
- How do we distinguish:
  - project correctness
  - platform reliability
  - harness quality
  - security posture
  - evidence completeness

This is not only about “tests for generated apps.”
This is also about:
- validating the Forge platform
- validating the harness
- validating the agent system
- validating the trust model
- validating security boundaries
- validating evidence and observability

---

# Required sections

## 1. Phase 2 objective
Explain exactly what this phase is for and why it must happen before implementation architecture and coding-agent task decomposition.

Clarify the difference between:
- product/system design
- security architecture
- validation/evaluation design
- implementation architecture
- coding-agent task planning

## 2. Validation philosophy
Define Forge’s validation philosophy.

Address:
- why validation must be multi-layered
- why “tests passed” is insufficient
- why evidence-based completion matters
- why validator-heavy systems need explicit false-success defenses
- why the Forge platform itself must be evaluated, not just the generated software
- why agent-generated tests can be misleading unless constrained

## 3. Validation stack overview
Design the full validation stack for Forge.

Distinguish between:
- node-level validation
- task-level validation
- phase-level validation
- build-level validation
- PR-level validation
- merge-level validation
- platform-level evaluation
- benchmark-level evaluation
- security evaluation
- harness-quality evaluation

Explain how all these layers fit together.

## 4. Definition of done model
Define a rigorous definition-of-done model for Forge.

Cover:
- node completion
- task completion
- phase completion
- build completion
- PR readiness
- merge readiness
- harness update readiness

For each level, specify:
- what must be true
- required evidence
- validator gates
- blocking failures
- escalation cases

## 5. Test and evaluation taxonomy
Create the full taxonomy of Forge validations and evals.

Include:
- requirement quality checks
- architecture consistency checks
- task graph correctness checks
- policy compliance checks
- type/lint/build checks
- unit tests
- integration tests
- e2e tests
- regression tests
- security scans
- dependency checks
- architecture boundary checks
- doc freshness checks
- evidence completeness checks
- false-success checks
- repair-loop quality checks
- reviewer quality checks
- platform benchmark runs
- agent behavior evals
- tool misuse evals
- prompt injection / untrusted input evals

For each category:
- what it validates
- why it matters
- when it runs
- whether it is deterministic, agentic, or hybrid
- what failure looks like

## 6. Node-level validation design
For a single DAG node, define:
- required inputs
- required outputs
- required evidence
- validator sequence
- retry semantics
- repair-loop semantics
- escalation rules
- what marks it complete
- what causes blocked / failed / changes requested

Include separate treatment for:
- implementation node
- test-writing node
- debugger node
- reviewer node
- doc-update node
- harness-maintenance node

## 7. Build-level validation design
Define what it means for an entire build to be valid.

Cover:
- no unresolved blocking node failures
- no hidden regressions
- no architecture drift
- no policy violations
- no missing required docs/harness artifacts
- acceptable repair-loop counts
- acceptable evidence completeness
- acceptable security posture for alpha
- confidence thresholds if applicable

Also define what prevents a build from being considered done.

## 8. Evidence model for validation
Design the required evidence model in detail.

Specify what evidence must exist for different task/build types, such as:
- diffs
- files touched
- validator outputs
- build/test logs
- command traces
- screenshots
- browser traces
- policy decisions
- failure classifications
- retry history
- reviewer findings
- context-pack hash or version
- worktree identity
- security scan outputs
- dependency scan outputs

Distinguish:
- mandatory evidence
- optional evidence
- alpha-required evidence
- later-stage evidence

## 9. False-success prevention
This section is critical.

Design explicit mechanisms to detect and reduce:
- superficial fixes
- tautological tests
- green CI but wrong behavior
- missing edge cases
- fake reviewer approval
- incomplete evidence bundles
- planner outputs that sound coherent but are not executable
- architecture docs that diverge from code reality
- policy compliance “on paper” but not in practice

Be concrete.

## 10. Retry, repair, and escalation evaluation
Define how Forge evaluates retries and repair loops.

Cover:
- what counts as a valid repair attempt
- how to detect blind retrying
- repair budget / retry budget concepts
- when escalation is required
- how repair quality is measured
- how repair history should feed later harness evolution

## 11. Harness-quality evaluation
Design how the harness itself is evaluated.

Include:
- AGENTS.md quality/freshness
- docs completeness
- architecture-doc drift
- task-packet clarity
- policy coverage
- boundary rule coverage
- evidence convention completeness
- readiness score model
- missing-harness-artifact detection

Explain how Forge can tell whether the harness is genuinely helping versus becoming stale ceremony.

## 12. Security evaluation layer
Design the security-specific evaluation harness.

Include:
- prompt injection resistance tests
- untrusted tool-output handling tests
- least-privilege correctness
- disallowed action attempt tests
- secret exposure tests
- dependency risk alerts
- supply-chain scanning results
- sandbox escape / cross-worktree contamination concerns
- unsafe network egress attempts
- unsafe git/workflow mutation attempts

Explain what Alpha must validate vs what can wait.

## 13. Platform metrics
Define the full Forge evaluation metrics system.

Include:
- validated task completion rate
- first-pass success rate
- false positive completion rate
- retry count
- repair success rate
- blocked task rate
- regression rate
- architecture drift rate
- policy violation rate
- security alert rate
- evidence completeness rate
- reviewer disagreement rate
- time to trustworthy completion
- time to green
- benchmark success rate
- harness readiness score
- unsafe action attempt rate
- blocked dangerous action rate

For each:
- definition
- why it matters
- what “good” looks like for alpha
- whether it is required for alpha or later

## 14. Benchmark suite design
Design Forge’s benchmark and eval suite.

Include a benchmark set such as:
- greenfield CRUD app
- auth-enabled dashboard
- bug-fix task in an existing repo
- repo refactor task
- docs sync task
- security-sensitive patch
- dependency upgrade task
- architecture-constrained feature addition

For each benchmark:
- what it tests
- why it belongs
- what success looks like
- which validators matter most
- what failure modes are expected

## 15. Human review in the evaluation model
Define how selective human review fits into validation.

Explain:
- what still always requires human approval
- what should be auto-validated in alpha
- what should become more automated later
- how human override is recorded
- how human interventions become structured harness improvements

## 16. Alpha minimum viable eval harness
Given Forge’s current alpha scope, define the minimum viable eval harness that must exist before implementation begins.

Be strict and realistic.

Include:
- required node validators
- required build validators
- required security validators
- required evidence bundle
- required benchmark set
- required metrics
- what is explicitly deferred

## 17. Failure taxonomy
Define a rigorous failure taxonomy for Forge validation.

Cover:
- requirement failure
- planning failure
- architecture failure
- task decomposition failure
- implementation failure
- validation failure
- reviewer failure
- evidence failure
- policy failure
- security failure
- environment failure
- false-success failure
- harness failure

For each:
- definition
- detection signal
- severity
- blocking behavior
- escalation path

## 18. Repo artifacts to produce from this phase
Define what design artifacts this phase should eventually produce inside the repo.

Examples:
- `harness/definition-of-done.md`
- `harness/validation-stack.md`
- `harness/evidence-model.md`
- `harness/failure-taxonomy.md`
- `harness/platform-metrics.md`
- `harness/benchmark-suite.md`
- `harness/security-evals.md`

Do not write them in full.
Just define what should exist and what each must contain.

## 19. Open questions for the next phase
Identify what the following phase — implementation architecture — must resolve based on this validation design.

These should be implementation-shaping questions, not generic restatements.

## 20. Final Phase 2 decision summary
End with:

### Phase 2 Decision Summary

It must include:
- recommended validation philosophy
- recommended alpha validation stack
- recommended definition-of-done model
- recommended evidence requirements
- recommended benchmark suite
- recommended platform metrics
- recommended security eval layer
- top implementation questions for the next phase

---

## Additional instructions

- Stay at the design layer.
- Do not write implementation code.
- Do not write actual tests.
- Do not write task tickets.
- Do not jump ahead to implementation architecture.
- Be explicit and measurable.
- Prefer operational clarity over theory.
- Distinguish clearly between:
  - validating the generated software
  - validating Forge as a platform
  - validating the harness
  - validating security controls
  - validating agent behavior

Assume this output will become the basis for later harness docs and coding-agent task decomposition.

# RESPONSE:
This is the validation and evaluation harness design — Phase 2. Let me review what's already committed in the design stack to avoid contradiction, then produce the document.Good. I have the full design context. Now I'll produce the Phase 2 validation and evaluation harness design.Phase 2 is done — 7,200 words covering the full validation and evaluation harness design. Here's what it defines:

**Seven validation levels** stacked from node through platform, each with explicit completion requirements, required evidence, blocking conditions, and escalation paths.

**Definition-of-done contracts at every level.** Node completion requires output + scope compliance + policy compliance. Task completion requires all 19 validators passing + evidence bundle + reviewer approval. Phase completion requires full test suite + coverage threshold + harness freshness + SBOM. Build requires no BLOCKED tasks + repair metrics within bounds + aggregate confidence above threshold. Merge requires human approval.

**Nine concrete false-success prevention mechanisms.** Independent test design (Checkpoint B tests precede implementation), test adequacy review (reviewer checks for tautological tests), coverage monotonicity (coverage can never decrease), specification-test traceability (every requirement maps to a test), structural architecture tests (import graph, not naming), regression detection (full suite on merged state), evidence completeness as gate, and benchmark validation against known-outcome repos.

**Structured repair evaluation.** Repair budget per failure classification (3), per task total (5), per phase cost (≤ 20% of total). Loop detection via diff similarity, classification stability, and error identity. Repair quality measured by success rate, diff size ratio, classification change, and escalation rate.

**Eight benchmark repos** from greenfield CRUD through dependency upgrade, each with defined success criteria, key validators, and expected failure modes. Alpha minimum: three benchmarks.

**Twenty-one platform metrics** with Alpha targets. Evidence completeness: 100%. Benchmark success: >80%. False-positive completion: <5%. Secret leakage: 0. All marked as Alpha-required or deferred.

**Failure taxonomy** with 13 failure types, each with detection signal, severity, blocking behavior, and escalation path. Critical failures: validation failure (validator itself wrong), policy failure (policy engine error), false-success failure, security failure.

**Ten implementation-shaping questions** for Phase 3 — including validator parallelism, confidence score formula, test strategy isolation mechanism, and reviewer prompt design.

Your design stack is now:
- **Phase 1:** v1.0 → v1.1 → v1.2 → v1.3 → v1.3.1 (product, security, tool governance)
- **Phase 2:** validation and evaluation harness (this document)
- **Phase 3 (next):** implementation architecture

# OUTPUT: Forge-phase2-validation.md

--------------------------------------------------------------------------------
# PHASE 2.1
What still needs tightening before I’d call Phase 2 fully locked:
First, confidence score is still too magical. You correctly pushed the formula to the next phase, but at the design level I still want one more explicit statement of what confidence is and is not allowed to do. Right now it appears as both an escalation trigger and a required task completion threshold. That is okay, but dangerous if not constrained. My recommendation: say explicitly that confidence can escalate or block promotion, but it can never override a hard validator pass/fail result. In other words, confidence is a meta-signal, not a substitute for correctness.
Second, cross-task validation scheduling is still underspecified in an important way. You already flag this as an implementation question, which is correct, but it has architectural consequences. Whether cross-task validation blocks downstream task execution or runs asynchronously with rollback semantics materially changes orchestrator behavior. I would add one design preference now, even if you leave exact mechanics for next phase. My recommendation: default to non-blocking cross-task validation with bounded speculative execution, but freeze dependent tasks if a merged-state failure implicates shared interfaces. Right now the doc notices the issue but does not state a preferred policy.
forge-phase2-validation
Third, benchmark scope is good, but benchmark judgment criteria should be more explicitly split into:
* project correctness
* platform reliability
* security posture
* evidence completeness
* operator trust / intervention burden
The current summary is good, but I want that decomposition visible in the benchmark section itself so the eval harness does not collapse into “did the app work.” The Phase 2 summary hints at this, but the architecture should say it more explicitly.
Fourth, repair-loop evaluation should include a stronger anti-oscillation rule. You mention repair attempts and failure classification changes resetting counters, which is good, but I would add a design-level concept of “semantic loop detection,” not just classification repetition. Otherwise the system can bounce between superficially different failures while still thrashing.
Fifth, human review boundaries are correct but should be restated inside Phase 2, not only inherited from earlier phases. You already preserve human-required merge at Checkpoint D and pre-build approvals in earlier phases. I would add one explicit line in Phase 2 saying: “The eval harness validates the platform; it does not remove the human governance checkpoints already established in the architecture.” That just prevents future drift.

# RESPONSE: 
Good notes. These are all tightening passes, not architectural changes. Let me produce a focused amendment.Good. I know exactly what needs to change. Five targeted amendments.Five amendments, all tightening — no scope changes.

**Amendment 1 — Confidence constraints.** The formal rule: "No confidence score, however high, may be used to bypass, skip, override, or downgrade the result of any blocking validator." Confidence is a post-validation meta-signal. It can escalate or slow promotion. It cannot excuse a failing gate. Must be stated in `harness/definition-of-done.md`.

**Amendment 2 — Cross-task validation scheduling.** Design preference locked: non-blocking cross-task validation with bounded speculative execution (max 2 tasks speculative). Freeze on shared-interface failure. Rollback and re-queue if a merged task broke a previously passing test. This preserves concurrency throughput while containing blast radius. Exact "shared interface" heuristic left to implementation.

**Amendment 3 — Benchmark judgment decomposition.** Five independent scoring dimensions per benchmark run: project correctness, platform reliability, security posture, evidence completeness, operator trust / intervention burden. Each benchmark specifies which dimensions it primarily stresses. Scorecard template defined so the eval harness never collapses into "did the app work."

**Amendment 4 — Semantic loop detection.** Four new repair escalation triggers beyond the existing three: failure-set not shrinking over 3 attempts, oscillation pattern (A→B→A), two consecutive negative-progress attempts (fix broke something else), and repair diff exceeding 50% of original diff (rewrite creep). All active in Alpha.

**Amendment 5 — Human governance invariant.** Explicit statement: "The evaluation harness validates the platform. It does not remove, replace, or reduce the human governance checkpoints established in the Phase 1 architecture." Checkpoints A/B/C/D and the two policy gates (harness changes, new dependencies) are structural governance, not temporary scaffolding. They persist regardless of how good the eval harness becomes.

Phase 2 is locked. Your design stack:
- **Phase 1:** v1.0 → v1.1 → v1.2 → v1.3 → v1.3.1
- **Phase 2:** validation harness + amendment
- **Phase 3 (next):** implementation architecture

# OUTPUT: Forge-phase2-amendment.md

--------------------------------------------------------------------------------
# PHASE 3

# PROMPT:
IMPORTANT: Stay entirely in design mode.

This response must remain at the level of implementation architecture, subsystem design, interfaces, runtime design, data model design, control flow, event flow, storage strategy, and operational boundaries.

Do not write implementation code.
Do not write framework boilerplate.
Do not write migrations or schemas in code form.
Do not write frontend components.
Do not write backend handlers.
Do not write engineering tickets yet.

Use only conceptual examples, diagrams, schemas, and interface descriptions where necessary to clarify the design.

You are continuing from approved Forge design artifacts.

Forge is now defined as an **Alpha-grade repo-native autonomous coding platform** with:
- deterministic DAG orchestration
- bounded parallel execution
- per-task worktree isolation
- validator-heavy execution
- evidence bundles
- agent-to-agent review
- policy engine
- typed / curated tool broker
- repo-native source of truth
- control-plane UI over GitHub-native artifacts
- artifact-first memory hierarchy
- selective human review only at strategic pre-build checkpoints
- an approved Phase 2 validation/eval harness

You should assume the following are already decided and are not to be redesigned in this phase:
- product shape
- control-plane UX shape
- DAG/worktree architecture at a conceptual level
- validator-heavy trust model
- policy engine + typed tool broker as architectural requirements
- memory tiers and source-of-truth hierarchy
- supply-chain/security scope for alpha
- validation/eval harness philosophy
- phase order and governance checkpoints

## Phase objective

Your job is to design **Phase 3: Forge’s implementation architecture / subsystem breakdown**.

This phase should answer:

- What are the concrete subsystems Forge needs?
- What are their responsibilities and boundaries?
- How do they communicate?
- What data/state must each subsystem own?
- How does the DAG runtime actually function at the systems level?
- How do worktrees, containers, validators, evidence, policies, and memory fit together operationally?
- What is synchronous vs asynchronous?
- What belongs in the backend, workers, runtime, and UI?
- What are the major domain objects and state transitions?
- What external systems/interfaces does Forge depend on?
- What is the minimum coherent Alpha implementation architecture?

This phase is not about task decomposition yet.
It is about creating a buildable, coherent system architecture that later phases can decompose into tasks.

---

# Required sections

## 1. Phase 3 objective
Explain exactly what this phase is for and why it follows Phase 2.

Clarify the difference between:
- product/system design
- security architecture
- validation/eval design
- implementation architecture
- coding-agent task planning

Explain why implementation architecture must come before coding-agent task decomposition.

## 2. System context and top-level architecture
Describe Forge as a whole system.

Provide a top-level architecture showing the major major zones, such as:
- control-plane frontend
- control-plane backend/API
- orchestrator / DAG runtime
- policy engine
- tool broker / ACI layer
- worker/runtime layer
- validator execution layer
- evidence pipeline
- memory / artifact indexing layer
- benchmark/eval harness
- GitHub integration layer
- storage systems
- observability/audit systems

Include a plain-text system diagram.

## 3. Subsystem breakdown
Define the core subsystems Forge needs.

At minimum include:
- Control Plane API
- Orchestrator / DAG Scheduler
- Task State Machine Engine
- Context Packager
- Policy Engine
- Tool Broker / Typed ACI
- Runtime Manager (worktrees + containers)
- Agent Runner
- Validator Runner
- Evidence Collector
- Memory / Indexing Layer
- GitHub Integration Layer
- Benchmark/Eval Harness
- Audit / Observability Pipeline
- Review / Approval Service

For each subsystem, specify:
- purpose
- responsibilities
- inputs
- outputs
- owned state
- dependencies
- what it must not do
- failure modes

## 4. Orchestrator and DAG runtime design
Design the orchestrator in detail.

Cover:
- DAG representation
- node lifecycle
- dependency resolution
- bounded concurrency
- node scheduling
- retry and repair insertion
- freeze-on-shared-interface semantics
- speculative execution limits
- cancellation semantics
- rollback / requeue logic
- idempotency expectations
- checkpointing / resumability
- degraded sequential fallback mode

Explain what the orchestrator is allowed to decide deterministically and what must come from upstream artifacts/policies.

## 5. Task state machine design
Design the runtime task/node state machine.

Include states such as:
- drafted
- queued
- waiting_on_dependencies
- scheduled
- provisioning
- running
- awaiting_validation
- validating
- awaiting_review
- changes_requested
- repairing
- blocked
- escalated
- succeeded
- failed
- canceled
- archived

Define:
- transitions
- who/what can trigger them
- blocking conditions
- terminal states
- timeout behavior
- retry behavior
- evidence requirements by state

## 6. Worktree and runtime manager architecture
Design how Forge provisions and manages execution environments.

Cover:
- per-task worktree creation
- branch/worktree naming model
- workspace checkout strategy
- container lifecycle
- environment initialization
- dependency installation policy
- runtime reuse vs fresh runtime
- cleanup / GC strategy
- resource isolation
- filesystem boundaries
- network policy attachment
- worktree-to-node mapping
- runtime observability attachment
- failure recovery if provisioning breaks

Clarify what belongs to the runtime manager vs tool broker vs orchestrator.

## 7. Policy engine architecture
Design the policy engine concretely.

Cover:
- policy inputs
- policy evaluation moments
- deny/allow/escalate outcomes
- policy categories
- policy inheritance / precedence
- action classification model
- policy audit trail
- interaction with tool broker
- interaction with orchestrator
- interaction with approvals
- handling protected files/paths
- handling dependency changes
- handling harness changes
- handling external side effects

Explain how policy decisions are exposed to the rest of the system.

## 8. Typed tool broker / ACI architecture
Design the tool broker in detail.

Cover the action classes such as:
- REPO_READ
- SEARCH
- FILE_MUTATION
- BUILD_TEST_EXECUTE
- GIT_MUTATION
- NETWORK
- BROWSER
- POLICY_INTROSPECTION
- OBSERVABILITY_READ
- EVIDENCE_CAPTURE
- RELEASE / DEPLOY
- ROLLBACK / REMEDIATION

For each class, define:
- what operations belong there
- what structured inputs look like conceptually
- what structured outputs look like conceptually
- what permissions wrap it
- what evidence is automatically produced
- what should be disallowed or hidden
- when escalation is required

Also explain:
- shell as fallback vs default
- how tool outputs are normalized
- how untrusted outputs are labeled
- how traceability is preserved

## 9. Agent runner architecture
Design how agents are executed.

Cover:
- how an agent run is created
- what context it receives
- how prompts/instructions are composed
- how trusted vs untrusted context is separated
- how model/provider selection fits in
- how timeouts and budget limits are enforced
- how tool calls are mediated
- how outputs are parsed/validated
- how agent identity/role is enforced
- how agent runs connect to node/task ids
- how agent outputs become artifacts vs proposals vs review comments

Distinguish between:
- planner-like agents
- builder agents
- validator/reviewer agents
- maintenance agents

## 10. Validator execution architecture
Design how validators run as a subsystem.

Cover:
- deterministic validator execution
- agentic validator execution
- validator sequencing
- validator fan-out/fan-in
- cross-task validation
- merged-state validation
- confidence as meta-signal
- security validator integration
- evidence completeness validator
- reviewer integration
- fail-fast vs full-collection modes
- validator result normalization
- validator result storage
- validator-triggered escalation

Explain how validator outputs affect state transitions.

## 11. Evidence pipeline architecture
Design the evidence system in concrete terms.

Cover:
- what evidence is captured automatically
- node-scoped evidence
- task-scoped evidence
- build-scoped evidence
- policy evidence
- security evidence
- reviewer evidence
- repair history
- trace linking
- evidence retention tiers
- evidence indexing
- evidence completeness checks
- evidence access in UI
- evidence linkage to approvals and metrics

Explain where evidence lives and how it is queried.

## 12. Memory and indexing architecture
Design the artifact-first memory layer.

Cover:
- Tier 0 authoritative repo artifacts
- Tier 1 structured operational records
- Tier 2 forensic/raw artifacts
- Tier 3 transient runtime state
- Tier R assistive retrieval

Explain:
- what store backs each tier
- how indexing works
- what is durable vs ephemeral
- what retrieval is allowed to influence
- how summaries are produced
- how decision traces are recorded
- how memory supports planning vs build vs debugging vs review
- how stale/misleading memory is prevented from overriding repo truth

## 13. GitHub integration architecture
Design the GitHub-facing subsystem.

Cover:
- repo connection / auth model
- branch and PR model
- worktree mapping to branches
- commit authorship model
- PR creation
- status checks
- review comment ingestion
- workflow mutation restrictions
- protected branch interaction
- secrets / Actions interaction boundaries
- merge candidate workflow
- merge execution rules
- rollback/revert relationship to GitHub

Explain what stays in Forge vs what is delegated to GitHub-native primitives.

## 14. Storage architecture
Design the storage model.

Differentiate what belongs in:
- relational database
- object/blob storage
- search index
- event store / log stream
- cache
- metrics / observability store

For each category of data, specify:
- storage type
- durability requirement
- retention behavior
- query patterns
- why that store is appropriate

## 15. Event model and async architecture
Design the system’s event-driven behavior.

Include:
- key event types
- event producers
- event consumers
- sequencing guarantees
- idempotency
- retry semantics
- dead-letter / failure handling
- auditability
- real-time UI updates
- benchmark/eval event capture

Explain which workflows are:
- request/response
- async job-based
- event-driven
- long-running stateful processes

## 16. Observability and audit architecture
Design the observability stack.

Cover:
- runtime logs
- task/node traces
- tool invocation traces
- validator traces
- policy decisions
- security events
- resource usage
- benchmark/eval metrics
- audit logs
- UI inspection paths

Explain:
- what humans need to see
- what agents are allowed to see
- what gets retained
- how observability supports debugging, review, and harness evolution

## 17. Alpha external dependencies and interfaces
List the critical external systems Forge depends on in Alpha.

Examples:
- GitHub
- model providers
- container/runtime infrastructure
- search/indexing components
- security scanning tools
- browser automation infrastructure
- storage infrastructure

For each, specify:
- why it is needed
- what capability it provides
- what trust boundary it creates
- what would need to be abstracted later

## 18. Failure domains and blast radius model
Design the failure-domain model for the implementation architecture.

Cover:
- task runtime failure
- validator failure
- policy engine failure
- tool broker failure
- runtime provisioning failure
- GitHub integration failure
- storage/indexing failure
- event bus failure
- benchmark harness failure
- UI/control-plane degradation

For each:
- blast radius
- isolation strategy
- fallback behavior
- operator visibility
- whether execution can continue safely

## 19. Alpha implementation cut
Given everything above, define the minimum coherent Alpha implementation architecture.

Be strict and realistic.

Specify:
- what subsystems must fully exist
- what can be simplified
- what can be stubbed or narrowed
- what can remain manual behind the scenes
- what must not be deferred without breaking the core thesis

This should not be a toy.
It should be the smallest architecture that still faithfully implements Forge’s Alpha thesis.

## 20. Repo artifacts to produce from this phase
Define what design artifacts Phase 3 should produce inside the repo.

Examples:
- `architecture/system-context.md`
- `architecture/subsystems.md`
- `architecture/orchestrator-runtime.md`
- `architecture/task-state-machine.md`
- `architecture/tool-broker.md`
- `architecture/policy-engine.md`
- `architecture/evidence-pipeline.md`
- `architecture/memory-layer.md`
- `architecture/storage-model.md`
- `architecture/event-model.md`

Do not write them in full.
Just define what should exist and what each should contain.

## 21. Open questions for Phase 4
Identify what the next phase — task graph / coding packet decomposition — will need to resolve based on this architecture.

These should be decomposition-shaping questions, not generic restatements.

## 22. Final Phase 3 decision summary
End with:

### Phase 3 Decision Summary

It must include:
- recommended subsystem architecture
- recommended orchestrator/runtime model
- recommended policy/tool-broker model
- recommended evidence/memory/storage model
- recommended event model
- recommended Alpha implementation cut
- main failure domains
- top questions for Phase 4 task decomposition

---

## Additional instructions

- Stay at the design layer.
- Do not write code.
- Do not write tickets yet.
- Do not jump ahead to task decomposition.
- Be explicit and operational.
- Prefer crisp subsystem boundaries over vague platform language.
- Distinguish clearly between:
  - orchestration logic
  - runtime execution
  - policy enforcement
  - tool mediation
  - validation
  - evidence capture
  - memory/indexing
  - UI/control-plane behavior

Assume this output will become the basis for Phase 4 coding-agent task decomposition.

# RESPONSE:
This is the most complex phase yet — the implementation architecture. Let me review what's committed to ensure consistency, then produce the document.Good. Now I have full context across all phases. Let me produce Phase 3.Phase 3 is done — 7,300 words defining the buildable implementation architecture. Here's the structure:

**Fifteen subsystems** with crisp boundaries: each one has defined purpose, responsibilities, inputs, outputs, owned state, dependencies, what it must not do, and failure modes. The key separations:

- **Orchestrator** owns the DAG and scheduling. It never executes agents or runs validators.
- **Policy Engine** is a synchronous gate on every tool invocation. Fail-closed — if it's down, everything stops. This is correct.
- **Tool Broker** is the typed ACI layer. Six action classes (READ, MUTATE, EXECUTE, ANALYZE, NETWORK, ATTEST) with structured I/O. Raw shell is a GATED exception, not the default.
- **Agent Runner** handles a single agent invocation: prompt composition, model calls, tool call mediation. It never touches the DAG or makes scheduling decisions.
- **Validator Runner** executes the four-layer pipeline. Fail-forward within layers (compilation fails → still run lint for more feedback), fail-fast across layers (Layer 1 fails → skip Layer 2-4).
- **Evidence Collector** is append-only. Evidence completeness is a blocking gate.

**Task state machine** with 16 states, explicit transitions, and clear terminal states. The important design choice: SUCCEEDED requires evidence bundle. MERGED requires successful merge-back. BLOCKED triggers escalation. Timeout on RUNNING → FAILED.

**Concrete storage mapping**: PostgreSQL for durable structured data, Redis for state/events/queue, S3 for blobs, pgvector for search. One store per concern, no overlap.

**Failure domain model**: Policy Engine and Tool Broker are fail-closed (safe). Container crash is recoverable. PostgreSQL is the critical store. GitHub API downtime pauses merge-back but not agent work. UI downtime doesn't affect builds.

**Alpha implementation cut**: all 15 subsystems present, simplified where possible (pgvector not standalone search, single Docker host, hardcoded model routing). Stubbed: browser automation, SBOM parsing. Must not defer: worktree isolation, policy engine, typed tools, evidence bundles, bounded concurrency.

Your complete design stack:
- **Phase 1:** v1.0 → v1.1 → v1.2 → v1.3 → v1.3.1 (product, security, governance)
- **Phase 2:** validation harness + amendment (what "correct" means)
- **Phase 3:** implementation architecture (this document — what to build)
- **Phase 4 (next):** task decomposition and coding packets

# OUTPUT: Forge-phase3-implementation.md

--------------------------------------------------------------------------------
# PHASE 3.1

# PROMPT:
1. Container model likely needs one explicit decision
Right now it says one container per build phase with one worktree per task inside it.
That is efficient, but it weakens isolation compared with per-task containerization. It may still be the right Alpha choice, but the doc should state explicitly:
* why phase-container + worktree isolation is sufficient for Alpha
* what risks remain compared with per-task containers
* what classes of contamination are still possible
* what would trigger upgrading to per-task containers later
Without that, this choice looks pragmatic but under-justified.
2. The action-class naming is inconsistent with earlier security language
Here you use:
* READ
* MUTATE
* EXECUTE
* ANALYZE
* NETWORK
* ATTEST
That is workable, but earlier discussion leaned toward a more domain-explicit classification like repo read, file mutation, git mutation, build/test execution, observability read, etc.
The current model is not wrong, but it may be too coarse for policy authoring and UI explanation. I would at least note that these are the Alpha-normalized classes, and that finer-grained classes may be added later if policy pressure demands it.
3. Validator runner probably needs one sentence on agentic validators
Right now it mostly reads as a deterministic pipeline runner, which is good, but Forge also includes reviewer/agentic validator concepts.
I would add one explicit statement clarifying:
* which validators are deterministic
* which validators are agentic
* how agentic review plugs into the validator lifecycle without blurring the distinction
The current design implies it, but Phase 3 should say it once.
4. Evidence Tier 0 wording is slightly awkward
You mark diff evidence as “Tier 0 (committed) + Tier 1 metadata.”
That is directionally fine, but technically the diff before merge is not yet authoritative repo truth. I would clarify:
* pre-merge diff metadata lives in Tier 1 / Tier 2 evidence
* post-merge committed code becomes Tier 0 authority
That avoids confusion in the memory model.
5. Postgres fallback language is a little optimistic
In the failure table, “PostgreSQL down → read from Redis cache, pause writes” is plausible for short degradation, but for a system with orchestrator/state/evidence coupling, you probably want stronger wording:
* UI may remain partially readable from cache
* scheduling and state transitions should degrade hard or pause
* no subsystem should continue making meaningful progress without durable state
The current phrasing risks making the platform sound more durable under DB loss than it probably should be in Alpha.

# RESPONSE:
Good catches. These are all precision improvements to Phase 3. Let me produce a focused amendment.Five precision corrections, all tightening:

**Amendment 1 — Container isolation justified.** Phase-container + worktree is explicitly defended: single-user Alpha, Tool Broker enforces filesystem scope, shell allowlist constrains processes, egress filtering at container level. Risks documented: shared process namespace (fork bomb), shared /tmp and caches, shared network namespace, no container escape defense. Upgrade triggers: multi-tenant, observed cross-task contamination, untrusted code execution, security audit finding.

**Amendment 2 — Action class granularity scoped.** The six classes are Alpha-normalized, intentionally coarse. The Tool Broker internally tracks specific tool names for full audit granularity even though the policy engine operates at class level. Finer-grained classes (FILE_MUTATION vs GIT_MUTATION, BUILD_TEST vs SHELL, REPO_READ vs OBSERVABILITY_READ) are added when policy authoring pressure, audit ambiguity, UI explanation needs, or security boundary refinement demand them. Splitting is additive.

**Amendment 3 — Agentic vs deterministic validators distinguished.** Sixteen deterministic validators listed explicitly. Three agentic validators listed (reviewer, test adequacy, semantic doc freshness). Ordering is architectural: deterministic runs first (VALIDATING), agentic runs after all mechanical checks pass (AWAITING_REVIEW). Agentic review cannot override a deterministic failure. This preserves the Phase 2 confidence constraint.

**Amendment 4 — Evidence Tier 0 corrected.** Pre-merge diff is Tier 1/2 evidence (operational, not yet authoritative). Post-merge committed code is Tier 0 (authoritative). The phase branch is "working truth" for subsequent tasks but is not Tier 0 until merged to main at Checkpoint D.

**Amendment 5 — PostgreSQL failure is a hard pause.** Orchestrator stops scheduling. State machine freezes. Evidence and audit queue to Redis (bounded buffer). Agent runs may continue their current LLM call but results can't persist. Recovery: read last-committed state, flush Redis buffers, reconcile RUNNING tasks, resume. The design principle: "PostgreSQL loss is a hard pause, not graceful degradation. The system pauses safely and resumes correctly, not continues without durable state."

Phase 3 is locked. Your full design stack:
- **Phase 1:** v1.0 → v1.1 → v1.2 → v1.3 → v1.3.1
- **Phase 2:** validation harness + amendment
- **Phase 3:** implementation architecture + amendment
- **Phase 4 (next):** task decomposition and coding packets

# OUTPUT: Forge-phase3-amendment.md


--------------------------------------------------------------------------------
# PHASE 4

# PROMPT:
IMPORTANT: Stay entirely in design mode.

This response must remain at the level of task decomposition, dependency design, coding packet design, execution planning, validator assignment, artifact mapping, and phase-aware implementation sequencing.

Do not write implementation code.
Do not write framework boilerplate.
Do not write migrations or schemas in code form.
Do not write frontend components.
Do not write backend handlers.
Do not turn tasks into Jira-style fluff.
Do not generate a build spec with code snippets.
Do not skip ahead into coding.

Use only conceptual task definitions, dependency structures, acceptance criteria, and packet schemas where necessary to clarify the design.

You are continuing from approved Forge design artifacts.

Forge is now defined as an **Alpha-grade repo-native autonomous coding platform** with:
- deterministic DAG orchestration
- bounded parallel execution
- per-task worktree isolation inside phase containers
- validator-heavy execution
- evidence bundles
- agent-to-agent review
- policy engine
- typed / curated tool broker
- repo-native source of truth
- control-plane UI over GitHub-native artifacts
- artifact-first memory hierarchy
- selective human review only at strategic pre-build checkpoints
- an approved Phase 2 validation/eval harness
- an approved Phase 3 implementation architecture

You should assume the following are already decided and are not to be redesigned in this phase:
- product shape
- control-plane UX shape
- DAG/worktree architecture
- validator-heavy trust model
- policy engine + typed tool broker
- memory tiers and source-of-truth hierarchy
- supply-chain/security scope for alpha
- validation/eval harness philosophy
- implementation architecture / subsystem breakdown
- orchestrator/runtime model
- storage/event model
- governance checkpoints

## Phase objective

Your job is to design **Phase 4: the task graph / coding packet decomposition** for Forge.

This phase should answer:

- What are the implementation workstreams?
- What major milestones exist?
- How should the work be decomposed into DAG-executable task packets?
- What depends on what?
- Which tasks can run in parallel?
- Which tasks must be serialized?
- What validators attach to each task?
- What evidence is required for each task?
- What artifacts must each task produce?
- Which tasks are risky and require finer slicing?
- What is the correct sequencing to build Forge Alpha coherently?

This phase is not about writing code.
It is about turning the approved architecture into an executable task graph that coding agents can later work from.

---

# Required sections

## 1. Phase 4 objective
Explain exactly what this phase is for and why it follows implementation architecture.

Clarify the difference between:
- implementation architecture
- task graph decomposition
- coding packets
- execution scheduling
- actual code generation

Explain why task decomposition must come after the implementation architecture is stable.

## 2. Task decomposition philosophy
Define the principles Forge should use to decompose work.

Address:
- what makes a task “good” for coding agents
- what makes a task too vague
- what makes a task too large
- what makes a task independently verifiable
- what makes a task safely parallelizable
- how to decompose around interfaces, artifacts, and validators
- how to avoid creating tasks that are “agent theater”
- how to avoid tasks that require hidden architectural decisions

## 3. Alpha implementation workstreams
Identify the major workstreams needed to build Forge Alpha.

At minimum, cover workstreams such as:
- control-plane backend/API
- control-plane frontend
- orchestrator / DAG runtime
- task state machine
- policy engine
- tool broker / ACI layer
- runtime manager (worktrees + phase containers)
- agent runner
- validator runner
- evidence pipeline
- memory / indexing layer
- GitHub integration
- benchmark/eval harness
- audit / observability layer
- review / approval layer

For each workstream:
- purpose
- major deliverables
- why it is separable
- major dependencies
- risk level
- likely task granularity

## 4. Milestone hierarchy
Define the milestone structure for Forge Alpha.

Create a milestone hierarchy such as:
- Foundation milestone
- Core runtime milestone
- Validation/security milestone
- Control-plane milestone
- Integration milestone
- Alpha hardening milestone

For each milestone:
- what it contains
- what must be complete before it starts
- what completion means
- what risks it retires

## 5. DAG decomposition strategy
Design how the implementation work should become a DAG.

Explain:
- what the node types are
- what the edge/dependency types are
- how to model interface dependencies
- how to model validator dependencies
- how to model policy dependencies
- how to model documentation dependencies
- how to model shared-infrastructure dependencies
- when to use fan-out/fan-in
- how to avoid false parallelism
- how to handle speculative execution
- how to handle high-risk nodes

## 6. Task packet schema
Define the canonical schema for a coding packet.

Each packet should conceptually include:
- packet id
- title
- objective
- scope
- out-of-scope
- owning workstream
- milestone
- prerequisite packets
- required inputs/artifacts
- files or subsystem areas in scope
- protected files/areas
- expected outputs/artifacts
- validator set
- evidence requirements
- completion criteria
- risk level
- escalation triggers
- policy sensitivities
- documentation updates required
- benchmark/eval implications

Explain why each field exists.

## 7. Packet sizing rules
Define the rules for how large/small a packet should be.

Address:
- ideal packet size for coding agents
- when a packet must be split
- when multiple packets should be merged
- how many files/modules a packet can reasonably touch
- how to handle cross-cutting changes
- when a packet becomes too risky for one node
- when a packet should be converted into a parent/child packet structure

## 8. Foundation packets
Design the foundational packet set needed before the rest of the DAG becomes viable.

These likely include things like:
- repo skeleton and architecture artifact scaffolding
- durable domain model definitions
- event taxonomy
- orchestrator state model
- task/node persistence model
- policy model skeleton
- tool action taxonomy
- evidence schema skeleton
- memory tier schema
- benchmark fixture strategy

For each foundation packet:
- objective
- dependencies
- validators
- evidence
- completion criteria
- whether it blocks later packets

## 9. Core runtime packet graph
Design the packet graph for the core runtime.

At minimum include packet groups for:
- orchestrator runtime
- task state machine
- runtime manager
- worktree management
- event production/consumption
- checkpointing/resume
- bounded concurrency
- freeze-on-shared-interface logic
- cancellation and retry flows

Explain the ordering and parallelization opportunities.

## 10. Security/policy/tooling packet graph
Design the packet graph for:
- policy engine
- typed tool broker
- permission matrix enforcement
- tool result trust labeling
- shell fallback control
- protected path handling
- dependency/harness mutation policy
- security scan integration
- supply-chain visibility integration

Explain which packets must exist before builder agents can safely do meaningful work.

## 11. Validation/evidence packet graph
Design the packet graph for:
- validator runner
- deterministic validator interfaces
- agentic reviewer integration
- evidence collector
- evidence completeness checks
- failure taxonomy plumbing
- confidence meta-signal plumbing
- benchmark harness runtime
- platform metrics collection

Explain how this workstream interacts with orchestrator and runtime packets.

## 12. Memory/indexing packet graph
Design the packet graph for:
- artifact-tier storage mapping
- run summary generation
- evidence indexing
- searchable artifact catalog
- retrieval boundaries
- memory read APIs
- memory freshness / trust labeling
- decision trace linking

Be explicit about what is foundational vs what can come later in Alpha.

## 13. GitHub/control-plane packet graph
Design the packet graph for:
- GitHub auth/connection
- branch/worktree mapping
- PR creation/status integration
- review comment ingestion
- approval service
- control-plane read APIs
- control-plane write APIs
- real-time run status updates
- file tree / artifact navigation support
- evidence inspection views

Explain what can be parallelized between backend/frontend and what cannot.

## 14. Packet dependency matrix
Produce a dependency matrix or dependency mapping across the major packet groups.

At minimum show:
- hard dependencies
- soft dependencies
- validator prerequisites
- integration points
- fan-in nodes
- critical path

Explain what the critical path for Alpha looks like.

## 15. Parallelization strategy
Design the recommended parallelization strategy for implementation work.

Explain:
- which workstreams can run in parallel early
- which must remain serialized
- where interface-first packets unlock parallel work
- where speculative execution is acceptable
- where speculative execution is dangerous
- how many concurrent coding packets are reasonable in Alpha development
- what should be protected from parallel modification

## 16. Task risk taxonomy
Define a taxonomy for packet risk.

For example:
- low-risk local packet
- medium-risk interface packet
- high-risk cross-cutting packet
- policy-sensitive packet
- security-sensitive packet
- architectural packet
- benchmark-affecting packet

For each:
- what makes it risky
- what validators it needs
- whether human oversight is required
- whether it should be smaller than normal

## 17. Validator assignment model
Define how validators attach to packets.

Explain:
- baseline validator set for all packets
- extra validators by workstream
- extra validators by risk class
- security validators
- architecture validators
- evidence validators
- reviewer requirements
- benchmark/eval implications
- packet promotion rules

Make this packet-centric and explicit.

## 18. Documentation and artifact update rules
Define when packets must update:
- architecture docs
- harness docs
- AGENTS.md
- validation docs
- policy docs
- benchmark docs
- runbooks
- tech debt tracker

Explain which packet classes require doc updates and how doc updates should be treated in completion criteria.

## 19. Alpha task graph proposal
Produce a proposed first-pass DAG/task graph for Forge Alpha.

This should include:
- major packet groups
- packet ordering
- parent/child relationships
- blocking packets
- parallel packets
- milestone alignment
- critical path packets

Do not write implementation tickets in the style of a sprint board.
Keep this as an architecture-grade execution graph.

## 20. Readiness and gating model for coding agents
Define what must be true before coding agents should be allowed to execute from this graph.

Cover:
- architecture stability thresholds
- packet quality thresholds
- validator assignment completeness
- artifact availability
- policy coverage
- benchmark fixture readiness
- approval checkpoints

Explain what makes the graph safe enough to operationalize.

## 21. Repo artifacts to produce from this phase
Define what design artifacts Phase 4 should produce inside the repo.

Examples:
- `plans/alpha-milestones.md`
- `plans/task-graph.md`
- `plans/packet-schema.md`
- `plans/dependency-matrix.md`
- `plans/validator-assignment.md`
- `plans/parallelization-strategy.md`
- `plans/risk-taxonomy.md`

Do not write them in full.
Just define what should exist and what each must contain.

## 22. Open questions for Phase 5
Identify what the next phase — coding-agent execution planning / operator workflow / initial packet rollout — will need to resolve.

These should be operationalization questions, not architecture restatements.

## 23. Final Phase 4 decision summary
End with:

### Phase 4 Decision Summary

It must include:
- recommended task decomposition philosophy
- recommended milestone hierarchy
- recommended packet schema
- recommended critical path
- recommended parallelization strategy
- recommended validator assignment model
- recommended Alpha task graph shape
- top operationalization questions for the next phase

---

## Additional instructions

- Stay at the design layer.
- Do not write code.
- Do not write actual tickets for implementation yet.
- Do not collapse this into a vague sprint plan.
- Be concrete and execution-oriented.
- Prefer dependency-aware decomposition over laundry lists.
- Distinguish clearly between:
  - subsystem architecture
  - packet decomposition
  - validator attachment
  - artifact production
  - execution sequencing

Assume this output will become the direct basis for coding-agent task generation in the following phase.

# RESPONSE:
This is the task decomposition phase. Let me review the Phase 3 subsystem boundaries to ensure the packets decompose cleanly against them.Good. Now I have full context. Let me produce the Phase 4 task decomposition.Phase 4 is done. Here's what it defines:

**15 workstreams** decomposing the 15 subsystems from Phase 3 into concrete packet groups. Each workstream has defined purpose, deliverables, dependencies, risk level, and estimated packet count.

**5 milestones** with clear sequencing:
- **M0 (Foundation, Week 1-2):** 10 packets — repo skeleton, Prisma schema, shared interfaces, event types, action class types, infrastructure connections, Docker image, job queue setup. Everything depends on this.
- **M1 (Core Runtime, Week 2-5):** ~40-45 packets — orchestrator, policy engine, runtime manager, tool broker, GitHub integration. The policy engine (F-WS3-003) is the critical gate — nothing executes until it's merged.
- **M2 (Agent + Validation, Week 4-7):** ~20-25 packets — agent runner, validator runner (all four layers), evidence pipeline, audit pipeline. Overlaps M1.
- **M3 (Control Plane, Week 5-8):** ~18-24 packets — approval service, REST API, WebSocket server, full three-pane frontend. Overlaps M2.
- **M4 (Integration, Week 7-10):** ~8-10 packets — benchmark harness, E2E tests, harness templates, planner prompts.

**~95-110 total packets** across the entire Alpha build. Each packet has an 18-field schema: id, title, objective, scope, out-of-scope, workstream, milestone, prerequisites, inputs, outputs, validators, evidence, completion criteria, risk level, escalation triggers, policy sensitivities, doc updates.

**Critical path:** Foundation types → policy engine core → tool broker core → EXECUTE tools → validator runner → cross-task validation → E2E integration. The critical path runs through security (policy engine) and trust (validators) by design.

**Parallelization:** 4-5 concurrent streams during M1, 5-7 during M2, up to 8 during M3. Interface-first strategy: M0 defines all cross-subsystem interfaces, unlocking parallel implementation in M1.

**Readiness gates:** Eight conditions that must be true before coding agents start executing M1+ packets — architecture locked, interfaces complete, validators assigned, policy rules authored, harness templates tested, benchmark fixtures created, prompt templates drafted, and M0 merged.

Your complete design stack:
- **Phase 1:** Product design + revisions (v1.0–v1.3.1)
- **Phase 2:** Validation harness + amendment
- **Phase 3:** Implementation architecture + amendment
- **Phase 4:** Task graph decomposition (this document)
- **Phase 5 (next):** Operationalization — how to actually run this graph

# OUTPUT: Forge-phase4-task-graph.md

--------------------------------------------------------------------------------
# PHASE 4.1
What still needs tightening:

1. The 8-week / 73-packet plan is too optimistic

This is the biggest issue.

The structure is good, but the timeline is almost certainly compressed. Not because 73 is too many, but because several packets on the critical path are actually architecture-bearing, not ordinary implementation packets:

subsystem interface contracts

tool action definitions

policy rule definitions

task state machine definition

tool broker framework

execute tools

validator executor

correctness/security/policy/evidence validators

orchestrator integration

These are not low-friction build tasks. They are the exact places where rework tends to happen. So the packet graph is valid, but the duration estimate should be treated as optimistic best case, not planning truth. The design should say that explicitly.

2. Foundation is slightly under-modeled as a review bottleneck

You already say key interfaces and schema need human review. Good. But M0 is more than “just get through the files.” It is the point where later parallelism becomes safe or unsafe. In practice, M0 should probably be split into:

M0a Core contracts

M0b Harness/runtime scaffolding

Because subsystem interfaces, state machine, policy rules, tool action classes, and evidence schema are much more foundational than Docker image and harness templates. Right now they are all grouped together, which is directionally okay but structurally flatter than it should be.

3. The Agent Runner workstream is under-specified in the packet graph

W6 is mentioned, but unlike W2/W3/W4/W5/W7/W8/W9/W13, it does not get a real packet breakdown in the document excerpt. That is a gap. Since Agent Runner is one of the core runtime subsystems, it needs the same packetization treatment:

context pack composer

prompt assembly / trust labeling

model invocation abstraction

tool mediation integration

structured output parsing

budget enforcement

run record persistence

Without that, the graph is slightly asymmetric.

4. Integration packets are still too few for the implied system complexity

The document has the right concept of integration packets, but the actual graph still leans heavily toward per-subsystem implementation packets. There should probably be more explicit integration packet groups for:

orchestrator ↔ validator runner

orchestrator ↔ runtime manager

tool broker ↔ policy engine

agent runner ↔ tool broker

validator runner ↔ evidence pipeline

orchestrator ↔ approval service

control plane ↔ evidence pipeline

GitHub integration ↔ merge-back coordinator

Those are not just “wiring.” They are real risk surfaces.

5. Parallelization is good, but frontend may be starting slightly too early

The doc says frontend can start once API stubs exist, which is fair. But the three-pane UI is unusually coupled to live runtime semantics, evidence structure, and task graph state. So yes, the shell and some static views can start early, but execution graph and inspector work probably need stronger read-model stability first. I would not fully change the plan, just be more explicit that UI parallelism should begin with shell/layout/navigation first, not all panes equally.

6. Phase 5 open questions are good, but one is missing

You have self-hosting timing, human review load, interface evolution, benchmarks, prompt iteration, cost, rollback, external contributors. Good. The missing one is:

What is the failure-handling policy when packet assumptions are wrong?
Not runtime failure — planning failure.
Example: a packet turns out not to be independently verifiable, or two packets have hidden coupling. You need a graph-repair mechanism for Phase 5:

split packet

reclassify packet

insert interface packet

insert integration packet

invalidate speculative downstream packets

That will matter immediately once real execution starts.

7. One conceptual issue: “50–300 LOC” is useful but should be demoted

This is a decent heuristic, but it should not look like the primary sizing rule. The true sizing rule is:

one subsystem concern

one validator story

one evidence story

one clear completion contract

LOC can be a secondary heuristic, but if the doc overweights it, people will optimize for line count instead of dependency shape.


# RESPONSE:
Good feedback. These are all structural tightening corrections. Let me produce a focused amendment.Seven corrections, all structural:

**Amendment 1 — Timeline realism.** 8-10 weeks is optimistic best case. Realistic target is 12-14 weeks, accounting for 1-2 interface revision cycles and rework on architecture-bearing packets (state machine, policy engine, tool broker framework). Critical-path packets are not equal-friction work — they are the exact places where rework concentrates.

**Amendment 2 — Foundation split (M0a/M0b).** M0a is core contracts: domain interfaces, cross-subsystem contracts, event taxonomy, action classes, evidence schema. These require elevated review before any M1 packet starts. M0b is scaffolding: repo skeleton, Prisma schema, Docker image, infrastructure connections. M0b can start in parallel, but Prisma schema waits for M0a types to be stable. This makes the review bottleneck explicit instead of hidden.

**Amendment 3 — Agent Runner packets.** Seven packets filling the WS-6 gap: context pack composer, prompt assembly with trust labeling, model invocation abstraction, tool call mediation, structured output parsing, budget enforcement, run record persistence. Each has defined prerequisites and key outputs. WS-6 sits in M2, starting after tool broker core is operational.

**Amendment 4 — Explicit integration packets.** Eight integration packets at subsystem boundaries: orchestrator ↔ runtime manager, tool broker ↔ policy engine, agent runner ↔ tool broker, orchestrator ↔ validator runner, validator ↔ evidence pipeline, orchestrator ↔ approval service, GitHub ↔ merge-back coordinator, control plane ↔ evidence pipeline. Each has a specific integration test. Total packets: ~103-118.

**Amendment 5 — Frontend tier sequencing.** Tier 1 (shell, file tree, planner workspace) starts in parallel with M1. Tier 2 (execution DAG, evidence inspector, real-time updates, approval UI) waits for M2 read models to stabilize. Prevents building the most coupled UI panes against speculative API shapes.

**Amendment 6 — Graph repair mechanism.** Phase 5 must define five repair actions for when the packet graph is structurally wrong mid-execution: insert interface packet, insert integration packet, reclassify/resize, invalidate speculative downstream, schema migration packet. This will happen in the first weeks — the mechanism must be ready.

**Amendment 7 — Sizing rules reordered.** Four structural rules are primary: one subsystem concern, one validator story, one evidence story, one completion contract. LOC (≤ 500) and file count (≤ 10) are secondary heuristics — useful as warning thresholds, not optimization targets.

Phase 4 is locked. Your complete design stack:

- **Phase 1:** v1.0 → v1.1 → v1.2 → v1.3 → v1.3.1 (product, trust, alpha scope, security, formalizations)
- **Phase 2:** Validation harness + amendment (what "correct" means)
- **Phase 3:** Implementation architecture + amendment (subsystems, interfaces, runtime)
- **Phase 4:** Task graph + amendment (packets, milestones, dependencies, sequencing)
- **Phase 5 (next):** Operationalization

# OUTPUT: Forge-phase4-amendment.md

--------------------------------------------------------------------------------

# PHASE 5

# PROMPT:
IMPORTANT: Stay entirely in design mode.

This response must remain at the level of execution planning, operator workflow design, coding-agent operating procedures, rollout strategy, packet activation rules, review management, fallback logic, and human/agent coordination.

Do not write implementation code.
Do not write framework boilerplate.
Do not write prompt templates as final production prompts.
Do not write frontend components.
Do not write backend handlers.
Do not write engineering tickets.
Do not turn this into sprint planning.
Do not skip ahead into coding.

Use only conceptual workflows, operating procedures, packet-execution policies, and packet-class guidance where necessary to clarify the design.

You are continuing from approved Forge design artifacts.

Forge is now defined as an **Alpha-grade repo-native autonomous coding platform** with:
- deterministic DAG orchestration
- bounded parallel execution
- per-task worktree isolation inside phase containers
- validator-heavy execution
- evidence bundles
- agent-to-agent review
- policy engine
- typed / curated tool broker
- repo-native source of truth
- control-plane UI over GitHub-native artifacts
- artifact-first memory hierarchy
- selective human review only at strategic checkpoints
- an approved validation/eval harness
- an approved implementation architecture
- an approved task graph / coding packet decomposition

You should assume the following are already decided and are not to be redesigned in this phase:
- product shape
- control-plane UX shape
- DAG/worktree architecture
- validator-heavy trust model
- policy engine + typed tool broker
- memory tiers and source-of-truth hierarchy
- security scope for alpha
- validation/eval harness philosophy
- implementation architecture / subsystem breakdown
- orchestrator/runtime model
- storage/event model
- milestone hierarchy
- packet schema
- packet dependency graph
- packet risk taxonomy
- validator assignment model

## Phase objective

Your job is to design **Phase 5: how Forge actually begins operating against its approved task graph**.

This phase should answer:

- How are approved packets turned into live coding-agent work?
- What is the operator workflow for starting, supervising, pausing, reviewing, and repairing execution?
- What is the safe rollout strategy for the first real packet executions?
- How are packet classes mapped to coding-agent behavior?
- How are prompts/context packs assembled by packet class at an operational level?
- How is review load managed during the first Alpha rollout?
- How do fallback, pause, rollback, and graph-repair work in practice?
- What should the very first execution wave look like?
- What sequencing minimizes risk while still making real progress?
- What operational policies must exist before agents are allowed to execute the graph?

This phase is not about architecture anymore.
It is about **operationalizing the approved architecture and packet graph**.

---

# Required sections

## 1. Phase 5 objective
Explain exactly what this phase is for and why it follows the task graph decomposition.

Clarify the difference between:
- task graph design
- coding-agent execution planning
- operator workflow
- packet rollout strategy
- actual coding execution

Explain why Forge needs an explicit execution plan before agents are allowed to touch the graph.

## 2. Execution philosophy
Define Forge’s execution philosophy for Alpha.

Address:
- why the first rollout should be staged
- why not all approved packets should be activated at once
- how validator-heavy execution changes operator behavior
- how humans supervise without becoming the bottleneck
- how coding agents should behave differently from planning agents
- why rollout safety matters even when the architecture is already approved

## 3. Packet activation model
Design the packet activation model.

Explain:
- what it means for a packet to be “eligible for activation”
- what preconditions must be true before activation
- what makes a packet ineligible even if it exists in the graph
- how dependency satisfaction is checked
- how validator readiness is checked
- how evidence requirements are checked up front
- how packet risk class affects activation
- how strategic human checkpoints affect activation

Distinguish between:
- auto-activatable packets
- operator-launched packets
- escalated / gated packets

## 4. Initial rollout strategy
Design the first Alpha rollout strategy.

Define:
- what the first wave of packets should be
- which packet classes should be excluded initially
- how many concurrent packets should run in Wave 1
- how confidence in the system should be built over successive waves
- when to expand from safe local packets to interface packets
- when to expand into integration packets
- when to allow high-risk packets
- when to allow repair loops to run more autonomously

Provide a phased rollout model such as:
- Wave 0: dry-run / simulation / harness smoke checks
- Wave 1: low-risk foundation packets
- Wave 2: local implementation packets
- Wave 3: selected interface/integration packets
- Wave 4: broader DAG execution
- Wave 5: alpha hardening / throughput tuning

## 5. Operator workflow
Design the operator workflow for live packet execution.

Explain what the operator does:
- before execution
- during execution
- on validation failure
- on graph repair
- on escalation
- on review overload
- on successful completion
- on merge candidate promotion

Design the core operator loop.

Include:
- queue review
- launch decisions
- packet inspection
- issue triage
- escalation handling
- pause/resume behavior
- graph repair decisions
- approval actions
- post-run analysis

## 6. Coding-agent operating model by packet class
Design how coding agents should operate differently across packet classes.

At minimum cover:
- foundation packets
- interface packets
- implementation packets
- validation packets
- integration packets
- documentation packets
- policy-sensitive packets
- security-sensitive packets
- graph-repair packets

For each class, explain:
- expected behavior
- allowed scope
- context depth
- likely failure modes
- validator emphasis
- whether human launch/review is required
- when a packet should be split further

## 7. Context-pack assembly strategy
Design the operational context-pack strategy for packet execution.

For each packet class, explain what context should be included from:
- packet spec
- milestone/plan context
- subsystem architecture docs
- policy docs
- validation docs
- relevant files/modules
- prior evidence
- prior failed attempts
- decision traces
- benchmark expectations
- trust labels

Also explain:
- how context should be minimized
- how trusted vs untrusted context is separated
- how packet-specific context differs from global repo context
- how context packs evolve after retries or graph repair

## 8. Prompt/input strategy at the packet level
Do not write final prompts, but design the packet-level instruction strategy.

Explain how packet execution inputs should be composed from:
- role instructions
- packet contract
- subsystem constraints
- validator expectations
- evidence requirements
- policy boundaries
- output formatting requirements
- retry/repair history

Distinguish between:
- initial packet execution inputs
- repair execution inputs
- reviewer execution inputs
- graph-repair execution inputs

## 9. Review load management
Design how Forge should manage review load during Alpha.

Address:
- how many packets can be realistically supervised at once
- when human review becomes a bottleneck
- which packets must always receive human attention in Alpha
- which packets can rely on validator + agent review only
- how review queues should be prioritized
- how to avoid reviewer starvation
- how to prevent review overload from blocking the whole graph

Explain how review policy should evolve across rollout waves.

## 10. Fallback, pause, and rollback procedures
Design the operational handling for:
- packet failure
- validator disagreement
- repeated repair failure
- packet spec quality failure
- graph decomposition failure
- runtime instability
- evidence incompleteness
- policy engine instability
- unsafe action attempts
- widespread benchmark regressions

Define:
- when a packet is paused
- when a packet is canceled
- when a workstream is paused
- when the entire rollout is paused
- when a rollback/revert is required
- what the operator must inspect before resuming

## 11. Graph repair workflow
Design how graph repair actually works in operations.

Cover:
- who/what detects graph defects
- what evidence triggers graph repair
- how repair proposals are generated
- when humans must approve graph repair
- how packet splitting / insertion / reclassification works
- what happens to downstream speculative packets
- how repaired graphs are versioned
- how the control plane should visualize graph repair

Be concrete about the operational flow.

## 12. Human checkpoints during execution
Restate and operationalize the human-governed checkpoints during Phase 5.

Include:
- packet launch approvals if any
- interface packet approvals
- policy-sensitive packet approvals
- high-risk packet approvals
- graph repair approvals
- merge candidate approvals
- harness mutation approvals
- dependency approval handling

Explain how these checkpoints should appear in the operator workflow.

## 13. Evidence review workflow
Design how operators and reviewers consume evidence during Alpha execution.

Explain:
- what evidence is reviewed first
- what evidence is mandatory before approving packet promotion
- how evidence is summarized
- when full traces must be opened
- how failed packets should be investigated
- how evidence supports graph repair decisions
- how evidence should flow into post-run learnings

## 14. First executable packet set
Design the first concrete executable subset of the graph.

This should identify:
- the first packets to run
- why they are first
- what they unlock
- what should explicitly wait
- what validators they require
- what success on this first subset should demonstrate

This section should be practical and opinionated.

## 15. Alpha throughput strategy
Design how throughput should increase over time.

Explain:
- initial concurrency limits
- conditions for increasing concurrency
- conditions for restricting concurrency
- how packet risk affects concurrency
- how graph maturity affects concurrency
- how benchmark results affect concurrency
- how operator trust affects concurrency
- how repair/oscillation rates affect concurrency

This should define a real progression model.

## 16. Operational metrics for execution rollout
Define the key metrics that should be watched during the first live execution waves.

Include:
- packet success rate
- first-pass success rate
- repair-loop rate
- oscillation rate
- graph-repair rate
- review queue depth
- approval latency
- time to trustworthy completion
- benchmark pass rate
- security alert rate
- evidence completeness
- unsafe action attempts
- packet cancellation rate
- workstream stall rate
- operator intervention burden

Explain what metrics should gate expansion of rollout scope.

## 17. Packet-class execution policies
Define explicit execution policies by packet class.

For each major class, specify:
- launch mode
- default reviewer mode
- validator strictness
- retry budget
- repair policy
- human checkpoint requirements
- benchmark expectations if any
- whether speculative execution is allowed

## 18. Control-plane operational requirements
Define what the control plane must support before live execution begins.

Examples:
- packet launch controls
- queue visibility
- packet risk labeling
- validator status visibility
- evidence inspection
- escalation inbox
- graph repair actions
- pause/resume controls
- packet history
- rollout wave visibility
- benchmark health view
- operator handoff notes

Do not redesign the UI; specify operational capabilities.

## 19. Repo artifacts to produce from this phase
Define what artifacts Phase 5 should produce inside the repo.

Examples:
- `ops/rollout-strategy.md`
- `ops/operator-workflow.md`
- `ops/packet-activation-rules.md`
- `ops/review-load-policy.md`
- `ops/graph-repair-workflow.md`
- `ops/fallback-and-rollback.md`
- `ops/first-execution-wave.md`
- `ops/execution-metrics.md`

Do not write them in full.
Just define what should exist and what each should contain.

## 20. Open questions for Phase 6
Identify what the next phase — coding-agent task generation / packet instantiation / runbook creation — must resolve based on this execution planning phase.

These should be operationalization questions, not architecture restatements.

## 21. Final Phase 5 decision summary
End with:

### Phase 5 Decision Summary

It must include:
- recommended Alpha rollout strategy
- recommended operator workflow
- recommended packet activation model
- recommended first executable packet set
- recommended review-load policy
- recommended graph-repair policy
- recommended throughput progression model
- top questions for Phase 6

---

## Additional instructions

- Stay at the design layer.
- Do not write code.
- Do not generate final prompts.
- Do not write actual task tickets yet.
- Be concrete and operations-oriented.
- Prefer safe rollout mechanics over vague “agents will handle it” language.
- Distinguish clearly between:
  - packet design
  - packet activation
  - packet execution
  - packet review
  - graph repair
  - rollback/fallback
  - operator supervision

Assume this output will become the basis for generating the first real coding-agent task packets and operational runbooks.

# RESPONSE:
This is the operationalization phase — turning the approved design into a live execution plan. Let me produce it.Phase 5 is done — 5,400 words covering execution planning and operationalization. Here's what it defines:

**Six rollout waves** with concrete gates between them:
- **Wave 0:** Dry run — synthetic packet through the full pipeline. Proves the pipeline works, not the agents.
- **Wave 1:** M0a contracts — 5 foundation packets, serial, all human-reviewed. Proves contracts are stable.
- **Wave 2:** M0b scaffolding + first M1 locals — concurrency 2-3. Proves infrastructure works.
- **Wave 3:** Critical-path runtime (policy engine, tool broker, orchestrator core) — concurrency 3-4. Proves the hard center exists.
- **Wave 4:** Tool fan-out + agent/validator build — concurrency 5-7. First real end-to-end agent-driven packet.
- **Wave 5:** Control plane + hardening — concurrency 6-8. Benchmarks pass.

**Three-class packet activation model:** auto-activatable (low-risk, approved waves), operator-launched (interface, integration, first-of-workstream), gated (security, schema, graph-repair). Default in early waves is operator-launched; progressive auto-activation as confidence builds.

**Concrete operator workflow:** Morning triage → active launches/approvals → metric review → end-of-day queue setup. Operator reviews escalations, graph repairs, merge candidates, and security-sensitive outputs. Does not review every packet after Wave 2. Review load modeled against one operator at 2-3 hours/day — decreasing from 100% human review (Wave 1) to ~5% (Wave 5).

**Graph repair workflow:** Five repair actions (revise interface, insert integration packet, split packet, insert dependency, schema migration). All require operator approval. Graph is versioned. Downstream speculative packets are invalidated and requeued on contract changes.

**Fallback/pause/rollback procedures:** Single packet failure → repair loop. Workstream >30% fail rate → workstream pause. Pipeline instability → full pause. Unsafe action → immediate cancellation + workstream pause. Rollback is git-revert on the phase branch, packet requeued with failure context.

**Throughput progression gated on metrics:** 16 operational metrics with targets per wave. Expansion requires all gating metrics to meet their target. Concurrency decreases if repair-loop rate >40%, graph-repair rate >1/day, oscillation detected, or review queue depth >10.

Your complete design stack:
- **Phase 1:** Product design + revisions (v1.0–v1.3.1)
- **Phase 2:** Validation harness + amendment
- **Phase 3:** Implementation architecture + amendment
- **Phase 4:** Task graph + amendment
- **Phase 5:** Operationalization (this document)
- **Phase 6 (next):** Prompt templates, packet instantiation, harness templates, benchmark repos, policy rules — the artifacts that must exist before Wave 1 begins

# OUTPUT: Forge-phase5-operationalization.md


--------------------------------------------------------------------------------

# PHASE 5.1

# PROMPT:
What still needs tightening:
1. “Prerequisite packets are MERGED” is too strict for all activation
This is the biggest issue.
Right now, the activation model says a packet becomes eligible only when all prerequisites are MERGED, not merely succeeded. That is probably correct for some packet classes, especially interface-critical or cross-task-sensitive ones, but it is too restrictive as the universal rule because it can unnecessarily collapse DAG parallelism into serialized merge cadence.
I would revise this to something like:
* Local implementation packets may activate when prerequisites are validated and accepted into the phase branch state
* Interface/integration/policy-sensitive packets may require prerequisite merged-state stability
* The exact gating should depend on dependency class, not one universal merge rule
Otherwise you will artificially slow the graph.
2. Wave durations are still optimistic
The structure is good, but the durations still read like “happy-path startup schedule” more than “operationally conservative alpha plan.”
That is not fatal, but I would mark them as:
* optimistic design estimates
* not rollout commitments
Especially Wave 3 and Wave 4 are likely to absorb more iteration than the doc currently implies.
3. Wave 2 auto-activation for M0b scaffolding may be slightly too aggressive
For some scaffolding packets, yes. For anything that influences durable schemas, runtime assumptions, or shared infrastructure, I would still start with operator-launched until the first one or two examples succeed.
So the rule probably wants to be:
* low-risk scaffolding auto-activatable
* schema/infrastructure-defining scaffolding operator-launched at first
4. Review queue depth thresholds need one more dimension
Review queue depth alone is not enough. A queue of 8 routine docs packets is not the same as a queue of 8 interface/security/integration escalations.
I would eventually weight review load by:
* packet risk
* escalation severity
* blocking impact on critical path
Not required for another revision, but it is an important future refinement.
5. The control-plane requirements are good, but the “minimum surface before live execution” probably needs explicit CLI fallback
You raise this in open questions, which is correct. I would just be slightly more explicit that early waves may need a temporary operator surface if the control-plane frontend is not ready yet.
That is fine, and honestly likely necessary.
6. Cost baseline belongs in Phase 6, but token budget discipline might need one Alpha guardrail now
You correctly defer cost estimation to Phase 6. I agree. But I would still add one design-level operational rule now:
* any repeated packet repair loop that exceeds a fixed budget threshold triggers automatic pause/escalation
You already mention cost explosion under fallback/pause, which is good. I’d just make it a default operating rule, not only a troubleshooting scenario.

# RESPONSE:
Six corrections:

**Amendment 1 — Dependency-class-aware activation.** The universal MERGED rule is replaced with five dependency classes: type/interface deps require MERGED, schema deps require MERGED, sequential implementation deps allow speculative start on SUCCEEDED, loose ordering deps gate on SUCCEEDED only, validator deps require MERGED. Local implementation packets can now start speculatively when prerequisites are validated but not yet merged — recovering the parallelism the universal rule was suppressing. Speculative starts are frozen if the prerequisite's merge-back fails.

**Amendment 2 — Timeline labeling.** All wave durations are now explicitly marked as optimistic design estimates, not rollout commitments. Realistic total: 14-22 weeks. Waves 3-4 flagged as most likely to absorb iteration (policy engine and agent runner are architecture-bearing). The operator should plan around the realistic range.

**Amendment 3 — M0b activation split.** Repo skeleton, Docker image, and infra connections are auto-activatable (low risk). Prisma schema and BullMQ setup are operator-launched for first execution (schema defines durable data model, getting it wrong cascades). After first successful execution, the operator can reclassify future amendments as auto-activatable.

**Amendment 4 — Review queue weighting (design note).** Raw queue depth is sufficient for Alpha (one operator reviewing by inspection). Post-Alpha, queue depth should be replaced with weighted review load: `risk_weight × blocking_impact × severity_multiplier`. Formula recorded for future refinement, not implemented now.

**Amendment 5 — CLI fallback for early waves.** Promoted from open question to design decision: Waves 0-3 use a CLI-based operator surface (12 core commands), not the control-plane frontend. The CLI is a thin wrapper over the Control Plane API. The frontend ships in Wave 5. CLI persists as a fallback and power-user interface.

**Amendment 6 — Token budget guardrail.** Standing operating rule: every packet has a token budget = `base_budget × risk_multiplier × repair_multiplier`. Warning at 80%. Hard ceiling at 100% (agent terminated, packet BLOCKED). Repair loops get diminishing budgets (0.75× remaining per attempt). Phase-level warning at 150% of sum. This catches cost explosions before the semantic loop detector classifies the behavior.

Phase 5 is locked. Your complete design stack:

- **Phase 1:** v1.0 → v1.1 → v1.2 → v1.3 → v1.3.1
- **Phase 2:** Validation harness + amendment
- **Phase 3:** Implementation architecture + amendment
- **Phase 4:** Task graph + amendment
- **Phase 5:** Operationalization + amendment
- **Phase 6 (next):** Prompt templates, packet instantiation, harness templates, benchmark repos, policy rules — the artifacts that must exist before Wave 1 begins

# OUTPUT: Forge-phase5-amendment.md

--------------------------------------------------------------------------------

FROM HERE ON OUT, WE LOST THE RESPONSES FROM CLAUDE DUE TO IMPROPER CLAUDE CHAT UI DESIGN, THEREFORE EXPECT ONLY THE PROMPT AND THE OUTPUT AFTER

# PHASE 5.2

# PROMPT:
My only minor note: the speculative-start rule is good, but in practice you will eventually want to log a specific “started-on-unmerged-prereq” marker into packet evidence and metrics, so you can measure whether speculative execution is helping or causing too many freezes/requeues. That is not another revision request; it is just something to carry into Phase 6 metrics/runbook design.

# RESPONSE:
Noted. That's a good operational signal — if speculative starts are causing more freezes than they save in parallelism, the activation policy should tighten. I'll carry it as a Phase 6 requirement: add a speculative_start flag to packet evidence and track speculative-freeze rate as an operational metric alongside the existing expansion gates. Your design stack is complete through Phase 5. The full inventory: **Phase 1 — Product and Architecture Design** - v1.0: Full product design (foundations, UX, domain model, 10 appendices) - v1.1: Trust model, staged autonomy, blessed stack, approval matrix, evidence retention - v1.2: Alpha scope correction (DAG, worktrees, concurrency, agent review) - v1.3: Security hard center (policy engine, typed tools, least privilege, security validators, eval harness) - v1.3.1: Supply-chain scope, formalized role×permission matrix, tool action classes, memory artifact tiers **Phase 2 — Validation and Evaluation Harness** - Base: Seven validation levels, definition-of-done model, 17-category test taxonomy, false-success prevention, benchmark suite, 21 platform metrics, failure taxonomy - Amendment: Confidence constraints, cross-task validation scheduling, benchmark judgment decomposition, semantic loop detection, human governance invariant **Phase 3 — Implementation Architecture** - Base: 15 subsystems, task state machine, worktree/container model, storage/event architecture, failure domains, Alpha implementation cut - Amendment: Container isolation justification, action class granularity note, agentic vs deterministic validators, evidence Tier 0 correction, PostgreSQL failure semantics **Phase 4 — Task Graph Decomposition** - Base: 15 workstreams, 5 milestones, ~95-110 packets, critical path, parallelization strategy, packet schema, risk taxonomy - Amendment: Timeline realism (12-14 weeks), M0a/M0b foundation split, Agent Runner packets, 8 explicit integration packets, frontend tier sequencing, graph repair mechanism, structural sizing rules **Phase 5 — Operationalization** - Base: 6 rollout waves, 3-class activation model, operator workflow, graph repair workflow, fallback/rollback procedures, throughput progression, 16 operational metrics, packet-class execution policies - Amendment: Dependency-class-aware activation (speculative starts), timeline labeling (14-22 weeks realistic), M0b activation split, CLI fallback for early waves, token budget guardrail **Carry to Phase 6:** Speculative-start evidence marker + speculative-freeze rate metric. Ready for Phase 6 whenever you are.


Noted. That's a good operational signal — if speculative starts are causing more freezes than they save in parallelism, the activation policy should tighten. I'll carry it as a Phase 6 requirement: add a speculative_start flag to packet evidence and track speculative-freeze rate as an operational metric alongside the existing expansion gates. Your design stack is complete through Phase 5. The full inventory: **Phase 1 — Product and Architecture Design** - v1.0: Full product design (foundations, UX, domain model, 10 appendices) - v1.1: Trust model, staged autonomy, blessed stack, approval matrix, evidence retention - v1.2: Alpha scope correction (DAG, worktrees, concurrency, agent review) - v1.3: Security hard center (policy engine, typed tools, least privilege, security validators, eval harness) - v1.3.1: Supply-chain scope, formalized role×permission matrix, tool action classes, memory artifact tiers **Phase 2 — Validation and Evaluation Harness** - Base: Seven validation levels, definition-of-done model, 17-category test taxonomy, false-success prevention, benchmark suite, 21 platform metrics, failure taxonomy - Amendment: Confidence constraints, cross-task validation scheduling, benchmark judgment decomposition, semantic loop detection, human governance invariant **Phase 3 — Implementation Architecture** - Base: 15 subsystems, task state machine, worktree/container model, storage/event architecture, failure domains, Alpha implementation cut - Amendment: Container isolation justification, action class granularity note, agentic vs deterministic validators, evidence Tier 0 correction, PostgreSQL failure semantics **Phase 4 — Task Graph Decomposition** - Base: 15 workstreams, 5 milestones, ~95-110 packets, critical path, parallelization strategy, packet schema, risk taxonomy - Amendment: Timeline realism (12-14 weeks), M0a/M0b foundation split, Agent Runner packets, 8 explicit integration packets, frontend tier sequencing, graph repair mechanism, structural sizing rules **Phase 5 — Operationalization** - Base: 6 rollout waves, 3-class activation model, operator workflow, graph repair workflow, fallback/rollback procedures, throughput progression, 16 operational metrics, packet-class execution policies - Amendment: Dependency-class-aware activation (speculative starts), timeline labeling (14-22 weeks realistic), M0b activation split, CLI fallback for early waves, token budget guardrail **Carry to Phase 6:** Speculative-start evidence marker + speculative-freeze rate metric. Ready for Phase 6 whenever you are.


--------------------------------------------------------------------------------

# PHASE 5.3

# PROMPT:
My only small note:

The line in Phase 4 saying “~95–110 packets” and “12–14 weeks” should be treated as planning ranges, not commitments. Same for the 14–22 weeks realistic line in Phase 5. I would keep those as internal design estimates only, not user-facing promises. That is not a flaw in the summary, just something to remember operationally.

# RESPONSE:
Agreed. Those are internal calibration ranges for planning, not commitments. The actual timeline is determined by what the metrics show during execution — if Wave 3 absorbs two interface revision cycles, the schedule extends; if first-pass success rates are higher than expected, it compresses. The numbers exist so the operator has a mental model for capacity planning, not so they become deadlines. Carrying that framing into Phase 6: any runbook or operational document that references these ranges should label them as "design estimates for capacity planning" and point to the wave expansion gates as the real progression mechanism. The system advances when the metrics say it's safe, not when the calendar says it's time.

--------------------------------------------------------------------------------

# PHASE 6

THE RESPONSE FROM CLAUDE WAS LOST DUE TO IMPROPER DESIGN OF THE CLAUDE CHAT UI. WE ONLY HAVE THE PROMPT AND THE OUTPUT

# PROMPT:
IMPORTANT: Stay entirely in design mode.

This response must remain at the level of packet instantiation design, prompt/input template design, validator manifest design, operator runbook design, first-wave preparation, and operational artifact generation.

Do not write implementation code.
Do not write framework boilerplate.
Do not write frontend components.
Do not write backend handlers.
Do not write real production prompts in final wording.
Do not write engineering tickets.
Do not skip ahead into live execution logs.
Do not collapse this into implementation details.

Use only conceptual schemas, artifact formats, template structures, manifests, and runbook definitions where necessary to clarify the design.

You are continuing from approved Forge design artifacts.

Forge is now defined as an **Alpha-grade repo-native autonomous coding platform** with:
- deterministic DAG orchestration
- bounded parallel execution
- per-task worktree isolation inside phase containers
- validator-heavy execution
- evidence bundles
- agent-to-agent review
- policy engine
- typed / curated tool broker
- repo-native source of truth
- control-plane UI over GitHub-native artifacts
- artifact-first memory hierarchy
- selective human review only at strategic checkpoints
- an approved validation/eval harness
- an approved implementation architecture
- an approved task graph / coding packet decomposition
- an approved operational rollout / activation / graph-repair model

You should assume the following are already decided and are not to be redesigned in this phase:
- product shape
- control-plane UX shape
- DAG/worktree architecture
- validator-heavy trust model
- policy engine + typed tool broker
- memory tiers and source-of-truth hierarchy
- security scope for alpha
- validation/eval harness philosophy
- implementation architecture / subsystem breakdown
- orchestrator/runtime model
- storage/event model
- milestone hierarchy
- packet schema
- packet dependency graph
- packet risk taxonomy
- validator assignment model
- rollout wave model
- activation classes
- operator workflow
- graph repair logic
- dependency-class-aware activation
- token budget guardrails

## Phase objective

Your job is to design **Phase 6: the artifacts and operating templates required to instantiate the first real packets and prepare the first live execution wave**.

This phase should answer:

- What concrete packet files/objects should exist?
- What should the canonical packet manifest look like?
- What prompt/input template structures should exist by role and packet class?
- What validator manifests should be created?
- What runbooks should operators follow?
- What first-wave packet set should actually be instantiated first?
- What benchmark fixtures and evaluation hooks must be ready before execution?
- What evidence manifests and review manifests must exist?
- What operational documents should be generated in the repo before the first live run?
- What exactly must be present before Wave 0 and Wave 1 can start?

This phase is not about writing code or generating live tasks yet.
It is about defining the **instantiation layer** that turns the approved design stack into operational artifacts.

---

# Required sections

## 1. Phase 6 objective
Explain exactly what this phase is for and why it follows Phase 5.

Clarify the difference between:
- task graph design
- execution planning
- packet instantiation
- prompt/input template design
- runbook design
- actual packet execution

Explain why Forge needs explicit operational artifacts before the first live packet is launched.

## 2. Instantiation philosophy
Define the philosophy for Phase 6.

Address:
- why packets must become concrete artifacts
- why packet manifests should be machine-readable and human-readable
- why prompt/input templates should be standardized but not rigidly overfitted
- why validator manifests should be separate from prompts
- why runbooks should exist even in an agent-heavy system
- why Wave 0/Wave 1 should run only after artifact readiness, not just architecture approval

## 3. Canonical packet manifest design
Define the canonical manifest format for an instantiated packet.

At minimum include fields such as:
- packet_id
- title
- milestone
- workstream
- packet_class
- risk_class
- activation_class
- dependency_class profile
- prerequisite_packets
- prerequisite_artifacts
- scope
- out_of_scope
- protected_paths
- target_paths
- required_inputs
- expected_outputs
- required_docs
- validator_manifest_ref
- evidence_manifest_ref
- review_manifest_ref
- prompt_template_ref
- context_pack_profile
- benchmark_tags
- policy_sensitivities
- escalation_conditions
- completion_contract
- graph_repair_hooks
- speculative_start_allowed
- operator_notes

Explain:
- why each category exists
- what should be authored manually vs generated
- what should be immutable during a run vs mutable through graph repair

## 4. Packet artifact layout in the repo
Define where instantiated packet artifacts should live in the repo.

For example, design a structure such as:
- `packets/`
- `packets/manifests/`
- `packets/validator-manifests/`
- `packets/evidence-manifests/`
- `packets/review-manifests/`
- `packets/context-profiles/`
- `packets/waves/`
- `ops/runbooks/`
- `benchmarks/fixtures/`
- `benchmarks/manifests/`

Do not assume these exact names; propose the best structure.

Explain:
- what belongs where
- what is durable
- what is generated
- what is manually maintained
- what should be derived from approved architecture docs

## 5. Packet-class manifest variants
Design how manifests differ by packet class.

At minimum distinguish:
- foundation packets
- interface packets
- implementation packets
- integration packets
- validation packets
- documentation packets
- policy-sensitive packets
- security-sensitive packets
- graph-repair packets

For each, explain:
- what extra fields they need
- what validators they require by default
- what evidence is mandatory
- what review mode they default to
- whether speculative start is allowed
- whether human launch is required

## 6. Prompt/input template architecture
Design the template system for packet execution inputs.

Do not write final prompts.
Instead define the structure of the templates.

Cover:
- role instruction layer
- packet contract layer
- subsystem constraint layer
- policy boundary layer
- validator expectation layer
- evidence requirement layer
- output structure layer
- retry/repair history layer
- trust-labeling layer
- benchmark/reliability context if relevant

Explain:
- which pieces are shared across roles
- which pieces vary by role
- which pieces vary by packet class
- which pieces vary by retry vs first attempt

## 7. Role template families
Define the template families Forge should have for its major roles.

At minimum include:
- implementer
- debugger
- reviewer
- validator-agent if any
- doc updater
- graph-repair proposer
- benchmark runner / eval orchestrator support role if applicable

For each role, explain:
- what the template must emphasize
- what it must prohibit
- how it should reference manifests
- how it should consume context packs
- how it should produce structured outputs

## 8. Context-pack profiles
Define the standard context-pack profiles that should exist for instantiated packets.

Examples:
- minimal local implementation
- interface-sensitive implementation
- integration packet
- validator packet
- doc packet
- graph-repair packet
- security-sensitive packet

For each profile, specify:
- included artifact classes
- excluded artifact classes
- trust-label handling
- context size constraints
- benchmark/eval expectations
- retry-time additions
- when the profile must escalate to a richer context

## 9. Validator manifest design
Define the canonical validator manifest.

At minimum include:
- validator set
- validator ordering
- blocking vs advisory validators
- deterministic vs agentic validators
- baseline validators
- packet-class-specific validators
- risk-class-specific validators
- benchmark hooks
- security hooks
- evidence completeness checks
- reviewer requirements
- confidence meta-signal usage
- pass/fail/escalate semantics

Explain how validator manifests should be attached to packets and updated through graph repair.

## 10. Evidence manifest design
Define the canonical evidence manifest.

At minimum include:
- required evidence artifacts
- optional evidence artifacts
- alpha-required evidence
- packet-class-specific evidence
- validator outputs to retain
- trace requirements
- worktree identity requirements
- command log requirements
- diff/patch requirements
- policy decision requirements
- reviewer evidence requirements
- speculative_start marker requirement
- speculative_freeze outcome marker if applicable

Explain how evidence manifests drive packet promotion and operator review.

## 11. Review manifest design
Define the canonical review manifest.

Include:
- review mode
- reviewer type (human / agent / hybrid)
- review triggers
- mandatory review checkpoints
- packet-class-specific review rules
- escalation triggers
- evidence summary requirements
- required questions/checklist categories
- merge-candidate relevance
- graph-repair triggers

Explain how review manifests integrate with validator results and packet risk.

## 12. Runbook architecture
Design the runbook system Forge needs before live execution.

At minimum define runbooks for:
- Wave 0 smoke run
- Wave 1 launch
- packet activation
- validator failure handling
- graph repair handling
- speculative freeze handling
- policy escalation handling
- rollback/revert
- operator shift handoff
- benchmark failure triage
- evidence incompleteness
- review overload
- runtime instability
- CLI fallback operation

For each runbook, specify:
- purpose
- trigger
- operator steps
- required evidence
- escalation criteria
- outputs / logs produced

## 13. First-wave instantiation set
Define the first actual packet set that should be instantiated for live execution.

This should be concrete and opinionated.

At minimum specify:
- which exact packet groups from M0a / earliest workstreams should be instantiated first
- why these come first
- what must already exist before they are instantiated
- what they unlock
- what should remain uninstantiated until later waves

Be explicit about the first safe execution subset.

## 14. Wave manifest design
Define how rollout waves should themselves be represented as artifacts.

A wave artifact should conceptually include:
- wave id
- included packets
- excluded packets
- concurrency cap
- launch policy
- review policy
- benchmark gates
- expansion criteria
- freeze criteria
- rollback criteria
- success metrics
- operator notes

Explain why waves should be treated as first-class artifacts instead of only informal rollout decisions.

## 15. Benchmark fixture preparation
Define what benchmark/eval artifacts must be created before Wave 0 and Wave 1.

Cover:
- benchmark fixture manifests
- evaluation scenario definitions
- expected validator coverage
- required metrics
- packet-to-benchmark mapping
- safety scenarios
- speculative execution metrics
- review load metrics
- graph repair metrics

Explain the minimum eval harness artifact set needed for the first live wave.

## 16. Operator artifact set
Define exactly what documents and artifacts operators need before first launch.

Examples may include:
- launch checklist
- activation policy reference
- escalation matrix
- review load policy
- graph repair playbook
- rollback playbook
- packet priority list
- wave dashboard spec
- benchmark watchlist

Do not write them in full.
Just define what should exist and what each must contain.

## 17. Packet readiness checklist
Design the readiness checklist a packet must satisfy before it can move from “designed” to “instantiated.”

Include checks such as:
- manifest completeness
- dependency references valid
- validator manifest attached
- evidence manifest attached
- review manifest attached
- context-pack profile assigned
- protected paths declared
- risk and activation classes assigned
- benchmark tags assigned if needed
- policy sensitivities declared
- graph repair hooks defined
- operator notes present if needed

## 18. Control-plane operational artifacts
Define what must exist in the control plane before first live execution can begin.

Do not redesign the UI.
Specify the minimal operational artifact support needed, such as:
- packet manifest viewer
- launch controls
- validator status view
- evidence summary view
- escalation inbox
- wave manifest viewer
- graph repair controls
- packet history
- speculative-start markers
- operator handoff log support

## 19. Mutation and versioning rules
Define how instantiated operational artifacts should be versioned and changed.

Cover:
- packet manifest versioning
- validator manifest versioning
- evidence manifest versioning
- wave manifest versioning
- runbook versioning
- graph repair edits
- auditability of operational artifact changes
- what can change mid-wave vs what requires a new wave or approval

This is important.

## 20. Alpha minimum viable instantiation set
Define the minimum coherent set of instantiated artifacts required to start Forge Alpha.

Be strict and practical.

Specify:
- minimum packet manifests
- minimum validator manifests
- minimum evidence manifests
- minimum review manifests
- minimum runbooks
- minimum wave artifacts
- minimum benchmark fixtures
- minimum control-plane support
- what can still remain manual or lightly templated in Alpha

## 21. Repo artifacts to produce from this phase
Define what artifacts Phase 6 should produce inside the repo.

Examples:
- `packets/schema.md`
- `packets/examples/`
- `packets/waves/wave0.yaml`
- `packets/waves/wave1.yaml`
- `ops/runbooks/*.md`
- `ops/checklists/*.md`
- `ops/escalation-matrix.md`
- `ops/review-manifest-schema.md`
- `ops/evidence-manifest-schema.md`
- `benchmarks/fixtures/*.md`

Do not write them in full.
Just define what should exist and what each should contain.

## 22. Open questions for Phase 7
Identify what the next phase — first real packet generation / live dry-run preparation / operator rehearsal — must resolve based on Phase 6.

These should be execution-preparation questions, not architecture restatements.

## 23. Final Phase 6 decision summary
End with:

### Phase 6 Decision Summary

It must include:
- recommended packet instantiation model
- recommended template architecture
- recommended manifest set
- recommended runbook set
- recommended first instantiated wave
- recommended benchmark/eval preparation
- recommended operator artifact set
- top questions for Phase 7

---

## Additional instructions

- Stay at the design layer.
- Do not write code.
- Do not write final production prompts.
- Do not instantiate every packet yet; design the instantiation layer.
- Be concrete and operational.
- Prefer artifact schemas and runbook structure over vague process language.
- Distinguish clearly between:
  - packet design
  - packet instantiation
  - execution input templates
  - validator manifests
  - evidence manifests
  - review manifests
  - runbooks
  - wave artifacts

Assume this output will become the basis for creating the first real packet files and conducting the first dry-run wave.


# OUTPUT: forge-phase-6-instantiation.md

--------------------------------------------------------------------------------

# PHASE 6.1

# PROMPT:
What still needs tightening:

1. The packet manifest is strong, but target_paths may be too rigid for some classes

For foundation and interface packets, explicit target_paths is good. For integration or repair packets, though, exact path enumeration may become too brittle if the packet legitimately needs to touch a small unexpected area within allowed scope. I would keep target_paths, but clarify that it is:

exact for low-ambiguity packet classes

pattern/range-based for some integration/repair classes

always subordinate to declared scope

That is a minor refinement, not a redesign.

2. The role-template section is slightly incomplete

You fully describe implementer, debugger, reviewer, and doc updater, but the earlier architecture includes graph-repair proposer and validator-agent-like roles too. Since this phase is about instantiation artifacts, I would have liked one more explicit template family entry for:

graph-repair proposer

agentic validator / security reviewer if still part of the model

Not fatal, but a bit asymmetric.

3. The evidence manifest should probably classify one more thing: diff state before vs after merge

Right now diff is just a required artifact in Tier 1. That is okay, but you may later want to distinguish:

pre-merge packet diff

merge-back diff

post-merge resolved state

This matters because cross-task validation and speculative freeze behavior can make those diverge. Not necessary for another rewrite, but it will matter when implementation starts.

4. Wave 1 expansion criteria are reasonable, but all_packets_merged: true could again become slightly too merge-centric

This is much less of a problem here than it was in Phase 5 because Wave 1 is intentionally serial and human-reviewed. So it is acceptable for Wave 1. I would just be careful not to generalize that field structure too literally into later waves without dependency-class-aware logic.

5. The minimal viable instantiation set is good, but the CLI capability list should maybe include one graph-repair visibility command

You have launch, status, evidence, escalations, pause, and metrics. Since graph repair is one of the central operational concepts, I would eventually want:

inspect packet dependencies

show affected downstream packets

preview repair impact

This is not a blocker for Phase 6; it is just something to keep in mind for Phase 7 CLI/runbook prep.

6. Open questions are strong, but one more should be added

You already have environment choice, M0a authorship, prompt calibration, token budgets, manifest generation tooling, operator rehearsal, policy calibration, and speculative-start metrics. Good.

The one missing question is:

How are packet manifests validated before first use?
In other words, do you want:

a manifest linter/schema validator

dependency consistency checker

reference integrity checker

wave-manifest validator

This is implied by the design, but the question should be explicit because bad manifests are now an operational failure mode.

# RESPONSE:
Good notes. All six are carry items for Phase 7 rather than Phase 6 rewrites. Let me log them precisely so nothing gets lost: Carry 1: target_paths flexibility. Phase 7 should define target_paths as exact for foundation/interface packets and pattern/range-based (e.g., src/orchestrator/**) for integration/repair packets. Always subordinate to scope. The manifest schema doc should note this distinction. Carry 2: Missing template families. Phase 7 prompt calibration must produce template families for graph-repair proposer and agentic security reviewer, not just implementer/debugger/reviewer/doc-updater. These roles exist in the architecture and need instantiation-layer artifacts. Carry 3: Diff state classification. Phase 7 evidence wiring should distinguish pre-merge packet diff (Tier 1, always captured), merge-back diff (Tier 1, captured at merge time), and post-merge resolved state diff (Tier 1, captured after conflict resolution if applicable). This matters for cross-task validation and speculative-freeze forensics. Carry 4: Wave expansion criteria. all_packets_merged: true is correct for Wave 1 (serial, human-reviewed). Wave 3+ manifests should use dependency-class-aware expansion criteria rather than a universal merge gate. Phase 7 wave manifest authoring should reflect this. Carry 5: Graph-repair CLI commands. Phase 7 CLI prep should add: forge deps {packet_id} (inspect dependencies), forge downstream {packet_id} (show affected downstream), forge repair --preview {packet_id} --action split (preview repair impact before committing). These are essential for informed graph repair decisions. Carry 6: Manifest validation tooling. Add to Phase 7 open questions: "Before first use, packet manifests should be validated by a manifest linter that checks: schema completeness (no empty required fields), dependency reference integrity (all prerequisite packet IDs exist), validator/evidence/review manifest references are valid, wave membership consistency, and protected-path declarations are non-empty. Bad manifests are an operational failure mode — they should be caught before activation, not during execution." All six are logged. Phase 6 is locked as-is, with these six items carried forward into Phase 7 preparation. Your complete design stack: Phase 1: v1.0 → v1.1 → v1.2 → v1.3 → v1.3.1 Phase 2: Validation harness + amendment Phase 3: Implementation architecture + amendment Phase 4: Task graph + amendment Phase 5: Operationalization + amendment Phase 6: Packet instantiation + 6 carry items for Phase 7 Phase 7 (next): First real packet generation, prompt calibration, manifest validation tooling, operator rehearsal, Wave 0 execution

--------------------------------------------------------------------------------

# PHASE 6.2

# PROMPT:
My only refinement:

The last line for Phase 7 is almost right, but I would phrase it slightly more precisely as:

Phase 7: First real packet generation, manifest validation tooling, prompt calibration, operator rehearsal, and Wave 0 dry-run preparation

I would put manifest validation tooling before prompt calibration in the phrasing, because bad manifests are a harder blocker than imperfect prompt tuning.

Also, I would say Wave 0 dry-run preparation, not “Wave 0 execution,” unless you explicitly want Phase 7 to include the actual run. Up to now, your phases have stayed in design/operational-prep mode. So unless you are intentionally switching modes, “preparation” is the safer wording.

# RESPONSE:
Agreed on both counts. Manifest validation is a harder blocker — a bad manifest prevents activation entirely, while an imperfect prompt produces a fixable bad output. And you're right that the phases have consistently stayed in design/prep mode. Crossing into live execution is a mode change that should be deliberate, not accidental. Corrected Phase 7 scope: Phase 7: First real packet generation, manifest validation tooling, prompt calibration, operator rehearsal, and Wave 0 dry-run preparation. Wave 0 execution itself — the actual first live run — would be Phase 8 or simply "Wave 0 launch," and it's the point where the system transitions from design to operations. That transition deserves its own explicit go/no-go decision, not a quiet slide into execution at the tail of a design phase.

--------------------------------------------------------------------------------

# PHASE 7

# PROMPT:
IMPORTANT: Stay entirely in design/preparation mode.

This response must remain at the level of operational preparation, manifest validation design, packet instantiation strategy, prompt calibration strategy, operator rehearsal planning, dry-run readiness, and go/no-go preparation.

Do not write implementation code.
Do not write framework boilerplate.
Do not write frontend components.
Do not write backend handlers.
Do not write final production prompts.
Do not write engineering tickets.
Do not execute the system.
Do not treat this phase as live operations.
Do not collapse this into implementation details.

Use only conceptual schemas, validation rules, preparation procedures, rehearsal structures, and artifact definitions where necessary to clarify the design.

You are continuing from approved Forge design artifacts.

Forge is now defined as an Alpha-grade repo-native autonomous coding platform with:
- deterministic DAG orchestration
- bounded parallel execution
- per-task worktree isolation inside phase containers
- validator-heavy execution
- evidence bundles
- agent-to-agent review
- policy engine
- typed / curated tool broker
- repo-native source of truth
- control-plane UI over GitHub-native artifacts
- artifact-first memory hierarchy
- selective human review only at strategic checkpoints
- an approved validation/eval harness
- an approved implementation architecture
- an approved task graph / coding packet decomposition
- an approved operational rollout / activation / graph-repair model
- an approved packet instantiation / manifest / runbook design

You should assume the following are already decided and are not to be redesigned in this phase:
- product shape
- control-plane UX shape
- DAG/worktree architecture
- validator-heavy trust model
- policy engine + typed tool broker
- memory tiers and source-of-truth hierarchy
- security scope for alpha
- validation/eval harness philosophy
- implementation architecture / subsystem breakdown
- orchestrator/runtime model
- storage/event model
- milestone hierarchy
- packet schema
- packet dependency graph
- packet risk taxonomy
- validator assignment model
- rollout wave model
- activation classes
- operator workflow
- graph repair logic
- dependency-class-aware activation
- token budget guardrails
- packet/evidence/review/validator manifest architecture
- runbook architecture

## Phase objective

Your job is to design **Phase 7: the preparation layer immediately before first live execution**.

This phase should answer:

- How are the first real packet artifacts actually generated from the approved schemas?
- How are manifests validated before they are ever used?
- How should prompt/input templates be calibrated before Wave 0?
- How should operators rehearse the system before live launch?
- What exact artifacts must exist for the synthetic Wave 0 dry run?
- What should the first real packet set look like in instantiated form?
- What dry-run scenarios should be prepared?
- What conditions must be satisfied before a go/no-go decision for Phase 8 / Wave 0 launch is allowed?

This phase is still **not live execution**.
It is the final design/preparation phase before the first real run.

---

# Required sections

## 1. Phase 7 objective
Explain exactly what this phase is for and why it follows Phase 6.

Clarify the difference between:
- packet instantiation design
- first real packet generation
- manifest validation tooling design
- prompt calibration design
- operator rehearsal design
- Wave 0 dry-run preparation
- actual live Wave 0 launch

Explain why Wave 0 launch must remain outside this phase.

## 2. Phase 7 preparation philosophy
Define the philosophy of this phase.

Address:
- why operational artifacts must now become concrete
- why manifest correctness is a harder blocker than prompt polish
- why prompt calibration should happen before live launch
- why operator rehearsal is necessary even in an agent-heavy system
- why synthetic dry-run scenarios are useful
- why this phase should minimize surprises before the go/no-go decision

## 3. First real packet generation strategy
Design how Forge should generate the first real packet artifacts from the approved packet graph.

Explain:
- which packets should be instantiated first
- which packets should remain abstract for now
- how packet manifests should be generated from the approved task graph
- what should be authored manually vs generated mechanically
- how packet instantiation should preserve graph identity and versioning
- how packet manifests should inherit milestone, workstream, packet class, risk class, activation class, and dependency data

Be explicit about the first concrete packet set to generate in this phase.

## 4. Manifest validation tooling design
This is critical.

Design the manifest validation layer that must exist before any packet can be activated.

At minimum define validation for:
- schema completeness
- required field presence
- field-type correctness
- dependency reference integrity
- cycle prevention at the instantiated packet layer
- validator/evidence/review manifest reference integrity
- wave membership consistency
- context-pack profile validity
- benchmark tag validity
- protected path declarations
- target path validity
- scope / out-of-scope consistency
- graph repair hook validity
- speculative-start flag legality by packet class
- policy sensitivity consistency

For each check, explain:
- what it validates
- why it matters
- what happens on failure
- whether failure blocks packet readiness
- whether the check should run only at creation time or continuously

## 5. Manifest validation artifact set
Define the artifacts needed for manifest validation.

Examples:
- manifest schema spec
- manifest linter rules
- dependency integrity checker rules
- wave manifest checker rules
- packet/reference registry
- protected-path validator rules
- packet readiness checker

Do not write implementation code.
Define what each artifact should contain and how they interact.

## 6. Target path and scope rules
Operationalize the carry item around `target_paths`.

Define the rule system for:
- exact target paths
- pattern-based target paths
- range/scope-based targeting
- packet-class-specific path declaration rules

Explain:
- which packet classes require exact paths
- which packet classes may use patterns/ranges
- how scope remains authoritative over target_paths
- how protected paths and policy rules interact with these declarations
- how these rules should be validated before activation

## 7. Prompt calibration strategy
Design the prompt/input calibration strategy for Alpha preparation.

Do not write final prompts.
Design the process for calibrating them.

Cover:
- what “prompt calibration” means in Forge
- how prompts are derived from the approved template families
- what should be tested or adjusted during calibration
- what should remain invariant
- how calibration differs by role
- how calibration differs by packet class
- how calibration differs for first-run vs repair vs review
- what success looks like for a calibrated template
- what failure looks like
- how calibration should be documented and versioned

## 8. Template family completion
Operationalize the missing template-family carry items.

Define the required template families for:
- implementer
- debugger
- reviewer
- doc updater
- graph-repair proposer
- agentic security reviewer
- any other role you believe is required before Wave 0 preparation

For each family, explain:
- what its objective is
- what inputs it expects
- what outputs it must produce
- what it must never do
- what trust-labeling expectations apply
- what validator hooks should exist
- what packet classes it is eligible for

## 9. Context-pack calibration
Design how context-pack profiles should be tested and calibrated before live launch.

For each core profile, explain:
- how to verify it includes the right artifacts
- how to verify it excludes unsafe or irrelevant artifacts
- how to verify trusted vs untrusted context separation
- how to detect context bloat
- how to detect context omission
- how retry-time context differs from first-run context
- how graph-repair context differs from normal execution context

## 10. Evidence preparation for Wave 0
Design the evidence artifact set that must exist before the synthetic dry run.

Define:
- what the Wave 0 synthetic packet must produce
- what traces/logs/validator outputs must be expected
- what evidence summaries operators should inspect
- how speculative markers should appear
- how evidence completeness should be evaluated in rehearsal mode
- what evidence gaps should block readiness for live launch

## 11. Review preparation artifacts
Design the review artifacts that should exist before Wave 0.

Include:
- review manifests for early packets
- review checklist categories
- evidence summary format
- escalation note format
- graph-repair proposal format
- review handoff notes
- operator approval note format

Explain how these should be used during dry-run rehearsal.

## 12. Dry-run scenario design
Design the synthetic scenarios to prepare for Wave 0 dry-run rehearsal.

At minimum include scenarios such as:
- happy-path synthetic packet run
- validator failure
- evidence incompleteness
- policy escalation
- speculative freeze
- graph repair insertion
- manifest invalidation before launch
- CLI fallback usage
- operator handoff between shifts
- benchmark alert during run

For each scenario:
- what it is testing
- why it matters
- what artifacts must exist
- what the operator should do
- what “good” behavior looks like

## 13. Operator rehearsal design
Design the operator rehearsal process.

Cover:
- rehearsal participants
- rehearsal stages
- what gets practiced
- how runbooks are exercised
- how escalation paths are tested
- how review load is simulated
- how CLI fallback is rehearsed
- how graph repair is rehearsed
- how evidence inspection is rehearsed
- how readiness findings are recorded

Explain what must be true before rehearsal is considered successful.

## 14. Synthetic Wave 0 packet design
Define the synthetic packet that should be used for Wave 0 dry-run preparation.

Specify:
- packet class
- objective
- scope
- expected artifact interactions
- validator set
- evidence set
- review mode
- why this packet is a safe synthetic test
- what capabilities it exercises
- what capabilities it intentionally does not exercise

Be concrete and opinionated.

## 15. First real packet preparation set
Define the first real packet set that should be prepared in instantiated form after the synthetic packet.

This should likely include the early M0a packets and possibly the earliest low-risk scaffolding packets.

For each packet in this prepared set, specify:
- why it belongs in the first prepared set
- what makes it safe enough
- what it unlocks
- whether it is intended for Wave 1 or later
- what must be true before it can move from prepared to launchable

## 16. Wave manifest authoring rules
Design how Wave 0 and Wave 1 manifests should be authored in practice.

Cover:
- required fields
- expansion criteria
- freeze criteria
- rollback criteria
- concurrency caps
- launch mode
- review mode
- benchmark gates
- dependency-class-aware activation rules
- speculative-start policy
- notes for operator interpretation

Be explicit about what is unique to Wave 0 vs Wave 1.

## 17. Go / No-Go readiness model
Design the explicit readiness model for Phase 8 / Wave 0 launch.

Define the conditions that must be satisfied before the system may transition from preparation to live execution.

Include readiness across:
- packet manifests
- manifest validation tooling
- validator manifests
- evidence manifests
- review manifests
- wave manifests
- operator runbooks
- CLI fallback
- benchmark fixtures
- synthetic dry-run rehearsal results
- security controls
- policy engine behavior
- escalation coverage
- review coverage
- metrics visibility

Distinguish clearly between:
- blocking readiness criteria
- advisory readiness criteria

## 18. Phase 7 operational artifact set
Define the exact artifacts that should be generated in this phase.

Examples:
- first instantiated packet manifests
- validator/evidence/review manifests for Wave 0 and Wave 1
- manifest schema + linter spec
- dependency checker spec
- wave manifest drafts
- role template family definitions
- context-pack calibration notes
- Wave 0 synthetic scenario pack
- operator rehearsal plan
- go/no-go checklist

Do not write them in full.
Just define what should exist and what each should contain.

## 19. Repo artifact layout for Phase 7 outputs
Define where the new Phase 7 artifacts should live in the repo.

Explain:
- what goes under packets/
- what goes under ops/
- what goes under benchmarks/
- what goes under harness/
- what should be versioned per wave
- what should be versioned per packet
- what should be global

## 20. Mutation/versioning rules for prepared artifacts
Design the mutation policy for prepared-but-not-yet-launched artifacts.

Cover:
- when packet manifests may still change
- when validator/evidence/review manifests may still change
- when template families may still change
- when runbooks may still change
- how changes are audited
- what requires re-validation after change
- what requires rehearsal reset after change
- what invalidates go/no-go readiness

## 21. Minimal viable Phase 7 completion set
Define the minimum coherent set of completed artifacts and preparations required to say:

“Forge is ready for a deliberate go/no-go decision on Phase 8 / Wave 0 launch.”

Be strict and practical.

## 22. Open questions for Phase 8
Identify what the next phase — first live Wave 0 launch — must resolve based on this preparation phase.

These should be live-operations questions, not design restatements.

## 23. Final Phase 7 decision summary
End with:

### Phase 7 Decision Summary

It must include:
- recommended first packet generation set
- recommended manifest validation approach
- recommended prompt calibration approach
- recommended operator rehearsal model
- recommended Wave 0 synthetic packet
- recommended go/no-go readiness model
- required artifacts for transition to Phase 8
- top open questions for live launch

---

## Additional instructions

- Stay at the design/preparation layer.
- Do not write code.
- Do not write final prompts.
- Do not perform live execution.
- Do not treat Wave 0 as launched in this phase.
- Be concrete and operational.
- Prefer explicit readiness artifacts over vague process language.
- Distinguish clearly between:
  - manifest generation
  - manifest validation
  - prompt calibration
  - operator rehearsal
  - dry-run preparation
  - go/no-go readiness

Assume this output will become the direct basis for preparing the first live execution wave, but not launching it yet.

# OUTPUT: forge-phase-7-preparation.md

--------------------------------------------------------------------------------

# PHASE 7.1

# PROMPT:
1. Wave 0 is described as a dry run, but it also says the synthetic packet has already been executed successfully at least once

This is the only real boundary confusion.

Section 17 makes successful execution of the synthetic packet a blocking criterion for go/no-go readiness, while the phase itself is still supposed to remain pre-launch. That can be made consistent, but only if you define clearly that:

Phase 7 includes rehearsal execution in a dry-run/pre-launch environment

Phase 8 is the first live operational launch against the real execution mode

Right now the distinction is implied, but I would state it more explicitly so “executed successfully at least once” does not sound like you already crossed into live operations.

2. The manifest validation artifacts are good, but the packet registry wants one more rule

You define packet-registry.yaml as the master list of packet IDs and statuses. Good. I would add one more explicit rule:

registry is authoritative for instantiated packet identity

wave membership and dependency checkers must reconcile against it

duplicate packet IDs across versions are illegal unless version semantics are explicit

That is not a major gap, but it will matter once graph repair starts generating revised packet manifests.

3. The calibration priority is correct, but reviewer/security-reviewer should probably be more clearly marked as “not launch-blocking for Wave 0”

This is mostly already implied, but it would help to make it explicit in the Phase 7 summary:

implementer-foundation template calibration is blocking

debugger/reviewer/security-reviewer calibration is desirable, but not required for Wave 0 readiness
That would reduce ambiguity when Phase 8 decides what is truly blocking.

4. The synthetic packet intentionally does not exercise repair loops, but the scenarios section says validator failure should be rehearsed

That is fine, but I would make the mechanism explicit:

either use a second synthetic packet variant that is intentionally malformed

or mutate the same synthetic packet in a controlled failure mode
This is operationally obvious, but writing it down would make the rehearsal design cleaner.

5. “Thirty-one artifacts” is fine as a summary, but it should stay descriptive, not normative

Not an issue in the doc itself, just a caution: the exact count is less important than completeness of the readiness set. Do not let people optimize for artifact count.

# RESPONSE:
Good notes. All five are precision clarifications, not redesigns. Let me log them:

**Clarification 1: Rehearsal vs. live execution boundary.** Phase 7 includes rehearsal execution in a dry-run/staging environment — same pipeline code, but explicitly marked as pre-launch rehearsal, not operational. Phase 8 is the first live operational launch against the real execution environment with real state persistence. The synthetic packet "executed successfully at least once" means executed during rehearsal, not during live operations. If the rehearsal environment and production environment are the same infrastructure, the synthetic packet's output should be cleaned up (branch deleted, evidence marked as rehearsal) before the go/no-go decision. The boundary is: rehearsal produces readiness evidence; Phase 8 produces operational artifacts.

**Clarification 2: Packet registry identity rules.** Add to packet-registry.yaml spec: (a) the registry is authoritative for instantiated packet identity — if a packet ID is not in the registry, it does not exist to the orchestrator; (b) wave membership and dependency checkers must reconcile against the registry, not against filesystem scans of packets/manifests/; (c) duplicate packet IDs are illegal — graph repair produces a new version of the same packet ID (same ID, incremented version field), not a new ID. If a repair requires a structurally different packet (different scope, different dependencies), it gets a new ID.

**Clarification 3: Template calibration blocking status.** For the go/no-go checklist and Phase 7 summary: implementer-foundation template calibration is blocking for Wave 0 readiness. Debugger, reviewer, doc-updater, graph-repair proposer, and security reviewer templates should be drafted but their calibration is advisory, not blocking, for Wave 0. Rationale: Wave 0 is a single synthetic packet using the implementer role. Wave 1 uses human review, not agent review. Debugger and reviewer calibration becomes blocking for Wave 2.

**Clarification 4: Failure scenario rehearsal mechanism.** The validator failure dry-run scenario should use a controlled mutation of the synthetic packet — either a second manifest variant (WAVE0-SYNTHETIC-FAIL-LINT.yaml) that intentionally produces a lint failure by instructing the agent to create a file with a known lint violation, or a manual mutation of the worktree after the agent writes but before validation runs. The first approach (second manifest variant) is cleaner because it is reproducible and does not require manual intervention mid-pipeline. The rehearsal design should specify: create one happy-path synthetic manifest and one intentionally-failing synthetic manifest.

**Clarification 5: Artifact count is descriptive.** The "thirty-one artifacts" figure is a completeness summary, not a target. Readiness is determined by the go/no-go checklist criteria, not by counting files. If a future revision adds or removes an artifact, the number changes; the readiness criteria do not.

All five logged. Phase 7 is locked with these clarifications carried into Phase 8 preparation.

Your complete design stack:

- **Phase 1:** v1.0 → v1.1 → v1.2 → v1.3 → v1.3.1
- **Phase 2:** Validation harness + amendment
- **Phase 3:** Implementation architecture + amendment
- **Phase 4:** Task graph + amendment
- **Phase 5:** Operationalization + amendment
- **Phase 6:** Packet instantiation + carry items
- **Phase 7:** Wave 0 dry-run preparation + 5 clarifications
- **Phase 8 (next):** Go/no-go decision + first live Wave 0 launch

The design stack is complete through preparation. Phase 8 is where Forge transitions from design to operations — a deliberate mode change with an explicit go/no-go gate.