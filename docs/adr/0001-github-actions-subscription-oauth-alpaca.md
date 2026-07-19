# ADR 0001: Scheduled GitHub Action + Claude subscription OAuth + Alpaca paper trading + static Pages

Date: 2026-07-19
Status: accepted

## Context

The project wants an LLM (Claude) acting as a day trader with simulated money, visible on a simple website hosted on github.io — at zero or near-zero running cost. github.io (GitHub Pages) is static hosting: no server, no scheduled compute, no place to keep secrets. Anthropic API calls are not included in a Claude Pro subscription (the API is separate pay-as-you-go billing), so any design that calls the API directly costs money per run.

## Decision

- **Compute**: a scheduled GitHub Actions workflow is the runtime. A cheap deterministic "Schedule Gate" script decides whether each cron firing becomes a real Trading Run, so most firings cost seconds of free Actions time and no Claude usage.
- **The Trader**: Claude Code in headless mode (`claude -p`), authenticated with a subscription OAuth token (`claude setup-token` → `CLAUDE_CODE_OAUTH_TOKEN` secret). Runs count against the Pro plan's rate limits instead of per-token API billing.
- **Simulation**: an Alpaca paper-trading account is the source of truth for cash, positions, fills, and P&L. We do not simulate fills ourselves.
- **Publishing**: each Trading Run commits JSON snapshots to the repo; GitHub Pages serves a static dashboard that renders them. The site never talks to Alpaca and holds no credentials.

## Consequences

- Effectively free to run; secrets live only in GitHub Actions secrets.
- Trading runs share the Pro plan's rate limits with the user's own Claude Code sessions.
- GitHub Actions cron is best-effort: firings can be 5–15 minutes late or occasionally skipped, so the Trader cannot rely on tight intraday timing.
- The repo's commit history doubles as the audit log of every run.
- Alpaca owns fill realism and market-hours enforcement — less code, but the experiment depends on a third-party free tier (IEX data feed).
- Resetting the experiment (changing starting capital) is a manual step in Alpaca's dashboard.

## Alternatives considered

- **Anthropic API directly** — rejected: per-call cost, not covered by the Pro subscription.
- **Hardcoded algorithmic strategy** — rejected: the point is testing LLM judgment.
- **Self-simulated portfolio with free quote APIs (Finnhub/Yahoo)** — rejected: naive fills, more bookkeeping code, we'd own correctness of the ledger.
- **A real server / cloud function** — rejected: cost and ops burden; conflicts with the github.io requirement.
