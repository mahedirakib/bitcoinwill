# Changelog

All notable changes to the Bitcoin Will project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- No changes yet.

## [1.0.0] - 2026-02-17

### Added
- Live vault status checks via public explorer APIs with provider fallback (Mempool.space / Blockstream.info).
- Transaction broadcast helper for signed raw transactions with Mainnet confirmation gating.
- Owner check-in helper with locktime cadence guidance and eligibility countdown.
- "Checklist for Success" modal before Recovery Kit download.
- Dev-only QA crash trigger to verify ErrorBoundary behavior.
- Security audit report for release hardening (`docs/SECURITY_AUDIT_2026-02-17.md`).

### Enhanced
- Browser-safe key/script handling (removed runtime Buffer dependency from client Bitcoin logic path).
- Production build no longer emits source maps by default, reducing deployment artifact size.
- Mainnet result badge and stronger mainnet contrast styling.
- Expanded automated coverage to 127 tests across Bitcoin logic, safety, and explorer integration.
- Release QA checklist completed for creation flow, safety, portability, and print path.

## [0.1.0] - 2026-02-08

### Added
- **MVP Release** - Initial functional version of Bitcoin Will.
- Core Bitcoin script generation using P2WSH (Pay-to-Witness-Script-Hash).
- TimeLock Inheritance Protocol (TIP) with CSV (CheckSequenceVerify) opcode.
- 4-step wizard for creating spending plans:
  - Type selection (Timelock Recovery)
  - Public key input (Owner & Beneficiary)
  - Delay configuration (1 to 52,560 blocks)
  - Review and generation
- Recovery Kit export (JSON format) containing:
  - Plan configuration
  - Generated vault address
  - Witness script
  - Descriptor for wallet import
- Beneficiary Instructions page with:
  - Step-by-step recovery guide
  - Technical details (address, script, descriptor)
  - Printable/Downloadable format
- Multi-network support:
  - Testnet (default)
  - Regtest
  - Mainnet (with safety lock requiring explicit unlock)
- Educational content:
  - Learn page explaining inheritance concepts
  - Protocol page with technical specifications
  - Security documentation
- Safety features:
  - Mainnet lock with confirmation phrase
  - Visual network indicators (red badge for Mainnet)
  - Comprehensive warnings throughout UI
  - Sample keys for safe testing
- Responsive UI with Bitcoin Orange theme:
  - Dark mode with glass-morphism design
  - Progress indicators
  - Toast notifications
  - Error boundaries
- Client-side only architecture:
  - No backend required
  - No data persistence
  - Works offline/air-gapped

### Security
- Client-side key handling (private keys never touch the app).
- Public key validation (compressed 33-byte format).
- Input sanitization and validation.
- Stateless design (no user data stored on servers).

### Technical
- React 18 + TypeScript + Vite stack.
- Tailwind CSS for styling.
- `bitcoinjs-lib` for Bitcoin operations.
- ESLint + TypeScript strict mode.
- Static build output for easy hosting.

[Unreleased]: https://github.com/mahedirakib/bitcoinwill/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/mahedirakib/bitcoinwill/releases/tag/v1.0.0
[0.1.0]: https://github.com/mahedirakib/bitcoinwill/releases/tag/v0.1.0
