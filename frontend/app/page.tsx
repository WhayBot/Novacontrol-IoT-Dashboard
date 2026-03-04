"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import { fetchDevices, registerDevice } from "../lib/api";
import { createWebSocket } from "../lib/websocket";
import DeviceCard from "../components/DeviceCard";
import AnimatedContainer from "../components/AnimatedContainer";
import { RefreshCw, Plus, ServerOff, X, Copy, Check, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
    const [devices, setDevices] = useState<any[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [errorToast, setErrorToast] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDeviceId, setNewDeviceId] = useState("");
    const [newDeviceName, setNewDeviceName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCredentials, setNewCredentials] = useState<{ device_id: string, api_key: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const loadDevices = useCallback(async () => {
        setIsRefreshing(true);
        setErrorToast(null);
        try {
            const data = await fetchDevices();
            setDevices(data);
        } catch (error: any) {
            console.error(error);
            setErrorToast("Failed to load devices. Please ensure backend is running.");
        } finally {
            setIsRefreshing(false);
            setInitialLoad(false);
        }
    }, []);

    useEffect(() => {
        loadDevices();
        // Removed auto-refresh via setInterval because WebSockets will handle updates now
    }, [loadDevices]);

    const handleWebSocketMessage = useCallback((message: any) => {
        setDevices((prevDevices) => {
            // When device is deleted
            if (message.event === "device_deleted" || message.type === "device_deleted") {
                return prevDevices.filter(d => (d.device_id || d.id) !== message.device_id);
            }

            // When telemetry or status is updated
            if (message.event === "telemetry_update" || message.type === "telemetry_update" ||
                message.event === "device_status_update" || message.type === "device_status_update") {

                const updatedPayload = message.device || message.payload;
                const targetId = message.device_id || (message.device && message.device.id);

                return prevDevices.map(device => {
                    const id = device.device_id || device.id;
                    if (id === targetId) {
                        return {
                            ...device,
                            ...updatedPayload,
                            is_online: updatedPayload.status === "online" || updatedPayload.is_online,
                            last_heartbeat: updatedPayload.lastSeen || updatedPayload.last_heartbeat || device.last_heartbeat
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

    useEffect(() => {
        if (errorToast) {
            const timer = setTimeout(() => setErrorToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [errorToast]);

    const handleAddDevice = async (e: FormEvent) => {
        e.preventDefault();
        if (!newDeviceId.trim()) return;
        setIsSubmitting(true);
        try {
            const registeredDevice = await registerDevice(newDeviceId, newDeviceName);
            setIsModalOpen(false);
            setNewCredentials({ device_id: registeredDevice.device_id, api_key: registeredDevice.api_key });
            setNewDeviceId("");
            setNewDeviceName("");
            loadDevices();
        } catch (error: any) {
            setErrorToast("Failed to register device: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLocalDelete = (deletedId: string) => {
        setDevices(prev => prev.filter(d => (d.device_id || d.id) !== deletedId));
    };

    return (
        <AnimatedContainer className="h-full flex flex-col relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
                    <p className="text-gray-400">Monitor and control your IoT devices in real-time.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={loadDevices}
                        disabled={isRefreshing}
                        className="p-2.5 bg-surface border border-border rounded-lg text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
                        title="Refresh Devices"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary_hover text-white px-4 py-2.5 rounded-lg font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Device
                    </motion.button>
                </div>
            </div>

            {!initialLoad && devices.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-border/70 rounded-2xl bg-surface/30"
                >
                    <div className="w-20 h-20 bg-surface/80 rounded-full flex items-center justify-center mb-6 shadow-inner border border-border">
                        <ServerOff className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-200 mb-2">No devices registered yet</h2>
                    <p className="text-gray-400 mb-8 max-w-sm">
                        Add your first device to start monitoring telemetry data and sending control commands.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary_hover text-white px-6 py-3 rounded-xl font-medium shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add your first device
                    </motion.button>
                </motion.div>
            ) : (
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
                    <AnimatePresence>
                        {devices.map((device) => (
                            <DeviceCard
                                key={device.device_id || device.id}
                                device={device}
                                onDeleteSuccess={handleLocalDelete}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Error Toast */}
            <AnimatePresence>
                {errorToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3"
                    >
                        <span>{errorToast}</span>
                        <button onClick={() => setErrorToast(null)} className="opacity-80 hover:opacity-100">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Device Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-surface border border-border p-6 rounded-xl w-full max-w-md shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl font-bold mb-6">Add New Device</h2>
                            <form onSubmit={handleAddDevice} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Device ID (Hardware ID)</label>
                                    <input
                                        type="text"
                                        required
                                        value={newDeviceId}
                                        onChange={(e) => setNewDeviceId(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                                        placeholder="e.g. esp32-livingroom"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Device Name / Type</label>
                                    <input
                                        type="text"
                                        value={newDeviceName}
                                        onChange={(e) => setNewDeviceName(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                                        placeholder="e.g. Living Room AC"
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 rounded-lg border border-border hover:bg-background transition-colors text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary_hover transition-colors text-white font-medium disabled:opacity-50"
                                    >
                                        {isSubmitting ? "Registering..." : "Register Device"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* API Key Modal */}
            <AnimatePresence>
                {newCredentials && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-surface border border-border p-6 rounded-xl w-full max-w-lg shadow-2xl relative"
                        >
                            <div className="flex items-center gap-3 mb-4 text-green-400">
                                <Check className="w-6 h-6" />
                                <h2 className="text-2xl font-bold text-white">Device Registered</h2>
                            </div>

                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                <div className="text-sm text-red-200">
                                    <p className="font-semibold mb-1">Save this API key now.</p>
                                    <p>It will not be shown again. You need this key to authenticate telemetry and heartbeat requests from your device.</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Device ID</label>
                                    <div className="bg-background border border-border rounded-lg px-4 py-3 text-white font-mono text-sm">
                                        {newCredentials.device_id}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">API Key</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-green-400 font-mono text-sm break-all">
                                            {newCredentials.api_key}
                                        </div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(newCredentials.api_key);
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }}
                                            className="px-4 py-2 bg-background border border-border hover:bg-gray-800 rounded-lg text-gray-300 transition-colors flex flex-col items-center justify-center gap-1 shrink-0"
                                            title="Copy API Key"
                                        >
                                            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setNewCredentials(null)}
                                className="w-full py-3 rounded-lg bg-primary hover:bg-primary_hover transition-colors text-white font-medium"
                            >
                                I have saved the API key
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AnimatedContainer>
    );
}
