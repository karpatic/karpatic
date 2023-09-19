#include <FastLED.h>
#include <arduinoFFT.h>

#define LED_PIN     15
#define NUM_LEDS    60
#define LED_TYPE    WS2812B
#define COLOR_ORDER GRB
#define MIC_PIN     34

CRGB leds[NUM_LEDS];

arduinoFFT FFT = arduinoFFT();

const uint16_t samples = 64;
const double samplingFrequency = 2000;

unsigned int samplingPeriod;
unsigned long currentMicros;

double vReal[samples];
double vImag[samples];

const int sampleWindow = 50; // Sample window width in ms

void setup() {
  FastLED.addLeds<LED_TYPE, LED_PIN, COLOR_ORDER>(leds, NUM_LEDS);
  FastLED.setBrightness(50);
  pinMode(MIC_PIN, INPUT);
  Serial.begin(9600);

  samplingPeriod = round(1000000 * (1.0 / samplingFrequency));
}

void loop() {
  for (uint16_t i = 0; i < samples; i++) {
    currentMicros = micros();
    vReal[i] = analogRead(MIC_PIN);
    vImag[i] = 0;
    while (micros() < currentMicros + samplingPeriod) {
      // wait
    }
  }

  FFT.Windowing(vReal, samples, FFT_WIN_TYP_HAMMING, FFT_FORWARD);
  FFT.Compute(vReal, vImag, samples, FFT_FORWARD);
  FFT.ComplexToMagnitude(vReal, vImag, samples);

  // Break the strip into 3 chunks for highs, mids, and lows
  int lowEnd = samples / 6;
  int midEnd = samples / 3;
  int highEnd = samples / 2;

  // Calculate the intensities for lows, mids, and highs
  double lowIntensity = 0;
  double midIntensity = 0;
  double highIntensity = 0;

  for (int i = 1; i < lowEnd; i++) {
    lowIntensity += vReal[i];
  }
  lowIntensity /= (lowEnd - 1);

  for (int i = lowEnd; i < midEnd; i++) {
    midIntensity += vReal[i];
  }
  midIntensity /= (midEnd - lowEnd);

  for (int i = midEnd; i < highEnd; i++) {
    highIntensity += vReal[i];
  }
  highIntensity /= (highEnd - midEnd);

  // Map intensity to the number of LEDs for lows, mids, and highs
  int lowLedCount = map(constrain(lowIntensity, 0, 500), 0, 500, 0, NUM_LEDS / 3);
  int midLedCount = map(constrain(midIntensity, 0, 500), 0, 500, 0, NUM_LEDS / 3);
  int highLedCount = map(constrain(highIntensity, 0, 500), 0, 500, 0, NUM_LEDS / 3);

  // Clear the strip
  FastLED.clear();

  // Set color for each segment based on the number of LEDs
  fill_solid(leds, lowLedCount, CHSV(0, 255, 255));
  fill_solid(leds + NUM_LEDS / 3, midLedCount, CHSV(85, 255, 255));
  fill_solid(leds + 2 * (NUM_LEDS / 3), highLedCount, CHSV(170, 255, 255));

  FastLED.show();
  delay(10); // Add a small delay to improve responsiveness

  // Print low, mid, and high intensities
  Serial.print("Low: ");
  Serial.print(lowIntensity);
  Serial.print(" | Mid: ");
  Serial.print(midIntensity);
  Serial.print(" | High: ");
  Serial.println(highIntensity);
}
