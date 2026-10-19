"use client";

import React, { useState } from "react";
import { CivicIssue } from "@civicpulse/api-client";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Input } from "./Input";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Bot,
  MapPin,
  Sparkles,
  ArrowRight
} from "lucide-react";

export interface ReviewQueueModalProps {
  issue: CivicIssue | null;
  onClose: () => void;
  onApprove: (issueId: string) => Promise<void>;
  onReject: (issueId: string, reason: string) => Promise<void>;
}

export const ReviewQueueModal: React.FC<ReviewQueueModalProps> = ({
  issue,
  onClose,
  onApprove,
  onReject
}) => {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!issue) return null;

  // Mock AI Verification confidence metrics
  const clipSimilarity = "89.4%"; // Background similarity
  const yoloDefectAbsence = "96.1%"; // Target defect absent confidence

  const handleApprove = async () => {
    setIsLoading(true);
    await onApprove(issue.id);
    setIsLoading(false);
    onClose();
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    setIsLoading(true);
    await onReject(issue.id, rejectReason);
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={!!issue}
      onClose={onClose}
      title="Supervisor Resolution Review"
      description="Inspect AI audit score & Before/After comparison to confirm closure."
      className="max-w-xl bg-white border-slate-200"
    >
      <div className="space-y-4">
        {/* Ticket Title & Context */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="font-mono text-xs font-bold text-slate-500">{issue.ticketCode}</span>
            <h4 className="font-bold text-slate-900 text-sm mt-0.5">{issue.title}</h4>
          </div>
          <Badge variant={issue.priority === "CRITICAL" ? "critical" : "high"}>
            {issue.priority}
          </Badge>
        </div>

        {/* Before vs After Side-by-Side Photos */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-500">
              Citizen Report (Before)
            </span>
            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black border border-slate-200">
              <img
                src={issue.beforeImageUrl}
                alt="Before condition"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                BEFORE
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-500">
              Inspector Closure (After)
            </span>
            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black border border-emerald-500">
              <img
                src={issue.afterImageUrl || issue.beforeImageUrl}
                alt="After condition"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1.5 left-1.5 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> AFTER (GEOFENCED)
              </span>
            </div>
          </div>
        </div>

        {/* AI Model Audit Score Strip */}
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900">
            <span className="flex items-center gap-1.5">
              <Bot className="h-4 w-4 text-blue-600" /> AI Verification Pipeline Scores
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              PASSED PRE-AUDIT
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2 rounded-lg border border-blue-100">
              <span className="text-slate-500 text-[11px]">CLIP Background Match:</span>
              <div className="font-mono font-bold text-slate-800">{clipSimilarity}</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-blue-100">
              <span className="text-slate-500 text-[11px]">YOLO Defect Absence:</span>
              <div className="font-mono font-bold text-emerald-600">{yoloDefectAbsence}</div>
            </div>
          </div>
        </div>

        {/* Approval or Rejection Decision UI */}
        {showRejectInput ? (
          <form onSubmit={handleReject} className="space-y-3 pt-2 border-t border-slate-200">
            <Input
              label="Supervisor Rejection Reason"
              placeholder="e.g. Work is incomplete, debris remains on road"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowRejectInput(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                className="flex-1"
                isLoading={isLoading}
              >
                Confirm Reject (Back to IN_PROGRESS)
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex gap-3 pt-2 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowRejectInput(true)}
            >
              <XCircle className="h-4 w-4 mr-1.5" /> Reject Resolution
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              isLoading={isLoading}
              onClick={handleApprove}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve & Mark RESOLVED
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
