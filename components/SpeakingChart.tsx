"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { SpeakerStats } from "@/types";

interface Props {
  data: SpeakerStats[];
}

const COLORS = ["#a78bfa", "#f472b6", "#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a3e635"];

export function SpeakingChart({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.percentage - a.percentage);
  const dominant = sorted[0];

  return (
    <div>
      {dominant && dominant.percentage > 60 && (
        <div className="mb-4 text-sm text-orange-400 glass rounded-xl px-4 py-2.5">
          ⚠️ <strong>{dominant.name}</strong> spoke {dominant.percentage}% of the time. That&apos;s a monologue, not a meeting.
        </div>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 0, right: 20 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} width={90} />
          <Tooltip
            formatter={(value) => [`${value}%`, "Speaking time"]}
            contentStyle={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white" }}
          />
          <Bar dataKey="percentage" radius={[0, 6, 6, 0]}>
            {sorted.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
