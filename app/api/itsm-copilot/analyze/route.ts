import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseTicketCSV, computeStats } from "@/lib/itsm-analytics";
import { generateITSMReport } from "@/lib/itsm-copilot";
import { z } from "zod";

const RequestSchema = z.object({
  title: z.string().min(1).max(200),
  csv: z.string().min(20, "Ticket export looks too small"),
  report_language: z.enum(["ru", "en"]).default("ru"),
  company_context: z.string().max(2000).optional().default(""),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, csv, report_language, company_context } = parsed.data;

  const { rows, warnings } = parseTicketCSV(csv.slice(0, 3_000_000));
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid ticket rows found. Make sure the CSV has a 'created_at' column with parseable dates." },
      { status: 400 }
    );
  }

  const stats = computeStats(rows);
  const report = await generateITSMReport(stats, report_language, company_context);

  const { data, error } = await supabase
    .from("itsm_reports")
    .insert({
      user_id: user.id,
      title,
      report_language,
      company_context,
      ticket_count: rows.length,
      warnings,
      stats,
      report,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
