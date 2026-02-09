# Learning Center

Understanding Bitcoin inheritance and how Bitcoin Will works.

## What is Bitcoin Inheritance?

Bitcoin inheritance is the process of ensuring your Bitcoin can be accessed by your heirs if you die or become incapacitated. Unlike traditional banking, there's no "account recovery" in Bitcoin - if keys are lost, funds are gone forever.

## The Challenge

Bitcoin's strength (self-custody) is also its weakness for inheritance:

| Traditional Banking | Bitcoin Self-Custody |
|---------------------|----------------------|
| Bank can reset password | No password reset |
| Legal documents work | Keys are the only access |
| Estate executors help | No intermediaries |
| Account can be frozen | No one can freeze it |

## Existing Solutions and Their Problems

### 1. Custodial Services
**How it works:** Give Bitcoin to a company that promises to release it to heirs.

**Problems:**
- Counterparty risk (company might fail or be hacked)
- Privacy loss (must identify yourself and heirs)
- Cost (ongoing fees)
- Legal complexity

### 2. Sharing Seed Phrases
**How it works:** Give your seed phrase to heirs or lawyers.

**Problems:**
- Heirs can steal funds while you're alive
- Lawyer might lose or leak the phrase
- No conditions (heirs get full access immediately)

### 3. Complex Multi-sig
**How it works:** Require multiple keys to spend, distribute to heirs.

**Problems:**
- Difficult for non-technical heirs
- Coordination required
- Easy to make mistakes

## The Bitcoin Will Solution

Bitcoin Will uses **time-locked scripts** to create a "Dead Man's Switch":

### How It Works

```
Owner's Key ──┐
              ├──► Bitcoin Script ──► Vault Address
Beneficiary's │      (with CSV timelock)
Key ──────────┘
```

### Two Spending Paths

**Path 1: Owner (Always Available)**
- Owner can spend funds at any time
- Uses signature + flag `1`

**Path 2: Beneficiary (Time-Locked)**
- Beneficiary can only spend after delay
- Uses signature + flag `0`
- Delay starts from last owner activity

### Real-World Analogy

Think of it like a safe with two keys:

- **Your key** opens it instantly, anytime
- **Heir's key** only works if the safe hasn't been opened for (e.g.) 6 months

If you're alive and active, you periodically open the safe (move funds), resetting the timer. If something happens to you, the timer eventually expires, and your heir can access the funds.

## Key Concepts

### Relative Timelock (CSV)

A countdown that starts when funds arrive. Unlike a calendar date, it resets every time you move funds.

**Example:**
- You set a 30-day delay
- You move funds on Day 1 → Timer resets
- You move funds on Day 15 → Timer resets
- You stop moving funds on Day 20
- Heir can claim on Day 50 (Day 20 + 30 days)

### Non-Custodial

You never give your keys to anyone. The Bitcoin stays in your control until either:
- You spend it, or
- The timelock expires and heir spends it

### Privacy-First

- No registration required
- No personal information collected
- No centralized database of "wills"
- Works completely offline

## Use Cases

### Perfect For:

1. **Sovereign Individuals**
   - Want complete control
   - Don't trust third parties
   - Comfortable with technical tools

2. **Privacy Advocates**
   - Refuse KYC/AML requirements
   - Value financial privacy
   - Don't want documented heirs

3. **Bitcoin Educators**
   - Teaching Bitcoin Script
   - Demonstrating timelocks
   - Showing self-custody patterns

### NOT For:

1. **Legal Estate Planning**
   - This is technical, not legal
   - Doesn't replace a legal will
   - May not satisfy probate requirements

2. **Non-Technical Heirs**
   - Recovery requires understanding Bitcoin
   - Heirs need compatible wallets
   - No "support hotline"

3. **Active Monitoring**
   - Doesn't watch blockchain for you
   - Heirs must proactively check
   - No notifications or alerts

## How Bitcoin Will Fits Your Life

### Phase 1: Setup (One-Time)

1. Create your vault with Bitcoin Will
2. Fund it with Bitcoin
3. Give Recovery Kit to beneficiary
4. Explain the process to them

### Phase 2: Normal Life (Ongoing)

- Use Bitcoin normally
- Periodically move funds to reset timer
- Keep beneficiary informed of vault address

### Phase 3: If Something Happens

- Timer eventually expires
- Beneficiary claims funds
- No intervention from Bitcoin Will needed

## Risks to Understand

### Technical Risks

- **Script bugs:** Could lock funds permanently
- **Key loss:** If both parties lose keys, funds gone
- **Software issues:** Bugs in Bitcoin Will or wallets

### Operational Risks

- **Heir doesn't know about it:** Funds remain unclaimed
- **Heir loses Recovery Kit:** Difficult or impossible to recover
- **Wrong keys used:** Funds sent to wrong address

### Mitigation Strategies

1. **Test thoroughly on Testnet first**
2. **Start with small amounts**
3. **Store Recovery Kit in multiple locations**
4. **Ensure heirs understand the process**
5. **Use hardware wallets for key security**

## Next Steps

1. **Read the Protocol** - Technical details of how scripts work
2. **Try on Testnet** - Practice with fake Bitcoin
3. **Educate Your Heirs** - Make sure they understand
4. **Start Small** - Don't put all your Bitcoin in at once

## Questions?

- See [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Check [Glossary](./GLOSSARY.md) for terminology
- Review [Recovery Guide](./RECOVERY_GUIDE.md) for heirs
