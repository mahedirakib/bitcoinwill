# Bitcoin Will: A Non-Custodial Bitcoin Inheritance Tool

## Abstract
The secure inheritance of Bitcoin remains one of the most significant challenges for self-custody. Traditional solutions often require a trade-off between privacy, security, and complexity. Bitcoin Will is a stateless, client-side tool designed to help users create standardized inheritance instructions using native Bitcoin scripts. By leveraging time-locked spending conditions, the tool enables a "dead man's switch" mechanism that allows heirs to recover funds after a predefined period in which vault funds remain unmoved, without ever requiring the user to surrender control of their private keys to a third party.

## Problem Statement
The primary strength of Bitcoin—absolute ownership through self-custody—is also its greatest weakness in the context of inheritance. If a Bitcoin owner dies or becomes permanently incapacitated without a clear recovery path, their assets are effectively lost forever. Existing solutions generally fall into three categories, each with significant drawbacks:
1. **Custodial Services:** Require trusting a third party with keys, introducing counterparty risk.
2. **Key Sharing:** Sharing seeds or shards with heirs or lawyers increases the risk of theft during the owner's lifetime.
3. **Complex Multi-sig:** Often too difficult for non-technical heirs to execute correctly, leading to permanent loss.

## Design Goals
Bitcoin Will is built upon the following core principles:
- **Non-custodial:** The tool never has access to the user's private keys. Users maintain 100% control over their funds.
- **Stateless:** The application does not store user data on any server. Session drafts may be cached in browser session storage for UX continuity.
- **Client-side only:** All logic and script generation happen locally in the user's browser or environment.
- **Privacy-first:** No personal information (PII) is collected, and no data is transmitted to an external backend.
- **Minimal Trust Assumptions:** The system relies on the Bitcoin network's consensus rules and time-lock primitives rather than a proprietary service.

## TimeLock Inheritance Protocol (TIP)
The TimeLock Inheritance Protocol (TIP) is a technical design pattern for the non-custodial transfer of UTXOs based on on-chain timelock enforcement and unmoved funds. It defines a standard method for constructing Bitcoin scripts that combine owner-controlled spending paths with time-locked beneficiary paths. Bitcoin Will serves as a client-side implementation of TIP, providing the interface and logic required to generate these protocol-compliant scripts.

## High-Level Protocol Overview
The protocol utilizes standard Bitcoin Scripting features to create conditional spending paths:
- **Time-Locked Scripts:** Leveraging `OP_CHECKSEQUENCEVERIFY` (CSV) to ensure that inheritance spending paths only become valid after a specific relative delay from funding confirmation.
- **User-Defined Conditions:** Users define the heir's public key and the required wait time (e.g., 6 months, 1 year).
- **Instruction Generation:** The tool produces a human-readable and machine-executable set of instructions (a "Will") that the user provides to their heirs.
- **Independence:** Once the "Will" is generated, it does not require the Bitcoin Will website or any server to remain online. The instructions are sufficient to recover funds using advanced wallets that support custom scripts/P2WSH or compatible CLI tools.

## Threat Model
### What this tool protects against:
- **Owner Incapacitation:** Funds become available to heirs after the owner is no longer able to "refresh" the time-lock.
- **Service Vanishing:** Because the tool is stateless and uses native scripts, the funds remain recoverable even if the Bitcoin Will project ceases to exist.
- **Privacy Leakage:** No centralized registry of wills or holdings is created.

### What this tool does NOT protect against:
- **Immediate Key Theft:** If an attacker steals the owner's primary keys, they can spend the funds before any inheritance conditions are met.
- **Loss of Instructions:** If the heirs lose the recovery instructions and the owner is gone, the funds may be unrecoverable through the inheritance path.
- **Coerced Disclosure:** The tool does not provide plausible deniability against forced disclosure of keys.

## User Responsibilities and Risks
Users are responsible for the secure storage of their generated recovery instructions. It is critical that heirs are aware of the existence of the "Will" and understand how to execute the recovery process. Experimental use of time-locks requires careful testing with small amounts before committing significant capital. Misconfiguration of scripts can lead to funds being locked for longer than intended or, in extreme cases, permanently.

## Disclaimers
- **Not Legal Advice:** This document and the associated software do not constitute a legal will or testament in any jurisdiction.
- **Not Financial Advice:** Users are responsible for their own financial decisions and the security of their Bitcoin.
- **Experimental Software:** This is a technical implementation of Bitcoin script patterns. Use at your own risk. The authors assume no liability for lost funds.

## Conclusion
Bitcoin Will aims to provide a minimal, robust, and sovereign way to manage Bitcoin inheritance. By removing the need for intermediaries and relying on the mathematical certainty of the Bitcoin protocol, users can ensure their legacy is preserved while maintaining the security of self-custody.
