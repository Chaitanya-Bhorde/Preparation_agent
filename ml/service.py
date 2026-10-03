"""stdin/stdout entry point for the recommendation service.

The Node backend spawns this, writes one JSON payload and reads one JSON
response. Exits non-zero on any failure so the caller can fall back without
having to distinguish error shapes.
"""

from __future__ import annotations

import json
import sys

from recommender import build_recommendations


def main() -> int:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        print(json.dumps({"error": "invalid JSON payload"}), file=sys.stderr)
        return 2

    if not isinstance(payload, dict):
        print(json.dumps({"error": "payload must be an object"}), file=sys.stderr)
        return 2

    result = build_recommendations(payload, payload.get("config"))
    json.dump(result, sys.stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main())