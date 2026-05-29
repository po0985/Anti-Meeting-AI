export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { formatCurrency, formatMinutes, getArchetypeColor, getScoreColor } from "@/lib/utils";
import type { Analysis } from "@/types";
import { ShareCard } from "@/components/ShareCard";
import { SpeakingChart } from "@/components/SpeakingChart";
import { CheckCircle2, XCircle, ArrowRight, Clock, DollarSign, AlertTriangle, Zap, MessageSquare, BarChart2 } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ResultsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) notFound();

  const analysis = data as Analysis;
  const gradient = getArchetypeColor(analysis.archetype);

  const archetypeEmoji: Record<string, string> = {
    "Actually Useful": "✅",
    "Corporate Theater": "🎭",
    "Manager Monologue": "🎤",
    "Status Update Hell": "📊",
    "Panic Ritual": "🔥",
    "Circular Debate": "🔄",
    "Ghost Meeting": "👻",
  };

  const replacementEmoji: Record<string, string> = {
    "Email": "📧",
    "Slack": "💬",
    "Loom": "🎥",
    "Jira ticket": "📋",
    "None — this meeting was necessary": "✅",
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-8 transition-colors">
        ← Back to Dashboard
      </Link>

      {/* Title + Archetype hero */}
      <div className={`glass rounded-3xl p-8 mb-6 bg-gradient-to-br ${gradient} bg-opacity-10 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-white to-transparent" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Meeting Analysis</div>
              <h1 className="text-2xl sm:text-3xl font-black">{analysis.title}</h1>
              <div className="text-sm text-white/40 mt-1">
                {analysis.duration_minutes} min · {analysis.attendee_count} attendees ·{" "}
                {new Date(analysis.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r ${gradient} text-white font-bold text-lg flex-shrink-0`}>
              <span>{archetypeEmoji[analysis.archetype]}</span>
              <span>{analysis.archetype}</span>
            </div>
          </div>
          <p className="text-white/70 leading-relaxed italic">&ldquo;{analysis.archetype_description}&rdquo;</p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label="Uselessness Score"
          value={`${analysis.uselessness_score}/100`}
          valueClass={getScoreColor(analysis.uselessness_score)}
          subtext={analysis.uselessness_score >= 70 ? "Yikes." : analysis.uselessness_score >= 40 ? "Could be worse." : "Not bad."}
        />
        <MetricCard
          icon={<Zap size={18} />}
          label="Async Score"
          value={`${analysis.async_score}/100`}
          valueClass={getScoreColor(analysis.async_score)}
          subtext="Could've been async"
        />
        <MetricCard
          icon={<Clock size={18} />}
          label="Wasted Time"
          value={formatMinutes(analysis.wasted_time_minutes)}
          valueClass="text-orange-400"
          subtext={`of ${analysis.duration_minutes}m total`}
        />
        <MetricCard
          icon={<DollarSign size={18} />}
          label="Salary Burned"
          value={formatCurrency(analysis.salary_burn)}
          valueClass="text-yellow-400"
          subtext="in combined salaries"
        />
      </div>

      {/* Summary */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-3">AI Summary</h2>
        <p className="text-white/80 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Two column: decisions + action items */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-4 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-400" /> Decisions Made
          </h2>
          {analysis.decisions.length === 0 ? (
            <div className="flex items-center gap-2 text-red-400">
              <XCircle size={16} />
              <span className="font-semibold">Zero decisions. Not one.</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {analysis.decisions.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/70">{d}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-4 flex items-center gap-2">
            <ArrowRight size={14} className="text-blue-400" /> Action Items
          </h2>
          {analysis.action_items.length === 0 ? (
            <div className="flex items-center gap-2 text-orange-400 text-sm">
              <AlertTriangle size={16} />
              <span>No concrete next steps identified.</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {analysis.action_items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ArrowRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/70">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Speaking balance */}
      {analysis.speaking_balance.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-4 flex items-center gap-2">
            <BarChart2 size={14} className="text-violet-400" /> Speaking Balance
          </h2>
          <SpeakingChart data={analysis.speaking_balance} />
        </div>
      )}

      {/* Fun metrics */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-4">🎲 Fun Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <FunMetric label="Buzzword Density" value={`${analysis.buzzword_density}/100`} emoji="💼" />
          <FunMetric label="Synergy Count" value={analysis.synergy_count.toString()} emoji="🤝" />
          <FunMetric label="'Quick Question'" value={`${analysis.quick_question_count}x`} emoji="🙋" />
          <FunMetric label="Decision Avoidance" value={`${analysis.decision_avoidance_level}/100`} emoji="🙈" />
        </div>
      </div>

      {/* Could have been */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-3 flex items-center gap-2">
          <MessageSquare size={14} className="text-cyan-400" /> This meeting should have been...
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{replacementEmoji[analysis.async_replacement]}</span>
          <div>
            <div className="text-2xl font-black">{analysis.async_replacement}</div>
            <div className="text-sm text-white/40 mt-0.5">Emotional tone: {analysis.emotional_tone}</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-4">💡 Recommendations</h2>
        <ul className="space-y-3">
          {analysis.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xs text-violet-400 font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <span className="text-white/70 leading-relaxed">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Share card */}
      <ShareCard analysis={analysis} />

      {/* CTA */}
      <div className="mt-8 flex gap-4">
        <Link href="/analyze" className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 px-5 py-3 rounded-xl font-semibold text-sm">
          <Zap size={16} /> Analyze Another Meeting
        </Link>
        <Link href="/history" className="flex items-center gap-2 glass px-5 py-3 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all">
          View History
        </Link>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, valueClass, subtext }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass: string;
  subtext: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-1.5 text-white/40 mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-black ${valueClass}`}>{value}</div>
      <div className="text-xs text-white/30 mt-1">{subtext}</div>
    </div>
  );
}

function FunMetric({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="font-black text-lg">{value}</div>
      <div className="text-xs text-white/40 mt-0.5">{label}</div>
    </div>
  );
}
