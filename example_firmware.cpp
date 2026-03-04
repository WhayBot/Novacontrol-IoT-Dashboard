#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

Preferences preferences;

const char* ssid = "SSID"; // the name of your wifi
const char* password = "PASSWORD"; // the password for your wifi

String serverUrl = "http://your-backend-ip-address:8000"; // put your backend ip address and port here
String apiKey = "";
String deviceId = "";

unsigned long lastPing = 0;
unsigned long pingInterval = 5000;

bool registered = false;

void connectWiFi() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected!");
  Serial.println(WiFi.localIP());
}

void loadCredentials() {
  preferences.begin("device", false);
  apiKey = preferences.getString("apiKey", "");
  deviceId = preferences.getString("deviceId", "");
  preferences.end();

  if (apiKey != "" && deviceId != "") {
    Serial.println("API Key loaded from storage.");
    registered = true;
  }
}

void saveCredentials(String newApiKey, String newDeviceId) {
  preferences.begin("device", false);
  preferences.putString("apiKey", newApiKey);
  preferences.putString("deviceId", newDeviceId);
  preferences.end();
}

bool registerDevice() {
  Serial.println("Registering device...");

  HTTPClient http; // NOTE: depending on your routing, this should match your backend framework's exact route
  http.begin(serverUrl + "/api/register");
  http.addHeader("Content-Type", "application/json"); 

  StaticJsonDocument<200> doc; // this matches the deviceId used globally
  doc["device_id"] = "esp32-" + String((uint32_t)ESP.getEfuseMac(), HEX);
  doc["device_type"] = "DUSK_Module";
  
  JsonArray controls = doc.createNestedArray("controls"); // minimal empty arrays for schema support
  JsonArray telemetry = doc.createNestedArray("telemetry");

  String body;
  serializeJson(doc, body);

  int httpResponseCode = http.POST(body);

  if (httpResponseCode == 200) {
    String response = http.getString();

    StaticJsonDocument<300> resDoc;
    deserializeJson(resDoc, response);

    apiKey = resDoc["api_key"].as<String>();
    deviceId = resDoc["device_id"].as<String>();

    saveCredentials(apiKey, deviceId);

    Serial.println("Registered successfully!");
    registered = true;

    http.end();
    return true;
  } else {
    Serial.print("Register failed: ");
    Serial.println(httpResponseCode);
    Serial.println(http.getString());
  }

  http.end();
  return false;
}

void sendHeartbeat() {
  HTTPClient http;
  http.begin(serverUrl + "/api/heartbeat");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", apiKey);

  StaticJsonDocument<200> doc;
  doc["device_id"] = deviceId;

  String body;
  serializeJson(doc, body);

  int httpResponseCode = http.POST(body);

  if (httpResponseCode == 401 || httpResponseCode == 404) {
    Serial.println("Device not found or unauthorized. Re-registering...");
    registered = false;
  }

  http.end();
}

void manualSetup() {
  Serial.println("Enter API Key:");
  while (!Serial.available());
  apiKey = Serial.readStringUntil('\n');
  apiKey.trim();

  Serial.println("Enter Device ID:");
  while (!Serial.available());
  deviceId = Serial.readStringUntil('\n');
  deviceId.trim();

  saveCredentials(apiKey, deviceId);
  registered = true;

  Serial.println("Manual credentials saved.");
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  connectWiFi();
  loadCredentials();

  if (!registered) {
    if (!registerDevice()) {
      Serial.println("Auto register failed.");
      Serial.println("Type 'manual' to input credentials manually.");
    }
  }
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd == "manual") {
      manualSetup();
    }

    if (cmd == "reset") {
      preferences.begin("device", false);
      preferences.clear();
      preferences.end();
      Serial.println("Credentials cleared. Restart device.");
    }
  }

  if (registered && millis() - lastPing > pingInterval) {
    lastPing = millis();
    sendHeartbeat();
  }

  if (!registered) {
    registerDevice();
    delay(3000);
  }
}
