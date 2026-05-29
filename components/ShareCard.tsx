"use client";

import { useState } from "react";
import { Copy, Check, Share2, Printer } from "lucide-react";
import { formatCurrency, formatMinutes, getArchetypeColor } from "@/lib/utils";
import type { Analysis } from "@/types";

interface Props {
  analysis: Analysis;
}

export function ShareCard({ analysis }: Props) {
  const [copied, setCopied] = useState(false);
  const gradient = getArchetypeColor(analysis.archetype);

  const shareText = `🎭 Meeting exposed by Anti-Meeting AI:

"${analysis.title}"
↳ Archetype: ${analysis.archetype}
↳ Uselessness score: ${analysis.uselessness_score}/100
↳ Salary burned: ${formatCurrency(analysis.salary_burn)}
↳ Wasted: ${formatMinutes(analysis.wasted_time_minutes)}
↳ Decisions made: ${analysis.decisions.length === 0 ? "ZERO" : analysis.decisions.length}
↳ Should have been: ${analysis.async_replacement}

Analyze your own meetings 👉 anti-meeting.ai`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Share2 size={16} className="text-violet-400" />
        <h2 className="font-bold text-sm uppercase tracking-wider text-white/40">Share This Result</h2>
      </div>

      {/* Shareable card preview */}
      <div id="share-card" className={`rounded-2xl p-6 bg-gradient-to-br ${gradient} bg-opacity-20 border border-white/10 mb-4 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[#080a0f]/70" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <span className="text-xs">⚡</span>
            </div>
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Anti-Meeting AI</span>
          </div>

          <div className="text-white/60 text-sm mb-1 font-medium">{analysis.title}</div>
          <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${gradient} text-white text-sm font-bold mb-4`}>
            {analysis.archetype}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-red-400">{analysis.uselessness_score}</div>
              <div className="text-xs text-white/40 mt-0.5">uselessness</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-yellow-400">{formatCurrency(analysis.salary_burn)}</div>
              <div className="text-xs text-white/40 mt-0.5">burned</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-orange-400">{analysis.decisions.length === 0 ? "ZERO" : analysis.decisions.length}</div>
              <div className="text-xs text-white/40 mt-0.5">decisions</div>
            </div>
          </div>

          <div className="mt-4 text-xs text-white/30 italic">
            &ldquo;Should have been: {analysis.async_replacement}&rdquo;
          </div>
        </div>
      </div>

      {/* Share actions */}
      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 glass px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-all"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy Share Text"}
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 glass px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-all"
        >
          <Printer size={14} />
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}
