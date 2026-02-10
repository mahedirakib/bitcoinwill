# ADR 003: CSV Relative Timelock over CLTV

## Status
Accepted

## Context

The TIP inheritance pattern requires choosing between two Bitcoin timelock mechanisms:

1. **CLTV (OP_CHECKLOCKTIMEVERIFY)** - Absolute timelock to specific block height/time
2. **CSV (OP_CHECKSEQUENCEVERIFY)** - Relative timelock from confirmation

We needed to decide which better serves the "Dead Man's Switch" use case.

## Decision

We will use **CSV (OP_CHECKSEQUENCEVERIFY)** for relative timelocks.

## Consequences

### Positive

- **Resets automatically:** Timer resets when owner moves funds
- **No expiration:** Works indefinitely as long as owner stays active
- **Flexible:** Owner doesn't need to predict when they'll become incapacitated
- **Simple model:** "Active = reset, inactive = claimable"

### Negative

- **Harder to estimate:** Beneficiary can't predict exact claim date
- **Requires monitoring:** Heir must check blockchain, not just calendar
- **Complex calculation:** Must track from last transaction, not fixed date

## Alternatives Considered

### 1. CLTV (Absolute Timelock)
**Rejected:** Would require owner to predict when they might die. If they're still active at that date, they'd need to recreate the vault.

### 2. Combination (CSV for owner refresh, CLTV for maximum)
**Rejected:** Overly complex for MVP. Would confuse users.

### 3. No timelock (immediate inheritance)
**Rejected:** Would allow beneficiary to steal funds anytime.

## Use Case Example

**Owner sets 6-month CSV delay:**
- Month 0: Owner funds vault (timer starts)
- Month 2: Owner moves funds (timer resets to 0)
- Month 5: Owner moves funds again (timer resets)
- Month 8: Owner incapacitated (no more resets)
- Month 14: Heir can claim (6 months after last activity)

## Implementation

```
OP_ELSE
    <locktime_blocks> OP_CHECKSEQUENCEVERIFY OP_DROP
    <beneficiary_pubkey> OP_CHECKSIG
OP_ENDIF
```

## Related

- PROTOCOL.md: Full script specification
- whitepaper.md: Why relative timelocks fit inheritance
