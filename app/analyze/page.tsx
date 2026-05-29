"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Loader2, Zap, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_TRANSCRIPT = `John (Manager): Okay let's get started. Thanks everyone for joining. So, um, I wanted to sync up about the Q3 roadmap and make sure we're all aligned going into the next quarter.

Sarah (Product): Sure, I think we have a lot to cover. Should we start with the feature prioritization?

John: Yeah absolutely. So, quick question — where are we on the mobile redesign?

Mike (Engineering): We're about 60% done. We're running into some technical debt issues that are slowing us down.

John: Okay so we need to unpack that. Let's make sure we're leveraging all our resources to maximize our bandwidth here.

Sarah: I think we should circle back on this. Maybe we should take this offline with the design team?

John: Good idea. Let's definitely do that. So, to your point Mike, how do we move the needle here?

Mike: I think we need another sprint to address the tech debt before we can move forward.

John: Got it. Let's make sure we're all synergized on this. I'll ping you both after the call to ideate on solutions.

Sarah: Quick question — are we still on track for the Q3 deadline?

John: Great question. So I think we need to socialize this with leadership before we can commit to anything. Let's take it one step at a time.

Mike: Should we update the Jira tickets at least?

John: Yeah let's definitely action that. Okay, any other blockers?

Sarah: The design team is still waiting on feedback from last month.

John: Okay we'll circle back on that. Let me know if there's anything I can do to unblock you guys. Alright, I think we're good here. Let's reconnect Thursday.`;

export default function AnalyzePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [attendees, setAttendees] = useState(5);
  const [avgSalary, setAvgSalary] = useState(120000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"paste" | "upload">("paste");

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".txt")) {
      setError("Only .txt files are supported");
      return;
    }
    const text = await file.text();
    setTranscript(text);
    if (!title) setTitle(file.name.replace(".txt", ""));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) { setError("Please add a transcript"); return; }
    if (!title.trim()) { setError("Please add a meeting title"); return; }
    if (transcript.length < 50) { setError("Transcript is too short"); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          title,
          duration_minutes: duration,
          attendee_count: attendees,
          avg_salary: avgSalary,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Analysis failed");

      router.push(`/results/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">Analyze a Meeting</h1>
        <p className="text-white/40">Paste your transcript or upload a .txt file. We&apos;ll do the rest.</p>
      </div>

      {/* Meeting info */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-bold mb-4 text-sm uppercase tracking-wider text-white/50">Meeting Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-white/40 block mb-1.5">Meeting Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Q3 Roadmap Sync"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/50 transition-colors placeholder:text-white/20"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-1.5">Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={1} max={480}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-1.5">Number of Attendees</label>
            <input
              type="number"
              value={attendees}
              onChange={(e) => setAttendees(Number(e.target.value))}
              min={1} max={100}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-1.5">Avg. Yearly Salary (USD)</label>
            <input
              type="number"
              value={avgSalary}
              onChange={(e) => setAvgSalary(Number(e.target.value))}
              min={20000} max={1000000} step={10000}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
        </div>
        <div className="text-xs text-white/30 glass rounded-lg px-3 py-2">
          💸 Estimated burn rate: <span className="text-yellow-400 font-semibold">
            ${Math.round((avgSalary / 2080) * attendees * (duration / 60)).toLocaleString()}
          </span> for this meeting
        </div>
      </div>

      {/* Transcript input */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setTab("paste")}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", tab === "paste" ? "bg-violet-600 text-white" : "text-white/40 hover:text-white")}
          >
            <FileText size={14} className="inline mr-1.5" />Paste Transcript
          </button>
          <button
            onClick={() => setTab("upload")}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-all", tab === "upload" ? "bg-violet-600 text-white" : "text-white/40 hover:text-white")}
          >
            <Upload size={14} className="inline mr-1.5" />Upload File
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === "paste" ? (
            <motion.div key="paste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste your meeting transcript here...

Example:
John: Let's sync on the Q3 roadmap.
Sarah: Quick question — where are we on mobile?
..."
                rows={12}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-colors resize-none font-mono placeholder:text-white/20"
              />
              <button
                onClick={() => setTranscript(DEMO_TRANSCRIPT)}
                className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Load demo transcript →
              </button>
            </motion.div>
          ) : (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-xl p-12 text-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
              >
                <Upload size={32} className="mx-auto mb-3 text-white/30" />
                <div className="font-medium mb-1">Drop your .txt file here</div>
                <div className="text-sm text-white/40">or click to browse</div>
                {transcript && (
                  <div className="mt-3 text-sm text-green-400">✓ File loaded — {transcript.length} characters</div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".txt"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm mb-4 glass rounded-xl px-4 py-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !transcript.trim()}
        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all px-6 py-4 rounded-xl font-bold text-lg"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Analyzing your meeting... this might hurt
          </>
        ) : (
          <>
            <Zap size={20} />
            Analyze This Meeting
          </>
        )}
      </button>
      <p className="text-center text-xs text-white/20 mt-3">Takes 10-20 seconds. Results are brutally honest.</p>
    </div>
  );
}
