# Setup

One-time steps to get the AI Trader live. Everything after this runs itself.

## 1. Alpaca (free paper-trading account)

1. Sign up at <https://alpaca.markets> (choose the regular Trading account signup — paper trading is included, no funding needed).
2. In the dashboard, switch to **Paper Trading** (toggle top-left).
3. Your paper account balance does **not** need to match `starting_capital` in `config.json`. The experiment's bankroll is virtual: the Trader may only use `starting_capital` plus accumulated P&L, regardless of how much cash the paper account holds. To restart the experiment (or change starting capital), delete `data/baseline.json`, empty `data/history.json` and `data/trades.json` to `[]`, and push — the next run re-baselines.
4. Generate **API keys** for the paper account (dashboard → API Keys). Copy the Key ID and Secret.

## 2. Claude subscription token

On your own machine (with Claude Code logged in to your Pro account):

```sh
claude setup-token
```

Copy the long-lived OAuth token it prints. Trading runs authenticate with this — they use your Pro subscription (shared rate limits), not paid API credits.

## 3. GitHub repository

```sh
cd ~/dev/aitrader
git add -A
git commit -m "Initial scaffold"
gh repo create aitrader --public --source . --push
```

Add the three secrets (repo → Settings → Secrets and variables → Actions, or):

```sh
gh secret set ALPACA_KEY_ID
gh secret set ALPACA_SECRET_KEY
gh secret set CLAUDE_CODE_OAUTH_TOKEN
```

## 4. GitHub Pages

Repo → Settings → Pages → Source: **Deploy from a branch** → branch `main`, folder `/ (root)`.
The dashboard will be at `https://<your-username>.github.io/aitrader/`.

## 5. First run

Trigger a test run manually: repo → Actions → **Trading Run** → Run workflow → set **force** to true. Force skips the Schedule Gate (useful outside market hours; orders placed while closed are queued by Alpaca until open).

After it finishes, the dashboard shows the first snapshot within a minute or two of the Pages deploy.

## Day-to-day controls

- **`config.json`** — pause the trader (`"paused": true`), cap runs per day, adjust guardrails. Edit and push; next firing picks it up.
- **`model` / `effort`** in `config.json` — which Claude model runs the Trader and how hard it thinks. Empty strings = your subscription's defaults. `model` takes an alias (`sonnet`, `opus`, `haiku`) or a full ID (e.g. `claude-sonnet-4-6`); `effort` is one of `low`, `medium`, `high`, `xhigh`, `max`. A cheaper model/effort stretches your Pro rate limits across more runs.
- **Actions tab** — every firing is logged; skipped firings show the gate's reason in seconds.
- **Rate limits** — each real Trading Run uses your Pro plan quota (roughly one longish Claude Code session per run). If you hit limits during your own work, lower `max_runs_per_day`.
