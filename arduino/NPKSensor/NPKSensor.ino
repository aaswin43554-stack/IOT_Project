/*
 * Soil Monitoring System - ESP32 / Arduino Node
 * Includes reading original Soil Moisture and new DFRobot Analog NPK Sensor
 */

#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

// --- Configuration ---
const char *ssid = "Airtel_Aswin's Wifi";
const char *password = "Aswin@2k06";
const char *serverEndpoint = "https://iot-project-vei9.onrender.com/api/readings";
const String deviceId = "esp32-node-1";

// --- Pin Definitions ---
const int MOISTURE_PIN = 34;
const int N_PIN = 32; // Nitrogen Analog Pin
const int P_PIN = 33; // Phosphorus Analog Pin
const int K_PIN = 35; // Potassium Analog Pin

// --- NPK Calibration Variables ---
// Note: Depending on your specific analog NPK sensor, adjust the scaling
// factors! Gravity analog NPK usually outputs 0-3V mapped to 0-1999 mg/kg. 0V =
// 0 mg/kg, 3V = 1999 mg/kg
const float VREF = 3.3;
const float MAX_MG_KG = 1999.0;
const float MAX_VOLTAGE = 3.0; // Sensor max output

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nConnected to WiFi!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // 1. Read Soil Moisture (existing functionality)
    int moistureRaw = analogRead(MOISTURE_PIN);
    // Convert 12-bit ADC (0-4095) to percentage (0-100%). You may need to
    // invert depending on sensor.
    float moisturePct = map(moistureRaw, 0, 4095, 0, 100);

    // 2. Read N, P, K Values
    float nVal = readNitrogen();
    float pVal = readPhosphorus();
    float kVal = readPotassium();

    // (Optional) Include other readings if you have them, e.g., DHT11 for air
    // temp
    float soilTemp = 24.5; // Placeholder
    float airTemp = 28.0;  // Placeholder
    float humidity = 65.0; // Placeholder
    float ph = 6.8;        // Placeholder
    float ec = 1.2;        // Placeholder

    // 3. Send Data to Server
    sendDataToServer(moisturePct, soilTemp, airTemp, humidity, ph, ec, nVal,
                     pVal, kVal);
  } else {
    Serial.println("WiFi Disconnected. Reconnecting...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
  }

  // Delay before next reading (e.g. 10 seconds)
  delay(10000);
}

// --- NPK Helper Functions ---

float readNitrogen() {
  int raw = analogRead(N_PIN);
  float voltage = (raw / 4095.0) * VREF;
  float mg_kg = (voltage / MAX_VOLTAGE) * MAX_MG_KG;
  return constrain(mg_kg, 0, MAX_MG_KG);
}

float readPhosphorus() {
  int raw = analogRead(P_PIN);
  float voltage = (raw / 4095.0) * VREF;
  float mg_kg = (voltage / MAX_VOLTAGE) * MAX_MG_KG;
  return constrain(mg_kg, 0, MAX_MG_KG);
}

float readPotassium() {
  int raw = analogRead(K_PIN);
  float voltage = (raw / 4095.0) * VREF;
  float mg_kg = (voltage / MAX_VOLTAGE) * MAX_MG_KG;
  return constrain(mg_kg, 0, MAX_MG_KG);
}

// --- Network Function ---
void sendDataToServer(float moisture, float st, float at, float hum, float ph,
                      float ec, float n, float p, float k) {
  WiFiClientSecure client;
  client.setInsecure(); // Skip certificate validation

  HTTPClient http;

  http.begin(client, serverEndpoint);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON Payload
  String jsonPayload = "{";
  jsonPayload += "\"deviceId\":\"" + deviceId + "\",";
  jsonPayload += "\"soilMoisturePct\":" + String(moisture) + ",";
  jsonPayload += "\"soilTempC\":" + String(st) + ",";
  jsonPayload += "\"airTempC\":" + String(at) + ",";
  jsonPayload += "\"humidityPct\":" + String(hum) + ",";
  jsonPayload += "\"ph\":" + String(ph) + ",";
  jsonPayload += "\"ecDsM\":" + String(ec) + ",";

  // New NPK Fields
  jsonPayload += "\"nitrogen\":" + String(n) + ",";
  jsonPayload += "\"phosphorus\":" + String(p) + ",";
  jsonPayload += "\"potassium\":" + String(k);
  jsonPayload += "}";

  int httpCode = http.POST(jsonPayload);

  if (httpCode > 0) {
    Serial.printf("[HTTP] POST... code: %d\n", httpCode);
  } else {
    Serial.printf("[HTTP] POST... failed, error: %s\n",
                  http.errorToString(httpCode).c_str());
  }

  http.end();
}