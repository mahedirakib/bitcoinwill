# Bitcoin Will Implementation Roadmap

## 🎯 Phase 1: Scaffolding (COMPLETED)
- [x] Initialize Vite + React + TypeScript.
- [x] Set up Tailwind CSS with a modern dark theme.
- [x] Create basic UI shell and navigation.
- [x] Add project documentation (README, TODO, LICENSE).

## 🛠 Phase 2: Core Bitcoin Logic (COMPLETED)
- [x] Integrate `bitcoinjs-lib`.
- [x] Create the **Dead Man's Switch** script generator using native Bitcoin Script.
- [x] Implement P2WSH SegWit address derivation from the generated script.
- [x] Add input validation for public keys and locktime parameters.
- [x] Add unit tests for script logic to ensure funds are always recoverable.
- [ ] ~~Implement BIP32/BIP39 support for key derivation~~ (Post-MVP - manual key entry only).
- [ ] ~~Implement Taproot/SegWit v1 address support~~ (v2.0 feature).

## 📄 Phase 3: The "Recovery Kit" (COMPLETED)
- [x] Design the "Recovery Kit" JSON schema.
- [x] Implement "Export to JSON" for the owner to save their Will.
- [x] Build the "Kit Loader" (beneficiary pastes kit -> app displays instructions).
- [x] Generate human-readable beneficiary instructions.
- [ ] ~~Build the "Kit Scanner" (auto blockchain balance checking)~~ (Phase 4).

## 🔗 Phase 4: Blockchain Integration (PLANNED)
- [ ] Connect to public APIs (Mempool.space / Blockstream.info) for balance checking.
- [ ] Implement transaction broadcasting (for the recovery step).
- [ ] Add Testnet/Mainnet toggle with safety locks.
- [ ] Add "Check-in Transaction" helper to reset timelock.

## 🎨 Phase 5: UI/UX & Education (COMPLETED)
- [x] Add "Plain English" explanations for every technical step.
- [x] Implement visual progress bar for the Will creation flow.
- [x] Add safety warnings and network indicators.
- [x] Create educational pages (Learn, Protocol).
- [ ] Add "Checklist for Success" modal before download.

## 🚀 Phase 6: Launch & Hardening (IN PROGRESS)
- [x] Security review of client-side logic.
- [x] Finalize static build and deployment.
- [x] Add instructions for running the app offline/locally.
- [ ] Complete comprehensive test coverage.
- [ ] Third-party security audit (community review).
- [ ] v1.0.0 stable release.

## 🎯 Future Enhancements (Backlog)
- [ ] Taproot (P2TR) support with hidden script paths.
- [ ] Multi-sig inheritance paths (M-of-N beneficiaries).
- [ ] Social recovery key splitting (Shamir's Secret Sharing).
- [ ] Hardware wallet integration (via USB/QR).
- [ ] Mobile app version (React Native).
- [ ] Multi-language support (i18n).

---

**Last Updated:** 2026-02-08  
**Current Version:** v0.1.0 (MVP)  
**Status:** Functional for Testnet use. Mainnet available with warnings.