import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Battery, Clock, ChevronRight, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { timeAgo } from "../lib/utils";
import { useState } from "react";
import { deleteDevice } from "../lib/api";

export default function DeviceCard({ device, onDeleteSuccess }: { device: any, onDeleteSuccess?: (id: string) => void }) {
    const isOnline = device.status === "online" || device.is_online;
    const deviceName = device.name || device.device_id || device.device_type;
    const voltage = device.voltage !== undefined ? `${Number(device.voltage).toFixed(1)}V` : "N/A";
    const lastSeen = device.lastSeen || device.last_heartbeat;

    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDeleting(true);
        try {
            await deleteDevice(device.device_id || device.id);
            if (onDeleteSuccess) {
                onDeleteSuccess(device.device_id || device.id);
            }
        } catch (error) {
            console.error("Failed to delete device", error);
            setIsDeleting(false);
            setShowConfirm(false);
            alert("Failed to delete the device. Please try again.");
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            whileHover={!showConfirm ? { scale: 1.02, translateY: -4 } : {}}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex flex-col h-full bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors duration-300 shadow-sm hover:shadow-primary/10 relative"
        >
            {/* Delete Confirmation Overlay */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 bg-surface/95 backdrop-blur-sm p-5 flex flex-col items-center justify-center text-center border border-red-500/50 rounded-xl"
                    >
                        <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
                        <p className="text-gray-200 font-medium mb-4">Delete this device permanently?</p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={(e) => { e.preventDefault(); setShowConfirm(false); }}
                                disabled={isDeleting}
                                className="flex-1 py-2 rounded-lg bg-background border border-border text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 py-2 rounded-lg bg-red-600/90 hover:bg-red-500 text-white transition-colors flex justify-center items-center disabled:opacity-50 text-sm font-semibold shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 max-w-[70%]">
                        <div className="relative flex items-center justify-center">
                            {isOnline ? (
                                <>
                                    <span className="absolute w-3 h-3 bg-green-500 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-75"></span>
                                    <span className="relative w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                </>
                            ) : (
                                <span className="relative w-3 h-3 bg-red-500/80 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.4)]"></span>
                            )}
                        </div>
                        <h3 className="text-lg font-bold truncate pr-2 tracking-tight text-gray-100" title={deviceName}>{deviceName}</h3>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className={clsx(
                            "text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm border",
                            isOnline ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                        )}>
                            {isOnline ? "Online" : "Offline"}
                        </div>
                        <button
                            onClick={(e) => { e.preventDefault(); setShowConfirm(true); }}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                            title="Delete Device"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                    <div className="flex items-center gap-2 text-gray-400">
                        <div className="flex items-center justify-center p-1.5 bg-background/50 border border-border/50 rounded-md">
                            <Battery className={clsx("w-4 h-4", isOnline ? "text-green-400" : "text-gray-500")} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Voltage</span>
                            <span className="text-sm font-semibold text-gray-200">{voltage}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <div className="flex items-center justify-center p-1.5 bg-background/50 border border-border/50 rounded-md">
                            <Clock className={clsx("w-4 h-4", isOnline ? "text-blue-400" : "text-gray-500")} />
                        </div>
                        <div className="flex flex-col w-full overflow-hidden">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Last Seen</span>
                            <span className="text-sm font-semibold text-gray-200 truncate" title={lastSeen}>{timeAgo(lastSeen)}</span>
                        </div>
                    </div>
                </div>

                <Link
                    href={`/devices/${device.device_id || device.id}`}
                    className="flex mt-auto items-center justify-center w-full py-2.5 bg-background hover:bg-primary/10 text-gray-300 hover:text-primary rounded-lg text-sm font-semibold transition-colors duration-200 border border-border hover:border-primary/30 group"
                >
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
            </div>
        </motion.div>
    );
}
