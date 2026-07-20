# Security Policy & Threat Model

## Our Philosophy

Bitcoin Will is designed as a **stateless, client-side utility**.
- **Non-Custodial:** No server ever holds your keys or funds. Standard vault creation uses only public keys you provide.
- **Social recovery exception:** Optional Shamir (SSS) mode generates a beneficiary private key in the browser so it can be split into shares. That key stays on your device unless you export it; it is never uploaded.
- **Privacy-First:** We never store your public keys or plan data on any server. Optional vault list data may live in browser localStorage only.
- **Open Source:** The entire codebase is public under the MIT license. Anyone can read, audit, and self-host it. There is no hidden code.

> **Open source is a security feature, not a bug.** If you cannot read the code that touches your Bitcoin inheritance, you cannot trust it.

## Supported Versions

We provide security fixes for the latest published release on `main`. Older
releases are supported on a best-effort basis. See [Releases](../../releases)
for the current version.

| Version | Supported |
|---------|-----------|
| latest `main` release | Yes |
| older releases | Best effort |
| development branches | No |

## Reporting a Vulnerability

**Please do NOT open a public issue for security vulnerabilities.**

Instead, use one of these private channels:

1. **GitHub Security Advisories (preferred):**
   Go to [Security > Report a vulnerability](../../security/advisories/new)
   on the repository and submit a private report. This is encrypted and
   visible only to maintainers.
2. **Direct contact:** If you cannot use GitHub Advisories, contact a
   maintainer via the contact channels listed on their GitHub profile and
   request a PGP key for encrypted communication.

Please include:
- Description of the vulnerability and its impact
- Steps to reproduce (code, input, or a minimal repro)
- Affected versions / commits
- Suggested fix (optional but appreciated)

### Response Targets

- **Acknowledgement:** within 72 hours
- **Initial assessment:** within 7 days
- **Fix or mitigation:** depends on severity; we will coordinate a disclosure
  timeline with you
- **Credit:** Reporters are credited in the release that ships the fix, unless
  they prefer to remain anonymous

Please give us reasonable time to fix and deploy before any public disclosure.

## Threat Model

### 1. Phishing / Fake Domains / Malicious Forks
**Risk:** An attacker hosts a modified copy of this app (now trivial since the
code is open source) that silently swaps the Vault Address, leaks public keys,
or presents a malicious Recovery Kit.

**Mitigation:**
- Only run builds from the official domain or from a commit you have reviewed
  yourself.
- Verify the build integrity against official release signatures when provided.
- For maximum safety, download the source, review it, and run it on an
  offline machine by opening the built `index.html`.
- **Treat any fork that is not this repository as untrusted by default.**

### 2. Clipboard Malware
**Risk:** Malicious software on your computer swaps the Vault Address when you
copy it.
**Mitigation:** Always verify the address on your hardware wallet or a second
device before sending funds. Compare several characters at the start, middle,
and end of the address.

### 3. User Error (The Biggest Risk)
**Risk:** You lose your private keys or the Recovery Kit JSON.
**Mitigation:**
- **Backup the Kit:** Store the Recovery Kit JSON in multiple physical
  locations (encrypted USBs).
- **Test First:** Always test the full flow (creation and recovery) with a
  tiny amount of Testnet Bitcoin before using real funds.
- **Beneficiary rehearsal:** Walk your beneficiary through the recovery
  process while you are still available to answer questions.

### 4. Supply Chain Risk
**Risk:** A dependency used by this app is compromised.
**Mitigation:**
- We keep dependencies to an absolute minimum. The core Bitcoin logic is
  handled by `bitcoinjs-lib`, an industry standard.
- Lockfile (`package-lock.json`) is committed and reviewed on every change.
- Contributors must justify any new dependency before it is merged.

### 5. Compromised Build / Reviewer
**Risk:** Malicious code is merged into `main` under the guise of a fix or
feature.
**Mitigation:**
- All changes require pull-request review.
- Maintain awareness of reviewer credentials; revoke access for inactive
  maintainers.
- Prefer running from a tagged release you have inspected rather than from
  `main` HEAD for high-value use.

## Safety Recommendations

- Use a clean browser without untrusted extensions.
- Print the **Beneficiary Instructions** and store them with your physical
  estate documents.
- Use a hardware wallet to manage your keys.
- Never paste owner or long-term private keys into any web app. Standard
  vaults only need public keys. If you use social recovery, treat the
  generated beneficiary key and shares like cash—export offline, then clear
  them from the browser session.

## What This App Does NOT Protect Against

- A compromised operating system or browser on your machine.
- A malicious hardware-wallet firmware.
- Loss of your private keys or Recovery Kit (that is your responsibility).
- Social engineering targeting you or your beneficiary.

## Dependency Hardening (not a formal crypto audit)

- See [`docs/SECURITY_AUDIT_2026-02-17.md`](./docs/SECURITY_AUDIT_2026-02-17.md)
  for npm audit, package-signature, and CI supply-chain checks from the
  `v1.0.0` hardening pass. That report is **dependency/tooling hardening**,
  not an independent review of BIP341 scripts or the full threat model.

Independent script and cryptography reviews from the community are welcome.
If you publish a review, open an issue or PR referencing it and we will link
it here.
