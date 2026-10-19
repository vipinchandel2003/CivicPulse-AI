"use client";

import React, { useState } from "react";
import { CivicIssue } from "@civicpulse/api-client";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { UserCheck, Users, Briefcase } from "lucide-react";

export interface ReassignModalProps {
  issue: CivicIssue | null;
  onClose: () => void;
  onConfirmReassign: (issueId: string, inspectorName: string) => Promise<void>;
}

export const ReassignModal: React.FC<ReassignModalProps> = ({
  issue,
  onClose,
  onConfirmReassign
}) => {
  const [selectedInspector, setSelectedInspector] = useState("Ramesh Verma (CSI Staff)");
  const [isLoading, setIsLoading] = useState(false);

  if (!issue) return null;

  // On-duty inspectors list with active workload (least-loaded dispatch rule)
  const availableInspectors = [
    { name: "Ramesh Verma (CSI Staff)", activeTickets: 3, onDuty: true, loadStatus: "Optimal" },
    { name: "Suresh Patidar (Field Staff)", activeTickets: 7, onDuty: true, loadStatus: "Heavy" },
    { name: "Anil Sharma (Drainage Specialist)", activeTickets: 1, onDuty: true, loadStatus: "Least-Loaded" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onConfirmReassign(issue.id, selectedInspector);
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={!!issue}
      onClose={onClose}
      title="Reassign & Rebalance Ticket"
      description="Direct ticket to least-loaded on-duty field staff in Ward 64."
      className="max-w-md bg-white border-slate-200"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1">
          <span className="font-mono font-bold text-slate-500">{issue.ticketCode}</span>
          <p className="font-bold text-slate-900">{issue.title}</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Select On-Duty Inspector
          </label>
          <div className="space-y-2">
            {availableInspectors.map((insp) => (
              <label
                key={insp.name}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedInspector === insp.name
                    ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="inspector"
                    value={insp.name}
                    checked={selectedInspector === insp.name}
                    onChange={(e) => setSelectedInspector(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{insp.name}</div>
                    <div className="text-[11px] text-slate-500">
                      Active: {insp.activeTickets} tickets
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    insp.loadStatus === "Least-Loaded"
                      ? "bg-emerald-100 text-emerald-800"
                      : insp.loadStatus === "Optimal"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {insp.loadStatus}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-200">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
            Confirm Reassign
          </Button>
        </div>
      </form>
    </Modal>
  );
};
