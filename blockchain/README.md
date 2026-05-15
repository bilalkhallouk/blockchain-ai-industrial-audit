# Blockchain Module

Owner: Bilal

Responsibilities:

- Deploy a local private blockchain network.
- Implement the smart contract for audit log storage.
- Expose an API to submit and query events.

MVP target:

- Store one event.
- Query one event by ID.
- Query recent events for the dashboard.

## Current Implementation

This first version is a dependency-free Node.js mock blockchain API. It is not Hyperledger Fabric yet, but it gives the team a stable integration point while the real blockchain network is prepared.

It provides:

- append-only JSON ledger storage
- SHA-256 event hashes
- chained block hashes using `previousHash`
- HMAC signatures for event authenticity in development
- ledger verification endpoint for tamper detection

## Run Locally

```powershell
npm install
npm start
```

The API runs on:

```text
http://localhost:4000
```

## API

### Health

```http
GET /health
```

### Create Event

```http
POST /events
Content-Type: application/json
```

```json
{
  "timestamp": "2026-05-15T03:00:00Z",
  "userId": "maintenance_ext_01",
  "userRole": "contractor",
  "action": "LOGIN",
  "assetId": "scada-main-01",
  "assetType": "SCADA",
  "sourceIp": "10.10.50.23",
  "severity": "critical",
  "metadata": {
    "location": "Tanger Plant"
  }
}
```

### List Events

```http
GET /events
GET /events?limit=20
GET /events?userId=maintenance_ext_01
GET /events?action=LOGIN
```

### Get Event

```http
GET /events/{eventId}
```

### Verify Ledger

```http
GET /ledger/verify
```
