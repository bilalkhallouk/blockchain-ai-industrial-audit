# Log Capture Agent

Owner: Salah

Responsibilities:

- Capture or simulate SCADA/PLC access events.
- Convert raw events into the shared JSON schema.
- Send events to the blockchain API.

MVP target:

- Generate normal login events.
- Generate suspicious login events for the demo.
- Send events over HTTP.

## Current Implementation

The first version is a Python standard-library script. It simulates industrial audit events and sends them to the blockchain API.

No external Python packages are required.

## Run

Start the blockchain API first:

```powershell
cd ..\blockchain
npm.cmd start
```

In another terminal, from the project root:

```powershell
python .\agent\agent.py suspicious-login
```

If you are currently inside the `blockchain` folder:

```powershell
python ..\agent\agent.py suspicious-login
```

## Scenarios

```powershell
python .\agent\agent.py normal-login
python .\agent\agent.py suspicious-login
python .\agent\agent.py config-change
python .\agent\agent.py shutdown
```

Preview an event without sending it:

```powershell
python .\agent\agent.py suspicious-login --dry-run
```

## Test

From the project root:

```powershell
python -m unittest agent.test_agent
```
