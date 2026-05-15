import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

try:
    from anomaly import score_entries, score_event
except ImportError:
    from ai.anomaly import score_entries, score_event


PORT = int(os.environ.get("PORT", "5000"))
BLOCKCHAIN_API_URL = os.environ.get("BLOCKCHAIN_API_URL", "http://localhost:4000")


def read_json_body(handler):
    length = int(handler.headers.get("Content-Length", "0"))
    if length == 0:
        return {}
    raw = handler.rfile.read(length).decode("utf-8")
    return json.loads(raw)


def send_json(handler, status_code, payload):
    body = json.dumps(payload, indent=2).encode("utf-8")
    handler.send_response(status_code)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def fetch_blockchain_events(limit=100):
    endpoint = f"{BLOCKCHAIN_API_URL.rstrip('/')}/events?limit={limit}"
    with urllib.request.urlopen(endpoint, timeout=10) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return payload.get("events", [])


class AiHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        send_json(self, 204, {})

    def do_GET(self):
        path = urlparse(self.path).path

        if path == "/health":
            send_json(
                self,
                200,
                {
                    "status": "ok",
                    "blockchainApiUrl": BLOCKCHAIN_API_URL,
                },
            )
            return

        if path == "/analyze":
            try:
                entries = fetch_blockchain_events()
            except urllib.error.URLError as error:
                send_json(
                    self,
                    503,
                    {
                        "error": "Could not reach blockchain API.",
                        "details": str(error.reason),
                    },
                )
                return

            send_json(self, 200, score_entries(entries))
            return

        send_json(self, 404, {"error": "Route not found."})

    def do_POST(self):
        path = urlparse(self.path).path

        if path == "/score":
            try:
                payload = read_json_body(self)
            except json.JSONDecodeError:
                send_json(self, 400, {"error": "Request body must be valid JSON."})
                return

            send_json(self, 200, score_event(payload))
            return

        send_json(self, 404, {"error": "Route not found."})

    def log_message(self, format, *args):
        return


def run():
    server = ThreadingHTTPServer(("0.0.0.0", PORT), AiHandler)
    print(f"AI anomaly service listening on http://localhost:{PORT}")
    print(f"Reading blockchain events from {BLOCKCHAIN_API_URL}")
    server.serve_forever()


if __name__ == "__main__":
    run()
