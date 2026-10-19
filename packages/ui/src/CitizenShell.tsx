"use client";

import React, { useState } from "react";
import {
  Home,
  MapPin,
  PlusCircle,
  FileText,
  User,
  Globe,
  Camera,
  ShieldCheck,
  Building2,
  Bell
} from "lucide-react";
import { useAuth } from "@civicpulse/api-client";
import { Button } from "./Button";

export interface CitizenShellProps {
  children: React.ReactNode;
  activeTab: "home" | "map" | "report" | "my-reports" | "profile";
  onTabChange: (tab: "home" | "map" | "report" | "my-reports" | "profile") => void;
  onRequestCapture: () => void;
}

export const CitizenShell: React.FC<CitizenShellProps> = ({
  children,
  activeTab,
  onTabChange,
  onRequestCapture
}) => {
  const { user, logout } = useAuth();
  const [lang, setLang] = useState<"HI" | "EN">("HI");

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col justify-between text-slate-900 font-sans">
      {/* Top Header - Fully responsive for Desktop & Mobile */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & City Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-sm">
              CP
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 leading-none flex items-center gap-1.5">
                CivicPulse <span className="text-blue-600 font-extrabold">Citizen</span>
              </div>
              <div className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ward 64 (Rajwada Central) · Indore Nagar Nigam</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => onTabChange("home")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "home"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Home className="h-4 w-4" />
              <span>{lang === "HI" ? "होम फ़ीड" : "Home Feed"}</span>
            </button>

            <button
              onClick={() => onTabChange("map")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "map"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span>{lang === "HI" ? "वार्ड नक्शा" : "Ward Map"}</span>
            </button>

            <button
              onClick={() => onTabChange("my-reports")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "my-reports"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>{lang === "HI" ? "मेरी शिकायतें" : "My Reports"}</span>
            </button>

            <button
              onClick={() => onTabChange("profile")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "profile"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="h-4 w-4" />
              <span>{lang === "HI" ? "प्रोफ़ाइल" : "Profile"}</span>
            </button>
          </nav>

          {/* Desktop Report Trigger & Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={onRequestCapture}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all"
            >
              <Camera className="h-4 w-4" />
              <span>Report Issue</span>
            </button>

            <button
              onClick={() => setLang(lang === "HI" ? "EN" : "HI")}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Globe className="h-3.5 w-3.5 text-blue-600" />
              <span>{lang === "HI" ? "हिन्दी" : "English"}</span>
            </button>

            {user && (
              <button
                onClick={logout}
                title="Logout"
                className="text-xs font-bold text-slate-500 hover:text-red-600 px-2 py-1 transition-colors"
              >
                Exit
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Viewport: Responsive Container for Desktop & Mobile */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* Mobile-Only Bottom Navigation (Hidden on Tablet & Desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => onTabChange("home")}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
            activeTab === "home" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="mt-0.5">{lang === "HI" ? "होम" : "Home"}</span>
        </button>

        <button
          onClick={() => onTabChange("map")}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
            activeTab === "map" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <MapPin className="h-5 w-5" />
          <span className="mt-0.5">{lang === "HI" ? "नक्शा" : "Map"}</span>
        </button>

        {/* Central Floating Snap Button */}
        <button
          onClick={onRequestCapture}
          className="-mt-5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-3.5 rounded-full shadow-lg shadow-blue-500/30 active:scale-95 transition-transform border-4 border-white"
        >
          <PlusCircle className="h-6 w-6" />
        </button>

        <button
          onClick={() => onTabChange("my-reports")}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
            activeTab === "my-reports" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <FileText className="h-5 w-5" />
          <span className="mt-0.5">{lang === "HI" ? "शिकायतें" : "My Reports"}</span>
        </button>

        <button
          onClick={() => onTabChange("profile")}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
            activeTab === "profile" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="mt-0.5">{lang === "HI" ? "प्रोफ़ाइल" : "Profile"}</span>
        </button>
      </nav>
    </div>
  );
};
