 # Arduino Code Issues & Fixes

## Issue 1: Conflicting Sample Rates

**Current Code:**
```cpp
sensor.setup(60, 4, 2, 100, 411, 4096);  // 100 Hz
if (millis() - lastSampleTime > 5) {      // Every 5ms = 200 Hz ❌
```

**Problem:** Sensor at 100 Hz but reading at 200 Hz → duplicates/misses

**Fix:**
```cpp
if (millis() - lastSampleTime > 10) {  // 10ms = 100 Hz ✓
```

---

## Issue 2: MAX_SAMPLES Too Small

**Current Code:**
```cpp
#define MAX_SAMPLES 3000;  // Assumes 50 Hz
```

**Problem:** At 100 Hz actual rate, overflows in ~30 seconds

**Fix:**
```cpp
#define MAX_SAMPLES 6000  // 60 sec * 100 Hz ✓
```

---

## Issue 3: Wrong Sensor Mode

**Current Code:**
```cpp
sensor.setup(60, 4, 2, 100, 411, 4096);
					 ↑  ↑  ↑
					 |  |  Mode=2 (invalid for SpO2)
					 |  Sample averaging=4
					 LED current=60mA
```

**Fix:**
```cpp
sensor.setup(60, 4, 3, 100, 411, 4096);  // Mode 3 = SpO2
// Parameters:
// 60    = LED pulse amplitude (0-255 mA)
// 4     = Sample averaging (1,2,4,8,16)
// 3     = Mode (2=HR only, 3=SpO2)
// 100   = Sample rate (50,100,200,400,800,1000,1600,3200 Hz)
// 411   = Pulse width (69,118,215,411 us)
// 4096  = ADC resolution (4096=18-bit)
```

---

## Issue 4: Fake SpO2 Calculation

**Current Code:**
```cpp
float ratio = (float)redValue / (float)irValue;
SpO2 = 95 + random(-2, 2);  // ❌ IGNORES RATIO, USES RANDOM
```

**Problem:** Not using actual sensor data

**Fix (real device_spo2 from MAX30102 algorithm):**
```cpp
// Add these headers
#include "spo2_algorithm.h"

// Buffers (100 samples at 100 Hz = 1 second window)
uint32_t irBuffer[100];
uint32_t redBuffer[100];
int32_t spo2Calc = 0;
int8_t spo2Valid = 0;
int32_t hrCalc = 0;
int8_t hrValid = 0;

// Fill buffers continuously while measuring
for (int i = 0; i < 100; i++) {
	while (!sensor.available()) sensor.check();
	redBuffer[i] = sensor.getRed();
	irBuffer[i] = sensor.getIR();
	sensor.nextSample();
}

// Compute heart-rate and SpO2 from AC/DC components
maxim_heart_rate_and_oxygen_saturation(
	irBuffer,
	100,
	redBuffer,
	&spo2Calc,
	&spo2Valid,
	&hrCalc,
	&hrValid
);

if (spo2Valid) {
	SpO2 = (int)spo2Calc;
} else {
	SpO2 = 0; // mark invalid instead of random fake value
}

if (hrValid) {
	BPM = (int)hrCalc;
}
```

**Notes:**
- This algorithm is available in SparkFun MAX3010x examples and is better than random or ratio shortcuts.
- Keep SpO2 as 0 when invalid and filter invalid rows in Python.
- For medical-grade labels, still use external clinical oximeter as ground truth.

---

## Issue 5: Naive BPM Detection

**Current Code:**
```cpp
if (irValue > prevIR) rising = true;
else if (irValue < prevIR && rising) {
	if (millis() - lastBeatTime > 400) {
		count++;
		lastBeatTime = millis();
	}
	rising = false;
}
```

**Problem:** Detects every inflection point → counts noise as beats

**Better Approach (Peak Detection):**
```cpp
// Store last N IR values for peak detection
#define PEAK_WINDOW 10
long irBuffer[PEAK_WINDOW];

// In loop, fill buffer
for (int i = 0; i < PEAK_WINDOW - 1; i++) {
	irBuffer[i] = irBuffer[i + 1];
}
irBuffer[PEAK_WINDOW - 1] = irValue;

// Check if middle sample is a local maximum
bool isPeak = (irBuffer[PEAK_WINDOW/2] > irBuffer[PEAK_WINDOW/2 - 1] &&
							 irBuffer[PEAK_WINDOW/2] > irBuffer[PEAK_WINDOW/2 + 1]);

if (isPeak && (millis() - lastBeatTime > 400)) {
	count++;
	lastBeatTime = millis();
}
```

---

## Issue 6: Missing BP Labels in Firebase

**Current Code:**
```cpp
String json = "{\"timestamp\":\"" + String(timeString) + "\"," 
						+ "\"bpm\":" + String(BPM)
						+ ",\"spo2\":" + String(SpO2)
						+ ",\"ir_data\":[" + irString + "]}";
```

**Problem:** No SBP/DBP fields (needed for supervised training)

**Fix:**
```cpp
String json = "{\"timestamp\":\"" + String(timeString) + "\"," 
						+ "\"bpm\":" + String(BPM)
						+ ",\"spo2\":" + String(SpO2)
						+ ",\"SBP\":0"              // ← Add placeholder
						+ ",\"DBP\":0"              // ← Add placeholder
						+ ",\"ir_data\":[" + irString + "]}";

// Later: manually add real cuff readings when available:
// "SBP":120, "DBP":80
```

---

## Summary of Changes

| Issue | Line | Change | Reason |
|-------|------|--------|--------|
| Sample rate | ~70 | `> 5` → `> 10` | Match 100 Hz sensor |
| Array size | ~10 | `3000` → `6000` | 60sec * 100Hz |
| Sensor mode | ~58 | `2` → `3` | Enable SpO2 mode |
| SpO2 calc | ~122 | Use MAX30102 SpO2 algorithm | Real device estimate |
| BPM detection | ~88-95 | Add peak buffering | Reduce noise |
| Firebase JSON | ~148 | Add SBP/DBP fields | For training labels |

---

## Testing Steps

1. **Verify sample rate:**
```cpp
// Add to loop to debug
static int sampleCount = 0;
static unsigned long lastCheck = 0;
if (millis() - lastCheck >= 1000) {
	Serial.print("Samples in 1 sec: ");
	Serial.println(sampleCount);
	sampleCount = 0;
	lastCheck = millis();
}
sampleCount++;
```
Should print **~100** each second

2. **Check BPM stability:**
- Put finger on sensor
- BPM should be 60-100, consistent over 60 seconds
- Should NOT jump wildly

3. **Check SpO2 range:**
- SpO2 should be 95-100 for healthy finger
- Should NOT be random 93-97 every time

4. **Verify Firebase data:**
- Open Firebase console
- Check that `ir_data` array has ~6000 elements
- Check that `BPM`, `SpO2`, `SBP`, `DBP` are numeric (not random each time)
