# ADR 004: No Backend or Database

## Status
Accepted

## Context

As the client-side reference implementation of TIP, we needed to decide if any server components were necessary.

**Considerations:**
- User data sensitivity (public keys, inheritance plans)
- Cost of operation
- Maintenance burden
- Attack surface

## Decision

We will have **zero backend infrastructure:**

- No API servers
- No databases
- No authentication service
- No cloud functions
- Static hosting only (HTML/CSS/JS files)

## Consequences

### Positive

- **Zero server costs:** Can host on free static hosting (Cloudflare Pages, etc.)
- **No database to secure:** Can't have a data breach if there's no data
- **No maintenance:** No server updates, patching, monitoring
- **Censorship resistant:** Can be mirrored anywhere
- **Deterministic:** Same inputs always produce same outputs

### Negative

- **No analytics:** Can't see how users interact with the app
- **No error tracking:** Must rely on user reports
- **No "pro" features:** Can't offer accounts, sync, or cloud backup
- **No update notifications:** Users won't know about new versions automatically

## What We Do Instead

| Traditional Backend | Our Approach |
|-------------------|--------------|
| User accounts | No accounts needed |
| Data persistence | Recovery Kit JSON download |
| Analytics | None (privacy-preserving) |
| Error tracking | GitHub Issues |
| Updates | GitHub releases, changelog |

## Alternatives Considered

### 1. Minimal API for analytics
**Rejected:** Would compromise privacy promise. Analytics not essential.

### 2. Optional cloud backup
**Rejected:** Would require accounts, complicates UX.

### 3. Blockchain as database
**Partially used:** Recovery Kit can be stored as file, not on-chain.

## Hosting Strategy

Since we're fully static:

1. **Primary:** Cloudflare Pages (CDN, free, reliable)
2. **Mirror:** GitHub Pages (free, version-controlled)
3. **Offline:** User downloads repo, opens index.html

## Related

- ADR 001: Stateless Client-Side Architecture
- DEPLOYMENT.md: Static hosting instructions
