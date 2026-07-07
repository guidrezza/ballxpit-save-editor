# Harvest Upgrade Pair Research

Working reference for the researched harvest-upgrade rows shown on character pages.

> [!IMPORTANT]
> This document is retained as historical research.
> The browser editor no longer enforces these per-character row pairs; editable characters can now choose any supported harvest skill.

## Current Working Model

- Documented harvest characters appear to have up to `3` harvest rows.
- Row unlock levels are currently modeled as `3`, `6`, and `10`.
- Each unlocked row offers exactly `2` choices.
- House upgrades are intentionally ignored here.
- `False Messiah` is a visible special character with no harvest editing.

## Documented Harvest Trees

| Character | Level 3 row | Level 6 row | Level 10 row | Status |
| --- | --- | --- | --- | --- |
| Warrior | `Wood Master` or `Stonepiercer` | `Long Sickle` or `Wheat Harvester` | `Stonepiercer` or `Time Keeper` | Historical research |
| The Itchy Finger | `Sprinter` or `Long Sickle` | `Demolitionist` or `Wheat Harvester` | `Woodpecker` or `Stonepiercer` | Documented from user-provided tree |
| The Repentant | `Demolitionist` or `Stone Master` | `Wood Master` or `Wheat Master` | `Builder` or `Wheat Harvester` | Historical research |
| The Cohabitants | `Builder` or `Time Keeper` | `Stonepiercer` or `Woodpecker` | `Sprinter` or `Wheat Harvester` | Historical research |
| The Cogitator | `Builder` or `Time Keeper` | `Time Keeper` or `Stonepiercer` | `Sprinter` or `Wheat Harvester` | Historical research |
| The Embedded | `Demolitionist` or `Stone Master` | `Wood Master` or `Wheat Master` | `Builder` or `Wheat Harvester` | Historical research |
| The Juggler | `Wheat Harvester` or `Sprinter` | `Sprinter` or `Stonepiercer` | `Wheat Master` or `Wheat Harvester` | Historical research |
| The Empty Nester | `Wheat Harvester` or `Wheat Master` | `Sprinter` or `Time Keeper` | `Wood Master` or `Wheat Harvester` | Historical research |
| The Radical | `Sprinter` or `Long Sickle` | `Demolitionist` or `Forester` | `Woodpecker` or `Wheat Harvester` | Historical research |

## Currently Unknown

The following characters do not yet have a documented harvest tree in this project. They are no longer read-only solely because their tree is unknown:

- Shade
- Shieldbearer
- Spendthrift
- Flagellant
- Makeshift Sisyphus
- Physicist
- Tactician
- Falconer
- Carouser
- Any future or renamed character slots not listed in the table above

## Notes From Development Save Comparison

- Several characters in the development save currently store combinations that do **not** fit the researched rows above.
- That is one reason the editor now avoids enforcing these row pairs as hard rules.
- Repeated skill names across different rows appear to be real in the research data, so the editor no longer assumes every unlocked row must resolve to a distinct skill name.

## Engine Evidence Found In Local Game Files

The following names were recovered from `Balls_Data/il2cpp_data/Metadata/global-metadata.dat` and related asset files:

- `ShouldGainHarvestUpgrade`
- `CanAddHarvestUpgrade`
- `HasHarvestUpgrade`
- `GetHarvestUpgrade`
- `GetHarvestUpgradeLvl`
- `AddHarvestUpgrade`
- `GetHarvestUpgradeBonusAmt`
- `GetHarvestRerollCost`
- `SelectHarvestUpgrade`
- `PopulateUpgrades`
- `OnRerollClicked`
- `_availHarvestUpgs`
- `HarvestUpgradeBtns`
- `HarvestDisplayItems`
- `NumLvlUpChoices`
- `LvlUpChoiceType`
- `UpgradeChoice`
- `ChoiceIdx`
- `kCharToAddHarvestUpgrade`

These names strongly support the following working interpretation:

1. The game decides whether a harvest-upgrade pick should appear.
2. It builds a legal pool of harvest upgrades for the character.
3. It presents a smaller choice set from that pool.
4. It supports rerolling the offered set.

## Harvest Upgrade Enum Names Recovered From Metadata

The internal enum names match the current editor's visible harvest upgrades closely:

| Internal enum name | Current editor label |
| --- | --- |
| `kFasterWheat` | `Wheat Harvester` |
| `kFasterWood` | `Forester` |
| `kFasterStone` | `Demolitionist` |
| `kWheatRange` | `Long Sickle` |
| `kPierceWood` | `Woodpecker` |
| `kPierceStone` | `Stonepiercer` |
| `kPierceBuildings` | `Builder` |
| `kExtraHarvestLength` | `Time Keeper` |
| `kHarvestSpeed` | `Sprinter` |
| `kWheatTime` | `Wheat Master` |
| `kWoodTime` | `Wood Master` |
| `kStoneTime` | `Stone Master` |
| `kExtraGoldMined` | `Gold Digger` |

## False Messiah Note

Local asset strings also show:

- `Influencer`
- `The False Messiah`

This lines up with the current assumption that the special False Messiah slot exists in the shipped content, but is not a normal harvest-capable character. The editor currently treats that slot as visible but non-editable.

## Next Targets

Best next characters to confirm from live game pages or screenshots:

- The Shade
- The Shieldbearer
- The Spendthrift
- The Physicist
- The Tactician
- The Falconer
- The Carouser
