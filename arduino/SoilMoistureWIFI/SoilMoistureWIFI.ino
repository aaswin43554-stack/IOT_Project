#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

const char *ssid = "Airtel_Aswin's Wifi";
const char *password = "Aswin@2k06";

// Replace with your Render URL (e.g.
// https://soil-monitoring-system-your-app.onrender.com)
const char *serverName = "https://iot-project-vei9.onrender.com/api/sensor";

const int sensorPin = 34; // GPIO 34 - ADC1 pin, safe to use with WiFi

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // --- DIAGNOSTIC: Read 5 samples and print all ---
  Serial.println("--- ADC Diagnostic ---");
  for (int i = 0; i < 5; i++) {
    int raw = analogRead(sensorPin);
    float voltage = (raw / 4095.0) * 3.3;
    Serial.print("  Sample ");
    Serial.print(i + 1);
    Serial.print(": Raw=");
    Serial.print(raw);
    Serial.print("  Voltage=");
    Serial.print(voltage, 3);
    Serial.println("V");
    delay(100);
  }

  if (WiFi.status() == WL_CONNECTED) {
    int sensorValue = analogRead(sensorPin);

    Serial.print("Sending value: ");
    Serial.println(sensorValue);

    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient http;
    http.begin(client, serverName);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"moisture\": " + String(sensorValue) + "}";

    int httpResponseCode = http.POST(jsonPayload);

    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }

  delay(5000);
}
