# Security Audit Report (2026-02-17)

This report summarizes the third-party security tooling run for the `v1.0.0` hardening pass.

## Scope

- Static client application (`React + Vite + TypeScript`)
- Bitcoin logic modules (`src/lib/bitcoin/`)
- Dependency and supply-chain checks

## Third-Party Tooling Results

### 1) npm package signatures and attestations

Command:

```bash
npm audit signatures
```

Result:

- `405 packages have verified registry signatures`
- `58 packages have verified attestations`

### 2) Production dependency audit

Command:

```bash
npm audit --omit=dev --audit-level=high
```

Result:

- `found 0 vulnerabilities`

### 3) Full dependency audit

Command:

```bash
npm audit --audit-level=moderate
```

Result:

- `found 0 vulnerabilities`

## CI Security Gates

The repository includes recurring security workflows:

- `.github/workflows/security.yml`
  - Dependency audits on push/PR/schedule
  - npm signature verification
  - Gitleaks secret scanning

## Release Decision

Based on:

- Zero moderate/high vulnerabilities from npm audit
- Verified package signatures/attestations
- Existing CI secret scanning and recurring security workflow
- Expanded test coverage for Bitcoin logic and explorer integration

This release is approved as `v1.0.0` for production deployment, with ongoing community review encouraged through standard GitHub issue/PR workflows.
