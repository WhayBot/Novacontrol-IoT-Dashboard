"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchDevice } from "../../../lib/api";
import { createWebSocket } from "../../../lib/websocket";
import ControlRenderer from "../../../components/ControlRenderer";
import TelemetryChart from "../../../components/TelemetryChart";
import AnimatedContainer from "../../../components/AnimatedContainer";
import StatusBadge from "../../../components/StatusBadge";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function DevicePage({ params }: { params: { id: string } }) {
    const [device, setDevice] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [telemetryHistory, setTelemetryHistory] = useState<Record<string, any[]>>({});

    useEffect(() => {
        let isMounted = true;
        fetchDevice(params.id).then((data) => {
            if (!isMounted) return;
            setDevice(data);
            const initialHistory: Record<string, any[]> = {};
            data.telemetry_schema?.forEach((t: any) => {
                initialHistory[t.id] = [];
            });
            setTelemetryHistory(initialHistory);
        }).catch((err) => {
            if (!isMounted) return;
            console.error(err);
            setError(err.message === "Device not found" ? "Device not found." : "Failed to load device data.");
        });
        return () => { isMounted = false; };
    }, [params.id]);

    const handleWebSocketMessage = useCallback((message: any) => {
        if (message.device_id !== params.id) return;

        if (message.event === "telemetry_update") {
            const timestamp = new Date().toLocaleTimeString();
            setTelemetryHistory((prev) => {
                const next = { ...prev };
                Object.entries(message.payload).forEach(([key, value]) => {
                    if (!next[key]) next[key] = [];
                    next[key] = [...next[key].slice(-19), { time: timestamp, value }];
                });
                return next;
            });
        } else if (message.event === "device_status_update") {
            setDevice((prev: any) => prev ? { ...prev, is_online: message.payload.status === "online" } : prev);
        }
    }, [params.id]);

    useEffect(() => {
        if (error || !device) return; // Don't connect WS if there's an error or no device loaded yet

        let ws: WebSocket;
        try {
            ws = createWebSocket(handleWebSocketMessage);
        } catch (e) {
            console.error("WebSocket setup failed", e);
        }

        return () => {
            if (ws) ws.close();
        };
    }, [handleWebSocketMessage, error, device]);

    if (error) {
        return (
            <AnimatedContainer>
                <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-red-500/30 rounded-2xl bg-surface/30 mt-8">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-red-500/20">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-200 mb-3">{error}</h2>
                    <p className="text-gray-400 mb-8">The requested device could not be located in the database or there is a connection issue.</p>
                    <Link
                        href="/"
                        className="px-6 py-2.5 bg-background border border-border hover:border-primary text-gray-300 rounded-lg transition-colors"
                    >
                        Return to Dashboard
                    </Link>
                </div>
            </AnimatedContainer>
        );
    }

    if (!device) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-surface rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-surface rounded"></div><div className="h-4 bg-surface rounded w-5/6"></div></div></div></div>;

    return (
        <AnimatedContainer>
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-border">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{device.device_id}</h1>
                    <p className="text-gray-400 capitalize">Type: {device.device_type}</p>
                </div>
                <StatusBadge isOnline={device.is_online} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Real-time Telemetry</h2>
                        {device.telemetry_schema?.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {device.telemetry_schema.map((schema: any) => (
                                    <TelemetryChart
                                        key={schema.id}
                                        telemetryKey={schema.id}
                                        data={telemetryHistory[schema.id] || []}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No telemetry sensors reported.</p>
                        )}
                    </section>
                </div>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Controls</h2>
                        {device.controls?.length > 0 ? (
                            <ControlRenderer deviceId={device.device_id} controls={device.controls} />
                        ) : (
                            <p className="text-gray-500">No controls available.</p>
                        )}
                    </section>
                </div>
            </div>
        </AnimatedContainer>
    );
}
