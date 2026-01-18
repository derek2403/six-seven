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

---

## Implementation Details

### 1) Market Clustering Criteria

We combine markets when they share most of:
- **Same domain/driver** (same geopolitical conflict, same company, same macro theme)
- **Similar time window** (or clearly modelable time structure)
- **Non-contradicting resolution sources** (same oracle / same definitions)
- **Expected correlation is strong enough** that shared liquidity helps more than it confuses

#### Context Pipeline (MVP Approach)

For each market question, we extract a structured "context card":

| Field | Examples |
|-------|----------|
| Entities | United States, China, Donald Trump |
| Event type | strike / resignation / sanction / election |
| Region | Middle East, Europe |
| Time window | by [date] |
| Causal theme | escalation / regime change / conflict |

We then compute similarity and group:

**Step A: Similarity Score**
- Text embedding similarity (semantic)
- Overlap in entities
- Overlap in event type
- Overlap in time window

**Step B: Cluster**
- If similarity > threshold → same "cluster"
- Cap cluster size for MVP (3–5 markets)

**Step C: Human/Rules Guardrails**
- Don't combine if time windows differ too much
- Don't combine if resolution criteria differ ("strike" definitions)

This produces market clusters (e.g., "combine these 3 markets") without heavy statistical modeling.

---

### 1b) Initializing Correlation via Naive Bayes

We derive the world table by assuming a **latent "driver" variable** (e.g., `E = escalation level`) that captures the correlation structure.

#### Example Setup

```
E = 0  →  calm
E = 1  →  high escalation

P(E=1) = 0.30

P(A=Yes | E=1) = 0.70,  P(A=Yes | E=0) = 0.10
P(B=Yes | E=1) = 0.60,  P(B=Yes | E=0) = 0.05
P(C=Yes | E=1) = 0.80,  P(C=Yes | E=0) = 0.10
```

#### Naive Bayes Formula (Conditionally Independent Given E)

```
P(A,B,C) = Σₑ P(E=e) · P(A|e) · P(B|e) · P(C|e)
```

This automatically creates a coherent 8-world table that:
- Makes A/B/C **positively correlated** via E
- Provides a reasonable starting "shape"
- Market trades then override and reshape this prior

#### Source of E
- **Context clustering** — markets in the same escalation cluster share the same latent driver
- **Historical learning** — optionally refined over time from market data

> This is a compelling story: we start with a structured prior, then traders move it.

---

### 2) Ensuring Slice Pricing Consistency

We use a single AMM over corners only.

The AMM lives on the **8 corners** (000…111). Marginals and slices are **not separate markets** — they are **basket trades of corners**.

#### Pricing Rules

| Contract Type | Price Formula |
|---------------|---------------|
| Slice (A=1, B=1 regardless of C) | `p₁₁₀ + p₁₁₁` |
| Marginal (C=Yes) | `p₀₀₁ + p₀₁₁ + p₁₀₁ + p₁₁₁` |
| Corner (exact world) | `pᵢⱼₖ` directly |

Users can "trade slices/marginals" in the UI, but the **backend executes as a basket of corner trades** at AMM prices.

**Benefits:**
- ✅ No price mismatch possible
- ✅ No need for merge/split arbitrage logic
- ✅ Much simpler implementation

#### Alternative: Tradeable Slice Tokens (More Complex)

If slices traded directly as separate tokens, merge/split conversion would be required:
- **Merge:** `110 + 111 → slice(AB)`
- **Split:** `slice(AB) → 110 + 111`

If the slice token got overpriced vs corners, arbitrage would sell slice and buy corners.
We avoid this complexity by using corners-only AMM + basket UI.

---

### 3) Position Accounting in Corner-Space

We represent every position internally as **exposure over the 8 corners**.
Cancellation happens automatically by normal addition/subtraction.

#### Internal Accounting Model

We store a portfolio vector `x[000..111]` = how many $1-per-share claims owned on each corner.

| Action | Effect |
|--------|--------|
| Buy corner 110 | `x[110] += 1` |
| Buy slice AB (110+111) | `x[110] += 1, x[111] += 1` |
| Sell corner 111 | `x[111] -= 1` |

#### Example: Automatic Netting

```
User buys slice AB = (110 + 111)
  → x[110] = 1, x[111] = 1

User sells corner 111
  → x[111] -= 1

Net result:
  → x[110] = 1, x[111] = 0
```

The "regardless of C" exposure is **gone** — now it's a pure corner bet on (1,1,0).

Positions are always stored in corner-space, so netting is exact — no manual cancellation needed.

#### UI Display (Merged Positions)

After netting, we compress the display for users:
- If `x[110]` and `x[111]` are both 5 → show **"5 shares of slice(AB)"**
- If only one exists → show corner

This feels magical for users, but it's just algebra on the corner vector.

---

### 4) AMM Scalability

Updating 8 markets per trade is trivial for the machine.

- We run **one AMM** that outputs 8 corner prices
- Marginals/slices are **derived** (sums of corner prices)
- The UI shows a small set; all 8 corners are only shown in "advanced mode"

**Why We Use LMSR:**
- Naturally supports **many outcomes**
- Always produces a **coherent probability distribution** (sums to 1)
- Single update formula handles any basket trade

```
User trades marginal A=Yes
  → AMM updates corners {100, 101, 110, 111}
  → All 8 prices recalculate via softmax
  → All derived marginals/slices update automatically
```

The computational cost is O(2^N) per trade, which is trivial for N ≤ 5 (32 outcomes).

---

### 5) TEE-Based Privacy for Informed Traders

Multi-dimensional markets amplify a known problem: **informed traders (insiders) are easier to identify**.

In traditional prediction markets, sophisticated observers can fingerprint traders by their betting patterns. In multi-dimensional markets, this becomes even easier — betting on specific corners or unusual slices creates a unique signature. Once identified, insiders face:
- **Copy-trading** — their edge disappears as others follow their bets
- **Social/legal exposure** — being linked back to real identity

This discourages informed traders from participating, which **hurts price discovery for everyone**.

#### Our Solution: TEE-Shielded Betting with Nautilus on Sui

We run the AMM inside a **Trusted Execution Environment (TEE)** using **Nautilus** — Sui's native TEE framework. Individual bets remain encrypted and hidden; only the aggregated world table is published on-chain.

Nautilus provides:
- **Hardware-backed isolation** — computation runs in secure enclaves
- **Native Sui integration** — seamless interaction with Move smart contracts
- **Attestation proofs** — verifiable evidence that the TEE ran the correct LMSR code

```
User bet (encrypted) → TEE enclave
                        ├── Validates bet
                        ├── Updates internal world table (LMSR)
                        └── Publishes ONLY: new world prices

Public sees: p₀₀₀, p₀₀₁, ... p₁₁₁ (corner prices + derived marginals)
Public does NOT see: who bet what, individual position sizes
```

#### What This Achieves

| Property | Benefit |
|----------|---------|
| **Bet privacy** | Individual positions are never revealed on-chain |
| **Price transparency** | Full world table and all derived odds are public |
| **Computation integrity** | TEE attestation proves the AMM ran correctly |
| **Insider protection** | Informed traders can bet without fear of exposure |

#### Why This Matters for Multi-Dimensional Markets

The more dimensions, the more specific a bet can be — and the easier it is to identify *who* would know that specific combination of outcomes. TEE privacy is not just nice-to-have; it's **essential** to attract the informed capital that makes these markets accurate.

> We hide individual bets unlike Polymarket, but publish the full world table so anyone can see coherent, aggregated probabilities across all correlated events.

## Blockchain Integration

### Sui

**Core Package (USDC + Vault)**  
- **PACKAGE_ID:** https://testnet.suivision.xyz/package/0x376898554ee5778bccb1926e5203ab6f8608e0feb3a53b8b1b79873b50eefc51

**USDC Module (`usdc`)**  
- **TREASURY_CAP_ID:** https://testnet.suivision.xyz/object/0x73bb36acf52f07030e2eca7943050caf1ba0d2d89a0c53611fd48fb3c82e79be  
- **COIN_METADATA_ID:** https://testnet.suivision.xyz/object/0x7119f11a2179d5dad2daa1e94812b0eb9174091a4d4714b6e59b8d185b288cb1
- **USDC_TYPE:** https://testnet.suivision.xyz/coin/0x376898554ee5778bccb1926e5203ab6f8608e0feb3a53b8b1b79873b50eefc51::usdc::USDC  
- **DECIMALS:** `6`

**Vault Module (`vault`)**  
- **VAULT_ID:** https://testnet.suivision.xyz/object/0x15be8234404447fab9bbcc876e8eb66dd1000782332a8aeafe3f520ad7bb75e3  
- **LEDGER_ID:** https://testnet.suivision.xyz/object/0x537654bf8d72f1fef3e036f2405efb3750f3d1d5ada3225f326abdfcf64ea214

**World Module (`world`)**  
- **PACKAGE_ID:** https://testnet.suivision.xyz/package/0x4cea1bfc34390760843699634eb9f3c3b55e5cf4248def1d862f6a7ffea4c76b  
- **WORLD_ID:** https://testnet.suivision.xyz/object/0x84d9deddf76eeae57ce0f0bbe6718cb575963bf8feb7230f5b779f8da4cad391

**Listing Module**  
- **PACKAGE_ID:** https://testnet.suivision.xyz/package/0x143e110ae8389ef848783215a1fd4d5a2826e561b2a8624e2c64283cc8299a2d

**Sponsored Transactions** 
- https://testnet.suivision.xyz/txblock/DbHoYdCofR8aZwuMa6i1he5RegLHNcRZatHtTX6bfZYg

---

### Walrus

**Walrus Explorer Links**  
- https://walruscan.com/testnet/blob/8jGqnY8qR9UqNDp1W-0H4q9_uvD5SOdlE0cWVPFlI5c  
- https://walruscan.com/testnet/blob/Ok0Uune5egOJHGNg8k_F3FZVBNYQ6al2oilImJuzzl4  

**Walrus Aggregator Blob Endpoints**  
- https://aggregator.walrus-testnet.walrus.space/v1/blobs/8jGqnY8qR9UqNDp1W-0H4q9_uvD5SOdlE0cWVPFlI5c  
- https://aggregator.walrus-testnet.walrus.space/v1/blobs/Ok0Uune5egOJHGNg8k_F3FZVBNYQ6al2oilImJuzzl4  

---

### TEE & PM Packages
- **TEE_URL:** http://100.24.10.33:3000 
- **ENCLAVE_PACKAGE:** https://testnet.suivision.xyz/package/0x143e110ae8389ef848783215a1fd4d5a2826e561b2a8624e2c64283cc8299a2d
- **ENCLAVE_CONFIG_ID:** https://testnet.suivision.xyz/object/0x15a2d73dbecf428e2856ff88db6648bb7bb6716129b2c8347c9ff50e6b4163e5 
- **ENCLAVE_OBJECT_ID:** https://testnet.suivision.xyz/object/0x9db6f3758c5fd0d8ef9aa4866b43cb4f2b0b9845022d42d4017ec7bb1df6326d
- **PM_PACKAGE:** https://testnet.suivision.xyz/package/0x327d01aa4fdc8cba53596b225510a6b5afc5d2266227654574fe6347a45d3973

---

### Noodles.fi Integration
Real-time on-chain price data for Sui ecosystem tokens (WBTC, WETH, SUI).
**API Route**
- **Service Library:** https://github.com/derek2403/six-seven/blob/main/pages/api/integrations/noodles.ts
- **WebSocket Endpoint:** https://github.com/derek2403/six-seven/tree/main/lib/integrations/noodles
- **WebSocket Endpoint:** `wss://ws.noodles.fi/ws/coin-update`

