<p align="center">
  <img src="src/assets/logo.png" width="200" alt="Bitcoin Will Logo">
</p>

<h1 align="center">Bitcoin Will 🔐</h1>

<p align="center">
  A minimal, privacy-first reference implementation of the TimeLock Inheritance Protocol (TIP) for non-custodial Bitcoin inheritance spending plans.
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/status-stable-success" alt="Status">
  <img src="https://img.shields.io/badge/tests-197%20passing-brightgreen" alt="Tests">
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
- **Owner check-in helper** to track CSV timer
- **Transaction broadcast** helper for beneficiaries
- **Print-friendly** beneficiary instructions

### Security & Privacy
- **100% client-side** - No server, no database, no accounts
- **No private keys** - Only public keys handled
- **Works offline** - Air-gap compatible
- **Open source** - Fully auditable code

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
git clone https://github.com/mahedirakib/bitcoinwill.git
cd bitcoinwill

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
- **[Contributing](./CONTRIBUTING.md)** - How to contribute code
- **[Testing](./TESTING.md)** - Testing strategy and patterns
- **[AGENTS.md](./AGENTS.md)** - Guide for AI agents working on this codebase ⭐

### Technical Reference
- **[TIP Whitepaper](./whitepaper.md)** - Protocol scope, threat model, and assumptions
- **[Protocol Specification](./PROTOCOL.md)** - TIP script and implementation details
- **[Security Policy](./SECURITY.md)** - Threat model and safety tips
- **[Security Audit](./docs/SECURITY_AUDIT_2026-02-17.md)** - Third-party audit results
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

- **Stateless:** No server stores your data
- **Private keys:** Never touch the application
- **Deterministic:** Same inputs always produce same outputs
- **Audited:** Third-party security audit completed

Report security issues via GitHub private vulnerability reporting.

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Development setup
- Code guidelines
- Testing requirements
- Pull request process

### What We're Looking For
- Bug fixes for Bitcoin logic
- Test coverage improvements
- Documentation enhancements
- UI/UX improvements

---

## 📜 License

MIT License - See [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

- Built with [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib)
- Inspired by the Bitcoin community's commitment to self-custody
- Thanks to all contributors and auditors

---

<p align="center">
  <strong>Remember:</strong> This is financial software. Verify everything, test thoroughly, and stay sovereign.
</p>
