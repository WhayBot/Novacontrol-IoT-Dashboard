const BASE_URL = 'http://localhost:8000';

export async function fetchDevices() {
    try {
        const res = await fetch(`${BASE_URL}/api/devices`);
        if (!res.ok) throw new Error('Failed to fetch devices');
        return await res.json();
    } catch (error) {
        console.error("API failed to fetch devices.", error);
        throw error; // Let the caller handle the error
    }
}

export async function fetchDevice(deviceId: string) {
    const res = await fetch(`${BASE_URL}/api/devices/${deviceId}`);
    if (!res.ok) {
        if (res.status === 404) throw new Error('Device not found');
        throw new Error('Failed to fetch device');
    }
    return res.json();
}

export async function sendControlCommand(deviceId: string, command: string, value?: string) {
    const res = await fetch(`${BASE_URL}/api/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, command, value }),
    });
    if (!res.ok) throw new Error('Failed to send control command');
    return res.json();
}

export async function registerDevice(deviceId: string, name: string) {
    const res = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            device_id: deviceId,
            device_type: name || "generic", // Using device_type as a name surrogate
            controls: [],
            telemetry: []
        }),
    });
    if (!res.ok) throw new Error('Failed to register device');
    return res.json();
}

export async function deleteDevice(deviceId: string) {
    const res = await fetch(`${BASE_URL}/api/devices/${deviceId}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        if (res.status === 404) throw new Error('Device not found');
        throw new Error('Failed to delete device');
    }
    return res.json();
}
