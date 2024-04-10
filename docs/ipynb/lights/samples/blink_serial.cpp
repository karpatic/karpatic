#include <Arduino.h>

// Pin number of the onboard LED
const int ONBOARD_LED = 2;

void setup()
{
  // Initialize serial communication at 115200 baud rate
  Serial.begin(115200);

  // Set the onboard LED pin as an output
  pinMode(ONBOARD_LED, OUTPUT);
}

void loop()
{
  // Turn the onboard LED on
  digitalWrite(ONBOARD_LED, HIGH);
  Serial.println("1 - Platformio - LED is ON");

  // Wait for 1 second
  delay(1000);

  // Turn the onboard LED off
  digitalWrite(ONBOARD_LED, LOW);
  Serial.println("1 - Platformio - LED is OFF");

  // Wait for 1 second
  delay(1000);
}
