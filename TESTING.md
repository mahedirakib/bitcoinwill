# Testing Guide

This document describes the testing strategy, test organization, and how to run tests for the Bitcoin Will project.

## Test Philosophy

We prioritize correctness and safety over coverage percentages. Every Bitcoin logic function must have comprehensive tests because bugs in Bitcoin scripts can lead to permanent loss of funds.

## Test Organization

Tests are co-located with source files in `src/lib/bitcoin/`:
- `planEngine.test.ts` - Core Bitcoin logic
- `validation.test.ts` - Input validation
- `instructions.test.ts` - Recovery kit generation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage

# Run specific file
npx vitest run src/lib/bitcoin/planEngine.test.ts
```

## Test Categories

### Bitcoin Logic Tests (Critical)

**planEngine.test.ts:**
- Valid plan generation
- P2WSH address format validation
- Descriptor format validation
- Script ASM format validation
- Deterministic output
- Multiple network support

**validation.test.ts:**
- Valid public key formats
- Invalid public key rejection
- Same owner/beneficiary key rejection
- Valid locktime ranges
- Edge cases

**instructions.test.ts:**
- Instruction model generation
- Time calculation accuracy
- Text instruction formatting

## Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { buildPlan } from './planEngine';

describe('buildPlan', () => {
  it('should generate valid P2WSH address for testnet', () => {
    const plan = buildPlan({
      network: 'testnet',
      inheritance_type: 'timelock_recovery',
      owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
      beneficiary_pubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
      locktime_blocks: 144
    });
    expect(plan.address).toMatch(/^tb1q/);
  });
});
```

## Coverage Goals

- Bitcoin logic: 100% coverage
- Validation: 100% coverage
- Instructions: 90%+ coverage
- UI components: 70%+ coverage

## Manual Testing

1. Create a plan on Testnet
2. Verify address in block explorer
3. Test Recovery Kit export/import
4. Test in multiple browsers
