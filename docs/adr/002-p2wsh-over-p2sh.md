# ADR 002: P2WSH over P2SH for Script Hashes

## Status
Accepted

## Context

The Bitcoin script needs to be hashed into an address. There are two standard options:

1. **P2SH (Pay-to-Script-Hash)** - Legacy, uses base58 addresses
2. **P2WSH (Pay-to-Witness-Script-Hash)** - SegWit, uses bech32 addresses

We needed to decide which address type to generate for the vault.

## Decision

We will use **P2WSH (SegWit v0)** for all vault addresses.

## Consequences

### Positive

- **Lower fees:** SegWit transactions are smaller, saving on miner fees
- **Better error detection:** bech32 addresses have built-in checksum
- **Forward compatible:** Easier path to Taproot (SegWit v1) in the future
- **Industry standard:** Most modern wallets support P2WSH
- **Script size:** Witness scripts can be larger than P2SH scripts

### Negative

- **Compatibility:** Very old wallets may not support bech32 addresses
- **Address length:** bech32 addresses are longer than base58

## Alternatives Considered

### 1. P2SH (Legacy)
**Rejected:** Higher fees, legacy technology, harder to transition to Taproot later

### 2. P2TR (Taproot/SegWit v1)
**Postponed:** Excellent for privacy (hides script until spent) but more complex implementation. Planned for v2.0.

### 3. Support both P2SH and P2WSH
**Rejected:** Unnecessary complexity for MVP. Users should use modern wallets.

## Implementation Notes

- Using `bitcoinjs-lib` payments.p2wsh() for address generation
- Addresses start with `tb1q` (testnet) or `bc1q` (mainnet)
- Witness script required for spending (provided in Recovery Kit)

## Related

- PROTOCOL.md: Script construction details
- TODO.md: Taproot planned for v2.0
