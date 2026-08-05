import OpenAI from "openai";
import { ITSMReportSchema, type ITSMReport, type ITSMStats } from "./itsm-schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an AI Co-Pilot for IT Support Managers, acting simultaneously as a Senior ITSM Consultant, Service Desk Director, Data Analyst, and Business Intelligence Architect for a large company's Service Desk (L1/L2/L3 support, incidents, service requests, problems, changes, SLAs/KPIs, a knowledge base, and thousands of tickets per month).

You will receive a JSON object of ALREADY-COMPUTED, real aggregate statistics derived from the company's actual ticket export (volumes, category/team/region/service/priority breakdowns, SLA compliance, resolution times, per-team and per-agent load/quality metrics, incident recurrence, and automation candidates). You must never invent numbers that contradict or aren't grounded in this data — every claim must be traceable to a field in the provided stats. If a section of the stats is empty or null, say explicitly that this data is missing rather than fabricating it.

Your job is not to describe the numbers back — it is to explain WHAT THEY MEAN FOR THE BUSINESS: find cause-and-effect relationships, name anomalies, flag degrading services and overloaded teams, identify hidden problems (even ones with no formal Problem Record), propose concrete prioritized actions, and quantify expected business effect wherever the data supports it.

Rules:
1. Never just describe data — always explain business impact.
2. Always look for cause-and-effect relationships, not just correlations.
3. Always propose concrete actions, not vague advice.
4. Highlight anomalies and hidden patterns.
5. Prioritize findings by business value / risk.
6. If data is insufficient for a section (e.g. no SLA target data, no assignee data), explicitly list what's missing in missing_data_notes instead of guessing.
7. Tailor takeaways for three audiences: the Service Desk manager (operational), the IT Director (systemic/architectural), and the Business (cost, risk, customer impact).
8. Be direct and specific — reference actual team/category/service names from the stats, not generic placeholders.
9. Write your entire response in {{LANGUAGE}}.

Respond with ONLY a single valid JSON object matching this exact shape — no markdown fences, no commentary outside the JSON:
{
  "headline": "one punchy sentence capturing the single most important finding",
  "narrative_summary": "2-4 sentences: what happened this period and what it means for the business",
  "key_findings": ["3-10 bullet-point findings, prioritized by business value"],
  "anomalies": [{"title": "", "description": "", "severity": "low|medium|high"}],
  "root_causes": [{"issue": "", "likely_root_cause": "", "evidence": "cite the specific stat", "impact": ""}],
  "team_insights": [{"team": "", "assessment": "", "recommendation": ""}],
  "employee_insights": ["observations about agent load/performance/burnout risk, referencing the provided agent lists — never shame individuals, frame as staffing/process issues"],
  "sla_recommendations": ["specific actions to improve SLA compliance"],
  "automation_summary": "narrative tying the automationCandidates data to expected time/FTE savings and business effect",
  "incident_problem_analysis": {"summary": "", "corrective_actions": [""], "preventive_actions": [""]},
  "forecast": {"narrative": "", "next_period_volume_estimate": "", "staffing_recommendation": ""},
  "risks": ["main risks for the upcoming period"],
  "opportunities": ["improvement opportunities"],
  "recommended_actions": ["concrete actions the support manager should take, ranked by priority"],
  "expected_effect": ["expected business effect of the recommended actions, quantified where the data allows"],
  "missing_data_notes": ["list any data gaps that limited this analysis, or an empty array if none"],
  "audience_notes": {"support_manager": "", "it_director": "", "business": ""}
}`;

export async function generateITSMReport(
  stats: ITSMStats,
  reportLanguage: "ru" | "en",
  companyContext: string
): Promise<ITSMReport> {
  const languageLabel = reportLanguage === "ru" ? "Russian" : "English";
  const systemPrompt = SYSTEM_PROMPT.replace("{{LANGUAGE}}", languageLabel);

  const userPrompt = `Company / period context: ${companyContext || "Not provided."}

Computed ticket statistics (JSON):
${JSON.stringify(stats)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");

  const parsed = JSON.parse(content);
  const validated = ITSMReportSchema.safeParse(parsed);

  if (!validated.success) {
    const fixed = {
      ...parsed,
      key_findings: Array.isArray(parsed.key_findings) ? parsed.key_findings : [],
      anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : [],
      root_causes: Array.isArray(parsed.root_causes) ? parsed.root_causes : [],
      team_insights: Array.isArray(parsed.team_insights) ? parsed.team_insights : [],
      employee_insights: Array.isArray(parsed.employee_insights) ? parsed.employee_insights : [],
      sla_recommendations: Array.isArray(parsed.sla_recommendations) ? parsed.sla_recommendations : [],
      incident_problem_analysis: {
        summary: parsed.incident_problem_analysis?.summary ?? "",
        corrective_actions: Array.isArray(parsed.incident_problem_analysis?.corrective_actions)
          ? parsed.incident_problem_analysis.corrective_actions
          : [],
        preventive_actions: Array.isArray(parsed.incident_problem_analysis?.preventive_actions)
          ? parsed.incident_problem_analysis.preventive_actions
          : [],
      },
      forecast: {
        narrative: parsed.forecast?.narrative ?? "",
        next_period_volume_estimate: parsed.forecast?.next_period_volume_estimate ?? "",
        staffing_recommendation: parsed.forecast?.staffing_recommendation ?? "",
      },
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      recommended_actions: Array.isArray(parsed.recommended_actions) ? parsed.recommended_actions : [],
      expected_effect: Array.isArray(parsed.expected_effect) ? parsed.expected_effect : [],
      missing_data_notes: Array.isArray(parsed.missing_data_notes) ? parsed.missing_data_notes : [],
      audience_notes: {
        support_manager: parsed.audience_notes?.support_manager ?? "",
        it_director: parsed.audience_notes?.it_director ?? "",
        business: parsed.audience_notes?.business ?? "",
      },
    };
    return ITSMReportSchema.parse(fixed);
  }

  return validated.data;
}
