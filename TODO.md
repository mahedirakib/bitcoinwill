# Bitcoin Will Implementation Roadmap

## Phase 1: Scaffolding (COMPLETED)
- [x] Initialize Vite + React + TypeScript.
- [x] Set up Tailwind CSS with a modern theme.
- [x] Create basic UI shell and navigation.
- [x] Add project documentation (README, TODO, LICENSE).

## Phase 2: Core Bitcoin Logic (COMPLETED)
- [x] Integrate `bitcoinjs-lib`.
- [x] Create the **Dead Man's Switch** script generator using native Bitcoin Script.
- [x] Implement P2WSH SegWit address derivation from the generated script.
- [x] Add input validation for public keys and locktime parameters.
- [x] Add unit tests for script logic to ensure funds are always recoverable.
- [x] Implement Taproot/SegWit v1 (P2TR script-path) address support.
- [ ] ~~Implement BIP32/BIP39 support for key derivation~~ (Post-MVP - manual / HW pubkey entry).

## Phase 3: The "Recovery Kit" (COMPLETED)
- [x] Design the "Recovery Kit" JSON schema.
- [x] Implement "Export to JSON" for the owner to save their Will.
- [x] Build the "Kit Loader" (beneficiary pastes kit -> app displays instructions).
- [x] Generate human-readable beneficiary instructions.
- [x] Live vault status via public explorers (kit / address balance checks).

## Phase 4: Blockchain Integration (COMPLETED)
- [x] Connect to public APIs (Mempool.space / Blockstream.info) for balance checking.
- [x] Implement transaction broadcasting (for the recovery step).
- [x] Add Testnet/Mainnet toggle with safety locks.
- [x] Add "Check-in Transaction" helper to reset timelock.

## Phase 5: UI/UX & Education (COMPLETED)
- [x] Add "Plain English" explanations for every technical step.
- [x] Implement visual progress bar for the Will creation flow.
- [x] Add safety warnings and network indicators.
- [x] Create educational pages (Learn, Protocol).
- [x] Add "Checklist for Success" modal before download.
- [x] Optional local "My vaults" list (browser storage; secrets stripped).

## Phase 6: Launch & Hardening (COMPLETED)
- [x] Security review of client-side logic.
- [x] Finalize static build and deployment.
- [x] Add instructions for running the app offline/locally.
- [x] Comprehensive unit + e2e test suite.
- [x] Dependency / supply-chain hardening report (npm audit + CI gates; not a formal crypto audit).
- [x] v1.0.0 stable release.
- [x] Social recovery key splitting (Shamir's Secret Sharing).
- [x] Hardware wallet pubkey import (Ledger, Trezor).

## Future Enhancements (Backlog)
- [x] Unsigned PSBT / spend templates for owner, beneficiary, and check-in paths.
- [x] Vault deep links (`/vaults/:id`).
- [x] Optional ephemeral mode (disable localStorage vaults).
- [ ] Multi-sig inheritance paths (M-of-N beneficiaries beyond SSS).
- [ ] Coldcard / QR air-gap hardware path.
- [ ] Enforce coverage thresholds on `src/lib/bitcoin/**`.
- [ ] Independent script/crypto security review (community or paid).
- [ ] Mobile app version (React Native).
- [ ] Multi-language support (i18n).

---

**Last Updated:** 2026-07-19  
**Current Version:** v1.0.0  
**Status:** Production-ready static release with Taproot, SSS, HW pubkey import, PSBT templates, vault deep links, ephemeral mode, explorer tooling, and hardened QA gates.
