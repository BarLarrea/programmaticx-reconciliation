#!/usr/bin/env python3
"""Local mock partner reporting API. Standard library only.

Usage:
    python mock_api/server.py

Then:
    curl "http://127.0.0.1:8000/report?date=YYYY-MM-DD"
"""

from __future__ import annotations

import json
import os
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
REPORTS = json.loads((ROOT / "reports.json").read_text())
HOST = "127.0.0.1"
PORT = int(os.environ.get("PORT", "8000"))
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        print("[mock-api] " + (fmt % args))

    def _send(self, status: int, body: dict) -> None:
        payload = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/report":
            self._send(404, {"error": "not found"})
            return
        date = parse_qs(parsed.query).get("date", [None])[0]
        if not date or not DATE_RE.match(date):
            self._send(400, {"error": "pass date=YYYY-MM-DD"})
            return
        rows = REPORTS.get(date, [])
        self._send(200, {"date": date, "rows": rows})


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Mock partner API at http://{HOST}:{PORT}", flush=True)
    print("Example: curl \"http://127.0.0.1:8000/report?date=2026-10-20\"")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping")
        server.shutdown()


if __name__ == "__main__":
    main()
