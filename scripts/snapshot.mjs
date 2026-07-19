// Snapshot bookkeeping: after a Trading Run, record account state deterministically.
// Reads the Trader's data/decision.json; fetches account/positions/fills/SPY from Alpaca;
// updates data/history.json, data/trades.json, data/latest.json, data/baseline.json.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const HEADERS = {
  "APCA-API-KEY-ID": process.env.ALPACA_KEY_ID,
  "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY,
};
const TRADE_API = "https://paper-api.alpaca.markets";
const DATA_API = "https://data.alpaca.markets";

const get = async (url) => {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${await res.text()}`);
  return res.json();
};
const readJson = (path, fallback) => {
  try {
    return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;
  } catch {
    return fallback;
  }
};
const writeJson = (path, obj) => writeFileSync(path, JSON.stringify(obj, null, 2) + "\n");

const now = new Date().toISOString();
const config = readJson("config.json", {});
const decision = readJson("data/decision.json", { summary: "", next_wake: null, trades: [] });

const account = await get(`${TRADE_API}/v2/account`);
const positions = await get(`${TRADE_API}/v2/positions`);
const spy = await get(`${DATA_API}/v2/stocks/SPY/trades/latest?feed=iex`);
const spyPrice = spy.trade?.p;

// Baseline: fixed on the first snapshot; the Benchmark and Bankroll are measured against it.
let baseline = readJson("data/baseline.json", null);
if (!baseline) {
  baseline = {
    start: now,
    starting_capital: config.starting_capital ?? 100000,
    spy_start: spyPrice,
    account_equity_start: +account.equity,
  };
  writeJson("data/baseline.json", baseline);
}
const benchmark = spyPrice
  ? +(baseline.starting_capital * (spyPrice / baseline.spy_start)).toFixed(2)
  : null;

// The Bankroll is virtual: config starting capital + P&L since baseline.
// The Alpaca account may hold more cash than the experiment is allowed to use.
const bankroll = +(
  baseline.starting_capital + (+account.equity - baseline.account_equity_start)
).toFixed(2);
const grossExposure = positions.reduce((s, p) => s + Math.abs(+p.market_value), 0);
const deployable = +(bankroll - grossExposure).toFixed(2);

const history = readJson("data/history.json", []);
history.push({
  ts: now,
  equity: bankroll,
  cash: deployable,
  spy: spyPrice ?? null,
  benchmark,
});
writeJson("data/history.json", history);

// Merge today's fills into the trade log, attaching the Trader's rationale by symbol.
const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
const orders = await get(
  `${TRADE_API}/v2/orders?status=closed&after=${encodeURIComponent(since)}&limit=200`
);
const trades = readJson("data/trades.json", []);
const known = new Set(trades.map((t) => t.id));
const rationaleFor = (symbol, side) =>
  decision.trades?.find(
    (t) => t.symbol?.toUpperCase() === symbol && (!t.side || t.side === side)
  )?.rationale ?? null;
for (const o of orders) {
  if (o.filled_qty > 0 && !known.has(o.id)) {
    trades.push({
      id: o.id,
      ts: o.filled_at ?? o.updated_at,
      symbol: o.symbol,
      side: o.side,
      qty: +o.filled_qty,
      price: +o.filled_avg_price,
      rationale: rationaleFor(o.symbol, o.side),
      run_ts: now,
    });
  }
}
trades.sort((a, b) => new Date(a.ts) - new Date(b.ts));
writeJson("data/trades.json", trades);

writeJson("data/latest.json", {
  ts: now,
  equity: bankroll,
  cash: deployable,
  positions: positions.map((p) => ({
    symbol: p.symbol,
    side: p.side,
    qty: +p.qty,
    avg_entry: +p.avg_entry_price,
    price: +p.current_price,
    market_value: +p.market_value,
    unrealized_pl: +p.unrealized_pl,
    unrealized_plpc: +p.unrealized_plpc,
  })),
  summary: decision.summary ?? "",
  next_wake: decision.next_wake ?? null,
});

console.log(
  `snapshot: bankroll=${bankroll} (account=${account.equity}) benchmark=${benchmark} trades=${trades.length}`
);
