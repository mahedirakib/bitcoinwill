# Troubleshooting Guide

Common issues and their solutions when using Bitcoin Will.

## General Issues

### "Invalid Owner Public Key" Error

**Problem:** The public key you entered is not in the correct format.

**Solution:**
- Ensure the key is exactly 66 characters
- Must start with "02" or "03" (compressed format)
- Must contain only hex characters (0-9, a-f)
- Do not include any spaces or line breaks

**How to find your public key:**
- Sparrow Wallet: Settings > Show XPUB/Keys > copy "Master Public Key"
- Electrum: Wallet > Information > copy "Master Public Key"

### Same Owner and Beneficiary Keys

**Problem:** You're using the same public key for both roles.

**Solution:** The beneficiary must provide their own unique public key. They should:
1. Create their own wallet
2. Export their master public key
3. Share that with you

### "Failed to generate SegWit address"

**Problem:** Something went wrong during address generation.

**Solution:**
- Check that both public keys are valid
- Try refreshing the page
- If problem persists, open an issue on GitHub

## Recovery Issues

### Cannot Import Recovery Kit

**Problem:** JSON file won't load or parse.

**Solution:**
- Ensure the file has not been corrupted or edited
- Check that it's a valid JSON file (can open in text editor)
- Try re-downloading from the original creation

### Beneficiary Cannot Claim Funds

**Problem:** Transaction fails when beneficiary tries to spend.

**Common causes:**
1. **CSV delay not expired** - Beneficiary must wait for the full locktime
2. **Wrong private key** - Beneficiary must use the key matching their public key
3. **Missing witness script** - Wallet needs the script hex from Recovery Kit
4. **Network mismatch** - Ensure using correct network (testnet vs mainnet)

**Solution steps:**
1. Verify the vault address has a balance
2. Check when the last transaction confirmed (timer starts from there)
3. Confirm delay has passed (check block explorers)
4. Use correct private key corresponding to beneficiary_pubkey
5. Import descriptor or witness script into wallet

### Balance Shows Zero

**Problem:** Vault address has no funds.

**Solution:**
- Verify the correct address (check Recovery Kit)
- Check on correct network (testnet vs mainnet)
- Use block explorer: mempool.space for mainnet, mempool.space/testnet for testnet

### Live Status or Broadcast Fails

**Problem:** The built-in status refresh or broadcast helper returns an error.

**Solution:**
- Retry with the alternate explorer provider (Mempool.space vs Blockstream.info).
- Confirm you are on the correct network for the Recovery Kit.
- For Regtest, use a local node/local Esplora (public explorers do not support Regtest).
- Ensure broadcast input is a fully signed raw transaction hex (not PSBT).

## Wallet Compatibility

### Sparrow Wallet

**Importing descriptor:**
1. File > Import Wallet
2. Paste the descriptor from Recovery Kit
3. Click "Import"

**Spending from vault:**
1. Create new transaction
2. Add witness script from Recovery Kit
3. Provide beneficiary signature
4. Broadcast

### Electrum

**Note:** Electrum requires manual script handling. See detailed instructions in Recovery Kit.

## Network Issues

### Cannot Connect to Network

**Problem:** App shows network errors.

**Solution:**
- Check internet connection
- Try different network (testnet more reliable than mainnet for testing)
- App works offline for plan creation (only needs network for balance checks)

### Accidentally Used Mainnet

**Problem:** Created vault on mainnet but wanted testnet.

**Solution:**
- Create new plan on correct network
- Mainnet vaults are real - treat carefully
- Move funds to new testnet vault if needed

## Browser Issues

### Page Not Loading

**Solution:**
- Clear browser cache
- Try incognito/private mode
- Disable browser extensions (especially ad blockers)
- Use modern browser (Chrome, Firefox, Safari, Edge)

### GitHub Pages Shows `main.tsx` or `logo.png` 404

**Problem:** The site loads a source `index.html` that references `/src/main.tsx`, which only works in Vite dev mode.

**Solution:**
1. In GitHub repo settings, open **Settings -> Pages**
2. Set **Source** to **GitHub Actions**
3. Re-run or push to trigger the **Deploy to GitHub Pages** workflow
4. Wait for deploy success, then hard refresh the site (`Ctrl+Shift+R` or `Cmd+Shift+R`)

**Note:** `lockdown-install.js: SES Removing unpermitted intrinsics` is typically from a browser extension and is usually unrelated to this deployment issue.

### Download Not Working

**Solution:**
- Check browser download settings
- Try different browser
- Disable popup blockers
- Manually copy content if needed

## Safety Issues

### Lost Recovery Kit

**Problem:** Cannot find the downloaded JSON file.

**What to do:**
- Check Downloads folder
- Search for "bitcoin-will-recovery-kit"
- If truly lost and owner is gone, funds may be unrecoverable
- Prevention: Store in multiple locations (encrypted USB, cloud, physical safe)

### Lost Private Keys

**Owner lost key:** Beneficiary can claim after delay expires  
**Beneficiary lost key:** Owner should create new plan with new beneficiary  
**Both lost keys:** Funds are permanently lost

## Getting Help

If your issue is not covered here:

1. Check [GitHub Issues](https://github.com/mahedirakib/bitcoinwill/issues)
2. Open a new issue with:
   - What you were trying to do
   - What happened
   - Error messages (if any)
   - Steps to reproduce

**Never share private keys or sensitive data in public issues!**
