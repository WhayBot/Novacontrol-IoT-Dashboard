export function createWebSocket(onMessage: (data: any) => void) {
    const ws = new WebSocket('ws://localhost:8000/ws');

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage(data);
        } catch (e) {
            console.error('Failed to parse WebSocket message', e);
        }
    };

    return ws;
}
