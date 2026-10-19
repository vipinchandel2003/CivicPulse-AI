"use client";

import React from "react";
import { Award, CheckCircle2, TrendingUp, ShieldAlert, Clock } from "lucide-react";

export interface InspectorKpiOverviewProps {
  score: number; // 0 - 100
  compliancePercent: number;
  mttrHours: number;
  completedThisWeek: number;
}

export const InspectorKpiOverview: React.FC<InspectorKpiOverviewProps> = ({
  score = 94,
  compliancePercent = 96.2,
  mttrHours = 3.4,
  completedThisWeek = 28
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Officer Performance Index</h4>
            <span className="text-[10px] text-slate-500">Official Municipal Ranking</span>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
          Tier 1 Top Performer
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-xl font-black text-slate-900 font-mono">{score}/100</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Composite KPI</div>
        </div>

        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="text-xl font-black text-emerald-700 font-mono">{compliancePercent}%</div>
          <div className="text-[10px] text-emerald-800 font-medium mt-0.5">SLA Compliance</div>
        </div>

        <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="text-xl font-black text-blue-700 font-mono">{mttrHours}h</div>
          <div className="text-[10px] text-blue-800 font-medium mt-0.5">Average MTTR</div>
        </div>

        <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
          <div className="text-xl font-black text-purple-700 font-mono">{completedThisWeek}</div>
          <div className="text-[10px] text-purple-800 font-medium mt-0.5">Closed This Week</div>
        </div>
      </div>
    </div>
  );
};
