# Documentation Index

Welcome to the Bitcoin Will documentation. This page serves as a central hub to help you find the right documentation for your needs.

## 📚 Documentation by Role

### 👤 I'm a Bitcoin User

**New to Bitcoin Will?**
- [README](../README.md) - Project overview and quick start
- [Learning Center](./LEARNING.md) - Bitcoin inheritance concepts explained
- [Recovery Guide](./RECOVERY_GUIDE.md) - Step-by-step recovery instructions

**Having issues?**
- [Troubleshooting](./TROUBLESHOOTING.md) - Common problems and solutions
- [Glossary](./GLOSSARY.md) - Terminology definitions

**Want to understand the protocol?**
- [TIP Whitepaper](../whitepaper.md) - Protocol design and threat model
- [Protocol Specification](../PROTOCOL.md) - Technical details

### 👨‍💻 I'm a Developer

**Getting started with development:**
- [Contributing](../CONTRIBUTING.md) - Setup, guidelines, and PR process
- [Testing](../TESTING.md) - Testing strategy and how to write tests
- [Architecture](./ARCHITECTURE.md) - System design and code organization

**Working on Bitcoin logic:**
- [API Reference](../src/lib/bitcoin/README.md) - Bitcoin module documentation
- [Protocol Specification](../PROTOCOL.md) - TIP implementation details

**AI Agent?**
- [AGENTS.md](../AGENTS.md) - Specialized guide for AI agents ⭐

### 🔒 I'm a Security Researcher

- [Security Policy](../SECURITY.md) - Threat model and safety tips
- [Security Audit Report](./SECURITY_AUDIT_2026-02-17.md) - Third-party audit results
- [Protocol Specification](../PROTOCOL.md) - Bitcoin script details
- [ADR Index](./adr/README.md) - Architecture decisions with security implications

### 📦 I'm Deploying/Maintaining

- [Deployment Guide](../DEPLOYMENT.md) - How to deploy Bitcoin Will
- [Release Checklist](../RELEASE_CHECKLIST.md) - Steps for new releases
- [Changelog](../CHANGELOG.md) - Version history and changes

---

## 📖 All Documentation

### Core Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| [README](../README.md) | Project overview, quick start, features | Everyone |
| [AGENTS.md](../AGENTS.md) | AI agent development guide | AI Agents, Developers |
| [CONTRIBUTING](../CONTRIBUTING.md) | How to contribute code | Developers |
| [TESTING](../TESTING.md) | Testing strategy and patterns | Developers |

### User Guides

| Document | Description | Audience |
|----------|-------------|----------|
| [Learning Center](./LEARNING.md) | Bitcoin inheritance concepts | Users |
| [Recovery Guide](./RECOVERY_GUIDE.md) | Beneficiary instructions | Users |
| [Troubleshooting](./TROUBLESHOOTING.md) | Common issues and fixes | Users |
| [Glossary](./GLOSSARY.md) | Terminology definitions | Users |

### Technical Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| [Architecture](./ARCHITECTURE.md) | System design and data flow | Developers |
| [API Reference](../src/lib/bitcoin/README.md) | Bitcoin module docs | Developers |
| [Protocol Spec](../PROTOCOL.md) | TIP implementation details | Developers, Researchers |
| [Whitepaper](../whitepaper.md) | Academic protocol description | Researchers |

### Security Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| [Security Policy](../SECURITY.md) | Threat model and mitigations | Everyone |
| [Security Audit](./SECURITY_AUDIT_2026-02-17.md) | Third-party audit results | Researchers |
| [ADR Index](./adr/README.md) | Architecture decisions | Developers, Researchers |

### Project Management

| Document | Description | Audience |
|----------|-------------|----------|
| [Changelog](../CHANGELOG.md) | Version history | Everyone |
| [TODO](../TODO.md) | Future plans and roadmap | Contributors |
| [Deployment](../DEPLOYMENT.md) | Deployment instructions | Maintainers |
| [Release Checklist](../RELEASE_CHECKLIST.md) | Release process | Maintainers |

---

## 🗂️ Architecture Decision Records (ADRs)

Records of significant architectural decisions:

| ADR | Title | Status |
|-----|-------|--------|
| [001](./adr/001-stateless-client-side.md) | Use Stateless Client-Side Architecture | ✅ Accepted |
| [002](./adr/002-p2wsh-over-p2sh.md) | P2WSH over P2SH for Script Hashes | ✅ Accepted |
| [003](./adr/003-csv-relative-timelock.md) | CSV Relative Timelock over CLTV | ✅ Accepted |
| [004](./adr/004-no-backend.md) | No Backend or Database | ✅ Accepted |
| [005](./adr/005-react-vite-typescript.md) | React + Vite + TypeScript Stack | ✅ Accepted |

---

## 🔍 Quick Reference

### Common Tasks

**Creating a new vault:**
1. Go to the app
2. Select network (Testnet recommended for first time)
3. Enter owner and beneficiary public keys
4. Set locktime duration
5. Download Recovery Kit

**Recovering funds as a beneficiary:**
1. Open Recovery Kit JSON
2. Check vault status in block explorer
3. Wait for CSV delay to expire
4. Use wallet to spend with your key

See [Recovery Guide](./RECOVERY_GUIDE.md) for detailed steps.

**Contributing code:**
1. Fork and clone
2. `npm install`
3. `npm run dev`
4. Make changes
5. `npm run ready-check`
6. Submit PR

See [Contributing](../CONTRIBUTING.md) for details.

### Key Concepts

- **TIP**: TimeLock Inheritance Protocol - The Bitcoin script pattern
- **Vault**: A P2WSH/P2TR address with CSV timelock
- **Recovery Kit**: JSON file with all vault data
- **CSV**: OP_CHECKSEQUENCEVERIFY - Relative timelock opcode
- **P2WSH**: Pay-to-Witness-Script-Hash - Efficient SegWit address type

See [Glossary](./GLOSSARY.md) for full definitions.

---

## 💡 Documentation Tips

### For Users
- Start with [Learning Center](./LEARNING.md) if you're new to Bitcoin inheritance
- Keep [Troubleshooting](./TROUBLESHOOTING.md) bookmarked
- Always test with Testnet first

### For Developers
- Read [Architecture](./ARCHITECTURE.md) before making significant changes
- Check [AGENTS.md](../AGENTS.md) for code patterns and constraints
- Run `npm run ready-check` before submitting changes

### For Security Researchers
- Start with [Security Policy](../SECURITY.md)
- Review [Protocol Specification](../PROTOCOL.md) for script details
- Check ADRs for design rationale

---

## 📞 Getting Help

- **General questions:** Open a [GitHub Discussion](https://github.com/mahedirakib/bitcoinwill/discussions)
- **Bug reports:** [Open an Issue](https://github.com/mahedirakib/bitcoinwill/issues)
- **Security issues:** Use GitHub private vulnerability reporting (do not open public issues)

---

## 🔄 Documentation Updates

This documentation is continuously updated. Last major revision: 2026-02-18

To suggest documentation improvements:
1. Open an issue describing the improvement
2. Or submit a PR with your changes
3. Follow the [Contributing](../CONTRIBUTING.md) guidelines

---

<p align="center">
  <strong>Can't find what you need?</strong> Try the search function or open an issue.
</p>
