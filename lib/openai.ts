import OpenAI from "openai";
import { AnalysisResultSchema, type AnalysisResult } from "./analysis-schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeMeeting(
  transcript: string,
  durationMinutes: number,
  attendeeCount: number,
  avgSalary: number
): Promise<AnalysisResult> {
  const hourlyRate = avgSalary / 2080;
  const totalBurnRate = hourlyRate * attendeeCount * (durationMinutes / 60);

  const prompt = `You are a ruthlessly honest meeting analyst with a sharp, slightly sarcastic tone. Analyze this meeting transcript and return ONLY valid JSON — no markdown, no explanation.

Meeting context:
- Duration: ${durationMinutes} minutes
- Attendees: ${attendeeCount}
- Average salary: $${avgSalary}/year
- Total possible salary burn: $${totalBurnRate.toFixed(0)}

Transcript:
${transcript.slice(0, 12000)}

Return a JSON object with exactly these fields:
{
  "summary": "2-3 sentence brutal honest summary",
  "decisions": ["actual decisions made, or empty array if none"],
  "action_items": ["concrete next steps with owners if mentioned"],
  "uselessness_score": 0-100 (100 = complete waste of time),
  "async_score": 0-100 (100 = could have been an email),
  "wasted_time_minutes": estimated minutes truly wasted,
  "salary_burn": actual dollar amount burned based on context (use $${totalBurnRate.toFixed(0)} as ceiling),
  "speaking_balance": [{"name": "Speaker Name", "percentage": 0-100, "wordCount": 0}],
  "emotional_tone": "Anxious/Performative/Disengaged/Collaborative/Tense/etc",
  "archetype": one of exactly: "Corporate Theater"|"Status Update Hell"|"Manager Monologue"|"Panic Ritual"|"Actually Useful"|"Circular Debate"|"Ghost Meeting",
  "archetype_description": "one punchy sentence describing why this archetype",
  "buzzword_density": 0-100 (how many corporate buzzwords per page),
  "synergy_count": number of times synergy/alignment/leverage/bandwidth/circle back/touch base/take this offline/unpack/ideate was used,
  "quick_question_count": count of "quick question" or "just a quick" phrases,
  "decision_avoidance_level": 0-100 (how much did they avoid making decisions),
  "async_replacement": "Email"|"Slack"|"Loom"|"Jira ticket"|"None — this meeting was necessary",
  "recommendations": ["3-5 specific, actionable, slightly sarcastic recommendations"]
}

Be honest. Be brutal. If no decisions were made, say so. If one person dominated, call it out. If the meeting was pointless, don't soften it.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");

  const parsed = JSON.parse(content);
  const validated = AnalysisResultSchema.safeParse(parsed);

  if (!validated.success) {
    // Attempt to fix common issues and re-validate
    const fixed = {
      ...parsed,
      uselessness_score: Math.min(100, Math.max(0, parsed.uselessness_score ?? 50)),
      async_score: Math.min(100, Math.max(0, parsed.async_score ?? 50)),
      buzzword_density: Math.min(100, Math.max(0, parsed.buzzword_density ?? 0)),
      decision_avoidance_level: Math.min(100, Math.max(0, parsed.decision_avoidance_level ?? 50)),
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      action_items: Array.isArray(parsed.action_items) ? parsed.action_items : [],
      speaking_balance: Array.isArray(parsed.speaking_balance) ? parsed.speaking_balance : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
    return AnalysisResultSchema.parse(fixed);
  }

  return validated.data;
}
