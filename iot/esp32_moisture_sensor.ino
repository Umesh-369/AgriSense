/*
 * ============================================
 * ESP32/ESP8266 Soil Moisture Sensor with Firebase
 * ============================================
 *
 * This Arduino sketch reads soil moisture levels and
 * uploads the data to Firebase Realtime Database.
 *
 * Hardware Required:
 * - ESP32 or ESP8266 board
 * - Capacitive Soil Moisture Sensor v1.2 (recommended)
 *   or Resistive Soil Moisture Sensor
 *
 * Wiring:
 * - Sensor VCC → 3.3V
 * - Sensor GND → GND
 * - Sensor AOUT → GPIO34 (ESP32) or A0 (ESP8266)
 *
 * Libraries Required:
 * - Firebase ESP Client by Mobizt
 * - WiFi / ESP8266WiFi
 *
 * Setup:
 * 1. Install required libraries from Arduino Library Manager
 * 2. Update WiFi credentials below
 * 3. Update Firebase credentials below
 * 4. Upload to your board
 */

// ============================================
// Board Selection - Uncomment your board
// ============================================
#define ESP32_BOARD
// #define ESP8266_BOARD

#ifdef ESP32_BOARD
#include <WiFi.h>
#define MOISTURE_PIN 34 // ADC1_CH6
#else
#include <ESP8266WiFi.h>
#define MOISTURE_PIN A0
#endif

#include "addons/RTDBHelper.h"
#include "addons/TokenHelper.h"
#include <Firebase_ESP_Client.h>


// ============================================
// Configuration - UPDATE THESE VALUES
// ============================================

// WiFi Credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase Credentials
#define API_KEY "YOUR_FIREBASE_API_KEY"
#define DATABASE_URL "https://YOUR_PROJECT_ID.firebaseio.com"

// Optional: Firebase Authentication (for secured database)
#define USER_EMAIL ""    // Leave empty if not using auth
#define USER_PASSWORD "" // Leave empty if not using auth

// ============================================
// Sensor Calibration
// ============================================
// Adjust these values based on your sensor readings
// Dry soil (in air) = lower ADC value
// Wet soil (in water) = higher ADC value

#ifdef ESP32_BOARD
#define SENSOR_DRY 4095 // ADC reading when sensor is dry
#define SENSOR_WET 1500 // ADC reading when sensor is in water
#else
#define SENSOR_DRY 1024 // ESP8266 10-bit ADC
#define SENSOR_WET 300
#endif

// Reading interval in milliseconds
#define READ_INTERVAL 30000 // 30 seconds

// ============================================
// Global Variables
// ============================================
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long lastReadTime = 0;
bool signupOK = false;
String deviceId = "";

// ============================================
// Setup Function
// ============================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================");
  Serial.println("🌱 Smart Soil Moisture Monitoring System");
  Serial.println("========================================\n");

// Generate unique device ID
#ifdef ESP32_BOARD
  deviceId = "ESP32_" + String((uint32_t)ESP.getEfuseMac(), HEX);
#else
  deviceId = "ESP8266_" + String(ESP.getChipId(), HEX);
#endif
  Serial.println("Device ID: " + deviceId);

  // Connect to WiFi
  connectWiFi();

  // Configure Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // Handle authentication
  if (strlen(USER_EMAIL) > 0 && strlen(USER_PASSWORD) > 0) {
    auth.user.email = USER_EMAIL;
    auth.user.password = USER_PASSWORD;
    Serial.println("📧 Using email authentication");
  } else {
    // Anonymous sign-in
    if (Firebase.signUp(&config, &auth, "", "")) {
      Serial.println("✅ Anonymous sign-in successful");
      signupOK = true;
    } else {
      Serial.printf("❌ Sign-up failed: %s\n",
                    config.signer.signupError.message.c_str());
    }
  }

  // Token status callback
  config.token_status_callback = tokenStatusCallback;

  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("\n🔥 Firebase initialized");
  Serial.println("📊 Starting sensor readings...\n");
}

// ============================================
// Main Loop
// ============================================
void loop() {
  // Check if it's time for a new reading
  if (millis() - lastReadTime >= READ_INTERVAL || lastReadTime == 0) {
    lastReadTime = millis();

    // Read and process moisture
    float moisture = readMoisture();

    // Get status info
    String status = getStatus(moisture);

    // Print to serial
    Serial.printf("💧 Moisture: %.1f%% | Status: %s\n", moisture,
                  status.c_str());

    // Upload to Firebase
    if (Firebase.ready() && (signupOK || strlen(USER_EMAIL) > 0)) {
      uploadToFirebase(moisture, status);
    } else {
      Serial.println("⚠️ Firebase not ready");
    }
  }

  // Handle WiFi reconnection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi disconnected, reconnecting...");
    connectWiFi();
  }

  delay(100);
}

// ============================================
// Helper Functions
// ============================================

/**
 * Connect to WiFi network
 */
void connectWiFi() {
  Serial.print("📶 Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("📍 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi connection failed!");
    Serial.println("   Check SSID and password");
  }
}

/**
 * Read soil moisture and convert to percentage
 * @return Moisture percentage (0-100)
 */
float readMoisture() {
  // Take multiple readings and average
  int readings = 0;
  for (int i = 0; i < 10; i++) {
    readings += analogRead(MOISTURE_PIN);
    delay(10);
  }
  float avgReading = (float)readings / 10.0;

  // Convert to percentage using floating point calculation
  // Percentage = (raw - SENSOR_DRY) * 100 / (SENSOR_WET - SENSOR_DRY)
  float moisture = (avgReading - (float)SENSOR_DRY) * 100.0 / ((float)SENSOR_WET - (float)SENSOR_DRY);

  // Constrain to valid range
  moisture = constrain(moisture, 0, 100);

  Serial.printf("   Raw ADC: %.1f → %.1f%%\n", avgReading, moisture);

  return moisture;
}

/**
 * Get status string based on moisture level
 * @param moisture Moisture percentage
 * @return Status string
 */
String getStatus(float moisture) {
  if (moisture < 20)
    return "dry";
  if (moisture < 30)
    return "low";
  if (moisture <= 70)
    return "optimal";
  if (moisture <= 85)
    return "high";
  return "wet";
}

/**
 * Upload moisture data to Firebase
 * @param moisture Moisture percentage
 * @param status Status string
 */
void uploadToFirebase(float moisture, String status) {
  // Create JSON object for current reading
  FirebaseJson currentJson;
  currentJson.set("value", moisture);
  currentJson.set("timestamp/.sv", "timestamp"); // Server timestamp
  currentJson.set("status", status);
  currentJson.set("device", deviceId);

  // Update current reading
  String currentPath = "moisture/current";
  if (Firebase.RTDB.setJSON(&fbdo, currentPath.c_str(), &currentJson)) {
    Serial.println("✅ Current reading uploaded");
  } else {
    Serial.println("❌ Upload failed: " + fbdo.errorReason());
  }

  // Add to history
  FirebaseJson historyJson;
  historyJson.set("value", moisture);
  historyJson.set("timestamp/.sv", "timestamp");
  historyJson.set("status", status);
  historyJson.set("device", deviceId);

  String historyPath = "moisture/readings";
  if (Firebase.RTDB.pushJSON(&fbdo, historyPath.c_str(), &historyJson)) {
    Serial.println("✅ History entry added");
  } else {
    Serial.println("❌ History failed: " + fbdo.errorReason());
  }

  Serial.println();
}
