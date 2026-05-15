# AI Module

Owner: Mohamed

Responsibilities:

- Train an anomaly detection model on normal event behavior.
- Score new blockchain log events.
- Generate alerts for suspicious behavior.

MVP target:

- Use Isolation Forest.
- Detect unusual access hour, unknown IP, and abnormal command sequence.
- Return an anomaly score and explanation.

## Current Implementation

This first version is a dependency-free anomaly scoring service. It uses transparent rules so the demo is easy to explain to the jury, while leaving room to replace the scoring engine with Isolation Forest later.

It detects:

- access outside normal working hours
- unknown users
- public or unexpected source IP addresses
- contractor or external accounts
- high-risk industrial actions
- critical/high severity events

## Run

Start the blockchain API first:

```powershell
cd .\blockchain
npm.cmd start
```

In another terminal, from the project root:

```powershell
cd .\ai
python server.py
```

The AI service runs on:

```text
http://localhost:5000
```

## API

### Health

```http
GET /health
```

### Analyze Blockchain Events

```http
GET /analyze
```

This reads events from the blockchain API and returns anomaly scores and alert explanations.

### Score One Event

```http
POST /score
Content-Type: application/json
```

The body can be either a raw event or a blockchain ledger entry containing an `event` field.

## Test

From the project root:

```powershell
python -m unittest ai.test_anomaly
```
