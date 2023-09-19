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

  // Map intensity to brightness for lows, mids, and highs
  int lowBrightness = map(lowIntensity, 0, 500, 0, 255);
  int midBrightness = map(midIntensity, 0, 500, 0, 255);
  int highBrightness = map(highIntensity, 0, 500, 0, 255);

  // Set brightness and color for each segment
  fill_solid(leds, NUM_LEDS / 3, CHSV(0, 255, lowBrightness));
  fill_solid(leds + NUM_LEDS / 3, NUM_LEDS / 3, CHSV(85, 255, midBrightness));
  fill_solid(leds + 2 * (NUM_LEDS / 3), NUM_LEDS / 3, CHSV(170, 255, highBrightness));

  FastLED.show();

  // Print low, mid, and high intensities
  Serial.print("Low: ");
  Serial.print(lowIntensity);
  Serial.print(" | Mid: ");
  Serial.print(midIntensity);
  Serial.print(" | High: ");
  Serial.println(highIntensity);
}
