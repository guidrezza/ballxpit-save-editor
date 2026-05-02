# Known Issues

This project now has two supported surfaces:

- a static browser editor that runs entirely client-side
- a Python command-line interface

The browser editor now uses a broad any-skill picker with simple saved-slot and level guardrails, while the CLI is still the lower-level tool.

## The Real In-Game Offer Logic Is Still Unresolved

The biggest unanswered question is how BALL x PIT actually generates harvest-upgrade offers in-game.

What we know:

- the game has runtime methods named `CanAddHarvestUpgrade`, `ShouldGainHarvestUpgrade`, `GetHarvestRerollCost`, `PopulateUpgrades`, and `SelectHarvestUpgrade`
- the runtime also tracks `_availHarvestUpgs` and reroll behavior
- that strongly suggests the game first builds a legal pool, then offers a smaller set of choices from that pool

What we do **not** know yet:

- the exact legal pool for each character
- whether the visible offer is random, weighted, or both
- the exact level checkpoints for every harvest-upgrade choice beyond the observed `3`, `6`, `10` saved-slot pattern
- how hidden per-upgrade tiers should be interpreted in all cases

## Current Editing Guardrail

Until the game logic is decoded more completely, the browser editor avoids pretending it knows the real per-character offer pool.

That means:

- any editable character can choose any supported harvest skill
- normal mode respects the observed level slot counts at levels `3`, `6`, and `10`
- Unlocked mode bypasses the level check for users who knowingly want to cheat
- the editor does not add or remove harvest skill nodes; it only rewrites existing saved slots
- `False Messiah` stays visible but non-editable

This is intentionally simple. It keeps the tool useful as an experimental portfolio project without encoding half-researched per-character restrictions.

## Hidden Harvest Upgrade Tiers Exist In The Save

The save stores each harvest upgrade as a `HarvestUpgradeInst` with its own `Lvl` field.

Observed examples from development data:

- `Physicist`: `Builder 3`, `Gold Digger 1`, `Time Keeper 1`
- `Juggler`: `Sprinter 3`, `Gold Digger 1`, `Builder 1`
- `Empty Nester`: `Sprinter 2`, `Wheat Master 1`, `Wood Master 1`

That means the save format contains more than a flat list of distinct skill names.

Current limitation:

- the browser editor rewrites skill types, but it still does **not** fully model every meaning of the hidden per-upgrade `Lvl` values
- the CLI does **not** yet mirror every browser editor convenience

## Save Data Evidence So Far

From the development save used during reverse-engineering:

| Character levels observed | Stored upgrade nodes |
| --- | --- |
| Below 3 | 0 |
| 3-5 | 1 |
| 6-9 | 2 |
| 10+ | 3 |

This matches the browser editor's normal-mode slot guardrail, but the full in-game offer generator is still not completely decoded.

## Practical Advice

Until the underlying game logic is better understood:

- disable Steam Cloud before replacing files
- keep manual backups
- prefer small edits
- verify the result in-game before making more changes
- treat Unlocked mode as cheat territory and verify the result in-game before continuing
