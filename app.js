const PRIMARY_SAVE_NAME = "meta1.yankai";
const MIRROR_SAVE_NAME = "meta1_backup.yankai";
const SAVE_FILE_SUFFIXES = [".yankai", ".balls", ".vdf"];
const BACKUP_PACKAGE_EXTENSION = ".zip";
const LEGACY_BACKUP_PACKAGE_EXTENSION = ".ballxpitbackup";
const WINDOWS_SAVE_PATH = String.raw`%USERPROFILE%\AppData\LocalLow\Kenny Sun\BALL x PIT`;

const CHAR_DISPLAY_BY_ID = {
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
};

const LEGACY_CHAR_NAMES_BY_ID = {
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
};

const UNUSED_CHAR_TYPE_IDS = new Set([3, 4, 18, 22]);
const NO_HARVEST_CHAR_TYPE_IDS = new Set([21]);

const UPGRADE_DISPLAY_BY_ID = {
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
};

const UPGRADE_INTERNAL_BY_ID = {
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
};

const NAMED_VALUE_TAGS = new Set([
  0x09, 0x0b, 0x0d, 0x0f, 0x11, 0x13, 0x15, 0x17, 0x19, 0x1b, 0x1d, 0x1f,
  0x21, 0x23, 0x25, 0x27, 0x29, 0x2b, 0x2d, 0x32,
]);

const UNNAMED_VALUE_TAGS = new Set([
  0x0a, 0x0c, 0x0e, 0x10, 0x12, 0x14, 0x16, 0x18, 0x1a, 0x1c, 0x1e, 0x20,
  0x22, 0x24, 0x26, 0x28, 0x2a, 0x2c, 0x2e, 0x33,
]);

const MAX_HARVEST_SLOTS = 3;
const BACKUP_DB_NAME = "ballxpit-save-editor";
const BACKUP_STORE_NAME = "backupBundles";
const BACKUP_DB_VERSION = 2;
const BACKUP_FILE_PREFIX = "backup";
const BACKUP_FILE_PATTERN = /^ballxpit-backup-([0-9]{8}-[0-9]{6})__(.+)$/i;
const BACKUP_MANIFEST_NAME = "manifest.json";
const ALL_UPGRADE_IDS = Object.keys(UPGRADE_DISPLAY_BY_ID)
  .map(Number)
  .sort((a, b) => a - b);
const HARVEST_ROW_UNLOCK_LEVELS = [3, 6, 10];

// Only characters listed here are currently treated as known harvest characters.
const KNOWN_HARVEST_TREES_BY_CHARACTER = {
  Warrior: [[11, 6], [4, 1], [6, 8]],
  "Itchy Finger": [[9, 4], [3, 1], [5, 6]],
  Repentant: [[3, 12], [11, 10], [13, 1]],
  Cohabitants: [[13, 8], [6, 5], [9, 1]],
  Cogitator: [[13, 8], [8, 6], [9, 1]],
  Embedded: [[3, 12], [11, 10], [13, 1]],
  Juggler: [[1, 9], [9, 6], [10, 1]],
  "Empty Nester": [[1, 10], [9, 8], [11, 1]],
  Radical: [[9, 4], [3, 2], [5, 1]],
};

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder("utf-8");
const latin1Decoder = new TextDecoder("latin1");
const utf16Decoder = new TextDecoder("utf-16le");

const state = {
  files: new Map(),
  primaryName: null,
  primaryBytes: null,
  records: [],
  drafts: {},
  sourceLabel: "",
  selectedCharacterIndex: null,
  currentStep: 1,
  returnStep: 1,
  stepNotice: "",
  disclaimerOpen: false,
  backupDownloaded: false,
  localBackups: [],
  selectedLocalBackupId: null,
  restoreCandidate: null,
  roundtripVerified: false,
  roundtripMessage: "",
};

const elements = {
  bundleInput: document.getElementById("bundleInput"),
  folderInput: document.getElementById("folderInput"),
  restoreInput: document.getElementById("restoreInput"),
  disclaimerButton: document.getElementById("disclaimerButton"),
  disclaimerModal: document.getElementById("disclaimerModal"),
  disclaimerCloseButton: document.getElementById("disclaimerCloseButton"),
  stepTitle: document.getElementById("stepTitle"),
  stepNotice: document.getElementById("stepNotice"),
  stepContent: document.getElementById("stepContent"),
  backButton: document.getElementById("backButton"),
  nextButton: document.getElementById("nextButton"),
  restoreFlowButton: document.getElementById("restoreFlowButton"),
  toast: document.getElementById("toast"),
};

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.className = `toast visible ${isError ? "danger" : ""}`;
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    elements.toast.className = "toast";
  }, 3200);
}

function normalizeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

async function copyText(value) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "readonly");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function sameSelection(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function arraysEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function concatArrays(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function int32Bytes(value) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setInt32(0, value, true);
  return bytes;
}

function uint32Bytes(value) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
}

function int16Bytes(value) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setInt16(0, value, true);
  return bytes;
}

function uint16Bytes(value) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function int64Bytes(value) {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigInt64(0, BigInt(value), true);
  return bytes;
}

function uint64Bytes(value) {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, BigInt(value), true);
  return bytes;
}

function float32Bytes(value) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setFloat32(0, value, true);
  return bytes;
}

function float64Bytes(value) {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setFloat64(0, value, true);
  return bytes;
}

function utf16leBytes(value) {
  const bytes = new Uint8Array(value.length * 2);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < value.length; index += 1) {
    view.setUint16(index * 2, value.charCodeAt(index), true);
  }
  return bytes;
}

class OdinBinaryParser {
  constructor(data) {
    this.data = data instanceof Uint8Array ? data : new Uint8Array(data);
    this.view = new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength);
    this.offset = 0;
    this.typeIds = new Map();
  }

  ensure(size) {
    if (this.offset + size > this.data.length) {
      throw new Error(`Unexpected EOF at offset ${this.offset} while reading ${size} bytes`);
    }
  }

  read(size) {
    this.ensure(size);
    const chunk = this.data.slice(this.offset, this.offset + size);
    this.offset += size;
    return chunk;
  }

  readU8() {
    this.ensure(1);
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  readI32() {
    this.ensure(4);
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  readI64() {
    this.ensure(8);
    const value = Number(this.view.getBigInt64(this.offset, true));
    this.offset += 8;
    return value;
  }

  readF32() {
    this.ensure(4);
    const value = this.view.getFloat32(this.offset, true);
    this.offset += 4;
    return value;
  }

  readF64() {
    this.ensure(8);
    const value = this.view.getFloat64(this.offset, true);
    this.offset += 8;
    return value;
  }

  readString() {
    const flag = this.readU8();
    const length = this.readI32();
    if (flag === 0) {
      return latin1Decoder.decode(this.read(length));
    }
    if (flag === 1) {
      return utf16Decoder.decode(this.read(length * 2));
    }
    throw new Error(`Invalid string char-size flag ${flag} at offset ${this.offset}`);
  }

  readTypeEntry() {
    const tag = this.readU8();
    if (tag === 0x2e) {
      return null;
    }
    if (tag === 0x30) {
      const typeId = this.readI32();
      if (!this.typeIds.has(typeId)) {
        throw new Error(`Missing cached type id ${typeId} at offset ${this.offset}`);
      }
      return this.typeIds.get(typeId);
    }
    if (tag === 0x2f) {
      const typeId = this.readI32();
      const typeName = this.readString();
      this.typeIds.set(typeId, typeName);
      return typeName;
    }
    throw new Error(`Invalid type entry tag 0x${tag.toString(16)} at offset ${this.offset}`);
  }

  readValue(tag) {
    switch (tag) {
      case 0x0f:
      case 0x10: {
        const value = new Int8Array(this.read(1).buffer)[0];
        return value;
      }
      case 0x11:
      case 0x12:
        return this.readU8();
      case 0x13:
      case 0x14:
        return new DataView(this.read(2).buffer).getInt16(0, true);
      case 0x15:
      case 0x16:
        return new DataView(this.read(2).buffer).getUint16(0, true);
      case 0x17:
      case 0x18:
      case 0x09:
      case 0x0a:
      case 0x0b:
      case 0x0c:
        return this.readI32();
      case 0x19:
      case 0x1a: {
        this.ensure(4);
        const value = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return value;
      }
      case 0x1b:
      case 0x1c:
        return this.readI64();
      case 0x1d:
      case 0x1e: {
        this.ensure(8);
        const value = Number(this.view.getBigUint64(this.offset, true));
        this.offset += 8;
        return value;
      }
      case 0x1f:
      case 0x20:
        return this.readF32();
      case 0x21:
      case 0x22:
        return this.readF64();
      case 0x23:
      case 0x24:
      case 0x29:
      case 0x2a:
      case 0x0d:
      case 0x0e:
        return this.read(16);
      case 0x25:
      case 0x26:
        return utf16Decoder.decode(this.read(2));
      case 0x27:
      case 0x28:
      case 0x32:
      case 0x33:
        return this.readString();
      case 0x2b:
      case 0x2c:
        return this.readU8() === 1;
      case 0x2d:
      case 0x2e:
        return null;
      default:
        throw new Error(`Unsupported value tag 0x${tag.toString(16)} at offset ${this.offset}`);
    }
  }

  parseEntry() {
    const tag = this.readU8();

    if (tag === 0x01 || tag === 0x03) {
      const name = this.readString();
      const typeName = this.readTypeEntry();
      const nodeId = tag === 0x01 ? this.readI32() : null;
      const values = [];
      while (this.data[this.offset] !== 0x05) {
        values.push(this.parseEntry());
      }
      this.offset += 1;
      return { tag, name, type: typeName, id: nodeId, values };
    }

    if (tag === 0x02 || tag === 0x04) {
      const typeName = this.readTypeEntry();
      const nodeId = tag === 0x02 ? this.readI32() : null;
      const values = [];
      while (this.data[this.offset] !== 0x05) {
        values.push(this.parseEntry());
      }
      this.offset += 1;
      return { tag, name: null, type: typeName, id: nodeId, values };
    }

    if (tag === 0x06) {
      const length = this.readI64();
      const values = [];
      while (this.data[this.offset] !== 0x07) {
        values.push(this.parseEntry());
      }
      this.offset += 1;
      return { tag, length, values };
    }

    if (tag === 0x08) {
      const length = this.readI32();
      const elemSize = this.readI32();
      const raw = this.read(length * elemSize);
      return { tag, length, elem_size: elemSize, raw };
    }

    if (NAMED_VALUE_TAGS.has(tag)) {
      const name = this.readString();
      return { tag, name, value: this.readValue(tag) };
    }

    if (UNNAMED_VALUE_TAGS.has(tag)) {
      return { tag, name: null, value: this.readValue(tag) };
    }

    if (tag === 0x31) {
      return { tag };
    }

    throw new Error(`Unsupported entry tag 0x${tag.toString(16)} at offset ${this.offset - 1}`);
  }
}

class OdinBinaryWriter {
  constructor() {
    this.parts = [];
    this.typeIds = new Map();
  }

  write(bytes) {
    this.parts.push(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
  }

  writeU8(value) {
    this.write(Uint8Array.of(value));
  }

  writeI32(value) {
    this.write(int32Bytes(value));
  }

  writeI64(value) {
    this.write(int64Bytes(value));
  }

  writeF32(value) {
    this.write(float32Bytes(value));
  }

  writeF64(value) {
    this.write(float64Bytes(value));
  }

  writeString(value) {
    const encoded = utf16leBytes(value);
    this.writeU8(1);
    this.writeI32(value.length);
    this.write(encoded);
  }

  writeTypeEntry(typeName) {
    if (typeName === null || typeName === undefined) {
      this.writeU8(0x2e);
      return;
    }

    if (this.typeIds.has(typeName)) {
      this.writeU8(0x30);
      this.writeI32(this.typeIds.get(typeName));
      return;
    }

    const typeId = this.typeIds.size;
    this.typeIds.set(typeName, typeId);
    this.writeU8(0x2f);
    this.writeI32(typeId);
    this.writeString(typeName);
  }

  writeValue(tag, value) {
    switch (tag) {
      case 0x0f:
      case 0x10:
        this.write(Uint8Array.of((value + 256) % 256));
        return;
      case 0x11:
      case 0x12:
        this.write(Uint8Array.of(value));
        return;
      case 0x13:
      case 0x14:
        this.write(int16Bytes(value));
        return;
      case 0x15:
      case 0x16:
        this.write(uint16Bytes(value));
        return;
      case 0x17:
      case 0x18:
      case 0x09:
      case 0x0a:
      case 0x0b:
      case 0x0c:
        this.writeI32(value);
        return;
      case 0x19:
      case 0x1a:
        this.write(uint32Bytes(value));
        return;
      case 0x1b:
      case 0x1c:
        this.writeI64(value);
        return;
      case 0x1d:
      case 0x1e:
        this.write(uint64Bytes(value));
        return;
      case 0x1f:
      case 0x20:
        this.writeF32(value);
        return;
      case 0x21:
      case 0x22:
        this.writeF64(value);
        return;
      case 0x23:
      case 0x24:
      case 0x29:
      case 0x2a:
      case 0x0d:
      case 0x0e:
        this.write(value);
        return;
      case 0x25:
      case 0x26:
        this.write(utf16leBytes(String(value).slice(0, 1)));
        return;
      case 0x27:
      case 0x28:
      case 0x32:
      case 0x33:
        this.writeString(value);
        return;
      case 0x2b:
      case 0x2c:
        this.writeU8(value ? 1 : 0);
        return;
      case 0x2d:
      case 0x2e:
        return;
      default:
        throw new Error(`Unsupported write value tag 0x${tag.toString(16)}`);
    }
  }

  writeEntry(entry) {
    const tag = entry.tag;
    this.writeU8(tag);

    if (tag === 0x01 || tag === 0x03) {
      this.writeString(entry.name);
      this.writeTypeEntry(entry.type);
      if (tag === 0x01) {
        this.writeI32(entry.id);
      }
      for (const child of entry.values) {
        this.writeEntry(child);
      }
      this.writeU8(0x05);
      return;
    }

    if (tag === 0x02 || tag === 0x04) {
      this.writeTypeEntry(entry.type);
      if (tag === 0x02) {
        this.writeI32(entry.id);
      }
      for (const child of entry.values) {
        this.writeEntry(child);
      }
      this.writeU8(0x05);
      return;
    }

    if (tag === 0x06) {
      this.writeI64(entry.length);
      for (const child of entry.values) {
        this.writeEntry(child);
      }
      this.writeU8(0x07);
      return;
    }

    if (tag === 0x08) {
      this.writeI32(entry.length);
      this.writeI32(entry.elem_size);
      this.write(entry.raw);
      return;
    }

    if (NAMED_VALUE_TAGS.has(tag)) {
      this.writeString(entry.name);
      this.writeValue(tag, entry.value);
      return;
    }

    if (UNNAMED_VALUE_TAGS.has(tag)) {
      this.writeValue(tag, entry.value);
      return;
    }

    if (tag === 0x31) {
      return;
    }

    throw new Error(`Unsupported write entry tag 0x${tag.toString(16)}`);
  }

  finish() {
    return concatArrays(this.parts);
  }
}

function parseSave(bytes) {
  const parser = new OdinBinaryParser(bytes);
  const root = parser.parseEntry();
  if (parser.offset !== parser.data.length) {
    throw new Error(`Trailing bytes remain after parse: offset=${parser.offset} size=${parser.data.length}`);
  }
  return root;
}

function writeSave(root) {
  const writer = new OdinBinaryWriter();
  writer.writeEntry(root);
  return writer.finish();
}

function childrenByName(node) {
  const map = new Map();
  for (const child of node.values || []) {
    if (child && child.name) {
      map.set(child.name, child);
    }
  }
  return map;
}

function firstArrayChild(node) {
  for (const child of node.values || []) {
    if (child && child.tag === 0x06) {
      return child;
    }
  }
  throw new Error(`No array child found under node ${node.name || node.type}`);
}

function getCharNodes(root) {
  return firstArrayChild(childrenByName(root).get("Chars")).values;
}

function getUpgradeNodes(charNode) {
  return firstArrayChild(childrenByName(charNode).get("HarvestUpgrades")).values;
}

function getNamedValue(node, name, fallback = null) {
  const child = childrenByName(node).get(name);
  if (!child) {
    return fallback;
  }
  return Object.prototype.hasOwnProperty.call(child, "value") ? child.value : fallback;
}

function formatUpgradeList(upgradeIds) {
  if (!upgradeIds.length) {
    return "-";
  }
  return upgradeIds.map((id) => UPGRADE_DISPLAY_BY_ID[id] || `Unknown(${id})`).join(", ");
}

function decodeCharacters(root) {
  return getCharNodes(root).map((charNode, index) => {
    const typeId = Number(getNamedValue(charNode, "Type", -1));
    const upgradeIds = getUpgradeNodes(charNode).map((upgradeNode) => Number(getNamedValue(upgradeNode, "Type", -1)));
    const legacyName = LEGACY_CHAR_NAMES_BY_ID[typeId] || `Unknown_${typeId}`;
    const displayName = CHAR_DISPLAY_BY_ID[typeId] || legacyName;
    return {
      index,
      type_id: typeId,
      legacy_name: legacyName,
      display_name: displayName,
      level: Number(getNamedValue(charNode, "Lvl", 0)),
      unused: UNUSED_CHAR_TYPE_IDS.has(typeId),
      no_harvest: NO_HARVEST_CHAR_TYPE_IDS.has(typeId),
      unlocked: Boolean(getNamedValue(charNode, "IsUnlocked", false)),
      xp: Number(getNamedValue(charNode, "CurXP", 0)),
      battles: Number(getNamedValue(charNode, "NumBattles", 0)),
      rerolls: Number(getNamedValue(charNode, "NumTimesRerolled", 0)),
      upgrade_ids: upgradeIds,
    };
  });
}

function characterIsEditable(record) {
  const knownTree = KNOWN_HARVEST_TREES_BY_CHARACTER[record.display_name];
  const unlockedRows = getUnlockedHarvestRowCount(record.level);
  return (
    Boolean(knownTree) &&
    record.unlocked &&
    !record.unused &&
    !record.no_harvest &&
    record.xp > 0 &&
    unlockedRows > 0 &&
    record.upgrade_ids.length === unlockedRows
  );
}

function characterDisabledReason(record) {
  if (record.no_harvest) {
    return "Special character";
  }
  if (record.xp <= 0) {
    return "0 XP";
  }
  if (!record.unlocked) {
    return "Locked";
  }
  if (record.unused) {
    return "Unused slot";
  }
  if (!KNOWN_HARVEST_TREES_BY_CHARACTER[record.display_name]) {
    return "Unknown tree";
  }
  if (getUnlockedHarvestRowCount(record.level) === 0) {
    return "No unlocked rows yet";
  }
  if (record.upgrade_ids.length !== getUnlockedHarvestRowCount(record.level)) {
    return "Level/save mismatch";
  }
  return null;
}

function setCharacterUpgrades(root, record, newUpgradeIds) {
  if (newUpgradeIds.length !== record.upgrade_ids.length) {
    throw new Error(
      `${record.display_name} must keep exactly ${record.upgrade_ids.length} harvest upgrade slot(s) ` +
      `(received ${newUpgradeIds.length})`,
    );
  }

  const charNode = getCharNodes(root)[record.index];
  const upgradeNodes = getUpgradeNodes(charNode);
  if (upgradeNodes.length !== newUpgradeIds.length) {
    throw new Error(
      `Save structure mismatch for ${record.display_name}: expected ${newUpgradeIds.length} upgrade nodes ` +
      `but found ${upgradeNodes.length}`,
    );
  }

  for (let index = 0; index < upgradeNodes.length; index += 1) {
    const upgradeId = newUpgradeIds[index];
    if (!UPGRADE_DISPLAY_BY_ID[upgradeId]) {
      throw new Error(`Unknown upgrade id: ${upgradeId}`);
    }
    const fields = childrenByName(upgradeNodes[index]);
    const typeField = fields.get("Type");
    if (!typeField) {
      throw new Error(`Malformed upgrade node for ${record.display_name}: missing Type field`);
    }
    typeField.value = Number(upgradeId);
  }
}

function verifySelections(updatedBytes, expectedByIndex) {
  const verifyRoot = parseSave(updatedBytes);
  const verifyRecords = decodeCharacters(verifyRoot);

  for (const [indexString, expectedIds] of Object.entries(expectedByIndex)) {
    const index = Number(indexString);
    const record = verifyRecords[index];
    if (!record) {
      throw new Error(`Verification failed: character index ${index} no longer exists`);
    }
    if (!arraysEqual(record.upgrade_ids, expectedIds)) {
      throw new Error(
        `Verification failed for ${record.display_name}: expected ${formatUpgradeList(expectedIds)} ` +
        `but found ${formatUpgradeList(record.upgrade_ids)}`,
      );
    }
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function backupFilenameStamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    date.getFullYear(),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join("");
}

function getBackupPackageName(bundle) {
  const date = new Date(bundle.createdAt);
  return `${BACKUP_FILE_PREFIX}${backupFilenameStamp(date)}${BACKUP_PACKAGE_EXTENSION}`;
}

function makeBackupRecordId(createdAt = Date.now()) {
  return `backup-${createdAt}-${Math.random().toString(16).slice(2, 10)}`;
}

function cloneBundleFiles(files) {
  return files.map((file) => ({
    originalName: file.originalName,
    bytes: file.bytes instanceof Uint8Array ? file.bytes.slice() : new Uint8Array(file.bytes),
  }));
}

function normalizeBackupRecord(record) {
  if (!record || !Array.isArray(record.files)) {
    return null;
  }

  const createdAt = Number(record.createdAt) || Date.now();
  const files = cloneBundleFiles(record.files);
  if (!files.length) {
    return null;
  }

  const packageName = typeof record.packageName === "string" && record.packageName
    ? record.packageName
    : getBackupPackageName({ createdAt });

  const rawId = typeof record.id === "string" && record.id.trim() ? record.id.trim() : "";
  const id = rawId && rawId !== "latest" ? rawId : `migrated-${createdAt}`;

  return {
    id,
    createdAt,
    packageName,
    files,
  };
}

function buildPersistedBackupRecord(bundle) {
  const createdAt = Number(bundle.createdAt) || Date.now();
  return normalizeBackupRecord({
    id: makeBackupRecordId(createdAt),
    createdAt,
    packageName: getBackupPackageName({ createdAt }),
    files: cloneBundleFiles(bundle.files),
  });
}

function formatDateTime(value) {
  const date = typeof value === "number" ? new Date(value) : value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function sortBackups(backups) {
  return [...backups].sort((left, right) => {
    if (right.createdAt !== left.createdAt) {
      return right.createdAt - left.createdAt;
    }
    return left.packageName.localeCompare(right.packageName);
  });
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function toDosDateTime(value) {
  const date = typeof value === "number" ? new Date(value) : value;
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  return {
    time: (hours << 11) | (minutes << 5) | seconds,
    date: ((year - 1980) << 9) | (month << 5) | day,
  };
}

function backupRootFolderName(bundle) {
  return getBackupPackageName(bundle).slice(0, -BACKUP_PACKAGE_EXTENSION.length);
}

function buildZipArchiveEntries(bundle) {
  const rootName = backupRootFolderName(bundle);
  const manifestBytes = utf8Encoder.encode(JSON.stringify({
    format: "ballxpit-backup-zip",
    version: 1,
    createdAt: bundle.createdAt,
    files: bundle.files.map((file) => file.originalName),
  }));

  return [
    { name: `${rootName}/${BACKUP_MANIFEST_NAME}`, bytes: manifestBytes },
    ...bundle.files.map((file) => ({
      name: `${rootName}/${file.originalName}`,
      bytes: file.bytes,
    })),
  ];
}

function serializeBackupBundleToZip(bundle) {
  const entries = buildZipArchiveEntries(bundle);
  const outputParts = [];
  const centralParts = [];
  let offset = 0;
  const { time, date } = toDosDateTime(bundle.createdAt);

  for (const entry of entries) {
    const filenameBytes = utf8Encoder.encode(entry.name);
    const dataBytes = entry.bytes instanceof Uint8Array ? entry.bytes : new Uint8Array(entry.bytes);
    const checksum = crc32(dataBytes);
    const localHeader = concatArrays([
      uint32Bytes(0x04034b50),
      uint16Bytes(20),
      uint16Bytes(0),
      uint16Bytes(0),
      uint16Bytes(time),
      uint16Bytes(date),
      uint32Bytes(checksum),
      uint32Bytes(dataBytes.length),
      uint32Bytes(dataBytes.length),
      uint16Bytes(filenameBytes.length),
      uint16Bytes(0),
      filenameBytes,
    ]);

    outputParts.push(localHeader, dataBytes);

    const centralHeader = concatArrays([
      uint32Bytes(0x02014b50),
      uint16Bytes(20),
      uint16Bytes(20),
      uint16Bytes(0),
      uint16Bytes(0),
      uint16Bytes(time),
      uint16Bytes(date),
      uint32Bytes(checksum),
      uint32Bytes(dataBytes.length),
      uint32Bytes(dataBytes.length),
      uint16Bytes(filenameBytes.length),
      uint16Bytes(0),
      uint16Bytes(0),
      uint16Bytes(0),
      uint16Bytes(0),
      uint32Bytes(0),
      uint32Bytes(offset),
      filenameBytes,
    ]);

    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const centralOffset = offset;
  const endRecord = concatArrays([
    uint32Bytes(0x06054b50),
    uint16Bytes(0),
    uint16Bytes(0),
    uint16Bytes(entries.length),
    uint16Bytes(entries.length),
    uint32Bytes(centralSize),
    uint32Bytes(centralOffset),
    uint16Bytes(0),
  ]);

  return concatArrays([...outputParts, ...centralParts, endRecord]);
}

function parseZipEntries(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const entries = [];
  let offset = 0;

  while (offset + 4 <= data.length) {
    const signature = view.getUint32(offset, true);
    if (signature === 0x02014b50 || signature === 0x06054b50) {
      break;
    }
    if (signature !== 0x04034b50) {
      throw new Error("Backup zip format is not recognized.");
    }

    if (offset + 30 > data.length) {
      throw new Error("Backup zip is truncated.");
    }

    const flags = view.getUint16(offset + 6, true);
    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);

    if (flags & 0x08) {
      throw new Error("Backup zip uses unsupported data descriptors.");
    }
    if (compressionMethod !== 0) {
      throw new Error("Backup zip uses unsupported compression.");
    }

    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLength;
    const dataStart = nameEnd + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > data.length) {
      throw new Error("Backup zip is truncated.");
    }

    const name = utf8Decoder.decode(data.subarray(nameStart, nameEnd));
    if (!name.endsWith("/")) {
      entries.push({
        name,
        bytes: data.slice(dataStart, dataEnd),
      });
    }

    offset = dataEnd;
  }

  if (!entries.length) {
    throw new Error("Backup zip does not contain any files.");
  }

  return entries;
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function downloadBytes(filename, bytes) {
  const blob = new Blob([bytes], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setStepNotice(message = "") {
  state.stepNotice = message;
}

function clearStepNotice() {
  setStepNotice("");
}

let backupDatabasePromise = null;

function openBackupDatabase() {
  if (!("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  if (backupDatabasePromise) {
    return backupDatabasePromise;
  }

  backupDatabasePromise = new Promise((resolve) => {
    const request = indexedDB.open(BACKUP_DB_NAME, BACKUP_DB_VERSION);
    request.onerror = () => resolve(null);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(BACKUP_STORE_NAME)) {
        request.result.createObjectStore(BACKUP_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });

  return backupDatabasePromise;
}

async function loadPersistedBackupBundles() {
  const db = await openBackupDatabase();
  if (!db) {
    return [];
  }

  return new Promise((resolve) => {
    const tx = db.transaction(BACKUP_STORE_NAME, "readonly");
    const store = tx.objectStore(BACKUP_STORE_NAME);
    const request = store.getAll();
    request.onerror = () => resolve([]);
    request.onsuccess = () => {
      const backups = sortBackups(
        (request.result || [])
          .map((record) => normalizeBackupRecord(record))
          .filter(Boolean),
      );
      resolve(backups);
    };
  });
}

async function savePersistedBackupBundle(bundle) {
  const db = await openBackupDatabase();
  if (!db) {
    return null;
  }

  const record = buildPersistedBackupRecord(bundle);
  return new Promise((resolve) => {
    const tx = db.transaction(BACKUP_STORE_NAME, "readwrite");
    tx.objectStore(BACKUP_STORE_NAME).put(record, record.id);
    tx.onerror = () => resolve(null);
    tx.oncomplete = () => resolve(record);
  });
}

function getEditableSlotCount(record) {
  return Math.min(MAX_HARVEST_SLOTS, getUnlockedHarvestRowCount(record.level));
}

function getUnlockedHarvestRowCount(level) {
  if (level >= HARVEST_ROW_UNLOCK_LEVELS[2]) {
    return 3;
  }
  if (level >= HARVEST_ROW_UNLOCK_LEVELS[1]) {
    return 2;
  }
  if (level >= HARVEST_ROW_UNLOCK_LEVELS[0]) {
    return 1;
  }
  return 0;
}

function matchCurrentSkillsToKnownRows(rows, currentSkills, unlockedRows) {
  const targetSkills = [...currentSkills].slice(0, unlockedRows);
  let bestMatch = {
    score: -1,
    picks: Array(unlockedRows).fill(null),
  };

  function walk(rowIndex, usedIndices, picks, score) {
    if (rowIndex >= unlockedRows) {
      if (score > bestMatch.score) {
        bestMatch = { score, picks: [...picks] };
      }
      return;
    }

    const rowOptions = rows[rowIndex];
    picks[rowIndex] = null;
    walk(rowIndex + 1, usedIndices, picks, score);

    for (let skillIndex = 0; skillIndex < targetSkills.length; skillIndex += 1) {
      if (usedIndices.has(skillIndex)) {
        continue;
      }

      const skillId = targetSkills[skillIndex];
      if (!rowOptions.includes(skillId)) {
        continue;
      }

      usedIndices.add(skillIndex);
      picks[rowIndex] = skillId;
      walk(rowIndex + 1, usedIndices, picks, score + 1);
      usedIndices.delete(skillIndex);
    }
  }

  walk(0, new Set(), Array(unlockedRows).fill(null), 0);
  return bestMatch.picks;
}

function buildCharacterProfile(record) {
  const knownRows = KNOWN_HARVEST_TREES_BY_CHARACTER[record.display_name];
  const unlockedRows = getUnlockedHarvestRowCount(record.level);

  if (!knownRows) {
    return {
      known: false,
      editable: false,
      exportable: false,
      unlockedRows,
      rows: [],
      note: "This character's harvest tree is still unknown, so editing is disabled for now.",
    };
  }

  const matchedSelections = matchCurrentSkillsToKnownRows(knownRows, record.upgrade_ids, unlockedRows);
  const rows = Array.from({ length: MAX_HARVEST_SLOTS }, (_, index) => ({
    index,
    unlockLevel: HARVEST_ROW_UNLOCK_LEVELS[index],
    options: [...knownRows[index]],
    unlocked: index < unlockedRows,
    current: index < unlockedRows ? (matchedSelections[index] ?? null) : null,
  }));

  const editable = (
    record.unlocked &&
    !record.unused &&
    !record.no_harvest &&
    record.xp > 0 &&
    unlockedRows > 0 &&
    record.upgrade_ids.length === unlockedRows
  );

  let note = "Choose one option for each unlocked row. The researched harvest rows unlock at levels 3, 6, and 10.";
  if (!editable) {
    if (unlockedRows === 0) {
      note = "This known character has no harvest row unlocked yet. The first row unlocks at level 3.";
    } else if (record.upgrade_ids.length !== unlockedRows) {
      note = `This save stores ${record.upgrade_ids.length} harvest slot(s), but level ${record.level} expects ${unlockedRows}.`;
    }
  } else if (matchedSelections.some((value, index) => index < unlockedRows && value === null)) {
    note = "Some current saved skills do not match the known tree. Pick a valid option for each unlocked row before exporting.";
  }

  return {
    known: true,
    editable,
    exportable: editable,
    unlockedRows,
    rows,
    note,
  };
}

function getBaselineSelection(record) {
  const profile = buildCharacterProfile(record);
  return Array.from({ length: MAX_HARVEST_SLOTS }, (_, index) => profile.rows[index]?.current ?? null);
}

function validateDraftForRecord(record, draft) {
  const profile = buildCharacterProfile(record);
  if (!profile.known || !profile.exportable || draft.length !== MAX_HARVEST_SLOTS) {
    return false;
  }

  const unlockedValues = draft.slice(0, profile.unlockedRows).filter((value) => value !== null);
  if (unlockedValues.length !== profile.unlockedRows) {
    return false;
  }

  for (let index = 0; index < MAX_HARVEST_SLOTS; index += 1) {
    const row = profile.rows[index];
    const value = draft[index];
    if (!row.unlocked) {
      if (value !== null) {
        return false;
      }
      continue;
    }
    if (!row.options.includes(value)) {
      return false;
    }
  }

  return true;
}

function syncDrafts() {
  const nextDrafts = {};
  for (const record of state.records) {
    const existing = state.drafts[record.index];
    if (Array.isArray(existing) && validateDraftForRecord(record, existing)) {
      nextDrafts[record.index] = [...existing];
      continue;
    }
    nextDrafts[record.index] = getBaselineSelection(record);
  }
  state.drafts = nextDrafts;
}

function getChangedCharacters() {
  return state.records.filter((record) => !sameSelection(state.drafts[record.index] || [], getBaselineSelection(record)));
}

function getInvalidCharacters() {
  return state.records.filter((record) => characterIsEditable(record) && !validateDraftForRecord(record, state.drafts[record.index] || []));
}

function getRecordByIndex(index) {
  return state.records.find((record) => record.index === index) || null;
}

function firstPreferredCharacterIndex() {
  const editable = state.records.find((record) => characterIsEditable(record));
  if (editable) {
    return editable.index;
  }
  return state.records[0] ? state.records[0].index : null;
}

function ensureSelectedCharacter() {
  if (!state.records.length) {
    state.selectedCharacterIndex = null;
    return null;
  }

  const selected = getRecordByIndex(state.selectedCharacterIndex);
  if (selected) {
    return selected;
  }

  state.selectedCharacterIndex = firstPreferredCharacterIndex();
  return getRecordByIndex(state.selectedCharacterIndex);
}

function findPrimarySave(entries) {
  if (entries.has(PRIMARY_SAVE_NAME)) {
    return entries.get(PRIMARY_SAVE_NAME);
  }

  const yankaiNames = [...entries.keys()]
    .filter((name) => normalizeName(name).endsWith("yankai") && name !== MIRROR_SAVE_NAME)
    .sort();

  if (!yankaiNames.length) {
    return null;
  }

  return entries.get(yankaiNames[0]);
}

function validateSaveEntries(entries) {
  if (!entries.size) {
    throw new Error("No BALL x PIT save files were found in that selection");
  }

  const primary = findPrimarySave(entries);
  if (!primary) {
    throw new Error("Could not find a .yankai save file in the selected files");
  }

  const root = parseSave(primary.bytes);
  const rewritten = writeSave(root);
  if (!arraysEqual(primary.bytes, rewritten)) {
    throw new Error("Roundtrip verification failed for the uploaded primary save file");
  }

  return {
    primary,
    primaryName: [...entries.entries()].find(([, entry]) => entry === primary)?.[0] || PRIMARY_SAVE_NAME,
    primaryBytes: primary.bytes,
    records: decodeCharacters(root).filter((record) => !record.unused),
    roundtripMessage: "Roundtrip verification passed. The primary save rewrites byte-exactly and is ready for editing.",
  };
}

function createBackupBundleFromEntries(entries) {
  const createdAt = Date.now();
  const files = [...entries.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, entry]) => ({
      originalName: name,
      bytes: entry.bytes,
    }));

  return { createdAt, files };
}

function serializeBackupBundle(bundle) {
  return JSON.stringify({
    format: "ballxpit-backup-package",
    version: 1,
    createdAt: bundle.createdAt,
    files: bundle.files.map((file) => ({
      originalName: file.originalName,
      bytesBase64: bytesToBase64(file.bytes),
    })),
  });
}

function deserializeBackupBundle(text) {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    throw new Error("Backup package is not valid JSON.");
  }

  if (!payload || payload.format !== "ballxpit-backup-package" || payload.version !== 1 || !Array.isArray(payload.files)) {
    throw new Error("Backup package format is not recognized.");
  }

  const files = payload.files.map((file) => {
    if (!file || typeof file.originalName !== "string" || typeof file.bytesBase64 !== "string") {
      throw new Error("Backup package is missing file data.");
    }
    return {
      originalName: file.originalName,
      bytes: base64ToBytes(file.bytesBase64),
    };
  });

  return {
    createdAt: Number(payload.createdAt) || Date.now(),
    files,
  };
}

function bundleFromZipEntries(zipEntries, fallbackLabel = "Selected backup package") {
  let createdAt = Date.now();
  let label = fallbackLabel;
  const saveEntries = new Map();

  for (const entry of zipEntries) {
    const normalizedPath = entry.name.replaceAll("\\", "/");
    const segments = normalizedPath.split("/").filter(Boolean);
    const fileName = segments[segments.length - 1];
    if (!fileName) {
      continue;
    }

    if (fileName === BACKUP_MANIFEST_NAME) {
      try {
        const manifest = JSON.parse(utf8Decoder.decode(entry.bytes));
        if (manifest && manifest.format === "ballxpit-backup-zip") {
          createdAt = Number(manifest.createdAt) || createdAt;
          if (segments.length > 1) {
            label = `${segments[0]}${BACKUP_PACKAGE_EXTENSION}`;
          }
        }
      } catch (error) {
        // Ignore malformed manifest files and fall back to filename-based metadata.
      }
      continue;
    }

    if (!SAVE_FILE_SUFFIXES.some((suffix) => fileName.toLowerCase().endsWith(suffix))) {
      continue;
    }

    saveEntries.set(fileName, {
      file: null,
      bytes: entry.bytes,
    });
  }

  if (!saveEntries.size) {
    throw new Error("Backup zip does not contain any BALL x PIT save files.");
  }

  const bundle = createBackupBundleFromEntries(saveEntries);
  bundle.createdAt = createdAt;
  return {
    ...bundle,
    label,
  };
}

function downloadBundleFiles(bundle) {
  for (const file of bundle.files) {
    downloadBytes(file.originalName, file.bytes);
  }
}

function normalizeBackupEntries(entries) {
  const normalized = new Map();
  let detectedTimestamp = null;

  for (const [name, entry] of entries.entries()) {
    const match = name.match(BACKUP_FILE_PATTERN);
    if (match) {
      detectedTimestamp = detectedTimestamp || match[1];
      normalized.set(match[2], {
        file: entry.file,
        bytes: entry.bytes,
      });
      continue;
    }

    normalized.set(name, entry);
  }

  return { entries: normalized, detectedTimestamp };
}

function parseBackupStamp(stamp) {
  if (!stamp) {
    return null;
  }
  const match = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/.exec(stamp);
  if (!match) {
    return null;
  }
  const [, year, month, day, hours, minutes, seconds] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds));
}

function buildRestoreCandidate(entries, label, detectedTimestamp = null) {
  const bundle = createBackupBundleFromEntries(entries);
  const parsedStamp = parseBackupStamp(detectedTimestamp);
  if (parsedStamp) {
    bundle.createdAt = parsedStamp.getTime();
  }
  return { ...bundle, label };
}

function getSelectedLocalBackup() {
  if (!state.localBackups.length) {
    return null;
  }
  return state.localBackups.find((backup) => backup.id === state.selectedLocalBackupId) || state.localBackups[0];
}

function setSlotSelection(record, slotIndex, upgradeId) {
  const profile = buildCharacterProfile(record);
  const row = profile.rows[slotIndex];
  if (!profile.known || !profile.exportable || !row || !row.unlocked || !row.options.includes(upgradeId)) {
    showToast("That skill is not allowed for this slot.", true);
    return;
  }

  const next = [...(state.drafts[record.index] || getBaselineSelection(record))];
  next[slotIndex] = upgradeId;
  state.drafts[record.index] = next;
  render();
}

function stepMeta() {
  switch (state.currentStep) {
    case 1:
      return { title: "Load your save" };
    case 2:
      return { title: "Make a backup" };
    case 3:
      return { title: "Edit harvest skills" };
    case 4:
      return { title: "Restore backup" };
    default:
      return { title: "BALL x PIT Save Editor" };
  }
}

function renderStepNotice() {
  elements.stepNotice.hidden = !state.stepNotice;
  elements.stepNotice.textContent = state.stepNotice;
}

function renderNavigation() {
  elements.backButton.hidden = state.currentStep === 1;
  elements.nextButton.hidden = state.currentStep === 3 || state.currentStep === 4;

  if (state.currentStep === 1) {
    elements.nextButton.textContent = "Next";
  } else if (state.currentStep === 2) {
    elements.nextButton.textContent = "Next";
  }
}

function renderLoadStep() {
  const loadedNames = [...state.files.keys()].sort();
  const loadedSummary = state.primaryBytes ? `
    <div class="summary-card">
      <span class="summary-label">Loaded save</span>
      <strong>${escapeHtml(state.primaryName || "Primary save")}</strong>
      <p>${escapeHtml(state.roundtripMessage || "Save loaded.")}</p>
      <div class="file-pill-row">
        ${loadedNames.map((name) => `<span class="skill-chip">${escapeHtml(name)}</span>`).join("")}
      </div>
    </div>
  ` : "";

  return `
    <div class="stage-body">
      <p class="lead">Pick your BALL x PIT save folder or save files to begin. The editor verifies the primary save before anything becomes editable.</p>

      <div class="field-card">
        <span class="field-label">Typical Steam save path</span>
        <div class="path-row">
          <input class="path-field" type="text" readonly value="${escapeHtml(WINDOWS_SAVE_PATH)}">
          <button class="ghost small-button" data-action="copy-save-path" type="button">Copy</button>
        </div>
      </div>

      <ul class="soft-list">
        <li><strong>Need:</strong> <code>meta1.yankai</code></li>
        <li><strong>Recommended:</strong> <code>meta1_backup.yankai</code>, matching <code>*.balls</code>, and matching <code>*.vdf</code></li>
        <li>Disable Steam Cloud before you replace anything.</li>
        <li>Keep a safe backup zip. You can restore it later from the footer.</li>
      </ul>

      <div class="inline-actions">
        <button data-action="choose-save-files" type="button">Open save files</button>
      </div>

      ${loadedSummary}
    </div>
  `;
}

function renderBackupStep() {
  const names = [...state.files.keys()].sort();
  return `
    <div class="stage-body">
      <p class="lead">Your save loaded correctly. Download one zipped backup before editing anything.</p>

      <div class="summary-card">
        <span class="summary-label">Ready for backup</span>
        <strong>${escapeHtml(state.primaryName || "Primary save")}</strong>
        <p>${escapeHtml(state.roundtripMessage)}</p>
        <div class="file-pill-row">
          ${names.map((name) => `<span class="skill-chip">${escapeHtml(name)}</span>`).join("")}
        </div>
      </div>

      <div class="notice-card">
        <strong>Experimental, open-source tool.</strong>
        <p>Use it at your own risk. Save formats can change, and bad edits can break or invalidate a save.</p>
      </div>

      <div class="inline-actions">
        <button data-action="download-backup" type="button">Download backup package</button>
      </div>

      <p class="helper-text">This downloads one zip named like <code>backup032720260558.zip</code>. Inside it, the original save files are stored in a matching backup folder.</p>
    </div>
  `;
}

function renderRosterList(selected) {
  return state.records.map((record) => {
    const profile = buildCharacterProfile(record);
    const disabled = !characterIsEditable(record);
    const active = selected && selected.index === record.index;
    const changed = !sameSelection(state.drafts[record.index] || [], getBaselineSelection(record));
    const previewSkills = changed
      ? (state.drafts[record.index] || []).slice(0, profile.unlockedRows).filter((value) => value !== null)
      : record.upgrade_ids;
    let badge = `<span class="meta-pill">XP ${record.xp}</span>`;

    if (record.no_harvest) {
      badge = `<span class="meta-pill locked">Special</span>`;
    } else if (disabled) {
      badge = `<span class="meta-pill locked">${escapeHtml(characterDisabledReason(record) || "Read only")}</span>`;
    } else if (changed) {
      badge = `<span class="meta-pill pending">Edited</span>`;
    }

    const chips = previewSkills
      .map((upgradeId) => `<span class="skill-chip">${escapeHtml(UPGRADE_DISPLAY_BY_ID[upgradeId] || String(upgradeId))}</span>`)
      .join("");

    return `
      <button
        class="roster-item ${active ? "active" : ""} ${disabled ? "inactive" : ""}"
        type="button"
        data-action="select-character"
        data-char-index="${record.index}"
      >
        <div class="roster-row">
          <p class="roster-title">${escapeHtml(record.display_name)}</p>
          ${badge}
        </div>
        <p class="roster-meta">Level ${record.level} · ${profile.known ? `${profile.unlockedRows} / ${MAX_HARVEST_SLOTS} rows unlocked` : "Tree unknown"}</p>
        <div class="chip-row">${chips || '<span class="skill-chip">No harvest skills</span>'}</div>
      </button>
    `;
  }).join("");
}

function renderGuidedChoices(record, profile, draft) {
  return profile.rows.map((row, slotIndex) => {
    const subtitle = row.unlocked
      ? (draft[slotIndex] === null
        ? "Pick one choice for this unlocked row."
        : "Choose one of the two known options for this row.")
      : `Unlocks at level ${row.unlockLevel}.`;

    const choices = row.options.map((upgradeId) => {
      const selected = draft[slotIndex] === upgradeId;
      const disabled = !row.unlocked;
      return `
        <div class="choice-card ${selected ? "selected" : ""} ${disabled && !selected ? "disabled" : ""}">
          <label>
            <input
              type="radio"
              name="char-${record.index}-slot-${slotIndex}"
              data-action="choose-guided-skill"
              data-char-index="${record.index}"
              data-slot-index="${slotIndex}"
              data-upgrade-id="${upgradeId}"
              ${selected ? "checked" : ""}
              ${disabled && !selected ? "disabled" : ""}
            >
            <span>${escapeHtml(UPGRADE_DISPLAY_BY_ID[upgradeId])}</span>
          </label>
        </div>
      `;
    }).join("");

    return `
      <div class="skill-row">
        <div class="skill-row-header">
          <div>
            <p class="slot-title">Row ${slotIndex + 1}</p>
            <p class="slot-subtitle">${subtitle}</p>
          </div>
          <span class="meta-pill ${row.unlocked ? "" : "locked"}">Level ${row.unlockLevel}</span>
        </div>
        <div class="choice-list">${choices}</div>
      </div>
    `;
  }).join("");
}

function renderEditorDetail(selected) {
  if (!selected) {
    return `
      <div class="empty-card">
        <h3>No character selected</h3>
        <p>Pick a character from the roster to start editing.</p>
      </div>
    `;
  }

  const profile = buildCharacterProfile(selected);
  const currentSkills = selected.upgrade_ids
    .slice(0, selected.upgrade_ids.length)
    .map((upgradeId) => `<span class="skill-chip">${escapeHtml(UPGRADE_DISPLAY_BY_ID[upgradeId])}</span>`)
    .join("");

  if (selected.no_harvest || !profile.known || !profile.editable) {
    return `
      <div class="editor-summary">
        <div class="summary-card">
          <span class="summary-label">Selected character</span>
          <strong>${escapeHtml(selected.display_name)}</strong>
          <p>Level ${selected.level} · XP ${selected.xp} · Battles ${selected.battles}</p>
        </div>
        <div class="summary-card">
          <span class="summary-label">${selected.no_harvest ? "Current skills" : "Editing status"}</span>
          <div class="chip-row">${currentSkills || '<span class="skill-chip">No harvest skills</span>'}</div>
          <p>${selected.no_harvest
            ? "False Messiah is shown for reference only and cannot be edited."
            : profile.known
              ? profile.note
              : "This character's harvest tree is still unknown, so editing is disabled for now."}</p>
        </div>
      </div>
    `;
  }

  const draft = state.drafts[selected.index] || getBaselineSelection(selected);
  const changed = !sameSelection(draft, getBaselineSelection(selected));
  const chosenSkills = draft.slice(0, profile.unlockedRows).filter((value) => value !== null);

  return `
    <div class="editor-summary">
      <div class="summary-card">
        <span class="summary-label">Selected character</span>
        <strong>${escapeHtml(selected.display_name)}</strong>
        <p>Level ${selected.level} · XP ${selected.xp} · Battles ${selected.battles} · Rerolls ${selected.rerolls}</p>
      </div>
      <div class="summary-card">
        <span class="summary-label">Guardrails</span>
        <p>${escapeHtml(profile.note)}</p>
      </div>
      <div class="summary-card">
        <span class="summary-label">${changed ? "Pending export" : "Current selection"}</span>
        <div class="chip-row">
          ${chosenSkills.length
            ? chosenSkills.map((upgradeId) => `<span class="skill-chip">${escapeHtml(UPGRADE_DISPLAY_BY_ID[upgradeId])}</span>`).join("")
            : '<span class="skill-chip">No valid row choices selected</span>'}
        </div>
      </div>
      <div class="skill-list">
        ${renderGuidedChoices(selected, profile, draft)}
      </div>
    </div>
  `;
}

function renderEditorStep() {
  if (!state.primaryBytes) {
    return `
      <div class="stage-body">
        <div class="empty-card">
          <h3>No save loaded</h3>
          <p>Go back and load a verified save first.</p>
        </div>
      </div>
    `;
  }

  const selected = ensureSelectedCharacter();
  const changed = getChangedCharacters();
  const invalid = getInvalidCharacters();
  const canDownload = state.roundtripVerified && changed.length > 0 && invalid.length === 0;

  return `
    <div class="editor-stage">
      <div class="editor-toolbar">
        <div>
          <p class="lead">Known characters use researched rows at levels 3, 6, and 10. Unknown and special characters stay read-only for now.</p>
        </div>
        <button data-action="download-edited" type="button" ${canDownload ? "" : "disabled"}>Download edited bundle</button>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <span class="summary-label">Editor status</span>
          <strong>${changed.length} character${changed.length === 1 ? "" : "s"} changed</strong>
          <p>${invalid.length
            ? `${invalid.length} character${invalid.length === 1 ? "" : "s"} still have invalid slot choices.`
            : canDownload
              ? "Ready to export. Download the edited bundle, then place the files back into your save folder manually."
              : "Make a change to enable export."}</p>
        </div>
      </div>

      <div class="editor-workspace">
        <aside class="roster-panel">
          <h3>Characters</h3>
          <p class="helper-text">0 XP, unused, and special slots stay visible but cannot be edited.</p>
          <div class="roster-list">${renderRosterList(selected)}</div>
        </aside>

        <section class="editor-panel">
          ${renderEditorDetail(selected)}
        </section>
      </div>
    </div>
  `;
}

function renderRestoreStep() {
  const localBackups = sortBackups(state.localBackups);
  const selectedLocalBackup = getSelectedLocalBackup();
  const candidate = state.restoreCandidate;
  const backupSummary = localBackups.length ? `
    <div class="restore-card">
      <span class="summary-label">Local backups</span>
      <strong>${localBackups.length} backup${localBackups.length === 1 ? "" : "s"} found locally</strong>
      <div class="backup-choice-list">
        ${localBackups.map((backup) => `
          <label
            class="backup-choice ${selectedLocalBackup && backup.id === selectedLocalBackup.id ? "selected" : ""}"
            data-action="select-local-backup"
            data-backup-id="${escapeHtml(backup.id)}"
          >
            <input
              type="radio"
              name="local-backup-choice"
              data-action="select-local-backup"
              data-backup-id="${escapeHtml(backup.id)}"
              ${selectedLocalBackup && backup.id === selectedLocalBackup.id ? "checked" : ""}
            >
            <span class="backup-choice-copy">${escapeHtml(formatDateTime(backup.createdAt))}</span>
            <span class="meta-pill">${escapeHtml(backup.packageName)}</span>
          </label>
        `).join("")}
      </div>
      <div class="file-pill-row">
        ${(selectedLocalBackup ? selectedLocalBackup.files : []).map((file) => `<span class="skill-chip">${escapeHtml(file.originalName)}</span>`).join("")}
      </div>
      <div class="inline-actions">
        <button data-action="restore-selected-local" type="button" ${selectedLocalBackup ? "" : "disabled"}>Restore selected backup</button>
        <button class="ghost" data-action="pick-restore-files" type="button">Upload your own</button>
      </div>
    </div>
  ` : `
    <div class="restore-card">
      <span class="summary-label">Local backups</span>
      <strong>No local backups found</strong>
      <p>Upload a backup zip or legacy backup package to continue.</p>
      <div class="inline-actions">
        <button data-action="pick-restore-files" type="button">Upload your own</button>
      </div>
    </div>
  `;

  const candidateSummary = candidate ? `
    <div class="restore-card">
      <span class="summary-label">Uploaded backup</span>
      <strong>${escapeHtml(candidate.label)}</strong>
      <p>${escapeHtml(formatDateTime(candidate.createdAt))}</p>
      <div class="file-pill-row">
        ${candidate.files.map((file) => `<span class="skill-chip">${escapeHtml(file.originalName)}</span>`).join("")}
      </div>
      <div class="inline-actions">
        <button data-action="restore-candidate" type="button">Restore selected backup</button>
      </div>
    </div>
  ` : "";

  return `
    <div class="stage-body">
      <p class="lead">Choose one of your local backup zips or upload your own. The editor verifies the backup before downloading restore-ready save files.</p>
      ${backupSummary}
      ${candidateSummary}
      <div class="summary-card">
        <span class="summary-label">Needed files</span>
        <p>Preferred input: a single <code>${BACKUP_FILE_PREFIX}MMDDYYYYHHMM${BACKUP_PACKAGE_EXTENSION}</code> zip. Legacy <code>${LEGACY_BACKUP_PACKAGE_EXTENSION}</code> packages and raw save-file sets still work too.</p>
      </div>
    </div>
  `;
}

function renderStepContent() {
  if (state.currentStep === 1) {
    return renderLoadStep();
  }
  if (state.currentStep === 2) {
    return renderBackupStep();
  }
  if (state.currentStep === 3) {
    return renderEditorStep();
  }
  return renderRestoreStep();
}

function render() {
  const meta = stepMeta();
  elements.stepTitle.textContent = meta.title;
  renderStepNotice();
  renderNavigation();
  elements.stepContent.innerHTML = renderStepContent();
  elements.disclaimerModal.hidden = !state.disclaimerOpen;
}

function readFileBytes(file) {
  return file.arrayBuffer().then((buffer) => new Uint8Array(buffer));
}

function readFileText(file) {
  return file.text();
}

async function collectEntriesFromFiles(files) {
  const entries = new Map();
  for (const file of files) {
    const lowerName = file.name.toLowerCase();
    if (!SAVE_FILE_SUFFIXES.some((suffix) => lowerName.endsWith(suffix))) {
      continue;
    }
    entries.set(file.name, {
      file,
      bytes: await readFileBytes(file),
    });
  }
  return entries;
}

async function collectEntriesFromDirectoryHandle(dirHandle) {
  const entries = new Map();

  async function walk(handle) {
    for await (const [name, childHandle] of handle.entries()) {
      if (childHandle.kind === "directory") {
        await walk(childHandle);
        continue;
      }

      const lowerName = name.toLowerCase();
      if (!SAVE_FILE_SUFFIXES.some((suffix) => lowerName.endsWith(suffix))) {
        continue;
      }

      const file = await childHandle.getFile();
      entries.set(file.name, {
        file,
        bytes: await readFileBytes(file),
      });
    }
  }

  await walk(dirHandle);
  return entries;
}

async function loadEntries(entries, sourceLabel) {
  const validated = validateSaveEntries(entries);

  state.files = entries;
  state.primaryName = validated.primaryName;
  state.primaryBytes = validated.primaryBytes;
  state.records = validated.records;
  state.sourceLabel = sourceLabel;
  state.selectedCharacterIndex = firstPreferredCharacterIndex();
  state.roundtripVerified = true;
  state.roundtripMessage = validated.roundtripMessage;
  state.backupDownloaded = false;
  state.restoreCandidate = null;
  state.currentStep = 2;
  clearStepNotice();
  syncDrafts();
  render();
  showToast(`Loaded ${state.primaryName} from ${sourceLabel}.`);
}

async function loadFilesFromInput(input, sourceLabel) {
  const files = [...input.files];
  if (!files.length) {
    return;
  }

  const entries = await collectEntriesFromFiles(files);
  try {
    await loadEntries(entries, sourceLabel);
  } finally {
    input.value = "";
  }
}

async function openSavePicker() {
  if (window.showDirectoryPicker) {
    try {
      const dirHandle = await window.showDirectoryPicker({
        id: "ballxpit-save-folder",
        mode: "read",
      });
      const entries = await collectEntriesFromDirectoryHandle(dirHandle);
      await loadEntries(entries, `Folder: ${dirHandle.name}`);
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }
      throw error;
    }
  }

  if ("webkitdirectory" in elements.folderInput) {
    elements.folderInput.click();
    return;
  }

  elements.bundleInput.click();
}

async function downloadBackupCopies() {
  if (!state.files.size) {
    throw new Error("Load a save first.");
  }

  const bundle = createBackupBundleFromEntries(state.files);
  const packageName = getBackupPackageName(bundle);
  const payload = serializeBackupBundleToZip(bundle);
  downloadBytes(packageName, payload);
  const storedRecord = await savePersistedBackupBundle(bundle);
  if (storedRecord) {
    state.localBackups = sortBackups([
      storedRecord,
      ...state.localBackups.filter((backup) => backup.id !== storedRecord.id),
    ]);
    state.selectedLocalBackupId = storedRecord.id;
  }
  state.backupDownloaded = true;
  state.currentStep = 3;
  clearStepNotice();
  render();
  showToast(storedRecord
    ? `Backup zip downloaded and saved locally: ${packageName}`
    : `Backup zip downloaded: ${packageName}`);
}

function buildEditedOutputs() {
  if (!state.primaryBytes) {
    throw new Error("Load a save bundle first.");
  }

  const changedCharacters = getChangedCharacters();
  if (!changedCharacters.length) {
    throw new Error("No pending changes to export.");
  }

  const root = parseSave(state.primaryBytes);
  const expectedByIndex = {};
  const changes = [];

  for (const record of changedCharacters) {
    const profile = buildCharacterProfile(record);
    const draft = [...(state.drafts[record.index] || [])];
    if (!validateDraftForRecord(record, draft)) {
      throw new Error(`${record.display_name} has an invalid skill selection.`);
    }

    const selectedIds = draft.slice(0, profile.unlockedRows);
    setCharacterUpgrades(root, record, selectedIds);
    expectedByIndex[record.index] = selectedIds;
    changes.push({
      name: record.display_name,
      before: getBaselineSelection(record).slice(0, profile.unlockedRows),
      after: [...selectedIds],
    });
  }

  const updatedBytes = writeSave(root);
  verifySelections(updatedBytes, expectedByIndex);
  return { updatedBytes, changes };
}

function downloadEditedFiles() {
  const { updatedBytes, changes } = buildEditedOutputs();
  for (const [name, entry] of state.files.entries()) {
    if (name === state.primaryName || name === MIRROR_SAVE_NAME) {
      downloadBytes(name, updatedBytes);
      continue;
    }
    downloadBytes(name, entry.bytes);
  }

  showToast(`Downloaded edited save bundle for ${changes.map((change) => change.name).join(", ")}.`);
}

async function importRestoreFiles(fileList) {
  const lowerName = fileList.length === 1 ? fileList[0].name.toLowerCase() : "";

  if (fileList.length === 1 && lowerName.endsWith(BACKUP_PACKAGE_EXTENSION)) {
    const bundle = bundleFromZipEntries(
      parseZipEntries(await readFileBytes(fileList[0])),
      fileList[0].name,
    );
    const entries = new Map(
      bundle.files.map((file) => [
        file.originalName,
        { file: null, bytes: file.bytes },
      ]),
    );
    validateSaveEntries(entries);
    state.restoreCandidate = bundle;
    state.currentStep = 4;
    clearStepNotice();
    render();
    showToast("Backup zip verified.");
    return;
  }

  if (fileList.length === 1 && lowerName.endsWith(LEGACY_BACKUP_PACKAGE_EXTENSION)) {
    const bundle = deserializeBackupBundle(await readFileText(fileList[0]));
    const entries = new Map(
      bundle.files.map((file) => [
        file.originalName,
        { file: null, bytes: file.bytes },
      ]),
    );
    validateSaveEntries(entries);
    state.restoreCandidate = {
      ...bundle,
      label: fileList[0].name,
    };
    state.currentStep = 4;
    clearStepNotice();
    render();
    showToast("Legacy backup package verified.");
    return;
  }

  const entries = await collectEntriesFromFiles(fileList);
  const { entries: normalizedEntries, detectedTimestamp } = normalizeBackupEntries(entries);
  validateSaveEntries(normalizedEntries);
  state.restoreCandidate = buildRestoreCandidate(
    normalizedEntries,
    "Selected backup files",
    detectedTimestamp,
  );
  state.currentStep = 4;
  clearStepNotice();
  render();
  showToast("Backup files verified.");
}

function restoreBundle(bundle) {
  if (!bundle || !bundle.files || !bundle.files.length) {
    throw new Error("No backup bundle is available.");
  }

  const entries = new Map(
    bundle.files.map((file) => [
      file.originalName,
      { file: null, bytes: file.bytes },
    ]),
  );
  validateSaveEntries(entries);
  downloadBundleFiles(bundle, true);
  showToast("Restore files downloaded. Put them back into your BALL x PIT save folder.");
}

function handleBack() {
  clearStepNotice();

  if (state.currentStep === 2) {
    state.currentStep = 1;
  } else if (state.currentStep === 3) {
    state.currentStep = 2;
  } else if (state.currentStep === 4) {
    state.currentStep = state.returnStep || 3;
  }

  render();
}

function handleNext() {
  clearStepNotice();

  if (state.currentStep === 1) {
    if (!state.primaryBytes || !state.roundtripVerified) {
      setStepNotice("Load and verify your save first.");
      render();
      return;
    }
    state.currentStep = 2;
    render();
    return;
  }

  if (state.currentStep === 2) {
    if (!state.backupDownloaded) {
      setStepNotice("Download backup first.");
      render();
      return;
    }
    state.currentStep = 3;
    render();
  }
}

elements.bundleInput.addEventListener("change", () => {
  loadFilesFromInput(elements.bundleInput, "Selected files").catch((error) => showToast(error.message, true));
});

elements.folderInput.addEventListener("change", () => {
  loadFilesFromInput(elements.folderInput, "Selected folder").catch((error) => showToast(error.message, true));
});

elements.restoreInput.addEventListener("change", () => {
  const files = [...elements.restoreInput.files];
  if (!files.length) {
    return;
  }
  importRestoreFiles(files).catch((error) => showToast(error.message, true)).finally(() => {
    elements.restoreInput.value = "";
  });
});

elements.backButton.addEventListener("click", handleBack);
elements.nextButton.addEventListener("click", handleNext);

elements.restoreFlowButton.addEventListener("click", () => {
  state.returnStep = state.currentStep;
  state.currentStep = 4;
  clearStepNotice();
  render();
});

elements.disclaimerButton.addEventListener("click", () => {
  state.disclaimerOpen = true;
  render();
});

elements.disclaimerCloseButton.addEventListener("click", () => {
  state.disclaimerOpen = false;
  render();
});

elements.disclaimerModal.addEventListener("click", (event) => {
  if (event.target === elements.disclaimerModal) {
    state.disclaimerOpen = false;
    render();
  }
});

elements.stepContent.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    return;
  }

  const { action } = actionTarget.dataset;

  if (action === "copy-save-path") {
    copyText(WINDOWS_SAVE_PATH)
      .then(() => showToast("Copied the typical Windows save path."))
      .catch((error) => showToast(error.message || "Could not copy the save path.", true));
    return;
  }

  if (action === "choose-save-files") {
    openSavePicker().catch((error) => showToast(error.message, true));
    return;
  }

  if (action === "download-backup") {
    downloadBackupCopies().catch((error) => showToast(error.message, true));
    return;
  }

  if (action === "select-character") {
    state.selectedCharacterIndex = Number(actionTarget.dataset.charIndex);
    clearStepNotice();
    render();
    return;
  }

  if (action === "choose-guided-skill") {
    const record = getRecordByIndex(Number(actionTarget.dataset.charIndex));
    if (record) {
      setSlotSelection(record, Number(actionTarget.dataset.slotIndex), Number(actionTarget.dataset.upgradeId));
    }
    return;
  }

  if (action === "download-edited") {
    try {
      downloadEditedFiles();
    } catch (error) {
      showToast(error.message, true);
    }
    return;
  }

  if (action === "select-local-backup") {
    state.selectedLocalBackupId = actionTarget.dataset.backupId || null;
    clearStepNotice();
    render();
    return;
  }

  if (action === "restore-selected-local") {
    try {
      restoreBundle(getSelectedLocalBackup());
    } catch (error) {
      showToast(error.message, true);
    }
    return;
  }

  if (action === "pick-restore-files") {
    elements.restoreInput.click();
    return;
  }

  if (action === "restore-candidate") {
    try {
      restoreBundle(state.restoreCandidate);
    } catch (error) {
      showToast(error.message, true);
    }
  }
});

loadPersistedBackupBundles()
  .then((backups) => {
    state.localBackups = sortBackups(backups);
    state.selectedLocalBackupId = state.localBackups[0]?.id || null;
  })
  .finally(() => {
    render();
  });
