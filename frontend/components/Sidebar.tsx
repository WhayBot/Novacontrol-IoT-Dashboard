"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { fetchDevices } from "../lib/api";
import { createWebSocket } from "../lib/websocket";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, Zap } from "lucide-react";

export default function Sidebar() {
    const [devices, setDevices] = useState<any[]>([]);
    const pathname = usePathname();

    useEffect(() => {
        let isMounted = true;
        fetchDevices()
            .then(data => { if (isMounted) setDevices(data); })
            .catch(console.error);
        return () => { isMounted = false; };
    }, []);

    const handleWebSocketMessage = useCallback((message: any) => {
        setDevices((prevDevices) => {
            // Remove device
            if (message.event === "device_deleted" || message.type === "device_deleted") {
                return prevDevices.filter(d => (d.device_id || d.id) !== message.device_id);
            }

            // Add or update status of registered device
            if (message.event === "device_status_update" || message.type === "device_status_update") {
                const payload = message.payload || message.device;

                // If it's a new registration, add to list
                if (payload.status === "registered") {
                    const exists = prevDevices.some(d => (d.device_id || d.id) === message.device_id);
                    if (!exists) {
                        return [...prevDevices, { device_id: message.device_id, is_online: true, ...payload }];
                    }
                }

                // General status update (online/offline)
                return prevDevices.map(device => {
                    const id = device.device_id || device.id;
                    if (id === message.device_id || (payload.id && id === payload.id)) {
                        return {
                            ...device,
                            is_online: payload.status === "online" || payload.status === "registered"
                        };
                    }
                    return device;
                });
            }

            return prevDevices;
        });
    }, []);

    useEffect(() => {
        const ws = createWebSocket(handleWebSocketMessage);
        return () => ws.close();
    }, [handleWebSocketMessage]);

    return (
        <div className="w-64 bg-surface border-r border-border h-screen flex flex-col z-10 shrink-0">
            <div className="p-4 border-b border-border flex items-center gap-2">
                <Zap className="text-primary w-6 h-6 shrink-0" />
                <h1 className="text-xl font-bold tracking-wider truncate">NOVACONTROL</h1>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                <Link
                    href="/"
                    className={clsx(
                        "flex items-center gap-2 p-2 rounded transition-colors text-sm font-medium",
                        pathname === "/" ? "bg-primary/10 text-primary" : "hover:bg-primary/5 text-gray-300"
                    )}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                </Link>
                <div className="pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Devices</div>
                {devices.map((device) => (
                    <Link
                        key={device.device_id}
                        href={`/devices/${device.device_id}`}
                        className={clsx(
                            "flex items-center gap-2 p-2 rounded transition-colors text-sm",
                            pathname === `/devices/${device.device_id}` ? "bg-primary/10 text-primary" : "hover:bg-primary/5 text-gray-400"
                        )}
                    >
                        <div className={clsx("w-2 h-2 rounded-full", device.is_online ? "bg-green-500" : "bg-red-500")} />
                        {device.device_id}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
