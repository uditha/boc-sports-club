"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/marks";

const COLORS: Record<string, string> = {
  inter_province: "#A05AFF",
  nationalized: "#1BCFB4",
  coaching_camp: "#4BCBEB",
  local: "#9E58FF",
  international: "#FE9496",
};

interface Props {
  data: { type: string; count: number }[];
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-purple-100 rounded-xl px-3 py-2 shadow-lg shadow-purple-100/50 text-sm">
      <p className="font-semibold text-text-dark">{payload[0].name}</p>
      <p className="text-brand font-bold mt-0.5">{payload[0].value} events</p>
    </div>
  );
}

export default function EventTypeDonut({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center gap-2 text-text-grey">
        <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        <p className="text-sm">No events yet</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    name: EVENT_TYPE_LABELS[d.type as EventType] ?? d.type,
    value: d.count,
    type: d.type,
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex items-center gap-4 h-48">
      {/* Donut */}
      <div className="w-[150px] h-full shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={68}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={entry.type} fill={COLORS[entry.type] ?? "#A05AFF"} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xl font-bold text-text-dark">{total}</p>
          <p className="text-[10px] text-text-grey">events</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2.5 min-w-0">
        {chartData.map((entry) => (
          <div key={entry.type} className="flex items-center gap-2 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[entry.type] ?? "#A05AFF" }}
            />
            <span className="text-xs text-text-grey truncate flex-1">{entry.name}</span>
            <span className="text-xs font-bold text-text-dark shrink-0">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
