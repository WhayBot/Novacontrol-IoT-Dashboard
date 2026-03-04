# NovaControl Architecture

## System Overview

NovaControl is a universal IoT orchestration platform designed to handle realtime telemetry data and bidirectional control commands between a central server and edge IoT devices (e.g., ESP32, Arduino).

The system uses a decoupled client-server architecture:
- **Backend:** FastAPI (Python) providing RESTful APIs for CRUD operations and a WebSocket server for real-time bi-directional events. Data persistence is handled via SQLite.
- **Frontend:** Next.js (React) providing a reactive, modern Single Page Application (SPA) utilizing TailwindCSS for styling and Framer Motion for animations.

## Component Responsibilities

### Backend (FastAPI)
- **API Router:** Handles HTTP requests from frontend and IoT devices.
- **Service Layer:** Encapsulates business logic, separating route handlers from direct database interactions.
- **WebSocket Manager:** Manages active connections, broadcasting messages to targeted clients or all listeners.
- **Database Layer:** SQLAlchemy async sessions persisting Device, Telemetry, and Command states to SQLite.

### Frontend (Next.js)
- **Sidebar & Layout:** Provides global state/navigation and displays real-time connection status.
- **Device Pages:** Subscribes to specific device events via WebSockets to dynamically render telemetry charts and control interfaces.
- **ControlRenderer:** Auto-generates UI inputs (sliders, toggles, numeric inputs, buttons) based on the device's reported schema.
- **TelemetryChart:** Uses Recharts to plot real-time incoming data streams.

## Data Flow

1. **Telemetry Ingestion:** An IoT device posts JSON payloads to `/api/telemetry`.
2. **Persistence:** The backend saves the row in the `telemetry` table.
3. **Broadcasting:** The backend emits a `telemetry_update` WebSocket event.
4. **UI Update:** The frontend receives the event and React updates the `TelemetryChart` component instantly.

## Device Lifecycle

1. **Registration:** Devices `POST /api/register` with their capabilities (`device_type`, `controls`, `telemetry_schema`).
2. **Heartbeats:** Devices periodically `POST /api/heartbeat` to keep their `is_online` status active.
3. **Operation:** Devices send telemetry and polling `GET /api/commands/{device_id}` to execute pending commands. Note: Devices can also potentially use WebSocket connections directly in advanced implementations for push-based commands.
4. **Disconnection:** If a heartbeat is missed (implemented via cron or offline detection logic), the device is marked offline.

## WebSocket Interaction Flow

The WebSocket endpoint `ws://localhost:8000/ws` uses a pub/sub paradigm.
- Frontend clients connect on mount.
- Backend routes (device registration, telemetry insertion, command creation) trigger the `websocket_service.py` to `broadcast()` events.
- Events follow a rigorous format: `{ event: string, device_id: string, payload: dict }`.
- Frontend filters incoming messages by `device_id` and acts on `event` type.
