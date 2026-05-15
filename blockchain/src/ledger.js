const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const REQUIRED_FIELDS = [
  "timestamp",
  "userId",
  "action",
  "assetId",
  "assetType",
  "sourceIp",
];

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function createSignature(payload, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(canonicalJson(payload))
    .digest("hex");
}

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readLedger(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Ledger file must contain a JSON array.");
  }

  return parsed;
}

function writeLedger(filePath, entries) {
  ensureDirectory(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(entries, null, 2)}\n`);
}

function validateEvent(event) {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return ["Event body must be a JSON object."];
  }

  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (!event[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (event.timestamp && Number.isNaN(Date.parse(event.timestamp))) {
    errors.push("timestamp must be a valid ISO date.");
  }

  if (event.metadata && typeof event.metadata !== "object") {
    errors.push("metadata must be an object when provided.");
  }

  return errors;
}

function createLedgerEntry(event, previousEntry, secret) {
  const eventId = event.eventId || crypto.randomUUID();
  const receivedAt = new Date().toISOString();
  const normalizedEvent = {
    eventId,
    timestamp: event.timestamp,
    userId: event.userId,
    userRole: event.userRole || "unknown",
    action: event.action,
    assetId: event.assetId,
    assetType: event.assetType,
    sourceIp: event.sourceIp,
    severity: event.severity || "low",
    metadata: event.metadata || {},
  };

  const eventHash = sha256(canonicalJson(normalizedEvent));
  const previousHash = previousEntry ? previousEntry.blockHash : "GENESIS";
  const blockPayload = {
    index: previousEntry ? previousEntry.index + 1 : 0,
    receivedAt,
    previousHash,
    eventHash,
  };

  return {
    ...blockPayload,
    event: normalizedEvent,
    signature: event.signature || createSignature(normalizedEvent, secret),
    blockHash: sha256(canonicalJson(blockPayload)),
  };
}

function appendEvent(filePath, event, secret) {
  const errors = validateEvent(event);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const entries = readLedger(filePath);
  const entry = createLedgerEntry(event, entries.at(-1), secret);
  entries.push(entry);
  writeLedger(filePath, entries);

  return { ok: true, entry };
}

function verifyLedger(entries) {
  const errors = [];

  entries.forEach((entry, index) => {
    const expectedPreviousHash =
      index === 0 ? "GENESIS" : entries[index - 1].blockHash;
    const expectedEventHash = sha256(canonicalJson(entry.event));
    const expectedBlockHash = sha256(
      canonicalJson({
        index: entry.index,
        receivedAt: entry.receivedAt,
        previousHash: entry.previousHash,
        eventHash: entry.eventHash,
      })
    );

    if (entry.index !== index) {
      errors.push(`Entry ${index} has invalid index ${entry.index}.`);
    }

    if (entry.previousHash !== expectedPreviousHash) {
      errors.push(`Entry ${index} has invalid previousHash.`);
    }

    if (entry.eventHash !== expectedEventHash) {
      errors.push(`Entry ${index} eventHash mismatch.`);
    }

    if (entry.blockHash !== expectedBlockHash) {
      errors.push(`Entry ${index} blockHash mismatch.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  appendEvent,
  canonicalJson,
  createLedgerEntry,
  readLedger,
  validateEvent,
  verifyLedger,
};
