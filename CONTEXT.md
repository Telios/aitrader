# Domain Glossary — aitrader

A paper-trading experiment: Claude acts as a day trader with simulated money; results are published on a static dashboard.

## Terms

**Trader**
Claude, making trading decisions during a Trading Run. Not a hardcoded strategy — every buy/sell/hold decision is LLM judgment, with written reasoning.

**Trading Run**
One scheduled execution of the trading workflow. During a run the Trader reviews market data and the Paper Account, decides on orders, places them, records its reasoning, and publishes a Snapshot.

**Paper Account**
The simulated brokerage account at Alpaca (paper-trading mode). Alpaca owns the ledger: cash, positions, order fills, and P&L. It is the source of truth for account state.

**Journal**
The Trader's accumulated written reasoning across Trading Runs — its trade theses, open-position intentions, and lessons. Read at the start of each run so the Trader has continuity of thought; the newest entry is published with each Snapshot.

**Snapshot**
A point-in-time JSON export of the Paper Account state plus the Trader's reasoning, committed to the repo after each Trading Run. Snapshots are what the Dashboard renders — the Dashboard never talks to Alpaca directly.

**Universe**
What the Trader may trade: any US-listed stock or ETF, chosen freely by the Trader each Trading Run, within Guardrails.

**Guardrails**
Risk limits from the Trading Config that bound every Trading Run: long and short positions allowed, no margin/leverage, position-size cap per stock, no penny stocks. The Trader decides freely inside these bounds; the bounds themselves are the user's.

**Schedule Gate**
The check at the start of each scheduled wake-up that decides whether it becomes a Trading Run or exits immediately. It consults the Trading Config and the Trader's Next Wake request. Anchored to US market hours, not the user's location.

**Trading Config**
User-editable settings file in the repo controlling the experiment: run cadence limits (e.g. max Trading Runs per day), Starting Capital, Universe guardrails, and other knobs. Editing it is how the user changes behavior without touching code.

**Starting Capital**
The simulated cash the Paper Account begins with, declared in the Trading Config. It is the baseline against which all P&L is measured. Changing it implies resetting the Paper Account (a manual step in Alpaca's dashboard) and starting a fresh experiment.

**Next Wake**
The Trader's own request, recorded at the end of a Trading Run, for when it next wants to trade. Honored by the Schedule Gate, bounded by the Trading Config's caps.

**Dashboard**
The static website on github.io. Read-only view of Snapshots: portfolio value over time (against the Benchmark), current positions, trade log with the Trader's reasoning.

**Benchmark**
The yardstick for the Trader's skill: what the same Starting Capital would be worth if it had simply bought SPY (S&P 500 ETF) on day one and held. The Trader "wins" by beating the Benchmark, not just by being up.
