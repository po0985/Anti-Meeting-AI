export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency, formatMinutes, getArchetypeColor } from "@/lib/utils";
import type { Analysis } from "@/types";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const analyses = (data ?? []) as Analysis[];

  const totalBurn = analyses.reduce((s, a) => s + a.salary_burn, 0);
  const totalWasted = analyses.reduce((s, a) => s + a.wasted_time_minutes, 0);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">Analysis History</h1>
          <p className="text-white/40">
            {analyses.length} meetings analyzed · {formatCurrency(totalBurn)} total burned · {formatMinutes(totalWasted)} wasted
          </p>
        </div>
        <Link href="/analyze" className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 px-5 py-3 rounded-xl font-semibold text-sm">
          <Zap size={16} /> New Analysis
        </Link>
      </div>

      {analyses.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-bold mb-2">No analyses yet</h2>
          <p className="text-white/40 mb-6">Analyze your first meeting to see it here.</p>
          <Link href="/analyze" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 px-5 py-3 rounded-xl font-semibold text-sm">
            Start Analyzing <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((analysis) => (
            <HistoryRow key={analysis.id} analysis={analysis} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryRow({ analysis }: { analysis: Analysis }) {
  const gradient = getArchetypeColor(analysis.archetype);
  const emojis: Record<string, string> = {
    "Actually Useful": "✅",
    "Corporate Theater": "🎭",
    "Manager Monologue": "🎤",
    "Status Update Hell": "📊",
    "Panic Ritual": "🔥",
    "Circular Debate": "🔄",
    "Ghost Meeting": "👻",
  };
  const date = new Date(analysis.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  });

  return (
    <Link href={`/results/${analysis.id}`} className="glass rounded-2xl p-5 flex items-center gap-5 hover:bg-white/8 transition-all block">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl flex-shrink-0`}>
        {emojis[analysis.archetype] ?? "💬"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-lg truncate">{analysis.title}</div>
        <div className="flex items-center gap-3 text-sm text-white/40 mt-0.5">
          <span>{analysis.archetype}</span>
          <span>·</span>
          <span>{analysis.duration_minutes}m</span>
          <span>·</span>
          <span>{analysis.attendee_count} people</span>
          <span>·</span>
          <span>{date}</span>
        </div>
      </div>

      <div className="flex items-center gap-6 flex-shrink-0">
        <div className="text-center hidden sm:block">
          <div className="font-black text-red-400 text-lg">{analysis.uselessness_score}</div>
          <div className="text-xs text-white/30">useless</div>
        </div>
        <div className="text-center hidden md:block">
          <div className="font-black text-orange-400">{formatMinutes(analysis.wasted_time_minutes)}</div>
          <div className="text-xs text-white/30">wasted</div>
        </div>
        <div className="text-center">
          <div className="font-black text-yellow-400">{formatCurrency(analysis.salary_burn)}</div>
          <div className="text-xs text-white/30">burned</div>
        </div>
        <ArrowRight size={16} className="text-white/20" />
      </div>
    </Link>
  );
}
