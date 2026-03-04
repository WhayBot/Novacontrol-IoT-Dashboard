# NovaControl API Specification

## Overview

NovaControl is a universal IoT orchestration platform. Devices such as ESP32 or Arduino can register themselves dynamically, send telemetry data, receive control commands, and report online status via heartbeats.

**Base URL:** `http://localhost:8000`

**Protocol:** REST over HTTP/1.1, WebSocket

**Content-Type:** `application/json`

---

## REST Endpoints

### POST /api/register

Register a new device or update an existing registration.

**Request Body:**

```json
{
  "device_id": "esp32-001",
  "device_type": "esp32",
  "controls": [
    { "id": "relay_1", "type": "toggle" },
    { "id": "dimmer_1", "type": "slider" }
  ],
  "telemetry": [
    { "id": "temperature", "type": "float" },
    { "id": "humidity", "type": "float" }
  ]
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "device_id": "esp32-001",
  "device_type": "esp32",
  "controls": [
    { "id": "relay_1", "type": "toggle" },
    { "id": "dimmer_1", "type": "slider" }
  ],
  "telemetry_schema": [
    { "id": "temperature", "type": "float" },
    { "id": "humidity", "type": "float" }
  ],
  "last_heartbeat": "2026-03-04T07:00:00.000000",
  "is_online": true
}
```

---

### POST /api/telemetry

Submit telemetry data from a device.

**Request Body:**

```json
{
  "device_id": "esp32-001",
  "payload": {
    "temperature": 24.5,
    "humidity": 60.2
  }
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "device_id": "esp32-001",
  "timestamp": "2026-03-04T07:01:00.000000",
  "payload": {
    "temperature": 24.5,
    "humidity": 60.2
  }
}
```

---

### POST /api/control

Send a control command to a device.

**Request Body:**

```json
{
  "device_id": "esp32-001",
  "command": "relay_1",
  "value": "on"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "device_id": "esp32-001",
  "command": "relay_1",
  "value": "on",
  "executed": false
}
```

---

### GET /api/commands/{device_id}

Fetch all pending (unexecuted) commands for a device. Returned commands are automatically marked as executed.

**Path Parameters:**

| Parameter   | Type   | Description              |
|-------------|--------|--------------------------|
| `device_id` | string | Unique device identifier |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "device_id": "esp32-001",
    "command": "relay_1",
    "value": "on",
    "executed": true
  }
]
```

---

### POST /api/heartbeat

Report device online status. Updates `last_heartbeat` and sets `is_online` to `true`.

**Request Body:**

```json
{
  "device_id": "esp32-001"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "device_id": "esp32-001",
  "device_type": "esp32",
  "controls": [],
  "telemetry_schema": [],
  "last_heartbeat": "2026-03-04T07:05:00.000000",
  "is_online": true
}
```

**Error:** `404 Not Found` — Device not registered.

---

### GET /api/devices

List all registered devices.

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "device_id": "esp32-001",
    "device_type": "esp32",
    "controls": [
      { "id": "relay_1", "type": "toggle" }
    ],
    "telemetry_schema": [
      { "id": "temperature", "type": "float" }
    ],
    "last_heartbeat": "2026-03-04T07:05:00.000000",
    "is_online": true
  }
]
```

---

### GET /api/devices/{device_id}

Retrieve a single device by its unique identifier.

**Path Parameters:**

| Parameter   | Type   | Description              |
|-------------|--------|--------------------------|
| `device_id` | string | Unique device identifier |

**Response:** `200 OK`

```json
{
  "id": 1,
  "device_id": "esp32-001",
  "device_type": "esp32",
  "controls": [],
  "telemetry_schema": [],
  "last_heartbeat": "2026-03-04T07:05:00.000000",
  "is_online": true
}
```

**Error:** `404 Not Found` — Device not registered.

---

## WebSocket

### Endpoint

```
ws://localhost:8000/ws
```

Clients connect to this endpoint to receive real-time event broadcasts. The connection remains open until the client disconnects.

### Message Format

All messages are JSON objects with the following structure:

```json
{
  "event": "event_name",
  "device_id": "string",
  "payload": {}
}
```

### Events

#### telemetry_update

Broadcast when new telemetry data is received via `POST /api/telemetry`.

```json
{
  "event": "telemetry_update",
  "device_id": "esp32-001",
  "payload": {
    "temperature": 24.5,
    "humidity": 60.2
  }
}
```

#### device_status_update

Broadcast when a device registers or sends a heartbeat.

**On registration:**

```json
{
  "event": "device_status_update",
  "device_id": "esp32-001",
  "payload": {
    "status": "registered",
    "device_type": "esp32"
  }
}
```

**On heartbeat:**

```json
{
  "event": "device_status_update",
  "device_id": "esp32-001",
  "payload": {
    "status": "online",
    "last_heartbeat": "2026-03-04T07:05:00.000000"
  }
}
```

#### control_created

Broadcast when a new control command is created via `POST /api/control`.

```json
{
  "event": "control_created",
  "device_id": "esp32-001",
  "payload": {
    "command": "relay_1",
    "value": "on"
  }
}
```

---

## Error Responses

All error responses follow a standard format:

```json
{
  "detail": "Error message"
}
```

| Status Code | Description                          |
|-------------|--------------------------------------|
| 200         | Successful request                   |
| 404         | Resource not found                   |
| 422         | Validation error (malformed payload) |
| 500         | Internal server error                |

---

## Interactive Documentation

FastAPI provides auto-generated interactive documentation:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
