# Security Policy & Threat Model

## 🛡️ Our Philosophy
Bitcoin Will is designed as a **stateless, client-side utility**. 
- **Non-Custodial:** We never touch your private keys.
- **Privacy-First:** We never store your public keys or plan data on any server.
- **Open Source:** Every line of code is auditable.

## 🕵️ Threat Model

### 1. Phishing / Fake Domains
**Risk:** An attacker hosts a copy of this site that steals your public keys or provides a malicious Vault Address.
**Mitigation:** Always verify the domain name. This app is designed to be run locally; you can download the source and open `index.html` on an offline machine for maximum safety.

### 2. Clipboard Malware
**Risk:** Malicious software on your computer swaps the Vault Address when you copy it.
**Mitigation:** Always verify the address on your hardware wallet or a second device before sending funds.

### 3. User Error (The Biggest Risk)
**Risk:** You lose your private keys or the Recovery Kit JSON.
**Mitigation:** 
- **Backup the Kit:** Store the Recovery Kit JSON in multiple physical locations (encrypted USBs).
- **Test First:** Always test the full flow (creation and recovery) with a tiny amount of Testnet Bitcoin before using real funds.

### 4. Supply Chain Risk
**Risk:** A dependency used by this app is compromised.
**Mitigation:** We keep dependencies to a absolute minimum. The core Bitcoin logic is handled by `bitcoinjs-lib`, a industry standard.

## 🔒 Safety Recommendations
- Use a clean browser without untrusted extensions.
- Print the **Beneficiary Instructions** and store them with your physical estate documents.
- Use a hardware wallet to manage your keys.

## 🚩 Reporting a Security Issue
If you find a vulnerability, please report it to: `security@bitcoinwill.app`
