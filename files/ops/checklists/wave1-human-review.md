# Wave 1 Human Review Checklist

## Purpose

Use this checklist for F-M0-003 through F-M0-007 after deterministic validators pass.
Human review is the blocking gate for Wave 1.

## Required Evidence Before Review

- [ ] Full diff inspected
- [ ] Compilation result inspected
- [ ] Lint result inspected
- [ ] Scope-drift result inspected
- [ ] Protected-path result inspected
- [ ] Architecture-boundary result inspected
- [ ] Evidence completeness result inspected
- [ ] Audit trail inspected for unexpected tool use
- [ ] Context pack manifest inspected
- [ ] Agent reviewer findings noted, if agent review ran

## Specification Fidelity

- [ ] Produced types match the approved architecture design
- [ ] Relevant domain objects, interfaces, events, action classes, or evidence types are represented
- [ ] No types were invented beyond the approved design
- [ ] No major design types are missing

## Type Correctness

- [ ] Type shapes are appropriate
- [ ] Required vs optional fields look correct
- [ ] Enums or discriminated unions are used where the design calls for them
- [ ] Type guards exist where needed and remain minimal
- [ ] Types compose cleanly with downstream consumers

## Contract Composability

- [ ] Output can be imported by downstream workstreams without workaround patterns
- [ ] Exports are clean and complete
- [ ] Re-export index exposes everything it should
- [ ] No circular type dependencies are introduced

## Scope Compliance

- [ ] Changes stay within `packages/shared/src/types/`
- [ ] No implementation logic appears in the packet output
- [ ] No imports appear from outside the shared types package
- [ ] No out-of-scope file modifications occurred

## Convention Adherence

- [ ] Naming follows project conventions
- [ ] Non-obvious types have comments or JSDoc where needed
- [ ] Code remains lint-clean and type-check clean

## Reject If Any Are True

- [ ] Output contradicts the approved architecture design
- [ ] A major domain concept is missing
- [ ] Implementation logic appears in a type-only packet
- [ ] Out-of-scope files were modified
- [ ] Circular dependencies were introduced
- [ ] Downstream consumers would require workaround patterns

## Graph-Repair Indicators

- [ ] Packet scope is too narrow for the required contract work
- [ ] Hidden coupling or missing prerequisite appeared
- [ ] Architecture ambiguity prevents safe approval without a spec decision

## Review Decision

- [ ] APPROVE
- [ ] REJECT
- [ ] REVISE / GRAPH-REPAIR REVIEW
- [ ] Rationale recorded in the launch record
