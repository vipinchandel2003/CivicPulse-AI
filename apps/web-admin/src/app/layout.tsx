import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicPulse Command Center — ICCC Admin",
  description: "Executive geospatial intelligence, review queues, and accountability matrices."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="antialiased font-sans bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
