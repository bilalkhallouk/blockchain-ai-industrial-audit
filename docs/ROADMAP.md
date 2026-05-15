# Project Roadmap

## Step 1 - Validate the Cahier des Charges

- Read the cahier des charges as a group.
- Confirm the scope: blockchain audit logs, AI anomaly detection, dashboard, and demo.
- Collect group approval.
- Send the final version to M. Hassan BADIR.

## Step 2 - Setup the Environment

- Install Docker Desktop.
- Install Node.js LTS.
- Install Python 3.11+.
- Install Git.
- Create a private GitHub repository.
- Add all members and the supervisor if required.
- Use one branch per module:
  - `blockchain`
  - `ai`
  - `agent`
  - `dashboard`

## Step 3 - Build the Foundation

- Define the JSON event schema.
- Build the blockchain storage contract/API first.
- Add local mock data for the agent, AI module, and dashboard while blockchain is still being prepared.

## Step 4 - Build Modules

- Blockchain: store and query immutable log entries.
- Agent: capture or simulate industrial system events.
- AI: detect abnormal access patterns.
- Dashboard: display event feed, alerts, profiles, timeline, and exports.

## Step 5 - Integration and Testing

- Connect agent to blockchain API.
- Connect AI to event stream.
- Connect dashboard to blockchain and AI APIs.
- Test normal events and suspicious events.

## Step 6 - Jury Demo

Scenario: suspicious login at 03:00 from an unknown IP.

Expected result:

- Blockchain stores immutable proof.
- AI flags the event as anomalous.
- Dashboard displays the alert and incident timeline.
