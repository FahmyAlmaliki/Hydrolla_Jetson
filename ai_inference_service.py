#!/usr/bin/env python3
"""HYDROLA AI Inference Service — baca dari InfluxDB, inferensi model CNN-LSTM, tulis hasil ke InfluxDB.

Menggantikan Jetson_AI_Core.py yang membaca dari CSV.
Membutuhkan model & scaler di folder ai_models/:
  best_model_do.h5, best_model_ph.h5, best_model_suhu.h5
  scaler_do.pkl, scaler_ph.pkl, scaler_suhu.pkl

Env vars (sama dengan website):
  INFLUXDB_URL, INFLUXDB_TOKEN, INFLUXDB_ORG, INFLUXDB_BUCKET
"""

from __future__ import annotations

import gc
import os
import time
from datetime import datetime, timezone

import joblib
import numpy as np
import tensorflow as tf
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "ai_models")

INFLUXDB_URL = os.environ.get("INFLUXDB_URL", "http://10.26.48.177:8086")
INFLUXDB_TOKEN = os.environ.get("INFLUXDB_TOKEN", "mytoken123")
INFLUXDB_ORG = os.environ.get("INFLUXDB_ORG", "flagship")
INFLUXDB_BUCKET = os.environ.get("INFLUXDB_BUCKET", "sensor")

LOOKBACK = 20
INTERVAL_SEC = int(os.environ.get("AI_INFERENCE_INTERVAL", "10"))

# ── Threshold dari Jetson_AI_Core.py ──────────────────────────
THRESHOLD_RESIDU_DO = 0.8
THRESHOLD_RESIDU_PH = 0.3
THRESHOLD_RESIDU_SUHU = 1.0
LIMIT_BAWAH_DO = 5.0
LIMIT_ATAS_PH = 8.5
LIMIT_BAWAH_PH = 6.5
LIMIT_ATAS_SUHU = 32.0


def load_models():
    print("Memuat model CNN-LSTM...")
    model_suhu = tf.keras.models.load_model(
        os.path.join(MODEL_DIR, "best_model_suhu.h5"), compile=False
    )
    model_ph = tf.keras.models.load_model(
        os.path.join(MODEL_DIR, "best_model_ph.h5"), compile=False
    )
    model_do = tf.keras.models.load_model(
        os.path.join(MODEL_DIR, "best_model_do.h5"), compile=False
    )
    scaler_suhu = joblib.load(os.path.join(MODEL_DIR, "scaler_suhu.pkl"))
    scaler_ph = joblib.load(os.path.join(MODEL_DIR, "scaler_ph.pkl"))
    scaler_do = joblib.load(os.path.join(MODEL_DIR, "scaler_do.pkl"))
    return model_suhu, model_ph, model_do, scaler_suhu, scaler_ph, scaler_do


def get_influx_client():
    return InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)


def fetch_recent_data(client) -> dict | None:
    query = f"""
    from(bucket: "{INFLUXDB_BUCKET}")
      |> range(start: -24h)
      |> filter(fn: (r) => r._measurement == "water_quality")
      |> filter(fn: (r) => r._field == "ph" or r._field == "do" or r._field == "temperature")
      |> last()
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
    """
    tables = client.query_api().query(query)
    for table in tables:
        for record in table.records:
            return {
                "ph": record.values.get("ph"),
                "do": record.values.get("do"),
                "temperature": record.values.get("temperature"),
            }
    return None


def fetch_lookback_data(client) -> tuple | None:
    limit = LOOKBACK * 2
    query_ph = f"""
    from(bucket: "{INFLUXDB_BUCKET}")
      |> range(start: -24h)
      |> filter(fn: (r) => r._measurement == "water_quality")
      |> filter(fn: (r) => r._field == "ph")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: {limit})
      |> sort(columns: ["_time"], desc: false)
    """
    query_do = f"""
    from(bucket: "{INFLUXDB_BUCKET}")
      |> range(start: -24h)
      |> filter(fn: (r) => r._measurement == "water_quality")
      |> filter(fn: (r) => r._field == "do")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: {limit})
      |> sort(columns: ["_time"], desc: false)
    """
    query_suhu = f"""
    from(bucket: "{INFLUXDB_BUCKET}")
      |> range(start: -24h)
      |> filter(fn: (r) => r._measurement == "water_quality")
      |> filter(fn: (r) => r._field == "temperature")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: {limit})
      |> sort(columns: ["_time"], desc: false)
    """

    qapi = client.query_api()

    ph_rows = []
    for table in qapi.query(query_ph):
        for r in table.records:
            ph_rows.append(r.get_value())

    do_rows = []
    for table in qapi.query(query_do):
        for r in table.records:
            do_rows.append(r.get_value())

    suhu_rows = []
    for table in qapi.query(query_suhu):
        for r in table.records:
            suhu_rows.append(r.get_value())

    n = min(len(ph_rows), len(do_rows), len(suhu_rows))
    if n < LOOKBACK:
        return None

    return (
        np.array(suhu_rows[-LOOKBACK:]),
        np.array(ph_rows[-LOOKBACK:]),
        np.array(do_rows[-LOOKBACK:]),
    )


def run_inference(
    model_suhu, model_ph, model_do,
    scaler_suhu, scaler_ph, scaler_do,
    val_suhu, val_ph, val_do,
):
    tf.keras.backend.clear_session()

    current_suhu = val_suhu[-1]
    current_ph = val_ph[-1]
    current_do = val_do[-1]

    in_suhu = scaler_suhu.transform(val_suhu.reshape(-1, 1)).reshape(1, LOOKBACK, 1)
    in_ph = scaler_ph.transform(val_ph.reshape(-1, 1)).reshape(1, LOOKBACK, 1)
    in_do = scaler_do.transform(val_do.reshape(-1, 1)).reshape(1, LOOKBACK, 1)

    pred_suhu = scaler_suhu.inverse_transform(
        model_suhu(in_suhu, training=False).numpy()
    )[0][0]
    pred_ph = scaler_ph.inverse_transform(
        model_ph(in_ph, training=False).numpy()
    )[0][0]
    pred_do = scaler_do.inverse_transform(
        model_do(in_do, training=False).numpy()
    )[0][0]

    offset_suhu = current_suhu - pred_suhu
    offset_ph = current_ph - pred_ph
    offset_do = current_do - pred_do

    residu_suhu = abs(offset_suhu)
    residu_ph = abs(offset_ph)
    residu_do = abs(offset_do)

    acc_suhu = (
        max(0.0, 100.0 - (residu_suhu / current_suhu * 100))
        if current_suhu != 0
        else 0
    )
    acc_ph = (
        max(0.0, 100.0 - (residu_ph / current_ph * 100))
        if current_ph != 0
        else 0
    )
    acc_do = (
        max(0.0, 100.0 - (residu_do / current_do * 100))
        if current_do != 0
        else 0
    )

    status_suhu = (
        "ANOMALI"
        if (residu_suhu > THRESHOLD_RESIDU_SUHU and current_suhu > LIMIT_ATAS_SUHU)
        else "OK"
    )
    status_ph = (
        "ANOMALI"
        if (
            residu_ph > THRESHOLD_RESIDU_PH
            and (current_ph > LIMIT_ATAS_PH or current_ph < LIMIT_BAWAH_PH)
        )
        else "OK"
    )
    status_do = (
        "ANOMALI"
        if (residu_do > THRESHOLD_RESIDU_DO and current_do < LIMIT_BAWAH_DO)
        else "OK"
    )

    gc.collect()

    return {
        "current_suhu": current_suhu,
        "current_ph": current_ph,
        "current_do": current_do,
        "pred_suhu": pred_suhu,
        "pred_ph": pred_ph,
        "pred_do": pred_do,
        "offset_suhu": offset_suhu,
        "offset_ph": offset_ph,
        "offset_do": offset_do,
        "acc_suhu": acc_suhu,
        "acc_ph": acc_ph,
        "acc_do": acc_do,
        "status_suhu": status_suhu,
        "status_ph": status_ph,
        "status_do": status_do,
    }


def write_predictions(client, result: dict):
    ts = datetime.now(timezone.utc)
    point = (
        Point("ai_predictions")
        .tag("model_version", "cnn_lstm_v1")
        .field("current_temperature", result["current_suhu"])
        .field("current_ph", result["current_ph"])
        .field("current_do", result["current_do"])
        .field("predicted_temperature", result["pred_suhu"])
        .field("predicted_ph", result["pred_ph"])
        .field("predicted_do", result["pred_do"])
        .field("offset_temperature", result["offset_suhu"])
        .field("offset_ph", result["offset_ph"])
        .field("offset_do", result["offset_do"])
        .field("accuracy_temperature", result["acc_suhu"])
        .field("accuracy_ph", result["acc_ph"])
        .field("accuracy_do", result["acc_do"])
        .field("status_temperature", result["status_suhu"])
        .field("status_ph", result["status_ph"])
        .field("status_do", result["status_do"])
        .time(ts)
    )
    write_api = client.write_api(write_options=SYNCHRONOUS)
    write_api.write(bucket=INFLUXDB_BUCKET, record=point)
    write_api.close()


def main():
    print("HYDROLA AI Inference Service dimulai")
    print(f"  InfluxDB : {INFLUXDB_URL}")
    print(f"  Bucket   : {INFLUXDB_BUCKET}")
    print(f"  Interval : {INTERVAL_SEC}s")
    print(f"  Lookback : {LOOKBACK}")

    model_suhu, model_ph, model_do, scaler_suhu, scaler_ph, scaler_do = load_models()
    print("Model siap.")

    while True:
        try:
            client = get_influx_client()

            data = fetch_recent_data(client)
            if data is None:
                print("Menunggu data sensor di InfluxDB...")
                client.close()
                time.sleep(INTERVAL_SEC)
                continue

            lookback = fetch_lookback_data(client)
            if lookback is None:
                print(f"Data belum cukup. Butuh {LOOKBACK} titik data.")
                client.close()
                time.sleep(INTERVAL_SEC)
                continue

            val_suhu, val_ph, val_do = lookback

            result = run_inference(
                model_suhu, model_ph, model_do,
                scaler_suhu, scaler_ph, scaler_do,
                val_suhu, val_ph, val_do,
            )

            write_predictions(client, result)
            client.close()

            print(
                f"[{datetime.now().isoformat(timespec='seconds')}] "
                f"SUHU: {result['current_suhu']:.2f}→{result['pred_suhu']:.2f}°C "
                f"({result['acc_suhu']:.1f}%/{result['status_suhu']}) | "
                f"pH: {result['current_ph']:.2f}→{result['pred_ph']:.2f} "
                f"({result['acc_ph']:.1f}%/{result['status_ph']}) | "
                f"DO: {result['current_do']:.2f}→{result['pred_do']:.2f} "
                f"({result['acc_do']:.1f}%/{result['status_do']})"
            )

        except Exception as e:
            print(f"Error: {e}")

        time.sleep(INTERVAL_SEC)


if __name__ == "__main__":
    main()
