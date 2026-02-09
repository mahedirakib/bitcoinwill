# Architecture Decision Records (ADRs)

This directory contains records of significant architectural decisions made during the development of Bitcoin Will.

## What is an ADR?

An Architecture Decision Record captures:
- What decision was made
- Why it was made (context and constraints)
- What alternatives were considered
- Consequences of the decision

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| 001 | Use Stateless Client-Side Architecture | Accepted | 2026-01-15 |
| 002 | P2WSH over P2SH for Script Hashes | Accepted | 2026-01-15 |
| 003 | CSV Relative Timelock over CLTV | Accepted | 2026-01-16 |
| 004 | No Backend or Database | Accepted | 2026-01-16 |
| 005 | React + Vite + TypeScript Stack | Accepted | 2026-01-17 |

## Status Definitions

- **Proposed:** Under consideration, not yet decided
- **Accepted:** Decision made and implemented
- **Deprecated:** Decision was accepted but is no longer relevant
- **Superseded:** Decision replaced by a newer ADR

## Contributing

When making significant architectural decisions:

1. Create a new ADR using the format: `NNN-title-in-kebab-case.md`
2. Use the template below
3. Submit for review via pull request
4. Update this index

## ADR Template

```markdown
# ADR NNN: Title

## Status
- Proposed / Accepted / Deprecated / Superseded

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the decision that was made?

## Consequences
What becomes easier or more difficult to do?

## Alternatives Considered
What other options were evaluated?

## Related
Links to related ADRs, issues, or documentation
```
