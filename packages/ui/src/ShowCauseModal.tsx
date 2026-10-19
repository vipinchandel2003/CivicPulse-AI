"use client";

import React, { useState } from "react";
import { IcccRedListItem } from "@civicpulse/api-client";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { FileWarning, CheckCircle2, AlertOctagon, Send } from "lucide-react";

export interface ShowCauseModalProps {
  item: IcccRedListItem | null;
  onClose: () => void;
  onIssueNotice: (ticketCode: string, officerRemarks: string) => Promise<void>;
}

export const ShowCauseModal: React.FC<ShowCauseModalProps> = ({
  item,
  onClose,
  onIssueNotice
}) => {
  const [remarks, setRemarks] = useState(
    "Failure to resolve critical safety hazard within designated SLA. Formal explanation demanded within 48 hours pursuant to Indore Municipal Conduct Rules."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onIssueNotice(item.ticketCode, remarks);
    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
      setIsSuccess(false);
    }, 1500);
  };

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      title="Draft Show-Cause Notice (Human-in-the-Loop)"
      description="Per PRD §7, Show-Cause recommendations are never auto-sent. Department Head approval is required."
      className="max-w-lg bg-white border-slate-200"
    >
      {isSuccess ? (
        <div className="p-6 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h4 className="text-base font-bold text-slate-900">
            Show-Cause Notice Issued & Logged!
          </h4>
          <p className="text-xs text-slate-500">
            Recorded in immutable audit log and dispatched to {item.assignedInspector}.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs space-y-1">
            <div className="flex justify-between font-mono font-bold text-red-900">
              <span>{item.ticketCode}</span>
              <span>Overdue: {item.overdueHours}h</span>
            </div>
            <p className="font-bold text-slate-900">{item.title}</p>
            <p className="text-slate-600">Respondent Officer: {item.assignedInspector} (Ward {item.wardNumber})</p>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Notice Charge & Remarks
            </label>
            <textarea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full text-xs font-medium rounded-lg border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 bg-white"
              required
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              className="flex-1"
              isLoading={isSubmitting}
            >
              <Send className="h-4 w-4 mr-1.5" /> Approve & Issue Notice
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
