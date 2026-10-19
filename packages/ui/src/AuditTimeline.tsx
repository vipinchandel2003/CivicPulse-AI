"use client";

import React from "react";
import { IssueEventItem } from "@civicpulse/api-client";
import { CheckCircle2, Clock, ShieldCheck, UserCheck, Bot } from "lucide-react";

export interface AuditTimelineProps {
  events: IssueEventItem[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ events }) => {
  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((ev, index) => {
        const isLast = index === events.length - 1;
        const isAi = ev.actorRole === "AI_SERVICE" || ev.actorRole === "AI_AUDIT";

        return (
          <div key={ev.id} className="relative group">
            {/* Timeline Node Icon */}
            <div
              className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-sm ${
                isLast
                  ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                  : isAi
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-white"
              }`}
            >
              {isAi ? <Bot className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{ev.toStatus}</span>
                <span className="text-[10px] text-slate-400 font-mono">{ev.timestamp}</span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                <UserCheck className="h-3 w-3 text-slate-400" />
                <span>{ev.actorName} ({ev.actorRole})</span>
              </div>

              {ev.note && (
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
                  {ev.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
