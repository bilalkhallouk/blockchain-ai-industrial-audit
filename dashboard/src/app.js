const API_URL = "http://localhost:4000";
const AI_URL = "http://localhost:5000";

const state = {
  entries: [],
  alerts: [],
  selectedEventId: null,
};

const elements = {
  ledgerCount: document.querySelector("#ledgerCount"),
  ledgerStatus: document.querySelector("#ledgerStatus"),
  criticalCount: document.querySelector("#criticalCount"),
  integrityState: document.querySelector("#integrityState"),
  integrityHash: document.querySelector("#integrityHash"),
  lastEventTime: document.querySelector("#lastEventTime"),
  lastEventUser: document.querySelector("#lastEventUser"),
  statusMessage: document.querySelector("#statusMessage"),
  alertBadge: document.querySelector("#alertBadge"),
  feedBadge: document.querySelector("#feedBadge"),
  alertsList: document.querySelector("#alertsList"),
  eventFeed: document.querySelector("#eventFeed"),
  profilesList: document.querySelector("#profilesList"),
  timelineBadge: document.querySelector("#timelineBadge"),
  timeline: document.querySelector("#timeline"),
  refreshButton: document.querySelector("#refreshButton"),
  demoButton: document.querySelector("#demoButton"),
  exportButton: document.querySelector("#exportButton"),
};

function formatTime(value) {
  if (!value) return "--:--";
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "Unknown time";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function shortHash(value) {
  if (!value) return "No hash";
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  return payload;
}

function status(text, tone = "neutral") {
  elements.statusMessage.textContent = text;
  elements.statusMessage.dataset.tone = tone;
}

async function loadData() {
  status("Refreshing live data...");

  const [health, eventsPayload, verification, aiPayload] = await Promise.all([
    fetchJson(`${API_URL}/health`),
    fetchJson(`${API_URL}/events?limit=50`),
    fetchJson(`${API_URL}/ledger/verify`),
    fetchJson(`${AI_URL}/analyze`),
  ]);

  state.entries = eventsPayload.events || [];
  state.alerts = aiPayload.anomalies || [];
  if (!state.selectedEventId && state.entries.length > 0) {
    state.selectedEventId = state.entries[0].event.eventId;
  }

  renderMetrics(health, verification);
  renderAlerts();
  renderFeed();
  renderProfiles();
  renderTimeline();

  status("Services online. Live data synchronized.", "success");
}

function renderMetrics(health, verification) {
  const criticalAlerts = state.alerts.filter((alert) => alert.level === "critical");
  const latest = state.entries[0];

  elements.ledgerCount.textContent = String(health.ledgerEntries ?? state.entries.length);
  elements.ledgerStatus.textContent = health.ledgerValid ? "Ledger valid" : "Ledger invalid";
  elements.criticalCount.textContent = String(criticalAlerts.length);
  elements.integrityState.textContent = verification.valid ? "Valid" : "Broken";
  elements.integrityState.dataset.state = verification.valid ? "valid" : "broken";
  elements.integrityHash.textContent = latest ? shortHash(latest.blockHash) : "No blocks yet";
  elements.lastEventTime.textContent = latest ? formatTime(latest.receivedAt) : "--:--";
  elements.lastEventUser.textContent = latest ? latest.event.userId : "Waiting for logs";
  elements.alertBadge.textContent = `${state.alerts.length} active`;
  elements.feedBadge.textContent = `${state.entries.length} events`;
}

function renderAlerts() {
  if (state.alerts.length === 0) {
    elements.alertsList.innerHTML = `<div class="empty">No active AI alerts.</div>`;
    return;
  }

  elements.alertsList.innerHTML = state.alerts
    .map((alert) => {
      const reason = alert.reasons[0] || "Anomaly detected.";
      return `
        <button class="alert-item" data-event-id="${escapeHtml(alert.eventId)}">
          <span class="severity ${escapeHtml(alert.level)}">${escapeHtml(alert.level)}</span>
          <strong>${escapeHtml(alert.event.action)} by ${escapeHtml(alert.event.userId)}</strong>
          <span>${escapeHtml(reason)}</span>
          <meter min="0" max="100" value="${alert.score}"></meter>
        </button>
      `;
    })
    .join("");

  document.querySelectorAll(".alert-item").forEach((item) => {
    item.addEventListener("click", () => {
      state.selectedEventId = item.dataset.eventId;
      renderFeed();
      renderTimeline();
    });
  });
}

function renderFeed() {
  if (state.entries.length === 0) {
    elements.eventFeed.innerHTML = `<div class="empty">No blockchain events recorded.</div>`;
    return;
  }

  elements.eventFeed.innerHTML = state.entries
    .map((entry) => {
      const event = entry.event;
      const selected = event.eventId === state.selectedEventId ? "selected" : "";
      return `
        <button class="event-row ${selected}" data-event-id="${escapeHtml(event.eventId)}">
          <span class="event-time">${escapeHtml(formatDateTime(entry.receivedAt))}</span>
          <span class="event-main">
            <strong>${escapeHtml(event.action)}</strong>
            <small>${escapeHtml(event.userId)} from ${escapeHtml(event.sourceIp)}</small>
          </span>
          <span class="event-proof">${escapeHtml(shortHash(entry.blockHash))}</span>
        </button>
      `;
    })
    .join("");

  document.querySelectorAll(".event-row").forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedEventId = row.dataset.eventId;
      renderFeed();
      renderTimeline();
    });
  });
}

function renderProfiles() {
  const profiles = new Map();

  state.entries.forEach((entry) => {
    const event = entry.event;
    const profile = profiles.get(event.userId) || {
      userId: event.userId,
      actions: 0,
      critical: 0,
      assets: new Set(),
      lastSeen: entry.receivedAt,
    };

    profile.actions += 1;
    if (event.severity === "critical") profile.critical += 1;
    profile.assets.add(event.assetId);
    profile.lastSeen = entry.receivedAt;
    profiles.set(event.userId, profile);
  });

  if (profiles.size === 0) {
    elements.profilesList.innerHTML = `<div class="empty">No user profiles yet.</div>`;
    return;
  }

  elements.profilesList.innerHTML = Array.from(profiles.values())
    .map(
      (profile) => `
        <article class="profile">
          <strong>${escapeHtml(profile.userId)}</strong>
          <span>${profile.actions} events</span>
          <span>${profile.assets.size} assets</span>
          <span>${profile.critical} critical</span>
        </article>
      `
    )
    .join("");
}

function renderTimeline() {
  const selected =
    state.entries.find((entry) => entry.event.eventId === state.selectedEventId) ||
    state.entries[0];

  if (!selected) {
    elements.timeline.innerHTML = `<div class="empty">Select an event to build a forensic timeline.</div>`;
    return;
  }

  const alert = state.alerts.find((item) => item.eventId === selected.event.eventId);
  const event = selected.event;

  elements.timeline.innerHTML = `
    <ol>
      <li>
        <span>Event captured</span>
        <strong>${escapeHtml(event.action)} on ${escapeHtml(event.assetId)}</strong>
        <small>${escapeHtml(event.timestamp)}</small>
      </li>
      <li>
        <span>Blockchain proof</span>
        <strong>${escapeHtml(shortHash(selected.blockHash))}</strong>
        <small>Previous: ${escapeHtml(shortHash(selected.previousHash))}</small>
      </li>
      <li>
        <span>AI decision</span>
        <strong>${alert ? `${alert.level} anomaly, score ${alert.score}` : "No anomaly"}</strong>
        <small>${escapeHtml(alert ? alert.reasons.join(" ") : "Event matches baseline.")}</small>
      </li>
    </ol>
  `;
  elements.timelineBadge.textContent = event.eventId;
}

async function simulateSuspiciousLogin() {
  const event = {
    eventId: `evt-${crypto.randomUUID()}`,
    timestamp: "2026-05-15T03:00:00Z",
    userId: "maintenance_ext_01",
    userRole: "contractor",
    action: "LOGIN",
    assetId: "scada-main-01",
    assetType: "SCADA",
    sourceIp: "203.0.113.77",
    severity: "critical",
    metadata: {
      location: "Tanger Plant",
      source: "dashboard-demo",
      shift: "night",
      demoScenario: "Suspicious login at 03:00 from unknown IP",
    },
  };

  status("Writing suspicious login to blockchain...");
  const entry = await fetchJson(`${API_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });

  state.selectedEventId = entry.event.eventId;
  await loadData();
}

function exportCsv() {
  const rows = [
    ["index", "receivedAt", "eventId", "userId", "action", "assetId", "sourceIp", "severity", "blockHash"],
    ...state.entries.map((entry) => [
      entry.index,
      entry.receivedAt,
      entry.event.eventId,
      entry.event.userId,
      entry.event.action,
      entry.event.assetId,
      entry.event.sourceIp,
      entry.event.severity,
      entry.blockHash,
    ]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "blockchain-audit-logs.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function safeAction(action) {
  try {
    await action();
  } catch (error) {
    status(error.message, "error");
  }
}

elements.refreshButton.addEventListener("click", () => safeAction(loadData));
elements.demoButton.addEventListener("click", () => safeAction(simulateSuspiciousLogin));
elements.exportButton.addEventListener("click", exportCsv);

loadData().catch((error) => {
  status(error.message, "error");
});

setInterval(() => {
  loadData().catch((error) => status(error.message, "error"));
}, 5000);
