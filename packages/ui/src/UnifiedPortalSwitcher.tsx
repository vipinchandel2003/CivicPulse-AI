"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Smartphone, CheckSquare, Building2, Sparkles } from "lucide-react";

export const UnifiedPortalSwitcher: React.FC = () => {
  const pathname = usePathname();

  const isCitizen = pathname === "/" || pathname === "/landing";
  const isInspector = pathname.startsWith("/inspector");
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-300">
            Indore Nagar Nigam (IMC) · Unified Municipal Suite (Single Port)
          </span>
        </div>

        {/* Universal Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <Link
            href="/"
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              isCitizen ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Citizen Portal</span>
          </Link>

          <Link
            href="/inspector"
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              isInspector ? "bg-amber-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Field Inspector</span>
          </Link>

          <Link
            href="/admin"
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              isAdmin ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Command Center</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
