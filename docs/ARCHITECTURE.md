# Architecture Overview

This document describes the high-level architecture of Bitcoin Will, a reference implementation of the TimeLock Inheritance Protocol (TIP).

## System Architecture

Bitcoin Will is a 100% client-side, stateless React application with no backend that implements TIP spending-plan construction and recovery artifacts.

```
User
  │
  ▼
React UI Components (TypeScript)
  │
  ├── WillCreatorWizard (4-step flow)
  ├── NetworkSelector (testnet/regtest/mainnet)
  ├── Pages (Learn, Protocol, Instructions)
  │
  ▼
Bitcoin Logic Layer (src/lib/bitcoin/)
  │
  ├── planEngine.ts (script generation)
  ├── validation.ts (input validation)
  ├── instructions.ts (recovery kit)
  ├── explorer.ts (public explorer integration)
  ├── checkin.ts (owner check-in schedule helper)
  └── types.ts (TypeScript definitions)
  │
  ▼
bitcoinjs-lib (external dependency)
```

## Data Flow

### Creating a TIP Plan

1. **User Input** → React state captures network, keys, locktime
2. **Validation** → validatePlanInput() checks all parameters
3. **Script Generation** → planEngine.ts builds Bitcoin script
4. **Address Derivation** → P2WSH address generated from script hash
5. **Output** → PlanOutput with address, descriptor, scripts

### Recovery Flow

1. **Import Kit** → User uploads Recovery Kit JSON
2. **Parse** → Instructions parsed and displayed
3. **Claim** → Beneficiary uses their wallet + script to spend

## Key Design Decisions

### Stateless Architecture
- No server, no database, no accounts
- All data lives in browser memory only
- Recovery Kit is the only persistence mechanism

### Client-Side Only
- Private keys never touch the application
- Public keys are the only sensitive data handled
- Works offline/air-gapped

### P2WSH SegWit
- Uses Pay-to-Witness-Script-Hash for efficiency
- Relative timelock via OP_CHECKSEQUENCEVERIFY
- Lower fees than legacy P2SH

## Security Model

```
Owner Key Pair          Beneficiary Key Pair
     │                         │
     ▼                         ▼
Public Key              Public Key
     │                         │
     └──────────┬──────────────┘
                ▼
         Bitcoin Script
         (OP_IF/OP_ELSE)
                │
                ▼
        P2WSH Address
        (Vault Location)
```

## File Organization

```
src/
├── App.tsx                    # Root component, routing
├── main.tsx                   # Application entry
├── components/                # Reusable UI components
│   ├── NetworkSelector.tsx
│   ├── Toast.tsx
│   └── ErrorBoundary.tsx
├── features/                  # Feature-specific components
│   └── will-creator/
│       └── WillCreatorWizard.tsx
├── lib/                       # Utility libraries
│   ├── bitcoin/              # Bitcoin logic
│   └── utils/
│       └── download.ts       # File download helpers
├── pages/                     # Route pages
│   ├── Learn.tsx
│   ├── Protocol.tsx
│   └── Instructions.tsx
└── state/                     # State management
    └── settings.tsx
```

## Module Dependencies

```
planEngine.ts
├── validation.ts
├── hex.ts
├── types.ts
└── network.ts

instructions.ts
├── types.ts
└── planEngine.ts (types only)

explorer.ts
├── types.ts
└── public Esplora APIs (mempool/blockstream)
```

## Future Considerations

- Taproot (P2TR) support for hidden scripts
- Hardware wallet integration
- Social recovery with Shamir's Secret Sharing
