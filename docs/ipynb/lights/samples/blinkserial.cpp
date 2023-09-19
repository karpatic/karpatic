#include <Arduino.h>

// Pin number of the onboard LED
const int ONBOARD_LED = 2;
void setup() {
  // Set the onboard LED pin as an output
  pinMode(ONBOARD_LED, OUTPUT);
  Serial.begin(9600);
  randomSeed(analogRead(0)); // Initialize the random number generator with a seed
}

void loop() {
  // Turn the onboard LED on
  digitalWrite(ONBOARD_LED, HIGH);
  
  // Generate a random number between 0 and 1000
  int rand_num = random(1000);
  
  // Send the random number over the serial port
  Serial.println(rand_num);
  
  // Wait for 1 second
  delay(1000);
  
  // Turn the onboard LED off
  digitalWrite(ONBOARD_LED, LOW);
  
  // Generate a new random number between 0 and 1000
  rand_num = random(1000);
  
  // Send the random number over the serial port
  Serial.println(rand_num);
  
  // Wait for 1 second
  delay(1000);
}
