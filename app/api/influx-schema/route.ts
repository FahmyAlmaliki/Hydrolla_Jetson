// app/api/influx-data/route.ts
// ─────────────────────────────────────────────
//  POST /api/influx-data
//  Menerima data sensor dari ESP32 dan menulis ke InfluxDB
// ─────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getInfluxWriteApi, INFLUX_BUCKET, isInfluxConfigured } from "@/app/lib/influxClient";
import { Point } from "@influxdata/influxdb-client";

export const dynamic = "force-dynamic";

// ─── Tipe payload dari ESP32 ───────────────────
interface SensorPayload {
  sensor_id?: string;   // e.g. "sensor-01"
  location?: string;    // e.g. "kolam-a"
  ph?: number;
  do?: number;          // dissolved oxygen
  temperature?: number;
  nh3?: number;
  // Opsional: timestamp dari ESP32 (Unix ms). Jika tidak ada, pakai waktu server.
  timestamp?: number;
}

// ─── Validasi sederhana ────────────────────────
function validate(body: SensorPayload): string | null {
  const hasAtLeastOneField =
    body.ph !== undefined ||
    body.do !== undefined ||
    body.temperature !== undefined ||
    body.nh3 !== undefined;

  if (!hasAtLeastOneField) {
    return "Payload harus berisi minimal satu field sensor (ph, do, temperature, nh3)";
  }

  if (body.ph !== undefined && (body.ph < 0 || body.ph > 14)) {
    return "Nilai ph tidak valid (harus antara 0–14)";
  }

  if (body.temperature !== undefined && (body.temperature < -10 || body.temperature > 100)) {
    return "Nilai temperature tidak valid (harus antara -10–100 °C)";
  }

  if (body.do !== undefined && body.do < 0) {
    return "Nilai do (dissolved oxygen) tidak boleh negatif";
  }

  if (body.nh3 !== undefined && body.nh3 < 0) {
    return "Nilai nh3 tidak boleh negatif";
  }

  return null;
}

// ─── Cek threshold untuk alert ────────────────
const THRESHOLDS = {
  ph:          { min: 6.5, max: 8.5,  unit: "" },
  do:          { min: 5.0, max: null, unit: "mg/L" },
  temperature: { min: 25,  max: 32,   unit: "°C" },
  nh3:         { min: null, max: 0.02, unit: "mg/L" },
};

type ThresholdKey = keyof typeof THRESHOLDS;

function checkAlerts(body: SensorPayload): Array<{ parameter: string; value: number; status: string }> {
  const alerts: Array<{ parameter: string; value: number; status: string }> = [];

  (Object.keys(THRESHOLDS) as ThresholdKey[]).forEach((param) => {
    const val = body[param as keyof SensorPayload] as number | undefined;
    if (val === undefined) return;

    const t = THRESHOLDS[param];
    const outOfRange =
      (t.min !== null && val < t.min) ||
      (t.max !== null && val > t.max);

    if (outOfRange) {
      // KRITIS jika jauh dari batas, WASPADA jika mendekati
      const severity = (() => {
        if (param === "ph" && (val < 5.5 || val > 9.5)) return "KRITIS";
        if (param === "do" && val < 3.0) return "KRITIS";
        if (param === "temperature" && (val < 20 || val > 36)) return "KRITIS";
        if (param === "nh3" && val > 0.05) return "KRITIS";
        return "WASPADA";
      })();

      alerts.push({ parameter: param, value: val, status: severity });
    }
  });

  return alerts;
}

// ─── POST Handler ──────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Parse body
  let body: SensorPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Body harus berupa JSON yang valid" },
      { status: 400 }
    );
  }

  // 2. Validasi
  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json(
      { success: false, error: validationError },
      { status: 400 }
    );
  }

  // 3. Jika InfluxDB tidak dikonfigurasi, kembalikan mock response
  if (!isInfluxConfigured()) {
    const alerts = checkAlerts(body);
    return NextResponse.json({
      success: true,
      source: "mock",
      message: "InfluxDB tidak dikonfigurasi – data diterima tapi tidak disimpan",
      received: body,
      alerts,
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Tulis ke InfluxDB
  try {
    const writeApi = getInfluxWriteApi();
    if (!writeApi) throw new Error("Write API tidak tersedia");

    const org = process.env.INFLUXDB_ORG ?? "flagship";

    // ── Tulis ke measurement water_quality ──
    const point = new Point("water_quality")
      .tag("sensor_id", body.sensor_id ?? "esp32-default")
      .tag("location",  body.location  ?? "unknown");

    if (body.ph          !== undefined) point.floatField("ph",          body.ph);
    if (body.do          !== undefined) point.floatField("do",          body.do);
    if (body.temperature !== undefined) point.floatField("temperature", body.temperature);
    if (body.nh3         !== undefined) point.floatField("nh3",         body.nh3);

    // Gunakan timestamp dari ESP32 jika ada (dalam milidetik)
    if (body.timestamp) {
      point.timestamp(new Date(body.timestamp));
    }

    writeApi.writePoint(point);

    // ── Cek dan tulis alert jika ada ──
    const alerts = checkAlerts(body);

    for (const alert of alerts) {
      const alertPoint = new Point("alerts")
        .tag("source",    "esp32")
        .tag("sensor_id", body.sensor_id ?? "esp32-default")
        .tag("location",  body.location  ?? "unknown")
        .stringField("parameter", alert.parameter)
        .floatField("value",      alert.value)
        .stringField("status",    alert.status);

      writeApi.writePoint(alertPoint);
    }

    await writeApi.flush();

    return NextResponse.json({
      success: true,
      source: "live",
      bucket: INFLUX_BUCKET,
      org,
      pointsWritten: 1 + alerts.length,
      alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[influx-data] Write error:", message);
    return NextResponse.json(
      { success: false, error: "Gagal menulis ke InfluxDB", detail: message },
      { status: 502 }
    );
  }
}

// ─── GET: info endpoint ────────────────────────
export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/influx-data",
    description: "Endpoint untuk ESP32 mengirim data sensor ke InfluxDB",
    configured: isInfluxConfigured(),
    expectedPayload: {
      sensor_id:   "string (opsional, default: esp32-default)",
      location:    "string (opsional, default: unknown)",
      ph:          "number 0–14 (opsional)",
      do:          "number ≥0 mg/L (opsional)",
      temperature: "number °C (opsional)",
      nh3:         "number ≥0 mg/L (opsional)",
      timestamp:   "number Unix ms (opsional, default: waktu server)",
    },
    example: {
      sensor_id:   "sensor-01",
      location:    "kolam-a",
      ph:          7.2,
      do:          6.5,
      temperature: 28.3,
      nh3:         0.01,
    },
  });
}