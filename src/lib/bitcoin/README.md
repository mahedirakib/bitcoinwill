# Bitcoin Will API Documentation

This directory contains the core Bitcoin logic for the Bitcoin Will application. All functions are pure, stateless, and client-side only.

## Overview

The Bitcoin module implements the **TimeLock Inheritance Protocol (TIP)** using native Bitcoin Script opcodes. It creates P2WSH (Pay-to-Witness-Script-Hash) vault addresses with dual spending paths.

## Modules

### `planEngine.ts`

Core script generation and address derivation.

#### `buildPlan(input: PlanInput): PlanOutput`

The main entry point for creating a Bitcoin Will plan.

**Parameters:**
- `input.network` - Bitcoin network ('testnet' | 'regtest' | 'mainnet')
- `input.inheritance_type` - Currently only 'timelock_recovery'
- `input.owner_pubkey` - Owner's compressed public key (66 hex chars)
- `input.beneficiary_pubkey` - Beneficiary's compressed public key
- `input.locktime_blocks` - Relative locktime in blocks (1-52560)

**Returns:** `PlanOutput` containing address, descriptor, scripts, and explanations.

### `validation.ts`

Input validation and error handling.

#### `validatePubkey(pubkey: string): boolean`

Validates a compressed Bitcoin public key format.

#### `validatePlanInput(input: PlanInput): void`

Comprehensive validation of all plan parameters.

### `instructions.ts`

Recovery kit and beneficiary instruction generation.

#### `buildInstructions(plan, result, createdAt): InstructionModel`

Transforms plan data into beneficiary-friendly format.

#### `generateInstructionTxt(m): string`

Generates plain-text instructions for beneficiaries.

### `types.ts`

TypeScript type definitions for PlanInput, PlanOutput, and BitcoinNetwork.

### `network.ts`

Network configuration mapping for bitcoinjs-lib integration.

### `explorer.ts`

Public explorer integration for:

- Address balance and funding status lookup (Mempool.space / Blockstream.info)
- Transaction broadcast helper with provider fallback
- Explorer URL builders and sats/BTC formatting helpers

### `checkin.ts`

Owner check-in helper logic:

- Recommended check-in cadence from locktime
- Current status classification (`on_track`, `due_now`, `beneficiary_path_open`)
- Remaining blocks estimates for owner/beneficiary paths

### `hex.ts`

Browser-safe hex/byte helpers used by Bitcoin logic modules.

## Script Logic

```
OP_IF
    <owner_pubkey> OP_CHECKSIG
OP_ELSE
    <locktime_blocks> OP_CHECKSEQUENCEVERIFY OP_DROP
    <beneficiary_pubkey> OP_CHECKSIG
OP_ENDIF
```

**Path A (Owner):** `[signature, 1]` - Immediate spend  
**Path B (Beneficiary):** `[signature, 0]` - After CSV delay

## Dependencies

- `bitcoinjs-lib` - Bitcoin operations
- `tiny-secp256k1` - Cryptographic functions

## Testing

See [TESTING.md](../../TESTING.md) for test documentation.
