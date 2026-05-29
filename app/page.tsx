"use client";

import { motion } from "framer-motion";
import { ArrowRight, Brain, Clock, DollarSign, TrendingDown, Zap, BarChart2, Share2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const STATS = [
  { value: "$37B", label: "wasted on unnecessary meetings in the US annually" },
  { value: "31", label: "hours spent in unproductive meetings per month per person" },
  { value: "67%", label: "of meetings are considered failures by attendees" },
  { value: "0", label: "decisions made when everyone says 'let's take this offline'" },
];

const ARCHETYPES = [
  { name: "Corporate Theater", emoji: "🎭", description: "Performance art disguised as productivity" },
  { name: "Status Update Hell", emoji: "📊", description: "Why send an email when you can waste an hour?" },
  { name: "Manager Monologue", emoji: "🎤", description: "One person talks. Everyone else pretends to care." },
  { name: "Panic Ritual", emoji: "🔥", description: "Urgency cosplay. Nothing will change." },
  { name: "Actually Useful", emoji: "✅", description: "Rare. Treasure it." },
];

const FEATURES = [
  { icon: Brain, title: "AI Brutality Engine", description: "Detects fake alignment, circular debates, and decision avoidance with surgical precision." },
  { icon: DollarSign, title: "Salary Burn Calculator", description: "Watch $800/hour evaporate while someone 'just wants to add one more thing.'" },
  { icon: BarChart2, title: "Speaker Dominance Analysis", description: "Find out who spoke 82% of the time and who was just staring at their phone." },
  { icon: Share2, title: "Shareable Shame Cards", description: "Generate beautiful, devastating cards to share with your team. Or your CEO." },
  { icon: Clock, title: "Async Opportunity Score", description: "We'll tell you exactly which meetings could've been a Slack message." },
  { icon: TrendingDown, title: "Meeting Archetypes", description: "Corporate Theater, Panic Ritual, Manager Monologue — labeled with love." },
];

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-pink-600/15 blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Anti-Meeting AI</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard" className="flex items-center gap-2 bg-white/10 hover:bg-white/15 transition-colors px-4 py-2 rounded-lg text-sm font-medium">
              Dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <button onClick={handleGoogleLogin} className="flex items-center gap-2 bg-white text-black hover:bg-white/90 transition-colors px-4 py-2 rounded-lg text-sm font-semibold">
              Get Started <ArrowRight size={14} />
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs text-violet-300 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Brutally honest meeting analysis
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
            Your meetings are
            <br />
            <span className="gradient-text">costing a fortune.</span>
            <br />
            <span className="text-white/60">We can prove it.</span>
          </h1>

          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed">
            Paste your meeting transcript. Get a brutally honest AI analysis of who wasted time,
            what was actually decided, how much money burned, and whether this meeting
            should have been a Slack message.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link href="/analyze" className="inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 transition-all px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-violet-500/25">
                Analyze a Meeting <ArrowRight size={20} />
              </Link>
            ) : (
              <button onClick={handleGoogleLogin} className="inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 transition-all px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-violet-500/25">
                Analyze Your Meeting <ArrowRight size={20} />
              </button>
            )}
            <Link href="#how-it-works" className="inline-flex items-center gap-2 glass px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:bg-white/10">
              See How It Works
            </Link>
          </div>
        </motion.div>

        {/* Sample result card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 max-w-2xl mx-auto"
        >
          <div className="glass rounded-2xl p-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-white/40 mb-1">MEETING ARCHETYPE</div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-sm font-semibold text-purple-300">
                  🎭 Corporate Theater
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/40 mb-1">USELESSNESS SCORE</div>
                <div className="text-3xl font-black text-red-400">87<span className="text-lg">/100</span></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="glass rounded-xl p-3 text-center">
                <div className="text-xl font-black text-red-400">$918</div>
                <div className="text-xs text-white/40 mt-1">salary burned</div>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <div className="text-xl font-black text-orange-400">0</div>
                <div className="text-xs text-white/40 mt-1">decisions made</div>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <div className="text-xl font-black text-yellow-400">42m</div>
                <div className="text-xs text-white/40 mt-1">wasted</div>
              </div>
            </div>
            <div className="text-sm text-white/50 italic border-t border-white/5 pt-4">
              &ldquo;This meeting achieved the remarkable feat of consuming 8 people&apos;s time to arrive at no conclusions. One person spoke 78% of the time.&rdquo;
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 border-y border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-black gradient-text mb-2">{stat.value}</div>
              <div className="text-sm text-white/40">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4">What we expose</h2>
          <p className="text-white/40 text-lg">Powered by AI. Fueled by your frustration with pointless meetings.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 transition-all hover:bg-white/10"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/30 flex items-center justify-center mb-4">
                <feature.icon size={18} className="text-violet-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Archetypes */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4">Meeting Archetypes</h2>
          <p className="text-white/40 text-lg">Which one is your team guilty of?</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {ARCHETYPES.map((type, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5 text-center max-w-[180px] transition-all hover:bg-white/10"
            >
              <div className="text-3xl mb-2">{type.emoji}</div>
              <div className="font-bold text-sm mb-1">{type.name}</div>
              <div className="text-xs text-white/40">{type.description}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24 text-center">
        <div className="glass rounded-3xl p-12">
          <h2 className="text-4xl font-black mb-4">
            Ready to find out the truth<br />about your meetings?
          </h2>
          <p className="text-white/40 mb-8 text-lg">Free for 5 analyses. No credit card. Just honesty.</p>
          <button onClick={handleGoogleLogin} className="inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 transition-all px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-violet-500/25">
            Start Analyzing — It&apos;s Free <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-white/30 text-sm">
        <p>Anti-Meeting AI — Because your time is worth more than this.</p>
      </footer>
    </div>
  );
}
