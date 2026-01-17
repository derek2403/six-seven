# Unified Liquidity Multi-Dimensional Prediction Market (Joint-Outcome AMM)

**One-liner:** A combined prediction market that pools liquidity across multiple correlated Yes/No questions by pricing them through a single joint-outcome (“world table”) AMM, while still letting users trade simple binary markets and “partial” multi-event slices.

---

## TL;DR

Prediction markets often fragment liquidity across many correlated questions (e.g., related geopolitics events), causing wide spreads and inconsistent probabilities.  
This project proposes a **single shared market-making engine** over the **joint outcomes** of multiple binary events, so:

- One liquidity pool supports *all* correlated questions.
- Prices remain coherent (no contradictory implied probabilities).
- Users can trade:
  - **Simple binary bets** (e.g., “Event A = Yes”)
  - **Partial multi-event bets** (e.g., “A = Yes AND B = Yes, regardless of C”)
  - **Exact scenario bets** (e.g., “A=Yes, B=Yes, C=No”)

All contracts still resolve to **$1 per share** if they win, **$0** otherwise. “Bigger upside” comes from buying more shares at lower prices (more specific scenarios are cheaper).

---

## Problem

### Liquidity Fragmentation
In typical prediction markets, each question is its own market / book:

- Market A: P(A=Yes)
- Market B: P(B=Yes)
- Market C: P(C=Yes)

Even if these events are strongly correlated, liquidity is split across separate pools/orderbooks, leading to:
- Wider spreads (less depth per market)
- Slower price discovery
- Incoherence (prices don’t move together unless arbitrage traders manually sync them)

### Incoherent Odds Across Correlated Events
Separate markets can imply contradictory “stories of the world.”
Example: “Israel strike” jumps to 70%, but “US strike” stays flat even if historically/structurally correlated.

---

## Solution: One Shared “World Table” (Joint Distribution)

Instead of 3 separate markets, run **one unified source of truth** under the hood:

### The World Table
For **N binary events**, there are **2^N joint outcomes** (“world states”).

For N=3 events A, B, C → 8 worlds:

| World (A,B,C) | Meaning |
|---|---|
| 000 | A no, B no, C no |
| 001 | A no, B no, C yes |
| 010 | A no, B yes, C no |
| 011 | A no, B yes, C yes |
| 100 | A yes, B no, C no |
| 101 | A yes, B no, C yes |
| 110 | A yes, B yes, C no |
| 111 | A yes, B yes, C yes |

The engine maintains probabilities/prices for each world:
- `p000, p001, ... p111`
- All non-negative
- Sum to 1 (probability simplex)

This world table is the **single “source of truth.”**

### Deriving Displayed Odds (Marginals / Slices)
User-facing odds for individual questions are **derived** from the world table.

Example:
- `P(A=Yes) = p100 + p101 + p110 + p111`
- `P(B=Yes) = p010 + p011 + p110 + p111`
- `P(C=Yes) = p001 + p011 + p101 + p111`

So users still see familiar Yes/No markets, but those are *views* of the one joint model.

---

## Betting Types (User-Facing Contracts)

All contracts pay **$1 per share if the contract condition is satisfied**, else $0.

### 1) Marginal (Single Event) — “Normal” Binary Bet
> **A=Yes regardless of B,C**

This is a 1D slice: it groups all worlds where A=1:
- {100,101,110,111}

Payout:
- $1 per share if A resolves Yes
- $0 otherwise

Price:
- `price(A=Yes) = P(A=Yes)` (derived from world table)

### 2) Slice (Partial Multi-Event Bet) — “Ignore One Dimension”
> **A=Yes AND B=Yes, regardless of C**

This is a 2D slice: it groups:
- {110,111}

Payout:
- $1 per share if (A=Yes AND B=Yes)
- $0 otherwise

Price:
- `price(A=Yes,B=Yes) = p110 + p111`

Intuition:
- Slice is easier to win than an exact scenario (more worlds included),
- so it typically costs more per share.

### 3) Corner (Exact Scenario / Absolute Bet)
> **A=Yes, B=Yes, C=No** (world 110)

This is the most specific bet: one exact world.

Payout:
- $1 per share if the final world is exactly 110
- $0 otherwise

Price:
- `price(110) = p110`

Intuition:
- Corner is harder to win (one exact outcome),
- so it’s usually cheaper per share.

---

## Why “More Specific = Bigger Upside” (Without Changing Payout Rules)

Payout is always **$1 per share**.  
Your total payout depends on how many shares you bought.

If you spend `$1 USDC`:

- Shares bought = `1 / price`

Example:
- Corner price = $0.10 → you buy 10 shares → win pays $10
- Slice price = $0.20 → you buy 5 shares → win pays $5

So:
- **Corner**: cheaper → more shares → bigger payout if right, but lower hit-rate  
- **Slice**: more expensive → fewer shares → smaller payout, but higher hit-rate

This naturally matches user intuition: precision = higher risk/higher reward.

---

## Why Not Use “1/n payout”?

Scaling payouts by 1/n (e.g., each event pays $1/3) mostly just changes units:
- users will buy 3x shares to get the same exposure
- it does **not** merge liquidity across markets

Liquidity pooling comes from **one shared joint engine**, not from payout scaling.

---

## AMM Design: LMSR Over Joint Worlds

To avoid manual market-making across 8 outcomes, we use an **Automated Market Maker** over the joint outcome space.

### Recommended AMM: LMSR (Logarithmic Market Scoring Rule)
LMSR is a classic prediction market AMM that supports multi-outcome settings naturally.

Conceptually:
- The AMM maintains internal “share quantities” or “scores” per world outcome.
- Prices for each world are computed from these scores (softmax-like behavior).
- Trades adjust these scores; prices update automatically for all outcomes.

Key properties:
- Always provides liquidity (continuous pricing)
- Prices stay coherent (sum to 1 over mutually exclusive outcomes)
- One parameter `b` controls liquidity depth/spread

### How Trading a Marginal/Slice Works (Basket Trades)
Users typically trade marginals/slices, not raw corners.

Example: user buys **C=Yes**
- This corresponds to buying a **basket** of world outcomes where C=1:
  - {001,011,101,111}

The AMM processes this as a multi-outcome trade and updates prices across **all 8 worlds**.
Because the world prices changed, the derived markets (A, B, slices) update too.

---

## Initial Funding / Bootstrapping

### Liquidity Provider (LP) / Market Maker Funding
The LP seeds the market by depositing collateral (e.g., USDC) to back payouts and provide depth.

- LP deposits collateral into the AMM pool (e.g., $10,000 USDC).
- The AMM starts with an initial world-table prior (often uniform or mildly informed).
- As users trade, the AMM updates prices.

The LP does **not** need to “buy all tokens.”
Collateral + AMM mechanics are enough to quote and settle.

---

## World Table Calculation Example (Concrete)

### Start: One World Table
Assume N=3. We maintain 8 probabilities that sum to 1:

| World | Prob |
|---|---:|
| 000 | 0.20 |
| 001 | 0.05 |
| 010 | 0.15 |
| 011 | 0.10 |
| 100 | 0.10 |
| 101 | 0.05 |
| 110 | 0.25 |
| 111 | 0.10 |
Sum = 1.00

### Derived Odds (User UI)
- `P(A=Yes) = 100+101+110+111 = 0.10+0.05+0.25+0.10 = 0.50`
- `P(B=Yes) = 010+011+110+111 = 0.15+0.10+0.25+0.10 = 0.60`
- `P(C=Yes) = 001+011+101+111 = 0.05+0.10+0.05+0.10 = 0.30`

### Corner vs Slice Pricing
- Corner (110) price = 0.25  
- Slice (A=Yes,B=Yes regardless of C) price = 110+111 = 0.25+0.10 = 0.35

### $1 Bet Payouts (Per Share $1)
If user spends $1:
- Corner shares = 1/0.25 = 4 → payout $4 if 110 happens
- Slice shares = 1/0.35 ≈ 2.857 → payout ≈ $2.857 if 110 or 111 happens

---

## Benefits

### For Users
- Trade familiar Yes/No markets with deeper liquidity
- Express richer views (scenarios, partial bets) with fewer steps
- Better pricing (tighter spreads, less slippage) due to pooled liquidity
- Coherent cross-market movement (related markets update together)

### For Market Makers / LPs
- One inventory/risk surface instead of fragmented books
- Cleaner hedging via mergeable/splittable exposures (corner ↔ slice ↔ marginal)
- Higher capital efficiency when quoting correlated markets

### For the Platform
- Reduced incoherence and exploitable contradictions across correlated markets
- A scalable framework: N events → 2^N worlds (manageable with small N and can be extended with structured factor models later)

---


## Summary

This design turns multiple correlated prediction markets into a single **multi-dimensional joint-outcome market**, where:
- **the world table is the source of truth**
- **marginals/slices/corners are just different views/contracts**
- **an LMSR AMM updates all prices coherently**
- **liquidity is pooled instead of fragmented**

The result is a market that is simpler for users, more capital-efficient for liquidity providers, and more consistent overall.
