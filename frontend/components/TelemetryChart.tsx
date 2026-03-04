"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";

export default function TelemetryChart({ telemetryKey, data }: { telemetryKey: string; data: any[] }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-64 bg-surface/50 animate-pulse rounded-lg border border-border" />;

    return (
        <div className="h-64 w-full bg-surface border border-border rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-4 text-gray-400 capitalize">{telemetryKey}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3340" />
                    <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: "#1a1d24", border: "1px solid #2d3340", borderRadius: "8px" }}
                        itemStyle={{ color: "#3b82f6" }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
