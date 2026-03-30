# Project Review: System Compatibility & Calibration (Device Check)

The **System Compatibility Test** (often referred to as **System Calibration**) is a critical security and reliability layer in our AI Proctoring Platform. It ensures that the candidate's environment is fully optimized and secure *before* the examination begins.

## 🛡️ Why it's Important
A failed device check prevents unfair advantages and technical failures mid-exam. It acts as both a **Hardware Guard** and a **Biometric Lock**.

---

## 🔍 Core Components of the Test

### 1. AI-Powered Camera Verification
*   **What it does:** Captures a live frame and sends it to the **Python AI Monitor**.
*   **How it works:** Uses **MediaPipe** to perform real-time face detection.
*   **Requirement:** It enforces a "Strict 1-Face Rule". If no face is detected or if multiple people are present, the test fails. This locks the candidate's identity to the camera feed.

### 2. Acoustic Mic Sensitivity Analysis
*   **What it does:** Measures the input volume from the candidate's microphone.
*   **How it works:** Uses the **Web Audio API (`AudioContext`)** to analyze frequency data.
*   **Requirement:** The candidate must speak to confirm the mic is active. We require a sensitivity threshold (> 5 units) to ensure that proctoring alerts (like noise detection) will work correctly.

### 3. Audio Loop-back (Speaker Test)
*   **What it does:** Plays a "Sonic Pulse" audio file.
*   **How it works:** The candidate must manually confirm they heard the sound.
*   **Requirement:** Ensures that if the proctor (or AI) needs to send an audible warning during the exam, the candidate will hear it.

### 4. Network Latency & Stability Check
*   **What it does:** Measures the round-trip time (Ping) between the browser and the server.
*   **How it works:** Conducts multiple pings to calculate average latency.
*   **Requirement:** High latency (> 500ms) can lead to delays in AI monitoring alerts. We enforce a stability check to ensure real-time video analysis is reliable.

### 5. Browser Environment Lockdown
*   **Integrity Checks:** The system verifies if the browser supports `Webcam` and `Audio` APIs.
*   **Rule Enforcement:** It initializes listeners for **Tab Switching** (`visibilitychange`) and **Clipboard Locking**. If the candidate tries to switch tabs during the exam after this check, a violation is instantly logged.

---

## 🚀 Technical Summary for Reviewers
- **Frontend**: Implemented in `DeviceCheck.js` using React Hooks and Web Audio API.
- **Backend**: Integrated with `ai-monitor` via REST for liveness verification.
- **Goal**: Zero technical friction during the exam and 100% hardware accountability.
