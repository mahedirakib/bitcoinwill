# Dependency Hardening Report (2026-02-17)

**What this is:** automated third-party **dependency and supply-chain tooling** run for the `v1.0.0` hardening pass (npm audit, package signatures, CI secret scanning).

**What this is not:** an independent cryptography or Bitcoin-script audit of P2WSH/P2TR vault construction, Taproot NUMS usage, or Shamir recovery. Treat script correctness as requiring separate review and your own verification.

## Scope

- Static client application (`React + Vite + TypeScript`)
- Dependency and supply-chain checks
- CI security gates supporting the release decision

## Tooling Results

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

This release is approved as `v1.0.0` for production deployment **from a dependency-hardening perspective**, with ongoing review encouraged through private maintainer, security, and release workflows. A dedicated independent audit of vault scripts and key-handling paths remains welcome and is tracked in `TODO.md`.
