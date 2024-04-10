// Include Libraries
#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>

#include <ArduinoJson.h>
#include <BLE2902.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>

#include <iostream>
#include <stdlib.h>
#include <string.h>
#include <string>
#include <typeinfo>

BLEServer *pServer = NULL;
BLECharacteristic *pCharacteristic = NULL;
bool deviceConnected = false;

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c3319123"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b2623"
#define ESPNAME "Music Strip"

#include <Adafruit_NeoPixel.h>
#define PIXEL_PIN 15
#define PIXEL_COUNT 300 // 30 14 50 60 300

Adafruit_NeoPixel strip =
    Adafruit_NeoPixel(PIXEL_COUNT, PIXEL_PIN, NEO_RGB + NEO_KHZ800);

uint32_t colorone = strip.Color(255, 0, 0);
uint32_t colortwo = strip.Color(0, 255, 0);
uint32_t colorthree = strip.Color(0, 0, 255);

uint32_t Wheel(byte WheelPos) {
  WheelPos = 255 - WheelPos;
  if (WheelPos < 85) {
    return strip.Color(255 - WheelPos * 3, 0, WheelPos * 3);
  }
  if (WheelPos < 170) {
    WheelPos -= 85;
    return strip.Color(0, WheelPos * 3, 255 - WheelPos * 3);
  }
  WheelPos -= 170;
  return strip.Color(WheelPos * 3, 255 - WheelPos * 3, 0);
}

void setColor() {
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, colorone);
  }
  strip.show();
}

void swipe() {
  static int pixel = 0;
  strip.setPixelColor(pixel, colorone);
  strip.show();
  pixel = (pixel + 1) % strip.numPixels();
}

void rainbowCycle() {
  static int j = 0;
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, Wheel(((i * 256 / strip.numPixels()) + j) & 255));
  }
  strip.show();
  j = (j + 1) % 256;
}

void rainbow() {
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, Wheel(i * 256 / strip.numPixels()));
  }
  strip.show();
}

void theaterChaseRainbow() {
  static int q = 0;
  static int j = 0;
  for (int i = 0; i < strip.numPixels(); i = i + 3) {
    strip.setPixelColor(i + q, Wheel((i + j) % 255));
  }
  strip.show();

  for (int i = 0; i < strip.numPixels(); i = i + 3) {
    strip.setPixelColor(i + q, 0);
  }

  q = (q + 1) % 3;
  j = (j + 1) % 256;
}

void theaterChase() {
  static int q = 0;
  for (int i = 0; i < strip.numPixels(); i = i + 3) {
    strip.setPixelColor(i + q, colorone);
  }
  strip.show();

  for (int i = 0; i < strip.numPixels(); i = i + 3) {
    strip.setPixelColor(i + q, 0);
  }

  q = (q + 1) % 3;
}

void swipeRandom() {
  static int pixel = 0;
  uint32_t randomColor =
      strip.Color(random(0, 255), random(0, 255), random(0, 255));
  strip.setPixelColor(pixel, randomColor);
  strip.show();
  pixel = (pixel + 1) % strip.numPixels();
}

typedef struct struct_message {
  char a[32];
  int b;
  float c;
  bool d;
  int brightness;
  char lightmode[32];
  char colortwo[16];
  char colorthree[16];
  char colorone[16];
  int animationdelay;
} struct_message;

struct_message myData = {
    "TestString", //
    42,           //
    420.69f,      //
    true,         //
    20,           // of 255
    "setColor",   //
    "255,0,0",    //
    "0,255,0",    //
    "0,0,255",    //
    250           //
};

void formatMacAddress(const uint8_t *macAddr, char *buffer, int maxLength) {
  snprintf(buffer, maxLength, "%02x:%02x:%02x:%02x:%02x:%02x", macAddr[0],
           macAddr[1], macAddr[2], macAddr[3], macAddr[4], macAddr[5]);
}

// esp_now_init - store in myData then notify if gateway
void gotBroadcast(const uint8_t *mac, const uint8_t *incomingData, int len) {
  Serial.print(F("gotBroadcast: "));
  memcpy(&myData, incomingData, sizeof(myData));
  Serial.print(F("Data received: "));
  Serial.println(len);
  Serial.print(F("Character Value: "));
  Serial.println(myData.a);
  int result = strcmp(myData.a, "OFF");

  if (deviceConnected) {
    pCharacteristic->setValue("TRIGGERED");
    pCharacteristic->notify();
  }
}

// esp_now_init - store in myData then notify if gateway
void sentBroadcast(const uint8_t *macAddr, esp_now_send_status_t status) {
  Serial.print(F("gotBroadcast: "));
  char macStr[18];
  Serial.print(F("Packet Sent to: ")); // macStr
  formatMacAddress(macAddr, macStr, 18);
  // Serial.println(status == ESP_NOW_SEND_SUCCESS ? F("Delivery Success") :
  // F("Delivery Fail"));
}

void broadcast(struct struct_message message) {
  Serial.print(F("Broadcast: "));
  // Broadcast a message to every device in range
  uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
  esp_now_peer_info_t peerInfo = {};
  memcpy(&peerInfo.peer_addr, broadcastAddress, 6);
  if (!esp_now_is_peer_exist(broadcastAddress)) {
    esp_now_add_peer(&peerInfo);
  }

  // Send message
  esp_err_t result =
      esp_now_send(broadcastAddress, (uint8_t *)&myData, sizeof(myData));

  if (result == ESP_OK) {
    Serial.println(F("Broadcast message success"));
  } else {
    Serial.println(F("Unknown error"));
  }
}

class BleConnectionCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer) {
    deviceConnected = true;
    BLE2902 *desc = (BLE2902 *)pCharacteristic->getDescriptorByUUID(
        BLEUUID((uint16_t)0x2902));
    if (desc) {
      desc->setNotifications(true);
    }
    Serial.println("Device connected");
  };

  void onDisconnect(BLEServer *pServer) {
    deviceConnected = false;
    pServer->startAdvertising();
    Serial.println("Device disconnected");
  }
};

void updateStripColor(const char *colorStr, uint32_t *colorVar) {
  int red, green, blue;
  if (sscanf(colorStr, "%d,%d,%d", &red, &green, &blue) == 3) {
    *colorVar = strip.Color(red, green, blue);
  } else {
    Serial.println(F("Invalid color format"));
  }
}

void parseAndUpdateData(const std::string &jsonString, struct_message &data) {
  DynamicJsonDocument jsonDoc(256); // Adjust the size as needed
  DeserializationError error = deserializeJson(jsonDoc, jsonString);

  if (!error) {
    // Parsing succeeded, update data fields
    if (jsonDoc.containsKey("brightness")) {
      data.brightness = jsonDoc["brightness"];
    }
    if (jsonDoc.containsKey("lightmode")) {
      strlcpy(data.lightmode, jsonDoc["lightmode"], sizeof(data.lightmode));
    }
    if (jsonDoc.containsKey("colorone")) {
      strlcpy(data.colorone, jsonDoc["colorone"], sizeof(data.colorone));
      updateStripColor(data.colorone, &colorone);
    }
    if (jsonDoc.containsKey("colortwo")) {
      strlcpy(data.colortwo, jsonDoc["colortwo"], sizeof(data.colortwo));
      updateStripColor(data.colortwo, &colortwo);
    }
    if (jsonDoc.containsKey("colorthree")) {
      strlcpy(data.colorthree, jsonDoc["colorthree"], sizeof(data.colorthree));
      updateStripColor(data.colorthree, &colorthree);
    }
    if (jsonDoc.containsKey("animationdelay")) {
      data.animationdelay = jsonDoc["animationdelay"];
    }
  } else {
    Serial.print(F("Error parsing JSON: "));
    Serial.println(error.c_str());
  }
}

class BleEventCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string rxValue = pCharacteristic->getValue();
    if (rxValue.length() > 0) {
      // Notify client about the received data
      if (deviceConnected) {
        pCharacteristic->setValue(rxValue.c_str());
        pCharacteristic->notify();
      }
      // Parse and update myData based on received JSON
      parseAndUpdateData(rxValue, myData);
    }
  }

  void onRead(BLECharacteristic *pCharacteristic) {
    // struct timeval tv;
    // gettimeofday(&tv, nullptr);
    // std::ostringstream os;
    // os << "Time: " << tv.tv_sec;
    // pCharacteristic->setValue(os.str());
  }
};

void setup() {
  // Set up Serial Monitor
  Serial.begin(115200);

  strip.begin();
  strip.setBrightness(myData.brightness);
  strip.show(); // Initialize all pixels to 'off'

  // Create BLE Server
  BLEDevice::init(ESPNAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new BleConnectionCallbacks());

  // Services are used to break BLE data into logical entities.
  // Characteristic's are used to represent a single data point on the service.
  // Descriptors provide more information about a characteristic’s value.
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID, BLECharacteristic::PROPERTY_READ |
                               BLECharacteristic::PROPERTY_WRITE |
                               BLECharacteristic::PROPERTY_NOTIFY);
  pCharacteristic->addDescriptor(new BLE2902());
  pCharacteristic->setCallbacks(new BleEventCallbacks());
  pCharacteristic->setValue("Hello World");

  // Start the service and make it discoverable.
  pService->start();
  pServer->getAdvertising()->start();

  // Wi-Fi Station mode is used to connect to an existing Wi-Fi network.
  // Start off disconnected
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  Serial.println(WiFi.macAddress());

  // Initialize ESP-NOW
  if (esp_now_init() == ESP_OK) {
    esp_now_register_recv_cb(gotBroadcast);
    esp_now_register_send_cb(sentBroadcast);
  } else {
    delay(1000);
    ESP.restart();
  }
}

void handleStrip() {
  String lightmode = myData.lightmode;

  if (lightmode == "setColor") {
    setColor();
  } else if (lightmode == "swipe") {
    swipe();
  } else if (lightmode == "rainbowCycle") {
    rainbowCycle();
  } else if (lightmode == "rainbow") {
    rainbow();
  } else if (lightmode == "theaterChaseRainbow") {
    theaterChaseRainbow();
  } else if (lightmode == "theaterChase") {
    theaterChase();
  } else {
    swipeRandom();
  }
}

long oldMillis = 0;
void loop() {
  long currentMillis = millis();
  if (touchRead(4) < 20) {
    Serial.println("Touch triggered");
  }
  if (currentMillis - oldMillis > myData.animationdelay) {
    oldMillis = currentMillis;
    handleStrip();
  }
}

/*
pCharacteristic->setValue("Hello World");
pRemoteCharacteristic->writeValue(newValue.c_str(), newValue.length());
if(pRemoteCharacteristic->canRead()) {
  std::string value = pRemoteCharacteristic->readValue();
  Serial.print(F("The characteristic value was: "));
  Serial.println(value.c_str());
}
*/

// myData.b = random(1, 20);
// myData.c = 1.2;
// myData.d = false;
// strcpy(myData.a, "OFF");
// broadcast(myData);