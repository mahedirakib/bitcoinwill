# Architecture Overview

This document describes the high-level architecture of Bitcoin Will, a reference implementation of the TimeLock Inheritance Protocol (TIP).

## System Architecture

Bitcoin Will is a **100% client-side, stateless React application** with no backend that implements TIP spending-plan construction and recovery artifacts.

```
User
  │
  ▼
React UI Components (TypeScript)
  │
  ├── WillCreatorWizard (4-step flow)
  ├── RecoveryPage (vault monitoring & broadcast)
  ├── NetworkSelector (testnet/regtest/mainnet)
  └── Pages (Learn, Protocol, Whitepaper)
  │
  ▼
Feature Modules (src/features/)
  │
  ├── will-creator/ (vault creation wizard)
  └── recovery/ (recovery kit tools)
  │
  ▼
Bitcoin Logic Layer (src/lib/bitcoin/)
  │
  ├── planEngine.ts (script generation)
  ├── taproot.ts (Taproot address support)
  ├── validation.ts (input validation)
  ├── instructions.ts (recovery kit)
  ├── explorer.ts (public explorer integration)
  ├── checkin.ts (owner check-in schedule helper)
  ├── sss.ts (Shamir's Secret Sharing)
  ├── hardwareWallet.ts (hardware wallet integration)
  └── types.ts (TypeScript definitions)
  │
  ▼
External Dependencies
  ├── bitcoinjs-lib (Bitcoin operations)
  ├── tiny-secp256k1 (Cryptography)
  └── Esplora APIs (Blockchain data)
```

## Feature Architecture

The application follows a **feature-based architecture** where each feature is self-contained:

### Feature Isolation Rule
Features import from `lib/` or shared `components/`, but **features never import from each other**.

```
src/features/
├── will-creator/           # Vault creation wizard
│   ├── components/         # Wizard-specific components
│   │   ├── DownloadChecklistModal.tsx
│   │   └── HardwareWalletModal.tsx
│   ├── hooks/              # Feature-specific hooks
│   ├── steps/              # Wizard steps
│   │   ├── TypeStep.tsx
│   │   ├── KeysStep.tsx
│   │   ├── TimelockStep.tsx
│   │   ├── ReviewStep.tsx
│   │   └── ResultStep.tsx
│   ├── types.ts            # Feature types
│   ├── draftState.ts       # Session persistence
│   └── safety.ts           # Safety checks
│
└── recovery/               # Recovery kit tools
    ├── components/         # Recovery-specific components
    │   ├── RecoveryKitLoader.tsx
    │   ├── InstructionsView.tsx
    │   ├── VaultStatusPanel.tsx
    │   ├── CheckInPanel.tsx
    │   └── BroadcastPanel.tsx
    ├── hooks/              # Recovery hooks
    │   ├── useVaultStatus.ts
    │   ├── useCheckInPlan.ts
    │   └── useTransactionBroadcast.ts
    ├── types.ts            # Feature types
    └── RecoveryPage.tsx    # Main recovery page
```

## Data Flow

### Creating a TIP Plan

```
User Input
    │
    ▼
WillCreatorWizard (4 steps)
    │
    ├── TypeStep → Select inheritance type
    ├── KeysStep → Input owner/beneficiary pubkeys
    ├── TimelockStep → Set locktime duration
    └── ReviewStep → Validate and confirm
    │
    ▼
planEngine.ts
    │
    ├── validatePlanInput() → Validation
    ├── buildPlan() → Script generation
    └── P2WSH derivation → Address
    │
    ▼
ResultStep
    │
    ├── Display vault address
    ├── Download Recovery Kit JSON
    └── Generate beneficiary instructions
```

### Recovery Flow

```
Recovery Kit JSON
    │
    ▼
RecoveryKitLoader
    │
    ├── Parse JSON
    ├── validateAndNormalizeRecoveryKit()
    └── buildInstructions()
    │
    ▼
RecoveryPage
    │
    ├── InstructionsView → Static content
    ├── VaultStatusPanel → Live balance check
    ├── CheckInPanel → Owner check-in tracking
    └── BroadcastPanel → Transaction broadcast
    │
    ▼
Explorer APIs (Mempool.space / Blockstream.info)
```

## Key Design Decisions

### Stateless Architecture
- **No server** - Pure client-side application
- **No database** - All data in browser memory
- **No accounts** - No user registration or login
- **Recovery Kit JSON** - The only persistence mechanism

### Client-Side Only
- **Private keys never touch the application** - Only public keys are handled
- **Works offline** - Plan creation works without internet
- **Air-gap compatible** - Can run on isolated machines

### P2WSH SegWit with CSV
- **Pay-to-Witness-Script-Hash** - Efficient, lower fees
- **OP_CHECKSEQUENCEVERIFY** - Relative timelock (resets on spend)
- **Dual spending paths:**
  - Path A: Owner immediate spend
  - Path B: Beneficiary spend after CSV delay

### Taproot Support (v1.1+)
- **P2TR addresses** - Hidden scripts until spending
- **Same script logic** - Upgraded address format only
- **Better privacy** - Scripts don't appear on-chain until used

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
    ┌─────────────────────────┐
    │  OP_IF                  │
    │    <owner> OP_CHECKSIG  │ ← Immediate
    │  OP_ELSE                │
    │    <csv> OP_CSV OP_DROP │
    │    <beneficiary> OP_CHECKSIG │ ← Delayed
    │  OP_ENDIF               │
    └─────────────────────────┘
                │
                ▼
        P2WSH/P2TR Address
        (Vault Location)
```

## File Organization

```
src/
├── App.tsx                    # Root component, routing
├── main.tsx                   # Application entry
│
├── components/                # Shared UI components
│   ├── NetworkSelector.tsx    # Network picker
│   ├── Toast.tsx              # Toast notifications
│   ├── ErrorBoundary.tsx      # Error handling
│   ├── DevPlayground.tsx      # Development tools
│   ├── DataDisplay.tsx        # StatusCard, DataRow
│   └── KeyboardShortcutsHelp.tsx
│
├── features/                  # Feature modules (isolated)
│   ├── will-creator/          # Vault creation
│   │   ├── WillCreatorWizard.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── steps/
│   │   ├── types.ts
│   │   ├── draftState.ts
│   │   └── safety.ts
│   └── recovery/              # Recovery tools
│       ├── RecoveryPage.tsx
│       ├── components/
│       ├── hooks/
│       ├── types.ts
│       └── index.ts
│
├── lib/                       # Utility libraries
│   ├── bitcoin/               # Core Bitcoin logic
│   │   ├── planEngine.ts      # Script generation
│   │   ├── taproot.ts         # Taproot support
│   │   ├── validation.ts      # Input validation
│   │   ├── instructions.ts    # Recovery kit
│   │   ├── explorer.ts        # Blockchain API
│   │   ├── checkin.ts         # Check-in helper
│   │   ├── sss.ts             # Secret sharing
│   │   ├── hardwareWallet.ts  # Hardware wallets
│   │   ├── hex.ts             # Byte utilities
│   │   ├── network.ts         # Network config
│   │   ├── utils.ts           # Time calculations
│   │   ├── types.ts           # TypeScript types
│   │   └── *.test.ts          # Co-located tests
│   └── utils/
│       └── download.ts        # File downloads
│
├── pages/                     # Route pages (thin)
│   ├── Learn.tsx              # Educational content
│   ├── Protocol.tsx           # Protocol details
│   ├── Whitepaper.tsx         # Whitepaper display
│   └── Instructions.tsx       # Recovery page wrapper
│
├── state/                     # Global state
│   └── settings.tsx           # App settings (network, etc.)
│
└── types/                     # Type declarations
    ├── images.d.ts
    └── svg.d.ts
```

## Module Dependencies

### Bitcoin Logic Dependencies

```
planEngine.ts
├── validation.ts          # Input validation
├── hex.ts                 # Byte conversions
├── network.ts             # Network parameters
├── taproot.ts (optional)  # Taproot variant
└── types.ts               # Type definitions

taproot.ts
├── planEngine.ts (types)  # Reuse types
├── hex.ts                 # Byte handling
├── network.ts             # Network config
└── types.ts

instructions.ts
├── types.ts               # Core types
├── utils.ts               # Time formatting
└── planEngine.ts (types)  # Output types

explorer.ts
├── types.ts               # Bitcoin types
└── Public Esplora APIs    # Mempool.space, Blockstream.info

checkin.ts
├── utils.ts               # Time calculations
└── types.ts

sss.ts (Shamir's Secret Sharing)
└── shamir-secret-sharing  # External library
```

## Component Hierarchy

```
App
├── SettingsProvider
│   └── ToastProvider
│       └── AppContent
│           ├── Home View
│           ├── WillCreatorWizard
│           │   ├── TypeStep
│           │   ├── KeysStep
│           │   ├── TimelockStep
│           │   ├── ReviewStep
│           │   └── ResultStep
│           ├── RecoveryPage
│           │   ├── RecoveryKitLoader (if no model)
│           │   └── InstructionsView (if model loaded)
│           │       ├── VaultStatusPanel
│           │       ├── CheckInPanel
│           │       └── BroadcastPanel
│           ├── Learn
│           ├── Protocol
│           └── Whitepaper
```

## State Management

### Global State (Settings)
- **Network** (testnet/regtest/mainnet)
- **Persisted in:** localStorage

### Feature State (will-creator)
- **Current step** (TYPE, KEYS, TIMELOCK, REVIEW, RESULT)
- **Form inputs** (keys, locktime)
- **Persisted in:** sessionStorage (draft recovery)

### Feature State (recovery)
- **Loaded model** (InstructionModel or null)
- **Vault status** (AddressSummary from explorer)
- **Check-in plan** (CheckInPlan from helper)
- **Broadcast state** (rawTx, result, errors)
- **Persisted in:** None (all runtime state)

## Build & Deploy

```
Source (TypeScript/React)
    │
    ▼
Vite Build
    │
    ├── TypeScript compilation
    ├── Tree shaking
    ├── Code splitting
    └── Asset optimization
    │
    ▼
Static Assets (dist/)
    │
    ▼
GitHub Pages (or any static host)
```

## Future Considerations

### Planned Features
- **Full Taproot (P2TR) support** - Hidden scripts until spending
- **Hardware wallet integration** - Connect Ledger/Trezor for keys
- **Social recovery** - Shamir's Secret Sharing for multi-party recovery
- **Mobile app** - React Native port

### Architecture Evolution
- **Plugin system** - Allow custom script templates
- **Multi-network** - Support for Liquid, other sidechains
- **Batch operations** - Create multiple vaults at once

## Related Documentation

- [Protocol Specification](../PROTOCOL.md) - TIP technical details
- [API Reference](../src/lib/bitcoin/README.md) - Bitcoin module docs
- [Contributing](../CONTRIBUTING.md) - Development guidelines
- [Testing](../TESTING.md) - Testing strategy
- [ADR Index](./adr/README.md) - Architecture decisions
