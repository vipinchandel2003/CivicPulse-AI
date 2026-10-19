"use client";

import React, { useState } from "react";
import {
  H3HexCell,
  ChronicBlackspot,
  MOCK_H3_CELLS,
  MOCK_CHRONIC_BLACKSPOTS
} from "@civicpulse/api-client";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { Button } from "./Button";
import {
  Layers,
  MapPin,
  AlertTriangle,
  Flame,
  CheckCircle2,
  X,
  Filter,
  Eye,
  SlidersHorizontal
} from "lucide-react";

export interface GeospatialHeatmapViewerProps {
  onSelectBlackspot?: (blackspot: ChronicBlackspot) => void;
}

export const GeospatialHeatmapViewer: React.FC<GeospatialHeatmapViewerProps> = ({
  onSelectBlackspot
}) => {
  const [activeLayer, setActiveLayer] = useState<"H3_HEX" | "BLACKSPOTS" | "ALL">("ALL");
  const [selectedZone, setSelectedZone] = useState<string>("ALL");
  const [selectedCell, setSelectedCell] = useState<H3HexCell | null>(null);
  const [activeBlackspot, setActiveBlackspot] = useState<ChronicBlackspot | null>(null);

  const filteredCells = selectedZone === "ALL"
    ? MOCK_H3_CELLS
    : MOCK_H3_CELLS.filter((c) => c.zoneName.includes(selectedZone));

  const handleCellClick = (cell: H3HexCell) => {
    setSelectedCell(cell);
  };

  const handleBlackspotClick = (bs: ChronicBlackspot) => {
    setActiveBlackspot(bs);
    onSelectBlackspot?.(bs);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-170px)] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm relative">
      {/* Top Filter and Layer Control Strip */}
      <div className="bg-slate-50 border-b border-slate-200 p-3 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Layers className="h-4 w-4 text-blue-600" />
            <span>Deck.gl H3 Layer</span>
          </div>

          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl">
            <button
              onClick={() => setActiveLayer("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                activeLayer === "ALL" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Composite (All)
            </button>
            <button
              onClick={() => setActiveLayer("H3_HEX")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                activeLayer === "H3_HEX" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              H3 Heatmap
            </button>
            <button
              onClick={() => setActiveLayer("BLACKSPOTS")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                activeLayer === "BLACKSPOTS" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Chronic Blackspots
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Zone Filter:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
          >
            <option value="ALL">Citywide (All Zones)</option>
            <option value="Central">Central Zone</option>
            <option value="West">West Zone</option>
          </select>
        </div>
      </div>

      {/* Main Map Viewport with OpenStreetMap Layer */}
      <div className="flex-1 relative bg-slate-100 overflow-hidden select-none">
        {/* OpenStreetMap Real World Tiles Layer */}
        <div
          className="absolute inset-0 opacity-70 pointer-events-none filter contrast-[1.05]"
          style={{
            backgroundImage: "url('https://tile.openstreetmap.org/13/5822/3493.png'), url('https://tile.openstreetmap.org/13/5823/3493.png'), url('https://tile.openstreetmap.org/13/5822/3494.png'), url('https://tile.openstreetmap.org/13/5823/3494.png')",
            backgroundSize: "50% 50%, 50% 50%, 50% 50%, 50% 50%",
            backgroundPosition: "0 0, 100% 0, 0 100%, 100% 100%",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* City Coordinates & OSM Attribution Watermark */}
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm text-[11px] font-mono text-slate-700 flex items-center gap-2">
          <span className="font-bold text-blue-700">OpenStreetMap</span> · Indore Nagar Nigam PostGIS Grid (EPSG:4326)
        </div>

        <div className="absolute bottom-2 right-2 z-20 text-[10px] font-sans text-slate-600 bg-white/90 border border-slate-200 px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">
          &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline text-blue-600">OpenStreetMap</a> contributors
        </div>


        {/* H3 Hexagonal Density Cells (Deck.gl Emulation) */}
        {(activeLayer === "ALL" || activeLayer === "H3_HEX") &&
          filteredCells.map((cell, idx) => {
            const topPos = 25 + ((idx * 22) % 55);
            const leftPos = 20 + ((idx * 28) % 65);
            const isRed = cell.riskLevel === "CRITICAL_RED";
            const isAmber = cell.riskLevel === "HIGH_AMBER";

            return (
              <div
                key={cell.h3Index}
                onClick={() => handleCellClick(cell)}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ top: `${topPos}%`, left: `${leftPos}%` }}
              >
                {/* Hexagon shape rendering via SVG */}
                <div className="relative flex items-center justify-center transition-transform group-hover:scale-125">
                  <svg width="74" height="84" viewBox="0 0 74 84" className="drop-shadow-md">
                    <polygon
                      points="37 0, 74 21, 74 63, 37 84, 0 63, 0 21"
                      className={`transition-colors ${
                        isRed
                          ? "fill-red-500/70 stroke-red-600 stroke-2 hover:fill-red-500/90"
                          : isAmber
                          ? "fill-amber-500/70 stroke-amber-600 stroke-2 hover:fill-amber-500/90"
                          : "fill-emerald-500/70 stroke-emerald-600 stroke-2 hover:fill-emerald-500/90"
                      }`}
                    />
                  </svg>
                  <div className="absolute text-center text-white font-black text-xs pointer-events-none drop-shadow">
                    {cell.incidentCount}
                    <div className="text-[9px] font-mono uppercase font-bold opacity-90">Incidents</div>
                  </div>
                </div>
              </div>
            );
          })}

        {/* Chronic Blackspots Pulsing Markers */}
        {(activeLayer === "ALL" || activeLayer === "BLACKSPOTS") &&
          MOCK_CHRONIC_BLACKSPOTS.map((bs, idx) => {
            const topPos = 35 + ((idx * 25) % 45);
            const leftPos = 35 + ((idx * 30) % 50);

            return (
              <div
                key={bs.id}
                onClick={() => handleBlackspotClick(bs)}
                className="absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ top: `${topPos}%`, left: `${leftPos}%` }}
              >
                <div className="relative flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-red-600/30 border-2 border-red-600 animate-ping absolute" />
                  <div className="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
                    <Flame className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-1 bg-white border border-slate-300 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
                  {bs.landmark.substring(0, 18)}...
                </div>
              </div>
            );
          })}

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-md text-xs space-y-1.5">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
            H3 Spatial Risk Index
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-red-500 border border-red-600" />
            <span className="text-[11px] text-slate-600 font-medium">Critical Cluster (&gt;30 tickets)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-amber-500 border border-amber-600" />
            <span className="text-[11px] text-slate-600 font-medium">Moderate Cluster (15–30 tickets)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-emerald-500 border border-emerald-600" />
            <span className="text-[11px] text-slate-600 font-medium">Low Incident Density (&lt;15)</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
            <span className="h-3 w-3 rounded-full bg-red-600 border border-white" />
            <span className="text-[11px] text-slate-900 font-bold">Chronic Blackspot (&gt;10 repeats)</span>
          </div>
        </div>

        {/* Selected H3 Hexagon Detail Floating Card */}
        {selectedCell && (
          <div className="absolute top-4 right-4 z-30 w-72 animate-in slide-in-from-right duration-200">
            <Card className="bg-white p-4 shadow-xl border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 font-bold">
                    H3: {selectedCell.h3Index}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                    Ward {selectedCell.wardNumber} ({selectedCell.zoneName})
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Incident Volume:</span>
                  <span className="font-bold text-slate-900">{selectedCell.incidentCount} tickets</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Critical Ratio:</span>
                  <span className="font-bold text-red-600">{Math.round(selectedCell.criticalRatio * 100)}%</span>
                </div>
              </div>

              <Badge variant={selectedCell.riskLevel === "CRITICAL_RED" ? "critical" : "high"}>
                {selectedCell.riskLevel.replace("_", " ")}
              </Badge>
            </Card>
          </div>
        )}

        {/* Selected Chronic Blackspot Detail Drawer */}
        {activeBlackspot && (
          <div className="absolute bottom-4 right-4 z-30 w-80 animate-in slide-in-from-bottom duration-200">
            <Card className="bg-white p-4 shadow-2xl border-red-300 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                    <Flame className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{activeBlackspot.landmark}</h4>
                    <span className="text-[10px] text-slate-500">
                      Ward {activeBlackspot.wardNumber} · Zone {activeBlackspot.zoneNumber}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveBlackspot(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-red-900">
                  <span>90-Day Repeat Incidents:</span>
                  <span className="font-mono">{activeBlackspot.totalRepeatsPast90Days}</span>
                </div>
                <div className="flex justify-between text-red-700 text-[11px]">
                  <span>SLA Breach Rate:</span>
                  <span className="font-mono font-bold">{activeBlackspot.slaBreachRate}%</span>
                </div>
              </div>

              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Suggested Engineering Action:
                </span>
                <p className="text-slate-600 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {activeBlackspot.suggestedAction}
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
