# Bitcoin Will Implementation Roadmap

## 🎯 Phase 1: Scaffolding (COMPLETED)
- [x] Initialize Vite + React + TypeScript.
- [x] Set up Tailwind CSS with a modern dark theme.
- [x] Create basic UI shell and navigation.
- [x] Add project documentation (README, TODO, LICENSE).

## 🛠 Phase 2: Core Bitcoin Logic
- [ ] Integrate `bitcoinjs-lib`.
- [ ] Implement BIP32/BIP39 support for key derivation.
- [ ] Create the **Dead Man's Switch** script generator using Miniscript.
- [ ] Implement Taproot/SegWit address derivation from the generated script.
- [ ] Add unit tests for script logic to ensure funds are always recoverable.

## 📄 Phase 3: The "Recovery Kit"
- [ ] Design the "Recovery Kit" JSON schema.
- [ ] Implement "Export to PDF/JSON" for the owner to save their Will.
- [ ] Build the "Kit Scanner" (beneficiary pastes kit -> app checks blockchain for balance).

## 🔗 Phase 4: Blockchain Integration
- [ ] Connect to public APIs (Mempool.space / Blockstream.info) for balance checking.
- [ ] Implement transaction broadcasting (for the recovery step).
- [ ] Add Testnet/Mainnet toggle.

## 🎨 Phase 5: UI/UX & Education
- [ ] Add "Plain English" explanations for every technical step.
- [ ] Implement visual progress bar for the Will creation flow.
- [ ] Add safety warnings and "Checklist for Success" (e.g., "Did you give the kit to your heir?").

## 🚀 Phase 6: Launch & Hardening
- [ ] Security audit of client-side logic.
- [ ] Finalize static build and deployment.
- [ ] Add instructions for running the app offline/locally.