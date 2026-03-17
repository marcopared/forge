## 1. Phase 8 objective

Phase 8 is the transition from **readiness** to **operations**. Phase 7 produced the things needed to justify a launch decision: instantiated manifests, manifest-validation rules, prompt calibration, operator rehearsal, Wave 0 dry-run scenarios, and explicit go/no-go readiness criteria. Phase 8 uses that readiness evidence to make an actual launch decision, execute the first live wave, supervise it, and then decide whether Forge has earned progression beyond Wave 0.  

The distinction is strict:

* **Phase 7** proves that the launch package exists, is validated, and has been rehearsed.
* **Phase 8** proves that the live runtime behaves correctly under real operational control.

That means the boundary is not merely “dry run vs production.” It is four separate boundaries:

1. **Dry-run rehearsal vs live execution**
   Rehearsal tests procedures and pipeline behavior in pre-launch mode. Live execution creates authoritative operational evidence. 

2. **Readiness evidence vs operational evidence**
   Readiness evidence answers, “Can we launch safely?” Operational evidence answers, “Did the live system behave correctly?” Phase 7 explicitly says launching is a mode change and should remain outside the preparation phase. 

3. **Go/no-go decision vs artifact preparation**
   Preparing manifests and runbooks does not itself authorize launch. A named authority must review the readiness set and record a launch decision.

4. **Launch protocol vs rehearsal protocol**
   Rehearsal protocol exists to uncover gaps. Launch protocol exists to constrain real execution, contain blast radius, and preserve trust.

The live-state boundary should be stated explicitly:

> **Wave 0 produces live operational evidence, but not user-meaningful product state.**

Forge is operating against the real execution environment with real persistence of logs, audit records, evidence bundles, packet states, and launch records. But because Wave 0 is synthetic-only, it is **not** intended to produce meaningful project deliverables or durable product artifacts beyond the operational record of the run itself. That keeps “real state persistence” from being misread as “real feature delivery.”

---

## 2. Launch philosophy

Wave 0 should be narrow by design, not by accident. The system already has ambitious machinery: deterministic DAG orchestration, worktree isolation, policy-gated tool access, validator-heavy execution, and evidence-first completion. The first live wave should not try to prove the whole product. It should prove that the **operational spine** is trustworthy.  

That leads to five launch principles.

### 2.1 Wave 0 is a platform-trust exercise, not a product-capability exercise

Phase 7 defines the synthetic packet as a pipeline test, not a code-quality test. Its purpose is to exercise manifest loading, worktree provisioning, context assembly, tool routing, policy evaluation, validator execution, evidence assembly, audit completeness, and merge-back. The code itself is intentionally trivial. 

### 2.2 Rehearsal success does not justify aggressive live scope

Phase 7 deliberately separates preparation from launch because launching is a mode change. Rehearsal proves procedure. It does not prove that real live environment state, operational visibility, and escalation handling will behave exactly the same way under live control. 

### 2.3 Validator-heavy operation reduces trust in claims, not human governance

Phase 2 is explicit that the evaluation harness validates the platform but does not remove human governance checkpoints. Humans should not become diff reviewers for everything, but they remain the authority for launch, escalation, freeze, rollback, policy changes, dependency approval, and merge-to-main governance. 

### 2.4 Humans govern the system; they do not manually execute the system

The operator’s role is closer to deployment supervision than to pair-programming. Phase 5 frames the operator as watching escalations, graph health, metric trends, and merge candidates rather than reviewing every ordinary packet by hand. For Wave 0 that supervision narrows further: launch one packet, monitor it carefully, inspect evidence, and decide whether the live path is trustworthy. 

### 2.5 “Success” for Wave 0 is controlled correctness, not usefulness

Wave 0 succeeds only if the launch process, live packet execution, evidence assembly, policy enforcement, and operator supervision all behave exactly as designed. It is not enough that a trivial file was written. Success means the system earned the right to attempt Wave 1.

---

## 3. Final go / no-go decision model

### 3.1 Decision structure

The recommended Alpha model is:

* **Primary Launch Authority**: one named person accountable for the final GO/NO-GO call.
* **Acting Launch Authority**: a predefined fallback named in the launch record before execution begins.
* **Three required signoff lenses** under that authority:

  * runtime readiness
  * validation/evidence readiness
  * security/policy readiness

In Alpha, one person may hold all three lenses. That is acceptable. What is not acceptable is collapsing them into an implicit feeling of readiness. The decision record should force separate acknowledgments even if the same person signs all three. Phase 5 already assumes a small-operator model; Phase 7 already assumes handoff notes and CLI fallback. Phase 8 should therefore make authority substitution explicit rather than implicit.  

### 3.2 Authority substitution rule

If the Primary Launch Authority becomes unavailable mid-run:

1. active execution is **paused or frozen** unless the packet is already in a non-interruptible terminalization step,
2. the handoff template is completed,
3. the named Acting Launch Authority explicitly accepts control in the launch log,
4. only then may execution resume.

No implied substitution. No silent transfer of authority.

### 3.3 Mandatory reviewed artifacts before GO

Before GO, the Launch Authority must review:

* live Wave 0 manifest
* live `WAVE0-SYNTHETIC` packet manifest
* referenced validator manifest
* referenced evidence manifest
* referenced review manifest
* policy files for the active live configuration
* manifest validation output
* latest rehearsal notes
* latest successful dry-run evidence summary
* live operator checklist
* live escalation matrix
* rollback/revert playbook
* launch-day handoff template
* launch decision record shell with artifact versions/hashes pre-filled.  

### 3.4 Mandatory evidence before GO

A GO is allowed only if all blocking readiness criteria from Phase 7 remain true, plus the following live-only confirmations:

1. **Live infrastructure health verified**
   Phase 7 leaves this open explicitly: containers, Redis, PostgreSQL, storage, and model/API access must be verified in the live environment before launch. 

2. **Artifact immutability since last verification**
   Phase 7 states that readiness is invalidated by changes to packet manifests, validator manifests, evidence manifests, policy files, wave manifests, or manifest-validation tooling. That rule carries directly into Phase 8. 

3. **CLI fallback operational**
   Phase 7 lists CLI fallback as blocking. Wave 0 launch depends on it because the UI is not the required control surface in early waves. 

4. **Policy engine live smoke passes**
   Phase 7 requires synthetic ALLOW/DENY/ESCALATE tests for readiness. Those must be re-verified against live config immediately before launch. 

5. **At least one escalation path rehearsed successfully**
   This is already a blocking readiness criterion and remains mandatory. 

### 3.5 Mandatory metrics visibility before GO

The operator must be able to view, in live mode:

* packet state transitions
* validator statuses
* evidence completeness state
* policy decisions
* audit trail growth
* runtime health
* token consumption
* escalation queue
* benchmark smoke state
* operator intervention log.  

### 3.6 Blocking criteria

A GO is blocked if any of the following is true:

* any Phase 7 blocking readiness criterion is false
* live infra health is unverified
* CLI fallback is unavailable
* manifest hashes do not match approved versions
* live policy smoke checks fail
* evidence capture path is unverified
* launch-day rollback playbook is missing
* no successful rehearsal with full evidence exists
* no escalation rehearsal exists
* live and rehearsal artifact namespaces are not cleanly separated.  

### 3.7 Advisory criteria

These should pass but do not block Wave 0 if documented:

* debugger prompt family not fully tuned
* reviewer template calibration incomplete
* graph-repair proposer still draft quality
* non-Wave-0 runbooks incomplete
* broader benchmark fixture set deferred. 

### 3.8 Tolerable unresolved issues

Wave 0 may proceed with these unresolved, if explicitly recorded:

* token budget may need recalibration after live synthetic data
* observation cadence beyond Wave 0 may still be provisional
* Wave 1 → Wave 2 transition judgment may still need formalization
* speculative-start metric wiring may still be future-wave work, because Wave 0 does not use speculation. 

### 3.9 Intolerable unresolved issues

Wave 0 may not proceed if any of these remain ambiguous:

* whether launch artifacts are the approved ones
* whether policy protections on protected paths are active
* whether evidence completeness is actually blocking
* who has decision authority during anomalies
* whether live artifacts are distinguishable from rehearsal artifacts
* whether rollback ownership and steps are defined

### 3.10 Formal go/no-go checklist

A GO requires every item below to be marked true in the launch record:

* [ ] Primary Launch Authority named
* [ ] Acting Launch Authority named
* [ ] Wave 0 live manifest approved
* [ ] `WAVE0-SYNTHETIC` live packet manifest approved
* [ ] validator/evidence/review manifests approved
* [ ] policy files loaded and smoke-tested
* [ ] live infra healthy
* [ ] CLI fallback operational
* [ ] latest successful rehearsal evidence reviewed
* [ ] escalation rehearsal reviewed
* [ ] rollback/revert playbook reviewed
* [ ] handoff template ready
* [ ] no invalidating artifact drift since verification
* [ ] launch decision record opened
* [ ] explicit GO entered by Launch Authority

If any item is false, the decision is NO-GO.

---

## 4. Launch artifact set

Phase 8 requires a live-launch artifact set that is similar to, but not the same as, the Phase 7 preparation set.

### 4.1 Required live artifacts

1. **Live wave manifest**
   Defines active wave, allowed packets, concurrency cap, launch mode, review mode, freeze criteria, and success gates.

2. **Live packet manifest set**
   For Wave 0, this is one packet only: `WAVE0-SYNTHETIC` in live mode.

3. **Validator manifest**
   Exact validator stack referenced by the live packet.

4. **Evidence manifest**
   Exact evidence requirements used to determine completeness.

5. **Review manifest**
   Human-required review rules for the live packet.

6. **Live benchmark watchlist**
   Minimal smoke checks for the wave: packet completion, validator pass set,
   evidence completeness, policy behavior, merge-back correctness, audit trail
   completeness, and speculative marker remaining false.

   Recommended artifact: `benchmarks/manifests/wave0-live-smoke.yaml`, kept
   distinct from the rehearsal artifact `benchmarks/manifests/wave0-smoke.yaml`.

7. **Live operator checklist**
   Pre-launch checks, launch actions, monitoring loop, closeout.

8. **Live escalation matrix**
   Trigger category, owner, auto-pause behavior, required evidence to resume.

9. **Rollback/revert playbook**
   Defines packet abort, wave freeze, revert conditions, and post-rollback disposition.

10. **Launch-day handoff template**
    Required for transfer to Acting Launch Authority or shift handoff.

11. **Launch log / decision record**
    Records authority, artifact versions, timeline, interventions, anomalies, and final disposition.  

### 4.2 What is new for live launch versus rehearsal

New for live launch:

* live artifact namespace
* immutable artifact version set for execution window
* explicit authority and fallback authority fields
* launch decision record
* live handoff note
* live operational log
* live infra health snapshot
* live evidence bundle distinct from rehearsal evidence

Phase 7 already defined manifest generation, validation tooling, operator rehearsal, dry-run scenarios, evidence expectations, and readiness criteria. Phase 8 adds authority, immutability during execution, operational logging, and launch governance. 

### 4.3 Artifact control rule

Once GO is recorded, no launch artifact may change during the run. If a change is needed, the wave is frozen, readiness is rechecked, and launch is re-authorized.

---

## 5. Wave 0 live packet scope

### 5.1 Recommended scope

Wave 0 live scope should be:

> **One live synthetic packet only: `WAVE0-SYNTHETIC`. No real M0a packet is included.**

This is the correct Phase 8 boundary. Phase 7 explicitly distinguishes Wave 0 from Wave 1 and defines Wave 0 as a one-packet synthetic run with concurrency 1, human-required review, and speculative execution disabled. Wave 1 is where the real M0a foundation packets begin. 

### 5.2 Why real M0a should not be mixed into Wave 0

Mixing real M0a packets into the first live run creates ambiguity:

* if the run succeeds, you cannot tell whether you proved the live pipeline or just happened to succeed on a simple contract packet;
* if the run fails, you cannot tell whether the failure belongs to launch operations or packet-authoring behavior.

Synthetic-only keeps the signal clean.

### 5.3 What is intentionally excluded

Wave 0 excludes:

* all real M0a contract packets
* all M0b scaffolding packets
* all M1 implementation packets
* all integration packets
* all policy-sensitive packets
* all graph-repair packets
* all schema-changing packets
* all dependency-adding packets
* all benchmark runs beyond smoke verification
* all speculative execution
* all concurrency above 1.  

### 5.4 Disallowed packet classes in Wave 0

Disallowed for live Wave 0:

* interface
* implementation
* integration
* policy-sensitive
* graph-repair

Only the low-risk synthetic foundation packet is allowed.

### 5.5 Disallowed policy sensitivities in Wave 0

Any packet that would touch:

* `harness/`
* `.github/`
* `AGENTS.md`
* `.env*`
* `package.json` scripts
* migrations or other structural persistence surfaces

is disallowed. Those are already protected-path or elevated-risk surfaces in the security design.  

### 5.6 Speculative execution rule

Wave 0 live uses:

* speculative execution = false
* dependency class = none
* concurrency cap = 1

That is already consistent with the Phase 7 Wave 0 manifest model. 

---

## 6. Launch-day operator workflow

This should be run as a disciplined loop, not an ad hoc sequence.

### 6.1 Pre-launch checks

1. Open the launch decision record.
2. Record date/time and operator on duty.
3. Confirm Primary Launch Authority and Acting Launch Authority.
4. Verify hashes/versions for:

   * Wave 0 live manifest
   * `WAVE0-SYNTHETIC` manifest
   * validator manifest
   * evidence manifest
   * review manifest
   * active policy files
5. Confirm no invalidating artifact drift since readiness verification.
6. Verify live infra health.
7. Verify CLI commands required for:

   * status
   * evidence inspection
   * escalation queue
   * pause/freeze
   * resume
   * rollback
   * metrics
   * launch log write
8. Confirm live namespace separation from rehearsal namespace.
9. Confirm unrelated packet execution is disabled.

### 6.2 Launch authorization

10. Launch Authority reviews the completed checklist.
11. Launch Authority records explicit GO.
12. Timestamp GO in the launch record.
13. Activate `WAVE0-SYNTHETIC` only.

### 6.3 Packet activation order

There is exactly one activation:

* `WAVE0-SYNTHETIC`
* no overlap
* no staging of follow-on packets
* no queueing for Wave 1 under the same launch window

### 6.4 Live monitoring loop

The operator watches:

* state transitions
* validator start/finish status
* policy decisions
* evidence completeness progress
* runtime health
* token usage
* audit trail growth
* escalation queue
* merge-back state

This is not passive. The operator should actively inspect each transition and confirm it matches expected state machine behavior. Phase 5 already frames the operator as supervising an execution system rather than diff-reviewing output by hand; in Wave 0, that supervision becomes more exacting because there is only one packet and the purpose is to verify the control path. 

### 6.5 Evidence inspection before declaring success

When the packet reaches completion-candidate state, the operator must inspect:

* actual diff
* validator summary
* evidence completeness result
* policy decision log
* audit trail
* context pack manifest
* token/duration summary
* worktree and branch identity
* merge-back result
* operator notes from any intervention

Wave 0 is not successful until this inspection is complete.

### 6.6 Escalation handling

If any escalation occurs:

1. classify the category,
2. consult the escalation matrix,
3. decide pause / abort / freeze,
4. capture the rationale in the launch log,
5. do not resume until required re-entry evidence exists.

### 6.7 Pause, freeze, rollback decisions

The operator may not improvise. Section 8 rules apply directly.

### 6.8 Post-run review

After packet completion or termination:

1. freeze new launches,
2. complete evidence review,
3. complete operator debrief,
4. update metrics summary,
5. update launch decision record,
6. decide whether Wave 0 is:

   * successful,
   * repeat-required,
   * failed / return-to-preparation.

### 6.9 End-of-day launch record

The launch record must close with:

* final disposition
* packet outcome
* metrics snapshot
* anomalies
* interventions
* authority handoffs, if any
* whether rollback occurred
* whether Wave 1 planning is allowed

---

## 7. Live monitoring and evidence protocol

### 7.1 Live signals the operator must watch

During execution, the operator must watch these categories continuously.

**Validator status**

* every expected validator started
* every expected validator finished
* no unexpected validator omissions
* no validator ERROR masked as ordinary FAIL

**Policy decisions**

* every tool invocation has a policy decision
* expected result pattern for Wave 0 is overwhelmingly ALLOW
* any unexpected DENY or ESCALATE is investigated immediately

**Evidence completeness**

* required fields accumulate as expected
* no missing audit records
* completeness validator remains green at terminalization

**Runtime health**

* container healthy
* worktree healthy
* tool broker healthy
* policy engine responsive
* no runtime reprovisioning unless explicitly handled

**Token budget behavior**

* monitor usage growth
* watch for warning threshold
* hard stop at the configured ceiling

**Speculative-start / freeze signals**

* speculative marker must remain false in Wave 0
* any speculative artifact or flag is a launch anomaly

**Review queue status**

* there should not be a meaningful review queue in Wave 0
* only final operator review should remain

**Security alerts**

* any security alert is treated as a freeze condition for Wave 0

**Benchmark / health checks**

* only smoke expectations matter in Wave 0
* do not expand into full benchmark evaluation

**Packet state transitions**

* transitions must be legal and ordered
* no skipped states
* no unexplained oscillation

These categories are already implicit in Phase 5 operational visibility and explicit in Phase 7 Wave 0 evidence expectations.  

### 7.2 Evidence required before success declaration

Before declaring Wave 0 successful, the operator must verify that the live evidence bundle contains, at minimum:

* diff
* compile/lint/test results
* architecture check result
* scope-drift result
* policy compliance result
* evidence completeness result
* confidence score
* full audit trail
* cost summary
* context pack manifest
* worktree identity
* speculative-start marker = false

Phase 7 defines this evidence set explicitly for Wave 0. Phase 2 makes evidence completeness a blocking validator gate.  

### 7.3 Operator review requirement

Even if the evidence completeness validator passes, the operator still manually inspects the bundle. Wave 0 is the first live launch. Manual evidence inspection is part of the success condition, not an optional comfort step.

### 7.4 Live evidence rule vs rehearsal evidence rule

Live evidence is authoritative for progression decisions. Rehearsal evidence is authoritative only for readiness. They must never be blended into a single evidence result.

---

## 8. Abort / pause / freeze / rollback rules

### 8.1 Packet abort

Use **abort** when the packet must stop and must not resume automatically.

Abort triggers:

* manifest mismatch at runtime
* token hard ceiling reached
* protected-path or unsafe action attempt indicating contract breach
* audit trail gap
* evidence corruption that cannot be repaired in-place
* repeated unsafe policy interaction
* worktree corruption requiring fresh packet start

Effect:

* packet enters `ABORTED`
* evidence is preserved for forensics
* no auto-retry
* Wave 0 is not counted successful

### 8.2 Packet pause

Use **pause** when the issue may be recoverable.

Pause triggers:

* transient runtime instability
* ambiguous validator error under active investigation
* temporary evidence collection anomaly
* operator needs inspection before allowing next step

Effect:

* no further tool actions
* packet state preserved
* re-entry requires explicit authorization

### 8.3 Wave freeze

Use **freeze** when the wave cannot continue safely without a governance decision.

Freeze triggers:

* policy engine anomaly
* security alert
* evidence pipeline anomaly
* unexplained live vs rehearsal divergence
* operator loses situational awareness
* authority handoff required

Effect:

* no new launches
* no merge approvals
* current packet paused or aborted
* only Launch Authority or Acting Launch Authority can clear freeze

### 8.4 Full rollout pause

Use **full rollout pause** when trust in the platform is in doubt, not just trust in the packet.

Triggers:

* suspected policy bypass
* missing audit entries
* severe runtime instability
* rollback required because merged state is untrustworthy
* repeated unexplained control-plane inconsistency

Effect:

* all future waves paused
* return to preparation / postmortem state before any next live attempt

### 8.5 Revert / rollback

For Wave 0, rollback means:

* if merge-back occurred, revert the synthetic merge from the phase branch,
* archive evidence and audit trail,
* quarantine or delete live synthetic worktree/branch,
* log exact revert reason,
* mark Wave 0 unsuccessful.

This stays simple because Wave 0 should not produce user-meaningful product state. The only meaningful rollback target is the synthetic merge-back and the operational state around it.

### 8.6 Graph repair during live Wave 0

**Not allowed.**

If a graph defect is discovered during live Wave 0, that is a launch failure or a freeze-to-preparation event. Do not attempt live graph repair in the first live wave.

### 8.7 CLI fallback activation

CLI is the required early-wave control surface. If any richer surface exists and degrades, operator control immediately falls back to CLI. If CLI itself is unavailable, execution pauses or freezes because the required operational controls are gone. 

### 8.8 Re-entry conditions after pause

Resume is allowed only when all are true:

* issue classified
* corrective action recorded
* affected service/path revalidated
* no invalidating artifact drift occurred
* launch record updated
* Launch Authority or Acting Launch Authority explicitly authorizes resume

---

## 9. Live escalation matrix

### 9.1 Validator disagreement or validator ERROR

* **Notify**: operator, Launch Authority
* **Auto-pause**: yes
* **Resume evidence**: rerun result, cause classification, proof that evidence bundle remains intact

### 9.2 Evidence incompleteness

* **Notify**: operator
* **Auto-pause**: yes
* **Resume evidence**: evidence completeness pass, explicit explanation of missing fields, confirmation no audit gaps remain

### 9.3 Policy engine anomaly

* **Notify**: operator, Launch Authority
* **Auto-pause/freeze**: immediate freeze
* **Resume evidence**: live ALLOW/DENY/ESCALATE smoke pass, audit continuity, root-cause note

### 9.4 Unsafe action attempt

* **Notify**: operator, Launch Authority
* **Auto-pause**: immediate
* **Resume evidence**: classification of attempt, confirmation whether the packet remains resumable; many cases should escalate directly to abort

### 9.5 Security alert

* **Notify**: operator, Launch Authority
* **Auto-pause/freeze**: immediate freeze
* **Resume evidence**: issue closed or waived explicitly; otherwise abort

### 9.6 Graph inconsistency discovered late

* **Notify**: operator, Launch Authority
* **Auto-pause**: yes
* **Resume evidence**: almost certainly none for live Wave 0; expected disposition is freeze and return to preparation

### 9.7 Manifest inconsistency discovered late

* **Notify**: operator, Launch Authority
* **Auto-pause**: immediate
* **Resume evidence**: approved manifest hash matches loaded manifest; if not, abort

### 9.8 Runtime instability

* **Notify**: operator
* **Auto-pause**: usually yes
* **Resume evidence**: runtime health restored, worktree integrity restored, no evidence corruption

### 9.9 Benchmark smoke regression

* **Notify**: operator
* **Auto-pause**: yes
* **Resume evidence**: smoke expectations rerun and explained

### 9.10 Operator overload / loss of visibility

* **Notify**: Launch Authority or Acting Launch Authority
* **Auto-pause**: yes
* **Resume evidence**: handoff complete, visibility restored, authority acknowledged in launch log

---

## 10. Rehearsal-to-live boundary handling

### 10.1 How rehearsal runs are marked

Every rehearsal artifact must be explicitly tagged as rehearsal-only. That includes:

* packet state
* evidence bundles
* audit logs
* worktrees
* branches
* operator notes
* scenario outputs

Phase 7 is explicit that Wave 0 dry-run preparation exists to produce readiness evidence, not operational evidence. 

### 10.2 Rehearsal cleanup before live launch

Before live GO:

* archive or delete rehearsal worktrees/branches,
* preserve rehearsal evidence in a rehearsal namespace,
* ensure no rehearsal state is present in the live packet registry as active state,
* ensure no rehearsal evidence is referenced as if it were live evidence.

### 10.3 What carries into live launch

Carry forward:

* approved manifests
* approved policy files
* prompt template versions
* validated context-pack profile
* rehearsal notes
* readiness checklist results

### 10.4 What must be regenerated for live launch

Generate fresh:

* live launch decision record
* live infra health snapshot
* live evidence bundle
* live audit trail
* live worktree identity
* live context-pack manifest
* live operator approvals
* live handoff note, if needed

### 10.5 How the decision record references rehearsal

The live decision record may reference rehearsal by:

* rehearsal run ID
* rehearsal artifact versions
* rehearsal outcome summary
* lessons learned that affected launch readiness

But the live outcome section must contain only live evidence. That avoids confusing readiness evidence with operational evidence.

---

## 11. Live metrics and launch gates

Wave 0 should use a deliberately narrow metric set aligned to a one-packet synthetic launch.

### 11.1 Required live metrics

At minimum:

* packet success/failure
* validator pass/fail/error
* evidence completeness
* policy violations
* unsafe action attempts
* repair-loop count
* oscillation/freeze behavior
* **operator decision latency**
* **time-to-clear escalation**
* runtime stability incidents
* security alerts
* benchmark smoke result
* operator intervention burden

For Wave 0, “review latency” is too generic. The meaningful measure is how long it takes the operator or authority to make required decisions and clear escalations, because there is no true multi-packet review queue yet.

### 11.2 Continuation thresholds

Wave 0 may continue while in flight only if:

* no critical runtime fault exists,
* no policy anomaly exists,
* no security alert exists,
* evidence path remains intact,
* speculative marker remains false,
* token usage remains below hard ceiling,
* state transitions remain legal.

### 11.3 Pause thresholds

Pause or freeze immediately if any of these occurs:

* validator ERROR
* evidence completeness failure
* unexpected DENY/ESCALATE not explained by rehearsal scenarios
* runtime reprovisioning required
* operator loses visibility into packet state
* operator decision latency exceeds the predeclared acceptable window for a blocking decision
* escalation remains uncleared beyond the predeclared time-to-clear threshold

### 11.4 Abort thresholds

Abort the packet or wave if any of these occurs:

* token ceiling reached
* manifest mismatch
* policy bypass suspicion
* audit gap
* unsafe action on protected path
* second major repair need on the synthetic packet
* rollback required after merge-back

### 11.5 Repair-loop threshold for Wave 0

Recommended rule:

* 0 repairs preferred
* 1 narrowly scoped repair may be tolerated if packet-local and non-policy/non-runtime
* 2 repairs or any oscillation pattern = Wave 0 failure

Phase 2 already defines escalation logic for oscillation, negative progress, and repair-loop pathology. A synthetic launch should not need repeated repairs. 

---

## 12. Wave 0 success criteria

Wave 0 success should be judged on four levels.

### 12.1 Packet-level success

The packet succeeds only if:

* it reaches terminal success state,
* all blocking validators pass,
* evidence completeness passes,
* audit trail is complete,
* no unresolved escalation remains,
* no rollback is required.

### 12.2 Wave-level success

Wave 0 succeeds only if:

* only `WAVE0-SYNTHETIC` ran,
* concurrency remained 1,
* speculative execution remained false,
* no graph repair occurred,
* no unresolved freeze remained at close,
* live smoke expectations were met. 

### 12.3 Launch-process success

The launch process succeeds only if:

* GO was explicitly recorded,
* authority and fallback authority were named,
* operator workflow was followed,
* any handoff was explicit and logged,
* closeout record was completed.

### 12.4 Platform-trust success

Forge earns trust to proceed only if:

* no policy bypass or anomaly occurred,
* no evidence gap occurred,
* no unexplained live/rehearsal divergence occurred,
* no hidden manual intervention was needed to rescue the packet,
* operator intervention burden remained low and explainable.

Phase 2 explicitly treats operator trust / intervention burden as a distinct evaluation dimension, not something to bury inside raw correctness. 

---

## 13. Post-launch review protocol

Immediately after the first live run completes:

### 13.1 Freeze further launches

Do not chain directly into Wave 1. Close Wave 0 first.

### 13.2 Review full live evidence

Inspect:

* evidence bundle completeness
* validator outputs
* audit trail
* policy decisions
* token/cost summary
* runtime events
* final diff and merge-back state

### 13.3 Conduct operator debrief

Capture:

* what was easy
* what was confusing
* where pause/freeze rules were close to needed
* whether authority substitution rules were clear
* whether the monitoring surface was adequate

### 13.4 Incident / anomaly review

Create anomaly records for any of:

* unexpected policy result
* evidence gap
* runtime instability
* rollback
* security alert
* operator overload
* unexplained latency in decisions or escalation clearance

### 13.5 Metrics review

Review the Wave 0 metrics set, with emphasis on:

* whether any pause threshold was approached,
* whether operator decision latency was acceptable,
* whether escalation clearance stayed within expected bounds,
* whether intervention burden remained low.

### 13.6 Update launch decision record

Close the record with:

* final disposition
* metrics summary
* anomalies
* interventions
* whether Wave 1 planning is permitted

### 13.7 Decide next disposition

Exactly one outcome should be chosen:

1. **Advance to Wave 1 planning**
2. **Repeat Wave 0 live**
3. **Return to preparation / no-go**

### 13.8 When Wave 1 planning is allowed

Wave 1 planning is allowed only if all four success levels in Section 12 are true.

### 13.9 When another Wave 0 repetition is required

Repeat Wave 0 if any of these occurred:

* one repair was needed,
* one unexpected escalation occurred,
* evidence completeness required manual salvage,
* runtime instability required reprovisioning,
* handoff/authority rules were exercised but awkward,
* operator decision latency was too high,
* escalation clearance took materially longer than planned,
* live behavior materially diverged from rehearsal without resolved cause.

---

## 14. Phase 8 repo artifacts

Phase 8 should produce the following repo or ops artifacts.

### `ops/wave0-go-no-go-checklist.md`

Contains:

* blocking criteria
* advisory criteria
* signoff fields
* authority and fallback authority
* artifact version references

### `ops/wave0-launch-protocol.md`

Contains:

* pre-launch steps
* activation steps
* monitoring loop
* evidence inspection procedure
* closeout flow

### `ops/wave0-escalation-matrix.md`

Contains:

* escalation categories
* owners
* auto-pause/freeze behavior
* resume evidence requirements
* logging requirements

### `ops/wave0-rollback-playbook.md`

Contains:

* abort vs pause vs freeze vs rollback definitions
* exact triggers
* revert steps
* post-rollback disposition rules

### `ops/wave0-live-metrics.md`

Contains:

* metric definitions
* thresholds
* continuation / pause / abort gates
* operator decision latency and escalation-clearance targets

### `ops/wave0-decision-record.md`

Contains:

* GO/NO-GO record
* named authorities
* artifact versions/hashes
* timeline
* interventions
* final outcome

### `ops/wave0-postmortem-template.md`

Contains:

* anomaly categories
* incident classification
* lessons
* disposition recommendation

### `ops/wave0-handoff-template.md`

Contains:

* current packet state
* open escalations
* required next decisions
* metrics anomalies
* authority acceptance section

### `packets/waves/wave0-live.yaml`

Contains:

* one live packet only
* concurrency cap = 1
* operator-launched
* human-required review
* speculative execution = false
* live freeze/abort gates

### `ops/wave1-progression-checklist.md`

Contains:

* exact requirements to move from Wave 0 success into Wave 1 authorization

---

## 15. Open questions for Wave 1

These are the real next-phase questions after a successful Wave 0 launch.

1. Should the first real M0a packets be agent-authored or operator-authored with agent validation support?
2. What operator observation cadence is sustainable for Wave 1 serial packet execution?
3. What exact quality standard makes M0a “stable enough” to unlock M0b and first M1 packets?
4. How should Wave 0 token data recalibrate policy budget files?
5. When can review burden shift from every-packet human review to evidence-driven spot review?
6. When can live graph repair be permitted, and under what governance?
7. When should speculative-start metrics become live gating signals rather than deferred telemetry?
8. When should the operating surface move from CLI-primary to UI+CLI without losing reliability?
9. How should escalation severity be weighted once multiple real packets are in motion?
10. What is the minimum safe Wave 1 concurrency policy after a successful Wave 0?

These are scale and progression questions, not architecture restatements.

---

## 16. Final Phase 8 decision summary

### Phase 8 Decision Summary

* **Recommended go/no-go model**
  One named Primary Launch Authority with one named Acting Launch Authority. The decision record must separate runtime, validation/evidence, and security/policy signoff lenses even if one person holds all three.

* **Recommended Wave 0 live scope**
  Live synthetic packet only. Wave 0 produces live operational evidence, but not user-meaningful product state.

* **Recommended launch-day operator workflow**
  Verify live artifact versions and infra health, record explicit GO, activate only `WAVE0-SYNTHETIC`, monitor every state transition, inspect the complete evidence bundle, then close the launch record before any next-wave decision.

* **Recommended abort/pause/rollback rules**
  Pause on recoverable ambiguity, freeze on governance or security uncertainty, abort on manifest/policy/evidence integrity failures, rollback if the synthetic merge-back becomes untrustworthy. No live graph repair in Wave 0.

* **Recommended live evidence/metrics protocol**
  Require a complete live evidence bundle, manual operator inspection, packet-state visibility, policy decision logging, audit completeness, token usage tracking, runtime health tracking, operator decision latency, and time-to-clear escalation.

* **Recommended success criteria**
  Packet success, wave success, launch-process success, and platform-trust success must all be true. Technical completion by itself is insufficient.

* **Required artifacts for live launch**
  Live wave manifest, live packet manifest, go/no-go checklist, launch protocol, escalation matrix, rollback playbook, live metrics spec, handoff template, decision record, and postmortem template.

* **Top open questions for Wave 1**
  M0a authorship mode, Wave 1 observation cadence, progression quality threshold, token recalibration, human-review reduction policy, live graph-repair governance, speculative-start gating, and CLI-to-UI transition timing.
