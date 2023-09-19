#include <Arduino.h>

// Pin number of the onboard LED
const int ONBOARD_LED = 2;

void setup() {
  // Set the onboard LED pin as an output
  pinMode(ONBOARD_LED, OUTPUT);
}

void loop() {
  // Turn the onboard LED on
  digitalWrite(ONBOARD_LED, HIGH);
  
  // Wait for 1 second
  delay(1000);
  
  // Turn the onboard LED off
  digitalWrite(ONBOARD_LED, LOW);
  
  // Wait for 1 second
  delay(1000);
}
