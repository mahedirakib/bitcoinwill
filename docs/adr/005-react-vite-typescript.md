# ADR 005: React + Vite + TypeScript Stack

## Status
Accepted

## Context

We needed to choose a frontend stack for the Bitcoin Will TIP implementation that balances:
- Developer productivity
- Performance
- Type safety (critical for Bitcoin logic)
- Bundle size
- Maintainability

## Decision

We will use:

- **Framework:** React 18 (functional components, hooks)
- **Build Tool:** Vite (fast dev server, optimized builds)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Testing:** Vitest

## Consequences

### Positive

- **Type safety:** Prevents entire classes of bugs in Bitcoin logic
- **Fast development:** Vite HMR is nearly instant
- **Small bundles:** Tree-shaking and code splitting work well
- **Great DX:** Excellent IDE support with TypeScript
- **Ecosystem:** Large React library ecosystem

### Negative

- **Learning curve:** Contributors must know React + TypeScript
- **Bundle size:** React adds ~40KB (acceptable for our use case)
- **Build complexity:** More tooling than vanilla JS

## Alternatives Considered

### 1. Vanilla JavaScript
**Rejected:** No type safety, harder to maintain, error-prone for Bitcoin logic

### 2. Vue.js
**Considered:** Good framework, but React has larger ecosystem for Bitcoin projects

### 3. Svelte
**Considered:** Smaller bundles, but less mature Bitcoin library integration

### 4. Next.js
**Rejected:** Requires backend (Node.js). We need pure static output.

### 5. Webpack instead of Vite
**Rejected:** Vite is faster and simpler for our needs

## Why TypeScript is Critical

For Bitcoin applications, TypeScript provides:

1. **Compile-time validation:** Catch type errors before runtime
2. **Interface definitions:** Clear contracts between modules
3. **IDE support:** Autocomplete, inline documentation
4. **Refactoring safety:** Rename symbols with confidence

Example of what TypeScript catches:
```typescript
// This would fail at compile time
const plan: PlanInput = {
  network: 'invalid_network', // Error: Type '"invalid_network"' not assignable
  // ...
}
```

## Build Configuration

- **Target:** ES2020
- **Module:** ESNext
- **Strict:** Enabled (noImplicitAny, strictNullChecks, etc.)
- **Output:** Static files in `dist/`

## Related

- package.json: Exact dependency versions
- tsconfig.json: TypeScript configuration
- CONTRIBUTING.md: Development setup
