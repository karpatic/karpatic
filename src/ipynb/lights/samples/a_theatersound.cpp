#include <Adafruit_NeoPixel.h>
#include <avr/pgmspace.h>

#define LED_PIN 6
#define AUDIO_ENVELOPE_PIN 0
#define BTN_INTERUPT 2        // must be 2 or 3 for interupt
#define WHITE_LED 3        // must be PWM pin 3 or 11
#define NOT_AN_INTERRUPT -1

//flag for debuging mode
const PROGMEM bool debuging = false;

// Parameter 1 = number of pixels in strip
// Parameter 2 = Arduino pin number (most are valid)
// Parameter 3 = pixel type flags, add together as needed:
//   NEO_KHZ800  800 KHz bitstream (most NeoPixel products w/WS2812 LEDs)
//   NEO_KHZ400  400 KHz (classic 'v1' (not v2) FLORA pixels, WS2811 drivers)
//   NEO_GRB     Pixels are wired for GRB bitstream (most NeoPixel products)
//   NEO_RGB     Pixels are wired for RGB bitstream (v1 FLORA pixels, not v2)
Adafruit_NeoPixel strip = Adafruit_NeoPixel(68, LED_PIN, NEO_GRB + NEO_KHZ800);

// IMPORTANT: To reduce NeoPixel burnout risk, add 1000 uF capacitor across
// pixel power leads, add 300 - 500 Ohm resistor on first pixel's data input
// and minimize distance between Arduino and first pixel.  Avoid connecting
// on a live circuit...if you must, connect GND first.

// array for control signal values
const PROGMEM byte channels = 10;
byte controlValues[channels];

// control options
bool autoThreshold = true;


// display mode state
volatile byte mode;
const PROGMEM byte modes = 2;

// variables to keep track of the timing of recent interrupts
unsigned long button_time = 0;  
unsigned long last_button_time = 0; 

// array of recent readings for rolling average, max and min
const PROGMEM byte historyFreqency = 10; // reading frequency in hz
const PROGMEM byte historyLength = 60; //  number of readings to store in history
byte historyIndex = 0; // index of last reading
uint16_t history[historyLength]; // array to store reading history

// global color states
uint32_t fadeColor[] = {255, 255, 255};
uint32_t startTime;

void setup() {
  strip.begin(); // start LED strip serial stream
  strip.show(); // Initialize all pixels to 'off'
  
  Serial.begin(9600);
  
  randomSeed(analogRead(A0)); // initialize sudo random sequence with a random seed
  
  // initalize history to 0
  for (int i = 0; i < historyLength; i++)
    history[i] = 0;
  
  // setup timer1 interupt for updating history array
  noInterrupts();           // disable all interrupts
  TCCR1A = 0;
  TCCR1B = 0;
  TCNT1  = 0;
  OCR1A = 62500 / historyFreqency;            // compare match register 16MHz/256/ Interupt Freq. in Hz
  TCCR1B |= (1 << WGM12);   // CTC mode
  TCCR1B |= (1 << CS12);    // 256 prescaler 
  TIMSK1 |= (1 << OCIE1A);  // enable timer compare interrupt
  interrupts();             // enable all interrupts
  
  // initialize mode and setup interupt for mode switch button
  mode = 1;
  // uncomment to turn on a mode swich
  //attachInterrupt(digitalPinToInterrupt(BTN_INTERUPT), modeSwitch, FALLING);
}

void loop() {

  // switch heartbeat LED
  digitalWrite(13, !digitalRead(13));

  // Run a display function
  switch (mode) {
    case 0:
      flash();
      break;
    case 1:
      fade();
      break;
    case 2:
      flashNB();
      break;
  }
  
  // switch off heartbeat LED
  digitalWrite(13, 0);
  
}

// Interrupt called to update the history array
SIGNAL(TIMER1_COMPA_vect) 
{
  history[historyIndex] = analogRead(AUDIO_ENVELOPE_PIN);
  historyIndex = (historyIndex + 1) % historyLength;
}

// on FALLING edge interupt increment mode
void modeSwitch() {
  button_time = millis();
  //check to see if increment() was called in the last 500 milliseconds (debounce)
  if (button_time - last_button_time > 250)
  {
    mode = (mode + 1) % modes;
    last_button_time = button_time;
    if (debuging) {
      Serial.print("Mode: ");
      Serial.println(mode);
      Serial.println();
    }
  }
}

// rolling average
int rollingAverage() {
  int sum = 0;
  for (int i = 0; i < historyLength; i++)
    sum += history[i];
  return (sum / historyLength);
}

// rolling max
int rollingMax() {
  int maxValue = 0;
  for (int i = 0; i < historyLength; i++)
    if (history[i] > maxValue)
      maxValue = history[i];
  return maxValue;
}

//Flashing lights.
void flash() {
  int reading, threshold, time, cycles;
  uint32_t color = randomColor();
  cycles = map(controlValue(5), 0, 255, 2, 124); // set initial cycles value
  
  for (int i=0; i < strip.numPixels(); i++) { //turn every pixel off
    strip.setPixelColor(i, 0);
  }
  strip.show();
  
  for (int j=0; j<cycles; j++) {  //do x cycles of flashing
    // update threshold and decay time values
    if (autoThreshold) {
      byte sens = map(controlValue(3), 0, 255, -96, 96);
      int value = constrain((((rollingMax() + rollingAverage()) / 2) + sens), 0, 1023);
      threshold = map(value, 0, 1023, 5, 250);
    }
    else threshold = map(controlValue(3), 0, 255, 5, 250);
    time = map(controlValue(4), 0, 255, 5, 500);
    
    while (controlValue(2) < threshold && j < cycles) // wait till it reaches threshold
      cycles = cycles;
    
    for (int i=0; i < strip.numPixels(); i++) { //turn every pixel on
      strip.setPixelColor(i, color);
    }
    strip.show();
    
    while (controlValue(2) < threshold && j < cycles) // wait till it drops bellow threshold
      cycles = map(controlValue(5), 0, 255, 3, 90); // update cycles value from controls
    
    delay(time); // decay time
    
    for (int i=0; i < strip.numPixels(); i++) { //turn every pixel off
      strip.setPixelColor(i, 0);
    }
    strip.show();
    
  }
}

//Flashing lights.
void flashNB() {
  int threshold, time;
  uint32_t color = randomColor();

  // update threshold and decay time values
  if (autoThreshold) {
    byte sens = map(controlValue(3), 0, 255, -96, 96);
    int value = constrain((((rollingMax() + rollingAverage()) / 2) + sens), 0, 1023);
    threshold = map(value, 0, 1023, 5, 250);
  }
  else threshold = map(controlValue(3), 0, 255, 5, 250);
  time = map(controlValue(4), 0, 255, 5, 500);

  if (controlValue(2) > threshold) { // is signal is above threshold
    for (int i=0; i < strip.numPixels(); i++) { //turn every pixel on
      strip.setPixelColor(i, color);
    }
    strip.show();
    delay(time); // decay time
  } else {
    for (int i=0; i < strip.numPixels(); i++) { //turn every pixel off
      strip.setPixelColor(i, 0);
    }
    strip.show();
  }
}

// fade lights to sound
void fade() {
  byte brightness;
  uint8_t delayTime, brightMod, level;
  uint16_t threshold, colorTime;
  int cMod[3];
  
  // update color time
  colorTime = map(controlValue(5), 0, 255, 500, 10000);
  
  // random color as ratio
  // if color time has passed get new random color
  if ((millis() - startTime) >= colorTime) {
    int ratio[3];
    byte brightest;
    brightest = 0;
    // generate new random color ratio
    for (int i = 0; i < 3; i++) {
     ratio[i] = random(65);
     if (ratio[i] > brightest)
       brightest = ratio[i];
    }
    // Scale ratios to max brightness and Convert ratio to color
    for (int j = 0; j < 3; j++) {
      ratio[j] = ratio[j] * (64 / brightest);
      fadeColor[j] = min((ratio[j] * 4) - 1, 255);
    }
    // update startTime
    startTime = millis();
  }

  // update threshold, delay time and color time values
  if (autoThreshold) {
    byte sens = map(controlValue(3), 0, 255, -96, 96);
    threshold = map(constrain((rollingMax() + sens), 32, 1023), 32, 1023, 64, 255);
  }
  else threshold = map(controlValue(3), 0, 255, 32, 255);
  delayTime = map(controlValue(4), 0, 255, 0, 70);
  colorTime = map(controlValue(5), 0, 255, 500, 10000);
  
  level = constrain(controlValue(2), 0, threshold);
  brightMod = map(level, 0, threshold, 0, 1000); // map amplitude to brightness
  
  for (int j=0; j<3; j++) // modulate color with brightMod
    cMod[j] = fadeColor[j] * brightMod * 0.001;
  
  for (int i=0; i < strip.numPixels(); i++) // write modulated color to all pixels
    strip.setPixelColor(i, cMod[0], cMod[1], cMod[2]); 
  strip.show();
  
  // pwm control the high powered white LED acording to brightness
  brightness = map(level, 0, threshold, 0, 255); // map amplitude to brightness
  analogWrite(WHITE_LED, brightness);
  
  delay(delayTime);
    
}

// generate random color as ratio
int randomColorRatio() {
  int ratio[3];
  int color[3];
  byte brightest;
  brightest = 0;
  
  // generate random ratio
  for (int i = 0; i < 3; i++) {
   ratio[i] = random(65);
   if (ratio[i] > brightest)
     brightest = ratio[i];
  }
  
  // Scale ratios to max brightness and Convert ratio to color
  for (int j = 0; j < 3; j++) {
    ratio[j] = ratio[j] * (64 / brightest);
    color[j] = min((ratio[j] * 4) - 1, 255);
  }

  return color;
}

// only works for wheel colors
byte randomColor(){
  return Wheel(random(256));
}

// Input a value 0 to 255 to get a color value.
// The colours are a transition r - g - b - back to r.
uint32_t Wheel(byte WheelPos) {
  WheelPos = 255 - WheelPos;
  if(WheelPos < 85) {
   return strip.Color(255 - WheelPos * 3, 0, WheelPos * 3);
  } else if(WheelPos < 170) {
    WheelPos -= 85;
   return strip.Color(0, WheelPos * 3, 255 - WheelPos * 3);
  } else {
   WheelPos -= 170;
   return strip.Color(WheelPos * 3, 255 - WheelPos * 3, 0);
  }
}

int controlValue(uint8_t channel) {
  return analogRead(channel) / 4;
  // controlValues[channel] = analogRead(channel) / 4;
  // return controlValues[channel];
}

