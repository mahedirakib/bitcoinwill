# TimeLock Inheritance Protocol (TIP): Protocol v1

## 1. Overview
The TimeLock Inheritance Protocol (TIP) solves "non-custodial inheritance" without requiring a trusted third party, a complex legal structure, or a specialized smart contract chain. It uses Bitcoin's native script primitives to create a delayed recovery path. Bitcoin Will is a reference implementation of this protocol.

## 2. Technical Construction

### 2.1 P2WSH (SegWit v0) — default

The application generates a **P2WSH (Pay-to-Witness-Script-Hash)** address based on the following Miniscript-compatible logic:

```
OP_IF
    <owner_pubkey> OP_CHECKSIG
OP_ELSE
    <locktime_blocks> OP_CHECKSEQUENCEVERIFY OP_DROP
    <beneficiary_pubkey> OP_CHECKSIG
OP_ENDIF
```

- **Path A (Owner):** Requires a signature from the Owner and the boolean `1`. This path is spendable immediately and at any time.
- **Path B (Beneficiary):** Requires a signature from the Beneficiary and the boolean `0`. This path is only spendable once the `relative locktime` (CSV) has passed since the funding UTXO was confirmed.

### 2.2 P2TR (Taproot) — optional

When Taproot is selected, the same owner-immediate / beneficiary-after-CSV policy is compiled as a **Taproot script path** with a BIP341 NUMS internal key (key-path spend disabled for the vault policy). Pubkeys in the tapscript are **x-only** (32-byte) to avoid BIP342 unknown-key footguns. Full details live in `src/lib/bitcoin/taproot.ts`.

## 3. Security Model
- **Stateless (Server-Side):** The application does not store keys, scripts, or personal data on any server. The client may cache drafts or an optional vault list in browser storage.
- **Client-Side:** All math and address derivation happen in the user's browser.
- **Deterministic:** The same inputs (keys + locktime + address type) will always produce the same Vault Address and Script.
- **Non-Custodial:** Standard vaults require only public keys. No server ever holds keys or funds. Optional social recovery (SSS) generates a beneficiary private key **in the browser only** so it can be split into shares; that material is never uploaded.

## 4. Limitations & Risks
- **No Inactivity Monitoring:** The protocol cannot "know" if the owner is alive. The beneficiary must manually monitor the vault and attempt a claim once the delay expires.
- **No Legal Force:** This is a technical spending plan. It does not replace a legal will in any jurisdiction.
- **Fixed Delay:** The delay is hardcoded into the script at the moment of creation. To change the delay, funds must be moved to a new Vault Address.
- **Key Loss:** If the Owner loses their private key, the funds can only be recovered by the Beneficiary after the delay. If both lose their keys (and any SSS shares), the funds are lost.
- **External signing:** This reference app builds addresses and kits; constructing and signing spends is typically done in an external wallet (e.g. Sparrow).

## 5. Implemented extensions (reference app)
- **Taproot (P2TR)** script-path vaults (see §2.2).
- **Social recovery:** Shamir Secret Sharing over an app-generated beneficiary key (threshold schemes such as 2-of-3 / 3-of-5).
- **Hardware wallet pubkey import:** Ledger / Trezor for providing compressed pubkeys (not for in-app signing of vault spends).
- **Explorer helpers:** Balance/status checks and raw-tx broadcast via public Esplora APIs.

## 6. Reference app tooling
- **Unsigned PSBT templates:** Owner, beneficiary, and check-in paths can be exported as base64 PSBTs for external signing (Sparrow, etc.). Signing remains out of band.

## 7. Future Scope
- **Multi-sig Paths:** Requiring M-of-N signatures for the recovery path (beyond SSS over a single key).
- **Additional hardware:** Coldcard / QR air-gap flows.
