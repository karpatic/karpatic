#include <Audio.h>
#include <Wire.h>
#include <SPI.h>
#include <SD.h>
#include <SerialFlash.h>

#define ADC_CHANNEL 34
#define SAMPLE_RATE 44100
#define BUFFER_SIZE 512

AudioInputI2S i2s(0, 1);
AudioAnalyzeEnvelope envelope;

void setup() {
  Serial.begin(115200);
  AudioMemory(12);
  i2s.setSampleRate(SAMPLE_RATE);
  i2s.setBitsPerSample(16);
  i2s.setChannels(1);
  envelope.frequency(50);
}

void loop() {
  float envelopeValue = 0.0;
  int sampleCount = 0;
  
  // Read audio samples from the I2S interface and feed them to the envelope detector
  while (sampleCount < BUFFER_SIZE) {
    if (i2s.available()) {
      float sample = (float)(i2s.readADC(ADC_CHANNEL)) / 32767.0;
      envelopeValue += envelope.process(sample);
      sampleCount++;
    }
  }
  
  // Calculate the average envelope value for the buffer
  envelopeValue /= sampleCount;
  
  // Do something with the envelope value (e.g. control an LED or output to serial)
  Serial.println(envelopeValue);
  
  delay(10);
}