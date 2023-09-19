#include <FastLED.h>
#include <arduinoFFT.h>

#define LED_PIN 15
#define LED_COUNT 60
#define SAMPLE_RATE 44100
#define FFT_SIZE 1024
#define MIC_PIN 32                              // ESP32 pin also known as 'VP'.

CRGB leds[LED_COUNT];
arduinoFFT FFT = arduinoFFT();

void setup() {
    FastLED.addLeds<WS2812, LED_PIN, GRB>(leds, LED_COUNT);
    FastLED.setBrightness(64);
    Serial.begin(115200);
}

void loop() {
    static uint16_t buffer[FFT_SIZE];
    static double vReal[FFT_SIZE];
    static double vImag[FFT_SIZE];
    static double samples[FFT_SIZE];

    // read analog audio input into buffer
    for (uint16_t i = 0; i < FFT_SIZE; i++) {
        buffer[i] = analogRead(MIC_PIN);
    }

    // convert buffer to sample array and apply windowing
    for (uint16_t i = 0; i < FFT_SIZE; i++) {
        samples[i] = (double)(buffer[i] - 512) * 0.5 * (1.0 - cos(2.0 * PI * i / (FFT_SIZE - 1)));
    }

    // compute FFT
    FFT.Windowing(samples, FFT_SIZE, FFT_WIN_TYP_HAMMING, FFT_FORWARD);
    FFT.Compute(samples, vReal, vImag, FFT_SIZE, FFT_FORWARD);
    FFT.ComplexToMagnitude(vReal, vImag, FFT_SIZE);
    
    // map FFT output to LED colors
    for (uint8_t i = 0; i < LED_COUNT; i++) {
        uint16_t startBin = i * (FFT_SIZE / LED_COUNT);
        uint16_t endBin = startBin + (FFT_SIZE / LED_COUNT) - 1;
        uint8_t brightness = map((int)(vReal[startBin] + vReal[endBin]), 0, 2000, 0, 255);
        leds[i] = CRGB(brightness, 0, 0);
    }
    
    // update LED strip
    FastLED.show();
}
