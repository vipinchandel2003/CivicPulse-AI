"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Kanban,
  Map,
  CheckCircle2,
  Users,
  ShieldAlert,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2
} from "lucide-react";
import { useAuth } from "@civicpulse/api-client";

export interface AdminShellProps {
  children: React.ReactNode;
  activeNav: string;
  onNavChange: (nav: string) => void;
  selectedWard: string;
  onWardChange: (ward: string) => void;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  children,
  activeNav,
  onNavChange,
  selectedWard,
  onWardChange
}) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Executive Overview", icon: LayoutDashboard },
    { id: "analytics", label: "Analytics & Trends", icon: BarChart3 },
    { id: "kanban", label: "Ward Kanban Board", icon: Kanban },
    { id: "review-queue", label: "AI Review Queue", icon: CheckCircle2 },
    { id: "heatmap", label: "Geospatial Heatmap (H3)", icon: Map },
    { id: "accountability", label: "Accountability Matrix", icon: Users },
    { id: "sla-audit", label: "SLA Escalation Engine", icon: ShieldAlert }
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 tracking-tight">
                  Indore 311 ICCC · Integrated Command Center
                </h1>
                <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  {user?.role || "SUPER_ADMIN"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Municipal Headquarters Real-Time Operational Console</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1 rounded-xl">
            <span className="text-xs text-slate-500 font-semibold pl-2">Filter:</span>
            <select
              value={selectedWard}
              onChange={(e) => onWardChange(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-bold rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none shadow-xs"
            >
              <option>All Wards</option>
              <option>Ward 64 (Central Zone)</option>
              <option>Ward 12 (South Zone)</option>
              <option>Ward 85 (West Zone)</option>
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>LIVE STREAM</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-red-50 transition-colors ml-2"
          >
            <LogOut className="h-3.5 w-3.5" /> Exit
          </button>
        </div>
      </header>

      {/* Body with Desktop Sidebar & Multi-Column Viewport */}
      <div className="flex flex-1">
        <aside
          className={`border-r border-slate-200 bg-white transition-all duration-200 flex flex-col justify-between p-4 ${
            collapsed ? "w-20" : "w-72"
          }`}
        >
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavChange(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {!collapsed && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1 shadow-xs">
              <p className="font-bold text-slate-900">{user?.fullName || "Commissioner Singhal"}</p>
              <p className="text-[11px] text-slate-500 font-medium">Security Clearance: Tier 5 Super Admin</p>
            </div>
          )}
        </aside>

        <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-[1800px]">
          {children}
        </main>
      </div>
    </div>
  );
};
