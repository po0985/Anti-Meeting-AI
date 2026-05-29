import { z } from "zod";

export const SpeakerSchema = z.object({
  name: z.string(),
  percentage: z.number().min(0).max(100),
  wordCount: z.number().min(0),
});

export const AnalysisResultSchema = z.object({
  summary: z.string(),
  decisions: z.array(z.string()),
  action_items: z.array(z.string()),
  uselessness_score: z.number().min(0).max(100),
  async_score: z.number().min(0).max(100),
  wasted_time_minutes: z.number().min(0),
  salary_burn: z.number().min(0),
  speaking_balance: z.array(SpeakerSchema),
  emotional_tone: z.string(),
  archetype: z.enum([
    "Corporate Theater",
    "Status Update Hell",
    "Manager Monologue",
    "Panic Ritual",
    "Actually Useful",
    "Circular Debate",
    "Ghost Meeting",
  ]),
  archetype_description: z.string(),
  buzzword_density: z.number().min(0).max(100),
  synergy_count: z.number().min(0),
  quick_question_count: z.number().min(0),
  decision_avoidance_level: z.number().min(0).max(100),
  async_replacement: z.enum(["Email", "Slack", "Loom", "Jira ticket", "None — this meeting was necessary"]),
  recommendations: z.array(z.string()),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
