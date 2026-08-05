import type { ITSMStats, TicketRow } from "./itsm-schema";

const TRUE_VALUES = new Set(["true", "yes", "y", "1", "да"]);
const FALSE_VALUES = new Set(["false", "no", "n", "0", "нет"]);

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields.map((f) => f.trim());
}

function parseBool(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  const v = value.trim().toLowerCase();
  if (v === "") return undefined;
  if (TRUE_VALUES.has(v)) return true;
  if (FALSE_VALUES.has(v)) return false;
  return undefined;
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? undefined : d;
}

const HEADER_ALIASES: Record<string, string> = {
  id: "id",
  ticket_id: "id",
  "ticket id": "id",
  number: "id",
  created: "created_at",
  created_at: "created_at",
  "created date": "created_at",
  opened_at: "created_at",
  resolved: "resolved_at",
  resolved_at: "resolved_at",
  "resolved date": "resolved_at",
  closed_at: "resolved_at",
  "closed date": "resolved_at",
  type: "type",
  ticket_type: "type",
  category: "category",
  subcategory: "category",
  team: "team",
  assignment_group: "team",
  group: "team",
  service: "service",
  ci: "service",
  region: "region",
  location: "region",
  priority: "priority",
  assignee: "assignee",
  assigned_to: "assignee",
  agent: "assignee",
  owner: "assignee",
  status: "status",
  sla_target_hours: "sla_target_hours",
  sla_hours: "sla_target_hours",
  sla_target: "sla_target_hours",
  sla_met: "sla_met",
  sla: "sla_met",
  sla_breached: "sla_breached",
  reopened: "reopened",
  is_reopened: "reopened",
  escalated: "escalated",
  is_escalated: "escalated",
};

function normalizeHeader(h: string): string {
  const key = h.trim().toLowerCase().replace(/\s+/g, "_");
  return HEADER_ALIASES[key] ?? HEADER_ALIASES[h.trim().toLowerCase()] ?? key;
}

export interface ParseResult {
  rows: TicketRow[];
  warnings: string[];
  skipped: number;
}

export function parseTicketCSV(text: string): ParseResult {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  const warnings: string[] = [];
  if (lines.length < 2) {
    return { rows: [], warnings: ["File has no data rows."], skipped: 0 };
  }

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);

  if (!headers.includes("created_at")) {
    warnings.push("No 'created_at' column found — cannot compute time-based trends.");
  }

  const rows: TicketRow[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length === 1 && fields[0] === "") continue;

    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = fields[idx] ?? "";
    });

    const createdAt = parseDate(record.created_at);
    if (!createdAt) {
      skipped++;
      continue;
    }

    const slaBreached = parseBool(record.sla_breached);
    let slaMet = parseBool(record.sla_met);
    if (slaMet === undefined && slaBreached !== undefined) slaMet = !slaBreached;

    rows.push({
      id: record.id || `row-${i}`,
      created_at: createdAt,
      resolved_at: parseDate(record.resolved_at),
      type: record.type || "Service Request",
      category: record.category || "Uncategorized",
      team: record.team || "Unassigned Team",
      service: record.service || "Unspecified Service",
      region: record.region || "Unspecified",
      priority: record.priority || "Unspecified",
      assignee: record.assignee || "Unassigned",
      status: record.status || "Unknown",
      sla_target_hours: record.sla_target_hours ? Number(record.sla_target_hours) || undefined : undefined,
      sla_met: slaMet,
      reopened: parseBool(record.reopened) ?? false,
      escalated: parseBool(record.escalated) ?? false,
    });
  }

  if (skipped > 0) {
    warnings.push(`Skipped ${skipped} row(s) with missing or invalid created_at date.`);
  }

  return { rows, warnings, skipped };
}

function bucketBy(rows: TicketRow[], key: (r: TicketRow) => string, limit = 15) {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const total = rows.length || 1;
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 1000) / 10 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function resolutionHours(r: TicketRow): number | undefined {
  if (!r.resolved_at) return undefined;
  const hours = (r.resolved_at.getTime() - r.created_at.getTime()) / (1000 * 60 * 60);
  return hours >= 0 ? hours : undefined;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const m = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return Math.round(m * 10) / 10;
}

function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function computeStats(rows: TicketRow[]): ITSMStats {
  const totalTickets = rows.length;

  const sortedByDate = [...rows].sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
  const periodStart = sortedByDate[0]?.created_at.toISOString() ?? null;
  const periodEnd = sortedByDate[sortedByDate.length - 1]?.created_at.toISOString() ?? null;

  let previousPeriodCount = 0;
  let currentPeriodCount = 0;
  let volumeChangePct: number | null = null;
  if (sortedByDate.length >= 2 && periodStart && periodEnd) {
    const start = new Date(periodStart).getTime();
    const end = new Date(periodEnd).getTime();
    const mid = start + (end - start) / 2;
    for (const r of rows) {
      if (r.created_at.getTime() < mid) previousPeriodCount++;
      else currentPeriodCount++;
    }
    if (previousPeriodCount > 0) {
      volumeChangePct = Math.round(((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 1000) / 10;
    }
  }

  const weeklyMap = new Map<string, number>();
  for (const r of rows) {
    const w = isoWeek(r.created_at);
    weeklyMap.set(w, (weeklyMap.get(w) ?? 0) + 1);
  }
  const weeklyVolume = Array.from(weeklyMap.entries())
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => (a.week > b.week ? 1 : -1));

  // SLA
  const slaRows = rows.filter((r) => r.sla_met !== undefined);
  const slaBreaches = slaRows.filter((r) => r.sla_met === false);
  const overallCompliancePct =
    slaRows.length > 0 ? Math.round(((slaRows.length - slaBreaches.length) / slaRows.length) * 1000) / 10 : null;

  function slaByKey(keyFn: (r: TicketRow) => string) {
    const map = new Map<string, { total: number; breaches: number }>();
    for (const r of slaRows) {
      const k = keyFn(r);
      const entry = map.get(k) ?? { total: 0, breaches: 0 };
      entry.total++;
      if (r.sla_met === false) entry.breaches++;
      map.set(k, entry);
    }
    return Array.from(map.entries())
      .map(([k, v]) => ({
        key: k,
        total: v.total,
        breaches: v.breaches,
        compliancePct: Math.round(((v.total - v.breaches) / v.total) * 1000) / 10,
      }))
      .sort((a, b) => b.breaches - a.breaches);
  }

  const slaByTeamRaw = slaByKey((r) => r.team);
  const slaByServiceRaw = slaByKey((r) => r.service);

  // Resolution times
  const resolutionValues = rows.map(resolutionHours).filter((v): v is number => v !== undefined);
  const avgHours = mean(resolutionValues);
  const medianHours = median(resolutionValues);

  function resolutionByTeam() {
    const map = new Map<string, number[]>();
    for (const r of rows) {
      const h = resolutionHours(r);
      if (h === undefined) continue;
      const arr = map.get(r.team) ?? [];
      arr.push(h);
      map.set(r.team, arr);
    }
    return Array.from(map.entries())
      .map(([team, hours]) => ({ team, avgHours: mean(hours) ?? 0, count: hours.length }))
      .sort((a, b) => b.avgHours - a.avgHours);
  }

  // Team stats
  function teamStats() {
    const map = new Map<string, TicketRow[]>();
    for (const r of rows) {
      const arr = map.get(r.team) ?? [];
      arr.push(r);
      map.set(r.team, arr);
    }
    const counts = Array.from(map.values()).map((arr) => arr.length);
    const medianCount = median(counts) ?? 1;
    return Array.from(map.entries())
      .map(([name, arr]) => {
        const hours = arr.map(resolutionHours).filter((v): v is number => v !== undefined);
        const slaArr = arr.filter((r) => r.sla_met !== undefined);
        const slaCompliance =
          slaArr.length > 0
            ? Math.round(((slaArr.length - slaArr.filter((r) => r.sla_met === false).length) / slaArr.length) * 1000) / 10
            : null;
        return {
          name,
          ticketCount: arr.length,
          avgResolutionHours: mean(hours),
          slaCompliancePct: slaCompliance,
          escalationRatePct: Math.round((arr.filter((r) => r.escalated).length / arr.length) * 1000) / 10,
          reopenRatePct: Math.round((arr.filter((r) => r.reopened).length / arr.length) * 1000) / 10,
          loadIndex: Math.round((arr.length / medianCount) * 100) / 100,
        };
      })
      .sort((a, b) => b.ticketCount - a.ticketCount);
  }

  // Agent stats
  function agentStats() {
    const map = new Map<string, TicketRow[]>();
    for (const r of rows) {
      const arr = map.get(r.assignee) ?? [];
      arr.push(r);
      map.set(r.assignee, arr);
    }
    const counts = Array.from(map.values()).map((arr) => arr.length);
    const medianCount = median(counts) ?? 1;
    return Array.from(map.entries())
      .filter(([name]) => name !== "Unassigned")
      .map(([name, arr]) => {
        const hours = arr.map(resolutionHours).filter((v): v is number => v !== undefined);
        return {
          name,
          ticketCount: arr.length,
          avgResolutionHours: mean(hours),
          escalationRatePct: Math.round((arr.filter((r) => r.escalated).length / arr.length) * 1000) / 10,
          reopenRatePct: Math.round((arr.filter((r) => r.reopened).length / arr.length) * 1000) / 10,
          loadIndex: Math.round((arr.length / medianCount) * 100) / 100,
        };
      })
      .sort((a, b) => b.ticketCount - a.ticketCount);
  }

  const agents = agentStats();
  const teams = teamStats();

  const topPerformers = agents
    .filter((a) => a.avgResolutionHours !== null && a.escalationRatePct <= 10 && a.ticketCount >= Math.max(3, medianArr(agents.map((x) => x.ticketCount)) * 0.5))
    .sort((a, b) => (a.avgResolutionHours ?? Infinity) - (b.avgResolutionHours ?? Infinity))
    .slice(0, 5)
    .map((a) => a.name);

  const highLoadAgents = agents.filter((a) => a.loadIndex >= 1.5).map((a) => a.name);

  const lowPerformanceAgents = agents
    .filter((a) => a.reopenRatePct >= 20 || a.escalationRatePct >= 25)
    .map((a) => a.name);

  const burnoutRiskAgents = agents
    .filter((a) => a.loadIndex >= 1.5 && (a.escalationRatePct >= 15 || a.reopenRatePct >= 15))
    .map((a) => a.name);

  // Incidents
  const incidentRows = rows.filter((r) => r.type.toLowerCase().includes("incident"));
  const incidentCategoryCounts = new Map<string, number>();
  for (const r of incidentRows) {
    incidentCategoryCounts.set(r.category, (incidentCategoryCounts.get(r.category) ?? 0) + 1);
  }
  const recurringCategories = Array.from(incidentCategoryCounts.entries())
    .filter(([, count]) => count >= 3)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const incidentServiceCounts = new Map<string, number>();
  for (const r of incidentRows) {
    incidentServiceCounts.set(r.service, (incidentServiceCounts.get(r.service) ?? 0) + 1);
  }
  const topServices = Array.from(incidentServiceCounts.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Automation candidates: high-volume categories with resolvable tickets
  const categoryGroups = new Map<string, TicketRow[]>();
  for (const r of rows) {
    const arr = categoryGroups.get(r.category) ?? [];
    arr.push(r);
    categoryGroups.set(r.category, arr);
  }
  const spanDays =
    periodStart && periodEnd ? Math.max(1, (new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / 86400000) : 30;
  const automationCandidates = Array.from(categoryGroups.entries())
    .map(([category, arr]) => {
      const hours = arr.map(resolutionHours).filter((v): v is number => v !== undefined);
      const avgH = mean(hours);
      const pctOfTotal = Math.round((arr.length / totalTickets) * 1000) / 10;
      const timeSavedPerTicketHours = (avgH ?? 0.5) * 0.6; // assume 60% time reduction via automation/self-service
      const annualizedTickets = arr.length * (365 / spanDays);
      const estTimeSavedHoursPerYear = Math.round(annualizedTickets * timeSavedPerTicketHours);
      const estFteSaved = Math.round((estTimeSavedHoursPerYear / 2080) * 100) / 100;
      return { category, ticketCount: arr.length, pctOfTotal, avgResolutionHours: avgH, estTimeSavedHoursPerYear, estFteSaved };
    })
    .filter((c) => c.ticketCount >= 3 && c.pctOfTotal >= 3)
    .sort((a, b) => b.estTimeSavedHoursPerYear - a.estTimeSavedHoursPerYear)
    .slice(0, 8);

  return {
    totalTickets,
    periodStart,
    periodEnd,
    previousPeriodCount,
    currentPeriodCount,
    volumeChangePct,
    byCategory: bucketBy(rows, (r) => r.category),
    byTeam: bucketBy(rows, (r) => r.team),
    byRegion: bucketBy(rows, (r) => r.region),
    byService: bucketBy(rows, (r) => r.service),
    byPriority: bucketBy(rows, (r) => r.priority),
    byType: bucketBy(rows, (r) => r.type),
    weeklyVolume,
    sla: {
      coverage: slaRows.length,
      overallCompliancePct,
      breachCount: slaBreaches.length,
      byTeam: slaByTeamRaw.slice(0, 10).map((v) => ({ team: v.key, total: v.total, breaches: v.breaches, compliancePct: v.compliancePct })),
      byService: slaByServiceRaw.slice(0, 10).map((v) => ({ service: v.key, total: v.total, breaches: v.breaches, compliancePct: v.compliancePct })),
    },
    resolution: {
      avgHours,
      medianHours,
      byTeam: resolutionByTeam(),
    },
    teams,
    agents,
    topPerformers,
    highLoadAgents,
    lowPerformanceAgents,
    burnoutRiskAgents,
    incidents: {
      total: incidentRows.length,
      recurringCategories,
      topServices,
    },
    automationCandidates,
    dataQuality: {
      missingSlaData: totalTickets - slaRows.length,
      missingResolvedDate: totalTickets - resolutionValues.length,
      missingTeam: rows.filter((r) => r.team === "Unassigned Team").length,
      missingAssignee: rows.filter((r) => r.assignee === "Unassigned").length,
    },
  };
}

function medianArr(values: number[]): number {
  return median(values) ?? 0;
}
