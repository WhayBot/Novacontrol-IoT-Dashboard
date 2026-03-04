import clsx from "clsx";

export default function StatusBadge({ isOnline }: { isOnline: boolean }) {
    return (
        <div className={clsx("px-2 py-1 rounded text-xs font-semibold", isOnline ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
            {isOnline ? "Online" : "Offline"}
        </div>
    );
}
