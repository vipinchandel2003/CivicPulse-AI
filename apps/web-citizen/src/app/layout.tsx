import type { Metadata } from "next";
import { UnifiedPortalSwitcher } from "@civicpulse/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicPulse AI — Unified Municipal Suite",
  description: "Citizen reporting, field staff resolution, and ICCC command center on a single unified platform.",
  manifest: "/manifest.json"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="antialiased font-sans bg-slate-50 text-slate-900">
        <UnifiedPortalSwitcher />
        {children}
      </body>
    </html>
  );
}
