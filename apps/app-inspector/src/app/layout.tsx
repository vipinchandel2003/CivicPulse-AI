import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicPulse Inspector — Field Ops",
  description: "Field staff task management and geofenced proof-of-work resolution."
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
