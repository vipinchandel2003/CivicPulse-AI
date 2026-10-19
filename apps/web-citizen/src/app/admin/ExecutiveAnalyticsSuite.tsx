"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import {
  MOCK_DAILY_TRENDS,
  MOCK_CATEGORY_BREAKDOWN,
  MOCK_ZONE_COMPARISONS
} from "@civicpulse/api-client";
import { Card } from "@civicpulse/ui";
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";

export const ExecutiveAnalyticsSuite: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Municipal Operational Analytics & Visual Intelligence
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Aggregated metric streams across all 85 wards, Celery beat escalations, and AI verify pipelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-blue-600" /> Past 7 Days Active Window
          </span>
        </div>
      </div>

      {/* Row 1: Weekly Incident Inflow vs Resolution Inflow (Area Chart) */}
      <Card className="p-6 bg-white border-slate-200/90 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Incident Intake vs Geofenced Closures vs Breaches
              </h3>
              <p className="text-xs text-slate-500 font-medium">Daily ticket velocity across Indore Nagar Nigam</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-blue-600" /> Reported
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-600" /> Resolved
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-600" /> Breached
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_DAILY_TRENDS} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E2E8F0",
                  borderRadius: "0.75rem",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                  fontWeight: "bold"
                }}
              />
              <Area
                type="monotone"
                dataKey="reported"
                stroke="#2563EB"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorReported)"
                name="Intake Reports"
              />
              <Area
                type="monotone"
                dataKey="resolved"
                stroke="#16A34A"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorResolved)"
                name="Verified Closures"
              />
              <Area
                type="monotone"
                dataKey="breached"
                stroke="#DC2626"
                strokeWidth={2}
                fill="none"
                name="SLA Breached"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Row 2: Category Distribution (Donut Chart) + Zone MTTR Performance (Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="p-6 bg-white border-slate-200/90 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <PieIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hazard Category Volume Distribution</h3>
              <p className="text-xs text-slate-500 font-medium">YOLO vision model triage classifications</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_CATEGORY_BREAKDOWN}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {MOCK_CATEGORY_BREAKDOWN.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {MOCK_CATEGORY_BREAKDOWN.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-600 truncate">{cat.name}:</span>
                <span className="font-mono font-bold text-slate-900 ml-auto">{cat.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Zone MTTR Comparison */}
        <Card className="p-6 bg-white border-slate-200/90 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Zone-by-Zone MTTR & Benchmark</h3>
              <p className="text-xs text-slate-500 font-medium">Mean Time to Resolution (Target: 4.0h)</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_ZONE_COMPARISONS} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="zone" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}
                />
                <Bar dataKey="mttrHours" fill="#2563EB" radius={[6, 6, 0, 0]} name="Actual MTTR (Hours)" />
                <Bar dataKey="benchmarkHours" fill="#CBD5E1" radius={[6, 6, 0, 0]} name="IMC Benchmark (4.0h)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Fastest Resolving Zone:</span>
            <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
              Central Zone (3.4h MTTR)
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
};
