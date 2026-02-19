# AI Agent Development Guide

This guide helps AI agents work effectively with the Bitcoin Will codebase.

## Quick Start

```bash
# Verify your changes before finishing
npm run ready-check  # Runs lint + tests + build

# Run just tests
npm run test

# Check TypeScript
npx tsc --noEmit
```

## Architecture Overview

Bitcoin Will is a **100% client-side React app** implementing the TimeLock Inheritance Protocol (TIP).

```
User → React UI → Bitcoin Logic → bitcoinjs-lib
```

### Directory Structure

```
src/
├── features/           # Feature modules (isolated)
│   ├── will-creator/   # 4-step wizard for creating vaults
│   └── recovery/       # Recovery kit loading & tools
├── lib/bitcoin/        # Core Bitcoin logic
│   ├── planEngine.ts   # Script generation
│   ├── validation.ts   # Input validation
│   ├── explorer.ts     # Blockchain API
│   └── *.test.ts       # Co-located tests
├── components/         # Shared UI components
├── pages/              # Route components (thin wrappers)
└── state/              # Global settings
```

**Key Rule:** Features are isolated. A feature imports from `lib/` or shared `components/`, but features don't import from each other.

## Code Patterns

### 1. Creating a Component

```typescript
// src/features/recovery/components/MyPanel.tsx
import { SomeIcon } from 'lucide-react';
import type { MyPanelProps } from '../types';

export const MyPanel = ({ model, onAction }: MyPanelProps) => {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">
        <SomeIcon className="w-5 h-5" /> Title
      </h2>
      {/* Content */}
    </section>
  );
};
```

**Always:**
- Use named exports (`export const`, not `export default`)
- Define props interface in `types.ts`
- Use Tailwind classes from existing patterns
- Add `type="button"` to all buttons

### 2. Creating a Hook

```typescript
// src/features/recovery/hooks/useMyFeature.ts
import { useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';

interface UseMyFeatureReturn {
  data: string | null;
  isLoading: boolean;
  doAction: () => Promise<void>;
}

export const useMyFeature = (): UseMyFeatureReturn => {
  const { showToast } = useToast();
  const [data, setData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const doAction = useCallback(async () => {
    setIsLoading(true);
    try {
      // Logic here
      showToast('Success');
    } catch (error) {
      showToast((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  return { data, isLoading, doAction };
};
```

### 3. Adding Tests

```typescript
// src/lib/bitcoin/myModule.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './myModule';

describe('myFunction', () => {
  it('should handle valid input', () => {
    const result = myFunction('valid');
    expect(result).toBeDefined();
  });

  it('should throw on invalid input', () => {
    expect(() => myFunction('invalid')).toThrow();
  });
});
```

**Always:**
- Co-locate tests with source files
- Test both success and failure cases
- Use descriptive test names

### 4. Exporting from a Feature

```typescript
// src/features/recovery/index.ts
export * from './types';
export * from './hooks/useMyHook';
export * from './components/MyComponent';
export { default as RecoveryPage } from './RecoveryPage';
```

## Constraints (Never Violate)

### ❌ Hard Blocks

1. **No backend code** - This is client-side only
   - No Express, Fastify, etc.
   - No database connections
   - No server-side APIs

2. **No new dependencies** without explicit approval
   - Check `package.json` for existing libraries first
   - Prefer native browser APIs

3. **Never suppress TypeScript errors**
   - No `@ts-ignore`, `@ts-expect-error`, `as any`
   - Fix the root cause instead

4. **No default exports** (except for page components)
   - Use named exports: `export const MyComponent`
   - Better for IDE autocomplete and tree-shaking

5. **Never commit private keys**
   - Not even for testing
   - Use test fixtures with fake data

### ✅ Required Patterns

1. **Type everything**
   ```typescript
   // Good
   const [count, setCount] = useState<number>(0);
   
   // Bad
   const [count, setCount] = useState(0); // inferred is okay, explicit is better
   ```

2. **Use path aliases**
   ```typescript
   // Good
   import { useToast } from '@/components/Toast';
   
   // Bad
   import { useToast } from '../../../components/Toast';
   ```

3. **Handle all errors**
   ```typescript
   try {
     await riskyOperation();
   } catch (error) {
     showToast((error as Error).message);
   }
   ```

## Bitcoin-Specific Guidelines

### Working with Bitcoin Data

```typescript
// Public keys are strings (hex, 66 chars for compressed)
const pubkey = '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';

// Addresses are validated before use
import { validatePubkey } from '@/lib/bitcoin/validation';

// Networks: 'mainnet' | 'testnet' | 'regtest'
import type { BitcoinNetwork } from '@/lib/bitcoin/types';
```

### Never Do

```typescript
// ❌ Never store private keys
const privateKey = 'L1aW4aubDFB7yfras2S1mN3MCqJQaK9dNt7';

// ❌ Never trust user input without validation
const address = userInput; // Validate first!

// ❌ Never hardcode mainnet without warnings
if (network === 'mainnet') { // Must have user confirmation
```

## Testing Guidelines

### Run Tests

```bash
# All tests
npm run test

# Specific file
npm run test -- src/lib/bitcoin/planEngine.test.ts

# With coverage
npm run test -- --coverage
```

### Test File Organization

- Co-locate with source: `planEngine.ts` → `planEngine.test.ts`
- Group related tests with `describe` blocks
- Use clear, descriptive test names

### Testing Bitcoin Logic

```typescript
import { describe, it, expect } from 'vitest';
import { buildPlan } from './planEngine';

describe('buildPlan', () => {
  it('should generate valid P2WSH address for testnet', () => {
    const result = buildPlan({
      network: 'testnet',
      inheritance_type: 'timelock_recovery',
      owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
      beneficiary_pubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
      locktime_blocks: 144,
    });

    expect(result.address).toMatch(/^tb1/); // Testnet address prefix
    expect(result.descriptor).toContain('wsh');
  });
});
```

## Troubleshooting

### Build Fails

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Type Errors

```bash
# Check all files
npx tsc --noEmit

# Check specific file
npx tsc --noEmit src/features/recovery/MyComponent.tsx
```

### Test Failures

```bash
# Run in watch mode to debug
npm run test -- --watch

# Run specific test
npm run test -- --reporter=verbose src/lib/bitcoin/myTest.test.ts
```

## Common Tasks

### Adding a New Wizard Step

1. Create component in `src/features/will-creator/steps/MyStep.tsx`
2. Add step type to `types.ts`
3. Add state handling in `will-creator/types.ts`
4. Wire up in `WillCreatorWizard.tsx`

### Adding a New Bitcoin Utility

1. Create file in `src/lib/bitcoin/myUtil.ts`
2. Export functions with explicit types
3. Create `myUtil.test.ts` with comprehensive tests
4. Export from `lib/bitcoin/` if needed

### Adding a Shared Component

1. Create in `src/components/MyComponent.tsx`
2. Use named export
3. Follow existing styling patterns
4. Add to `components/index.ts` if creating one

## Documentation References

- [Architecture](./docs/ARCHITECTURE.md) - System design
- [Contributing](./CONTRIBUTING.md) - Contribution guidelines
- [Testing](./TESTING.md) - Testing patterns
- [Protocol](./PROTOCOL.md) - Bitcoin protocol details
- [API Reference](./src/lib/bitcoin/README.md) - Bitcoin module docs

## Quick Checklist

Before finishing any task:

- [ ] `npm run ready-check` passes
- [ ] No `@ts-ignore` or `as any` suppressions
- [ ] Named exports used (not default)
- [ ] Types are explicit
- [ ] Tests added for logic changes
- [ ] No private keys in code
- [ ] Error handling in place

---

**Remember:** This is financial software. Users trust it with Bitcoin inheritance. Be conservative with changes, thorough with testing, and clear with documentation.
