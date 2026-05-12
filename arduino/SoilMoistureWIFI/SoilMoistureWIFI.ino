#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

const char *ssid = "Airtel_Aswin's Wifi";
const char *password = "Aswin@2k06";

// Replace with your Render URL (e.g.
// https://soil-monitoring-system-your-app.onrender.com)
const char *serverName = "https://iot-project-vei9.onrender.com";

const int sensorPin = 4; // GPIO 4

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
  if (WiFi.status() == WL_CONNECTED) {
    int sensorValue = analogRead(sensorPin);

    Serial.print("Soil Moisture Raw Value: ");
    Serial.println(sensorValue);

    WiFiClientSecure client;
    client.setInsecure(); // Skip SSL certificate validation

    HTTPClient http;
    http.begin(client, serverName);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"moisture\": " + String(sensorValue) + "}";

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }

  delay(5000); // Wait 5 seconds before the next reading
}
