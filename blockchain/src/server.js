const http = require("http");
const { URL } = require("url");
const {
  appendEvent,
  readLedger,
  verifyLedger,
} = require("./ledger");

const PORT = Number(process.env.PORT || 4000);
const LEDGER_PATH = process.env.LEDGER_PATH || "data/events.json";
const SIGNING_SECRET =
  process.env.SIGNING_SECRET || "development-ledger-signing-secret";

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body is too large."));
      }
    });

    request.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
  });
}

function filterEntries(entries, query) {
  return entries.filter((entry) => {
    const event = entry.event;

    if (query.get("userId") && event.userId !== query.get("userId")) {
      return false;
    }

    if (query.get("action") && event.action !== query.get("action")) {
      return false;
    }

    if (query.get("assetId") && event.assetId !== query.get("assetId")) {
      return false;
    }

    if (query.get("severity") && event.severity !== query.get("severity")) {
      return false;
    }

    return true;
  });
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && url.pathname === "/health") {
    const entries = readLedger(LEDGER_PATH);
    const verification = verifyLedger(entries);
    sendJson(response, 200, {
      status: "ok",
      ledgerEntries: entries.length,
      ledgerValid: verification.valid,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/events") {
    const entries = filterEntries(readLedger(LEDGER_PATH), url.searchParams);
    const limit = Number(url.searchParams.get("limit") || 100);
    sendJson(response, 200, {
      count: entries.length,
      events: entries.slice(-limit).reverse(),
    });
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/events/")) {
    const eventId = decodeURIComponent(url.pathname.replace("/events/", ""));
    const entry = readLedger(LEDGER_PATH).find(
      (item) => item.event.eventId === eventId
    );

    if (!entry) {
      sendJson(response, 404, { error: "Event not found." });
      return;
    }

    sendJson(response, 200, entry);
    return;
  }

  if (request.method === "POST" && url.pathname === "/events") {
    const event = await parseBody(request);
    const result = appendEvent(LEDGER_PATH, event, SIGNING_SECRET);

    if (!result.ok) {
      sendJson(response, 400, { error: "Invalid event.", details: result.errors });
      return;
    }

    sendJson(response, 201, result.entry);
    return;
  }

  if (request.method === "GET" && url.pathname === "/ledger/verify") {
    const entries = readLedger(LEDGER_PATH);
    sendJson(response, 200, {
      entries: entries.length,
      ...verifyLedger(entries),
    });
    return;
  }

  sendJson(response, 404, { error: "Route not found." });
}

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    sendJson(response, 500, { error: error.message });
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Blockchain audit API listening on http://localhost:${PORT}`);
  });
}

module.exports = { server };
