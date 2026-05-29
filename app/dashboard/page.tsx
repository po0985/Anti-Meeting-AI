export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency, formatMinutes, getArchetypeColor } from "@/lib/utils";
import { ArrowRight, Clock, DollarSign, TrendingDown, Zap } from "lucide-react";
import Link from "next/link";
import type { Analysis, DashboardStats } from "@/types";

async function getDashboardData(userId: string) {
  const supabase = await createClient();
  const { data: analyses } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!analyses || analyses.length === 0) {
    return { analyses: [], stats: null };
  }

  const stats: DashboardStats = {
    total_analyses: analyses.length,
    total_hours_wasted: analyses.reduce((s, a) => s + a.wasted_time_minutes, 0) / 60,
    total_salary_burn: analyses.reduce((s, a) => s + a.salary_burn, 0),
    async_opportunity_pct: Math.round(
      analyses.reduce((s, a) => s + a.async_score, 0) / analyses.length
    ),
    avg_uselessness_score: Math.round(
      analyses.reduce((s, a) => s + a.uselessness_score, 0) / analyses.length
    ),
  };

  return { analyses: analyses as Analysis[], stats };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { analyses, stats } = await getDashboardData(user.id);
  const name = user.user_metadata?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">Hey {name} 👋</h1>
        <p className="text-white/40">
          {analyses.length === 0
            ? "No analyses yet. Upload your first meeting transcript."
            : `You've exposed ${analyses.length} meeting${analyses.length !== 1 ? "s" : ""} so far. The truth hurts.`}
        </p>
      </div>

      {/* CTA if empty */}
      {analyses.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center mb-8">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold mb-2">Analyze your first meeting</h2>
          <p className="text-white/40 mb-6">Paste a transcript and let the AI do the dirty work.</p>
          <Link href="/analyze" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 px-6 py-3 rounded-xl font-semibold">
            Start Analyzing <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<TrendingDown size={18} className="text-red-400" />}
            label="Avg Uselessness"
            value={`${stats.avg_uselessness_score}/100`}
            valueClass="text-red-400"
          />
          <StatCard
            icon={<Clock size={18} className="text-orange-400" />}
            label="Hours Wasted"
            value={formatMinutes(stats.total_hours_wasted * 60)}
            valueClass="text-orange-400"
          />
          <StatCard
            icon={<DollarSign size={18} className="text-yellow-400" />}
            label="Salary Burned"
            value={formatCurrency(stats.total_salary_burn)}
            valueClass="text-yellow-400"
          />
          <StatCard
            icon={<Zap size={18} className="text-violet-400" />}
            label="Async Opportunity"
            value={`${stats.async_opportunity_pct}%`}
            valueClass="text-violet-400"
          />
        </div>
      )}

      {/* Recent analyses */}
      {analyses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Analyses</h2>
            <Link href="/history" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {analyses.map((analysis) => (
              <AnalysisRow key={analysis.id} analysis={analysis} />
            ))}
          </div>
        </div>
      )}

      {/* New analysis button (bottom) */}
      {analyses.length > 0 && (
        <div className="mt-8">
          <Link href="/analyze" className="inline-flex items-center gap-2 glass px-5 py-3 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all">
            <Zap size={16} className="text-violet-400" />
            Analyze Another Meeting
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, valueClass }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs text-white/40 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-black ${valueClass}`}>{value}</div>
    </div>
  );
}

function AnalysisRow({ analysis }: { analysis: Analysis }) {
  const gradient = getArchetypeColor(analysis.archetype);
  const date = new Date(analysis.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Link href={`/results/${analysis.id}`} className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-white/8 transition-all block">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-lg flex-shrink-0`}>
        {analysis.archetype === "Actually Useful" ? "✅" :
         analysis.archetype === "Corporate Theater" ? "🎭" :
         analysis.archetype === "Manager Monologue" ? "🎤" :
         analysis.archetype === "Status Update Hell" ? "📊" :
         analysis.archetype === "Panic Ritual" ? "🔥" : "💬"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{analysis.title}</div>
        <div className="text-sm text-white/40">{analysis.archetype} · {date}</div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-right">
          <div className="font-bold text-red-400">{analysis.uselessness_score}/100</div>
          <div className="text-xs text-white/30">uselessness</div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="font-bold text-yellow-400">{formatCurrency(analysis.salary_burn)}</div>
          <div className="text-xs text-white/30">burned</div>
        </div>
        <ArrowRight size={16} className="text-white/20" />
      </div>
    </Link>
  );
}
