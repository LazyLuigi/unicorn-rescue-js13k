# Wavedash integration, prepared but disabled

The code for the 10 achievements and the 3 leaderboards ships inside the js13k
ZIP. The SDK is provided by the Wavedash host: the game downloads no SDK and no
external resource.

**No Wavedash initialization runs by default.** The game requires both
`self.URW` and `self.Wavedash` before keeping a reference to the SDK. The first
one is a local activation lock, absent from the delivered HTML. It lets the tests
exercise the code with a stand-in; it will only be enabled once the platform
configuration is approved.

No `wavedash init`, login, game creation, trophy import, deployment or
publication has been performed for this integration.

## Build output

`npm run build` produces `dist/wavedash/index.html`, an untouched copy of
`src/index.html`, without minification or Roadroller. `wavedash.toml` points to
that folder and that entry point, and holds the game identifier. The activation
lock stays disabled in both deliverables.

## Achievements

[`achievements.json`](achievements.json) is prepared in the Developer Portal
import format. The short identifiers stay fixed; the public names and
descriptions live in the JSON, outside the 13k budget.

| Identifier | Name | Trigger |
|---|---|---|
| RESCUE | First Rescue | Free a first prison |
| BLADE | Horn Awakened | Activate Horn Blade |
| BLAST | Rainbow Unleashed | Activate Rainbow Blast |
| SAVE | Last Second | Use a power during the last-chance window |
| COMBO | Chain Reaction | Reach 10 destructions in the same combo |
| GRAZE | Living on the Edge | Graze 30 distinct projectiles in one run |
| GIANT | Giant Slayer | Defeat a mini-boss |
| WIN | Island Saved | Defeat the final boss |
| ALL | Nobody Left Behind | Win with all 43 unicorns |
| ACE | Ace Pilot | Win with all three lives; absorbed hits and last-chance saves are allowed |

Once enabled, the integration waits for the `requestStats()` response before
triggering the trophies already earned during that load. `getAchievement()`
avoids repeated submissions. Trophies must exist in the portal to be recognized;
the local JSON does not create them on the platform.

## Leaderboards

[`leaderboards.json`](leaderboards.json) describes the planned configuration;
this file is not presented as a Wavedash import format.

| Identifier | Name | Eligibility | Ranking |
|---|---|---|---|
| high-score | High Score | Win or loss | Best score, descending |
| fastest-rescue | Fastest Rescue | Win | Best time in milliseconds, ascending |
| perfect-rescue-score | Perfect Rescue Score | Win with exactly 43 unicorns | Best score, descending |

The timer counts simulation steps after the descent. It includes hitstop and
respawns; it excludes the briefing, the descent and pauses. Each result is
captured at the end of the run, before the network promises, and only the
personal best is kept.

The final boss keeps its reinforcements and the existing scoring behavior: no
balance change comes with this integration.

## Local validation

```bash
npm run test:wavedash
npm run test:wavedash:browser  # Node >= 20, Chromium and Firefox installed
```

The first test exercises the real game events, then their Terser-minified
version: thresholds, ten trophies, leaderboard eligibility, pauses, restart
before the network response, deferred stats loading, deduplication and 19 SDK
failure cases. The second one tests the extracted ZIP and the raw Wavedash HTML
with a fake SDK in both browsers, first without activation (zero calls), then
with local activation to validate the loading calls and the score submission.
None of these tests touches the platform.

References: [SDK](https://docs.wavedash.com/sdk/setup),
[achievements](https://docs.wavedash.com/sdk/achievements),
[leaderboards](https://docs.wavedash.com/sdk/leaderboards).
