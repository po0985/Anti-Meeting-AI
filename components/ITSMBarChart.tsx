"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  data: { name: string; count: number; pct: number }[];
  unit?: string;
  height?: number;
}

const COLORS = ["#a78bfa", "#f472b6", "#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a3e635", "#38bdf8"];

export function ITSMBarChart({ data, unit = "tickets", height = 220 }: Props) {
  if (data.length === 0) {
    return <div className="text-sm text-white/30 py-6 text-center">No data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
        <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} width={130} />
        <Tooltip
          formatter={(value, _name, item) => [`${value} ${unit} (${item.payload.pct}%)`, ""]}
          contentStyle={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white" }}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
