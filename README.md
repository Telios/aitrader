# 🤖 AI Trader

Claude day-trades a simulated $100k on an [Alpaca](https://alpaca.markets) paper account. Every decision — what to research, what to buy, sell, or short, when to wake up next — is the LLM's own judgment, with its reasoning published. Performance is judged against buy-and-hold SPY.

**Dashboard**: `https://<your-username>.github.io/aitrader/`

## How it works

```
GitHub Actions cron (every 30 min, US market hours)
  └─ Schedule Gate (scripts/gate.mjs) — market open? config caps? trader's next-wake?
       └─ if due: Claude Code (Pro subscription OAuth, no API cost)
            ├─ reads its journal + account + Alpaca market data + news + web
            ├─ places paper orders on Alpaca
            └─ writes journal entry + decision.json
       └─ snapshot (scripts/snapshot.mjs) — records equity, positions, fills, SPY benchmark
       └─ commit → GitHub Pages redeploys the dashboard
```

- **Glossary**: [CONTEXT.md](CONTEXT.md) · **Architecture decision**: [docs/adr/0001](docs/adr/0001-github-actions-subscription-oauth-alpaca.md)
- **Setup** (Alpaca keys, Claude token, secrets, Pages): [docs/SETUP.md](docs/SETUP.md)
- **Controls**: edit [config.json](config.json) — pause, run caps, position limits, shorting.

No server, no API bills: static hosting + scheduled Actions + subscription auth. Secrets live only in GitHub Actions secrets; the site is read-only JSON.
