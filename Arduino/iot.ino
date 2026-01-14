#include <WiFi.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include "esp_camera.h"

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* topic_control = "onegate/control";
const char* topic_status = "onegate/status";

// Backend API
const char* api_url = "http://YOUR_SERVER_IP:3000/api/access/process";

// Servo
Servo gateServo;
const int servoPin = 13;
const int openAngle = 90;
const int closeAngle = 0;

WiFiClient espClient;
PubSubClient client(espClient);

// Camera pins for AI-Thinker ESP32-CAM
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

void setup() {
  Serial.begin(115200);
  
  // Initialize servo
  gateServo.attach(servoPin);
  gateServo.write(closeAngle);
  
  // Initialize camera
  initCamera();
  
  // Connect WiFi
  connectWiFi();
  
  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
  
  Serial.println("✅ System Ready");
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
  // Auto capture every 5 seconds (untuk testing)
  // Uncomment untuk enable auto capture
  // delay(5000);
  // captureAndSend();
}

void initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Higher resolution for better OCR
  if(psramFound()){
    config.frame_size = FRAMESIZE_UXGA; // 1600x1200
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA; // 800x600
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }
  
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("❌ Camera init failed: 0x%x", err);
    return;
  }
  
  Serial.println("✅ Camera initialized");
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n✅ WiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    String clientId = "ESP32CAM-" + String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("✅ MQTT Connected");
      client.subscribe(topic_control);
    } else {
      Serial.print("❌ Failed, rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("📩 MQTT Message: " + message);
  
  // Parse JSON command
  if (message.indexOf("OPEN_GATE") > 0) {
    openGate();
  } else if (message.indexOf("CLOSE_GATE") > 0) {
    closeGate();
  } else if (message.indexOf("CAPTURE_IMAGE") > 0) {
    captureAndSend();
  }
}

void captureAndSend() {
  Serial.println("📸 Capturing image...");
  
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("❌ Camera capture failed");
    return;
  }
  
  Serial.printf("✅ Image captured: %d bytes\n", fb->len);
  
  // Send to backend API
  sendToBackend(fb->buf, fb->len);
  
  esp_camera_fb_return(fb);
}

void sendToBackend(uint8_t* imageData, size_t imageSize) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    http.begin(api_url);
    http.addHeader("Content-Type", "multipart/form-data; boundary=----ESP32CAM");
    
    // Create multipart body
    String head = "------ESP32CAM\r\nContent-Disposition: form-data; name=\"image\"; filename=\"plate.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
    String tail = "\r\n------ESP32CAM--\r\n";
    
    uint32_t bodyLen = head.length() + imageSize + tail.length();
    
    http.addHeader("Content-Length", String(bodyLen));
    
    // Send request
    WiFiClient* stream = http.getStreamPtr();
    stream->print(head);
    stream->write(imageData, imageSize);
    stream->print(tail);
    
    int httpCode = http.POST("");
    
    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("📥 Backend response: " + response);
      
      // Parse response and check if authorized
      if (response.indexOf("\"authorized\":true") > 0) {
        Serial.println("✅ Vehicle authorized - Opening gate");
        openGate();
      } else {
        Serial.println("❌ Vehicle not authorized");
      }
    } else {
      Serial.printf("❌ HTTP Error: %s\n", http.errorToString(httpCode).c_str());
    }
    
    http.end();
  }
}

void openGate() {
  Serial.
println("🚪 Opening gate...");
gateServo.write(openAngle);
client.publish(topic_status, "{"status":"open"}");
// Auto close after 5 seconds
delay(5000);
closeGate();
}
void closeGate() {
Serial.println("🚪 Closing gate...");
gateServo.write(closeAngle);
client.publish(topic_status, "{"status":"closed"}");
}