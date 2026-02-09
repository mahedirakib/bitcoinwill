# Recovery Guide for Beneficiaries

This guide helps beneficiaries recover funds from a Bitcoin Will vault after the owner is no longer able to manage their Bitcoin.

## Before You Start

### What You Need

1. **Your Private Key**
   - You should have received this securely from the owner
   - Never share it with anyone
   - It corresponds to the public key in the Recovery Kit

2. **Recovery Kit JSON File**
   - Downloaded by the owner when creating the vault
   - Contains all technical details needed for recovery
   - Import it at the Bitcoin Will Instructions page

3. **Compatible Wallet**
   - Sparrow Wallet (recommended)
   - Electrum (advanced users)
   - Any wallet supporting P2WSH and custom scripts

4. **Blockchain Explorer Access**
   - To verify vault balance and check CSV expiration
   - mempool.space (mainnet)
   - mempool.space/testnet (testnet)

### Checklist

- [ ] I have my private key (securely stored)
- [ ] I have the Recovery Kit JSON file
- [ ] I've verified the vault has a balance
- [ ] I've confirmed the CSV delay has expired
- [ ] I have a compatible wallet installed

## Step-by-Step Recovery Process

### Step 1: Verify the Vault

**Check the balance:**
1. Open the Recovery Kit JSON file
2. Copy the `address` field value
3. Go to a block explorer (mempool.space)
4. Paste the address and search
5. Verify there is a balance

**Important:** If there's no balance, the owner may have already moved the funds.

### Step 2: Confirm CSV Expiration

The Recovery Kit specifies a `locktimeBlocks` value (e.g., 144 blocks = ~1 day).

**To check if you can claim:**
1. Find the last transaction to the vault address
2. Note the block height when it confirmed
3. Add the `locktimeBlocks` value
4. Check if current block height exceeds that number

**Example:**
- Funds confirmed at block 800,000
- Locktime is 1,008 blocks (~1 week)
- You can claim at block 801,008 or later

### Step 3: Import the Vault

**Using Sparrow Wallet:**

1. Open Sparrow Wallet
2. Go to File > Import Wallet
3. Select "Descriptor"
4. Copy the `descriptor` from Recovery Kit
5. Paste into Sparrow
6. Click "Import"
7. Wait for wallet to sync

**Using Electrum:**

1. Open Electrum
2. Create new wallet or open existing
3. Go to Wallet > Information
4. You'll need to manually construct the transaction (advanced)

### Step 4: Create Claim Transaction

**In Sparrow:**

1. Go to the Send tab
2. Enter your receiving address (where you want funds sent)
3. Enter amount (or click "Max" to send all)
4. Click "Create Transaction"

**You must provide the witness script:**

1. When prompted, provide the `witnessScript` from Recovery Kit
2. This proves you know the spending conditions

### Step 5: Sign the Transaction

**As Beneficiary:**

1. The transaction requires your signature (from your private key)
2. Sign using your wallet
3. The wallet will automatically use the beneficiary path (OP_ELSE branch)

**Important:** Make sure you're using the correct private key that matches the `beneficiaryPubkey` in the Recovery Kit.

### Step 6: Broadcast

1. Review the transaction details
2. Verify the receiving address is correct
3. Click "Broadcast" or "Send"
4. Wait for confirmation (typically 10-60 minutes)

## Common Problems

### "Transaction is non-final" Error

**Cause:** The CSV timelock hasn't expired yet.

**Solution:** Wait more blocks. Check current block height vs required height.

### "Invalid signature" Error

**Cause:** Wrong private key or wrong signing path.

**Solution:**
- Verify you're using the correct private key
- Ensure you're claiming as beneficiary, not owner
- Check that the public key in Recovery Kit matches your key

### "Script verification failed" Error

**Cause:** Wrong witness script provided.

**Solution:** Copy the exact `witnessScriptHex` from Recovery Kit without any modifications.

### Wallet Doesn't Recognize Address

**Cause:** Wallet doesn't support P2WSH or custom scripts.

**Solution:** Use Sparrow Wallet or another advanced wallet that supports descriptor wallets.

## Safety Tips

### Before Claiming

1. **Test on Testnet First**
   - If the Recovery Kit is for testnet, practice the process
   - Get comfortable before handling real Bitcoin

2. **Verify Everything**
   - Double-check addresses
   - Confirm CSV expiration
   - Verify receiving address is yours

3. **Start Small**
   - If multiple UTXOs, claim one first
   - Verify it works before claiming all

### During Claim

1. **Use Secure Computer**
   - No malware or viruses
   - Preferably a dedicated/clean computer
   - Consider using a hardware wallet if possible

2. **Don't Rush**
   - Take your time
   - Verify each step
   - Bitcoin transactions are irreversible

3. **Keep Records**
   - Save transaction IDs
   - Document what you did
   - Keep Recovery Kit secure even after claiming

### After Claim

1. **Verify Receipt**
   - Check your receiving address has the funds
   - Wait for at least 1 confirmation

2. **Secure the Bitcoin**
   - Move to a secure wallet
   - Consider using a hardware wallet
   - Make backups of new wallet

3. **Preserve Documentation**
   - Keep Recovery Kit for records
   - May be needed for tax or legal purposes

## Getting Help

If you encounter issues:

1. **Review this guide** - Re-read relevant sections
2. **Check Troubleshooting** - See docs/TROUBLESHOOTING.md
3. **Ask the community:**
   - Bitcoin Stack Exchange
   - Reddit r/Bitcoin
   - Wallet-specific support (Sparrow, Electrum)

**Never share your private keys or Recovery Kit publicly!**

## Sample Recovery Timeline

**Scenario:** Owner created vault with 1-month timelock (4,320 blocks)

| Day | Block Height | Event |
|-----|--------------|-------|
| 0 | 800,000 | Owner funds vault |
| 15 | 802,160 | Owner still active (timer not relevant) |
| 30 | 804,320 | Owner moves funds to new vault (timer resets) |
| 45 | 805,820 | Owner incapacitated |
| 75 | 808,820 | **Beneficiary can now claim** (30 days after last movement) |
| 80 | 809,320 | Beneficiary claims funds |

Remember: The timer resets every time the owner moves funds. Only if funds remain untouched for the full delay can the beneficiary claim.
