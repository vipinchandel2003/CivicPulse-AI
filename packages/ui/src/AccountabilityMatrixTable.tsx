"use client";

import React, { useState } from "react";
import { StaffAccountabilityMetric, MOCK_STAFF_ACCOUNTABILITY } from "@civicpulse/api-client";
import { Card } from "./Card";
import { Badge } from "./Badge";
import {
  Users,
  Award,
  AlertTriangle,
  Flame,
  ArrowUpDown,
  Search,
  Filter
} from "lucide-react";

export interface AccountabilityMatrixTableProps {
  onSelectInspector?: (inspector: StaffAccountabilityMetric) => void;
}

export const AccountabilityMatrixTable: React.FC<AccountabilityMatrixTableProps> = ({
  onSelectInspector
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");

  const filteredData = MOCK_STAFF_ACCOUNTABILITY.filter((item) => {
    const matchesSearch =
      item.inspectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.wardNumber.toString().includes(searchTerm);
    const matchesTier = tierFilter === "ALL" || item.performanceTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <Card className="p-0 overflow-hidden bg-white border-slate-200 shadow-sm space-y-0">
      {/* Search and Filter Strip */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff, dept, or ward..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Tier Filter:</span>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Performance Tiers</option>
            <option value="TOP_PERFORMER">Top Performers (&gt;90 KPI)</option>
            <option value="SATISFACTORY">Satisfactory (80-90 KPI)</option>
            <option value="ESCALATION_WATCH">Escalation Watch (60-80)</option>
            <option value="CRITICAL_REVIEW">Critical Review (&lt;60)</option>
          </select>
        </div>
      </div>

      {/* Structured Governance Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <th className="py-3 px-4">Field Inspector</th>
              <th className="py-3 px-4">Ward / Dept</th>
              <th className="py-3 px-4 text-center">Active Load</th>
              <th className="py-3 px-4 text-center">SLA Compliance</th>
              <th className="py-3 px-4 text-center">MTTR</th>
              <th className="py-3 px-4 text-center">Reopen Rate</th>
              <th className="py-3 px-4 text-center">Fraud Flags</th>
              <th className="py-3 px-4 text-center">KPI Score</th>
              <th className="py-3 px-4 text-center">Governance Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((row) => {
              const isTop = row.performanceTier === "TOP_PERFORMER";
              const isWatch = row.performanceTier === "ESCALATION_WATCH";
              const isCritical = row.performanceTier === "CRITICAL_REVIEW";

              return (
                <tr
                  key={row.inspectorId}
                  onClick={() => onSelectInspector?.(row)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{row.inspectorName}</div>
                    <span className="text-[10px] text-slate-400 font-mono">{row.inspectorId}</span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-slate-800 font-medium">Ward {row.wardNumber}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{row.department}</div>
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                    {row.activeLoadCount}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-mono font-bold ${
                        row.slaCompliancePercent >= 90
                          ? "text-emerald-700"
                          : row.slaCompliancePercent >= 75
                          ? "text-amber-700"
                          : "text-red-600"
                      }`}
                    >
                      {row.slaCompliancePercent}%
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-slate-700">
                    {row.mttrHours}h
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-slate-700">
                    {row.reopenRatePercent}%
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                        row.fakeClosureFlags > 0
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : "text-slate-400"
                      }`}
                    >
                      {row.fakeClosureFlags}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className="font-mono font-black text-sm text-slate-900">
                      {row.kpiScore}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isTop
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : isCritical
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : isWatch
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {isTop && <Award className="h-3 w-3" />}
                      {isCritical && <Flame className="h-3 w-3" />}
                      {row.performanceTier.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
