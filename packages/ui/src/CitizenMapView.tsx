"use client";

import React, { useState } from "react";
import { CivicIssue } from "@civicpulse/api-client";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { MapPin, Filter, Layers, Navigation, ThumbsUp, X } from "lucide-react";

export interface CitizenMapViewProps {
  issues: CivicIssue[];
  onSelectIssue: (issue: CivicIssue) => void;
  onUpvoteIssue: (id: string) => void;
}

export const CitizenMapView: React.FC<CitizenMapViewProps> = ({
  issues,
  onSelectIssue,
  onUpvoteIssue
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeIssue, setActiveIssue] = useState<CivicIssue | null>(null);

  const categories = ["ALL", "Drainage / Manhole", "Solid Waste Management", "Roads & Footpaths"];

  const filteredIssues = selectedCategory === "ALL"
    ? issues
    : issues.filter((i) => i.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  return (
    <div className="relative h-[calc(100vh-130px)] w-full overflow-hidden bg-slate-900 flex flex-col">
      {/* Category Filter Pills Bar */}
      <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md backdrop-blur-md transition-all ${
              selectedCategory === cat
                ? "bg-blue-600 text-white shadow-blue-500/30"
                : "bg-white/90 text-slate-700 hover:bg-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Styled Interactive Geospatial Canvas with Real OpenStreetMap Raster Tiles */}
      <div className="relative flex-1 w-full bg-[#182334] overflow-hidden select-none">
        {/* OpenStreetMap Real World Map Tile Layer */}
        <div
          className="absolute inset-0 opacity-80 pointer-events-none filter contrast-[1.08] saturate-[1.1]"
          style={{
            backgroundImage: "url('https://tile.openstreetmap.org/14/11645/6987.png'), url('https://tile.openstreetmap.org/14/11646/6987.png'), url('https://tile.openstreetmap.org/14/11645/6988.png'), url('https://tile.openstreetmap.org/14/11646/6988.png')",
            backgroundSize: "50% 50%, 50% 50%, 50% 50%, 50% 50%",
            backgroundPosition: "0 0, 100% 0, 0 100%, 100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* Subtle Dark/Night map overlay for contrast with pins */}
        <div className="absolute inset-0 bg-slate-900/40 pointer-events-none" />

        {/* OpenStreetMap Legal Attribution */}
        <div className="absolute bottom-1 right-2 z-20 text-[9px] font-sans text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded shadow backdrop-blur-sm">
          Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline text-blue-300">OpenStreetMap</a> contributors
        </div>
        {/* Central Citizen User GPS Marker */}
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center"
          style={{ top: "52%", left: "48%" }}
        >
          <div className="h-6 w-6 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center animate-ping" />
          <div className="absolute top-1 h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-md shadow-blue-500" />
          <span className="text-[10px] font-bold text-white bg-slate-900/80 px-1.5 py-0.5 rounded shadow mt-6">
            You
          </span>
        </div>

        {/* Dynamic Issue Map Markers with Priority Colors */}
        {filteredIssues.map((issue, idx) => {
          // Offsets computed for realistic spatial distribution on the canvas
          const topPos = 35 + ((idx * 27) % 45);
          const leftPos = 25 + ((idx * 33) % 55);
          const isCritical = issue.priority === "CRITICAL";

          return (
            <div
              key={issue.id}
              onClick={() => setActiveIssue(issue)}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer group active:scale-95 transition-transform"
              style={{ top: `${topPos}%`, left: `${leftPos}%` }}
            >
              <div
                className={`h-9 w-9 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white transition-transform group-hover:scale-110 ${
                  isCritical ? "bg-red-600 animate-bounce" : "bg-amber-500"
                }`}
              >
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div className="mt-1 bg-slate-950/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow border border-slate-700 whitespace-nowrap">
                {issue.title.substring(0, 15)}...
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Selected Issue Bottom Card */}
      {activeIssue && (
        <div className="absolute bottom-4 inset-x-3 z-30 animate-in slide-in-from-bottom duration-200">
          <Card className="bg-white p-4 rounded-2xl shadow-2xl border-slate-200 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={activeIssue.priority === "CRITICAL" ? "critical" : "high"}>
                    {activeIssue.priority}
                  </Badge>
                  <span className="font-mono text-xs text-slate-500 font-bold">
                    {activeIssue.ticketCode}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{activeIssue.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{activeIssue.location.address}</p>
              </div>
              <button
                onClick={() => setActiveIssue(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onUpvoteIssue(activeIssue.id)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                  activeIssue.hasUpvoted
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>Me Too ({activeIssue.upvotesCount})</span>
              </button>
              <button
                onClick={() => onSelectIssue(activeIssue)}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                View Audit Details
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
