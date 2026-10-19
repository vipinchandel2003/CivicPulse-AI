"use client";

import React from "react";
import { CheckSquare, Navigation, User, Shield, RefreshCw, Power } from "lucide-react";
import { useAuth } from "@civicpulse/api-client";

export interface InspectorShellProps {
  children: React.ReactNode;
  activeTab: "tasks" | "map" | "profile";
  onTabChange: (tab: "tasks" | "map" | "profile") => void;
  onDuty: boolean;
  onToggleDuty: () => void;
  pendingSyncCount?: number;
}

export const InspectorShell: React.FC<InspectorShellProps> = ({
  children,
  activeTab,
  onTabChange,
  onDuty,
  onToggleDuty,
  pendingSyncCount = 0
}) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col justify-between text-slate-900 font-sans">
      {/* Responsive Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
              CSI
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 leading-none">
                {user?.fullName || "Ramesh Verma"}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold mt-1">
                Tier 1 Field Staff · Ward 64 (Solid Waste & Drainage)
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => onTabChange("tasks")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "tasks"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              <span>Assigned Tasks Queue</span>
            </button>

            <button
              onClick={() => onTabChange("map")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "map"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Navigation className="h-4 w-4" />
              <span>Route & Incidents Map</span>
            </button>

            <button
              onClick={() => onTabChange("profile")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "profile"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Duty Profile & KPI</span>
            </button>
          </nav>

          {/* Controls: Duty switch & Sync queue */}
          <div className="flex items-center gap-2 sm:gap-3">
            {pendingSyncCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-xl">
                <RefreshCw className="h-3 w-3 animate-spin" /> {pendingSyncCount} in offline queue
              </span>
            )}

            <button
              onClick={onToggleDuty}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 border shadow-xs ${
                onDuty
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-slate-200 text-slate-700 border-slate-300"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${onDuty ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              <span>{onDuty ? "ON DUTY" : "OFF DUTY"}</span>
            </button>

            <button
              onClick={logout}
              className="text-xs font-bold text-slate-400 hover:text-red-600 px-2 py-1 transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* Mobile-Only Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-around shadow-md">
        <button
          onClick={() => onTabChange("tasks")}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "tasks" ? "text-amber-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <CheckSquare className="h-5 w-5" />
          <span className="mt-0.5">Tasks</span>
        </button>

        <button
          onClick={() => onTabChange("map")}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "map" ? "text-amber-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Navigation className="h-5 w-5" />
          <span className="mt-0.5">Route Map</span>
        </button>

        <button
          onClick={() => onTabChange("profile")}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "profile" ? "text-amber-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="mt-0.5">Account / KPI</span>
        </button>
      </nav>
    </div>
  );
};
