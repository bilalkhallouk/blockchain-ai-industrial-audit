# Blockchain Audit Log + AI Anomaly Detection

Platform for immutable industrial audit logs and real-time anomaly detection.

## Core Idea

Every critical event in a factory environment is recorded on a private blockchain, then analyzed by an AI module that detects suspicious behavior in real time.

## Modules

- `blockchain/` - smart contracts and blockchain API
- `agent/` - log capture agent that formats industrial events
- `ai/` - anomaly detection service
- `dashboard/` - real-time supervision interface
- `docs/` - architecture, planning, demo, and team notes

## MVP Demo Scenario

1. A simulated SCADA/PLC event is generated.
2. The capture agent sends the event to the blockchain API.
3. The blockchain layer stores the event immutably.
4. The AI module scores the event.
5. A suspicious login from an unknown IP at 03:00 is flagged.
6. The dashboard displays the alert, blockchain proof, and incident timeline.

## Tools

- Docker Desktop
- Node.js LTS
- Python 3.11+
- Git
- VS Code

