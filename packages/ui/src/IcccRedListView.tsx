"use client";

import React from "react";
import { IcccRedListItem, MOCK_ICCC_RED_LIST } from "@civicpulse/api-client";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { ShieldAlert, Flame, Clock, FileWarning, ArrowRight } from "lucide-react";

export interface IcccRedListViewProps {
  onInitiateShowCause?: (item: IcccRedListItem) => void;
}

export const IcccRedListView: React.FC<IcccRedListViewProps> = ({
  onInitiateShowCause
}) => {
  return (
    <div className="space-y-4">
      {/* Alert Header Banner */}
      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
        <div className="p-2 bg-red-100 text-red-700 rounded-xl mt-0.5">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-red-950">
            ICCC Red List & Automatic SLA Escalation Stream
          </h3>
          <p className="text-xs text-red-800 mt-0.5">
            Tickets that breached standard thresholds climb the municipal chain (L1 Ward CSI → L2 Zonal AE → L3 Commissioner). Repeat non-compliance triggers Show-Cause draft recommendations.
          </p>
        </div>
      </div>

      {/* Red List Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_ICCC_RED_LIST.map((item) => (
          <Card
            key={item.id}
            className="p-4 bg-white border-red-200 shadow-sm space-y-3 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-600" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500">
                  {item.ticketCode}
                </span>
                <span className="text-[10px] font-bold uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200">
                  {item.escalationLevel.replace("_", " ")}
                </span>
              </div>
              <Badge variant="critical">CRITICAL OVERDUE</Badge>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-sm leading-snug">{item.title}</h4>
              <p className="text-xs text-slate-500 mt-1">
                Ward {item.wardNumber} · Assigned: <span className="font-bold text-slate-700">{item.assignedInspector}</span>
              </p>
            </div>

            <div className="bg-red-50/60 p-2.5 rounded-xl border border-red-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-red-800 font-bold">
                <Clock className="h-4 w-4 text-red-600" />
                <span>Overdue by {item.overdueHours} hours</span>
              </div>
              <span className="text-[11px] text-red-700 font-mono font-bold">
                Penalty: -5 KPI Events
              </span>
            </div>

            {item.showCauseEligible && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                  <FileWarning className="h-3.5 w-3.5 text-amber-600" /> Show-Cause Eligible
                </span>
                <Button
                  size="sm"
                  variant="danger"
                  className="text-xs py-1.5 px-3"
                  onClick={() => onInitiateShowCause?.(item)}
                >
                  Review Show-Cause Draft <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
