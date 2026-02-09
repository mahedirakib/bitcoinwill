# ADR 001: Use Stateless Client-Side Architecture

## Status
Accepted

## Context

Bitcoin Will handles sensitive financial information and Bitcoin key material. We needed to decide on the fundamental architecture of the application.

**Key concerns:**
- Users' public keys must not be leaked
- No trusted third party should be required
- The tool should work even if our servers go offline
- Privacy is paramount

## Decision

We will build a **completely stateless, client-side only application** with:

- No backend server
- No database
- No user accounts
- No data persistence on our infrastructure
- All computation happens in the user's browser

## Consequences

### Positive

- **Maximum privacy:** No data ever leaves the user's device
- **No counterparty risk:** We cannot steal, lose, or leak user data
- **Longevity:** Works forever even if we disappear
- **Trust minimized:** Users can audit all code client-side
- **Air-gappable:** Can run on offline computers

### Negative

- **No data sync:** Users must manage their own backups (Recovery Kit)
- **No "cloud" convenience:** Cannot access plans from multiple devices
- **Browser storage only:** LocalStorage limited (we don't use it for sensitive data)

## Alternatives Considered

### 1. Server-Side Generation
**Rejected:** Would require users to trust us with their public keys

### 2. Encrypted Cloud Storage
**Rejected:** Still requires server infrastructure and accounts

### 3. Hybrid (Server for convenience, client for generation)
**Rejected:** Complicates architecture, adds unnecessary server costs

## Related

- ADR 004: No Backend or Database
- SECURITY.md: Threat model discussion
- PROTOCOL.md: Why stateless matters for inheritance
