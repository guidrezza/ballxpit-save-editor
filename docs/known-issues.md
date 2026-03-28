# Known Issues

This project now has two supported surfaces:

- a static browser editor that runs entirely client-side
- a Python command-line interface

The browser editor now uses researched row guardrails for documented characters, while the CLI is still the lower-level tool.

## The Real In-Game Offer Logic Is Still Unresolved

The biggest unanswered question is how BALL x PIT actually generates harvest-upgrade offers in-game.

What we know:

- the game has runtime methods named `CanAddHarvestUpgrade`, `ShouldGainHarvestUpgrade`, `GetHarvestRerollCost`, `PopulateUpgrades`, and `SelectHarvestUpgrade`
- the runtime also tracks `_availHarvestUpgs` and reroll behavior
- that strongly suggests the game first builds a legal pool, then offers a smaller set of choices from that pool

What we do **not** know yet:

- the exact legal pool for each character
- whether the visible offer is random, weighted, or both
- the exact level checkpoints for every harvest-upgrade choice beyond the documented `3`, `6`, `10` rows now used in the browser editor
- how hidden per-upgrade tiers should be interpreted in all cases

## Current Editing Guardrail

Until the game logic is decoded more completely, the browser editor only enables documented character trees.

That means:

- documented rows unlock at levels `3`, `6`, and `10`
- each unlocked row exposes only its two researched choices
- unknown characters stay read-only in the browser editor
- `False Messiah` stays visible but non-editable

This is intentionally conservative. It avoids pretending the project knows undocumented trees when it does not.

## Hidden Harvest Upgrade Tiers Exist In The Save

The save stores each harvest upgrade as a `HarvestUpgradeInst` with its own `Lvl` field.

Observed examples from development data:

- `Physicist`: `Builder 3`, `Gold Digger 1`, `Time Keeper 1`
- `Juggler`: `Sprinter 3`, `Gold Digger 1`, `Builder 1`
- `Empty Nester`: `Sprinter 2`, `Wheat Master 1`, `Wood Master 1`

That means the save format contains more than a flat list of distinct skill names.

Current limitation:

- the browser editor now enforces documented row choices, but it still does **not** fully model every meaning of the hidden per-upgrade `Lvl` values
- the CLI does **not** yet mirror the browser editor's row-based guardrails

## Save Data Evidence So Far

From the development save used during reverse-engineering:

| Character levels observed | Stored upgrade nodes |
| --- | --- |
| Below 3 | 0 |
| 3-5 | 1 |
| 6-9 | 2 |
| 10+ | 3 |

This matches the current browser-editor model for documented characters, but the full in-game offer generator is still not completely decoded.

## Practical Advice

Until the underlying game logic is better understood:

- disable Steam Cloud before replacing files
- keep manual backups
- prefer small edits
- verify the result in-game before making more changes
- treat the documented row table as a practical guardrail, not as a full emulation of the game's systems
