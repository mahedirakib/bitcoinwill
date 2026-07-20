<p align="center">
  <img src="src/assets/logo.png" width="200" alt="Bitcoin Will Logo">
</p>

<h1 align="center">Bitcoin Will 🔐</h1>

<p align="center">
  A minimal, privacy-first reference implementation of the TimeLock Inheritance Protocol (TIP) for non-custodial Bitcoin inheritance spending plans.
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/status-stable-success" alt="Status">
  <img src="https://img.shields.io/badge/tests-424%20unit%20passing-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/typescript-5.6-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/react-18-61DAFB?logo=react" alt="React">
</p>

---

## Status: Stable Release (v1.0.0)

This project is a **production-ready static release** for TIP planning and recovery operations. It includes live explorer balance checks, transaction broadcast helpers, Mainnet safety locks, and comprehensive validation tests.

> **⚠️ Important:** Always verify scripts and practice with small amounts before high-value Mainnet usage.

---

## What is Bitcoin Will?

Bitcoin Will is a **stateless, client-side utility** that implements the TimeLock Inheritance Protocol (TIP). It helps you create a Bitcoin "Dead Man's Switch" by generating a unique Vault Address with a built-in rule:

**You can spend funds at any time, but if funds remain unmoved for a specified delay, a beneficiary can claim them using their own key.**

### How It Works

```
┌─────────────────┐         ┌─────────────────┐
│   Owner Key     │         │ Beneficiary Key │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └───────────┬───────────────┘
                     ▼
            ┌─────────────────┐
            │  Bitcoin Script │
            │  OP_IF/OP_ELSE  │
            │   with CSV      │
            └────────┬────────┘
                     ▼
            ┌─────────────────┐
            │  Vault Address  │
            │   (P2WSH/P2TR)  │
            └─────────────────┘
```

- **Path A (Owner):** Spend immediately with your key
- **Path B (Beneficiary):** Spend after delay with their key

---

## ✨ Features

### Vault Creation
- **4-step wizard** for creating inheritance vaults
- **Multiple address types** (P2WSH SegWit, Taproot support)
- **Network support** (Testnet, Regtest, Mainnet)
- **Hardware wallet integration** (Ledger, Trezor)
- **Shamir's Secret Sharing** for social recovery

### Recovery Tools
- **Recovery Kit** JSON export with all vault data
- **Live vault status** via Mempool.space / Blockstream.info
- **Unsigned PSBT templates** for owner, beneficiary, and check-in spends
- **Owner check-in helper** to track CSV timer
- **Transaction broadcast** helper for beneficiaries
- **Print-friendly** beneficiary instructions
- **My vaults** with deep links (`/vaults/:id`) and optional ephemeral mode

### Security & Privacy
- **100% client-side** - No server, no database, no accounts
- **Public-key by default** - Standard vaults use only pubkeys you provide
- **Social recovery exception** - Optional SSS generates a beneficiary key in-browser; you export and split it (never uploaded)
- **Offline-capable planning** - Address/script generation works without network; status, broadcast, and hardware need connectivity
- **Open source (MIT)** - Anyone can audit, self-host, or verify the build

---

## 📸 Screenshots

*Screenshots coming soon - See the live app at the demo link below*

<!--
![Vault Creation](./docs/screenshots/create-vault.png)
![Recovery Kit](./docs/screenshots/recovery-kit.png)
![Vault Status](./docs/screenshots/vault-status.png)
-->

---

## 🚀 Quick Start

### Run Locally

```bash
# Clone the repository
git clone https://github.com/mahedirakib/bitcoinwill.app.git
cd bitcoinwill.app

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📖 Documentation

**New to the project?** Start with the [Documentation Index](./docs/INDEX.md) for a guided tour.

### For Users
- **[Learning Center](./docs/LEARNING.md)** - Bitcoin inheritance concepts explained
- **[Recovery Guide](./docs/RECOVERY_GUIDE.md)** - Step-by-step beneficiary instructions
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Glossary](./docs/GLOSSARY.md)** - Bitcoin and TIP terminology

### For Developers
- **[Architecture](./docs/ARCHITECTURE.md)** - System design and data flow
- **[Contributing](./CONTRIBUTING.md)** - How to contribute
- **[Code of Conduct](./CODE_OF_CONDUCT.md)** - Community standards
- **[Testing](./TESTING.md)** - Testing strategy and patterns
- **[AGENTS.md](./AGENTS.md)** - Guide for AI agents working on this codebase ⭐

### Technical Reference
- **[TIP Whitepaper](./whitepaper.md)** - Protocol scope, threat model, and assumptions
- **[Protocol Specification](./PROTOCOL.md)** - TIP script and implementation details
- **[Security Policy](./SECURITY.md)** - Threat model and safety tips
- **[Dependency Hardening Report](./docs/SECURITY_AUDIT_2026-02-17.md)** - npm audit / supply-chain checks (not a formal crypto audit)
- **[API Reference](./src/lib/bitcoin/README.md)** - Bitcoin module documentation

### Project Management
- **[Changelog](./CHANGELOG.md)** - Version history
- **[TODO](./TODO.md)** - Future plans and roadmap
- **[ADR Index](./docs/adr/README.md)** - Architecture decision records

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite + TypeScript 5.6
- **Styling:** Tailwind CSS (Bitcoin Orange Theme)
- **Bitcoin:** bitcoinjs-lib + tiny-secp256k1
- **Testing:** Vitest + Playwright (E2E)
- **Build:** Vite with tree-shaking and code-splitting

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test -- --coverage

# Run E2E tests
npm run test:e2e

# Ready check (lint + test + build)
npm run ready-check
```

---

## 🏗️ Development

### Project Structure

```
src/
├── features/           # Feature modules (isolated)
│   ├── will-creator/   # Vault creation wizard
│   └── recovery/       # Recovery kit tools
├── lib/bitcoin/        # Core Bitcoin logic
├── components/         # Shared UI components
├── pages/              # Route pages
└── state/              # Global state
```

### Key Constraints

- **No backend code** - Client-side only
- **No new dependencies** without approval
- **Never suppress TypeScript errors**
- **Named exports** preferred
- **Never commit private keys**

See [AGENTS.md](./AGENTS.md) for detailed patterns and constraints.

---

## 🔒 Security

- **Stateless server-side:** No backend stores your data (browser localStorage may keep vault metadata you choose to save)
- **Private keys:** Not required for standard pubkey-only vaults. Optional social recovery generates a beneficiary key client-side only—never paste owner keys into the app
- **Deterministic:** Same inputs always produce same outputs
- **Hardened:** Dependency signature checks and CI security gates; not a substitute for an independent script/crypto audit
- **Open source:** Fully auditable; report issues privately via [SECURITY.md](./SECURITY.md)

> **Watch out for malicious forks.** Only trust builds from the official
> domain or from a commit you have personally reviewed. See
> [SECURITY.md](./SECURITY.md) for the full threat model.

---

## 🤝 Contributing

Bitcoin Will is open source under the MIT license. Contributions are welcome!
See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Fork & pull-request workflow
- Development setup
- Code guidelines and constraints
- Testing requirements

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

### Current Priorities
- Bug fixes for Bitcoin logic
- Test coverage improvements
- Documentation enhancements
- UI/UX improvements
- Independent security reviews

---

## 📜 License

Released under the **MIT License** - see [LICENSE](./LICENSE). You are free
to use, modify, distribute, and self-host. If you ship a modified version,
please clearly distinguish it from the official Bitcoin Will project so
users are not misled.

---

## 🙏 Acknowledgments

- Built with [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib)
- Inspired by the Bitcoin community's commitment to self-custody
- Thanks to all reviewers, auditors, and community contributors

---

<p align="center">
  <strong>Remember:</strong> This is financial software. Verify everything, test thoroughly, and stay sovereign.
</p>
