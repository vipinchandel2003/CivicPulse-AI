"use client";

import React from "react";
import { CivicIssue, IssueStatus } from "@civicpulse/api-client";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { Clock, MapPin, UserCheck, AlertTriangle } from "lucide-react";

export interface WardKanbanBoardProps {
  issues: CivicIssue[];
  onSelectIssue: (issue: CivicIssue) => void;
  onReassignRequest: (issue: CivicIssue) => void;
}

export const WardKanbanBoard: React.FC<WardKanbanBoardProps> = ({
  issues,
  onSelectIssue,
  onReassignRequest
}) => {
  const columns: { status: IssueStatus; title: string; color: string }[] = [
    { status: "RECEIVED", title: "New / Triaged", color: "border-blue-500" },
    { status: "ASSIGNED", title: "Assigned", color: "border-amber-500" },
    { status: "IN_PROGRESS", title: "In Progress", color: "border-indigo-500" },
    { status: "PENDING_REVIEW", title: "AI Review Queue", color: "border-red-500" },
    { status: "RESOLVED", title: "Verified Closures", color: "border-emerald-500" }
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin">
      {columns.map((col) => {
        const columnIssues = issues.filter((i) => {
          if (col.status === "PENDING_REVIEW") {
            return i.status === "PENDING_REVIEW" || i.status === "PENDING_AUDIT";
          }
          return i.status === col.status;
        });

        return (
          <div
            key={col.status}
            className="flex-1 min-w-[280px] max-w-[320px] bg-slate-100/80 rounded-2xl p-3 border border-slate-200 flex flex-col"
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between pb-3 border-b-2 ${col.color} mb-3`}>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  {col.title}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">
                {columnIssues.length}
              </span>
            </div>

            {/* Ticket Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {columnIssues.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/50">
                  No tickets in this state
                </div>
              ) : (
                columnIssues.map((issue) => {
                  const isCritical = issue.priority === "CRITICAL";

                  return (
                    <Card
                      key={issue.id}
                      variant="interactive"
                      className="p-3 bg-white border-slate-200 shadow-sm space-y-2 hover:border-blue-400"
                      onClick={() => onSelectIssue(issue)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-slate-500">
                          {issue.ticketCode}
                        </span>
                        <Badge variant={isCritical ? "critical" : "high"} size="sm">
                          {issue.priority}
                        </Badge>
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs leading-snug">
                        {issue.title}
                      </h4>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{issue.location.address}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400 font-mono">
                          Upvotes: {issue.upvotesCount}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReassignRequest(issue);
                          }}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Reassign
                        </button>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
