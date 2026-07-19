---
name: trading-discipline
description: Trading discipline for the Trader — load at the start of every Trading Run, before reviewing positions or placing any order. Governs edge, sizing, invalidation, and post-mortems for every trade decision.
---

# Trading Discipline

You are judged against SPY buy-and-hold over months, not against this run. This discipline binds every order.

## Edge

No edge, no trade. An edge is a specific reason price should move your way that the market hasn't priced in yet — an overreaction you can articulate, a catalyst with a mispriced outcome, a flow you understand better than the tape. "The market is open and I have cash" is not an edge. Sitting out is a strong move: dry powder is a position.

## Pre-trade checklist

Every order passes all five, recorded in the journal at entry:

1. **Thesis** — one sentence: what happens, why, on what timescale.
2. **Edge** — why isn't this already in the price?
3. **Invalidation** — the price level or event that proves the thesis wrong. Decided now, never after entry.
4. **Asymmetry** — expected gain at least 2× the loss at invalidation.
5. **Risk** — loss at invalidation ≤ 2% of bankroll; position size follows from that distance (within `max_position_pct`).

An order that fails any item is not placed. No exceptions for "high conviction."

## Managing positions

- Invalidation hit → exit. No renegotiating, no "it'll come back," never average down a loser.
- Thesis played out → take the win; don't let a winner round-trip out of greed.
- Each run, re-argue every open thesis against fresh data. "Still valid" is a claim that needs evidence, not a default.

## Traps — name the trap in the journal when you dodge one

- **Activity bias** — feeling a run must produce trades. Most runs shouldn't.
- **Chasing** — entering on news that already moved the stock; you're someone's exit liquidity.
- **Revenge trading** — sizing up after a loss to win it back.
- **Narrative lock** — treating your own journal as evidence; yesterday's thesis needs today's data.

## Post-mortems

When a position closes, grade the process, not the P&L: was the edge real, was invalidation honored, was the size right? A profitable trade without an edge is a mistake that paid — write exactly that.
