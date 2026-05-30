import { NextResponse } from "next/server";
import { InfluxDB, Point, WritePrecision } from "@influxdata/influxdb-client";

export const dynamic = "force-dynamic";

type TelemetryPayload = {
  sensor_id?: string;
  location?: string;
  timestamp?: string;
  ph?: number;
  do?: number;
  temperature?: number;
  nh3?: number;
  tds?: number;
  battery?: number;
  rssi?: number;
};

function toNumber(value: unknown, fieldName: string): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`Field '${fieldName}' harus berupa angka valid`);
  }
  return numberValue;
}

export async function POST(request: Request) {
  let payload: TelemetryPayload;

  try {
    payload = (await request.json()) as TelemetryPayload;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Body harus berupa JSON valid" },
      { status: 400 }
    );
  }

  try {
    const sensorId = String(payload.sensor_id ?? "esp32-001").trim();
    const location = String(payload.location ?? "kolam-utama").trim();
    const ph = toNumber(payload.ph, "ph");
    const doValue = toNumber(payload.do, "do");
    const temperature = toNumber(payload.temperature, "temperature");
    const nh3 = toNumber(payload.nh3, "nh3");

    const responseBody = {
      ok: true,
      stored: false,
      bucket: process.env.INFLUXDB_BUCKET ?? "water_quality",
      measurement: "water_quality",
      payload: {
        sensor_id: sensorId,
        location,
        timestamp: payload.timestamp ?? null,
        ph,
        do: doValue,
        temperature,
        nh3,
        tds: payload.tds ?? null,
        battery: payload.battery ?? null,
        rssi: payload.rssi ?? null,
      },
    };

    if (!process.env.INFLUXDB_URL || !process.env.INFLUXDB_TOKEN) {
      return NextResponse.json({
        ...responseBody,
        message: "InfluxDB belum dikonfigurasi, data diterima tetapi tidak disimpan",
      });
    }

    const org = process.env.INFLUXDB_ORG ?? "hydrola";
    const bucket = process.env.INFLUXDB_BUCKET ?? "water_quality";
    const client = new InfluxDB({
      url: process.env.INFLUXDB_URL,
      token: process.env.INFLUXDB_TOKEN,
    });
    const writeApi = client.getWriteApi(org, bucket, WritePrecision.ms);

    const point = new Point("water_quality")
      .tag("sensor_id", sensorId)
      .tag("location", location)
      .floatField("ph", ph)
      .floatField("do", doValue)
      .floatField("temperature", temperature)
      .floatField("nh3", nh3);

    if (typeof payload.tds === "number" && Number.isFinite(payload.tds)) {
      point.floatField("tds", payload.tds);
    }

    if (typeof payload.battery === "number" && Number.isFinite(payload.battery)) {
      point.floatField("battery", payload.battery);
    }

    if (typeof payload.rssi === "number" && Number.isFinite(payload.rssi)) {
      point.floatField("rssi", payload.rssi);
    }

    if (payload.timestamp) {
      const timestamp = new Date(payload.timestamp);
      if (!Number.isNaN(timestamp.getTime())) {
        point.timestamp(timestamp);
      }
    }

    writeApi.writePoint(point);
    await writeApi.flush();
    await writeApi.close();

    return NextResponse.json({
      ...responseBody,
      stored: true,
      message: "Data berhasil disimpan ke InfluxDB",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, message },
      { status: 400 }
    );
  }
}