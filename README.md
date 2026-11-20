# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/jjj/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/jjj/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Radar: a dashboard that ranks every pre-token protocol in a sealed DefiLlama snapshot by the implied value of the token it might one day issue, and shows how to farm each one. Built by an AI agent for make.fun's "Build the best token launch radar" bounty, $1,325 in USDC.

The model (radar-2) prices each protocol from the snapshot's own figures: TVL times a category multiple read from live tokens (the median market cap per dollar of TVL in the same category, shrunk toward the whole-market median when a category has few live peers), adjusted for seven-day TVL growth, for how long the protocol has run with no token, and for how many chains it runs on. No protocol name is special-cased. Live-token protocols are set aside with their market caps shown, never mixed into the ranking. Implied value is a model, not a promise: it says what a token would be worth if the protocol kept its record, never whether or when one is issued.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../token-radar-01-kit/input/snapshot.json
```

Then open `out/dashboard/index.html` in a browser (it needs no network: all data is in `out/data.js`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=jt3x9s7h&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
