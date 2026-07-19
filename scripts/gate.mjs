// Schedule Gate: decides whether this cron firing becomes a Trading Run.
// Writes `run=true|false` and `reason=...` to $GITHUB_OUTPUT.
import { readFileSync, existsSync, appendFileSync } from "node:fs";

const out = (run, reason) => {
  console.log(`gate: run=${run} (${reason})`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `run=${run}\nreason=${reason}\n`);
  }
};

const readJson = (path, fallback) => {
  try {
    return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;
  } catch {
    return fallback;
  }
};

const force = process.env.FORCE === "true";
const config = readJson("config.json", {});
const now = new Date();

if (force) {
  out(true, "forced via workflow_dispatch");
  process.exit(0);
}

if (config.paused) {
  out(false, "paused in config.json");
  process.exit(0);
}

// Market clock from Alpaca (accurate incl. holidays/half-days).
const clockRes = await fetch("https://paper-api.alpaca.markets/v2/clock", {
  headers: {
    "APCA-API-KEY-ID": process.env.ALPACA_KEY_ID,
    "APCA-API-SECRET-KEY": process.env.ALPACA_SECRET_KEY,
  },
});
if (!clockRes.ok) {
  out(false, `alpaca clock request failed: ${clockRes.status}`);
  process.exit(0);
}
const clock = await clockRes.json();
if (!clock.is_open) {
  out(false, "market closed");
  process.exit(0);
}

const history = readJson("data/history.json", []);
const latest = readJson("data/latest.json", {});

// Count runs on the current US-market (ET) date.
const etDate = (d) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d);
const today = etDate(now);
const runsToday = history.filter((h) => etDate(new Date(h.ts)) === today).length;
if (runsToday >= (config.max_runs_per_day ?? 6)) {
  out(false, `max_runs_per_day reached (${runsToday})`);
  process.exit(0);
}

const last = history.at(-1);
if (last) {
  const minutesSince = (now - new Date(last.ts)) / 60000;
  if (minutesSince < (config.min_minutes_between_runs ?? 30)) {
    out(false, `only ${Math.round(minutesSince)}min since last run`);
    process.exit(0);
  }
}

// Honor the Trader's own Next Wake request (ignored if malformed or >24h out).
if (latest.next_wake) {
  const wake = new Date(latest.next_wake);
  if (!isNaN(wake) && wake - now > 0 && wake - now < 24 * 3600 * 1000) {
    out(false, `trader requested next wake at ${latest.next_wake}`);
    process.exit(0);
  }
}

out(true, "market open, run is due");
