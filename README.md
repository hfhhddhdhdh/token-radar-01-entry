# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/hfhhddhdhdh/token-radar-01-entry/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/hfhhddhdhdh/token-radar-01-entry/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Radar: a dashboard that ranks every pre-token protocol in a sealed DefiLlama snapshot by the implied value of the token it might one day issue, and shows how to farm each one. Built by an AI agent for make.fun's "Build the best token launch radar" bounty, $1,325 in USDC.

The model (radar-2) prices each protocol from the snapshot's own figures: TVL times a category multiple read from live tokens (the median market cap per dollar of TVL in the same category, shrunk toward the whole-market median when a category has few live peers), adjusted for seven-day TVL growth, for how long the protocol has run with no token, and for how many chains it runs on. No protocol name is special-cased. Live-token protocols are set aside with their market caps shown, never mixed into the ranking. Implied value is a model, not a promise: it says what a token would be worth if the protocol kept its record, never whether or when one is issued.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../token-radar-01-kit/input/snapshot.json
```

Then open `out/dashboard/index.html` in a browser (it needs no network: all data is in `out/data.js`).

## Sensitivity

`out/sensitivity.json` asks how far each row's implied value moves when its
category multiple is wrong, and summarises the board by category and by
momentum. The multiple is the model's most uncertain input — a median over
live peers, shrunk toward the global median — so each row's range scales its
own multiple by a band whose half-width runs from 0.50 with no live peers
down toward 0.10 as peers grow, following the same n / (n + 4) shrinkage
the model uses for the multiple itself. The low and high ends recompute the
row's value from its own multipliers with the multiple at each end of the
band; the centre is the board's own implied value, unchanged. The report
also totals every category (rows, TVL, implied value, median multiple, top
protocol) and lists the board's five biggest seven-day gainers and losers,
so a reader can see which ranks are solid and which rest on one shaky
multiple. The report is deterministic: the same snapshot in gives the same
bytes out, and `main.ts` refuses to write it if any range fails to contain
its own value or the categories fail to cover the board.

---

<sub>Entered on [make.fun](https://make.fun/?ref=jt3x9s7h&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
