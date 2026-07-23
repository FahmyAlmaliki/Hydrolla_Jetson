#!/usr/bin/env python3
"""Send random HYDROLA telemetry payloads to the API.

Examples:
  python random_post_api.py
  python random_post_api.py --count 10 --interval 2
  python random_post_api.py --base-url http://10.26.48.101:3030 --sensor-id esp32-kolam-02
"""

from __future__ import annotations

import argparse
import json
import os
import random
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone


def normalize_base_url(value: str) -> str:
    value = value.strip().rstrip("/")
    if not value:
        return "http://localhost:3030"
    if "://" not in value:
        return f"http://{value}"
    return value


def default_base_url() -> str:
    env_value = (
        os.environ.get("HYDROLA_API_BASE_URL")
        or os.environ.get("API_BASE_URL")
        or "http://localhost:3030"
    )
    return normalize_base_url(env_value)


def iso_now_wib() -> str:
    wib = timezone(timedelta(hours=7))
    return datetime.now(wib).isoformat(timespec="seconds")


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def generate_payload(sensor_id: str, location: str) -> dict:
    ph = round(random.uniform(6.2, 8.4), 2)
    do_value = round(random.uniform(4.5, 7.8), 2)
    temperature = round(random.uniform(25.0, 31.5), 1)
    nh3 = round(random.uniform(0.005, 0.08), 3)

    battery = round(random.uniform(3.65, 4.18), 2)
    rssi = int(clamp(random.gauss(-62, 5), -90, -35))

    return {
        "sensor_id": sensor_id,
        "location": location,
        "timestamp": iso_now_wib(),
        "ph": ph,
        "do": do_value,
        "temperature": temperature,
        "nh3": nh3,
        "battery": battery,
        "rssi": rssi,
    }


def post_json(url: str, payload: dict) -> tuple[int, object]:
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            raw = response.read().decode("utf-8")
            parsed = json.loads(raw) if raw else None
            return response.status, parsed
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8")
        try:
            parsed = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            parsed = raw
        return error.code, parsed


def main() -> int:
    parser = argparse.ArgumentParser(description="Random telemetry poster for HYDROLA")
    parser.add_argument("--base-url", default=default_base_url(), help="Base URL aplikasi, contoh http://localhost:3030")
    parser.add_argument("--sensor-id", default="esp32-kolam-01", help="Sensor ID yang dikirim")
    parser.add_argument("--location", default="kolam-utama", help="Lokasi sensor")
    parser.add_argument("--count", type=int, default=1, help="Jumlah POST acak yang dikirim")
    parser.add_argument("--interval", type=float, default=0.0, help="Jeda antar POST dalam detik")
    parser.add_argument("--endpoint", default="/api/telemetry", help="Path endpoint telemetry")
    args = parser.parse_args()

    base_url = normalize_base_url(args.base_url)
    url = f"{base_url}{args.endpoint if args.endpoint.startswith('/') else '/' + args.endpoint}"

    if args.count < 1:
        raise SystemExit("--count harus minimal 1")

    for index in range(args.count):
        payload = generate_payload(args.sensor_id, args.location)
        status, response = post_json(url, payload)

        print(f"[{index + 1}/{args.count}] POST {url}")
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        print(f"HTTP {status}")
        if isinstance(response, (dict, list)):
            print(json.dumps(response, indent=2, ensure_ascii=False))
        else:
            print(response)
        print()

        if index + 1 < args.count and args.interval > 0:
            time.sleep(args.interval)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
