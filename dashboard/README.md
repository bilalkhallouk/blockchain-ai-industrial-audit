# Dashboard Module

Owner: Walid

Responsibilities:

- Display blockchain events in real time.
- Display AI anomaly alerts.
- Show user behavior profiles and forensic timeline.
- Export logs for audit.

MVP target:

- Real-time event feed.
- Alert list with severity.
- Incident timeline for the suspicious login demo.

## Current Implementation

This first version is a dependency-free web dashboard served by Node.js.

It shows:

- blockchain ledger health
- AI critical alert count
- real-time event feed
- anomaly alert list with scores and explanations
- user behavior profiles
- forensic timeline with block hash proof
- CSV export
- suspicious login demo trigger

## Run

Start the blockchain API:

```powershell
cd .\blockchain
npm.cmd start
```

Start the AI service in another terminal:

```powershell
cd .\ai
python server.py
```

Start the dashboard in a third terminal:

```powershell
cd .\dashboard
npm.cmd start
```

Open:

```text
http://localhost:3000
```

## Test

```powershell
npm.cmd test
```
