/** TODO: Add purpose docstring. */
"use client";

import { useState, useEffect, useRef } from "react";

interface CountdownFieldProps {
  value: string | null;
  onChange: (iso: string | null) => void;
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}

function computeRemaining(target: number | null): number {
  if (!target) return 0;
  return target - Date.now();
}

export function CountdownField({ value, onChange }: CountdownFieldProps) {
  const target = value ? new Date(value).getTime() : null;
  const [remaining, setRemaining] = useState(() => computeRemaining(target));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(computeRemaining(target));
    intervalRef.current = setInterval(() => setRemaining(computeRemaining(target)), 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [target]);

  const isExpired = target ? remaining <= 0 : false;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) { onChange(null); return; }
    const isoDate = new Date(val);
    if (!isNaN(isoDate.getTime())) {
      onChange(isoDate.toISOString());
    }
  };

  const localDatetime = value
    ? new Date(value).toISOString().slice(0, 16)
    : "";

  return (
    <div>
      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Countdown end</label>
      <div className="flex items-center gap-2">
        <input
          type="datetime-local"
          value={localDatetime}
          onChange={handleChange}
          className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[10px] text-red-500 hover:text-red-700"
          >
            Clear
          </button>
        )}
      </div>
      {target && !isExpired && (
        <p className="text-[9px] text-indigo-500 mt-1">
          Ends in {formatTimeRemaining(remaining)}
        </p>
      )}
      {isExpired && (
        <p className="text-[9px] text-red-500 mt-1">Countdown expired</p>
      )}
    </div>
  );
}
