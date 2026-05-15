# Architecture

## Event Flow

```text
SCADA/PLC event
  -> Log capture agent
  -> Blockchain API
  -> Smart contract / immutable ledger
  -> AI anomaly detection
  -> Dashboard alert and forensic timeline
```

## Event Schema

```json
{
  "eventId": "evt-001",
  "timestamp": "2026-05-15T03:00:00Z",
  "userId": "maintenance_ext_01",
  "userRole": "contractor",
  "action": "LOGIN",
  "assetId": "scada-main-01",
  "assetType": "SCADA",
  "sourceIp": "10.10.50.23",
  "severity": "medium",
  "metadata": {
    "location": "Tanger Plant",
    "command": null
  },
  "signature": "cryptographic-signature-placeholder"
}
```

## Main Components

### Blockchain Layer

- Stores every event immutably.
- Adds timestamp and cryptographic signature.
- Exposes query APIs for dashboard, AI, and reporting.

### Log Capture Agent

- Captures or simulates industrial access events.
- Normalizes events into the shared JSON schema.
- Sends events to the blockchain API.

### AI Module

- Learns normal access patterns.
- Uses Isolation Forest for the first MVP.
- Scores each new event.
- Generates alerts when the anomaly score crosses the threshold.

### Dashboard

- Shows real-time event feed.
- Displays anomaly alerts.
- Provides user behavior profiles.
- Builds forensic timelines.
- Exports audit reports.
