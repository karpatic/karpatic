/* ESPSample
 *
 * By: Andrew Tuline
 *
 * Updated: Feb, 2019
 *
 * Basic code to read and calculate average from the Sparkfun INMP401/MAX4466/MAX9814 microphone
 * on an ESP32 or ESP8266.
 * 
 * Use the Arduino Serial plotter to view the output. Compare results to those found at:
 * 
 * https://github.com/atuline/WLED/blob/assets/docs/Microphones.pdf
 *
 * Note that the ESP32 employs a 12 bit A/D, while the ESP8266 has a 10 bit A/D. Also note
 * the anomalous spikes on the ESP8266.
 * 
 * The micLev variable is the DC Offset value that you can use for zeroeing your samples.
 * 
 */

#include <Arduino.h>
#define MIC_PIN 36                              // ESP32 pin 36 also known as 'VP'.

void analog_sample() {
  static float micLev;                          // Needs to be a float, or smoothing calculation below will be very inaccurate.
  int micIn = analogRead(MIC_PIN);
  micLev = ((micLev*31)+micIn)/32;              // Smooth out the data to get average value (used for zeroeing).
  Serial.print(micIn); Serial.print(" ");
  Serial.print(micLev); Serial.println(" ");
} // analog_sample()

void setup() {
  delay(1000);
  Serial.begin(115200);                         // Initialize serial port for debugging.
} // setup()

void loop() {
  analog_sample();
} // loop()