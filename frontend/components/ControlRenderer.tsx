"use client";

import { useState } from "react";
import { sendControlCommand } from "../lib/api";

export default function ControlRenderer({ deviceId, controls }: { deviceId: string; controls: any[] }) {
    const [values, setValues] = useState<Record<string, any>>({});

    const handleCommand = async (command: string, value: string) => {
        try {
            await sendControlCommand(deviceId, command, value);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {controls.map((control) => (
                <div key={control.id} className="p-4 bg-surface border border-border rounded-lg flex flex-col justify-between">
                    <div className="font-semibold mb-2">{control.id}</div>

                    {control.type === "toggle" && (
                        <button
                            onClick={() => {
                                const newVal = values[control.id] === "on" ? "off" : "on";
                                setValues({ ...values, [control.id]: newVal });
                                handleCommand(control.id, newVal);
                            }}
                            className="mt-2 w-full py-2 bg-primary hover:bg-primary_hover transition-colors rounded font-medium"
                        >
                            Toggle ({values[control.id] || "off"})
                        </button>
                    )}

                    {control.type === "slider" && (
                        <input
                            type="range"
                            min="0"
                            max="100"
                            onChange={(e) => {
                                const newVal = e.target.value;
                                setValues({ ...values, [control.id]: newVal });
                            }}
                            onMouseUp={() => handleCommand(control.id, values[control.id])}
                            className="w-full mt-2 accent-primary"
                        />
                    )}

                    {control.type === "number" && (
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={values[control.id] || ""}
                                onChange={(e) => setValues({ ...values, [control.id]: e.target.value })}
                                className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            />
                            <button
                                onClick={() => handleCommand(control.id, values[control.id])}
                                className="px-4 py-2 bg-primary hover:bg-primary_hover transition-colors rounded font-medium"
                            >
                                Set
                            </button>
                        </div>
                    )}

                    {control.type === "button" && (
                        <button
                            onClick={() => handleCommand(control.id, "trigger")}
                            className="mt-2 w-full py-2 bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 transition-colors rounded font-medium"
                        >
                            Trigger
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
