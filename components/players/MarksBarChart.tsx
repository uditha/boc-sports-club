"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  data: { year: number; marks: number }[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-purple-100 rounded-xl px-3 py-2 shadow-lg shadow-purple-100/50 text-sm">
      <p className="font-semibold text-text-dark">{label}</p>
      <p className="text-brand font-bold mt-0.5">{payload[0].value} marks</p>
    </div>
  );
}

export default function MarksBarChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center gap-2 text-text-grey">
        <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">No data yet</p>
      </div>
    );
  }

  const maxMarks = Math.max(...data.map((d) => d.marks));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="35%">
        <CartesianGrid strokeDasharray="3 3" stroke="#F0EBFF" vertical={false} />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 12, fill: "#9B9BAA", fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#9B9BAA" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F5F0FF", radius: 8 }} />
        <Bar dataKey="marks" radius={[6, 6, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.year}
              fill={entry.marks === maxMarks ? "#A05AFF" : "#D4BBFF"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
