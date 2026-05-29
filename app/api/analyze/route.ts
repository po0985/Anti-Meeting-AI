import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeMeeting } from "@/lib/openai";
import { z } from "zod";

const RequestSchema = z.object({
  transcript: z.string().min(50, "Transcript too short"),
  title: z.string().min(1).max(200),
  duration_minutes: z.number().min(1).max(480),
  attendee_count: z.number().min(1).max(100),
  avg_salary: z.number().min(20000).max(1000000),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { transcript, title, duration_minutes, attendee_count, avg_salary } = parsed.data;

  const result = await analyzeMeeting(transcript, duration_minutes, attendee_count, avg_salary);

  const { data, error } = await supabase
    .from("analyses")
    .insert({
      user_id: user.id,
      title,
      transcript,
      duration_minutes,
      attendee_count,
      avg_salary,
      ...result,
      decisions: result.decisions,
      action_items: result.action_items,
      speaking_balance: result.speaking_balance,
      recommendations: result.recommendations,
      wasted_time_minutes: Math.round(result.wasted_time_minutes),
      salary_burn: Math.round(result.salary_burn),
      uselessness_score: Math.round(result.uselessness_score),
      async_score: Math.round(result.async_score),
      buzzword_density: Math.round(result.buzzword_density),
      decision_avoidance_level: Math.round(result.decision_avoidance_level),
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: "Failed to save analysis" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
