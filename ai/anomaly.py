from datetime import datetime


KNOWN_USERS = {
    "bilal.khallouk",
    "mohamed.benajiba",
    "salah.elouali",
    "walid.lamhamdi",
}

KNOWN_PRIVATE_PREFIXES = (
    "10.",
    "172.16.",
    "172.17.",
    "172.18.",
    "172.19.",
    "172.20.",
    "172.21.",
    "172.22.",
    "172.23.",
    "172.24.",
    "172.25.",
    "172.26.",
    "172.27.",
    "172.28.",
    "172.29.",
    "172.30.",
    "172.31.",
    "192.168.",
)

HIGH_RISK_ACTIONS = {
    "PLC_CONFIG_CHANGE",
    "SYSTEM_SHUTDOWN",
    "FIRMWARE_UPDATE",
    "PERMISSION_CHANGE",
}


def unwrap_event(payload):
    if payload and "event" in payload and isinstance(payload["event"], dict):
        return payload["event"]
    return payload or {}


def parse_hour(timestamp):
    if not timestamp:
        return None

    normalized = timestamp.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized).hour
    except ValueError:
        return None


def is_private_ip(source_ip):
    return bool(source_ip) and source_ip.startswith(KNOWN_PRIVATE_PREFIXES)


def score_event(payload):
    event = unwrap_event(payload)
    reasons = []
    score = 0

    hour = parse_hour(event.get("timestamp"))
    if hour is None:
        score += 20
        reasons.append("Invalid or missing timestamp.")
    elif hour < 6 or hour > 22:
        score += 35
        reasons.append("Access occurred outside normal working hours.")

    user_id = event.get("userId", "")
    if user_id not in KNOWN_USERS:
        score += 25
        reasons.append("User is not part of the known internal user baseline.")

    source_ip = event.get("sourceIp", "")
    if not is_private_ip(source_ip):
        score += 25
        reasons.append("Source IP is outside the expected private industrial network.")

    user_role = event.get("userRole", "").lower()
    if user_role in {"contractor", "external", "vendor"}:
        score += 15
        reasons.append("External or contractor account used for access.")

    action = event.get("action", "")
    if action in HIGH_RISK_ACTIONS:
        score += 25
        reasons.append(f"High-risk industrial action detected: {action}.")

    severity = event.get("severity", "").lower()
    if severity == "critical":
        score += 20
        reasons.append("Event severity is marked critical.")
    elif severity == "high":
        score += 10
        reasons.append("Event severity is marked high.")

    score = min(score, 100)

    if score >= 75:
        level = "critical"
    elif score >= 50:
        level = "high"
    elif score >= 25:
        level = "medium"
    else:
        level = "low"

    return {
        "eventId": event.get("eventId"),
        "score": score,
        "anomalous": score >= 50,
        "level": level,
        "reasons": reasons or ["Event matches the current normal behavior baseline."],
        "event": event,
    }


def score_entries(entries):
    alerts = [score_event(entry) for entry in entries]
    return {
        "count": len(alerts),
        "alerts": alerts,
        "anomalies": [alert for alert in alerts if alert["anomalous"]],
    }
