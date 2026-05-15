import argparse
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from uuid import uuid4


DEFAULT_API_URL = "http://localhost:4000"


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def build_event(scenario):
    base_event = {
        "eventId": f"evt-{uuid4()}",
        "timestamp": now_iso(),
        "assetId": "scada-main-01",
        "assetType": "SCADA",
        "metadata": {
            "location": "Tanger Plant",
            "source": "python-log-agent",
        },
    }

    scenarios = {
        "normal-login": {
            "userId": "bilal.khallouk",
            "userRole": "engineer",
            "action": "LOGIN",
            "sourceIp": "10.10.10.15",
            "severity": "low",
            "metadata": {
                "shift": "day",
                "reason": "scheduled maintenance check",
            },
        },
        "suspicious-login": {
            "timestamp": "2026-05-15T03:00:00Z",
            "userId": "maintenance_ext_01",
            "userRole": "contractor",
            "action": "LOGIN",
            "sourceIp": "203.0.113.77",
            "severity": "critical",
            "metadata": {
                "shift": "night",
                "reason": "unknown",
                "demoScenario": "Suspicious login at 03:00 from unknown IP",
            },
        },
        "config-change": {
            "userId": "salah.elouali",
            "userRole": "maintenance",
            "action": "PLC_CONFIG_CHANGE",
            "assetId": "plc-line-02",
            "assetType": "PLC",
            "sourceIp": "10.10.20.8",
            "severity": "medium",
            "metadata": {
                "command": "update_threshold",
                "parameter": "temperature_limit",
                "oldValue": "80",
                "newValue": "85",
            },
        },
        "shutdown": {
            "userId": "walid.lamhamdi",
            "userRole": "operator",
            "action": "SYSTEM_SHUTDOWN",
            "assetId": "scada-main-01",
            "assetType": "SCADA",
            "sourceIp": "10.10.10.21",
            "severity": "high",
            "metadata": {
                "reason": "planned shutdown simulation",
            },
        },
    }

    if scenario not in scenarios:
        choices = ", ".join(sorted(scenarios))
        raise ValueError(f"Unknown scenario '{scenario}'. Available scenarios: {choices}")

    scenario_event = scenarios[scenario]
    metadata = {**base_event["metadata"], **scenario_event.get("metadata", {})}

    return {
        **base_event,
        **scenario_event,
        "metadata": metadata,
    }


def post_event(api_url, event):
    endpoint = f"{api_url.rstrip('/')}/events"
    payload = json.dumps(event).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=payload,
        method="POST",
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            body = response.read().decode("utf-8")
            return response.status, json.loads(body)
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8")
        try:
            details = json.loads(body)
        except json.JSONDecodeError:
            details = {"error": body}
        return error.code, details
    except urllib.error.URLError as error:
        raise ConnectionError(f"Could not reach blockchain API at {endpoint}: {error.reason}") from error


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate SCADA/PLC audit events and send them to the blockchain API."
    )
    parser.add_argument(
        "scenario",
        choices=["normal-login", "suspicious-login", "config-change", "shutdown"],
        help="Event scenario to generate.",
    )
    parser.add_argument(
        "--api-url",
        default=DEFAULT_API_URL,
        help=f"Blockchain API base URL. Default: {DEFAULT_API_URL}",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the event without sending it.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    event = build_event(args.scenario)

    if args.dry_run:
        print(json.dumps(event, indent=2))
        return 0

    try:
        status, result = post_event(args.api_url, event)
    except ConnectionError as error:
        print(str(error), file=sys.stderr)
        return 1

    print(json.dumps(result, indent=2))

    if status >= 400:
        return 1

    print(
        f"\nEvent sent: {result['event']['eventId']} "
        f"with block hash {result['blockHash']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
