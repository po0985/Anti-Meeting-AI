import { z } from "zod";

export const TicketRowSchema = z.object({
  id: z.string(),
  created_at: z.date(),
  resolved_at: z.date().optional(),
  type: z.string(),
  category: z.string(),
  team: z.string(),
  service: z.string(),
  region: z.string(),
  priority: z.string(),
  assignee: z.string(),
  status: z.string(),
  sla_target_hours: z.number().optional(),
  sla_met: z.boolean().optional(),
  reopened: z.boolean(),
  escalated: z.boolean(),
});

export type TicketRow = z.infer<typeof TicketRowSchema>;

const CountBucketSchema = z.object({
  name: z.string(),
  count: z.number(),
  pct: z.number(),
});

const TeamStatSchema = z.object({
  name: z.string(),
  ticketCount: z.number(),
  avgResolutionHours: z.number().nullable(),
  slaCompliancePct: z.number().nullable(),
  escalationRatePct: z.number(),
  reopenRatePct: z.number(),
  loadIndex: z.number(),
});

const AgentStatSchema = z.object({
  name: z.string(),
  ticketCount: z.number(),
  avgResolutionHours: z.number().nullable(),
  escalationRatePct: z.number(),
  reopenRatePct: z.number(),
  loadIndex: z.number(),
});

export const ITSMStatsSchema = z.object({
  totalTickets: z.number(),
  periodStart: z.string().nullable(),
  periodEnd: z.string().nullable(),
  previousPeriodCount: z.number(),
  currentPeriodCount: z.number(),
  volumeChangePct: z.number().nullable(),
  byCategory: z.array(CountBucketSchema),
  byTeam: z.array(CountBucketSchema),
  byRegion: z.array(CountBucketSchema),
  byService: z.array(CountBucketSchema),
  byPriority: z.array(CountBucketSchema),
  byType: z.array(CountBucketSchema),
  weeklyVolume: z.array(z.object({ week: z.string(), count: z.number() })),
  sla: z.object({
    coverage: z.number(),
    overallCompliancePct: z.number().nullable(),
    breachCount: z.number(),
    byTeam: z.array(
      z.object({ team: z.string(), total: z.number(), breaches: z.number(), compliancePct: z.number() })
    ),
    byService: z.array(
      z.object({ service: z.string(), total: z.number(), breaches: z.number(), compliancePct: z.number() })
    ),
  }),
  resolution: z.object({
    avgHours: z.number().nullable(),
    medianHours: z.number().nullable(),
    byTeam: z.array(z.object({ team: z.string(), avgHours: z.number(), count: z.number() })),
  }),
  teams: z.array(TeamStatSchema),
  agents: z.array(AgentStatSchema),
  topPerformers: z.array(z.string()),
  highLoadAgents: z.array(z.string()),
  lowPerformanceAgents: z.array(z.string()),
  burnoutRiskAgents: z.array(z.string()),
  incidents: z.object({
    total: z.number(),
    recurringCategories: z.array(z.object({ category: z.string(), count: z.number() })),
    topServices: z.array(z.object({ service: z.string(), count: z.number() })),
  }),
  automationCandidates: z.array(
    z.object({
      category: z.string(),
      ticketCount: z.number(),
      pctOfTotal: z.number(),
      avgResolutionHours: z.number().nullable(),
      estTimeSavedHoursPerYear: z.number(),
      estFteSaved: z.number(),
    })
  ),
  dataQuality: z.object({
    missingSlaData: z.number(),
    missingResolvedDate: z.number(),
    missingTeam: z.number(),
    missingAssignee: z.number(),
  }),
});

export type ITSMStats = z.infer<typeof ITSMStatsSchema>;

export const ITSMReportSchema = z.object({
  headline: z.string(),
  narrative_summary: z.string(),
  key_findings: z.array(z.string()).min(1).max(10),
  anomalies: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    })
  ),
  root_causes: z.array(
    z.object({
      issue: z.string(),
      likely_root_cause: z.string(),
      evidence: z.string(),
      impact: z.string(),
    })
  ),
  team_insights: z.array(
    z.object({
      team: z.string(),
      assessment: z.string(),
      recommendation: z.string(),
    })
  ),
  employee_insights: z.array(z.string()),
  sla_recommendations: z.array(z.string()),
  automation_summary: z.string(),
  incident_problem_analysis: z.object({
    summary: z.string(),
    corrective_actions: z.array(z.string()),
    preventive_actions: z.array(z.string()),
  }),
  forecast: z.object({
    narrative: z.string(),
    next_period_volume_estimate: z.string(),
    staffing_recommendation: z.string(),
  }),
  risks: z.array(z.string()),
  opportunities: z.array(z.string()),
  recommended_actions: z.array(z.string()),
  expected_effect: z.array(z.string()),
  missing_data_notes: z.array(z.string()),
  audience_notes: z.object({
    support_manager: z.string(),
    it_director: z.string(),
    business: z.string(),
  }),
});

export type ITSMReport = z.infer<typeof ITSMReportSchema>;
