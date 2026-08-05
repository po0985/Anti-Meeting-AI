export interface SpeakerStats {
  name: string;
  percentage: number;
  wordCount: number;
}

export interface Analysis {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  transcript: string;
  duration_minutes: number;
  attendee_count: number;
  avg_salary: number;

  // AI output
  summary: string;
  decisions: string[];
  action_items: string[];
  uselessness_score: number;
  async_score: number;
  wasted_time_minutes: number;
  salary_burn: number;
  speaking_balance: SpeakerStats[];
  emotional_tone: string;
  archetype: string;
  archetype_description: string;

  // Fun metrics
  buzzword_density: number;
  synergy_count: number;
  quick_question_count: number;
  decision_avoidance_level: number;

  // Replacement recommendation
  async_replacement: string;
  recommendations: string[];
}

export type MeetingArchetype =
  | "Corporate Theater"
  | "Status Update Hell"
  | "Manager Monologue"
  | "Panic Ritual"
  | "Actually Useful"
  | "Circular Debate"
  | "Ghost Meeting";

export interface ITSMReportRecord {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  report_language: "ru" | "en";
  company_context: string;
  ticket_count: number;
  warnings: string[];
  stats: import("@/lib/itsm-schema").ITSMStats;
  report: import("@/lib/itsm-schema").ITSMReport;
}

export interface DashboardStats {
  total_analyses: number;
  total_hours_wasted: number;
  total_salary_burn: number;
  async_opportunity_pct: number;
  avg_uselessness_score: number;
}
