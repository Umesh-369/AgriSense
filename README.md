<div align="center">

# 🌱 AgriSense — Smart Agriculture Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-43853D?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Graphics-black?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org/)

A full-stack smart agriculture platform combining **IoT soil monitoring**, **AI-powered crop disease detection**, and an **intelligent agricultural chatbot** — all in one unified system.

![Project Banner](assets/Poster.png)

</div>
---

## 🌟 Key Features

### 📡 IoT Soil Monitoring
- **Real-time Monitoring**: Live soil moisture readings continuously synced from IoT sensors via Firebase.
- **📊 Beautiful Dashboard**: Animated circular gauges, live updating line charts, and dynamic status indicators.
- **🔔 Smart Alerts**: Instant notifications triggered when moisture drops to critical levels.
- **🎨 3D Interactive UI**: Stunning Three.js animations and GSAP scroll effects for an immersive experience.

### 🔬 Crop Disease Detection
- **📷 AI Image Analysis**: Upload a photo of any plant leaf and get an instant disease diagnosis powered by **Gemini 2.5 Flash**.
- **🩺 Detailed Diagnosis**: Identifies the disease name, estimates severity (0–100%), and provides a practical cure/recommendation.
- **✅ Confidence Scoring**: Each result includes an AI confidence score for transparency.
- **🛡️ Non-Crop Guard**: Automatically rejects non-plant images with a helpful error message.

### 🤖 AgriBot Chatbot
- **💬 Agricultural Expert AI**: Ask any farming or crop-related question and receive structured, expert-level answers.
- **🌐 Google Search Grounding**: Responses are enriched with real-time web data for up-to-date agricultural advice.
- **🔊 Text-to-Speech**: Built-in browser TTS reads out responses for hands-free use in the field.
- **📖 Structured Responses**: Answers are always formatted with an `[OVERVIEW]` and `[KEY FINDINGS]` section for clarity.

### 📱 General
- **Responsive Design**: Seamlessly adapts to both desktop and mobile devices.
- **⚡ Firebase Integration**: Robust real-time database ensuring rapid and seamless data synchronization.

---

## 📷 IoT Hardware Sensor

<div align="center">
  <img src="assets/iot image.png" alt="IoT Soil Moisture Sensor deployed in the field" width="700">
  <p><em>Capacitive Soil Moisture Sensor (ESP32-based) deployed in a crop field</em></p>
</div>

### 🔧 Components Needed
- **ESP32 or ESP8266** microcontroller board
- **Capacitive Soil Moisture Sensor v1.2**
- Jumper wires and Breadboard
- Power supply (USB or battery bank)

### 🔌 Wiring Diagram

| Sensor Pin | ESP32 Connection |
| :--- | :--- |
| `VCC` | `3.3V` |
| `GND` | `GND` |
| `AOUT` | `GPIO34` (ESP32) or `A0` (ESP8266) |

---

## 📸 Interface Preview

### 🏠 Home Page — 3D Interactive Landing

<div align="center">
  <img src="assets/UI image.png" alt="AgriSense Home Page" width="100%">
</div>

---

### 📊 Real-Time Dashboard

<div align="center">
  <img src="assets/Dashboard.png" alt="AgriSense Dashboard" width="100%">
</div>

---

## 📁 Project Structure

```text
AgriSense/
├── assets/                        # Images and media assets for this README
│
├── backend/                       # Node.js REST API & Firebase integration
│   ├── routes/                    # Express endpoints (moisture.js)
│   ├── utils/                     # Moisture logic & thresholds
│   └── server.js                  # Main entry point
│
├── backend_python/                # Python FastAPI server (AI features)
│   ├── server.py                  # AgriBot chat & disease detection API
│   ├── requirements.txt           # Python dependencies
│   └── .env                       # Gemini API key configuration
│
├── frontend/                      # Client-side web application
│   ├── index.html                 # Landing page with 3D elements
│   ├── dashboard.html             # Live soil analytics dashboard
│   ├── disease_detector.html      # 🔬 AI crop disease detection page
│   ├── chatbot.html               # 🤖 AgriBot agricultural chatbot page
│   ├── css/                       # Styling & themes
│   └── js/                        # Three.js, GSAP, and Chart.js logic
│
├── iot/                           # Microcontroller code & testing tools
│   ├── esp32_moisture_sensor.ino  # Arduino firmware
│   └── data_simulator.js          # Mock data generator (for testing)
│
└── docs/                          # Additional documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Python](https://www.python.org/) (v3.10 or higher)
- A [Firebase account](https://console.firebase.google.com/) for real-time data
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) for AI features
- Arduino IDE (if flashing the IoT firmware)

---

### ⚙️ Part 1: IoT Monitoring Backend (Node.js)

#### 1. Clone & Install

```bash
git clone https://github.com/Umesh-369/AgriSense.git
cd AgriSense/backend
npm install
```

#### 2. Configure Firebase

1. Create a Firebase project and enable the **Realtime Database**.
2. Go to **Project Settings → Service Accounts** and generate a new private key.
3. Save the file as `backend/serviceAccountKey.json`.
4. Copy the environment variables example and update your database URL:

```bash
cp .env.example .env
```

```env
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

#### 3. Start the Node.js Server

```bash
npm start
```

> **Note**: Without Firebase configuration, the app runs in **Demo Mode** with simulated data.

Open in browser:
- 🏠 **Home:** [http://localhost:3000](http://localhost:3000)
- 📊 **Dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

### 🤖 Part 2: AI Features Backend (Python / FastAPI)

This server powers both the **Crop Disease Detector** and the **AgriBot Chatbot**.

#### 1. Set Up Python Environment

```bash
cd AgriSense/backend_python
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # macOS/Linux
pip install -r requirements.txt
```

#### 2. Configure Gemini API Key

Create a `.env` file inside `backend_python/` with your key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

You can get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

#### 3. Start the Python Server

```bash
python server.py
```

The AI server will be available at **[http://localhost:8000](http://localhost:8000)**.

Open the AI-powered pages:
- 🔬 **Disease Detector:** Open `frontend/disease_detector.html` in your browser
- 🤖 **AgriBot Chatbot:** Open `frontend/chatbot.html` in your browser

---

## 📊 API Endpoints Reference

### Node.js API (Port 3000)

| Endpoint | Method | Description |
|:---|:---|:---|
| `/api/health` | `GET` | Verifies server operational status |
| `/api/moisture/current` | `GET` | Fetches the latest moisture reading |
| `/api/moisture/history` | `GET` | Retrieves historical data (past 24h) |
| `/api/moisture/status` | `GET` | Calculates current status and alerts |
| `/api/moisture/thresholds` | `GET` | Returns threshold configuration data |

### Python FastAPI (Port 8000)

| Endpoint | Method | Description |
|:---|:---|:---|
| `/api/health` | `GET` | Verifies AgriBot server status |
| `/api/chat` | `POST` | Sends a message to the AgriBot chatbot |
| `/analyze` | `POST` | Uploads a crop image for disease analysis |

---

## 🔬 Crop Disease Detector — How It Works

1. **Upload** a clear photo of a plant leaf via the `disease_detector.html` page.
2. The image is sent to the **Python FastAPI** `/analyze` endpoint.
3. **Gemini 2.5 Flash** analyzes the image as an expert plant pathologist.
4. The result is returned as a structured JSON with:
   - `disease` — The identified disease name (or "Healthy")
   - `severity` — A percentage score (0–100%)
   - `cure` — A concise, practical recommendation
   - `confidence` — The AI's confidence in the diagnosis

---

## 🤖 AgriBot Chatbot — How It Works

1. **Ask** any agriculture-related question via the `chatbot.html` page.
2. The message is sent to the **Python FastAPI** `/api/chat` endpoint.
3. **Gemini 2.5 Flash** responds with Google Search grounding enabled for real-time accuracy.
4. Responses are always structured as:
   - `[OVERVIEW]` — A single summary sentence
   - `[KEY FINDINGS]` — 3–5 concise bullet points with bolded key terms
5. Optional **Text-to-Speech** reads the response aloud via the browser's Web Speech API.

---

## 💻 IoT Hardware Setup Details

1. Open `iot/esp32_moisture_sensor.ino` in your **Arduino IDE**.
2. Install the **Firebase ESP Client** library by Mobizt via the Library Manager.
3. Update credentials:
   ```cpp
   #define WIFI_SSID      "your_wifi_name"
   #define WIFI_PASSWORD  "your_wifi_password"
   #define FIREBASE_HOST  "your-project.firebaseio.com"
   #define FIREBASE_AUTH  "your_firebase_secret"
   ```
4. Flash the code to your ESP32/ESP8266 board.

### 🧪 Testing Without Hardware

Use the included data simulator to generate realistic mock readings:

```bash
cd iot
node data_simulator.js
```

---

## 🎨 Technologies & Stack

| Category | Technologies Used |
| :--- | :--- |
| **Frontend UI/UX** | HTML5, CSS3, JavaScript (ES6+), Glassmorphism |
| **3D & Animation** | Three.js, GSAP (GreenSock) |
| **Data Visualization** | Chart.js |
| **IoT Backend & API** | Node.js, Express.js |
| **AI Backend & API** | Python, FastAPI, Uvicorn |
| **AI / LLM** | Google Gemini 2.5 Flash (`google-genai` SDK) |
| **Database** | Firebase Realtime Database |
| **IoT / Hardware** | C++ (Arduino), ESP32 / ESP8266 |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to open an [issue](https://github.com/Umesh-369/AgriSense/issues) or submit a pull request.

## 📄 License

This project is [MIT](https://opensource.org/licenses/MIT) licensed.

---

<div align="center">
  <i>Designed & Developed with ❤️ for Smart Agriculture</i>
</div>
