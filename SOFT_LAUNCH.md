# Soft Launch Checklist

## Pre-Launch Checks
- [ ] **Tests:** Run `npx vitest` and ensure all Bitcoin logic tests pass.
- [ ] **Build:** Run `npm run build` and verify `dist/` is correctly populated.
- [ ] **Links:** Manually click every link in the Header and Footer to ensure no 404s.
- [ ] **Mainnet Lock:** Verify that switching to Mainnet requires the exact confirmation phrase.

## Testnet Demo Steps (Verifying the MVP)
1. Select **Testnet**.
2. Generate a plan using **Sample Keys**.
3. Verify the Vault Address is `tb1q...`.
4. Download the **Recovery Kit JSON**.
5. Upload the JSON to the **Instructions** page and verify the "Delay" matches.

## Who to Share With
- **Bitcoin Developers:** For peer review of the script logic and security model.
- **Sovereign Bitcoiners:** For feedback on the UX and "Dead Man's Switch" utility.
- **Open Source Communities:** To gather contributions for future Taproot support.

## Who NOT to Market To (Yet)
- **General Public:** Until the tool has been peer-reviewed by the Bitcoin community.
- **Non-Technical Users:** The recovery step still requires an "Advanced Wallet" (Sparrow/Electrum).

## Early Feedback Questions
- "Does the 'Relative Timelock' explanation make sense to you?"
- "Is the Recovery Kit JSON easy to understand and backup?"
- "What is the biggest friction point in the creation wizard?"
- "Do you feel confident that your heir could follow the Instructions?"
