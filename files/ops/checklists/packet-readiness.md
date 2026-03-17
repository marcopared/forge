# Packet Readiness Checklist

## Purpose

Use this before activating any packet.
This checklist is packet-level and applies within the already-approved wave.

## Identity And Integrity

- [ ] Packet ID is correct
- [ ] Packet manifest exists and is the approved version
- [ ] Packet manifest passes schema validation
- [ ] Packet references valid validator, evidence, review, context-profile, and template artifacts
- [ ] Packet version and operator notes are current

## Dependencies

- [ ] All prerequisite packets are present in the registry
- [ ] Required prerequisite packets are in the required state for the packet's dependency class
- [ ] Required prerequisite artifacts exist
- [ ] No dependency-cycle or reference-integrity issue is open
- [ ] Speculative-start legality matches the packet class and current wave rules

## Scope And Policy

- [ ] `scope` is coherent and matches the approved design
- [ ] `target_paths` stay within `scope`
- [ ] `out_of_scope` does not overlap with `scope`
- [ ] `protected_paths` are declared appropriately
- [ ] Packet does not require protected-path writes
- [ ] Policy sensitivities, if any, are declared and understood

## Inputs And Outputs

- [ ] Required inputs are available for context-pack assembly
- [ ] Expected outputs are specific enough to review
- [ ] Completion contract is reviewable and consistent with packet scope
- [ ] Escalation conditions are documented
- [ ] Graph-repair hooks are plausible for the packet class

## Operational Readiness

- [ ] Context pack profile is valid for this packet
- [ ] Token budget exists for this packet class
- [ ] CLI fallback can control this packet if needed
- [ ] Validator set for this packet class is understood by the operator
- [ ] Evidence bundle expectations are understood by the operator

## Wave-Specific Checks

### Wave 0
- [ ] Packet is `WAVE0-SYNTHETIC`
- [ ] Output remains synthetic-only and trivial
- [ ] Speculative start is disabled
- [ ] Review mode is human-required

### Wave 1
- [ ] Packet is one of F-M0-003 through F-M0-007
- [ ] Packet remains foundation-contract only
- [ ] Human review is confirmed as blocking
- [ ] No implementation logic is expected or allowed

## Activation Decision

- [ ] Packet is ready to activate
- [ ] Operator records launch authorization
