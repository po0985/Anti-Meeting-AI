export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { ITSMReportRecord } from "@/types";
import { ITSMBarChart } from "@/components/ITSMBarChart";
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Clock,
  LifeBuoy,
  Percent,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

const SEVERITY_COLOR: Record<string, string> = {
  high: "text-red-400 border-red-500/30 bg-red-500/10",
  medium: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  low: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
};

export default async function ITSMResultsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data, error } = await supabase
    .from("itsm_reports")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) notFound();

  const record = data as ITSMReportRecord;
  const { stats, report } = record;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Link href="/itsm-copilot" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-8 transition-colors">
        ← New Report
      </Link>

      {/* Hero */}
      <div className="glass rounded-3xl p-8 mb-6 bg-gradient-to-br from-violet-600/20 to-pink-600/10 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-widest mb-2">
            <LifeBuoy size={14} /> IT Support Executive Report
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-1">{record.title}</h1>
          <div className="text-sm text-white/40 mb-4">
            {record.ticket_count.toLocaleString()} tickets ·{" "}
            {stats.periodStart ? new Date(stats.periodStart).toLocaleDateString() : "—"} –{" "}
            {stats.periodEnd ? new Date(stats.periodEnd).toLocaleDateString() : "—"} ·{" "}
            {new Date(record.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
          <p className="text-white/80 leading-relaxed italic text-lg">&ldquo;{report.headline}&rdquo;</p>
          <p className="text-white/60 leading-relaxed mt-3">{report.narrative_summary}</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<BarChart2 size={18} />}
          label="Total Tickets"
          value={stats.totalTickets.toLocaleString()}
          valueClass="text-white"
          subtext={
            stats.volumeChangePct === null
              ? "vs previous period: n/a"
              : `${stats.volumeChangePct > 0 ? "+" : ""}${stats.volumeChangePct}% vs previous period`
          }
        />
        <MetricCard
          icon={<Percent size={18} />}
          label="SLA Compliance"
          value={stats.sla.overallCompliancePct !== null ? `${stats.sla.overallCompliancePct}%` : "n/a"}
          valueClass={
            stats.sla.overallCompliancePct !== null && stats.sla.overallCompliancePct < 85 ? "text-red-400" : "text-green-400"
          }
          subtext={`${stats.sla.breachCount} breach(es) of ${stats.sla.coverage} tracked`}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label="Avg Resolution"
          value={stats.resolution.avgHours !== null ? `${stats.resolution.avgHours}h` : "n/a"}
          valueClass="text-orange-400"
          subtext={stats.resolution.medianHours !== null ? `median ${stats.resolution.medianHours}h` : ""}
        />
        <MetricCard
          icon={<Users size={18} />}
          label="Burnout Risk"
          value={`${stats.burnoutRiskAgents.length}`}
          valueClass={stats.burnoutRiskAgents.length > 0 ? "text-red-400" : "text-green-400"}
          subtext="agents overloaded + high escalation/reopen"
        />
      </div>

      {/* Key findings */}
      <Section title="Executive Summary" icon={<CheckCircle2 size={14} className="text-green-400" />}>
        <ul className="space-y-2">
          {report.key_findings.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[10px] text-violet-400 font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-white/70">{f}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Distributions */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Tickets by Category" data={stats.byCategory} />
        <ChartCard title="Tickets by Team" data={stats.byTeam} />
        <ChartCard title="Tickets by Service" data={stats.byService} />
        <ChartCard title="Tickets by Region" data={stats.byRegion} />
      </div>

      {/* Anomalies */}
      {report.anomalies.length > 0 && (
        <Section title="Anomalies" icon={<AlertTriangle size={14} className="text-orange-400" />}>
          <div className="space-y-3">
            {report.anomalies.map((a, i) => (
              <div key={i} className={`rounded-xl border px-4 py-3 ${SEVERITY_COLOR[a.severity]}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{a.title}</span>
                  <span className="text-[10px] uppercase tracking-wide">{a.severity}</span>
                </div>
                <p className="text-sm text-white/70">{a.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* SLA table */}
      <Section title="SLA Analysis" icon={<Percent size={14} className="text-cyan-400" />}>
        <div className="grid md:grid-cols-2 gap-6">
          <TableCard
            title="Breaches by Team"
            rows={stats.sla.byTeam.map((t) => [t.team, `${t.breaches}/${t.total}`, `${t.compliancePct}%`])}
            headers={["Team", "Breaches", "Compliance"]}
          />
          <TableCard
            title="Breaches by Service"
            rows={stats.sla.byService.map((s) => [s.service, `${s.breaches}/${s.total}`, `${s.compliancePct}%`])}
            headers={["Service", "Breaches", "Compliance"]}
          />
        </div>
        {report.sla_recommendations.length > 0 && (
          <ul className="mt-4 space-y-2">
            {report.sla_recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <ArrowRight size={14} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/70">{r}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Team analysis */}
      <Section title="Team Analysis" icon={<Users size={14} className="text-blue-400" />}>
        <TableCard
          title=""
          headers={["Team", "Tickets", "Avg Resolution", "SLA", "Escalation", "Reopen", "Load Index"]}
          rows={stats.teams.map((t) => [
            t.name,
            t.ticketCount.toString(),
            t.avgResolutionHours !== null ? `${t.avgResolutionHours}h` : "n/a",
            t.slaCompliancePct !== null ? `${t.slaCompliancePct}%` : "n/a",
            `${t.escalationRatePct}%`,
            `${t.reopenRatePct}%`,
            t.loadIndex.toFixed(2),
          ])}
        />
        {report.team_insights.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {report.team_insights.map((t, i) => (
              <div key={i} className="glass rounded-xl p-4">
                <div className="font-semibold text-sm mb-1">{t.team}</div>
                <p className="text-sm text-white/70 mb-2">{t.assessment}</p>
                <p className="text-sm text-violet-300">→ {t.recommendation}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Employee / agent analysis */}
      <Section title="Employee Analysis" icon={<Users size={14} className="text-pink-400" />}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <AgentList label="Top Performers" names={stats.topPerformers} color="text-green-400" />
          <AgentList label="High Load" names={stats.highLoadAgents} color="text-orange-400" />
          <AgentList label="Burnout Risk" names={stats.burnoutRiskAgents} color="text-red-400" />
        </div>
        {report.employee_insights.length > 0 && (
          <ul className="space-y-2">
            {report.employee_insights.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <ArrowRight size={14} className="text-pink-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/70">{e}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Root causes */}
      {report.root_causes.length > 0 && (
        <Section title="Root Cause Analysis" icon={<AlertTriangle size={14} className="text-red-400" />}>
          <div className="space-y-3">
            {report.root_causes.map((rc, i) => (
              <div key={i} className="glass rounded-xl p-4">
                <div className="font-semibold text-sm mb-1">{rc.issue}</div>
                <p className="text-sm text-white/70 mb-1">
                  <span className="text-white/40">Root cause:</span> {rc.likely_root_cause}
                </p>
                <p className="text-sm text-white/50 mb-1">
                  <span className="text-white/40">Evidence:</span> {rc.evidence}
                </p>
                <p className="text-sm text-yellow-300">
                  <span className="text-white/40">Impact:</span> {rc.impact}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Automation */}
      <Section title="Automation Opportunities" icon={<Zap size={14} className="text-yellow-400" />}>
        <TableCard
          title=""
          headers={["Category", "Tickets", "% of Total", "Avg Resolution", "Est. Time Saved/yr", "Est. FTE Saved"]}
          rows={stats.automationCandidates.map((c) => [
            c.category,
            c.ticketCount.toString(),
            `${c.pctOfTotal}%`,
            c.avgResolutionHours !== null ? `${c.avgResolutionHours}h` : "n/a",
            `${c.estTimeSavedHoursPerYear.toLocaleString()}h`,
            c.estFteSaved.toString(),
          ])}
        />
        {report.automation_summary && <p className="text-sm text-white/70 mt-4 leading-relaxed">{report.automation_summary}</p>}
      </Section>

      {/* Incidents / Problems */}
      <Section title="Incident & Problem Analysis" icon={<AlertTriangle size={14} className="text-orange-400" />}>
        <p className="text-sm text-white/40 mb-3">
          {stats.incidents.total.toLocaleString()} incidents in this export.
        </p>
        {stats.incidents.recurringCategories.length > 0 && (
          <TableCard
            title="Recurring Incident Categories (≥3 occurrences)"
            headers={["Category", "Count"]}
            rows={stats.incidents.recurringCategories.map((c) => [c.category, c.count.toString()])}
          />
        )}
        <p className="text-sm text-white/70 mt-4 mb-3 leading-relaxed">{report.incident_problem_analysis.summary}</p>
        <div className="grid md:grid-cols-2 gap-6">
          <ListCard title="Corrective Actions" items={report.incident_problem_analysis.corrective_actions} color="text-orange-400" />
          <ListCard title="Preventive Actions" items={report.incident_problem_analysis.preventive_actions} color="text-green-400" />
        </div>
      </Section>

      {/* Forecast */}
      <Section title="Forecast" icon={<TrendingUp size={14} className="text-cyan-400" />}>
        <p className="text-sm text-white/70 mb-2 leading-relaxed">{report.forecast.narrative}</p>
        <div className="grid md:grid-cols-2 gap-4 mt-3">
          <div className="glass rounded-xl p-4">
            <div className="text-xs text-white/40 uppercase tracking-wide mb-1">Next Period Volume</div>
            <div className="text-sm text-white/80">{report.forecast.next_period_volume_estimate}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-xs text-white/40 uppercase tracking-wide mb-1">Staffing Recommendation</div>
            <div className="text-sm text-white/80">{report.forecast.staffing_recommendation}</div>
          </div>
        </div>
      </Section>

      {/* Executive Dashboard */}
      <div className="glass rounded-2xl p-6 mb-6 bg-gradient-to-br from-violet-600/10 to-transparent">
        <h2 className="font-bold text-lg mb-4">📊 Executive Dashboard</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <ListCard title="Risks" items={report.risks} color="text-red-400" />
          <ListCard title="Opportunities" items={report.opportunities} color="text-green-400" />
          <ListCard title="Recommended Actions" items={report.recommended_actions} color="text-violet-300" />
          <ListCard title="Expected Effect" items={report.expected_effect} color="text-yellow-300" />
        </div>
      </div>

      {/* Audience notes */}
      <Section title="Audience Takeaways" icon={<Users size={14} className="text-white/60" />}>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4">
            <div className="text-xs text-violet-400 uppercase tracking-wide mb-2 font-semibold">Support Manager</div>
            <p className="text-sm text-white/70">{report.audience_notes.support_manager}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-xs text-blue-400 uppercase tracking-wide mb-2 font-semibold">IT Director</div>
            <p className="text-sm text-white/70">{report.audience_notes.it_director}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-xs text-yellow-400 uppercase tracking-wide mb-2 font-semibold">Business</div>
            <p className="text-sm text-white/70">{report.audience_notes.business}</p>
          </div>
        </div>
      </Section>

      {/* Missing data */}
      {(report.missing_data_notes.length > 0 || record.warnings.length > 0) && (
        <Section title="Data Gaps" icon={<AlertTriangle size={14} className="text-white/40" />}>
          <ul className="space-y-1.5">
            {record.warnings.map((w, i) => (
              <li key={`w-${i}`} className="text-sm text-white/40">• {w}</li>
            ))}
            {report.missing_data_notes.map((m, i) => (
              <li key={`m-${i}`} className="text-sm text-white/40">• {m}</li>
            ))}
          </ul>
        </Section>
      )}

      <div className="mt-8">
        <Link href="/itsm-copilot" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 px-5 py-3 rounded-xl font-semibold text-sm">
          <LifeBuoy size={16} /> New Report
        </Link>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-6 mb-6">
      <h2 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-4 flex items-center gap-2">
        {icon} {title}
      </h2>
      {children}
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

function ChartCard({ title, data }: { title: string; data: { name: string; count: number; pct: number }[] }) {
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-3">{title}</h3>
      <ITSMBarChart data={data} />
    </div>
  );
}

function TableCard({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <div>
      {title && <h3 className="font-semibold text-sm text-white/60 mb-2">{title}</h3>}
      {rows.length === 0 ? (
        <div className="text-sm text-white/30">No data</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 text-xs uppercase tracking-wide">
                {headers.map((h) => (
                  <th key={h} className="pb-2 pr-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-white/5">
                  {row.map((cell, j) => (
                    <td key={j} className="py-2 pr-4 text-white/70">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ListCard({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div>
      <h3 className="font-semibold text-sm text-white/60 mb-2">{title}</h3>
      {items.length === 0 ? (
        <div className="text-sm text-white/30">None identified</div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className={`flex items-start gap-2 text-sm ${color}`}>
              <span className="mt-1.5 w-1 h-1 rounded-full bg-current flex-shrink-0" />
              <span className="text-white/70">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AgentList({ label, names, color }: { label: string; names: string[]; color: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className={`text-xs uppercase tracking-wide font-semibold mb-2 ${color}`}>{label}</div>
      {names.length === 0 ? (
        <div className="text-sm text-white/30">None</div>
      ) : (
        <ul className="space-y-1">
          {names.map((n) => (
            <li key={n} className="text-sm text-white/70">{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
