# TimeLock Inheritance Protocol (TIP) Whitepaper v1

## Abstract
The secure inheritance of Bitcoin remains one of the hardest unsolved problems in self-custody. Existing options often force trade-offs between security, privacy, and usability. The TimeLock Inheritance Protocol (TIP) defines a non-custodial, Bitcoin-native pattern for inheritance planning by combining immediate owner control with a delayed beneficiary recovery path enforced by consensus rules.

## Scope
This whitepaper specifies TIP as a protocol pattern, not a company product. Any wallet, tool, or workflow can implement TIP if it follows the script and operational assumptions described here.

## Problem Statement
If a Bitcoin holder dies or becomes permanently incapacitated without a recoverable plan, funds may be lost forever. Common alternatives have major weaknesses:
1. **Custodial Services:** Require trust in a third party that can fail, be compromised, or censor access.
2. **Key Sharing:** Increases theft risk during the owner's lifetime.
3. **Complex Multi-sig Setups:** Can be too difficult for non-technical heirs to execute correctly.

## Protocol Goals
TIP is designed around these goals:
- **Non-custodial:** No third party needs private keys.
- **Bitcoin-native:** Uses existing script primitives, no sidechain or token required.
- **Deterministic:** Given the same inputs, outputs should be reproducible and auditable.
- **Composable:** Can be implemented by different applications and operational workflows.
- **Service-independent:** Recovery remains possible even if a specific implementation disappears.

## Technical Construction
TIP defines two spending paths in one script:
1. **Owner Path (Immediate):** Spendable at any time by the owner key.
2. **Beneficiary Path (Delayed):** Spendable by the beneficiary key only after a relative timelock expires.

Canonical structure:
- `OP_IF <owner_pubkey> OP_CHECKSIG`
- `OP_ELSE <locktime_blocks> OP_CHECKSEQUENCEVERIFY OP_DROP <beneficiary_pubkey> OP_CHECKSIG`
- `OP_ENDIF`

TIP implementations commonly use P2WSH outputs, though future variants may use Taproot-compatible constructions.

## Operational Model
- **Funding:** The user funds the TIP output address.
- **Normal owner control:** The owner can move funds immediately through the owner path.
- **Delayed recovery:** If funds remain unmoved and delay conditions are satisfied, the beneficiary path becomes valid.
- **Instruction handoff:** The owner must provide heirs with clear recovery instructions and required metadata.

## Security and Trust Assumptions
TIP reduces reliance on intermediaries, but it does not remove all risk.

What TIP helps mitigate:
- Owner incapacitation without immediate key handover
- Dependence on an always-online service
- Centralized data collection of inheritance plans

What TIP does not mitigate:
- Immediate theft of the owner private key
- Poor backup hygiene or lost recovery instructions
- Coercion, legal disputes, or social engineering

## Reference Implementation (Non-Normative)
Bitcoin Will is a stateless, client-side reference implementation of TIP. It provides a UI and tooling to generate TIP-compatible plans, scripts, and recovery artifacts. Bitcoin Will is one implementation, not the protocol itself.

## User Responsibilities
- Test with small amounts before committing meaningful funds.
- Validate locktime parameters and script outputs independently.
- Ensure heirs know where recovery instructions are stored and how to use them.
- Coordinate technical plans with legal estate planning in the user's jurisdiction.

## Disclaimers
- **Not Legal Advice:** TIP is a technical protocol pattern, not a legal testament.
- **Not Financial Advice:** Users are responsible for their own risk decisions.
- **Experimental Risk:** Misconfiguration can delay access or permanently lock funds.

## Conclusion
TIP provides a minimal, sovereign inheritance pattern using native Bitcoin rules. By separating protocol from implementation, TIP can be audited, reused, and adopted across tools while preserving the non-custodial principles required for self-custody inheritance.
