import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anti-Meeting AI — Stop Wasting Time in Useless Meetings",
  description: "AI that ruthlessly analyzes your meetings. Find out who wasted everyone's time, what decisions were actually made, and how much money was burned.",
  openGraph: {
    title: "Anti-Meeting AI",
    description: "Your meetings analyzed. Brutally.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080a0f] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
