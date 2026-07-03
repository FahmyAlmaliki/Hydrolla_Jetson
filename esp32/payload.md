# HYDROLA ESP32 Payload

Endpoint:

`POST http://10.26.48.101:3030/api/telemetry`

Content-Type:

`application/json`

Fields yang dikirim:

```json
{
  "sensor_id": "esp32-kolam-01",
  "location": "kolam-utama",
  "timestamp": "2026-05-30T14:15:22+07:00",
  "ph": 7.12,
  "do": 6.48,
  "temperature": 28.4,
  "nh3": 0.028,
  "battery": 3.98,
  "rssi": -61
}
```

Keterangan:

- `sensor_id` dipakai sebagai tag InfluxDB.
- `location` dipakai sebagai tag InfluxDB.
- `ph`, `do`, `temperature`, dan `nh3` disimpan sebagai field utama pada measurement `water_quality`.
- `battery` dan `rssi` bersifat opsional.
- `timestamp` opsional; jika ada, server akan memakainya sebagai waktu data.

Contoh `curl` untuk uji manual:

```bash
curl -X POST http://10.26.48.101:3030/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_id":"esp32-kolam-01",
    "location":"kolam-utama",
    "ph":7.12,
    "do":6.48,
    "temperature":28.4,
    "nh3":0.028
  }'
```