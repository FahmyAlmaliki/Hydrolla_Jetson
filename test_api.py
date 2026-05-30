#!/usr/bin/env python3
"""HYDROLA API tester.

Usage examples:
  python test_api.py schema
  python test_api.py telemetry
  python test_api.py telemetry --base-url http://10.26.49.250:3030 --ph 7.2 --do 6.5 --temperature 28.4 --nh3 0.03
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone, timedelta


def normalize_base_url(value: str) -> str:
    value = value.strip().rstrip("/")
    if not value:
        return "http://10.26.49.250:3030"
    if "://" not in value:
        return f"http://{value}"
    return value


def build_default_base_url() -> str:
    env_value = (
        os.environ.get("HYDROLA_API_BASE_URL")
        or os.environ.get("API_BASE_URL")
        or os.environ.get("NEXT_PUBLIC_APP_URL")
        or "http://10.26.49.250:3030"
    )
    return normalize_base_url(env_value)


def iso_now_wib() -> str:
    wib = timezone(timedelta(hours=7))
    return datetime.now(wib).isoformat(timespec="seconds")


def request_json(url: str, method: str = "GET", payload: dict | None = None) -> tuple[int, object]:
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
      data = json.dumps(payload).encode("utf-8")
      headers["Content-Type"] = "application/json"

    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            body = response.read().decode("utf-8")
            parsed = json.loads(body) if body else None
            return response.status, parsed
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8")
        try:
            parsed = json.loads(body) if body else None
        except json.JSONDecodeError:
            parsed = body
        return error.code, parsed


def pretty_print_result(title: str, status: int, body: object) -> None:
    print(f"== {title} ==")
    print(f"HTTP {status}")
    if body is None:
        print("<empty response>")
    elif isinstance(body, (dict, list)):
        print(json.dumps(body, indent=2, ensure_ascii=False))
    else:
        print(body)
    print()


def build_telemetry_payload(args: argparse.Namespace) -> dict:
    payload = {
        "sensor_id": args.sensor_id,
        "location": args.location,
        "timestamp": args.timestamp or iso_now_wib(),
        "ph": args.ph,
        "do": args.do,
        "temperature": args.temperature,
        "nh3": args.nh3,
    }

    if args.battery is not None:
        payload["battery"] = args.battery
    if args.rssi is not None:
        payload["rssi"] = args.rssi
    if args.tds is not None:
        payload["tds"] = args.tds

    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="HYDROLA API tester")
    parser.add_argument(
        "action",
        choices=["schema", "telemetry", "both"],
        nargs="?",
        default="both",
        help="Endpoint yang akan diuji",
    )
    parser.add_argument("--base-url", default=build_default_base_url(), help="Base URL aplikasi, contoh http://10.26.49.250:3030")
    parser.add_argument("--sensor-id", default="esp32-kolam-01", help="Sensor ID untuk payload telemetry")
    parser.add_argument("--location", default="kolam-utama", help="Lokasi sensor")
    parser.add_argument("--timestamp", default=None, help="Timestamp ISO 8601, default waktu sekarang WIB")
    parser.add_argument("--ph", type=float, default=7.12, help="Nilai pH")
    parser.add_argument("--do", dest="do", type=float, default=6.48, help="Nilai Dissolved Oxygen")
    parser.add_argument("--temperature", type=float, default=28.4, help="Nilai suhu")
    parser.add_argument("--nh3", type=float, default=0.028, help="Nilai NH3")
    parser.add_argument("--battery", type=float, default=None, help="Tegangan baterai opsional")
    parser.add_argument("--rssi", type=float, default=None, help="RSSI opsional")
    parser.add_argument("--tds", type=float, default=None, help="TDS opsional")
    args = parser.parse_args()

    base_url = normalize_base_url(args.base_url)

    if args.action in {"schema", "both"}:
        status, body = request_json(f"{base_url}/api/influx-schema")
        pretty_print_result("GET /api/influx-schema", status, body)

    if args.action in {"telemetry", "both"}:
        payload = build_telemetry_payload(args)
        status, body = request_json(f"{base_url}/api/telemetry", method="POST", payload=payload)
        pretty_print_result("POST /api/telemetry", status, body)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())