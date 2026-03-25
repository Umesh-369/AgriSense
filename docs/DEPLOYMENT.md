# Deployment Guide

This guide covers deploying the Smart Soil Moisture Monitoring System to various platforms.

## 📋 Table of Contents

1. [Local Development](#local-development)
2. [Firebase Setup](#firebase-setup)
3. [Production Deployment](#production-deployment)
4. [IoT Device Deployment](#iot-device-deployment)
5. [Troubleshooting](#troubleshooting)

---

## 🖥️ Local Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Steps

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```

3. **Access the application**
   - Home: http://localhost:3000
   - Dashboard: http://localhost:3000/dashboard

---

## 🔥 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Enter project name (e.g., "soil-moisture-monitor")
4. Follow the setup wizard

### 2. Enable Realtime Database

1. In Firebase Console, go to "Build" → "Realtime Database"
2. Click "Create Database"
3. Choose a location (closest to you)
4. Start in **test mode** (for development)

### 3. Get Service Account Key

1. Go to Project Settings (gear icon)
2. Navigate to "Service Accounts"
3. Click "Generate new private key"
4. Save the JSON file as `backend/serviceAccountKey.json`

### 4. Configure Environment

Create `backend/.env` file:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FIREBASE_DATABASE_URL=https://YOUR-PROJECT-ID.firebaseio.com
PORT=3000
MOISTURE_LOW_THRESHOLD=30
MOISTURE_HIGH_THRESHOLD=70
```

### 5. Database Rules

For development, use these rules:
```json
{
  "rules": {
    "moisture": {
      ".read": true,
      ".write": true
    }
  }
}
```

For production, restrict access:
```json
{
  "rules": {
    "moisture": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

---

## 🚀 Production Deployment

### Option 1: Render.com (Recommended)

1. Create account at [render.com](https://render.com)
2. Connect your GitHub repository
3. Create new "Web Service"
4. Configure:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
5. Add environment variables from your `.env` file
6. Deploy!

### Option 2: Railway

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select repository
4. Add environment variables
5. Deploy

### Option 3: Vercel (Frontend Only)

For static frontend hosting:

1. Create `vercel.json` in frontend folder:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "YOUR_BACKEND_URL/api/$1" }
     ]
   }
   ```

2. Deploy:
   ```bash
   cd frontend
   npx vercel
   ```

### Option 4: Self-Hosted (VPS)

1. SSH into your server
2. Install Node.js and npm
3. Clone repository
4. Install PM2: `npm install -g pm2`
5. Start app: `pm2 start backend/server.js --name soil-monitor`
6. Configure Nginx reverse proxy

---

## 📡 IoT Device Deployment

### ESP32/ESP8266 Setup

1. **Install Arduino IDE**
   - Download from [arduino.cc](https://www.arduino.cc/en/software)

2. **Add Board Support**
   - ESP32: Add `https://dl.espressif.com/dl/package_esp32_index.json` to Board Manager URLs
   - ESP8266: Add `http://arduino.esp8266.com/stable/package_esp8266com_index.json`

3. **Install Libraries**
   - Open Library Manager
   - Install "Firebase ESP Client" by Mobizt

4. **Configure Credentials**
   Edit `iot/esp32_moisture_sensor.ino`:
   ```cpp
   #define WIFI_SSID "your-wifi-name"
   #define WIFI_PASSWORD "your-wifi-password"
   #define API_KEY "your-firebase-api-key"
   #define DATABASE_URL "https://your-project.firebaseio.com"
   ```

5. **Get Firebase API Key**
   - Go to Firebase Console → Project Settings
   - Copy "Web API Key"

6. **Upload Code**
   - Select correct board and port
   - Click Upload

7. **Monitor Serial Output**
   - Open Serial Monitor (115200 baud)
   - Verify WiFi and Firebase connection

### Sensor Calibration

1. Read value when sensor is **in air** (dry) → `SENSOR_DRY`
2. Read value when sensor is **in water** (wet) → `SENSOR_WET`
3. Update values in the code

---

## 🔧 Troubleshooting

### Backend Issues

**Error: Firebase not connecting**
- Check `serviceAccountKey.json` exists
- Verify DATABASE_URL is correct
- Check Firebase rules allow access

**Error: Port already in use**
```bash
# Find process using port
netstat -ano | findstr :3000
# Kill process
taskkill /PID <PID> /F
```

### Frontend Issues

**3D animation not loading**
- Check browser supports WebGL
- Ensure Three.js CDN is accessible
- Check console for errors

**API calls failing**
- Verify backend is running
- Check CORS settings
- Verify API_BASE_URL in main.js

### IoT Issues

**ESP32 not connecting to WiFi**
- Check SSID and password
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Check router allows new devices

**Firebase upload failing**
- Verify API key is correct
- Check database URL includes "https://"
- Ensure database rules allow writes

---

## 📊 Monitoring & Maintenance

### Health Check
```bash
curl http://localhost:3000/api/health
```

### View Logs (PM2)
```bash
pm2 logs soil-monitor
```

### Restart Server (PM2)
```bash
pm2 restart soil-monitor
```

---

## 🔒 Security Checklist

- [ ] Firebase rules restrict write access
- [ ] Service account key not in version control
- [ ] Environment variables not exposed
- [ ] HTTPS enabled in production
- [ ] Rate limiting configured
- [ ] Error messages don't expose internals

---

For additional support, check the [README.md](../README.md) or open an issue.
