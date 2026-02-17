# TimeLock Inheritance Protocol (TIP): Protocol v1

## 1. Overview
The TimeLock Inheritance Protocol (TIP) solves "non-custodial inheritance" without requiring a trusted third party, a complex legal structure, or a specialized smart contract chain. It uses Bitcoin's native script primitives to create a delayed recovery path. Bitcoin Will is a reference implementation of this protocol.

## 2. Technical Construction
The application generates a **P2WSH (Pay-to-Witness-Script-Hash)** SegWit address based on the following Miniscript-compatible logic:

### Script Logic
```
OP_IF
    <owner_pubkey> OP_CHECKSIG
OP_ELSE
    <locktime_blocks> OP_CHECKSEQUENCEVERIFY OP_DROP
    <beneficiary_pubkey> OP_CHECKSIG
OP_ENDIF
```

- **Path A (Owner):** Requires a signature from the Owner and the boolean `1`. This path is spendable immediately and at any time.
- **Path B (Beneficiary):** Requires a signature from the Beneficiary and the boolean `0`. This path is only spendable once the `relative locktime` (CSV) has passed since the funding transaction was confirmed.

## 3. Security Model
- **Stateless (Server-Side):** The application does not store keys, scripts, or personal data on any server. Session-only browser draft data may be cached locally by the client.
- **Client-Side:** All math and address derivation happen in the user's browser.
- **Deterministic:** The same inputs (keys + locktime) will always produce the same Vault Address and Script.
- **Non-Custodial:** The user never provides a private key to the application.

## 4. Limitations & Risks
- **No Inactivity Monitoring:** The protocol cannot "know" if the owner is alive. The beneficiary must manually monitor the vault and attempt a claim once the delay expires.
- **No Legal Force:** This is a technical spending plan. It does not replace a legal will in any jurisdiction.
- **Fixed Delay:** The delay is hardcoded into the script at the moment of creation. To change the delay, funds must be moved to a new Vault Address.
- **Key Loss:** If the Owner loses their private key, the funds can only be recovered by the Beneficiary after the delay. If both lose their keys, the funds are lost.

## 5. Future Scope (v2+)
- **Taproot (MAST):** To hide the spending conditions until the moment of claim.
- **Automated Check-in Transactions:** Wallet-assisted construction/signing beyond today's manual helper flow.
- **Multi-sig Paths:** Requiring M-of-N signatures for the recovery path.
- **Social Recovery:** Splitting the recovery key into fragments.
