import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getArchetypeColor(archetype: string): string {
  const map: Record<string, string> = {
    "Corporate Theater": "from-purple-500 to-pink-500",
    "Status Update Hell": "from-orange-500 to-red-500",
    "Manager Monologue": "from-red-500 to-rose-600",
    "Panic Ritual": "from-yellow-500 to-orange-500",
    "Actually Useful": "from-green-500 to-emerald-500",
    "Circular Debate": "from-blue-500 to-indigo-500",
    "Ghost Meeting": "from-gray-500 to-slate-600",
  };
  return map[archetype] ?? "from-gray-500 to-slate-600";
}

export function getScoreColor(score: number): string {
  if (score >= 75) return "text-red-400";
  if (score >= 50) return "text-orange-400";
  if (score >= 25) return "text-yellow-400";
  return "text-green-400";
}
