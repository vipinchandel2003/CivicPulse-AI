"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Camera,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Flame,
  Users,
  Layers,
  Sparkles,
  Smartphone,
  ChevronRight,
  Activity,
  Globe
} from "lucide-react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card } from "./Card";

export const CivicLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Next-Gen Indore 311 Smart Governance Standard
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Trust in Every <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Resolution</span>.
            <br />
            Powered by AI & Geofencing.
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            CivicPulse AI eliminates fake closures and civic delays. Citizens report with live camera and GPS integrity; AI triages hazards in real time; field staff verify resolutions on-site within 30 metres.
          </p>

          {/* Quick Metrics Strip */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
              <div className="text-2xl font-black text-slate-900 font-mono">100%</div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Live Camera (No Gallery)</p>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
              <div className="text-2xl font-black text-emerald-600 font-mono">≤30m</div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Geofenced Resolve Gate</p>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
              <div className="text-2xl font-black text-blue-600 font-mono">4.2h</div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Mean Time to Resolve</p>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
              <div className="text-2xl font-black text-amber-600 font-mono">96.2%</div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">SLA Compliance Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Unified Platform Portals Launcher on Same Port */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Explore the 3 Portals on Single Port</h2>
          <p className="text-xs text-slate-500">Instant internal navigation without launching separate servers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Citizen PWA */}
          <Card className="p-6 bg-white border-slate-200 rounded-3xl shadow-sm hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <Smartphone className="h-6 w-6" />
                </div>
                <Badge variant="standard">Tier 0 · Route: /</Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Citizen Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Report civic hazards with in-app rear camera snapshot and live GPS accuracy ring. Track lifecycle timelines, upvote &quot;Me Too&quot;, and reopen unverified tickets.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-1">
                <li className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Live Rear Camera Only
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> MapLibre Nearby Issues Map
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Bilingual Hindi/English
                </li>
              </ul>
            </div>

            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              Open Citizen Portal <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>

          {/* Card 2: Inspector App */}
          <Card className="p-6 bg-white border-slate-200 rounded-3xl shadow-sm hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <Badge variant="high">Tier 1 · Route: /inspector</Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Inspector Field App</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prioritized assignment queue with live distance-to-site navigation. Enforces on-site geofencing (≤30m) and single-use server nonce before allowing &quot;After&quot; photo uploads.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-1">
                <li className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> 75% SLA Countdown Warnings
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Geofence Locked Resolution
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Offline Resolution Queue
                </li>
              </ul>
            </div>

            <Link
              href="/inspector"
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              Open Inspector Portal <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>

          {/* Card 3: Command Center (ICCC) */}
          <Card className="p-6 bg-white border-slate-200 rounded-3xl shadow-sm hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                  <Building2 className="h-6 w-6" />
                </div>
                <Badge variant="critical">Tier 2–5 · Route: /admin</Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900">ICCC Command Center</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Municipal headquarters command suite with Deck.gl H3 density heatmaps, AI review queue with CLIP and YOLO scores, and staff accountability leaderboard matrix.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-1">
                <li className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Ward Kanban & AI Review
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> H3 Hex Density Heatmaps
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Recharts Operational Analytics
                </li>
              </ul>
            </div>

            <Link
              href="/admin"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              Open Command Center <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </div>
      </section>

      {/* Trust & Security Architecture Highlights */}
      <section className="bg-white py-16 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Engineered for Radical Accountability</h2>
            <p className="text-xs text-slate-500">Every mechanism designed to stop fraudulent ticket closure.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Strict In-App Capture</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero gallery uploads allowed. Frontends stream live camera sensor feeds directly through WebRTC, bound to a 60-second single-use server nonce.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-sm">PostGIS Geofence Verification</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Field inspectors cannot mark a ticket resolved unless their GPS coordinates are strictly within 30 metres of the incident point with accuracy ≤20m.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-sm">AI Dual-Model Verification</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                CLIP background similarity checks that the &quot;After&quot; photo matches the original location, while YOLO confirms the hazard defect is completely absent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-8 px-4 border-t border-slate-800 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">CivicPulse AI</span>
            <span>· Smart Civic Governance & Anti-Fake-Closure Platform</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Aligned with Digital Personal Data Protection (DPDP) Act 2023 · Indore Nagar Nigam
          </div>
        </div>
      </footer>
    </div>
  );
};
