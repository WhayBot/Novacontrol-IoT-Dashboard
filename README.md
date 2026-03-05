# NovaControl

NovaControl is a Universal IoT Telemetry & Control Dashboard. It provides a generalized, highly-scalable platform for edge devices (such as ESP32, Arduino, and custom hardware) to dynamically register their sensors and control mechanisms natively.

## Overview

The platform allows any IoT device to define its own interface (what sliders, toggles, or data streams it supports) during registration. The web dashboard will automatically render the corresponding UI, process real-time incoming telemetry via WebSockets, and queue outbound commands.

## Features

- **Dynamic UI Generation:** Edge devices dictate their own UI based on self-reported schemas.
- **Real-time Telemetry:** Hardware data streams directly into live charts using WebSockets.
- **Industrial Design:** Beautiful, responsive UI built with TailwindCSS and Framer Motion.
- **Robust Backend:** Fast, asynchronous Python backend utilizing FastAPI and SQLAlchemy.

## Architecture

NovaControl uses a modular clean architecture:
- **Backend:** FastAPI, SQLite (aiosqlite), SQLAlchemy, Pydantic.
- **Frontend:** Next.js (App Router), TypeScript, TailwindCSS, Recharts, Framer Motion.
- **Transport:** REST for state mutation, WebSockets for real-time event broadcasting.

See [docs/architecture.md](docs/architecture.md) for deeper technical insights.

## Folder Structure

```
novacontrol/
├── backend/                  # FastAPI Application
│   ├── app/                  # Application Code (API, Services, Models)
│   └── requirements.txt      # Python Dependencies
├── frontend/                 # Next.js Application
│   ├── app/                  # App Router Pages
│   ├── components/           # React Components
│   └── lib/                  # Utilities (API, WebSocket)
└── docs/                     # System Documentation
```

## Setup Instructions

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   Alternative
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
The API runs on `http://localhost:8000`.

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
The dashboard runs on `http://localhost:3000`.



## Screenshots

<!-- 
Add your screenshots here later like this:
![Dashboard Demo](docs/images/dashboard.png)
-->

## ESP32 Firmware Setup

To integrate actual hardware with the NovaControl backend, we've provided a fully working ESP32 example.

### Required Libraries
You must install the following libraries in your Arduino IDE / PlatformIO before compiling the firmware:
* `WiFi.h` (Built-in)
* `HTTPClient.h` (Built-in)
* `ArduinoJson` (by Benoit Blanchon)
* `Preferences.h` (Built-in for ESP32)

### Steps
1. **Flash Firmware:** Flash the provided [`example_firmware.cpp`](example_firmware.cpp) to your ESP32.
2. **Configure WiFi:** Update the `ssid` and `password` constants at the top of the file.
3. **Set Server IP:** Update `serverUrl` to point to your local machine running the backend (e.g. `http://192.168.1.5:8000`). Make sure you use the backend port `8000`, not the frontend port.
4. **Auto-Register:** On first boot, the ESP32 will automatically generate a MAC-based ID and call `POST /api/register`.
5. **Secure Storage:** The backend returns a secure `api_key` and the `device_id`. The ESP32 saves both into **NVS (Non-Volatile Storage)** using the `Preferences` library so it survives reboots.

## Manual Recovery Mode

If the backend database is completely wiped or reset, the ESP32 will receive a `404` or `401` on its next heartbeat and attempt to auto-register again. However, if auto-registration fails or you manually registered the device via the frontend UI:

* Open the **Serial Monitor** at `115200` baud.
* Type: `manual` and hit Enter.
* Input the **API Key** when prompted.
* Input the **Device ID** when prompted.
* The new credentials will be saved permanently.

### Resetting Credentials
To wipe the NVS storage completely and start fresh:
* Open the **Serial Monitor** at `115200` baud.
* Type: `reset` and hit Enter.
* Restart the device. It will attempt auto-registration again.

## Device Online/Offline Logic

NovaControl implements a robust connection management system:
* **Heartbeats:** The ESP32 firmware sends a heartbeat ping to `POST /api/heartbeat` every **5 seconds**.
* **Timeout Verification:** A background task running on the FastAPI backend checks for stale devices every 10 seconds.
* **Offline Trigger:** If the backend does not receive a heartbeat or telemetry payload for **>30 seconds**, it broadcasts an offline WebSocket event.
* **Dashboard UX:** The frontend dynamically flips the status indicator:
  * Online (Green Pulse)
  * Offline (Static Red/Gray)

## Troubleshooting

If your device shows connected to WiFi in the Serial Monitor but isn't visible in the dashboard:

1. **Check Backend IP:** Ensure the ESP32 `serverUrl` matches the exact local IP address of the machine running the FastAPI backend.
2. **Check Firewall:** Ensure your PC's firewall allows inbound connections on port 8000 (Python).
3. **Verify API Endpoint:** Use `curl` or Postman from another machine to ensure the `POST /api/register` endpoint is reachable on the local network.
4. **Clear Credentials:** The ESP32 might be trying to authenticate with a wiped database using an old API key. Open the Serial Monitor, send the `reset` command, and restart the board. 
