"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileSpreadsheet, Loader2, LifeBuoy, AlertCircle, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const SAMPLE_CSV = `id,created_at,resolved_at,type,category,team,service,region,priority,assignee,status,sla_target_hours,sla_met,reopened,escalated
INC-1001,2026-06-02T09:15:00Z,2026-06-02T11:45:00Z,Incident,Network,L1 Service Desk,VPN Gateway,EMEA,P2,Anna K.,Resolved,4,true,false,false
INC-1002,2026-06-02T10:05:00Z,2026-06-03T09:00:00Z,Incident,Email,L2 Infrastructure,Exchange Online,EMEA,P1,David R.,Resolved,8,false,false,true
REQ-1003,2026-06-02T12:30:00Z,2026-06-02T13:10:00Z,Service Request,Access Management,L1 Service Desk,Active Directory,APAC,P3,Anna K.,Resolved,24,true,false,false
INC-1004,2026-06-03T08:00:00Z,,Incident,Network,L1 Service Desk,VPN Gateway,EMEA,P2,Anna K.,In Progress,4,,false,false
CHG-1005,2026-06-03T14:20:00Z,2026-06-04T10:00:00Z,Change,Server Maintenance,L2 Infrastructure,Core Switch,AMER,P3,David R.,Resolved,48,true,false,false`;

export default function ITSMCopilotPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [csv, setCsv] = useState("");
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"upload" | "paste">("upload");

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Only .csv files are supported");
      return;
    }
    const text = await file.text();
    setCsv(text);
    if (!title) setTitle(file.name.replace(".csv", ""));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "itsm-tickets-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!csv.trim()) { setError("Please add a ticket export"); return; }
    if (!title.trim()) { setError("Please add a report title"); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/itsm-copilot/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          csv,
          report_language: language,
          company_context: context,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Analysis failed");

      router.push(`/itsm-copilot/results/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <LifeBuoy size={22} className="text-violet-400" />
          <h1 className="text-3xl font-black">IT Support Copilot</h1>
        </div>
        <p className="text-white/40">
          Upload a ticket export (CSV) from your Service Desk / ITSM system. We&apos;ll compute real ticket, SLA, team
          and automation metrics, then generate a CIO-level executive report.
        </p>
      </div>

      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-bold mb-4 text-sm uppercase tracking-wider text-white/50">Report Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-white/40 block mb-1.5">Report Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="June 2026 Service Desk Review"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/50 transition-colors placeholder:text-white/20"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-1.5">Report Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "ru" | "en")}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/50 transition-colors"
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1.5">Company / period context (optional)</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. 600 support staff, 3 lines (L1/L2/L3), major ERP rollout in this period..."
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/50 transition-colors resize-none placeholder:text-white/20"
          />
        </div>
      </div>

      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("upload")}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", tab === "upload" ? "bg-violet-600 text-white" : "text-white/40 hover:text-white")}
            >
              <Upload size={14} className="inline mr-1.5" />Upload CSV
            </button>
            <button
              onClick={() => setTab("paste")}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", tab === "paste" ? "bg-violet-600 text-white" : "text-white/40 hover:text-white")}
            >
              <FileSpreadsheet size={14} className="inline mr-1.5" />Paste CSV
            </button>
          </div>
          <button onClick={downloadSample} className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
            <Download size={12} /> Sample template
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === "upload" ? (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-xl p-12 text-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
              >
                <Upload size={32} className="mx-auto mb-3 text-white/30" />
                <div className="font-medium mb-1">Drop your ticket export (.csv) here</div>
                <div className="text-sm text-white/40">or click to browse</div>
                {csv && (
                  <div className="mt-3 text-sm text-green-400">✓ File loaded — {csv.length.toLocaleString()} characters</div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </motion.div>
          ) : (
            <motion.div key="paste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <textarea
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                placeholder="id,created_at,resolved_at,type,category,team,service,region,priority,assignee,status,sla_target_hours,sla_met,reopened,escalated
INC-1001,2026-06-02T09:15:00Z,2026-06-02T11:45:00Z,Incident,Network,L1 Service Desk,VPN Gateway,EMEA,P2,Anna K.,Resolved,4,true,false,false"
                rows={12}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-colors resize-none font-mono placeholder:text-white/20"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-xs text-white/30 mt-3">
          Required column: <code className="text-white/50">created_at</code>. Recommended: category, team, service,
          region, priority, assignee, status, sla_target_hours, sla_met, reopened, escalated.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm mb-4 glass rounded-xl px-4 py-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !csv.trim()}
        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all px-6 py-4 rounded-xl font-bold text-lg"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Analyzing your service desk data...
          </>
        ) : (
          <>
            <LifeBuoy size={20} />
            Generate Executive Report
          </>
        )}
      </button>
      <p className="text-center text-xs text-white/20 mt-3">May take 20-40 seconds for large exports.</p>
    </div>
  );
}
