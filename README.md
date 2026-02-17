<p align="center">
  <img src="src/assets/logo.png" width="200" alt="Bitcoin Will Logo">
</p>

# Bitcoin Will 🔐

A minimal, privacy-first reference implementation of the TimeLock Inheritance Protocol (TIP) for non-custodial Bitcoin inheritance spending plans.

## Status: Stable Release (v1.0.0)
This project is now a **production-ready static release** for TIP planning and recovery operations. It includes live explorer balance checks, transaction broadcast helpers, Mainnet safety locks, and comprehensive validation tests. Always verify scripts and practice with small amounts before high-value Mainnet usage.

## What is this?
Bitcoin Will is a **stateless, client-side utility** that implements the TimeLock Inheritance Protocol (TIP). It helps you create a Bitcoin "Dead Man's Switch" by generating a unique Vault Address with a built-in rule: you can spend funds at any time, but if funds remain unmoved for a specified delay, a beneficiary can claim them using their own key.

## Why this exists
Inheritance in the Bitcoin space is often either too complex (multisig setups) or too centralized (custodians). TIP defines a Bitcoin-native protocol pattern, and Bitcoin Will provides a practical implementation that is:
1. **Easy to understand:** No complex smart contract logic.
2. **Easy to backup:** A single JSON file (the Recovery Kit) contains everything needed.
3. **Sovereign:** No accounts, no servers, no middleman.

## Who is this for?
- **Sovereign Individuals:** Those who want a simple, math-based recovery plan.
- **Privacy Advocates:** Users who refuse to provide KYC or email addresses for security tools.
- **Bitcoin Educators:** A practical way to see Bitcoin scripts in action.

## Who is this NOT for?
- **Legal Advice:** This is not a legal will. It does not replace estate laws in your jurisdiction.
- **Active Monitoring:** The app provides manual explorer checks, but it does not auto-monitor or alert your beneficiary.
- **Key Loss Protection:** If you lose both your private keys AND your Recovery Kit, funds are gone.

## How to try it safely
1. **Use Testnet:** The app defaults to Testnet. Use a testnet faucet to get "fake" coins.
2. **Verify the Address:** Check the generated Vault Address in a blockchain explorer.
3. **Simulate Recovery:** Wait for the delay to pass and use an advanced wallet to attempt a claim.
4. **Offline Use:** For maximum safety, you can download this repository and run it on an air-gapped machine.

## Documentation
- [Learning Center](./docs/LEARNING.md) - Concepts for beginners.
- [TIP Whitepaper](./whitepaper.md) - Protocol scope, threat model, and assumptions.
- [Protocol Specification](./PROTOCOL.md) - TIP script and implementation details.
- [Security Policy](./SECURITY.md) - Threat model and safety tips.
- [Security Audit Report](./docs/SECURITY_AUDIT_2026-02-17.md) - Third-party tooling and hardening results.
- [API Reference](./src/lib/bitcoin/README.md) - Bitcoin module documentation.
- [Testing Guide](./TESTING.md) - How to run and write tests.
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions.

## Tech Stack
- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS (Bitcoin Orange Theme)
- **Logic:** `bitcoinjs-lib` for script and address derivation.
- **Hosting:** 100% static (No backend, no database).

## Getting Started
```bash
npm install
npm run dev
```

## License
MIT
