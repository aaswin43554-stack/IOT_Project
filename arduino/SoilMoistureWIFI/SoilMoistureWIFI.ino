#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

const char *ssid = "Airtel_Aswin's Wifi";
const char *password = "Aswin@2k06";
const char *serverName = "https://iot-project-vei9.onrender.com/api/sensor";

// --- Pin Definitions ---
const int MOISTURE_PIN = 34; // GPIO 34 - ADC1, soil moisture analog output
const int DHT_PIN = 4;       // GPIO 4 - DHT11 digital data pin
const int DHT_TYPE = DHT11;

DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(115200);
  pinMode(DHT_PIN, INPUT_PULLUP); // Use internal pull-up, no external resistor needed
  dht.begin();

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // --- Read Soil Moisture ---
  int moistureRaw = analogRead(MOISTURE_PIN);

  // --- Read DHT11 ---
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature(); // Celsius

  // Check if DHT11 reading failed
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("DHT11 read failed! Check wiring.");
    humidity = 0.0;
    temperature = 0.0;
  }

  // --- Print to Serial Monitor ---
  Serial.println("-----------------------------");
  Serial.print("Soil Moisture (raw): ");
  Serial.println(moistureRaw);
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" C");
  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");

  // --- Send to Server ---
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient http;
    http.begin(client, serverName);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{";
    jsonPayload += "\"moisture\": " + String(moistureRaw) + ",";
    jsonPayload += "\"temperature\": " + String(temperature, 1) + ",";
    jsonPayload += "\"humidity\": " + String(humidity, 1);
    jsonPayload += "}";

    int httpResponseCode = http.POST(jsonPayload);
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }

  delay(5000); // Send every 5 seconds
}
