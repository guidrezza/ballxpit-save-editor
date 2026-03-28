#!/usr/bin/env python3

import argparse
import json
import os
import re
import shutil
import struct
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BACKUP_ROOT = PROJECT_ROOT / "backups"
DEFAULT_RUNTIME_ROOT = PROJECT_ROOT / "runtime"
SAVE_FILE_PATTERNS = ("*.yankai", "*.balls", "*.vdf")
SAVE_DIR_SUFFIX = Path("AppData") / "LocalLow" / "Kenny Sun" / "BALL x PIT"
PRIMARY_SAVE_NAME = "meta1.yankai"
MIRROR_SAVE_NAMES = ("meta1_backup.yankai",)


LEGACY_CHAR_NAMES_BY_ID = {
    0: "Recaller",
    1: "ItchyFinger",
    2: "Tunneller",
    3: "Tiptoer",
    4: "Cogitator",
    5: "Tactician",
    6: "Spendthrift",
    7: "Embedded",
    8: "RadicalAI",
    9: "EmptyNester",
    10: "Shade",
    11: "Cohabitants",
    12: "Physicist",
    13: "BrickHead",
    14: "Sisyphus",
    15: "Flagellant",
    16: "Wimp",
    17: "PackRat",
    18: "Falconer",
    19: "Carouser",
    20: "Backpacker",
    21: "Influencer",
    22: "Default",
}

CHAR_DISPLAY_BY_ID = {
    0: "Warrior",
    1: "Repentant",
    2: "Keyfinger",
    3: "Tiptoer",
    4: "Cogitator (Unused)",
    5: "Cogitator",
    6: "Tactician",
    7: "Spendthrift",
    8: "Embedded",
    9: "Radical",
    10: "Empty Nester",
    11: "Shade",
    12: "Cohabitants",
    13: "Physicist",
    14: "Shieldbearer",
    15: "Makeshift Sisyphus",
    16: "Flagellant",
    17: "Juggler",
    18: "Falconer (Unused)",
    19: "Falconer",
    20: "Carousel",
    21: "False Messiah",
    22: "Default (Unused)",
}

UNUSED_CHAR_TYPE_IDS = {3, 4, 18, 22}
NO_HARVEST_CHAR_TYPE_IDS = {21}

CHAR_ALIASES_BY_ID = {
    0: {"warrior", "knight", "recaller"},
    1: {"repentant"},
    2: {"keyfinger", "itchyfinger", "itchy finger"},
    3: {"tiptoer", "tip toer"},
    4: {"cogitatorunused", "unusedcogitator"},
    5: {"cogitator"},
    6: {"tactician"},
    7: {"spendthrift"},
    8: {"embedded"},
    9: {"radical", "radicalai", "radical ai"},
    10: {"emptynester", "empty nester"},
    11: {"shade"},
    12: {"cohabitants"},
    13: {"physicist"},
    14: {"shieldbearer", "shield bearer"},
    15: {"makeshiftsisyphus", "makeshift sisyphus", "sisyphus"},
    16: {"flagellant"},
    17: {"juggler", "giggler"},
    18: {"falconerunused", "unusedfalconer"},
    19: {"falconer"},
    20: {"carousel", "carouser"},
    21: {"falsemessiah", "false messiah", "messiah", "influencer"},
    22: {"defaultunused", "unuseddefault", "default"},
}

UPGRADE_DISPLAY_BY_ID = {
    1: "Wheat Harvester",
    2: "Forester",
    3: "Demolitionist",
    4: "Long Sickle",
    5: "Woodpecker",
    6: "Stonepiercer",
    8: "Time Keeper",
    9: "Sprinter",
    10: "Wheat Master",
    11: "Wood Master",
    12: "Stone Master",
    13: "Builder",
    17: "Gold Digger",
}

UPGRADE_INTERNAL_BY_ID = {
    1: "WheatHarvester",
    2: "Forester",
    3: "Demolitionist",
    4: "LongSickle",
    5: "Woodpecker",
    6: "Stonepiercer",
    8: "TimeKeeper",
    9: "Sprinter",
    10: "WheatMaster",
    11: "WoodMaster",
    12: "StoneMaster",
    13: "Builder",
    17: "GoldDigger",
}

ENTRY_NAMES = {
    0x01: "NamedStartOfReferenceNode",
    0x02: "UnnamedStartOfReferenceNode",
    0x03: "NamedStartOfStructNode",
    0x04: "UnnamedStartOfStructNode",
    0x05: "EndOfNode",
    0x06: "StartOfArray",
    0x07: "EndOfArray",
    0x08: "PrimitiveArray",
    0x09: "NamedInternalReference",
    0x0A: "UnnamedInternalReference",
    0x0B: "NamedExternalReferenceByIndex",
    0x0C: "UnnamedExternalReferenceByIndex",
    0x0D: "NamedExternalReferenceByGuid",
    0x0E: "UnnamedExternalReferenceByGuid",
    0x0F: "NamedSByte",
    0x10: "UnnamedSByte",
    0x11: "NamedByte",
    0x12: "UnnamedByte",
    0x13: "NamedShort",
    0x14: "UnnamedShort",
    0x15: "NamedUShort",
    0x16: "UnnamedUShort",
    0x17: "NamedInt",
    0x18: "UnnamedInt",
    0x19: "NamedUInt",
    0x1A: "UnnamedUInt",
    0x1B: "NamedLong",
    0x1C: "UnnamedLong",
    0x1D: "NamedULong",
    0x1E: "UnnamedULong",
    0x1F: "NamedFloat",
    0x20: "UnnamedFloat",
    0x21: "NamedDouble",
    0x22: "UnnamedDouble",
    0x23: "NamedDecimal",
    0x24: "UnnamedDecimal",
    0x25: "NamedChar",
    0x26: "UnnamedChar",
    0x27: "NamedString",
    0x28: "UnnamedString",
    0x29: "NamedGuid",
    0x2A: "UnnamedGuid",
    0x2B: "NamedBoolean",
    0x2C: "UnnamedBoolean",
    0x2D: "NamedNull",
    0x2E: "UnnamedNull",
    0x2F: "TypeName",
    0x30: "TypeID",
    0x31: "EndOfStream",
    0x32: "NamedExternalReferenceByString",
    0x33: "UnnamedExternalReferenceByString",
}

NAMED_VALUE_TAGS = {
    0x09,
    0x0B,
    0x0D,
    0x0F,
    0x11,
    0x13,
    0x15,
    0x17,
    0x19,
    0x1B,
    0x1D,
    0x1F,
    0x21,
    0x23,
    0x25,
    0x27,
    0x29,
    0x2B,
    0x2D,
    0x32,
}

UNNAMED_VALUE_TAGS = {
    0x0A,
    0x0C,
    0x0E,
    0x10,
    0x12,
    0x14,
    0x16,
    0x18,
    0x1A,
    0x1C,
    0x1E,
    0x20,
    0x22,
    0x24,
    0x26,
    0x28,
    0x2A,
    0x2C,
    0x2E,
    0x33,
}


class ParseError(RuntimeError):
    pass


@dataclass
class CharacterRecord:
    index: int
    type_id: int
    legacy_name: str
    display_name: str
    level: int
    unused: bool
    no_harvest: bool
    unlocked: bool
    xp: int
    battles: int
    rerolls: int
    upgrade_ids: list[int]


@dataclass
class SaveBundle:
    save_dir: Path
    primary_save: Path
    mirror_saves: list[Path]
    bundle_files: list[Path]


def normalize_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def titleize_camel(value: str) -> str:
    spaced = re.sub(r"(?<!^)(?=[A-Z])", " ", value)
    return spaced.replace(" A I", " AI")


def build_upgrade_lookup() -> tuple[dict[str, int], dict[int, str], dict[int, str]]:
    lookup: dict[str, int] = {}
    for upgrade_id, internal in UPGRADE_INTERNAL_BY_ID.items():
        display = UPGRADE_DISPLAY_BY_ID[upgrade_id]
        aliases = {
            internal,
            display,
            titleize_camel(internal),
            f"k{internal}",
            str(upgrade_id),
        }
        for alias in aliases:
            lookup[normalize_name(alias)] = upgrade_id
    return lookup, UPGRADE_INTERNAL_BY_ID, UPGRADE_DISPLAY_BY_ID


def build_char_lookup() -> tuple[dict[str, int], dict[int, str], dict[int, str]]:
    lookup: dict[str, int] = {}
    for char_id, display in CHAR_DISPLAY_BY_ID.items():
        aliases = set(CHAR_ALIASES_BY_ID.get(char_id, set()))
        aliases.add(display)
        aliases.add(str(char_id))
        for alias in aliases:
            lookup[normalize_name(alias)] = char_id
    return lookup, LEGACY_CHAR_NAMES_BY_ID, CHAR_DISPLAY_BY_ID


UPGRADE_LOOKUP, UPGRADE_INTERNAL_BY_ID, UPGRADE_DISPLAY_BY_ID = build_upgrade_lookup()
CHAR_LOOKUP, CHAR_LEGACY_BY_ID, CHAR_DISPLAY_BY_ID = build_char_lookup()


def ensure_project_dirs() -> None:
    DEFAULT_BACKUP_ROOT.mkdir(parents=True, exist_ok=True)
    DEFAULT_RUNTIME_ROOT.mkdir(parents=True, exist_ok=True)


def candidate_save_dirs() -> list[Path]:
    candidates: list[Path] = []
    seen: set[str] = set()

    for env_key in ("BALLXPIT_SAVE_DIR", "BALLXPIT_SAVE_PATH"):
        raw = os.environ.get(env_key)
        if not raw:
            continue
        path = Path(raw)
        if path.is_file():
            path = path.parent
        key = str(path)
        if key not in seen:
            seen.add(key)
            candidates.append(path)

    if os.name == "nt":
        roots = []
        user_profile = os.environ.get("USERPROFILE")
        if user_profile:
            roots.append(Path(user_profile))
        roots.append(Path.home())
        for root in roots:
            candidate = root / SAVE_DIR_SUFFIX
            key = str(candidate)
            if key not in seen:
                seen.add(key)
                candidates.append(candidate)
    else:
        home_candidate = Path.home() / SAVE_DIR_SUFFIX
        key = str(home_candidate)
        if key not in seen:
            seen.add(key)
            candidates.append(home_candidate)

        users_root = Path("/mnt/c/Users")
        if users_root.exists():
            for user_dir in sorted(users_root.iterdir()):
                candidate = user_dir / "AppData" / "LocalLow" / "Kenny Sun" / "BALL x PIT"
                key = str(candidate)
                if key not in seen:
                    seen.add(key)
                    candidates.append(candidate)

    return candidates


def looks_like_save_dir(path: Path) -> bool:
    if not path.is_dir():
        return False
    return any(candidate.is_file() for candidate in path.glob("*.yankai"))


def autodetect_save_dir() -> Path | None:
    for candidate in candidate_save_dirs():
        if looks_like_save_dir(candidate):
            return candidate
    return None


def resolve_save_dir(path: Path | None = None) -> Path:
    if path is None:
        detected = autodetect_save_dir()
        if detected is None:
            raise ValueError("Could not automatically detect the BALL x PIT save folder")
        return detected

    candidate = Path(path)
    if candidate.is_file():
        candidate = candidate.parent
    if not looks_like_save_dir(candidate):
        raise ValueError(f"Not a valid BALL x PIT save folder: {candidate}")
    return candidate


def default_primary_save_path() -> Path:
    detected = autodetect_save_dir()
    if detected is None:
        return Path(PRIMARY_SAVE_NAME)
    return detected / PRIMARY_SAVE_NAME


def resolve_save_bundle(path: Path | None = None) -> SaveBundle:
    save_dir = resolve_save_dir(path)
    primary_save = save_dir / PRIMARY_SAVE_NAME
    if not primary_save.is_file():
        primary_candidates = sorted(
            candidate for candidate in save_dir.glob("*.yankai") if candidate.name not in MIRROR_SAVE_NAMES
        )
        if not primary_candidates:
            raise ValueError(f"Could not find a primary save file in {save_dir}")
        primary_save = primary_candidates[0]

    mirror_saves = [save_dir / name for name in MIRROR_SAVE_NAMES if (save_dir / name).is_file() and (save_dir / name) != primary_save]
    bundle_files = collect_save_bundle(primary_save)
    return SaveBundle(
        save_dir=save_dir,
        primary_save=primary_save,
        mirror_saves=mirror_saves,
        bundle_files=bundle_files,
    )


class OdinBinaryParser:
    def __init__(self, data: bytes):
        self.data = data
        self.offset = 0
        self.type_ids: dict[int, str | None] = {}

    def read(self, size: int) -> bytes:
        chunk = self.data[self.offset : self.offset + size]
        if len(chunk) != size:
            raise ParseError(f"Unexpected EOF at offset {self.offset} while reading {size} bytes")
        self.offset += size
        return chunk

    def read_u8(self) -> int:
        return self.read(1)[0]

    def read_i32(self) -> int:
        return struct.unpack("<i", self.read(4))[0]

    def read_i64(self) -> int:
        return struct.unpack("<q", self.read(8))[0]

    def read_f32(self) -> float:
        return struct.unpack("<f", self.read(4))[0]

    def read_f64(self) -> float:
        return struct.unpack("<d", self.read(8))[0]

    def read_string(self) -> str:
        char_size_flag = self.read_u8()
        length = self.read_i32()

        if char_size_flag == 0:
            return self.read(length).decode("latin1")
        if char_size_flag == 1:
            return self.read(length * 2).decode("utf-16le")
        raise ParseError(f"Invalid string char-size flag {char_size_flag} at offset {self.offset}")

    def read_type_entry(self) -> str | None:
        tag = self.read_u8()

        if tag == 0x2E:
            return None

        if tag == 0x30:
            type_id = self.read_i32()
            if type_id not in self.type_ids:
                raise ParseError(f"Missing cached type id {type_id} at offset {self.offset}")
            return self.type_ids[type_id]

        if tag == 0x2F:
            type_id = self.read_i32()
            type_name = self.read_string()
            self.type_ids[type_id] = type_name
            return type_name

        raise ParseError(f"Invalid type entry tag 0x{tag:02x} at offset {self.offset}")

    def read_value(self, tag: int) -> Any:
        if tag in (0x0F, 0x10):
            return struct.unpack("<b", self.read(1))[0]
        if tag in (0x11, 0x12):
            return self.read(1)[0]
        if tag in (0x13, 0x14):
            return struct.unpack("<h", self.read(2))[0]
        if tag in (0x15, 0x16):
            return struct.unpack("<H", self.read(2))[0]
        if tag in (0x17, 0x18, 0x09, 0x0A, 0x0B, 0x0C):
            return self.read_i32()
        if tag in (0x19, 0x1A):
            return struct.unpack("<I", self.read(4))[0]
        if tag in (0x1B, 0x1C):
            return self.read_i64()
        if tag in (0x1D, 0x1E):
            return struct.unpack("<Q", self.read(8))[0]
        if tag in (0x1F, 0x20):
            return self.read_f32()
        if tag in (0x21, 0x22):
            return self.read_f64()
        if tag in (0x23, 0x24):
            return self.read(16)
        if tag in (0x25, 0x26):
            return self.read(2).decode("utf-16le")
        if tag in (0x27, 0x28, 0x32, 0x33):
            return self.read_string()
        if tag in (0x29, 0x2A, 0x0D, 0x0E):
            return self.read(16)
        if tag in (0x2B, 0x2C):
            return self.read(1)[0] == 1
        if tag in (0x2D, 0x2E):
            return None

        raise ParseError(f"Unsupported value tag 0x{tag:02x} at offset {self.offset}")

    def parse_entry(self) -> dict[str, Any]:
        tag = self.read_u8()

        if tag in (0x01, 0x03):
            name = self.read_string()
            type_name = self.read_type_entry()
            node_id = self.read_i32() if tag == 0x01 else None
            values = []
            while self.data[self.offset] != 0x05:
                values.append(self.parse_entry())
            self.offset += 1
            return {"tag": tag, "name": name, "type": type_name, "id": node_id, "values": values}

        if tag in (0x02, 0x04):
            type_name = self.read_type_entry()
            node_id = self.read_i32() if tag == 0x02 else None
            values = []
            while self.data[self.offset] != 0x05:
                values.append(self.parse_entry())
            self.offset += 1
            return {"tag": tag, "name": None, "type": type_name, "id": node_id, "values": values}

        if tag == 0x06:
            length = self.read_i64()
            values = []
            while self.data[self.offset] != 0x07:
                values.append(self.parse_entry())
            self.offset += 1
            return {"tag": tag, "length": length, "values": values}

        if tag == 0x08:
            length = self.read_i32()
            elem_size = self.read_i32()
            raw = self.read(length * elem_size)
            return {"tag": tag, "length": length, "elem_size": elem_size, "raw": raw}

        if tag in NAMED_VALUE_TAGS:
            name = self.read_string()
            return {"tag": tag, "name": name, "value": self.read_value(tag)}

        if tag in UNNAMED_VALUE_TAGS:
            return {"tag": tag, "name": None, "value": self.read_value(tag)}

        if tag == 0x31:
            return {"tag": tag}

        raise ParseError(
            f"Unsupported entry tag 0x{tag:02x} ({ENTRY_NAMES.get(tag, 'unknown')}) at offset {self.offset - 1}"
        )


class OdinBinaryWriter:
    def __init__(self):
        self.parts: list[bytes] = []
        self.type_ids: dict[str | None, int] = {}

    def write(self, data: bytes) -> None:
        self.parts.append(data)

    def write_u8(self, value: int) -> None:
        self.write(bytes((value,)))

    def write_i32(self, value: int) -> None:
        self.write(struct.pack("<i", value))

    def write_i64(self, value: int) -> None:
        self.write(struct.pack("<q", value))

    def write_f32(self, value: float) -> None:
        self.write(struct.pack("<f", value))

    def write_f64(self, value: float) -> None:
        self.write(struct.pack("<d", value))

    def write_string(self, value: str) -> None:
        encoded = value.encode("utf-16le")
        self.write_u8(1)
        self.write_i32(len(value))
        self.write(encoded)

    def write_type_entry(self, type_name: str | None) -> None:
        if type_name is None:
            self.write_u8(0x2E)
            return

        if type_name in self.type_ids:
            self.write_u8(0x30)
            self.write_i32(self.type_ids[type_name])
            return

        type_id = len(self.type_ids)
        self.type_ids[type_name] = type_id
        self.write_u8(0x2F)
        self.write_i32(type_id)
        self.write_string(type_name)

    def write_value(self, tag: int, value: Any) -> None:
        if tag in (0x0F, 0x10):
            self.write(struct.pack("<b", value))
            return
        if tag in (0x11, 0x12):
            self.write(bytes((value,)))
            return
        if tag in (0x13, 0x14):
            self.write(struct.pack("<h", value))
            return
        if tag in (0x15, 0x16):
            self.write(struct.pack("<H", value))
            return
        if tag in (0x17, 0x18, 0x09, 0x0A, 0x0B, 0x0C):
            self.write_i32(value)
            return
        if tag in (0x19, 0x1A):
            self.write(struct.pack("<I", value))
            return
        if tag in (0x1B, 0x1C):
            self.write_i64(value)
            return
        if tag in (0x1D, 0x1E):
            self.write(struct.pack("<Q", value))
            return
        if tag in (0x1F, 0x20):
            self.write_f32(value)
            return
        if tag in (0x21, 0x22):
            self.write_f64(value)
            return
        if tag in (0x23, 0x24, 0x29, 0x2A, 0x0D, 0x0E):
            self.write(value)
            return
        if tag in (0x25, 0x26):
            self.write(str(value).encode("utf-16le"))
            return
        if tag in (0x27, 0x28, 0x32, 0x33):
            self.write_string(value)
            return
        if tag in (0x2B, 0x2C):
            self.write_u8(1 if value else 0)
            return
        if tag in (0x2D, 0x2E):
            return

        raise ParseError(f"Unsupported write value tag 0x{tag:02x}")

    def write_entry(self, entry: dict[str, Any]) -> None:
        tag = entry["tag"]
        self.write_u8(tag)

        if tag in (0x01, 0x03):
            self.write_string(entry["name"])
            self.write_type_entry(entry["type"])
            if tag == 0x01:
                self.write_i32(entry["id"])
            for child in entry["values"]:
                self.write_entry(child)
            self.write_u8(0x05)
            return

        if tag in (0x02, 0x04):
            self.write_type_entry(entry["type"])
            if tag == 0x02:
                self.write_i32(entry["id"])
            for child in entry["values"]:
                self.write_entry(child)
            self.write_u8(0x05)
            return

        if tag == 0x06:
            self.write_i64(entry["length"])
            for child in entry["values"]:
                self.write_entry(child)
            self.write_u8(0x07)
            return

        if tag == 0x08:
            self.write_i32(entry["length"])
            self.write_i32(entry["elem_size"])
            self.write(entry["raw"])
            return

        if tag in NAMED_VALUE_TAGS:
            self.write_string(entry["name"])
            self.write_value(tag, entry["value"])
            return

        if tag in UNNAMED_VALUE_TAGS:
            self.write_value(tag, entry["value"])
            return

        if tag == 0x31:
            return

        raise ParseError(f"Unsupported write entry tag 0x{tag:02x}")

    def finish(self) -> bytes:
        return b"".join(self.parts)


def parse_save(path: Path) -> dict[str, Any]:
    parser = OdinBinaryParser(path.read_bytes())
    root = parser.parse_entry()
    if parser.offset != len(parser.data):
        raise ParseError(f"Trailing bytes remain after parse: offset={parser.offset} size={len(parser.data)}")
    return root


def write_save(root: dict[str, Any]) -> bytes:
    writer = OdinBinaryWriter()
    writer.write_entry(root)
    return writer.finish()


def children_by_name(node: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {child.get("name"): child for child in node.get("values", []) if isinstance(child, dict) and child.get("name")}


def first_array_child(node: dict[str, Any]) -> dict[str, Any]:
    for child in node.get("values", []):
        if isinstance(child, dict) and child.get("tag") == 0x06:
            return child
    raise KeyError(f"No array child found under node {node.get('name') or node.get('type')}")


def get_char_nodes(root: dict[str, Any]) -> list[dict[str, Any]]:
    chars_entry = children_by_name(root)["Chars"]
    return first_array_child(chars_entry)["values"]


def get_upgrade_nodes(char_node: dict[str, Any]) -> list[dict[str, Any]]:
    upgrades_entry = children_by_name(char_node)["HarvestUpgrades"]
    return first_array_child(upgrades_entry)["values"]


def get_named_value(node: dict[str, Any], name: str, default: Any = None) -> Any:
    child = children_by_name(node).get(name)
    if child is None:
        return default
    return child.get("value", default)


def decode_characters(root: dict[str, Any]) -> list[CharacterRecord]:
    records: list[CharacterRecord] = []

    for index, char_node in enumerate(get_char_nodes(root)):
        type_id = int(get_named_value(char_node, "Type", -1))
        upgrade_ids = [int(get_named_value(upgrade_node, "Type", -1)) for upgrade_node in get_upgrade_nodes(char_node)]
        legacy_name = CHAR_LEGACY_BY_ID.get(type_id, f"Unknown_{type_id}")
        display_name = CHAR_DISPLAY_BY_ID.get(type_id, legacy_name)

        records.append(
            CharacterRecord(
                index=index,
                type_id=type_id,
                legacy_name=legacy_name,
                display_name=display_name,
                level=int(get_named_value(char_node, "Lvl", 0)),
                unused=type_id in UNUSED_CHAR_TYPE_IDS,
                no_harvest=type_id in NO_HARVEST_CHAR_TYPE_IDS,
                unlocked=bool(get_named_value(char_node, "IsUnlocked", False)),
                xp=int(get_named_value(char_node, "CurXP", 0)),
                battles=int(get_named_value(char_node, "NumBattles", 0)),
                rerolls=int(get_named_value(char_node, "NumTimesRerolled", 0)),
                upgrade_ids=upgrade_ids,
            )
        )

    return records


def resolve_upgrade(value: str) -> int:
    key = normalize_name(value)
    if key not in UPGRADE_LOOKUP:
        valid = ", ".join(UPGRADE_DISPLAY_BY_ID[upgrade_id] for upgrade_id in sorted(UPGRADE_DISPLAY_BY_ID))
        raise ValueError(f"Unknown upgrade '{value}'. Known upgrades: {valid}")
    return UPGRADE_LOOKUP[key]


def resolve_char(value: str) -> int:
    key = normalize_name(value)
    if key not in CHAR_LOOKUP:
        valid = ", ".join(CHAR_DISPLAY_BY_ID.values())
        raise ValueError(f"Unknown character '{value}'. Known characters: {valid}")
    return CHAR_LOOKUP[key]


def format_upgrade_list(upgrade_ids: list[int]) -> str:
    if not upgrade_ids:
        return "-"
    parts = [UPGRADE_DISPLAY_BY_ID.get(upgrade_id, f"Unknown({upgrade_id})") for upgrade_id in upgrade_ids]
    return ", ".join(parts)


def find_target_character(records: list[CharacterRecord], char_index: int | None, char_type: str | None, from_upgrade: int) -> CharacterRecord:
    if char_index is not None:
        try:
            return records[char_index]
        except IndexError as exc:
            raise ValueError(f"Character index {char_index} is out of range") from exc

    if char_type is not None:
        char_type_id = resolve_char(char_type)
        matches = [record for record in records if record.type_id == char_type_id]
        if not matches:
            raise ValueError(f"No character with type {char_type}")
        return matches[0]

    matches = [record for record in records if from_upgrade in record.upgrade_ids]
    if len(matches) == 1:
        return matches[0]

    if not matches:
        raise ValueError(f"No character currently has {UPGRADE_DISPLAY_BY_ID[from_upgrade]}")

    options = "\n".join(
        f"  index={record.index} char={record.display_name} upgrades={format_upgrade_list(record.upgrade_ids)}"
        for record in matches
    )
    raise ValueError(
        f"More than one character currently has {UPGRADE_DISPLAY_BY_ID[from_upgrade]}. "
        f"Re-run with --char-index or --char-type.\n{options}"
    )


def replace_upgrade(root: dict[str, Any], record: CharacterRecord, from_upgrade: int, to_upgrade: int) -> int:
    char_node = get_char_nodes(root)[record.index]
    replacements = 0

    for upgrade_node in get_upgrade_nodes(char_node):
        fields = children_by_name(upgrade_node)
        type_field = fields.get("Type")
        if type_field is None:
            continue
        if int(type_field["value"]) == from_upgrade:
            type_field["value"] = to_upgrade
            replacements += 1

    return replacements


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "backup"


def collect_save_bundle(path: Path) -> list[Path]:
    files_by_name: dict[str, Path] = {}
    save_dir = path.parent

    for pattern in SAVE_FILE_PATTERNS:
        for candidate in sorted(save_dir.glob(pattern)):
            if candidate.is_file():
                files_by_name[candidate.name] = candidate

    if path.is_file():
        files_by_name[path.name] = path

    return [files_by_name[name] for name in sorted(files_by_name)]


def set_character_upgrades(root: dict[str, Any], record: CharacterRecord, new_upgrade_ids: list[int]) -> None:
    if len(new_upgrade_ids) != len(record.upgrade_ids):
        raise ValueError(
            f"{record.display_name} must keep exactly {len(record.upgrade_ids)} harvest upgrades "
            f"(received {len(new_upgrade_ids)})"
        )

    if len(set(new_upgrade_ids)) != len(new_upgrade_ids):
        raise ValueError(f"{record.display_name} has duplicate upgrades selected")

    char_node = get_char_nodes(root)[record.index]
    upgrade_nodes = get_upgrade_nodes(char_node)
    if len(upgrade_nodes) != len(new_upgrade_ids):
        raise RuntimeError(
            f"Save structure mismatch for {record.display_name}: expected {len(new_upgrade_ids)} upgrade nodes "
            f"but found {len(upgrade_nodes)}"
        )

    for upgrade_node, upgrade_id in zip(upgrade_nodes, new_upgrade_ids):
        if upgrade_id not in UPGRADE_DISPLAY_BY_ID:
            raise ValueError(f"Unknown upgrade id: {upgrade_id}")
        fields = children_by_name(upgrade_node)
        type_field = fields.get("Type")
        if type_field is None:
            raise RuntimeError(f"Malformed upgrade node for {record.display_name}: missing Type field")
        type_field["value"] = int(upgrade_id)


def create_backup_set(
    path: Path,
    backup_root: Path,
    reason: str,
    details: dict[str, Any],
    kind: str = "manual",
) -> Path:
    bundle = resolve_save_bundle(path).bundle_files

    backup_root.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now()
    folder_name = f"{timestamp.strftime('%Y%m%d-%H%M%S')}-{slugify(reason)}"
    backup_dir = backup_root / folder_name
    counter = 1
    while backup_dir.exists():
        counter += 1
        backup_dir = backup_root / f"{folder_name}-{counter:02d}"

    backup_dir.mkdir(parents=True, exist_ok=False)

    manifest_files: list[dict[str, Any]] = []
    for source in bundle:
        destination = backup_dir / source.name
        shutil.copy2(source, destination)
        stat = source.stat()
        manifest_files.append(
            {
                "name": source.name,
                "source_path": str(source),
                "backup_path": str(destination),
                "size": stat.st_size,
                "mtime": datetime.fromtimestamp(stat.st_mtime).isoformat(timespec="seconds"),
            }
        )

    manifest = {
        "created_at": timestamp.isoformat(timespec="seconds"),
        "kind": kind,
        "reason": reason,
        "target_save": str(path),
        "source_directory": str(path.parent),
        "details": details,
        "files": manifest_files,
    }
    (backup_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return backup_dir


def expected_upgrade_ids(upgrade_ids: list[int], from_upgrade: int, to_upgrade: int) -> list[int]:
    return [to_upgrade if upgrade_id == from_upgrade else upgrade_id for upgrade_id in upgrade_ids]


def ensure_verified_upgrade_state(record: CharacterRecord, expected_ids: list[int]) -> None:
    if record.upgrade_ids != expected_ids:
        raise RuntimeError(
            "Verification failed: expected harvest upgrades "
            f"{format_upgrade_list(expected_ids)} but found {format_upgrade_list(record.upgrade_ids)}"
        )


def ensure_verified_character_map(records: list[CharacterRecord], expected_by_index: dict[int, list[int]]) -> None:
    for char_index, expected_ids in expected_by_index.items():
        try:
            record = records[char_index]
        except IndexError as exc:
            raise RuntimeError(f"Verification failed: character index {char_index} no longer exists") from exc
        ensure_verified_upgrade_state(record, expected_ids)


def verify_serialized_bytes(updated: bytes, target_index: int, expected_ids: list[int]) -> CharacterRecord:
    verify_root = OdinBinaryParser(updated).parse_entry()
    verify_record = decode_characters(verify_root)[target_index]
    ensure_verified_upgrade_state(verify_record, expected_ids)
    return verify_record


def verify_serialized_character_map(updated: bytes, expected_by_index: dict[int, list[int]]) -> list[CharacterRecord]:
    verify_root = OdinBinaryParser(updated).parse_entry()
    verify_records = decode_characters(verify_root)
    ensure_verified_character_map(verify_records, expected_by_index)
    return verify_records


def verify_written_save(path: Path, updated: bytes, target_index: int, expected_ids: list[int]) -> CharacterRecord:
    on_disk = path.read_bytes()
    if on_disk != updated:
        raise RuntimeError("Verification failed: bytes read back from disk do not match what was written")

    verify_root = parse_save(path)
    verify_record = decode_characters(verify_root)[target_index]
    ensure_verified_upgrade_state(verify_record, expected_ids)
    return verify_record


def verify_written_character_map(path: Path, updated: bytes, expected_by_index: dict[int, list[int]]) -> list[CharacterRecord]:
    on_disk = path.read_bytes()
    if on_disk != updated:
        raise RuntimeError(f"Verification failed for {path.name}: bytes read back from disk do not match what was written")

    verify_root = parse_save(path)
    verify_records = decode_characters(verify_root)
    ensure_verified_character_map(verify_records, expected_by_index)
    return verify_records


def list_backup_dirs(backup_root: Path) -> list[Path]:
    if not backup_root.exists():
        return []
    return sorted((path for path in backup_root.iterdir() if path.is_dir()), reverse=True)


def load_backup_manifest(backup_dir: Path) -> dict[str, Any] | None:
    manifest_path = backup_dir / "manifest.json"
    if not manifest_path.is_file():
        return None

    return json.loads(manifest_path.read_text(encoding="utf-8"))


def create_baseline_backup(save_dir: Path, backup_root: Path = DEFAULT_BACKUP_ROOT) -> Path:
    ensure_project_dirs()
    bundle = resolve_save_bundle(save_dir)
    return create_backup_set(
        path=bundle.primary_save,
        backup_root=backup_root,
        reason="baseline-save-backup",
        kind="baseline",
        details={
            "save_dir": str(bundle.save_dir),
            "primary_save": str(bundle.primary_save),
            "mirror_saves": [str(path) for path in bundle.mirror_saves],
        },
    )


def restore_backup_set(backup_dir: Path, destination_dir: Path | None = None) -> list[Path]:
    manifest = load_backup_manifest(backup_dir)
    if manifest is None:
        raise ValueError(f"Backup is missing a manifest: {backup_dir}")

    if destination_dir is None:
        destination_dir = Path(manifest["source_directory"])
    destination_dir.mkdir(parents=True, exist_ok=True)

    restored: list[Path] = []
    for file_info in manifest.get("files", []):
        source = backup_dir / file_info["name"]
        if not source.is_file():
            raise RuntimeError(f"Backup is missing file {file_info['name']}")
        target = destination_dir / file_info["name"]
        shutil.copy2(source, target)
        restored.append(target)

    return restored


def latest_baseline_backup(backup_root: Path = DEFAULT_BACKUP_ROOT) -> Path | None:
    for backup_dir in list_backup_dirs(backup_root):
        manifest = load_backup_manifest(backup_dir)
        if manifest and manifest.get("kind") == "baseline":
            return backup_dir
    return None


def character_is_editable(record: CharacterRecord) -> bool:
    return record.unlocked and not record.unused and not record.no_harvest and record.xp > 0 and bool(record.upgrade_ids)


def character_disabled_reason(record: CharacterRecord) -> str | None:
    if record.no_harvest:
        return "Special character"
    if record.xp <= 0:
        return "0 XP"
    if not record.unlocked:
        return "Locked"
    if record.unused:
        return "Unused slot"
    if not record.upgrade_ids:
        return "No harvest upgrades"
    return None


def normalize_selection_map(selection_by_index: dict[str | int, list[int | str]]) -> dict[int, list[int]]:
    normalized: dict[int, list[int]] = {}
    for raw_key, raw_values in selection_by_index.items():
        char_index = int(raw_key)
        normalized[char_index] = [int(value) for value in raw_values]
    return normalized


def apply_character_respecs(
    save_dir: Path,
    selection_by_index: dict[str | int, list[int | str]],
    backup_root: Path = DEFAULT_BACKUP_ROOT,
    baseline_backup_dir: Path | None = None,
) -> dict[str, Any]:
    ensure_project_dirs()
    bundle = resolve_save_bundle(save_dir)
    normalized_selection = normalize_selection_map(selection_by_index)

    if baseline_backup_dir is not None and not baseline_backup_dir.is_dir():
        raise ValueError(f"Baseline backup does not exist: {baseline_backup_dir}")

    root = parse_save(bundle.primary_save)
    records = decode_characters(root)
    record_by_index = {record.index: record for record in records}

    expected_by_index: dict[int, list[int]] = {}
    changes: list[dict[str, Any]] = []
    for char_index, selected_ids in normalized_selection.items():
        if char_index not in record_by_index:
            raise ValueError(f"Character index {char_index} is out of range")
        record = record_by_index[char_index]
        if not character_is_editable(record):
            raise ValueError(f"{record.display_name} cannot be edited ({character_disabled_reason(record)})")

        if len(selected_ids) != len(record.upgrade_ids):
            raise ValueError(
                f"{record.display_name} must keep {len(record.upgrade_ids)} upgrades selected "
                f"(received {len(selected_ids)})"
            )

        if len(set(selected_ids)) != len(selected_ids):
            raise ValueError(f"{record.display_name} has duplicate upgrades selected")

        for upgrade_id in selected_ids:
            if int(upgrade_id) not in UPGRADE_DISPLAY_BY_ID:
                raise ValueError(f"{record.display_name} contains unknown upgrade id {upgrade_id}")

        selected_ids = [int(upgrade_id) for upgrade_id in selected_ids]
        if selected_ids == record.upgrade_ids:
            continue

        set_character_upgrades(root, record, selected_ids)
        expected_by_index[record.index] = selected_ids
        changes.append(
            {
                "index": record.index,
                "name": record.display_name,
                "before": list(record.upgrade_ids),
                "after": list(selected_ids),
                "before_names": [UPGRADE_DISPLAY_BY_ID[upgrade_id] for upgrade_id in record.upgrade_ids],
                "after_names": [UPGRADE_DISPLAY_BY_ID[upgrade_id] for upgrade_id in selected_ids],
            }
        )

    if not changes:
        raise ValueError("No character changes were selected")

    updated = write_save(root)
    verify_serialized_character_map(updated, expected_by_index)

    staging_dir = DEFAULT_RUNTIME_ROOT / "staging" / datetime.now().strftime("%Y%m%d-%H%M%S")
    staging_dir.mkdir(parents=True, exist_ok=True)
    staging_primary = staging_dir / bundle.primary_save.name
    staging_primary.write_bytes(updated)
    verify_written_character_map(staging_primary, updated, expected_by_index)

    prewrite_backup = create_backup_set(
        path=bundle.primary_save,
        backup_root=backup_root,
        reason="prewrite-save-edit",
        kind="prewrite",
        details={
            "save_dir": str(bundle.save_dir),
            "baseline_backup_dir": str(baseline_backup_dir) if baseline_backup_dir else None,
            "changes": changes,
        },
    )

    written_files: list[Path] = []
    try:
        write_targets = [bundle.primary_save, *bundle.mirror_saves]
        for target in write_targets:
            target.write_bytes(updated)
            verify_written_character_map(target, updated, expected_by_index)
            written_files.append(target)
    except Exception:
        restore_backup_set(prewrite_backup, bundle.save_dir)
        raise

    return {
        "backup_dir": str(prewrite_backup),
        "staging_dir": str(staging_dir),
        "written_files": [str(path) for path in written_files],
        "changes": changes,
    }


def list_characters_command(path: Path, show_all: bool) -> int:
    bundle = resolve_save_bundle(path)
    root = parse_save(bundle.primary_save)
    records = decode_characters(root)

    print(f"Save: {bundle.primary_save}")
    print()
    for record in records:
        if record.unused and not show_all:
            continue
        print(
            f"[{record.index:02d}] {record.display_name} "
            f"(type={record.type_id}, legacy={record.legacy_name}, level={record.level}, unlocked={record.unlocked}, "
            f"xp={record.xp}, battles={record.battles}, rerolls={record.rerolls})"
        )
        print(f"     Harvest upgrades: {format_upgrade_list(record.upgrade_ids)}")

    return 0


def list_upgrades_command() -> int:
    for upgrade_id in sorted(UPGRADE_DISPLAY_BY_ID):
        print(f"[{upgrade_id:02d}] {UPGRADE_DISPLAY_BY_ID[upgrade_id]} (internal={UPGRADE_INTERNAL_BY_ID[upgrade_id]})")
    return 0


def replace_upgrade_command(
    path: Path,
    char_index: int | None,
    char_type: str | None,
    from_name: str,
    to_name: str,
    dry_run: bool,
    backup_root: Path,
) -> int:
    from_upgrade = resolve_upgrade(from_name)
    to_upgrade = resolve_upgrade(to_name)
    if from_upgrade == to_upgrade:
        raise ValueError("The replacement upgrade must be different from the current upgrade")

    bundle = resolve_save_bundle(path)
    path = bundle.primary_save
    root = parse_save(path)
    records = decode_characters(root)
    target = find_target_character(records, char_index, char_type, from_upgrade)
    before_ids = list(target.upgrade_ids)
    if to_upgrade in before_ids:
        raise ValueError(
            f"{target.display_name} already has {UPGRADE_DISPLAY_BY_ID[to_upgrade]}. "
            "Respecs must keep the same number of distinct harvest upgrades."
        )

    replacements = replace_upgrade(root, target, from_upgrade, to_upgrade)
    if replacements == 0:
        raise ValueError(
            f"{target.display_name} does not currently have {UPGRADE_DISPLAY_BY_ID[from_upgrade]}."
        )

    expected_ids = expected_upgrade_ids(before_ids, from_upgrade, to_upgrade)
    updated = write_save(root)
    verify_serialized_bytes(updated, target.index, expected_ids)

    print(f"Target character: [{target.index}] {target.display_name} (legacy={target.legacy_name})")
    print(f"Replacing: {UPGRADE_DISPLAY_BY_ID[from_upgrade]} -> {UPGRADE_DISPLAY_BY_ID[to_upgrade]}")
    print(f"Replacements made: {replacements}")
    print(f"Expected upgrades after respec: {format_upgrade_list(expected_ids)}")

    if dry_run:
        print("Dry run only: no file was written and no backup set was created.")
        return 0

    backup_dir = create_backup_set(
        path=path,
        backup_root=backup_root,
        reason=f"replace-upgrade-{target.display_name}-{UPGRADE_DISPLAY_BY_ID[from_upgrade]}-to-{UPGRADE_DISPLAY_BY_ID[to_upgrade]}",
        details={
            "character_index": target.index,
            "character_type_id": target.type_id,
            "character_name": target.display_name,
            "legacy_name": target.legacy_name,
            "from_upgrade": UPGRADE_DISPLAY_BY_ID[from_upgrade],
            "to_upgrade": UPGRADE_DISPLAY_BY_ID[to_upgrade],
            "before_upgrades": [UPGRADE_DISPLAY_BY_ID.get(upgrade_id, str(upgrade_id)) for upgrade_id in before_ids],
            "after_upgrades": [UPGRADE_DISPLAY_BY_ID.get(upgrade_id, str(upgrade_id)) for upgrade_id in expected_ids],
        },
    )

    try:
        path.write_bytes(updated)
        verify_written_save(path, updated, target.index, expected_ids)
    except Exception:
        backup_copy = backup_dir / path.name
        if backup_copy.is_file():
            shutil.copy2(backup_copy, path)
        raise

    print(f"Backup set written: {backup_dir}")
    print(f"Verified on-disk save: {path}")
    return 0


def verify_roundtrip_command(path: Path) -> int:
    bundle = resolve_save_bundle(path)
    path = bundle.primary_save
    original = path.read_bytes()
    root = parse_save(path)
    rewritten = write_save(root)
    if original == rewritten:
        print("Roundtrip OK: rewritten bytes match the original file exactly.")
        return 0

    print(f"Roundtrip mismatch: original={len(original)} bytes rewritten={len(rewritten)} bytes", file=sys.stderr)
    return 1


def list_backups_command(backup_root: Path) -> int:
    backups = list_backup_dirs(backup_root)
    print(f"Backup root: {backup_root}")
    print()

    if not backups:
        print("No backups found.")
        return 0

    for backup_dir in backups:
        manifest = load_backup_manifest(backup_dir)
        if manifest is None:
            print(f"{backup_dir.name} (no manifest)")
            continue

        details = manifest.get("details", {})
        change = (
            f"{details.get('character_name', 'Unknown')} "
            f"{details.get('from_upgrade', '?')} -> {details.get('to_upgrade', '?')}"
        )
        print(
            f"{backup_dir.name} | created={manifest.get('created_at', '?')} "
            f"| files={len(manifest.get('files', []))} | change={change}"
        )

    return 0


def delete_backups_command(backup_root: Path, delete_all: bool, keep: int | None, dry_run: bool) -> int:
    backups = list_backup_dirs(backup_root)
    if not backups:
        print(f"No backups found in {backup_root}")
        return 0

    if delete_all:
        targets = backups
    else:
        assert keep is not None
        targets = backups[keep:]

    if not targets:
        print("No backups matched the deletion rule.")
        return 0

    for backup_dir in targets:
        print(f"{'Would delete' if dry_run else 'Deleting'}: {backup_dir}")
        if not dry_run:
            shutil.rmtree(backup_dir)

    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Ball x Pit save editor for harvest upgrades / character respecs.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    default_save = default_primary_save_path()

    list_chars = subparsers.add_parser("list-chars", help="List characters and their current harvest upgrades.")
    list_chars.add_argument("--save", type=Path, default=default_save, help=f"Save path or folder (default: {default_save})")
    list_chars.add_argument("--all", action="store_true", help="Include unused/internal character slots.")

    list_upgrades = subparsers.add_parser("list-upgrades", help="List harvest upgrades and their internal ids.")
    list_upgrades.set_defaults(command="list-upgrades")

    replace = subparsers.add_parser("replace-upgrade", help="Replace a harvest upgrade on a specific character.")
    replace.add_argument("--save", type=Path, default=default_save, help=f"Save path or folder (default: {default_save})")
    replace.add_argument("--char-index", type=int, help="Character index from list-chars output.")
    replace.add_argument("--char-type", help="Character display name, for example Warrior or Tactician.")
    replace.add_argument("--from", dest="from_name", required=True, help="Current upgrade, for example Stonepiercer.")
    replace.add_argument("--to", dest="to_name", required=True, help="Replacement upgrade, for example Woodpecker.")
    replace.add_argument("--dry-run", action="store_true", help="Preview the change without writing the file.")
    replace.add_argument(
        "--backup-dir",
        type=Path,
        default=DEFAULT_BACKUP_ROOT,
        help=f"Persistent backup folder (default: {DEFAULT_BACKUP_ROOT})",
    )

    verify = subparsers.add_parser("verify-roundtrip", help="Parse and re-serialize the file and verify byte-exact roundtrip.")
    verify.add_argument("--save", type=Path, default=default_save, help=f"Save path or folder (default: {default_save})")

    list_backups = subparsers.add_parser("list-backups", help="List saved backup sets.")
    list_backups.add_argument(
        "--backup-dir",
        type=Path,
        default=DEFAULT_BACKUP_ROOT,
        help=f"Backup folder to inspect (default: {DEFAULT_BACKUP_ROOT})",
    )

    delete_backups = subparsers.add_parser("delete-backups", help="Delete saved backup sets.")
    delete_backups.add_argument(
        "--backup-dir",
        type=Path,
        default=DEFAULT_BACKUP_ROOT,
        help=f"Backup folder to clean up (default: {DEFAULT_BACKUP_ROOT})",
    )
    delete_mode = delete_backups.add_mutually_exclusive_group(required=True)
    delete_mode.add_argument("--all", action="store_true", dest="delete_all", help="Delete every backup set in the backup folder.")
    delete_mode.add_argument("--keep", type=int, help="Keep the newest N backup sets and delete the rest.")
    delete_backups.add_argument("--dry-run", action="store_true", help="Show which backups would be deleted without removing them.")

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        if args.command == "list-chars":
            return list_characters_command(args.save, args.all)
        if args.command == "list-upgrades":
            return list_upgrades_command()
        if args.command == "replace-upgrade":
            return replace_upgrade_command(
                path=args.save,
                char_index=args.char_index,
                char_type=args.char_type,
                from_name=args.from_name,
                to_name=args.to_name,
                dry_run=args.dry_run,
                backup_root=args.backup_dir,
            )
        if args.command == "verify-roundtrip":
            return verify_roundtrip_command(args.save)
        if args.command == "list-backups":
            return list_backups_command(args.backup_dir)
        if args.command == "delete-backups":
            keep = args.keep
            if keep is not None and keep < 0:
                raise ValueError("--keep must be zero or greater")
            return delete_backups_command(
                backup_root=args.backup_dir,
                delete_all=args.delete_all,
                keep=keep,
                dry_run=args.dry_run,
            )
    except (ParseError, ValueError, RuntimeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
