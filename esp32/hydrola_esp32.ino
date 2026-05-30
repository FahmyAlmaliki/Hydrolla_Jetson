#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_URL = "http://10.26.49.250:3030/api/telemetry";

const char* SENSOR_ID = "esp32-kolam-01";
const char* LOCATION = "kolam-utama";

const char* NTP_SERVER_1 = "pool.ntp.org";
const char* NTP_SERVER_2 = "time.nist.gov";
const long GMT_OFFSET_SEC = 7 * 3600;
const int DAYLIGHT_OFFSET_SEC = 0;

unsigned long lastSendAt = 0;
const unsigned long SEND_INTERVAL_MS = 10000;

float readPh() {
  return 7.12;
}

float readDo() {
  return 6.48;
}

float readTemperature() {
  return 28.4;
}

float readNh3() {
  return 0.028;
}

float readBattery() {
  return 3.98;
}

float readRssi() {
  return (float)WiFi.RSSI();
}

String isoTimestampNow() {
  struct tm timeInfo;
  if (!getLocalTime(&timeInfo)) {
    return String(millis());
  }

  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", &timeInfo);
  return String(buffer) + "+07:00";
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void syncTime() {
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER_1, NTP_SERVER_2);

  struct tm timeInfo;
  while (!getLocalTime(&timeInfo)) {
    delay(500);
  }
}

bool sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  StaticJsonDocument<384> doc;
  doc["sensor_id"] = SENSOR_ID;
  doc["location"] = LOCATION;
  doc["timestamp"] = isoTimestampNow();
  doc["ph"] = readPh();
  doc["do"] = readDo();
  doc["temperature"] = readTemperature();
  doc["nh3"] = readNh3();
  doc["battery"] = readBattery();
  doc["rssi"] = readRssi();

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");

  int statusCode = http.POST(body);
  String response = http.getString();
  http.end();

  Serial.print("POST status: ");
  Serial.println(statusCode);
  Serial.println(response);

  return statusCode >= 200 && statusCode < 300;
}

void setup() {
  Serial.begin(115200);
  connectWiFi();
  syncTime();
}

void loop() {
  if (millis() - lastSendAt >= SEND_INTERVAL_MS) {
    lastSendAt = millis();
    sendTelemetry();
  }
}