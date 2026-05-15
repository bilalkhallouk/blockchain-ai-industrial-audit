const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  appendEvent,
  readLedger,
  validateEvent,
  verifyLedger,
} = require("../src/ledger");

function tempLedgerPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ledger-")), "events.json");
}

const baseEvent = {
  timestamp: "2026-05-15T03:00:00Z",
  userId: "maintenance_ext_01",
  userRole: "contractor",
  action: "LOGIN",
  assetId: "scada-main-01",
  assetType: "SCADA",
  sourceIp: "10.10.50.23",
  severity: "critical",
  metadata: {
    location: "Tanger Plant",
  },
};

test("validates required event fields", () => {
  const errors = validateEvent({ userId: "bilal" });
  assert.ok(errors.includes("Missing required field: timestamp"));
  assert.ok(errors.includes("Missing required field: action"));
});

test("appends events with a valid hash chain", () => {
  const filePath = tempLedgerPath();

  const first = appendEvent(filePath, baseEvent, "secret");
  const second = appendEvent(
    filePath,
    {
      ...baseEvent,
      eventId: "evt-002",
      timestamp: "2026-05-15T09:00:00Z",
      sourceIp: "10.10.10.5",
      severity: "low",
    },
    "secret"
  );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(second.entry.previousHash, first.entry.blockHash);

  const entries = readLedger(filePath);
  assert.equal(entries.length, 2);
  assert.deepEqual(verifyLedger(entries), { valid: true, errors: [] });
});

test("detects tampered ledger events", () => {
  const filePath = tempLedgerPath();
  appendEvent(filePath, baseEvent, "secret");

  const entries = readLedger(filePath);
  entries[0].event.sourceIp = "192.168.1.200";

  const verification = verifyLedger(entries);
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.some((error) => error.includes("eventHash")));
});
